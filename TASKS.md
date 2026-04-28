# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### T-QUIZ-PROMPTS: Квиз-промпты в 5 точках приложения
**Приоритет:** 🟡 | **Статус:** На паузе
**План:**
1. Конец поста — встроенный блок (контекстный текст по теме)
2. После 3-го поста за сессию — тост снизу (10 сек)
3. После закрытия PDF — блок при возврате
4. Каталог БАДов — inline-карточка после 5–6 позиций
5. Баннер на главной — ✅ уже сделано

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато
**Проблема:** UPDATE в quizFinish() не срабатывает для анонимов (currentUser=null).
**Решение:** Проверить код, для анонимов — записать при следующей авторизации.

---

## ✅ Выполнено (28.04.2026)

### T-GAME-UI-1..5 ✅ (commits 51553e2, a0c04d2)
**Файлы:** `games/iron/index.html`, `games/index.html`, `index.html`

- **UI-1:** Рейтинг — модал по центру экрана (`align-items:center`, `border-radius:24px`, `max-height:70vh`)
- **UI-2:** `iron/`: «← Назад» → `/games/`; `games/`: «← В Навигатор» → `/`
- **UI-3:** «💌 Отправь подруге» → «📤 Поделиться игрой» везде (сплэш, пауза, toast)
- **UI-4:** Убран переключатель плитка/список в `index.html`; nav всегда плитка; удалены `setNavView()`, `restoreNavView()`, CSS `.nav-view-toggle`
- **UI-5 (критично):** `telegram-web-app.js` переведён на `async onload` в `<head>` — устранена серая полоска в TG и долгая загрузка хаба

---

### T-GAME-DISCOUNT-FIX ✅ (commits 2615128..9cfe21a)
**Файлы:** `games/iron/index.html`, `index.html`, `games/index.html`

**Удалено:**
- Экран `#reward`, промокоды FE-XXXX, таймер, «Код отправлен на email»
- `claimReward()`, `startPromoTimer()`, `copyPromoCode()`, `skipReward()`
- CSS `.promo-*`, `.reward-*` (~170 строк)

**Добавлено:**

1. **Алгоритм скидки** (в `endGame()`):
   - ≥ 100% → скидка 50% (745₽)
   - ≥ 75% → скидка 25% (1118₽)
   - < 75% → без скидки (1490₽)
   - Скидка записывается в `localStorage.game_discount` сразу при окончании игры (живёт 24ч)

2. **Финальный экран** (новый `renderCTA`):
   - Сценарий А (авторизован + email): кнопка «🔥 Купить за X₽ ~~1490₽~~» → `openGuideWithDiscount()` → переход на страницу гайда
   - Сценарий Б (не авторизован): инлайн email+OTP, после входа — кнопка покупки
   - `padding-bottom: env(safe-area-inset-bottom, 80px)` — кнопки не скрываются за панелью
   - Порядок: купить → таблетки → бесплатные → посты → рейтинг → поделиться → заново

3. **Страница гайда (`index.html`):**
   - `openGuideDetail()` читает `game_discount` из localStorage
   - Если не истёк: buy-bar показывает **745₽ ~~1490₽~~** + «🔥 Скидка за игру · 24ч»
   - `buyGuide()` вызывается с дисконтной ценой → Prodamus с правильной суммой

4. **`buildPaymentUrl(price)`** — клиентская генерация Prodamus URL (та же схема что в `index.html`): `https://nutriciologist.payform.ru/` + slug, price, telegram_id, email, order_id, webhook

5. **Auth fix** (`initGame()`):
   - Читает оба ключа: `sessionToken` И `session_token` (main app пишет `session_token`)
   - `saveScore()` аналогично исправлен
   - `tgNow = window.Telegram?.WebApp` внутри `initGame()` — защита от async SDK race

6. **Рейтинг из хаба** (`games/index.html`):
   - «🏆 Рейтинг» больше не переходит в игру
   - Открывает модал прямо на хабе, подгружает API напрямую
   - CSS/HTML/JS рейтинга добавлены в `games/index.html`

---

### T-ANALYTICS ✅
- 12 SQL-запросов, период 15–28 апреля 2026
- DAU ~45, 405 юзеров; Топ: Железо/анемия, гайд «Железодефицит» — 174 просмотра
- Платформы: MAX 832 сессии / 161 юзер, TG 388 / 162, web 140 / 9
- Покупки (14 дней): 5 продаж, 6160₽
- Результаты: `miniapp-tasks/ANALYTICS.md`

### T-QUIZ-ANALYTICS ✅ | T-QUIZ-BANNER ✅ | T-HIDDEN-POSTS ✅ | T-GIT-SYNC ✅
### T-GAME-1..6 ✅ | T-GAME-AUTH-FIX ✅ | T-GAME-BUG-1..3 ✅

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
