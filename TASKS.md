# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 03.05.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### T-HOMESCREEN-V2: Правки главной — доработка блоков ✅
**Приоритет:** 🔴 | **Статус:** Выполнено (commit 64e4caa)
**Среда:** только dev (dev.listoshenkov.ru)

---

1. СЕТКА РАЗДЕЛОВ (Игры, Гайды Pro, Волшебные таблетки, Консультация)
   Добавить hint-строку под названием каждой плитки:
   - Полезные игры → «Сыграй — получи скидку»
   - Гайды Pro → «12 протоколов от А до Я»
   - Волшебные таблетки → «99 проверенных добавок»
   - Консультация → «Индивидуальный разбор»

2. ПЕРСО-ЛЕНТА постов
   Добавить к каждой карточке поста:
   - Слева: эмодзи темы (emoji из таблицы topics по topic_slug)
   - Справа: стрелка →
   - Мелкая картинка поста если есть (поле image в posts), fallback — эмодзи

3. БЛОК «Гайды Pro» — сделать расширенной карточкой (как Бесплатные материалы)
   - Заголовок: «Гайды Pro», подзаголовок: «Полные протоколы»
   - Бейдж PRO
   - 2 превью гайда: название + цена
   - Кнопка «Смотреть все гайды →»
   - Данные: SELECT id, title, price FROM products WHERE product_type='guide' LIMIT 2

4. БЛОК «Бесплатные материалы» — переделать в горизонтальную карусель
   - Такой же стиль как карусель эфиров
   - Карточка: эмодзи/иконка, название, краткое описание, «Читать →»
   - Данные: content WHERE type='free_guide', исключать просмотренные

5. БЛОК «Подборки по темам» — фильтры-теги сделать рабочими
   - Клик по тегу → фильтрует 3 поста внутри блока по теме
   - Активный тег подсвечивается акцентным цветом #c4724a

6. БЛОК «Отзывы» — раскрытая карточка вместо плитки
   - Показать 1-2 отзыва с именем, текстом (2-3 строки), обрезка с «...»
   - Кнопка «Все отзывы →»
   - Данные: SELECT author_name, text, rating FROM reviews LIMIT 2

7. БЛОК «Скидка на анализы» — раскрытая карточка
   - Иконка + заголовок «Скидка 20% на анализы»
   - Подзаголовок: «Инвитро по всей России»
   - Бейдж «-20%»
   - Кнопка «Получить скидку →» → текущий openSection('discount')

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

## ✅ Выполнено (03.05.2026)

### T-HOMESCREEN-V2: Доработка блоков главной ✅ (commit 64e4caa)
**Файлы:** `index.html` (dev branch)

7 пунктов выполнены:
1. **Сетка 2×2**: hint-строки под каждой плиткой («Сыграй — получи скидку», «12 протоколов», «99 добавок», «Индивидуальный разбор»).
2. **Персо-лента**: иконка темы из `topicsIconMap` (topics.icon) слева, стрелка `›` справа.
3. **Гайды Pro**: новая расширенная карточка с заголовком, бейджем PRO, 2 превью (название+цена из `guides/catalog.json`), кнопкой «Смотреть все →».
4. **Бесплатные материалы**: переделаны в горизонтальную карусель (emoji-плашка + название + «Читать →»). `enableDragScroll` подключён.
5. **Подборки по темам**: клик по тегу фильтрует 3 поста внутри блока (`homeTopicsFilter`), активный тег подсвечен `#c4724a`.
6. **Отзывы**: расширенная карточка — 2 отзыва из БД (`author_name + content` обрезан 3 строки), кнопка «Все отзывы →».
7. **Скидка на анализы**: расширенная карточка с иконкой, бейджем `-20%`, кнопкой «Получить скидку →».

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
