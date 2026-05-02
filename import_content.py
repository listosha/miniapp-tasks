#!/usr/bin/env python3
"""
T-PRIVATE-007a: Import content from Telegram channel export into private_content + library_item_tags.
Usage: python3 import_content.py
Output: import_content.sql (in same directory as script)
"""

import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing beautifulsoup4...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'beautifulsoup4', '-q'])
    from bs4 import BeautifulSoup

# ── Configuration ───────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
EXPORT_DIR = SCRIPT_DIR / 'ChatExport_2026-05-02'
MESSAGES_HTML = EXPORT_DIR / 'messages.html'
OUTPUT_SQL = SCRIPT_DIR / 'import_content.sql'

# ── Catalog: hardcoded from content-structure.md ─────────────────────────────
CATALOG = [
    # ── СЕРИИ: ВИДЕО ────────────────────────────────────────────────────────
    {
        'title': 'Практикум по щитовидной железе. Часть 1: Диагностика',
        'type': 'video',
        'msg_ids': [22],
        'tags': ['thyroid', 'video', 'understand', 'diagnose'],
        'sort_order': 10,
    },
    {
        'title': 'Практикум по щитовидной железе. Часть 2: Питание',
        'type': 'video',
        'msg_ids': [23, 24],
        'tags': ['thyroid', 'video', 'act'],
        'sort_order': 11,
    },
    {
        'title': 'Пищеварение: функции, нарушения, что делать',
        'type': 'video',
        'msg_ids': [27],
        'tags': ['gut', 'video', 'understand'],
        'sort_order': 20,
    },
    {
        'title': 'Питание при заболеваниях ЖКТ',
        'type': 'text',
        'msg_ids': [64, 65],
        'tags': ['gut', 'nutrition', 'article', 'act'],
        'sort_order': 21,
    },
    # ── СЕРИИ: СТАТЬИ ───────────────────────────────────────────────────────
    {
        'title': 'Иммунитет: базовый цикл',
        'type': 'text',
        'msg_ids': [50, 51, 53, 56, 57, 60, 61],
        'tags': ['immunity', 'article', 'understand'],
        'sort_order': 30,
    },
    {
        'title': 'Иммунитет. Подкаст. Часть 1: что это, как работает',
        'type': 'audio',
        'msg_ids': [119],
        'tags': ['immunity', 'audio', 'understand'],
        'sort_order': 31,
    },
    {
        'title': 'Иммунитет. Подкаст. Часть 2: что делать',
        'type': 'audio',
        'msg_ids': [121],
        'tags': ['immunity', 'audio', 'act'],
        'sort_order': 32,
    },
    {
        'title': 'Вебинар «Иммунитет — как поддержать союзника?»',
        'type': 'video',
        'msg_ids': [107],
        'tags': ['immunity', 'video', 'act'],
        'sort_order': 33,
    },
    # Надпочечники — 8 видеоуроков
    {
        'title': 'Надпочечники — дирижёр. Часть 1: Три стадии стресса',
        'type': 'video', 'msg_ids': [92],
        'tags': ['adrenals', 'video', 'understand'], 'sort_order': 40,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 2: Функции и производственная цепочка',
        'type': 'video', 'msg_ids': [93],
        'tags': ['adrenals', 'video', 'understand'], 'sort_order': 41,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 3-4: Гормоны надпочечников',
        'type': 'video', 'msg_ids': [94, 95],
        'tags': ['adrenals', 'video', 'understand'], 'sort_order': 42,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 5: Реакции на стресс',
        'type': 'video', 'msg_ids': [97],
        'tags': ['adrenals', 'video', 'understand'], 'sort_order': 43,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 6: Не только стресс',
        'type': 'video', 'msg_ids': [100],
        'tags': ['adrenals', 'video', 'understand'], 'sort_order': 44,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 7: Работа оси ГГН',
        'type': 'video', 'msg_ids': [105],
        'tags': ['adrenals', 'video', 'understand', 'deep_dive'], 'sort_order': 45,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 8: Третья стадия СУН',
        'type': 'video', 'msg_ids': [106],
        'tags': ['adrenals', 'video', 'diagnose'], 'sort_order': 46,
    },
    {
        'title': 'Надпочечники — дирижёр. Часть 9: Компенсируем питанием',
        'type': 'video', 'msg_ids': [108],
        'tags': ['adrenals', 'nutrition', 'video', 'act'], 'sort_order': 47,
    },
    # Хроники воспаления
    {
        'title': 'Хроники воспаления',
        'type': 'text',
        'msg_ids': [195, 196, 199, 200, 201, 202, 205, 206, 212, 213, 216, 217],
        'tags': ['inflammation', 'immunity', 'infections', 'article', 'understand', 'diagnose'],
        'sort_order': 50,
    },
    # Почки и давление
    {
        'title': 'Почки и давление',
        'type': 'text',
        'msg_ids': [178, 179, 181, 183, 184],
        'tags': ['kidneys', 'inflammation', 'article', 'understand', 'diagnose', 'act'],
        'sort_order': 60,
    },
    # Инфекции
    {
        'title': 'Инфекция на инфекции: кейс',
        'type': 'text', 'msg_ids': [125, 126],
        'tags': ['infections', 'immunity', 'article', 'cases'], 'sort_order': 70,
    },
    {
        'title': 'Постковидный синдром — миф или реальность?',
        'type': 'text', 'msg_ids': [144, 145],
        'tags': ['infections', 'immunity', 'fatigue', 'article', 'understand', 'act'], 'sort_order': 71,
    },
    # ── РАЗОВЫЕ СТАТЬИ ──────────────────────────────────────────────────────
    {'title': 'Читать анализы как открытую книгу', 'type': 'text', 'msg_ids': [118],
     'tags': ['bloodwork', 'cases', 'article', 'diagnose'], 'sort_order': 80},
    {'title': 'Артериит — воспаление артерий', 'type': 'text', 'msg_ids': [143],
     'tags': ['inflammation', 'joints', 'article', 'understand'], 'sort_order': 81},
    {'title': 'Кварцевые лампы: применение для дезинфекции', 'type': 'text', 'msg_ids': [146],
     'tags': ['infections', 'article', 'act'], 'sort_order': 82},
    {'title': 'Почему тело включает защиту?', 'type': 'audio', 'msg_ids': [186],
     'tags': ['immunity', 'fatigue', 'audio', 'understand'], 'sort_order': 83},
    {'title': 'Иммунитет и кишечник: связь', 'type': 'audio', 'msg_ids': [191],
     'tags': ['immunity', 'gut', 'audio', 'understand'], 'sort_order': 84},
    {'title': 'Как стресс мешает усвоению пищи', 'type': 'text', 'msg_ids': [192],
     'tags': ['gut', 'adrenals', 'nutrition', 'article', 'understand'], 'sort_order': 85},
    {'title': 'Лень или дефицит ресурсов — биология усталости', 'type': 'audio', 'msg_ids': [193],
     'tags': ['fatigue', 'mitochondria', 'audio', 'understand'],
     'content_url': 'podcasts/audio_2@07-07-2025_12-57-01.ogg', 'sort_order': 86},
    {'title': 'Лаваж Маткевича: разбор', 'type': 'text', 'msg_ids': [210],
     'tags': ['gut', 'article', 'act'], 'sort_order': 87},
    {'title': 'Гайд по митохондриям', 'type': 'text', 'msg_ids': [223],
     'tags': ['mitochondria', 'fatigue', 'article', 'understand', 'deep_dive'], 'sort_order': 88},
    # ── РАЗОВЫЕ ПОДКАСТЫ ────────────────────────────────────────────────────
    {'title': 'Подкаст: Чтение этикеток', 'type': 'audio', 'msg_ids': [30],
     'tags': ['nutrition', 'audio', 'act'], 'sort_order': 90},
    {'title': 'Подкаст: Правильное питание — подмена понятий', 'type': 'audio', 'msg_ids': [37],
     'tags': ['nutrition', 'audio', 'understand'], 'sort_order': 91},
    {'title': 'Подкаст: Анализ крови — что важно, на что смотреть', 'type': 'audio', 'msg_ids': [45],
     'tags': ['bloodwork', 'audio', 'diagnose'], 'sort_order': 92},
    {'title': 'Подкаст: Баланс макронутриентов', 'type': 'audio', 'msg_ids': [63],
     'tags': ['nutrition', 'audio', 'understand'],
     'content_url': 'podcasts/audio_1@12-08-2024_17-47-06.ogg', 'sort_order': 93},
    {'title': 'Подкаст: Инсулинорезистентность и диабет 2 типа', 'type': 'audio', 'msg_ids': [68],
     'tags': ['insulin', 'audio', 'understand', 'diagnose'], 'sort_order': 94},
    {'title': 'Подкаст: Артриты и артрозы', 'type': 'audio', 'msg_ids': [72],
     'tags': ['joints', 'inflammation', 'audio', 'understand'], 'sort_order': 95},
    {'title': 'Подкаст: Почки и МВП', 'type': 'audio', 'msg_ids': [80],
     'tags': ['kidneys', 'audio', 'understand'], 'sort_order': 96},
    # ── КНИГИ ───────────────────────────────────────────────────────────────
    {'title': '«Синдром усталости надпочечников» — Майкл Лэм', 'type': 'text', 'msg_ids': [89],
     'tags': ['adrenals', 'book'], 'sort_order': 100},
    {'title': '«Блуждающий нерв» — Наваз Хабиб', 'type': 'text', 'msg_ids': [110],
     'tags': ['nervous', 'gut', 'book'], 'sort_order': 101},
    {'title': '«Ненасильственное общение» — Маршалл Розенберг', 'type': 'text', 'msg_ids': [111],
     'tags': ['nervous', 'book'], 'sort_order': 102},
    {'title': '«Протокол Хашимото» — Изабелла Венц', 'type': 'text', 'msg_ids': [113],
     'tags': ['thyroid', 'immunity', 'book'], 'sort_order': 103},
    {'title': '«Эгоистичная митохондрия» — Ли Ноу', 'type': 'text', 'msg_ids': [221],
     'tags': ['mitochondria', 'book'], 'sort_order': 104},
    # ── ГАЙДЫ ───────────────────────────────────────────────────────────────
    {'title': 'Гайд «Противовирусные средства»', 'type': 'pdf', 'msg_ids': [172],
     'tags': ['infections', 'supplements', 'guide', 'act'], 'sort_order': 110},
    {'title': 'Гайд «Спать, чтобы жить»', 'type': 'pdf', 'msg_ids': [187],
     'tags': ['sleep', 'adrenals', 'guide', 'act'], 'sort_order': 111},
    # ── ИССЛЕДОВАНИЯ ────────────────────────────────────────────────────────
    {'title': 'Роль вирусов герпеса в онкогенезе — разбор исследования', 'type': 'text', 'msg_ids': [127],
     'tags': ['infections', 'immunity', 'research', 'understand', 'deep_dive'], 'sort_order': 120},
    {'title': 'Публикация Черевко: пищевая гиперреактивность и микробиота', 'type': 'text', 'msg_ids': [224, 225],
     'tags': ['gut', 'nutrition', 'immunity', 'research', 'understand'], 'sort_order': 121},
]


def parse_messages(html_path):
    """Parse messages.html with BeautifulSoup, return dict msg_id -> text."""
    print(f"Parsing {html_path}...")
    with open(html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    messages = {}
    for div in soup.find_all('div', id=re.compile(r'^message\d+$')):
        mid = int(div['id'].replace('message', ''))
        text_div = div.find('div', class_='text')
        if text_div:
            text = text_div.get_text(separator='\n').strip()
            text = re.sub(r'\n{3,}', '\n\n', text)
            messages[mid] = text
        else:
            messages[mid] = ''

        # Check for voice message
        voice_link = div.find('a', class_=re.compile(r'media_voice_message'))
        if voice_link and mid in messages:
            messages[mid] = (messages.get(mid, ''), voice_link.get('href', ''))

    print(f"Found {len(messages)} messages")
    return messages


def sql_str(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"


def first_meaningful_line(text, max_len=250):
    """Extract first meaningful line for description."""
    if not text:
        return ''
    for line in text.split('\n'):
        line = line.strip()
        # Skip lines that are just emoji, hashtags, reactions, or very short
        clean = re.sub(r'[^\w\sа-яА-ЯёЁ]', '', line).strip()
        if len(clean) > 20:
            return line[:max_len]
    return text[:max_len]


def main():
    messages = parse_messages(MESSAGES_HTML)

    sql_lines = [
        "-- T-PRIVATE-007a: Content import from Telegram channel export",
        f"-- Items: {len(CATALOG)}",
        "",
        "BEGIN;",
        "",
    ]

    total = 0
    missing_msgs = []

    for item in CATALOG:
        title = item['title']
        ctype = item['type']
        msg_ids = item['msg_ids']
        tags = item['tags']
        sort_order = item.get('sort_order', 0)
        content_url = item.get('content_url')

        # Collect texts
        texts = []
        for mid in msg_ids:
            if mid in messages:
                val = messages[mid]
                text = val[0] if isinstance(val, tuple) else val
                if text:
                    texts.append(text)
            else:
                missing_msgs.append(mid)

        full_text = '\n\n---\n\n'.join(texts) if texts else ''
        description = first_meaningful_line(full_text)

        content_url_sql = sql_str(content_url)
        tag_values = ', '.join(f"('{slug}')" for slug in tags)

        sql_lines.append(f"-- [{sort_order}] {title}")
        sql_lines.append(f"""DO $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO private_content (title, description, type, content_url, sort_order, is_published, created_at, updated_at)
  VALUES ({sql_str(title)}, {sql_str(description)}, {sql_str(ctype)}, {content_url_sql}, {sort_order}, true, now(), now())
  RETURNING id INTO v_id;

  INSERT INTO library_item_tags (content_id, tag_slug)
  SELECT v_id, s.slug FROM (VALUES {tag_values}) AS s(slug)
  WHERE EXISTS (SELECT 1 FROM library_tags WHERE library_tags.slug = s.slug)
  ON CONFLICT DO NOTHING;
END;
$$;
""")
        total += 1

    sql_lines += [
        "-- Verify",
        "SELECT type, COUNT(*) FROM private_content GROUP BY type ORDER BY type;",
        "SELECT COUNT(*) AS total_items FROM private_content;",
        "SELECT COUNT(*) AS total_tags FROM library_item_tags;",
        "",
        "COMMIT;",
    ]

    sql = '\n'.join(sql_lines)
    OUTPUT_SQL.write_text(sql, encoding='utf-8')

    print(f"\nGenerated {total} items -> {OUTPUT_SQL}")

    if missing_msgs:
        print(f"Missing messages (no text): {missing_msgs}")

    # Type summary
    from collections import Counter
    type_counts = Counter(item['type'] for item in CATALOG)
    print("By type:", dict(type_counts))

    print("\nFiles with content_url:")
    for item in CATALOG:
        if item.get('content_url'):
            print(f"  msg{item['msg_ids'][0]}: {item['content_url']}")


if __name__ == '__main__':
    main()
