# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 02.05.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### T-PRIVATE-002: Ближний круг — Edge Function `private-data` ✅

### T-QUIZ-PROMPTS: Квиз-промпты — доработка по аналитике путей
**Приоритет:** 🟡 | **Статус:** На паузе (ждём данные за несколько дней)

---

---

## ✅ Выполнено (02.05.2026)

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
