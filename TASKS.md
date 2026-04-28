# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Другие задачи

### T-QUIZ-PROMPTS: Квиз-промпты в 5 точках
**Приоритет:** 🟡 | **Статус:** На паузе

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато

---

## ✅ Выполнено (28.04.2026)

### T-GAME-1..6 ✅ | T-GAME-AUTH-FIX ✅ | T-GAME-BUG-1..3 ✅
### T-ANALYTICS ✅ | T-QUIZ-ANALYTICS ✅ | T-QUIZ-BANNER ✅
### T-HIDDEN-POSTS ✅ | T-GIT-SYNC ✅

---

### T-GAME-UI-1..5 ✅ (commit 51553e2 + a0c04d2)

**UI-1:** Рейтинг — модальное окно по центру экрана (было: bottom sheet)
- `.lb-overlay`: `align-items:center`, `padding:20px`
- `.lb-modal`: `border-radius:24px` (все стороны), `max-height:70vh`, тень

**UI-2:** Навигация назад
- `iron/index.html`: кнопка «← Назад» → `/games/` (было: «← Навигатор» → `/`)
- `games/index.html`: кнопка «← В Навигатор» → `/`

**UI-3:** Текст кнопки шаринга
- «💌 Отправь подруге» → «📤 Поделиться игрой» везде (сплэш, пауза, toast)

**UI-4:** Убран переключатель плитка/список в `index.html`
- `nav-list` всегда отображается плиткой (grid)
- Удалены: `setNavView()`, `restoreNavView()`, `localStorage('nav_view')`, CSS `.nav-view-toggle`

**UI-5 (критично):** Хаб игр тормозил из-за `telegram-web-app.js` в `<head>` без async
- `games/index.html`: SDK перенесён в конец body, затем в head с `async onload="_tgInit()"`
- `games/iron/index.html`: оба SDK (`telegram` + `vk`) получили `async`, добавлен `_tgReady()` onload
- Серая полоска в Telegram: `tg.ready()` теперь вызывается через `onload` как можно раньше

---

### T-GAME-DISCOUNT-FIX ✅ (commits 2615128..9cfe21a)

**Проблема:** экран reward показывал промокод FE-XXXX, кнопка скрыта за панелью браузера, скидка терялась при «Не сейчас».

**Что сделано:**

1. **Удалён экран `#reward`** и вся логика промокодов:
   - `claimReward()`, `startPromoTimer()`, `copyPromoCode()`, `skipReward()`
   - CSS `.promo-*`, `.reward-*` (~170 строк)
   - `endGame()` → всегда `showFinal()` напрямую

2. **Финальный экран переработан** (`games/iron/index.html`):
   - `padding-bottom: env(safe-area-inset-bottom, 80px)` — кнопки не скрываются
   - Блок `.cta-discount-block` с процентом скидки
   - Порядок CTA: купить гайд → таблетки → бесплатные → посты → рейтинг → поделиться → заново

3. **Сценарий А (авторизован, есть email):**
   - Кнопка «🔥 Купить за 745₽ ~~1490₽~~» → `openGuideWithDiscount()` → переход на страницу гайда в основном приложении

4. **Сценарий Б (не авторизован):**
   - Инлайн-форма email + OTP прямо в CTA-блоке
   - После успешного входа → re-render CTA → показывается кнопка покупки

5. **Скидка сохраняется 24 часа** (`localStorage.game_discount`):
   - Записывается сразу в `endGame()` при `discount > 0`
   - Выживает «Не сейчас», закрытие приложения, любую навигацию
   - `index.html openGuideDetail()` читает `game_discount` из localStorage и подставляет в buy-bar: **745₽ ~~1490₽~~** + «🔥 Скидка за игру · 24ч»
   - `buyGuide()` вызывается с дисконтной ценой → Prodamus с правильной суммой

6. **`buildPaymentUrl(price)`** — клиентская генерация Prodamus URL (та же схема что в `index.html`):
   - `https://nutriciologist.payform.ru/` + параметры: slug, price, telegram_id, email, order_id, webhook

7. **Auth fix** (`initGame()`):
   - Читает `sessionToken` И `session_token` из localStorage (main app пишет `session_token`, игра — `sessionToken`)
   - `saveScore()` также исправлен аналогично
   - `tgNow = window.Telegram?.WebApp` внутри `initGame()` — защита от async SDK race

8. **Рейтинг из хаба** (`games/index.html`):
   - Кнопка «🏆 Рейтинг» больше не переходит в игру
   - Открывает модал прямо на странице хаба, подгружает данные напрямую из API
   - Никакой загрузки игры, никакой авторизации

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
