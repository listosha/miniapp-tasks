# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## 🔴 СРОЧНО

### T-GAME-AUTH-FIX: Авторизация в игре — убрать редирект, сделать автономной
**Приоритет:** 🔴 | **Статус:** ✅ Выполнено
**Файл:** miniapp-dev/games/iron/index.html
**Проблема:** Сейчас при отсутствии sessionToken игра редиректит на главную (`/`). Обратный возврат через return_to не работает. Пользователь из веба/Instagram вообще не может авторизоваться.

**Цель:** игра авторизует пользователя САМОСТОЯТЕЛЬНО, без редиректов. Четыре сценария:

**Сценарий 1 — sessionToken уже есть (TG/MAX, повторный визит):**
Читаем из localStorage → get_profile → если email есть → splash. Уже работает.

**Сценарий 2 — нет токена, но есть Telegram initData:**
```js
const tg = window.Telegram?.WebApp;
if (tg && tg.initData) {
  const res = await fetch(SUPABASE_URL + '/functions/v1/upsert-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'auth', platform: 'telegram', initData: tg.initData })
  });
  const data = await res.json();
  if (data.sessionToken) {
    localStorage.setItem('sessionToken', data.sessionToken);
    // → get_profile → splash
  }
}
```

**Сценарий 3 — нет токена, но есть MAX initData:**
Аналогично сценарию 2, но `platform: 'max'` и `maxApp.initData`.

**Сценарий 4 — нет ничего (прямая ссылка, Instagram, email):**
Показать экран email-авторизации ПРЯМО В ИГРЕ:
- Поле email → «Получить код» → fetch к send-otp
- Поле OTP → «Подтвердить» → fetch к upsert-user (action: restore)
- Таймер повторной отправки 60 сек
- После успеха → сохранить sessionToken → get_profile → splash
- Дизайн: тот же тёплый стиль (Nunito, те же CSS-переменные)

**Порядок проверки при загрузке:**
```
1. localStorage.sessionToken? → get_profile → ОК → splash
2. tg.initData? → upsert-user → токен → get_profile → splash
3. MaxApp.initData? → upsert-user → токен → get_profile → splash
4. Ничего → экран email-авторизации в игре
```

**После авторизации (сценарии 2-4):** get_profile → если email нет → экран «Привяжи почту». Если есть → splash.

**Убрать:** редирект на `/` и всю логику return_to из игры. Игра полностью автономна.

**SUPABASE_URL:** `https://uckuyoyubub.beget.app`

**Проверить:**
1. Браузер без TG → форма email → код → splash
2. TG мини-апп → сразу splash (авто через initData)
3. После авторизации — игра работает, рейтинг сохраняется

---

## ⏳ Активные задачи

### T-QUIZ-PROMPTS: Квиз-промпты в 5 точках приложения
**Приоритет:** 🟡 | **Статус:** На паузе

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато

---

## ✅ Выполнено (28.04.2026)

### T-GAME-1..6: Модуль «Полезные игры» — полное внедрение ✅
- T-GAME-1 ✅ Таблицы game_scores + user_rewards (RLS, индексы)
- T-GAME-2 ✅ Edge Function game-action (5 actions)
- T-GAME-3 ✅ games/iron/index.html (авторизация, рейтинг, шаринг, промокоды, CTA)
- T-GAME-4 ✅ games/index.html (хаб)
- T-GAME-5 ✅ Кнопка + deep links + goto handler в index.html
- T-GAME-6 ✅ Деплой на dev

### T-ANALYTICS ✅ | T-QUIZ-ANALYTICS ✅ | T-QUIZ-BANNER ✅
### T-HIDDEN-POSTS ✅ | T-GIT-SYNC ✅

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
