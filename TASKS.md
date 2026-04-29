# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 30.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### T-QUIZ-PROMPTS: Квиз-промпты — доработка по аналитике путей
**Приоритет:** 🟡 | **Статус:** На паузе (ждём данные за несколько дней)

---

## ✅ Выполнено (30.04.2026)

### T-WELCOME-PRIORITY ✅ (commit 2f6a4f6)
`maybeShowStickyOnHome()` проверяет видимость `#welcomeBanner` — sticky не показывается пока полоска на экране. После × → sticky может появиться.

### T-WELCOME-BANNER ✅ (commit dabb32c)
### T-WELCOME-1 ✅ (commit 8450611)
8 welcome_* + welcome_banner_* event_type добавлены в обе RLS политики analytics_events (VPS)

### T-WELCOME-2 + T-WELCOME-3 ✅ (commits 97b0429, c7b6e10)
- Splash + 6-экранный тур с плиточной сеткой, автоскролл экран 3, CTA → квиз
- Фикс: квиз через setTimeout(50ms); шрифты увеличены
**Файлы:** `index.html`, `supabase/migrations/20260430_welcome_rls.sql`
- Терракотовая полоска #b8541e над плитками. 7 сессий max, не показывается при tour_completed. Клик → тур, × → sessionStorage dismiss
- `isWelcomeActive()` блокирует sticky/feedcard/postpdf пока splash/тур открыты
- После skip/close → `initWelcomeBanner()` + `maybeShowStickyOnHome()` запускаются
- RLS: welcome_banner_shown/clicked/dismissed добавлены в обе политики

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
