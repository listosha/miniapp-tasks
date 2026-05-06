# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 06.05.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### GEO-DEEPLINKS — Форматы deep link для эфиров и подкастов ✅ (06.05.2026)

**Статус:** ✅ Уточнено

| Тип | Параметр | Пример |
|-----|----------|--------|
| Эфир | `ephir_{число}` | `ephir_1` |
| Подкаст | `podcast_{slug}` | `podcast_statiny-dlitelnyj-priem` |
| Гайд Pro | `guide_{slug}` | `guide_zhelezodeficit` |
| Бесплатный PDF | `freeguide_{slug}` | `freeguide_fodmap-menu-7-dnej` |
| Пост | `post_{число}` | `post_123` |

Платформы: `t.me/listoshenkov_nav_bot/app?startapp={param}` · `max.ru/id771509062005_bot?startapp={param}` · `app.listoshenkov.ru/?section={param}`

---

### GEO-YANDEX — Подключить Яндекс Вебмастер ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- `app.listoshenkov.ru` подтверждён первым (Яндекс требует главный домен сначала)
- `listoshenkov.ru` подтверждён через HTML-файл (`yandex_b6b0f2d6243ef991.html`)
- Sitemap `https://listoshenkov.ru/sitemap.xml` добавлен вручную в Вебмастере ✅

---

### GEO-ROBOTS — Обновить robots.txt для AI-краулеров ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- `/var/www/landing/robots.txt` обновлён: GPTBot, ClaudeBot, PerplexityBot, GoogleBot — все Allow: /
- Проверено: `https://listoshenkov.ru/robots.txt` → 200 OK

---

### GEO-GSC — Подключить Google Search Console ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- Домен `listoshenkov.ru` подтверждён через HTML-файл (`googlea9304201ce210039.html`)
- Sitemap `https://listoshenkov.ru/sitemap.xml` отправлен в GSC ✅
- `/ping` Google упразднил в 2023 — не требуется

---

## GEO-оптимизация listoshenkov.ru — план задач

### GEO-2.3 + GEO-2.1 + GEO-2.2 + GEO-2.4 — Деплой лендинга listoshenkov.ru ✅ (06.05.2026)

**Статус:** ✅ Задеплоено  
**Исполнитель:** CC

- GEO-2.3 ✅ — главная listoshenkov.ru/ → лендинг (редирект на app убран)
- GEO-2.1 ✅ — страницы гайдов (12 шт.) на `/guide/{slug}` → 200 OK
- GEO-2.2 ✅ — страницы бесплатных PDF (9 шт.) на `/free/{slug}` → 200 OK
- GEO-2.4 ✅ — sitemap.xml и robots.txt → 200 OK

Файлы: `/var/www/landing/` (29 файлов: 22 HTML + sitemap + robots + images + CSS)  
nginx: `listen 4443 ssl`, `root /var/www/landing`, `try_files $uri $uri/ $uri.html =404`  
Проверено (6/6): / ✅ · /guide/zhelezodeficit ✅ · /free/fodmap-menu-7-dnej ✅ · /sitemap.xml ✅ · /robots.txt ✅ · /max ✅

> Алексей делает сам: обновить инста-ссылку на `app.listoshenkov.ru`

### Блок 1 — Быстрые правки ✅ (выполнено 06.05.2026)

**GEO-1.1 — Мета-теги в index.html ✅** (commit d286a6e)
- title: «Алексей Листошенков | Разбор анализов и протоколы здоровья»
- meta description, author, canonical, og:type/site_name/locale/url/title/description
- twitter:card, twitter:title, twitter:description

**GEO-1.2 — robots.txt ✅** (commit d286a6e)
- Создан на app.listoshenkov.ru/robots.txt (200 OK)
- Создан на listoshenkov.ru/robots.txt
- Sitemap указан (добавить URL когда будет готов)

**GEO-1.3 — OG-изображение ✅** (commit 28ae3a3)
- og-image.jpg 1200×630px, бежевый фон, фото автора, 6 тегов тем
- Размещена на app.listoshenkov.ru/og-image.jpg (66KB, 200 OK)
- og:image + twitter:image прописаны в index.html

### Архитектура URL (финальная)

```
listoshenkov.ru/                → Главная (об авторе + всё)
listoshenkov.ru/guide/{slug}   → 12 страниц гайдов Pro
listoshenkov.ru/free/{slug}    → 9 страниц бесплатных PDF
listoshenkov.ru/ephir/{slug}   → страницы эфиров
listoshenkov.ru/podcast/{slug} → страницы подкастов
listoshenkov.ru/tema/{slug}    → тематические кластеры
listoshenkov.ru/consultation   → страница консультации
listoshenkov.ru/sitemap.xml    → sitemap
```

Цель: попасть в индекс Google и AI-поисковиков (ChatGPT, Perplexity, Claude).
Каждая страница — витрина: описание + оглавление + CTA в приложение.
Две кнопки CTA: «Открыть в Telegram» и «Открыть в браузере» (startapp-параметры уточнить у Алексея).
Сам контент гайдов и протоколы не выкладываем — только описания.

---

### Фазы реализации

**Фаза 1 (следующая сессия):**
- GEO-2.3 → лендинг на listoshenkov.ru
- GEO-2.1 → страницы гайдов Pro
- GEO-2.2 → страницы бесплатных PDF
- GEO-2.4 → sitemap.xml

**Фаза 2 (следующий спринт):**
- GEO-2.5 → страницы эфиров
- GEO-2.6 → страницы подкастов
- GEO-2.7 → страница консультации

**Фаза 3 (потом):**
- GEO-3.4 → тематические кластеры

---

### Блок 2 — Статические страницы (Фаза 1)

**GEO-2.1 — Страницы гайдов Pro**
- Источник: `/guides/catalog.json` (12 гайдов)
- URL: `listoshenkov.ru/guide/{slug}`
- Содержимое: title, description, оглавление глав, цена, Schema.org `Product`+`Person`, CTA ×2
- Schema.org: `Product` (name, description, author, price, offers) + `Person`

**GEO-2.2 — Страницы бесплатных PDF**
- Источник: `/free-guides/catalog.json` (9 PDF)
- URL: `listoshenkov.ru/free/{slug}`
- Содержимое: title, short, темы, Schema.org `CreativeWork`+`Person`, CTA ×2

**GEO-2.3 — Главная страница-лендинг на listoshenkov.ru**
- Убрать 301-редирект с `listoshenkov.ru` → `app.listoshenkov.ru`
- Блоки сверху вниз: Hero (фото + имя + позиционирование) → Что это (3 тезиса) → Гайды Pro → Бесплатные PDF → Эфиры (последние 3) → Подкасты (последние 3) → Отзывы → Консультация CTA → Footer
- Schema.org: `Person` + `WebSite` + `ItemList`
- После деплоя: обновить инста-ссылку на `app.listoshenkov.ru`

**GEO-2.4 — sitemap.xml**
- Состав: главная + все гайды + все PDF + все эфиры + все подкасты + тематические кластеры + /consultation
- Разместить на `listoshenkov.ru/sitemap.xml`
- Обновить robots.txt — вписать финальный URL sitemap

### Блок 2 — Статические страницы (Фаза 2)

**GEO-2.5 — Страницы эфиров**
- URL: `listoshenkov.ru/ephir/{slug}`
- Источник: Supabase (таблица content, type='efiry')
- Содержимое: название, дата, описание темы, обложка, ссылка на видео, CTA ×2
- Schema.org: `VideoObject`

**GEO-2.6 — Страницы подкастов**
- URL: `listoshenkov.ru/podcast/{slug}`
- Источник: Supabase (таблица content, type='podcast')
- Содержимое: название, описание, темы, плеер или ссылка, CTA ×2
- Schema.org: `PodcastEpisode`

**GEO-2.7 — Страница консультации**
- URL: `listoshenkov.ru/consultation`
- Содержимое: что входит, для кого, как проходит, CTA записаться
- Ключевые запросы: «нутрициолог онлайн», «разбор анализов нутрициолог»
- Schema.org: `Service` + `Person`

### Блок 3 — Schema.org (в рамках блока 2)

**GEO-3.1** — `Product` + `Person` на страницах гайдов (name, description, author, price, offers)
**GEO-3.2** — `Person` + `WebSite` + `ItemList` на главной
**GEO-3.3** — FAQ Schema (3-5 вопросов на гайд) → прямой путь в AI-ответы

### Блок 3 — Тематические кластеры (Фаза 3)

**GEO-3.4 — Тематические кластеры** ⚡ *Самый мощный GEO-инструмент*
- URL: `listoshenkov.ru/tema/{slug}`
- Темы: zhelezo, gormony, schitovidka, kishechnik, son, stress, ves, immunitet
- Каждая страница: экспертный текст 500-800 слов + лучшие посты + релевантный гайд + PDF + эфиры по теме
- Определяет экспертность автора по теме для AI-поисковиков

### Блок 4 — Внешний авторитет (фоново)

**GEO-4.1** — единообразное упоминание «Алексей Листошенков, нутрициолог, Москва» везде
**GEO-4.2** — ссылки на страницы гайдов из постов Telegram-канала (когда страницы появятся)

---

### T-PRIVATE-VOICE-DURATION: Показывать длительность голосового до воспроизведения
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** dev

**Проблема:** до нажатия ▶ время показывает «0:00». Длительность появляется только после первого воспроизведения (когда loadedmetadata срабатывает).

**Причина:** signed URL запрашивается лениво при первом клике, поэтому браузер не знает длину заранее.

**Решение:** сохранять длительность в БД при загрузке файла.
1. При записи голосового — измерять `blob.duration` через `new Audio(URL.createObjectURL(blob))` → `onloadedmetadata`
2. Передавать `duration_sec` в `add_thread_message` / `reply_thread`
3. Добавить колонку `duration_sec integer` в `private_comments`
4. При рендере пузыря — брать `m.duration_sec` и показывать `formatSeconds(m.duration_sec)` вместо «0:00»

---

### T-PRIVATE-VOICE-TRANSCRIPTION: Транскрипция голосовых сообщений через Whisper
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** prod

**Что нужно:** после записи голосового — автоматически расшифровывать его в текст и сохранять рядом с аудио.

**Почему Web Speech API не подходит:** работает только в Google Chrome, не работает в Яндекс Браузере, Comet, Safari, Firefox.

**Решение:** Edge Function `transcribe-voice`:
- Получает storage path голосового файла
- Скачивает его из `voice-messages` bucket
- Отправляет в OpenAI Whisper API (`/v1/audio/transcriptions`, model=`whisper-1`, language=`ru`)
- Возвращает текст → сохраняется в `private_comments.text`

**Стоимость:** ~$0.006/мин = ~₽0.5/мин. Для нескольких голосовых в день — копейки.

**Что нужно для реализации:**
1. OpenAI API ключ → `OPENAI_API_KEY` в docker-compose.yml
2. Edge Function `transcribe-voice` (~60 строк TypeScript)
3. Вызов из фронта: после успешного upload → `api('transcribe_voice', {path, message_id})`
4. Обновить UI: показывать транскрипт под плеером если есть

---

### T-PAYMENT-MAX-002: Проактивная догонялка — написать упавшим пользователям
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** prod

**Когда делать:** когда накопится 10+ событий `purchase_redirect_failed` с реальными пользователями.

**Идея:** раз в день (или вручную) находить пользователей, у которых был технический сбой при оплате (браузер не открылся), но так и не купили — и слать им сообщение от бота.

**Сообщение пользователю:**
> Алексей здесь 👋 Вы недавно смотрели гайд «...», но что-то помешало оплатить. Если нужна помощь — просто ответьте, разберёмся.

**Что нужно сделать:**

1. Миграция: новая таблица `outreach_log (user_id, slug, event_type, channel, sent_at)` — защита от повторных отправок
2. Edge Function `outreach-payment-fail`:
   - Берёт пользователей с `purchase_redirect_failed` за последние 7 дней
   - Исключает тех, кто уже купил (LEFT JOIN purchases)
   - Исключает тех, кому уже писали (LEFT JOIN outreach_log, окно 7 дней)
   - Для каждого: telegram_id → Telegram-бот, max_user_id → MAX-бот
   - Пишет в outreach_log
   - Ограничение: не более 20 отправок за запуск
3. Команда `/outreach` в `tg-bot-webhook`:
   - `/outreach preview` — показывает список кому пойдёт сообщение (без отправки)
   - `/outreach send` — отправляет и подтверждает сколько ушло

**Запуск — только вручную** через `/outreach send` в Telegram-боте. Cron добавить позже когда убедимся что работает нормально.

**SQL для ручного контроля перед запуском:**
```sql
SELECT ae.user_id, u.first_name,
  ae.event_data->>'platform' AS platform,
  ae.event_data->>'slug' AS slug,
  ae.created_at AT TIME ZONE 'Europe/Moscow' AS ts,
  u.telegram_id, u.max_user_id
FROM analytics_events ae
JOIN users u ON u.id = ae.user_id
LEFT JOIN purchases p ON p.user_id = ae.user_id
  AND p.prodamus_order LIKE '%' || (ae.event_data->>'slug') || '%'
  AND p.status = 'paid'
WHERE ae.event_type = 'purchase_redirect_failed'
  AND p.id IS NULL
ORDER BY ae.created_at DESC;
```

---

### T-PAYMENT-MAX-001: Диагностика и фикс конверсии покупок в MAX WebView
**Приоритет:** 🔴 | **Статус:** В работе | **Среда:** dev (часть сделана, часть ждёт данных)

**Проблема:** 74 purchase_start → 10 paid (13.5%). User 667 (MAX, max_user_id 57928504) пытался 4 раза купить «Гормоны и энергия» (990₽) — 0 оплат. Гайд `gormony-energiya` в целом: 5 starts → 0 paid. Гипотеза: встроенный браузер на китайских телефонах (Xiaomi, Huawei, Realme) ломает Prodamus — не открывается, не проходит редирект, или рендерится некорректно.

**Уже сделано (commits aca1f05, e6168eb, 74f1823, 04.05.2026):**
- Debounce кнопки «Купить»: 5 секунд блокировки после первого клика, текст «Открываю оплату...»
- `purchase_start` теперь пишет `platform`, `prodamus_url` (500 символов), `ua` (User-Agent, 250 символов)
- Новое событие `purchase_redirect_failed`: если через 3 секунды после `openLink` страница не ушла в background (visibilitychange не сработал) — значит браузер не открылся
- Fallback-баннер: при возврате без оплаты → оранжевая плашка «Не получилось оплатить? Напишите мне» → `t.me/alex_nutrition` (TG) или MAX-профиль
- Новые события: `purchase_fallback_shown`, `purchase_fallback_clicked`
- Каскад при сбое редиректа: `Platform.openLink` → (3с) → `window.open` → (2с) → модалка с тремя вариантами:
  - «Оплатить прямо здесь» — `window.location.href=payUrl` (открывает Prodamus в том же WebView; `urlSuccess` вернёт обратно)
  - «Скопировать ссылку» — clipboard API + textarea-fallback
  - «Написать Алексею» — контакт по платформе
- Новые события: `purchase_modal_shown`, `purchase_modal_same_window`, `purchase_modal_copy_link`, `purchase_modal_contact`

**Что смотреть через 2–3 дня:**
```sql
-- Появляются ли purchase_redirect_failed?
SELECT event_data->>'platform' AS platform,
       event_data->>'ua' AS ua,
       COUNT(*) AS cnt
FROM analytics_events
WHERE event_type='purchase_redirect_failed'
GROUP BY 1,2 ORDER BY cnt DESC;

-- User-Agent у неконвертирующих
SELECT ae.event_data->>'ua' AS ua,
       ae.event_data->>'platform' AS platform,
       COUNT(*) AS starts,
       COUNT(DISTINCT p.user_id) FILTER (WHERE p.status='paid') AS paid
FROM analytics_events ae
LEFT JOIN purchases p ON p.user_id=ae.user_id AND p.status='paid'
  AND p.paid_at > ae.created_at AND p.paid_at < ae.created_at + INTERVAL '1 hour'
WHERE ae.event_type='purchase_start'
  AND ae.created_at > NOW()-INTERVAL '7 days'
GROUP BY 1,2 ORDER BY starts DESC;
```

**Гипотезы (от наиболее вероятной):**
1. Встроенный браузер телефона не открывает Prodamus — `purchase_redirect_failed` это подтвердит
2. Prodamus открывается, но сломан на конкретном браузере (старый WebView, MIUI Browser и т.д.)
3. Способ оплаты недоступен (нет СБП, нет нужного банка)
4. Prodamus открывается нормально — просто люди передумали

**Следующий шаг (когда будут данные):**
- Если `purchase_redirect_failed` есть → `Platform.openLink` не работает для Prodamus в MAX. Тогда: попробовать `window.open(payUrl)` как fallback, или показывать QR-код / инструкцию для ручной оплаты.
- Если `purchase_redirect_failed` нет → браузер открывается, ломается внутри. Тогда: попросить пользователей скриншот, или добавить urlReturn с параметром `?payment_status=failed` для диагностики.

---

### T-ANALYTICS-BANNER-VERIFY ✅ | T-ANALYTICS-CTA-SCROLL-VERIFY ✅

### T-HOMESCREEN-V4: Умная лента + ротация отзывов ✅
**Приоритет:** 🔴 | **Статус:** Выполнено полностью (последний коммит 0257509)
**Среда:** только dev

---

1. РОТАЦИЯ ОТЗЫВОВ
   Использовать уже существующий _homeSessionOffset(key, len) —
   применить к блоку отзывов так же как к гайдам и подборкам.
   Каждая новая сессия — другая пара отзывов.

---

2. УМНАЯ ЛЕНТА (после всех блоков главной)

Добавить в Edge Function user-data новый action: get_feed
Параметры: topic (string), cursor (int, last post id), limit (int, default 10)
Возвращает: массив items [{type, id, title, topic, emoji, image_url, sauce?}]

Логика формирования батча на сервере:
- Базовый поток: посты по topic, WHERE id < cursor, исключая
  просмотренные (post_view в analytics_events для user_id),
  ORDER BY id DESC, LIMIT 10
- Каждые 6 постов в батче — вставить 1 item типа insert:
  · Сначала непросмотренные эфиры по теме (ephir_open)
  · Затем бесплатные гайды по теме (free_guide_open)
  · Затем Pro гайды — только после того как пользователь
    получил 5+ постов в этой сессии
- Соус (sauce) для вставки гайда — выбирать по контексту:
  · первый показ → 'Хочешь полный протокол?'
  · повторный показ → 'Возвращаешься к теме — всё в одном месте'
  · после эфира в ленте → 'В эфире было вкратце — здесь подробно'

На клиенте (index.html):
- После последнего блока главной — пустой контейнер #homeFeed
- IntersectionObserver на sentinel-элементе в конце страницы →
  вызывает loadFeedBatch()
- loadFeedBatch(): GET user-data?action=get_feed&topic=...&cursor=...
  рендерит карточки трёх типов:
  · post: эмодзи темы + заголовок + подтема → openPost(id)
  · insert efir: обложка + название + длительность → openEfir(id)
  · insert guide: эмодзи + название + соус + цена/FREE → openGuide(id)
- После 20 постов: останавливать автоподгрузку,
  показывать кнопку «Показать ещё»
- Позицию скролла сохранять в sessionStorage при уходе с главной,
  восстанавливать при возврате

Аналитика — писать в analytics_events:
- feed_scroll_start — первый скролл до ленты
- feed_card_view — {type, id, position, topic}
- feed_insert_view — {type, id, position, sauce}
- feed_show_more — клик «Показать ещё»

После реализации: проверить на dev.listoshenkov.ru, отчитаться в TASKS.md.

### T-HOMESCREEN-V3: Подкасты каруселью + бесконечные карусели ✅
**Приоритет:** 🔴 | **Статус:** Выполнено (commit 493fe94)
**Среда:** только dev

1. ПОДКАСТЫ — переделать плитку в горизонтальную карусель
   - Такой же стиль как карусель эфиров и бесплатных материалов
   - Данные: content WHERE type='podcast' ORDER BY sort_order
   - Карточка: обложка или эмодзи, название, длительность, кнопка «▶ Слушать»
   - URL обложек: https://app.listoshenkov.ru/podcasts/<thumbnail> (если есть)

2. ВСЕ КАРУСЕЛИ — сделать бесконечными (зацикленными)
   Затронуть: карусель эфиров, бесплатных материалов, подкастов
   - Реализация: дублировать элементы в DOM (клоны в начало и конец)
   - При достижении конца — бесшовный переход к началу (без анимации прыжка)
   - При достижении начала — бесшовный переход к концу
   - Использовать scroll event + корректировку scrollLeft
   - Без сторонних библиотек, чистый JS

После реализации: проверить на dev.listoshenkov.ru, отчитаться в TASKS.md.

### T-HOMESCREEN-V1: Новая главная — живой editorial layout + умная лента
**Приоритет:** 🔴 | **Статус:** Этап 1 ✅ выполнен, Этап 2 в очереди
**Среда:** только dev (dev.listoshenkov.ru)

---

#### Этап 1: Блочная главная

Переделать верхнюю часть главной index.html. Текущую логику навигации
(openSection, navStack, openPost и т.д.) не трогать — только рендер главного экрана.

Структура сверху вниз:

1. КАРУСЕЛЬ ЭФИРОВ (горизонтальный скролл)
   - Данные: SELECT id, title, duration, thumbnail FROM content WHERE type='efiry' ORDER BY sort_order
   - URL обложек: https://app.listoshenkov.ru/efiry/<thumbnail>
   - Исключать просмотренные: event_type='ephir_open' в analytics_events для текущего user_id
   - Если все просмотрены — показывать все (сброс фильтра)
   - Карточка: фото 94px, overlay с duration, title 2 строки, кнопка «▶ Смотреть»

2. ПЕРСО-ЛЕНТА «Подобрано для тебя»
   - Если quiz_completed=true: 3 поста по top_topic из квиза
   - Исключать просмотренные: event_type='post_view', event_data->>'post_id'
   - Если квиз не пройден: одна карточка-приглашение «Пройди квиз — подберём материалы для тебя»
   - Кнопка «Ещё подборки по твоим темам →» → открывает раздел подборок

3. СЕТКА 2×2 — текущие разделы меню (перенести как есть)
   Полезные игры, Гайды Pro, Волшебные таблетки, Консультация

4. РАСШИРЕННАЯ КАРТОЧКА «Подборки по темам»
   - Теги тем чипами (из topics)
   - 3 последних поста, кнопка «Открыть все →»

5. РАСШИРЕННАЯ КАРТОЧКА «Бесплатные материалы»
   - 2 превью из content WHERE type='free_guide'
   - Исключать просмотренные: event_type='free_guide_open', event_data->>'slug'
   - Кнопка «Смотреть все N материалов →»

6. УТИЛИТАРНЫЕ ПЛИТКИ
   - Подкасты, Отзывы, Скидка на анализы (последняя — на всю ширину)

Дизайн-токены без изменений: фон #f5f0e8, текст #3d2e1f, акцент #c4724a, шрифт Nunito.

---

#### Этап 2: Умная лента под блоками

После блока 6 — вертикальная лента контента. Подгружается при скролле к концу.

ЛОГИКА ПОДБОРА (приоритет по порядку):
1. Посты по top_topic из квиза, которые пользователь не читал
2. Каждые 5-7 постов — вставка другого формата:
   - Эфир по той же теме (не просмотренный)
   - Бесплатный гайд по теме — с контекстным соусом зависящим от триггера:
     · после 3+ постов по теме → «Хочешь полный протокол?»
     · после эфира по теме → «В эфире было вкратце — здесь всё подробно»
     · повторный показ гайда → другой угол, не скрывать
   - Голосовое/подкаст по теме (если есть)
3. Один и тот же гайд можно показывать несколько раз — каждый раз с новым контекстным соусом
4. Коммерческие вставки (Pro гайды) — не раньше чем после 5 полезных карточек

МЕХАНИКА:
- Батч: 10 карточек за раз
- Порог подгрузки: за 3 карточки до конца
- После 20 карточек: автоподгрузка останавливается, кнопка «Показать ещё»
- Восстановление позиции скролла при возврате из поста (sessionStorage)
- Skeleton-loader во время подгрузки

АНАЛИТИКА (новые события):
- feed_scroll_start — первый скролл до ленты
- feed_card_view — {type, id, position, topic}
- feed_insert_view — {type: 'efir'|'guide'|'podcast', id, position, sauce}
- feed_show_more — нажатие «Показать ещё»

---

После реализации: проверить на dev.listoshenkov.ru, отчитаться в TASKS.md.

### T-PRIVATE-017: Финальное тестирование — полное покрытие ✅

### T-PRIVATE-016: Финальное тестирование prod ✅

### T-PRIVATE-015: Ближний круг — GitHub Actions + перенос dev → prod ✅

### T-PRIVATE-014: Ближний круг — Zoom + Дневник + Курс + pg_cron ✅

### T-PRIVATE-013: Ближний круг — справочник маркеров ✅

### T-PRIVATE-012e+f: Ближний круг — безопасность, изоляция данных, мобильный UX ✅

### T-PRIVATE-012d: Ближний круг — граничные случаи и стресс-тесты ✅

### T-QUIZ-PROMPTS: Квиз-промпты — доработка по аналитике путей
**Приоритет:** 🟡 | **Статус:** На паузе (ждём данные за несколько дней)

---

## ✅ Выполнено (05.05.2026, сессия 2)

### T-ANALYTICS-CTA-SCROLL-VERIFY: Нулевые события — диагноз и фикс ✅ (commit 0564727 → main)
**Файл:** `index.html`

**Диагноз и решения по трём проблемам:**

**post_cta_click = 0** — Карточка гайда рендерилась ПОСЛЕ всего текста поста. Пользователи читали и уходили назад, не долистывая до карточки. Фикс: `ctaHtml` перенесён ВЫШЕ `.post-body` — теперь карточка видна сразу при открытии поста, между датой и текстом.

**guide_review_shown = 0** — `IntersectionObserver` на блоке отзывов имел `threshold: 0.5` — событие срабатывало только при 50% видимости блока, что на мобильном при быстром скролле почти никогда. Фикс: `threshold: 0.5 → 0.1`.

**guide_detail_scroll = 0** — `threshold: 1.0` на `height:1px` якоре. 100% видимость 1px-элемента физически невозможна на мобильном из-за subpixel rendering. Фикс: `threshold: 1.0 → 0.2`.

**feed_scroll_start/card_view/insert_view = 0** — Первый батч ленты ждал пока пользователь доскроллит через 6 блоков главной (~1500px). Никто не доскролливал. Фикс: добавлен `_feedFire()` в конец `initHomeFeed()` — первые 10 постов грузятся сразу при открытии главной.

### T-ANALYTICS-BANNER-VERIFY: welcome_banner_personalized_shown — диагноз ✅
Код фикса (eea0cb4) оказался уже в `main` — задача в описании была ошибочной. Все 11 топиков квиза покрыты в `QUIZ_TOPIC_BANNER`. Нулевые события — статистика: мало пользователей одновременно соответствующих всем 4 условиям (welcome_seen + quiz + топик + не куплен гайд). Код верный, ждём накопления базы.

---

## ✅ Выполнено (05.05.2026)

### auto-publish: снижена частота крона ✅ (commit c0fe05d → main)
Частота запуска `auto-publish.yml` снижена с `*/5` до `*/15` минут — экономия ~3× минут GitHub Actions. Причина: воркфлоу падал с «All jobs were cancelled» из-за сбоя инфраструктуры GitHub (Internal server error на стороне GitHub, не наш код).

### T-PRIVATE-CHAT-UX: Фиксы чата Ближнего круга ✅ (commit d352f97 + 80805d4 → dev)
**Файл:** `private/index.html`

Четыре UX-фикса:

1. **Длительность голосовых** — `timeupdate` теперь показывает обратный отсчёт (`duration − currentTime`) вместо `currentTime`. Во время воспроизведения видно сколько осталось.

2. **Текст в пузырях** — `font-size: 15px → 16px` в `.chat-bubble`.

3. **Текст в поле ввода** — `font-size: 15px → 16px` в `.chat-textarea`. Побочный эффект: убирает авто-зум iOS Safari при фокусе на инпут.

4. **Клавиатура перекрывала поле ввода (iOS)** — добавлен `visualViewport.resize` listener: при открытии клавиатуры `#icApp` сжимается до `visualViewport.height`, `window.scrollTo(0,0)` сбрасывает авто-скролл iOS, `.chat-messages` прокручивается к низу. Проверено на iPhone 14, Яндекс Браузер.

### T-PRIVATE-NOTIFICATIONS: Уведомления через MAX и email ✅ (commit 79ca05b + 2964921 → dev, задеплоено на VPS)
**Файл:** `supabase/functions/private-admin/index.ts`

До этого уведомления работали только через Telegram. Добавлены два новых канала:

- **`notifyMax(maxUserId, text)`** — отправка через MAX Bot API (`platform-api.max.ru/messages?user_id=...`), использует `MAX_BOT_TOKEN`
- **`notifyEmail(email, subject, html)`** — отправка через Resend API (тот же ключ и домен что для OTP-кодов), от `Listoshenkov.RU <noreply@listoshenkov.ru>`
- **`notifyUser(u, ...)`** — вспомогательная функция: вызывает все три канала параллельно через `Promise.allSettled`

Обновлены 4 action-а (уведомляют по всем доступным полям пользователя):
- `reply_thread` — ответ в чате
- `add_recommendation` — новые рекомендации
- `extend_access` — продление доступа
- `send_expiry_notifications` — напоминание об истечении (также добавлены `max_user_id, email` в SELECT)

Ежедневная сводка (`send_daily_summary`) уведомляет только администратора — оставлена только TG.

**Проверено:** email-уведомление пришло на `listosha@yandex.ru` после тестового ответа в чате.

---

## ✅ Выполнено (03.05.2026, сессия 3)

### МЕРЖ dev → main ✅ (commit 489ede9)
**Среда:** production (app.listoshenkov.ru)

- `git merge dev --no-ff` → конфликт в `index.html` (main имел старую nav-list, dev — новую home-blocks)
- Резолв: взята dev-версия целиком, `IC_HIDDEN_BK` сохранён
- `git push origin main` → GitHub Actions `deploy-main.yml` → rsync на `/var/www/app/`
- Проверка: `https://app.listoshenkov.ru/` → **HTTP 200** ✓, `home-blocks` на проде ✓, `IC_HIDDEN_BK` ✓

## ✅ Выполнено (03.05.2026, сессия 2)

### T-HOMESCREEN: Умная лента — финальные фиксы ✅ (коммиты ed4dccb → 0257509)
**Файлы:** `index.html` (dev), `user-data/index.ts` (VPS)

**Ключевые баги и решения:**

1. **Лента не грузилась на мобильном** — `IntersectionObserver` не перефаерился если sentinel оставался видимым после батча. Решение: `setTimeout(loadFeedBatch, 300)` как единственный триггер между батчами (не зависит от IO/scroll/браузера).

2. **Infinite retry loop** — после ошибки fetch `catch` → `_feedLoading=false` → scroll немедленно запускал новый запрос → бесконечный цикл красных ошибок. Решение: `_feedFailCount` — после 2 ошибок подряд `_feedDone=true`.

3. **`_feedObserve` блокировался флагом** — вызывался пока `_feedLoading=true`, IO фаерил, видел флаг, выходил, потом флаг сбрасывался — но IO уже не перефаерится. Решение: `_needReattach` флаг, `_feedLoading=false` первым, потом действия.

4. **Лента не работала в Яндекс браузере** — `fetch` к edge function падал (content blocker). Решение: **полный отказ от API** — данные берутся из `allPosts` в памяти. Никаких сетевых вызовов в ленте.

5. **`next_cursor=null` после просмотра постов** — cursor брался из последнего отфильтрованного поста (не загруженного). Решение в edge function: `nextCursor = allFetched[last].id`.

6. **Квиз-стикер перекрывал ленту** — светло-коричневая полоса `position:fixed;bottom:70px` закрывала кнопку «Показать ещё». Решение: скрываем стикер при первой загрузке ленты.

7. **Фоллбек на все темы** — если по теме квиза < 20 постов, лента показывает все темы (иначе тихо останавливалась).

**Итоговая архитектура ленты:**
- Источник данных: `allPosts` (уже в памяти после старта)
- Триггер первого батча: IO + scroll (`innerHeight+scrollY >= body.offsetHeight-300`)
- Триггер между батчами: `setTimeout(300ms)` — гарантированно работает везде
- 20 постов → кнопка «Показать ещё» (с `margin-bottom:80px` чтобы не перекрывалась)
- Вставки каждые 6 постов (round-robin): эфир → бесплатный гайд → подкаст → промо → Pro гайд
- `topicsIconMap` (id→slug) для матчинга тем эфиров/гайдов в вставках

**Также в этой сессии:**
- Эфир-плашки в ленте: `object-fit:contain` (полная картинка, не кадрированная), 110×70px
- `scrollIntoView` на кнопке убран (вызывал автопрокрутку в Safari)
- `_feedChunkCount` — счётчик в текущем чанке, сбрасывается при кнопке

## ✅ Выполнено (03.05.2026)

### T-HOMESCREEN-V4: Умная лента + ротация отзывов ✅ (commit e1b3612)
**Файлы:** `index.html` (dev), user-data edge function (VPS)

**Ротация отзывов**: `_homeSessionOffset('reviews', len)` уже применялась — была нерабочей из-за `.limit(2)` в запросе и `.slice(0,2)` перед вызовом. Фикс в предыдущей сессии уже устранил оба.

**Умная лента:**
- `get_feed` в edge function `user-data`: cursor-based пагинация, исключает просмотренные через `analytics_events`, работает без session_token.
- `#homeFeed` контейнер + `#homeFeedSentinel` (1px) после home-blocks.
- `IntersectionObserver` (rootMargin: 300px) → `loadFeedBatch()`.
- Батч: 10 постов, лимит 20, потом кнопка «Показать ещё».
- Вставки каждые 6 постов: сначала эфир по теме → бесплатный гайд → Pro гайд (после 5+ постов). Соус: «Хочешь полный протокол?» / «В эфире было вкратце» / «Возвращаешься к теме».
- Аналитика: `feed_scroll_start`, `feed_card_view`, `feed_insert_view`, `feed_show_more`.
- `topicsSlugMap` (id→slug) добавлен для матчинга тем эфиров/гайдов.

### T-HOMESCREEN-V3: Подкасты + бесконечные карусели ✅ (commit 493fe94)
**Файлы:** `index.html` (dev branch)

1. **Подкасты-карусель** — плитка заменена горизонтальной каруселью. `loadPodcastsCatalog()` → 6 карточек: 🎧 + длительность + название + «► Слушать» → `openPodcastPlayer(id)`. Реиспользует `.free-carousel-*` стили.
2. **Бесконечный скролл** — `makeInfiniteCarousel(el)` работает для всех трёх каруселей (эфиры, бесплатные, подкасты). Техника: 3x дублирование DOM (prefix + real + suffix), `scroll`-listener корректирует `scrollLeft` без анимации прыжка. `{passive:true}` — не блокирует touch-события.

### T-HOMESCREEN-V1 Этап 1: Блочная главная ✅ (commit ce371e0)
**Файлы:** `index.html` (dev branch)

6 блоков реализованы:
1. **Карусель эфиров** — горизонтальный скролл, исключает просмотренные (по `ephirWatchProgress`), показывает все если все просмотрены. Карточка 140px: фото 94px + duration overlay + title 2 строки + кнопка «▶ Смотреть».
2. **Персо-лента «Подобрано для тебя»** — 3 поста по top_topic из квиза (`QUIZ_TOPIC_POST_ID` → `topicsMap`), исключает просмотренные в сессии; кнопка «Ещё →» → podborki. Если квиз не пройден — приглашение.
3. **Сетка 2×2** — Полезные игры, Гайды Pro, Волшебные таблетки, Консультация. IC_HIDDEN_BK сохранён.
4. **Расширенная карточка «Подборки по темам»** — чипы первых 6 тем + 3 последних поста, кнопка «Открыть все →».
5. **Расширенная карточка «Бесплатные материалы»** — 2 превью из free-guides/catalog.json + счётчик всех материалов.
6. **Утилитарные плитки** — Подкасты + Отзывы в ряд, Скидка 20% на всю ширину.

`initHomeBlocks()` вызывается после `postsLoaded=true` в `init()`. Навигационная логика не тронута. Legacy nav rows сохранены скрытыми.

### T-HOMESCREEN-DATA: Данные для макета главной ✅

**Публичный URL обложек эфиров:**
```
https://app.listoshenkov.ru/efiry/<thumbnail>
```
Файлы лежат как статика на VPS (`/var/www/app/efiry/`). Supabase Storage здесь не используется.
Проверено: `https://app.listoshenkov.ru/efiry/05_shchitovidka_nelzya.jpg` → **200 OK**.

**Все эфиры (20 шт.):**

| id | title | duration | thumbnail |
|----|-------|----------|-----------|
| efiry-1 | 5 вещей, которые гробят вашу щитовидку | 5:11 | 05_shchitovidka_nelzya.jpg |
| efiry-2 | Что скрывают производители БАДов? | 8:23 | 01_gala_artlife.jpg |
| efiry-3 | 3 ошибки, которые убивают эффект от добавок | 27:52 | 02_conf_artlife_2023.jpg |
| efiry-4 | Щитовидка на износ: чем опасен гипертиреоз | 38:37 | 10_gipertireoz.jpg |
| efiry-5 | 80% людей едят неправильно. А вы? | 1:41:24 | 19_pravila_pitaniya.jpg |
| efiry-6 | ТТГ в норме? Это ещё ничего не значит | 1:00:22 | 06_shchitovidka_analizy.jpg |
| efiry-7 | Статины: пить или бросить? Разбор без паники | 58:28 | 20_statiny.jpg |
| efiry-8 | Почему вы болеете, даже если пьёте витамины | 1:03:04 | 14_immunitet.jpg |
| efiry-9 | Витамин D без магния — деньги на ветер | 41:21 | 23_vitamin_d_mg.jpg |
| efiry-10 | Как починить ЖКТ без таблеток | 2:15:15 | 13_zdorovoe_pischevarenie.jpg |
| efiry-11 | Ваш кишечник управляет вашим мозгом | 59:36 | 12_zagadochnoe_pischevarenie.jpg |
| efiry-12 | Печень молчит, пока не поздно. Какие анализы сдать? | 54:42 | 07_pechen_analizy.jpg |
| efiry-13 | Щитовидка: Анализы, которые врач не назначит | 1:00:22 | 08_analizy_shchitovidka.jpg |
| efiry-14 | Спите 8 часов, а сил нет? Виноваты надпочечники | 1:00:59 | 21_nadpochechniki.jpg |
| efiry-15 | Скрытый враг: почему вы полнеете и устаёте | 58:35 | 15_insulinorezistentnost.jpg |
| efiry-16 | Какие анализы реально нужны, а какие — деньги на ветер | 1:21:00 | 18_lab_issledovaniya.jpg |
| efiry-17 | Железо на нуле, а щитовидка тормозит. Что делать? | 1:23:47 | 11_zhelezo_shchitovidka.jpg |
| efiry-18 | Магний: почему вы принимаете его зря | 29:09 | 03_artlife_magniy.jpg |
| efiry-19 | Гастрит не пройдёт сам. Вот что реально поможет | 1:04:32 | 22_gastrit.jpg |
| efiry-20 | Блогер или врач? Кому верить в вопросах здоровья | 1:03:17 | 17_kogo_slushaete.jpg |

---

## ✅ Выполнено (02.05.2026)

### T-PRIVATE-017: Финальное тестирование — 56/56 ✅
**56/56 (100%)** — `test_017.js` (Playwright + API + DB, app.listoshenkov.ru)

| Блок | Результат |
|------|-----------|
| 1. Бизнес-логика | **18/18** |
| 2. Голосовые и файлы | **4/4** |
| 3. Маркеры | **3/3** |
| 4. CRUD близких | **4/4** |
| 5. Lifecycle контента | **5/5** |
| 6. Zoom полный цикл | **6/6** |
| 7. Рекомендации | **3/3** |
| 8. Комбинированные фильтры | **3/3** |
| 9. Треды с анализами | **2/2** |
| 10. Производительность | **8/8** |

**Найдено и исправлено 3 бага:**
1. **upload_url содержал `http://kong:8000`** — внутренний Docker hostname. Фикс: заменяем на `https://uckuyoyubub.beget.app` в `get_voice_upload_url` и `get_analysis_upload_url`
2. **`add_content` (admin) не передавал `expires_at`** — контент с истёкшим сроком оставался виден. Добавлен параметр в INSERT
3. **Тест T13 передавал `{}` вместо `uid=1`** — синтаксическая ошибка в коде теста

### T-PRIVATE-016: Финальное тестирование prod — 52/52 ✅
**52/52 (100%)** — `test_prod.js` (Playwright + API, app.listoshenkov.ru)

| Блок | Результат |
|------|-----------|
| 1. Новый функционал (Zoom, Дневник, Курс, pg_cron) | **14/14** |
| 2. Prod-специфичные (HTTP, CORS, Nginx, BK карточка) | **10/10** |
| 3. Регрессия (API, хаб, профиль) | **8/8** |
| 4. Производительность | **6/6** _(лендинг 180ms, SPA 169ms, библиотека 160ms, табы max 125ms)_ |
| 5. Сценарии пользователя | **8/8** |
| 6. Целостность данных (DB) | **6/6** |

**Найдено и исправлено в процессе:**
1. **`complete_lesson` → `user_progress`**: таблица имеет `lesson_id` как PK+FK на `course_lessons` — создана отдельная `private_course_progress (user_id, content_id, completed_at)`, `get_course` и `complete_lesson` переведены на неё
2. **`payment=success` + `hasAccess=true` показывал лендинг**: в `init()` ветка `isPaymentReturn&&hasAccess` не вызывала `hide('icLanding')` — добавлен явный `hide()`
3. **`finally()` блок показывал лендинг при активном welcome overlay**: добавлена проверка `document.querySelectorAll('.ic-overlay.active').length>0`

### T-PRIVATE-015: GitHub Actions + перенос dev → prod ✅
- Workflow `deploy-main.yml` уже включает rsync `./ → /var/www/app/` — `private/` не нужно добавлять отдельно
- Скопированы `/var/www/dev/private/index.html` (2938 строк) и `admin.html` в `~/miniapp/private/`
- Commit: `feat: Ближний круг — private section v1 (T-001 through T-014)` + push → GitHub Actions задеплоил
- **HTTP 200** `https://app.listoshenkov.ru/private/` ✓
- **CORS** с `app.listoshenkov.ru` → `Unauthorized` (правильный ответ на invalid token) ✓
- **IC_HIDDEN_BK** в prod `index.html` — скрыто ✓ (карточка БК не показывается)
- `/private/` на prod содержит «Ближний круг» × 5 ✓

### T-PRIVATE-014: Zoom + Дневник + Курс + pg_cron ✅
**Блок А — Zoom-разборы в библиотеке:** кнопка «📹 Разборы» в type-strip библиотеки → `loadZoomSection()` — предстоящие события (карточки с датой и кнопкой «Буду»/«Записан» через `register_zoom`), мои записи (`get_my_recordings`), открытие через `get_content` signed URL. Пустое состояние с текстом.

**Блок Б — Дневник:** `addJournalEntry()` заменена на bottom sheet — форма с textarea + история записей (`get_journal`), сохранение через `add_journal_entry`, список с датами и текстом.

**Блок В — Курс в хабе:** `get_course` добавлен в hub data loading параллельно с 6 другими запросами. Карточка «Мой прогресс» в хабе: прогресс-бар X/Y уроков, кнопка «Продолжить/Курс завершён» → `openCourseTab()`. Курс в библиотеке: список уроков с чекбоксами `complete_lesson`.

**Блок Г — pg_cron + private-admin:**
- 3 pg_cron задачи на production: `private-daily-summary` (09:00), `private-expiry-notify` (10:00), `private-hide-expired-recordings` (10:00)
- `send_daily_summary`: собирает 4 счётчика → уведомляет admin TG. Тест: ok=True, active=2, unread=9
- `send_expiry_notifications`: находит пользователей с истечением через 7 и 1 день → уведомляет TG
- Cron-токен: SERVICE_ROLE_KEY передаётся напрямую (bypass в private-admin для cron-вызовов)

### T-PRIVATE-013: Ближний круг — справочник маркеров ✅
- **77 маркеров** залиты в `analysis_markers` на production: оак(16) · железо(7) · гормоны(10) · минералы(10) · витамины(4) · белки(4) · ферменты(6) · липидограмма(6) · щитовидная(7) · углеводы(4) · билирубин(3)
- `ref_ranges` убраны из SELECT в `get_markers_catalog` и `search_markers` — клиенту не отдаются, в БД хранятся
- `search_markers q="гемо"` → 1 результат, `ref_ranges` в ответе: нет ✓
- Нюанс: исходный SQL использовал JSON-формат `'["RBC"]'` для `aliases TEXT[]` — создан `import_markers_fixed.sql` с PostgreSQL-форматом `'{RBC}'`

### T-PRIVATE-012e+f: Безопасность + изоляция + мобильный UX ✅
**25/25 ✓ — уязвимостей не обнаружено** — `test_security.js` (Playwright + API)

**Изоляция (5/5):** user1 не видит threads/анализы/мед.карту user2 · get_analyses строго по user_id · тексты user1 не утекают в threads user2 *(user_id умышленно скрыт из ответа get_my_threads — не уязвимость)*

**Попытки взлома (5/5):** user_id injection в body → игнорируется, записывается от токена · save_health_profile с чужим user_id → к своей карте · toggle чужой рекомендации → без эффекта · SQL-инъекция `'; DROP TABLE users; --` → хранится как plain text, таблица цела · XSS `<script>alert()...</script>` → экранируется `esc()`, alert не сработал, тег не в DOM

**Права доступа (7/7):** user2 → admin.html «Нет доступа: Forbidden» · user2 → private-admin 403 · extend_access 403 · add_recommendation 403 · неверная подпись → 401 · несуществующий uid=99999 → hasAccess=false · токен 31+ день → 401

**Мобильный UX (8/8):** 375px tabsScroll=623 clientWidth=375 overflow=auto · 390px sidebar=none tabs=true · 768px sidebar=block mobileTabs=none · длинное имя 64 chars bodyWidth=390 · длинный текст без overflow · длинное название анализа 390px · bottom sheet top=488 height=356 · десктоп сайдбар подсвечивает активный таб

### T-PRIVATE-012d: Ближний круг — граничные случаи 25 тестов ✅
**25/25 ✓** — `test_edge.js` (Playwright, мобильный + десктоп)

**Негативные (7/7):** невалидный токен → лендинг · истёкший токен → быстрый фейл (74ms) · timeout API → не белый экран · пустое сообщение → не отправляется · пустое имя близкого → алерт · анализ без файла → шаг 3 достижим · комментарий >2000 → «Text too long»

**Доступ (3/3):** без подписки → лендинг · истёкшая вчера → лендинг · истекает через 5 дней → оранжевый баннер «Доступ заканчивается через 5 дн.»

**Состояния данных (9/9):** пустой хаб без краша · 50 материалов + скролл · фильтр thyroid (50→3) · поиск «Иммунитет» → 13 · поиск несуществующего → «Ничего не найдено» · пустая мед. карта → ok · 10 диагнозов сохранены · препараты сохранены · данные после F5

**Admin-граничные (4/4):** 0 дней → «user_id and days required» · 400 дней → «days must be 1-365» · пустой ответ → «text or voice_url required» · скрытый материал исчезает и восстановлен

**Производительность (2/2):** библиотека 50 материалов за **62ms** · переключение табов max **108ms** avg **53ms**

**Найдено и исправлено 2 бага:**
1. **upsert `user_health_profile` с NULL `dependant_id`** — PostgreSQL UNIQUE на nullable-колонке создавал дубликаты вместо UPDATE. Добавлены partial unique indexes + код `save_health_profile` изменён на DELETE+INSERT
2. **`showSPA()` перезаписывала `_activeTab` через `restoreNavState()`** — deep links `?section=` игнорировались (был починен ранее в T-012b)

### T-PRIVATE-012c: Ближний круг — админ-сценарии 7-12 ✅
**6/6 ✓** — `test_admin.js` (Playwright, десктоп 1280×900)

S7 дашборд ✓ · S8 ответ в переписке + бейдж ✓ · S9 анализ → рекомендация → хаб ✓ · S10 продление доступа ✓ · S11 добавить контент → видно в библиотеке ✓ · S12 admin→user бейдж + исчезает после открытия ✓

**Починено:** кнопка «+ Рекомендация» добавлена в admin.html; `refreshChat()` вместо reset `_chatLoaded` (let-scope); фильтр анализов → 'all' до проверки; keyboard-отправки → `sendAdminReply()` через evaluate

**Рекомендую дополнительно проверить (не автоматизировано):**
- Голосовые сообщения в чате (требует микрофон в браузере)
- Загрузка файлов анализов с реальным файлом
- Zoom-события (нет тестовых данных)
- Работа в реальном Telegram/MAX WebApp (Platform.getUser, CORS)
- Оплата через Prodamus (нужен тестовый платёж)

### T-PRIVATE-012b: Ближний круг — навигационные сценарии ✅
- 6/6 Playwright-сценариев навигации — все прошли
- **S1** ✓ «← В Навигатор» → URL = `/?return=true`
- **S2** ✓ `?section=labs` → таб Анализы активен (с багфиксом)
- **S3** ✓ Хаб «Загрузить» → switchTab('labs')
- **S4** ✓ Анализ → «Задать вопрос» → switchTab('chat')
- **S5** ✓ F5 сохраняет таб через `private_nav_state` в localStorage
- **S6** ✓ `?payment=success` с токеном → Welcome overlay активен, лендинг скрыт
- **Баг найден и исправлен на dev**: `showSPA()` вызывала `restoreNavState()` внутри, перезаписывая `_activeTab` из `?section=` param → `switchTab` получал 'home' вместо нужного таба

### T-PRIVATE-012: Ближний круг — автотестирование на dev ✅

### T-PRIVATE-011: Ближний круг — минимальная админка ✅

### T-PRIVATE-010: Ближний круг — таб «Профиль» ✅

### T-PRIVATE-009: Ближний круг — таб «Анализы» ✅

### T-PRIVATE-008: Ближний круг — таб «Алексей» (переписка + голосовые) ✅

### T-QUIZ-PROMPTS: Квиз-промпты — доработка по аналитике путей
**Приоритет:** 🟡 | **Статус:** На паузе (ждём данные за несколько дней)

---

## ✅ Выполнено (02.05.2026)

### T-PRIVATE-012: Ближний круг — автотестирование на dev ✅
**API-тесты (curl): 13/13 ✓**
`check_access` (hasAccess=true, 90 дней) · `get_library` (45 материалов) · `get_health_profile` · `get_analyses` · `get_my_threads` · `get_dependants` · `get_zoom_events` · `get_markers_catalog` · `search_markers` · `add_journal_entry` · `get_journal` (запись появилась) · `add_thread_message` · `get_my_threads` (сообщение появилось)

**UI-тесты (Playwright Chromium): 12/12 ✓**
T1 лендинг без токена · T2 лендинг а не SPA · T3 SPA с токеном · T4 Материалы 45 карточек · T5 детальный экран материала · T6 чат форма · T7 отправка сообщения · T8 Анализы кнопка · T9 Карта форма · T10 Профиль «Доступ активен» · T11 admin.html заблокирован · T12 admin дашборд счётчики (1,2,0,0)

Скрипт: `test_private.js`. Нюанс: вместо `page.click('[data-tab=...]')` используется `page.evaluate(()=>switchTab(...))` — мобильные табы в headless кликаются ненадёжно.

### T-PRIVATE-011: Ближний круг — минимальная админка ✅
- `/var/www/dev/private/admin.html` — отдельная страница, доступна только admin (user_id=1 с корректным hex HMAC токеном)
- private-admin edge function переключена на hex HMAC (то же что private-data) — убрал зависимость от отдельного токена; токен читается из `localStorage.session_token`
- **Дашборд**: 4 счётчика (`get_daily_summary`) + быстрые кнопки навигации
- **Переписка**: список веток по пользователям (фильтр непрочитанные/все), чат-интерфейс справа, `reply_thread` (Ctrl+Enter), `mark_read` при открытии
- **Анализы**: таблица всех анализов (`get_all_analyses`), фильтр новые/просмотренные, `review_analysis`, `reply_thread` с `thread_type='analysis_review'`
- **Подписчики**: таблица (`get_subscribers`) с датой доступа и днями, `extend_access` через modal
- **Контент**: список материалов (`get_library`), форма `add_content` (тип, описание, URL, теги), `hide_content`
- Дизайн по admin-styles.css (`.adm` scope, тёмно-синяя акцентура, плотный рабочий интерфейс)
- Ссылка «⚙️ Админка» появляется в сайдбаре user-SPA если uid=1

### T-PRIVATE-010: Ближний круг — таб «Профиль» ✅
- **Подписка**: дата, кол-во дней, оранжевое предупреждение если ≤7 дней; кнопка «Продлить» → modal с тарифами 30/90 дней (цены учитывают _isSenior)
- **Пенсионер**: toggle → `set_senior` (новый action добавлен в private-data + edge function переразвёрнута)
- **Мои близкие**: `get_dependants` → карточки с аватаром и отношением; modal «Добавить» → `add_dependant`; клик → `edit_dependant`
- **Уведомления**: 4 toggle (ответы, материалы, разборы, анализы) в localStorage (`priv_notif_*`), default = on
- **Помощь**: кнопка «Написать Алексею» → modal с TG/MAX/email; кнопка «Доступ не появился» → `add_thread_message` + modal

### T-PRIVATE-009: Ближний круг — таб «Анализы» ✅
- **Список**: `get_analyses` → карточки (иконка типа, лаборатория, дата, бейдж новый/просмотрено); пустое состояние
- **Загрузка 4 шага**: Шаг 1 — 7 карточек типов; Шаг 2 — файл (input capture=environment → `get_analysis_upload_url` → PUT), лаборатория, дата; Шаг 3 — показатели с autocomplete (`search_markers` debounce 300ms), dropdown единиц, «Добавить свой»; Шаг 4 — жалобы текст + голосовое (переиспользован компонент из чата)
- После сохранения: `upload_analysis` → `save_markers`
- **Просмотр**: шапка (тип + лаб + дата), файл по клику (`openLabFile`), голосовой плеер, заметки, таблица показателей с подсветкой (`lab-val-low`/`lab-val-hi` при выходе за ref_ranges)
- **«Задать вопрос»**: `add_thread_message(thread_type='analysis_review', analysis_id)` → переключает на таб «Алексей»
- Все onclick с кавычками заменены на data-атрибуты + хелперы (паттерн из T-PRIVATE-008)

### T-PRIVATE-008: Ближний круг — таб «Алексей» ✅
- Чат-интерфейс по дизайну screens.jsx: шапка с аватаром «А», область сообщений (bg-soft), фиксированный footer с инпутом
- Пузыри: мои — справа (accent), Алексей — слева (bg-card + аватар), разделители по датам
- Голосовые в пузыре: мини-плеер с play/pause, волновая анимация, таймер; `data-pid` + addEventListener (inline onclick избегали из-за проблем с кавычками)
- Отправка текста: Ctrl+Enter или кнопка, `add_thread_message`
- Запись голосового: `getUserMedia` + `MediaRecorder` (webm/opus), таймер 0:00→5:00, кнопки «Отменить» / «✓ Отправить», автостоп на 5 мин; `get_voice_upload_url` → PUT → `add_thread_message(voice_url)`
- Бейдж непрочитанных на мобильном табе и сайдбаре (is_from_admin && !is_read_by_user)
- Шрифты соответствуют установленному масштабу (17-18px)

### T-PRIVATE-007: Ближний круг — таб «Материалы» (только dev) ✅
- Шаг 0a: `/var/www/app/private/` скопирован в `/var/www/dev/private/`
- Шаг 0b: карточка «Ближний круг» 🌿 скрыта в `/var/www/app/index.html` (prod) через HTML-комментарий `<!-- IC_HIDDEN_BK -->`; dev не тронут
- Таб «Материалы» реализован на dev (`/var/www/dev/private/index.html`):
  - **Список**: `get_library` → фильтры по типу (Все/Статьи/Видео/Аудио/PDF), фильтры по теме (19 topic-тегов), поиск по названию/описанию
  - **Карточка**: цветной cover по теме, тип-бейдж, название, описание
  - **Детальный просмотр**: аудио-плеер (play/pause, прогресс-бар, seek, время), кнопка видео/PDF (если есть URL через signed URL), текст-блок для статей
  - **Комментарии**: `get_comments` → список, `add_comment` → отправка (Ctrl+Enter)
  - `switchTab('lib')` автоматически вызывает `loadLibraryIfNeeded()` (ленивая загрузка)



### T-PRIVATE-007a: Ближний круг — импорт контента из ТГ канала ✅
- Скрипт `import_content.py`: парсит `messages.html` через BeautifulSoup, каталог из `content-structure.md`
- **45 материалов** в `private_content`: 19 text, 12 video, 12 audio, 2 pdf
- **163 тег-привязки** в `library_item_tags`
- Серии объединены: Хроники воспаления (12 постов), Почки и давление (5), Надпочечники (8 видео), Иммунитет базовый (7 постов), и др.
- 2 голосовых файла загружены в `private-content/podcasts/`: `audio_1` (Баланс макронутриентов, msg63) и `audio_2` (Лень или дефицит ресурсов, msg193)
- Книги (5), гайды (2), исследования (2) добавлены

### T-PRIVATE-006: Ближний круг — хаб + онбординг + мед. карта ✅
- **Prodamus-ссылки**: `buyPlan()` использует ту же схему что `buyGuide()` в index.html: `PRODAMUS_URL + params`, `_param_guide_slug`, `_param_telegram_id` (сохраняется при `openInnerCircle()`), `urlSuccess=/private/?payment=success`
- **Payment polling**: `?payment=success` → overlay «Активируем доступ» → poll `check_access` каждые 10 сек → welcome screen; через 3 мин без активации → кнопка «Написать Алексею»
- **Welcome screen**: «Добро пожаловать», дата до, кнопка «Заполнить карту здоровья»
- **Онбординг 3 шага**: Шаг 1 — имя/возраст/рост/вес; Шаг 2 — диагнозы (8 чипов + свой), препараты (+/-), жалобы; Шаг 3 — загрузка анализа / пропустить. После → `save_health_profile` + `add_thread_message` Алексею, флаг `private_onboarding_completed`
- **Хаб**: реальные данные из 6 API-вызовов параллельно — рекомендации с галочками (`toggle_recommendation`), мед. карта (теги), анализы, переписка (бейдж), zoom-события (запись), дневник. Пустые состояния по спеке 16.7
- **Таб «Карта»**: 5 вкладок (Основное, Диагнозы, Препараты, Аллергии, Заметки), `save_health_profile` на кнопке
- `openInnerCircle()` в `index.html` теперь сохраняет `app_user_tg_id` для Prodamus

### T-PRIVATE-005: Ближний круг — лендинг + навигация ✅
- `private/index.html` создан: дизайн-токены из `styles.css` (палитра Sand, Nunito+Lora), лендинг из `landing.jsx`, SPA-скелет с 6 табами
- Лендинг: Hero, Features (5 карточек), Pricing с переключателем «Я пенсионер(ка)» (30д: 3000/1500₽, 90д: 7200/3600₽), HowItWorks, цитата
- SPA: табы Главное/Алексей/Анализы/Материалы/Карта/Профиль; сайдбар десктоп от 768px; баннер истечения; профиль-вкладка
- JS: `check_access` → лендинг или SPA; `?payment=success` → toast; `?section=` → открыть таб; `private_nav_state` в localStorage
- Карточка «Ближний круг» 🌿 добавлена в nav-list `index.html` (после Мои беспокойства)
- `openInnerCircle()` сохраняет `app_return_state`; `?return=true` восстанавливает позицию в навигаторе
- Nginx: добавлен `location /private/` с `microphone=(self)`; HTTP 200 ✓

### T-PRIVATE-004: Ближний круг — `prodamus-webhook` + продукты в БД ✅
- Продукты id 14-17: `product_type = 'inner_circle'`, `content_access` заполнен slugами (`private_30`, `private_30_senior`, `private_90`, `private_90_senior`)
- `prodamus-webhook`: добавлены `notifyTelegram`, `product_type` в запрос продукта, ветка `inner_circle` после insert purchase
- Ветка: вычисляет дни (30/90), is_senior по slug, upsert `user_access` (продление если активна), TG уведомление пользователю и админу (788984484)
- Идемпотентность для inner_circle: по `prodamus_order` (а не user+product), чтобы не блокировать renewals

### T-PRIVATE-003: Ближний круг — Edge Function `private-admin` ✅
- Задеплоена на production (`/opt/beget/supabase/volumes/functions/private-admin/index.ts`)
- Все 19 actions по спеке 7.2: подписчики, переписка, анализы, рекомендации, протоколы, контент, разборы, маркеры, сводка
- Telegram-уведомления при: продлении доступа, ответе в чате, новой рекомендации
- Нюанс: `verifyAdminToken` использует `crypto.subtle` + base64 (Web Crypto API) — другой формат токена чем у `private-data` (hex HMAC). Фронтенд должен генерировать admin-токены соответственно.
- Тесты: 401 на невалидный токен ✓ | 403 на не-админа ✓ | `get_daily_summary` с admin-токеном ✓

### T-PRIVATE-002: Ближний круг — Edge Function `private-data` ✅
- Задеплоена на production (`/opt/beget/supabase/volumes/functions/private-data/index.ts`)
- Исправлено: в спеке `getUserFromToken` обращалась к несуществующей таблице `sessions` — заменена на HMAC-верификацию (формат `userId:timestamp:sig`, как в `game-action` и `upsert-user`)
- Таблица сессий в проекте не нужна: токен самодостаточен, проверяется через `SUPABASE_SERVICE_ROLE_KEY`
- Тесты: 401 на невалидный токен ✓ | `{"markers":[]}` на `get_markers_catalog` ✓ | `{"hasAccess":false,...}` на `check_access` ✓

### T-PRIVATE-001: Ближний круг — Этап 1, фундамент БД ✅
**Файл миграции:** `T-PRIVATE-001-fixed.sql` (исправлен: products не имеет slug)
- 14 таблиц созданы в production БД, RLS включён на всех: `user_access`, `user_dependants`, `analysis_markers`, `private_content`, `library_tags`, `library_item_tags`, `zoom_events`, `zoom_registrations`, `user_analyses`, `user_health_profile`, `health_journal`, `user_protocols`, `user_recommendations`, `private_comments`
- 30 тегов в `library_tags` (19 тем + 7 форматов + 4 действия)
- 4 продукта добавлены в `products` (Ближний круг 30/90 дней + льготные)
- 3 storage bucket созданы: `user-analyses`, `voice-messages`, `private-content`
- Нюанс: `products` не имеет колонки `slug` — использован `WHERE NOT EXISTS` по `name`

---

## ✅ Выполнено (30.04.2026)

### T-WELCOME-SKIP-FIX ✅ (commit 7580a6b)
- `quizSkip()`: инкрементирует `quiz_prompt_dismiss_total` вместо `quiz_completed=true` — после 3 пропусков всё блокируется, не сразу
- `initWelcomeBanner()`: после `tour_completed` — отдельный счётчик `welcome_banner_after_tour` (макс 5 сессий), потом баннер исчезает

### T-WELCOME-PRIORITY ✅ (commit 2f6a4f6)
- `maybeShowStickyOnHome()` проверяет `#welcomeBanner`: если полоска видна — sticky не показывается
- После × на полоске → sticky может появиться в ту же сессию

### T-WELCOME-BANNER ✅ (commit dabb32c)
**Файлы:** `index.html`, `supabase/migrations/20260430_welcome_rls.sql`
- Терракотовая полоска `#b8541e` над плитками меню. Показывается первые 7 сессий (до тура) + 5 сессий после тура
- Текст: «Ты используешь только 10% приложения → Узнай больше!» (15px, font-weight 800)
- Клик на текст → открывает welcome-тур; × → sessionStorage dismiss (только эта сессия)
- `isWelcomeActive()` блокирует sticky/feedcard/postpdf пока splash или тур открыты
- После skip splash / close тура → `initWelcomeBanner()` + `maybeShowStickyOnHome()` запускаются автоматически
- RLS: `welcome_banner_shown/clicked/dismissed` добавлены в обе политики на VPS

### T-WELCOME-1 ✅ (commit 8450611)
- `welcome_splash_*`, `welcome_tour_*`, `welcome_banner_*` event_type добавлены в обе RLS политики analytics_events (применено на VPS через SSH)

### T-WELCOME-2 + T-WELCOME-3 ✅ (commits 97b0429, c7b6e10)
**Файл:** `index.html`
- Splash: bottom-sheet при первом визите (localStorage.welcome_seen отсутствует). 4 плитки со статами, «Подробнее» → тур, «Пропустить» → закрыть навсегда
- Тур: 6 экранов, плиточная сетка 2 колонки (копия меню), тултип + подсветка 1-2 карточек (остальные opacity:0.2)
- Экран 3 — автоскролл к Эфирам/Подкастам; экран 6 — «Подобрать для меня →» → квиз
- Квиз открывается через setTimeout(50ms) после закрытия тура
- Шрифты: tooltip 16px bold, заголовок 21px, стат-числа 24px, кнопки 16px

## ✅ Выполнено (29.04.2026)

### T-QUIZ-COMPLETED-AT ✅
- upsert-user читает quiz_completed из тела запроса, пишет quiz_completed_at
- Клиент: все три точки авторизации передают флаг из localStorage
- Edge Function задеплоена

### T-QUIZ-ENTRY ✅
- Sticky-плашка квиза сразу на главной (maybeShowStickyOnHome, 500мс)
- Deep link → поведение прежнее (по доскроллу)
- Email warning bottom-sheet при пропуске email в квизе
- Текст: «Email = твой аккаунт. Без него не сохранятся: подборка по квизу, избранное, прогресс эфиров, скидки на гайды. Закроешь приложение - начнёшь с нуля»

### T-QUIZ-EMAIL-FIX + T-QUIZ-SKIP-FIX ✅
- Email warning не вылетает на главной (display:none по умолчанию)
- Кнопка «Пропустить» работает корректно
- Фокус на email-инпут через requestAnimationFrame

### T-REMOVE-CAROUSEL ✅
- Карусель баннеров убрана
- Квиз-баннер убран (не конвертил)

### T-GAME-NAV ✅
- Прямая навигация из результатов игры (без мигания главной)
- «Назад» → возврат к результатам (sessionStorage)
- Кнопка «Полезные игры» → первое место, яркий цвет

### T-GUIDE-PAGE-LAYOUT ✅
- Порядок: название → описание → фраза → поделиться → цена

### T-SYNC-PROD ✅ (29.04)
- Все DEV-изменения перенесены на PROD

---

## ✅ Выполнено (28.04.2026)

### T-GAME-UI-1..5 ✅
### T-GAME-DISCOUNT-FIX ✅
### T-ANALYTICS ✅
### T-QUIZ-ANALYTICS ✅ | T-QUIZ-BANNER ✅ | T-HIDDEN-POSTS ✅ | T-GIT-SYNC ✅
### T-GAME-1..6 ✅ | T-GAME-AUTH-FIX ✅ | T-GAME-BUG-1..3 ✅

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
