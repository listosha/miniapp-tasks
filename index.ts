import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

function makeClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

async function verifyAdminToken(token: string, secret: string): Promise<number | null> {
  const parts = token.split(':')
  if (parts.length !== 3) return null
  const [userIdStr, timestamp, sig] = parts
  const userId = parseInt(userIdStr)
  if (isNaN(userId)) return null
  if (Date.now() - parseInt(timestamp) > 86400000) return null
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const data = new TextEncoder().encode(`${userIdStr}:${timestamp}`)
  const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0))
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data)
  return valid ? userId : null
}

async function notifyTelegram(telegramId: string | number, text: string) {
  const token = Deno.env.get('TG_BOT_TOKEN')
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: telegramId, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return err('Method not allowed', 405, origin)

  let body: { action: string; token: string; [key: string]: unknown }
  try { body = await req.json() } catch { return err('Invalid JSON', 400, origin) }

  const { action, token } = body
  if (!action) return err('action required', 400, origin)
  if (!token) return err('token required', 401, origin)

  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminId = await verifyAdminToken(token, secret)
  if (!adminId) return err('Unauthorized', 401, origin)

  const supabase = makeClient()
  const { data: adminUser } = await supabase
    .from('users').select('id, role').eq('id', adminId).single()
  if (!adminUser || adminUser.role !== 'admin') return err('Forbidden', 403, origin)

  switch (action) {

    case 'get_subscribers': {
      const { data, error } = await supabase
        .from('user_access')
        .select('user_id,has_inner_circle,inner_circle_expires,has_consultation,is_senior,updated_at,users(id,first_name,last_name,telegram_id,last_active_at)')
        .eq('has_inner_circle', true)
        .order('inner_circle_expires', { ascending: true })
      if (error) return err(error.message, 500, origin)
      const now = new Date()
      const subscribers = data?.map(s => ({
        ...s,
        is_active: s.inner_circle_expires ? new Date(s.inner_circle_expires) > now : false,
        days_left: s.inner_circle_expires
          ? Math.ceil((new Date(s.inner_circle_expires).getTime() - now.getTime()) / 86400000)
          : 0,
      }))
      return json({ subscribers }, 200, origin)
    }

    case 'get_expiring_soon': {
      const in7days = new Date()
      in7days.setDate(in7days.getDate() + 7)
      const { data, error } = await supabase
        .from('user_access')
        .select('user_id,inner_circle_expires,is_senior,users(first_name,last_name,telegram_id)')
        .eq('has_inner_circle', true)
        .gt('inner_circle_expires', new Date().toISOString())
        .lt('inner_circle_expires', in7days.toISOString())
        .order('inner_circle_expires', { ascending: true })
      if (error) return err(error.message, 500, origin)
      return json({ expiring: data }, 200, origin)
    }

    case 'extend_access': {
      const { user_id, days } = body as { user_id: number; days: number }
      if (!user_id || !days) return err('user_id and days required', 400, origin)
      if (days < 1 || days > 365) return err('days must be 1-365', 400, origin)
      const { data: existing } = await supabase
        .from('user_access').select('inner_circle_expires').eq('user_id', user_id).single()
      const now = new Date()
      const base = existing?.inner_circle_expires && new Date(existing.inner_circle_expires) > now
        ? new Date(existing.inner_circle_expires) : now
      const expiresAt = new Date(base)
      expiresAt.setDate(expiresAt.getDate() + days)
      const { error } = await supabase.from('user_access').upsert(
        { user_id, has_inner_circle: true, inner_circle_expires: expiresAt.toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      if (error) return err(error.message, 500, origin)
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single()
      if (u?.telegram_id) {
        await notifyTelegram(u.telegram_id,
          `✅ Алексей продлил ваш доступ в Ближний круг на ${days} дней.\nДоступ активен до ${expiresAt.toLocaleDateString('ru-RU')}.`)
      }
      return json({ ok: true, expires_at: expiresAt.toISOString() }, 200, origin)
    }

    case 'get_all_threads': {
      const { limit = 50, offset = 0 } = body as { limit?: number; offset?: number }
      const { data, error } = await supabase
        .from('private_comments')
        .select('id,user_id,text,voice_url,thread_type,is_from_admin,is_read_by_admin,created_at,analysis_id,dependant_id,users(first_name,last_name,telegram_id)')
        .is('content_id', null).eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) return err(error.message, 500, origin)
      return json({ messages: data }, 200, origin)
    }

    case 'get_unread_threads': {
      const { data, error } = await supabase
        .from('private_comments')
        .select('id,user_id,text,voice_url,thread_type,created_at,analysis_id,dependant_id,users(first_name,last_name,telegram_id)')
        .is('content_id', null).eq('is_from_admin', false)
        .eq('is_read_by_admin', false).eq('is_hidden', false)
        .order('created_at', { ascending: true })
      if (error) return err(error.message, 500, origin)
      return json({ messages: data, count: data?.length ?? 0 }, 200, origin)
    }

    case 'reply_thread': {
      const { user_id, text, voice_url, analysis_id, dependant_id, thread_type } = body as {
        user_id: number; text?: string; voice_url?: string
        analysis_id?: string; dependant_id?: string; thread_type?: string
      }
      if (!user_id) return err('user_id required', 400, origin)
      if (!text?.trim() && !voice_url) return err('text or voice_url required', 400, origin)
      if (text && text.length > 2000) return err('Text too long', 400, origin)
      const { data, error } = await supabase.from('private_comments').insert({
        user_id, content_id: null, thread_type: thread_type ?? 'general',
        text: text?.trim() ?? null, voice_url: voice_url ?? null,
        analysis_id: analysis_id ?? null, dependant_id: dependant_id ?? null,
        is_from_admin: true, is_read_by_admin: true, is_read_by_user: false,
      }).select('id,created_at').single()
      if (error) return err(error.message, 500, origin)
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single()
      if (u?.telegram_id) {
        await notifyTelegram(u.telegram_id,
          `📋 Алексей написал вам\n\n${text?.slice(0, 200) ?? '🎧 Голосовое сообщение'}\n\n<a href="https://app.listoshenkov.ru/private/?section=chat">Открыть →</a>`)
      }
      return json({ message: data }, 200, origin)
    }

    case 'mark_read': {
      const { message_ids } = body as { message_ids: string[] }
      if (!Array.isArray(message_ids) || !message_ids.length) return err('message_ids required', 400, origin)
      const { error } = await supabase.from('private_comments').update({ is_read_by_admin: true }).in('id', message_ids)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'get_all_analyses': {
      const { status, limit = 50, offset = 0 } = body as { status?: string; limit?: number; offset?: number }
      let query = supabase.from('user_analyses')
        .select('id,user_id,analysis_type,lab_name,analysis_date,status,file_url,notes,created_at,users(first_name,last_name,telegram_id)')
        .order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) return err(error.message, 500, origin)
      return json({ analyses: data }, 200, origin)
    }

    case 'review_analysis': {
      const { analysis_id } = body as { analysis_id: string }
      if (!analysis_id) return err('analysis_id required', 400, origin)
      const { error } = await supabase.from('user_analyses').update({ status: 'reviewed' }).eq('id', analysis_id)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'add_recommendation': {
      const { user_id, text, dependant_id } = body as { user_id: number; text: string; dependant_id?: string }
      if (!user_id || !text?.trim()) return err('user_id and text required', 400, origin)
      const { data, error } = await supabase.from('user_recommendations').insert({
        user_id, text: text.trim(), dependant_id: dependant_id ?? null, is_completed: false,
      }).select('id,created_at').single()
      if (error) return err(error.message, 500, origin)
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single()
      if (u?.telegram_id) {
        await notifyTelegram(u.telegram_id,
          `📋 Алексей написал вам рекомендации\n\nПосмотрел карту и анализы. Внутри — что делать дальше.\n\n<a href="https://app.listoshenkov.ru/private/?section=reco">Открыть рекомендации →</a>`)
      }
      return json({ recommendation: data }, 200, origin)
    }

    case 'edit_recommendation': {
      const { recommendation_id, text } = body as { recommendation_id: string; text: string }
      if (!recommendation_id || !text?.trim()) return err('recommendation_id and text required', 400, origin)
      const { error } = await supabase.from('user_recommendations').update({ text: text.trim() }).eq('id', recommendation_id)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'add_protocol': {
      const { user_id, title, marker_id, supplement_name, dose,
              start_date, end_date, control_date, notes, dependant_id } = body as {
        user_id: number; title: string; marker_id?: number; supplement_name?: string
        dose?: string; start_date?: string; end_date?: string; control_date?: string
        notes?: string; dependant_id?: string
      }
      if (!user_id || !title?.trim()) return err('user_id and title required', 400, origin)
      const { data, error } = await supabase.from('user_protocols').insert({
        user_id, title: title.trim(), marker_id: marker_id ?? null,
        supplement_name: supplement_name ?? null, dose: dose ?? null,
        start_date: start_date ?? null, end_date: end_date ?? null,
        control_date: control_date ?? null, notes: notes ?? null,
        dependant_id: dependant_id ?? null, is_active: true,
      }).select('id,created_at').single()
      if (error) return err(error.message, 500, origin)
      return json({ protocol: data }, 200, origin)
    }

    case 'edit_protocol': {
      const { protocol_id, ...updates } = body as { protocol_id: string; [key: string]: unknown }
      if (!protocol_id) return err('protocol_id required', 400, origin)
      const allowed = ['title','dose','supplement_name','start_date','end_date','control_date','notes','is_active']
      const clean = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
      const { error } = await supabase.from('user_protocols').update(clean).eq('id', protocol_id)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'add_content': {
      const { title, description, type, topic, tags, content_url, thumbnail_url, duration_seconds, sort_order } = body as {
        title: string; description?: string; type: string; topic?: string; tags?: string[]
        content_url?: string; thumbnail_url?: string; duration_seconds?: number; sort_order?: number
      }
      if (!title?.trim() || !type) return err('title and type required', 400, origin)
      const validTypes = ['audio','text','pdf','video','zoom_recording']
      if (!validTypes.includes(type)) return err(`type must be one of: ${validTypes.join(', ')}`, 400, origin)
      const { data, error } = await supabase.from('private_content').insert({
        title: title.trim(), description: description ?? null, type,
        topic: topic ?? null, tags: tags ?? [], content_url: content_url ?? null,
        thumbnail_url: thumbnail_url ?? null, duration_seconds: duration_seconds ?? null,
        sort_order: sort_order ?? 0, is_published: true,
      }).select('id,created_at').single()
      if (error) return err(error.message, 500, origin)
      if (tags?.length && data) {
        await supabase.from('library_item_tags').insert(tags.map(slug => ({ content_id: data.id, tag_slug: slug })))
      }
      return json({ content: data }, 200, origin)
    }

    case 'edit_content': {
      const { content_id, tags, ...updates } = body as { content_id: string; tags?: string[]; [key: string]: unknown }
      if (!content_id) return err('content_id required', 400, origin)
      const allowed = ['title','description','type','topic','content_url','thumbnail_url','duration_seconds','sort_order','is_published','expires_at']
      const clean = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
      if (Object.keys(clean).length) {
        const { error } = await supabase.from('private_content').update({ ...clean, updated_at: new Date().toISOString() }).eq('id', content_id)
        if (error) return err(error.message, 500, origin)
      }
      if (tags !== undefined) {
        await supabase.from('library_item_tags').delete().eq('content_id', content_id)
        if (tags.length) await supabase.from('library_item_tags').insert(tags.map(slug => ({ content_id, tag_slug: slug })))
      }
      return json({ ok: true }, 200, origin)
    }

    case 'hide_content': {
      const { content_id } = body as { content_id: string }
      if (!content_id) return err('content_id required', 400, origin)
      const { error } = await supabase.from('private_content').update({ is_published: false, updated_at: new Date().toISOString() }).eq('id', content_id)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'create_zoom_event': {
      const { title, description, scheduled_at, zoom_link } = body as {
        title?: string; description?: string; scheduled_at: string; zoom_link?: string
      }
      if (!scheduled_at) return err('scheduled_at required', 400, origin)
      const { data, error } = await supabase.from('zoom_events').insert({
        title: title ?? 'Разбор анализов', description: description ?? null,
        scheduled_at, zoom_link: zoom_link ?? null, is_active: true,
      }).select('id,scheduled_at').single()
      if (error) return err(error.message, 500, origin)
      return json({ event: data }, 200, origin)
    }

    case 'attach_recording': {
      const { event_id, content_id } = body as { event_id: string; content_id: string }
      if (!event_id || !content_id) return err('event_id and content_id required', 400, origin)
      const { error } = await supabase.from('zoom_events').update({ recording_content_id: content_id }).eq('id', event_id)
      if (error) return err(error.message, 500, origin)
      return json({ ok: true }, 200, origin)
    }

    case 'grant_recording_access': {
      const { event_id, user_ids } = body as { event_id: string; user_ids: number[] }
      if (!event_id || !Array.isArray(user_ids) || !user_ids.length) return err('event_id and user_ids required', 400, origin)
      const { error } = await supabase.from('zoom_registrations')
        .upsert(user_ids.map(uid => ({ user_id: uid, event_id })), { onConflict: 'user_id,event_id' })
      if (error) return err(error.message, 500, origin)
      return json({ ok: true, granted: user_ids.length }, 200, origin)
    }

    case 'add_marker': {
      const { name, aliases, units, category, ref_ranges, sort_order } = body as {
        name: string; aliases?: string[]; units?: unknown[]
        category: string; ref_ranges?: unknown[]; sort_order?: number
      }
      if (!name?.trim() || !category) return err('name and category required', 400, origin)
      const { data, error } = await supabase.from('analysis_markers').insert({
        name: name.trim(), aliases: aliases ?? [], units: units ?? [],
        category, ref_ranges: ref_ranges ?? [], sort_order: sort_order ?? 0, is_active: true,
      }).select('id').single()
      if (error) return err(error.message, 500, origin)
      return json({ marker: data }, 200, origin)
    }

    case 'merge_custom_marker': {
      const { custom_name, marker_id } = body as { custom_name: string; marker_id: number }
      if (!custom_name || !marker_id) return err('custom_name and marker_id required', 400, origin)
      const { data: analyses } = await supabase.from('user_analyses').select('id,parsed_data')
      if (!analyses?.length) return json({ ok: true, updated: 0 }, 200, origin)
      let updated = 0
      for (const analysis of analyses) {
        const pd = analysis.parsed_data as Array<{ marker_id?: number; custom_name?: string; is_custom?: boolean; value: number; unit: string }>
        if (!Array.isArray(pd)) continue
        const newPd = pd.map(m =>
          m.is_custom && m.custom_name?.toLowerCase() === custom_name.toLowerCase()
            ? { ...m, marker_id, custom_name: null, is_custom: false }
            : m
        )
        if (JSON.stringify(pd) !== JSON.stringify(newPd)) {
          await supabase.from('user_analyses').update({ parsed_data: newPd }).eq('id', analysis.id)
          updated++
        }
      }
      return json({ ok: true, updated }, 200, origin)
    }

    case 'get_daily_summary': {
      const now = new Date()
      const in7days = new Date()
      in7days.setDate(in7days.getDate() + 7)
      const [a, b, c, d] = await Promise.all([
        supabase.from('user_access').select('*', { count: 'exact', head: true })
          .eq('has_inner_circle', true).gt('inner_circle_expires', now.toISOString()),
        supabase.from('private_comments').select('*', { count: 'exact', head: true })
          .is('content_id', null).eq('is_from_admin', false).eq('is_read_by_admin', false),
        supabase.from('user_analyses').select('*', { count: 'exact', head: true }).eq('status', 'uploaded'),
        supabase.from('user_access').select('*', { count: 'exact', head: true })
          .eq('has_inner_circle', true)
          .gt('inner_circle_expires', now.toISOString())
          .lt('inner_circle_expires', in7days.toISOString()),
      ])
      return json({
        active_subscribers: a.count ?? 0,
        unread_messages: b.count ?? 0,
        new_analyses: c.count ?? 0,
        expiring_soon: d.count ?? 0,
      }, 200, origin)
    }

    default:
      return err(`Unknown action: ${action}`, 400, origin)
  }
})
