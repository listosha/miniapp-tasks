import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'node:crypto'

// ─── CORS ────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://app.listoshenkov.ru',
  'https://dev.listoshenkov.ru',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

function err(msg: string, status = 400, origin: string | null = null) {
  return json({ error: msg }, status, origin)
}

// ─── SUPABASE ────────────────────────────────────────────────
function makeClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

// ─── AUTH: проверка sessionToken (HMAC, формат userId:timestamp:sig) ─────────
function getUserFromToken(token: string): number | null {
  if (!token) return null
  const parts = token.split(':')
  if (parts.length !== 3) return null
  const [userIdStr, timestampStr, sig] = parts
  const userId = parseInt(userIdStr)
  const timestamp = parseInt(timestampStr)
  if (isNaN(userId) || isNaN(timestamp)) return null
  if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) return null
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const expected = createHmac('sha256', secret).update(`${userIdStr}:${timestampStr}`).digest('hex')
  if (sig !== expected) return null
  return userId
}

// ─── ACCESS: проверка подписки ───────────────────────────────
async function getAccess(supabase: ReturnType<typeof makeClient>, userId: number) {
  const { data } = await supabase
    .from('user_access')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return { hasAccess: false, hasInnerCircle: false, daysLeft: 0, expiresAt: null }

  const now = new Date()
  const expires = data.inner_circle_expires ? new Date(data.inner_circle_expires) : null
  const hasInnerCircle = data.has_inner_circle && !!expires && expires > now
  const hasConsultation = data.has_consultation && data.consultation_used < data.consultation_count
  const hasAccess = hasInnerCircle || hasConsultation
  const daysLeft = expires && expires > now
    ? Math.ceil((expires.getTime() - now.getTime()) / 86400000)
    : 0

  return { hasAccess, hasInnerCircle, hasConsultation, daysLeft, expiresAt: data.inner_circle_expires, isSenior: data.is_senior }
}

// ─── MAIN ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') return err('Method not allowed', 405, origin)

  let body: { action: string; token: string; [key: string]: unknown }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400, origin)
  }

  const { action, token } = body
  if (!action) return err('action required', 400, origin)
  if (!token) return err('token required', 401, origin)

  const userId = getUserFromToken(token)
  if (!userId) return err('Unauthorized', 401, origin)

  const supabase = makeClient()

  // Actions доступные только по sessionToken (без проверки подписки)
  const sessionOnlyActions = [
    'check_access', 'get_analyses', 'get_markers_catalog', 'search_markers',
    'get_health_profile', 'get_journal', 'get_protocols', 'get_recommendations',
    'get_dependants',
  ]

  // Actions требующие activeAccess
  const accessRequired = !sessionOnlyActions.includes(action)
  let accessData = await getAccess(supabase, userId)

  if (accessRequired && !accessData.hasAccess) {
    return err('Subscription required', 403, origin)
  }

  // ─── SWITCH ───────────────────────────────────────────────
  switch (action) {

    // ── ДОСТУП ──────────────────────────────────────────────
    case 'check_access': {
      return json({ ...accessData }, 200, origin)
    }

    // ── БИБЛИОТЕКА ──────────────────────────────────────────
    case 'get_library': {
      const { type, tag } = body as { type?: string; tag?: string }

      let query = supabase
        .from('private_content')
        .select(`
          id, title, description, type, topic, tags,
          thumbnail_url, duration_seconds, sort_order, created_at,
          library_item_tags(tag_slug)
        `)
        .eq('is_published', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('sort_order', { ascending: true })

      if (type) query = query.eq('type', type)

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)

      // Фильтр по тегу на уровне приложения (если передан)
      const items = tag
        ? data?.filter(item =>
            item.library_item_tags?.some((t: { tag_slug: string }) => t.tag_slug === tag)
          )
        : data

      return json({ items }, 200, origin)
    }

    case 'get_content': {
      const { content_id } = body as { content_id: string }
      if (!content_id) return err('content_id required', 400, origin)

      const { data, error } = await supabase
        .from('private_content')
        .select('*, library_item_tags(tag_slug)')
        .eq('id', content_id)
        .eq('is_published', true)
        .single()

      if (error || !data) return err('Not found', 404, origin)

      // Если контент в storage — генерируем signed URL (60 мин)
      let signedUrl: string | null = null
      if (data.content_url?.startsWith('private-content/')) {
        const { data: urlData } = await supabase.storage
          .from('private-content')
          .createSignedUrl(data.content_url.replace('private-content/', ''), 3600)
        signedUrl = urlData?.signedUrl ?? null
      } else {
        signedUrl = data.content_url
      }

      return json({ ...data, signed_url: signedUrl }, 200, origin)
    }

    // ── КОММЕНТАРИИ ─────────────────────────────────────────
    case 'get_comments': {
      const { content_id } = body as { content_id: string }
      if (!content_id) return err('content_id required', 400, origin)

      const { data, error } = await supabase
        .from('private_comments')
        .select('id, user_id, text, is_from_admin, parent_id, created_at, users(first_name)')
        .eq('content_id', content_id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true })

      if (error) return err(error.message, 500, origin)
      return json({ comments: data }, 200, origin)
    }

    case 'add_comment': {
      const { content_id, text, parent_id } = body as {
        content_id: string; text: string; parent_id?: string
      }
      if (!content_id || !text?.trim()) return err('content_id and text required', 400, origin)
      if (text.length > 2000) return err('Text too long', 400, origin)

      const { data, error } = await supabase
        .from('private_comments')
        .insert({
          user_id: userId,
          content_id,
          thread_type: 'material',
          text: text.trim(),
          parent_id: parent_id ?? null,
          is_from_admin: false,
        })
        .select('id, created_at')
        .single()

      if (error) return err(error.message, 500, origin)
      return json({ comment: data }, 200, origin)
    }

    // ── ПЕРЕПИСКА ───────────────────────────────────────────
    case 'get_my_threads': {
      const { data, error } = await supabase
        .from('private_comments')
        .select('id, text, voice_url, is_from_admin, is_read_by_user, created_at, analysis_id, dependant_id')
        .eq('user_id', userId)
        .is('content_id', null)
        .order('created_at', { ascending: true })

      if (error) return err(error.message, 500, origin)

      // Помечаем входящие (от Алексея) как прочитанные
      const unreadIds = data
        ?.filter(m => m.is_from_admin && !m.is_read_by_user)
        .map(m => m.id)

      if (unreadIds?.length) {
        await supabase
          .from('private_comments')
          .update({ is_read_by_user: true })
          .in('id', unreadIds)
      }

      return json({ messages: data }, 200, origin)
    }

    case 'add_thread_message': {
      const { text, voice_url, analysis_id, dependant_id, thread_type } = body as {
        text?: string; voice_url?: string; analysis_id?: string
        dependant_id?: string; thread_type?: string
      }
      if (!text?.trim() && !voice_url) return err('text or voice_url required', 400, origin)
      if (text && text.length > 2000) return err('Text too long', 400, origin)

      const { data, error } = await supabase
        .from('private_comments')
        .insert({
          user_id: userId,
          content_id: null,
          thread_type: thread_type ?? 'general',
          text: text?.trim() ?? null,
          voice_url: voice_url ?? null,
          analysis_id: analysis_id ?? null,
          dependant_id: dependant_id ?? null,
          is_from_admin: false,
          is_read_by_admin: false,
        })
        .select('id, created_at')
        .single()

      if (error) return err(error.message, 500, origin)
      return json({ message: data }, 200, origin)
    }

    // ── АНАЛИЗЫ ─────────────────────────────────────────────
    case 'get_analyses': {
      const { dependant_id } = body as { dependant_id?: string }

      let query = supabase
        .from('user_analyses')
        .select('id, analysis_type, lab_name, analysis_date, status, created_at, dependant_id')
        .eq('user_id', userId)
        .order('analysis_date', { ascending: false })

      if (dependant_id) {
        query = query.eq('dependant_id', dependant_id)
      } else {
        query = query.is('dependant_id', null)
      }

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ analyses: data }, 200, origin)
    }

    case 'upload_analysis': {
      const { analysis_type, lab_name, analysis_date, file_url, notes, dependant_id } = body as {
        analysis_type: string; lab_name?: string; analysis_date?: string
        file_url?: string; notes?: string; dependant_id?: string
      }
      if (!analysis_type) return err('analysis_type required', 400, origin)

      const { data, error } = await supabase
        .from('user_analyses')
        .insert({
          user_id: userId,
          analysis_type,
          lab_name: lab_name ?? null,
          analysis_date: analysis_date ?? null,
          file_url: file_url ?? null,
          notes: notes ?? null,
          dependant_id: dependant_id ?? null,
          parsed_data: [],
          status: 'uploaded',
        })
        .select('id, created_at')
        .single()

      if (error) return err(error.message, 500, origin)
      return json({ analysis: data }, 200, origin)
    }

    case 'save_markers': {
      const { analysis_id, markers } = body as {
        analysis_id: string
        markers: Array<{ marker_id?: number; custom_name?: string; value: number; unit: string; is_custom?: boolean }>
      }
      if (!analysis_id || !Array.isArray(markers)) return err('analysis_id and markers required', 400, origin)

      // Проверяем что анализ принадлежит пользователю
      const { data: analysis } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('id', analysis_id)
        .eq('user_id', userId)
        .single()

      if (!analysis) return err('Analysis not found', 404, origin)

      const { error } = await supabase
        .from('user_analyses')
        .update({ parsed_data: markers })
        .eq('id', analysis_id)

      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'get_markers_catalog': {
      const { category } = body as { category?: string }

      let query = supabase
        .from('analysis_markers')
        .select('id, name, aliases, units, category, ref_ranges')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (category) query = query.eq('category', category)

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ markers: data }, 200, origin)
    }

    case 'search_markers': {
      const { q } = body as { q: string }
      if (!q || q.length < 2) return err('q must be at least 2 chars', 400, origin)

      const term = q.toLowerCase()

      const { data, error } = await supabase
        .from('analysis_markers')
        .select('id, name, aliases, units, ref_ranges, category')
        .eq('is_active', true)

      if (error) return err(error.message, 500, origin)

      // Нечёткий поиск по name + aliases
      const results = data?.filter(m => {
        if (m.name.toLowerCase().includes(term)) return true
        if (m.aliases?.some((a: string) => a.toLowerCase().includes(term))) return true
        return false
      }).slice(0, 10)

      return json({ markers: results }, 200, origin)
    }

    // ── МЕД. КАРТА ──────────────────────────────────────────
    case 'get_health_profile': {
      const { dependant_id } = body as { dependant_id?: string }

      let query = supabase
        .from('user_health_profile')
        .select('*')
        .eq('user_id', userId)

      if (dependant_id) {
        query = query.eq('dependant_id', dependant_id)
      } else {
        query = query.is('dependant_id', null)
      }

      const { data } = await query.single()
      return json({ profile: data ?? null }, 200, origin)
    }

    case 'save_health_profile': {
      const { dependant_id, diagnoses, medications, supplements, allergies,
              intolerances, age, weight, height, special_notes } = body as {
        dependant_id?: string; diagnoses?: string[]; medications?: unknown[]
        supplements?: unknown[]; allergies?: string[]; intolerances?: string[]
        age?: number; weight?: number; height?: number; special_notes?: string
      }

      const payload = {
        user_id: userId,
        dependant_id: dependant_id ?? null,
        diagnoses: diagnoses ?? [],
        medications: medications ?? [],
        supplements: supplements ?? [],
        allergies: allergies ?? [],
        intolerances: intolerances ?? [],
        age: age ?? null,
        weight: weight ?? null,
        height: height ?? null,
        special_notes: special_notes ?? null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_health_profile')
        .upsert(payload, { onConflict: 'user_id,dependant_id' })

      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    // ── ДНЕВНИК ─────────────────────────────────────────────
    case 'get_journal': {
      const { dependant_id, limit = 20, offset = 0 } = body as {
        dependant_id?: string; limit?: number; offset?: number
      }

      let query = supabase
        .from('health_journal')
        .select('id, text, voice_url, created_at, dependant_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (dependant_id) {
        query = query.eq('dependant_id', dependant_id)
      } else {
        query = query.is('dependant_id', null)
      }

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ entries: data }, 200, origin)
    }

    case 'add_journal_entry': {
      const { text, voice_url, dependant_id } = body as {
        text?: string; voice_url?: string; dependant_id?: string
      }
      if (!text?.trim() && !voice_url) return err('text or voice_url required', 400, origin)

      const { data, error } = await supabase
        .from('health_journal')
        .insert({
          user_id: userId,
          text: text?.trim() ?? null,
          voice_url: voice_url ?? null,
          dependant_id: dependant_id ?? null,
        })
        .select('id, created_at')
        .single()

      if (error) return err(error.message, 500, origin)
      return json({ entry: data }, 200, origin)
    }

    // ── ПРОТОКОЛЫ и РЕКОМЕНДАЦИИ ────────────────────────────
    case 'get_protocols': {
      const { dependant_id } = body as { dependant_id?: string }

      let query = supabase
        .from('user_protocols')
        .select('*, analysis_markers(name)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      query = dependant_id
        ? query.eq('dependant_id', dependant_id)
        : query.is('dependant_id', null)

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ protocols: data }, 200, origin)
    }

    case 'get_recommendations': {
      const { dependant_id } = body as { dependant_id?: string }

      let query = supabase
        .from('user_recommendations')
        .select('id, text, is_completed, created_at, dependant_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      query = dependant_id
        ? query.eq('dependant_id', dependant_id)
        : query.is('dependant_id', null)

      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ recommendations: data }, 200, origin)
    }

    case 'toggle_recommendation': {
      const { recommendation_id, is_completed } = body as {
        recommendation_id: string; is_completed: boolean
      }
      if (!recommendation_id) return err('recommendation_id required', 400, origin)

      const { error } = await supabase
        .from('user_recommendations')
        .update({ is_completed })
        .eq('id', recommendation_id)
        .eq('user_id', userId)

      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    // ── БЛИЗКИЕ ─────────────────────────────────────────────
    case 'get_dependants': {
      const { data, error } = await supabase
        .from('user_dependants')
        .select('id, name, relation, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) return err(error.message, 500, origin)
      return json({ dependants: data }, 200, origin)
    }

    case 'add_dependant': {
      const { name, relation } = body as { name: string; relation?: string }
      if (!name?.trim()) return err('name required', 400, origin)

      const { data, error } = await supabase
        .from('user_dependants')
        .insert({ user_id: userId, name: name.trim(), relation: relation ?? null })
        .select('id, name, relation, created_at')
        .single()

      if (error) return err(error.message, 500, origin)
      return json({ dependant: data }, 200, origin)
    }

    case 'edit_dependant': {
      const { dependant_id, name, relation } = body as {
        dependant_id: string; name?: string; relation?: string
      }
      if (!dependant_id) return err('dependant_id required', 400, origin)

      const updates: Record<string, unknown> = {}
      if (name !== undefined) updates.name = name.trim()
      if (relation !== undefined) updates.relation = relation

      const { error } = await supabase
        .from('user_dependants')
        .update(updates)
        .eq('id', dependant_id)
        .eq('user_id', userId)

      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    // ── РАЗБОРЫ (ZOOM) ──────────────────────────────────────
    case 'get_zoom_events': {
      const { data, error } = await supabase
        .from('zoom_events')
        .select('id, title, description, scheduled_at, zoom_link, recording_content_id')
        .eq('is_active', true)
        .order('scheduled_at', { ascending: false })

      if (error) return err(error.message, 500, origin)

      // Добавляем флаг — зарегистрирован ли пользователь
      const { data: regs } = await supabase
        .from('zoom_registrations')
        .select('event_id')
        .eq('user_id', userId)

      const regSet = new Set(regs?.map(r => r.event_id))
      const events = data?.map(e => ({ ...e, is_registered: regSet.has(e.id) }))

      return json({ events }, 200, origin)
    }

    case 'register_zoom': {
      const { event_id } = body as { event_id: string }
      if (!event_id) return err('event_id required', 400, origin)

      const { error } = await supabase
        .from('zoom_registrations')
        .insert({ user_id: userId, event_id })

      if (error?.code === '23505') return json({ ok: true, already: true }, 200, origin)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'get_my_recordings': {
      // Записи разборов, на которые пользователь зарегистрирован
      const { data: regs, error } = await supabase
        .from('zoom_registrations')
        .select('zoom_events(id, title, scheduled_at, recording_content_id)')
        .eq('user_id', userId)

      if (error) return err(error.message, 500, origin)

      const recordings = regs
        ?.map(r => r.zoom_events)
        .filter(e => e && (e as { recording_content_id: string | null }).recording_content_id)

      return json({ recordings }, 200, origin)
    }

    // ── КУРС ────────────────────────────────────────────────
    case 'get_course': {
      // Курс = материалы типа video/audio сгруппированные по topic
      const { topic } = body as { topic?: string }

      const { data, error } = await supabase
        .from('private_content')
        .select('id, title, description, type, duration_seconds, sort_order, thumbnail_url, content_url')
        .eq('is_published', true)
        .eq('type', 'video')
        .order('sort_order', { ascending: true })

      if (error) return err(error.message, 500, origin)

      // Прогресс из user_progress (таблица основного приложения)
      const { data: progress } = await supabase
        .from('user_progress')
        .select('content_id, completed_at')
        .eq('user_id', userId)

      const progressMap = new Map(progress?.map(p => [p.content_id, p.completed_at]))

      const lessons = data?.map(l => ({
        ...l,
        is_completed: progressMap.has(l.id),
        completed_at: progressMap.get(l.id) ?? null,
      }))

      return json({ lessons }, 200, origin)
    }

    case 'complete_lesson': {
      const { content_id } = body as { content_id: string }
      if (!content_id) return err('content_id required', 400, origin)

      const { error } = await supabase
        .from('user_progress')
        .upsert(
          { user_id: userId, content_id, completed_at: new Date().toISOString() },
          { onConflict: 'user_id,content_id' }
        )

      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    // ── ГОЛОСОВЫЕ ───────────────────────────────────────────
    case 'get_voice_upload_url': {
      const { filename } = body as { filename?: string }
      const ext = filename?.split('.').pop() ?? 'webm'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`

      const { data, error } = await supabase.storage
        .from('voice-messages')
        .createSignedUploadUrl(path)

      if (error) return err(error.message, 500, origin)
      return json({ upload_url: data.signedUrl, path }, 200, origin)
    }

    case 'get_analysis_upload_url': {
      const { filename } = body as { filename?: string }
      const ext = filename?.split('.').pop() ?? 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${ext}`

      const { data, error } = await supabase.storage
        .from('user-analyses')
        .createSignedUploadUrl(path)

      if (error) return err(error.message, 500, origin)
      return json({ upload_url: data.signedUrl, path }, 200, origin)
    }

    default:
      return err(`Unknown action: ${action}`, 400, origin)
  }
})
