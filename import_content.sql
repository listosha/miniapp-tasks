-- T-PRIVATE-007a: Content import from Telegram channel export
-- Items: 45

BEGIN;

-- [10] Практикум по щитовидной железе. Часть 1: Диагностика
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Практикум по щитовидной железе. Часть 1: Диагностика', 'Практикум по работе с щитовидной железой', 'video', NULL, 10, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('thyroid'), ('video'), ('understand'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [11] Практикум по щитовидной железе. Часть 2: Питание
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Практикум по щитовидной железе. Часть 2: Питание', 'Питание для щитовидки. Спасти, нельзя удалять.', 'video', NULL, 11, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('thyroid'), ('video'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [20] Пищеварение: функции, нарушения, что делать
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Пищеварение: функции, нарушения, что делать', '▫️Все функции пищеварения', 'video', NULL, 20, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('gut'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [21] Питание при заболеваниях ЖКТ
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Питание при заболеваниях ЖКТ', '«Питание при заболеваниях желудочно-кишечного тракта»', 'text', NULL, 21, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('gut'), ('nutrition'), ('article'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [30] Иммунитет: базовый цикл
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Иммунитет: базовый цикл', 'Как работает иммунитет? Основы.', 'text', NULL, 30, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('article'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [31] Иммунитет. Подкаст. Часть 1: что это, как работает
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Иммунитет. Подкаст. Часть 1: что это, как работает', 'Продолжение цикла про Иммунитет - голосовой подкаст.', 'audio', NULL, 31, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [32] Иммунитет. Подкаст. Часть 2: что делать
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Иммунитет. Подкаст. Часть 2: что делать', 'Вторая часть подкаста о работе с иммунитетом.', 'audio', NULL, 32, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('audio'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [33] Вебинар «Иммунитет — как поддержать союзника?»
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Вебинар «Иммунитет — как поддержать союзника?»', 'Дорогие подписчики, сделал вебинар:', 'video', NULL, 33, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('video'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [40] Надпочечники — дирижёр. Часть 1: Три стадии стресса
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 1: Три стадии стресса', 'Часть 1. Три стадии стресса. Надпочечники - кто это?', 'video', NULL, 40, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [41] Надпочечники — дирижёр. Часть 2: Функции и производственная цепочка
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 2: Функции и производственная цепочка', 'Часть 2. Функции и производственная цепочка НП.', 'video', NULL, 41, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [42] Надпочечники — дирижёр. Часть 3-4: Гормоны надпочечников
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 3-4: Гормоны надпочечников', 'Часть 3. Гормоны надпочечников.', 'video', NULL, 42, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [43] Надпочечники — дирижёр. Часть 5: Реакции на стресс
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 5: Реакции на стресс', 'Часть 5. Реакции на стресс. Как перегрузить НП.', 'video', NULL, 43, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [44] Надпочечники — дирижёр. Часть 6: Не только стресс
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 6: Не только стресс', 'Часть 6. Не только стресс...', 'video', NULL, 44, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [45] Надпочечники — дирижёр. Часть 7: Работа оси ГГН
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 7: Работа оси ГГН', 'Часть 7. Работа оси ГГН', 'video', NULL, 45, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('understand'), ('deep_dive')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [46] Надпочечники — дирижёр. Часть 8: Третья стадия СУН
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 8: Третья стадия СУН', 'Часть 8. Отдельно 3-я стадия СУН', 'video', NULL, 46, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('video'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [47] Надпочечники — дирижёр. Часть 9: Компенсируем питанием
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Надпочечники — дирижёр. Часть 9: Компенсируем питанием', 'Часть 9. Компенсируем питанием!', 'video', NULL, 47, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('nutrition'), ('video'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [50] Хроники воспаления
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Хроники воспаления', 'Начнем интересный цикл:', 'text', NULL, 50, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('inflammation'), ('immunity'), ('infections'), ('article'), ('understand'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [60] Почки и давление
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Почки и давление', '🧬 Почки и давление • Часть 1 из 5', 'text', NULL, 60, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('kidneys'), ('inflammation'), ('article'), ('understand'), ('diagnose'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [70] Инфекция на инфекции: кейс
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Инфекция на инфекции: кейс', 'Инфекция на инфекции сидит и инфекцией погоняет...', 'text', NULL, 70, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('infections'), ('immunity'), ('article'), ('cases')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [71] Постковидный синдром — миф или реальность?
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Постковидный синдром — миф или реальность?', 'Постковидный синдром - миф или реальность?', 'text', NULL, 71, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('infections'), ('immunity'), ('fatigue'), ('article'), ('understand'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [80] Читать анализы как открытую книгу
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Читать анализы как открытую книгу', 'Читать анализы как открытую книгу.', 'text', NULL, 80, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('bloodwork'), ('cases'), ('article'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [81] Артериит — воспаление артерий
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Артериит — воспаление артерий', 'Попался сегодня редкий термин', 'text', NULL, 81, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('inflammation'), ('joints'), ('article'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [82] Кварцевые лампы: применение для дезинфекции
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Кварцевые лампы: применение для дезинфекции', 'Заметил, что мы болеем как то циклично. Болезнь уходит, и может быстро вернуться снова. Начал размышлять об этом. И в голову пришло - везде в больницах, поликлиниках, и вообще, общественных местах применяют кварц.', 'text', NULL, 82, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('infections'), ('article'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [83] Почему тело включает защиту?
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Почему тело включает защиту?', 'Почему тело включает защиту?', 'audio', NULL, 83, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('fatigue'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [84] Иммунитет и кишечник: связь
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Иммунитет и кишечник: связь', '🎧 В этом голосовом — про связь иммунитета и кишечника, которую почти никто не учитывает.', 'audio', NULL, 84, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('immunity'), ('gut'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [85] Как стресс мешает усвоению пищи
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Как стресс мешает усвоению пищи', '😵‍💫 Как стресс мешает нам усваивать пищу — и почему без сна, белка и ферментов выхода нет', 'text', NULL, 85, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('gut'), ('adrenals'), ('nutrition'), ('article'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [86] Лень или дефицит ресурсов — биология усталости
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Лень или дефицит ресурсов — биология усталости', '🎧 Аудио: Лень или дефицит ресурсов — биология усталости', 'audio', 'podcasts/audio_2@07-07-2025_12-57-01.ogg', 86, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('fatigue'), ('mitochondria'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [87] Лаваж Маткевича: разбор
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Лаваж Маткевича: разбор', 'Лаваж Маткевича: мягкая чистка или игра с микробиомом? ⚖️', 'text', NULL, 87, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('gut'), ('article'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [88] Гайд по митохондриям
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Гайд по митохондриям', 'Дорогие мои подписчики, по результатам изучения работы митохондрий, и взаимосвязей различных болезней и митохондриальной дисфункции, хочу предложить вам вот такие данные и схему для улучшения работы наших "энергетических станций".', 'text', NULL, 88, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('mitochondria'), ('fatigue'), ('article'), ('understand'), ('deep_dive')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [90] Подкаст: Чтение этикеток
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Чтение этикеток', 'Покупаем продукты с умом⬇️', 'audio', NULL, 90, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('nutrition'), ('audio'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [91] Подкаст: Правильное питание — подмена понятий
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Правильное питание — подмена понятий', 'Правильное питание. Подмена понятий', 'audio', NULL, 91, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('nutrition'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [92] Подкаст: Анализ крови — что важно, на что смотреть
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Анализ крови — что важно, на что смотреть', 'Самое бюджетное и предопределяющее 🔬', 'audio', NULL, 92, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('bloodwork'), ('audio'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [93] Подкаст: Баланс макронутриентов
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Баланс макронутриентов', 'Баланс макронутриентов: белки, жиры и углеводы', 'audio', 'podcasts/audio_1@12-08-2024_17-47-06.ogg', 93, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('nutrition'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [94] Подкаст: Инсулинорезистентность и диабет 2 типа
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Инсулинорезистентность и диабет 2 типа', 'Инсулинорезистентность, диабет 2 типа.', 'audio', NULL, 94, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('insulin'), ('audio'), ('understand'), ('diagnose')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [95] Подкаст: Артриты и артрозы
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Артриты и артрозы', 'Записал для вас подкаст:', 'audio', NULL, 95, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('joints'), ('inflammation'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [96] Подкаст: Почки и МВП
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Подкаст: Почки и МВП', '"Почки и проблемы мочевыводящих путей"', 'audio', NULL, 96, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('kidneys'), ('audio'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [100] «Синдром усталости надпочечников» — Майкл Лэм
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('«Синдром усталости надпочечников» — Майкл Лэм', 'Книга «Синдром усталости надпочечников» от Майкла Лэма.', 'text', NULL, 100, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('adrenals'), ('book')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [101] «Блуждающий нерв» — Наваз Хабиб
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('«Блуждающий нерв» — Наваз Хабиб', '"Блуждающий нерв. Что это такое и за что отвечает - Наваз Хабиб"', 'text', NULL, 101, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('nervous'), ('gut'), ('book')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [102] «Ненасильственное общение» — Маршалл Розенберг
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('«Ненасильственное общение» — Маршалл Розенберг', 'Ненасильственное общение. Маршал Розенберг', 'text', NULL, 102, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('nervous'), ('book')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [103] «Протокол Хашимото» — Изабелла Венц
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('«Протокол Хашимото» — Изабелла Венц', 'Протокол Хашимото. Когда иммунитет работает против вас. Изабелла Венц', 'text', NULL, 103, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('thyroid'), ('immunity'), ('book')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [104] «Эгоистичная митохондрия» — Ли Ноу
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('«Эгоистичная митохондрия» — Ли Ноу', 'Книга Эгоистичная Митохондрия', 'text', NULL, 104, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('mitochondria'), ('book')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [110] Гайд «Противовирусные средства»
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Гайд «Противовирусные средства»', 'Эксклюзив для подписчиков закрытого канала!', 'pdf', NULL, 110, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('infections'), ('supplements'), ('guide'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [111] Гайд «Спать, чтобы жить»
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Гайд «Спать, чтобы жить»', 'Гайд “Спать, чтобы жить” — специально для вас', 'pdf', NULL, 111, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('sleep'), ('adrenals'), ('guide'), ('act')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [120] Роль вирусов герпеса в онкогенезе — разбор исследования
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Роль вирусов герпеса в онкогенезе — разбор исследования', 'Роль вирусов герпеса человека в онкогенезе посредством уклонения от иммунного ответа и подавления иммунитета', 'text', NULL, 120, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('infections'), ('immunity'), ('research'), ('understand'), ('deep_dive')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- [121] Публикация Черевко: пищевая гиперреактивность и микробиота
DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ('Публикация Черевко: пищевая гиперреактивность и микробиота', 'Это статья от профессора Черевко Светланы, одного из спикеров мед конференции Артлайф. Знаком с ней лично. Очень рекомендую к прочтению. Сложновато, но уверен, вы осилите. Информация очень полезная.', 'text', NULL, 121, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES ('gut'), ('nutrition'), ('immunity'), ('research'), ('understand')) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Verify
SELECT type, COUNT(*) FROM private_content GROUP BY type ORDER BY type;
SELECT COUNT(*) AS total_items FROM private_content;
SELECT COUNT(*) AS total_tags FROM library_item_tags;

COMMIT;