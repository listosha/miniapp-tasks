-- =============================================================
-- T-PRIVATE-001: Ближний круг — Этап 1 (БД)
-- Версия: 1.0-fixed | Дата: 02.05.2026
-- FIXED: products INSERT без slug (колонки нет в схеме)
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. user_dependants (ДО других таблиц — на неё ссылаются)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_dependants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_dependants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_dependants_select" ON user_dependants
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_dependants_insert" ON user_dependants
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_dependants_update" ON user_dependants
  FOR UPDATE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_dependants_delete" ON user_dependants
  FOR DELETE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 2. user_access (доступ / подписки)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_access (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  has_inner_circle BOOLEAN DEFAULT false,
  inner_circle_expires TIMESTAMPTZ,
  has_consultation BOOLEAN DEFAULT false,
  consultation_count INT DEFAULT 0,
  consultation_used INT DEFAULT 0,
  is_senior BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_access_select" ON user_access
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 3. analysis_markers (справочник показателей)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_markers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  units JSONB DEFAULT '[]',
  category TEXT NOT NULL,
  ref_ranges JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE analysis_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_markers_select" ON analysis_markers
  FOR SELECT USING (is_active = true);

-- -------------------------------------------------------------
-- 4. private_content (библиотека материалов)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('audio', 'text', 'pdf', 'video', 'zoom_recording')),
  topic TEXT,
  tags TEXT[] DEFAULT '{}',
  content_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE private_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "private_content_select" ON private_content
  FOR SELECT USING (is_published = true AND (expires_at IS NULL OR expires_at > now()));

-- -------------------------------------------------------------
-- 5. library_tags (справочник тегов)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_tags (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  level INT NOT NULL CHECK (level IN (1, 2, 3)),
  description TEXT,
  sort_order INT DEFAULT 0
);

ALTER TABLE library_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_tags_select" ON library_tags FOR SELECT USING (true);

-- Уровень 1 — Темы
INSERT INTO library_tags (slug, name, level, description, sort_order) VALUES
  ('thyroid',     'Щитовидная железа',     1, 'АИТ, гипотиреоз, гипертиреоз, узлы', 10),
  ('adrenals',    'Надпочечники',           1, 'Кортизол, СУН, ось ГГН, стресс',      20),
  ('immunity',    'Иммунитет',              1, 'Иммунный ответ, аутоиммунность',       30),
  ('inflammation','Воспаление',             1, 'Хроническое воспаление, цитокины',     40),
  ('gut',         'ЖКТ и пищеварение',      1, 'Микробиом, желчеотток, барьер',        50),
  ('liver',       'Печень',                 1, 'Желчеотток, гепатопротекция',          60),
  ('kidneys',     'Почки и МВП',            1, 'Почечная функция, давление',           70),
  ('infections',  'Инфекции',               1, 'Вирусы, бактерии, герпес, постковид',  80),
  ('hormones',    'Гормоны',                1, 'Гормональный баланс',                  90),
  ('insulin',     'Инсулин и сахар',        1, 'ИР, диабет 2 типа',                  100),
  ('joints',      'Суставы',                1, 'Артрит, артроз',                      110),
  ('sleep',       'Сон и восстановление',   1, 'Нарушения сна, кортизол',             120),
  ('fatigue',     'Усталость и ресурсы',    1, 'Хроническая усталость, митохондрии',  130),
  ('bloodwork',   'Анализы крови',          1, 'Маркеры, интерпретация',              140),
  ('nutrition',   'Питание',                1, 'Принципы, макронутриенты',            150),
  ('supplements', 'БАДы и протоколы',       1, 'Добавки, дозировки, схемы',           160),
  ('nervous',     'Нервная система',        1, 'Блуждающий нерв, вегетатика',         170),
  ('mitochondria','Митохондрии',            1, 'Энергетика клетки',                   180),
  ('cases',       'Кейсы',                  1, 'Реальные случаи из практики',         190)
ON CONFLICT (slug) DO NOTHING;

-- Уровень 2 — Форматы
INSERT INTO library_tags (slug, name, level, description, sort_order) VALUES
  ('article',   'Статья',        2, 'Текстовый пост или серия постов', 10),
  ('audio',     'Аудиоподкаст',  2, 'Голосовой подкаст',               20),
  ('video',     'Видеозапись',   2, 'Эфир или вебинар',                30),
  ('guide',     'Гайд',          2, 'Практический документ',           40),
  ('book',      'Книга',         2, 'Рекомендованная литература',      50),
  ('research',  'Исследование',  2, 'Научная статья',                  60),
  ('protocol',  'Протокол',      2, 'Готовая схема',                   70)
ON CONFLICT (slug) DO NOTHING;

-- Уровень 3 — Действия
INSERT INTO library_tags (slug, name, level, description, sort_order) VALUES
  ('understand', 'Понять механизм',       3, 'Объяснение как работает система',    10),
  ('diagnose',   'Разобраться в анализах',3, 'Что смотреть, как интерпретировать', 20),
  ('act',        'Что делать',            3, 'Конкретные шаги и протокол',          30),
  ('deep_dive',  'Глубокое погружение',   3, 'Для тех, кто хочет детально',        40)
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------------
-- 6. library_item_tags (связь материал ↔ тег)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_item_tags (
  content_id UUID NOT NULL REFERENCES private_content(id) ON DELETE CASCADE,
  tag_slug TEXT NOT NULL REFERENCES library_tags(slug) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_slug)
);

ALTER TABLE library_item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_item_tags_select" ON library_item_tags FOR SELECT USING (true);

-- -------------------------------------------------------------
-- 7. zoom_events (расписание разборов)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoom_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Разбор анализов',
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  zoom_link TEXT,
  recording_content_id UUID REFERENCES private_content(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE zoom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zoom_events_select" ON zoom_events
  FOR SELECT USING (is_active = true);

-- -------------------------------------------------------------
-- 8. zoom_registrations (записи на разбор)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoom_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES zoom_events(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE zoom_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zoom_registrations_select" ON zoom_registrations
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "zoom_registrations_insert" ON zoom_registrations
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "zoom_registrations_delete" ON zoom_registrations
  FOR DELETE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 9. user_analyses (загруженные анализы)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependant_id UUID REFERENCES user_dependants(id),
  analysis_type TEXT NOT NULL,
  lab_name TEXT,
  analysis_date DATE,
  file_url TEXT,
  voice_url TEXT,
  parsed_data JSONB DEFAULT '[]',
  notes TEXT,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'reviewed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_analyses_select" ON user_analyses
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_analyses_insert" ON user_analyses
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_analyses_delete" ON user_analyses
  FOR DELETE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 10. user_health_profile (мед. карта)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_health_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependant_id UUID REFERENCES user_dependants(id),
  diagnoses TEXT[] DEFAULT '{}',
  medications JSONB DEFAULT '[]',
  supplements JSONB DEFAULT '[]',
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  age INT,
  weight NUMERIC,
  height NUMERIC,
  special_notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, dependant_id)
);

ALTER TABLE user_health_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_health_profile_select" ON user_health_profile
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_health_profile_insert" ON user_health_profile
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_health_profile_update" ON user_health_profile
  FOR UPDATE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 11. health_journal (дневник самочувствия)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependant_id UUID REFERENCES user_dependants(id),
  text TEXT,
  voice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_journal_select" ON health_journal
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "health_journal_insert" ON health_journal
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "health_journal_delete" ON health_journal
  FOR DELETE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 12. user_protocols (протоколы)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependant_id UUID REFERENCES user_dependants(id),
  title TEXT NOT NULL,
  marker_id INT REFERENCES analysis_markers(id),
  supplement_name TEXT,
  dose TEXT,
  start_date DATE,
  end_date DATE,
  control_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_protocols_select" ON user_protocols
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 13. user_recommendations (рекомендации от Алексея)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dependant_id UUID REFERENCES user_dependants(id),
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_recommendations_select" ON user_recommendations
  FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

CREATE POLICY "user_recommendations_update" ON user_recommendations
  FOR UPDATE USING (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 14. private_comments (комментарии + персональная переписка)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES private_content(id),
  thread_type TEXT DEFAULT 'material' CHECK (thread_type IN (
    'material', 'general', 'analysis_review', 'lesson_question'
  )),
  analysis_id UUID REFERENCES user_analyses(id),
  dependant_id UUID REFERENCES user_dependants(id),
  parent_id UUID REFERENCES private_comments(id),
  text TEXT CHECK (length(text) <= 2000),
  voice_url TEXT,
  is_from_admin BOOLEAN DEFAULT false,
  is_read_by_admin BOOLEAN DEFAULT false,
  is_read_by_user BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE private_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "private_comments_select" ON private_comments
  FOR SELECT USING (
    user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int
    OR (content_id IS NOT NULL AND is_hidden = false)
  );

CREATE POLICY "private_comments_insert" ON private_comments
  FOR INSERT WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::jsonb->>'sub')::int);

-- -------------------------------------------------------------
-- 15. Индексы для производительности
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_private_comments_content ON private_comments(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_private_comments_user ON private_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_private_comments_thread ON private_comments(thread_type, user_id);
CREATE INDEX IF NOT EXISTS idx_user_analyses_user ON user_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_health_journal_user ON health_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_private_content_published ON private_content(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_zoom_events_scheduled ON zoom_events(scheduled_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_analysis_markers_category ON analysis_markers(category) WHERE is_active = true;

-- -------------------------------------------------------------
-- 17. Продукты Ближнего круга
-- FIXED: products не имеет колонки slug, используем WHERE NOT EXISTS
-- -------------------------------------------------------------
INSERT INTO products (name, price, description)
SELECT v.name, v.price::numeric, v.description FROM (VALUES
  ('Ближний круг - 30 дней',             3000::numeric, 'Доступ к закрытому разделу на 30 дней'),
  ('Ближний круг - 30 дней (пенсионер)', 1500::numeric, 'Льготный доступ на 30 дней'),
  ('Ближний круг - 90 дней',             7200::numeric, 'Доступ к закрытому разделу на 90 дней'),
  ('Ближний круг - 90 дней (пенсионер)', 3600::numeric, 'Льготный доступ на 90 дней')
) AS v(name, price, description)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = v.name);

-- -------------------------------------------------------------
-- 18. Проверка результата
-- -------------------------------------------------------------
SELECT
  tablename,
  rowsecurity AS rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_access','user_dependants','analysis_markers','private_content',
    'library_tags','library_item_tags','zoom_events','zoom_registrations',
    'user_analyses','user_health_profile','health_journal',
    'user_protocols','user_recommendations','private_comments'
  )
ORDER BY tablename;

COMMIT;
