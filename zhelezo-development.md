# Полезные игры — Полный файл разработки

**Проект:** Модуль «Полезные игры» для мини-приложения «Навигатор канала»
**Первая игра:** «Враги и друзья железа»
**Дата:** 27 апреля 2026
**Версия:** 1.0

---

## 1. Общая концепция

### Что это

Новый раздел «Полезные игры» в мини-приложении. Образовательные игры по нутрициологии, которые проверяют знания пользователя и направляют его к релевантному контенту (посты, гайды, добавки).

### Зачем

- Вовлечение: игровая механика удерживает аудиторию
- Образование: пользователь учится в процессе
- Монетизация: скидки на гайды за результат (мотивация к покупке)
- Аналитика: видим уровень знаний аудитории
- Шаринг: вирусный рост через «поделиться результатом»

### Аудитория

Женщины 35-65 лет. Шрифт Nunito, тёплый стиль, крупная типографика. Тон — заботливый и неформальный.

---

## 2. Архитектура

### 2.1 Файловая структура

```
/var/www/app/
├── index.html                      ← основное приложение
│                                      + кнопка «Полезные игры»
│                                      + deep links (games, game_iron)
│                                      + логика return_to
├── games/
│   ├── index.html                  ← хаб игр (список всех игр)
│   └── iron/
│       └── index.html              ← игра «Враги и друзья железа»
```

GitHub-репо: `listosha/miniapp` (ветка main). Деплой через GitHub Actions → rsync → `/var/www/app/`.

Dev: та же структура в `listosha/miniapp-dev` → `/var/www/dev/games/...`

### 2.2 URL-схема

| URL | Назначение |
|-----|-----------|
| `app.listoshenkov.ru/games/` | Хаб игр |
| `app.listoshenkov.ru/games/iron/` | Игра про железо |
| `app.listoshenkov.ru/games/b12/` | (будущее) Игра про B12 |
| `app.listoshenkov.ru/games/thyroid/` | (будущее) Игра про щитовидку |

### 2.3 Deep links

| startapp параметр | Куда ведёт |
|-------------------|-----------|
| `games` | `/games/` |
| `game_iron` | `/games/iron/` |
| `game_b12` | `/games/b12/` (будущее) |

Обработка в основном `index.html`:
```js
// В секции обработки deep links (уже есть для post_, guide_, pills и т.д.)
const startParam = tg?.initDataUnsafe?.start_param || urlParams.get('startapp') || '';

if (startParam === 'games') {
  window.location = '/games/';
} else if (startParam.startsWith('game_')) {
  const gameSlug = startParam.replace('game_', '');
  window.location = '/games/' + gameSlug + '/';
}
```

### 2.4 Навигация между разделами

**Из основного приложения → Игры:**
```js
// Сохраняем состояние перед уходом
localStorage.setItem('app_return_state', JSON.stringify({
  section: currentSection,
  scrollY: window.scrollY,
  activeFilter: currentFilter,
  timestamp: Date.now()
}));
window.location = '/games/';
```

**Из игры → обратно в приложение:**
```js
// Кнопка «← В Навигатор»
window.location = '/';
// Или если нужно вернуться к конкретному разделу:
window.location = '/?return=true';
```

**return_to — для авторизации:**
```js
// Игра обнаружила, что нет сессии
localStorage.setItem('return_to', '/games/iron/');
window.location = '/';

// Основное приложение после авторизации:
const returnTo = localStorage.getItem('return_to');
if (returnTo) {
  localStorage.removeItem('return_to');
  window.location = returnTo;
}
```

---

## 3. Анализ исходного файла игры

### 3.1 Структура (1933 строки)

| Секция | Строки | Описание |
|--------|--------|----------|
| CSS | 1-1098 | Стили, анимации, dark mode, responsive |
| HTML | 1100-1297 | 6 экранов: splash, game, levelup, reward, final, pause |
| JS init | 1299-1327 | TG WebApp init, vibrate(), LINKS (заглушки) |
| SVG icons | 1329-1370 | 26 иконок продуктов (inline SVG) |
| Game data | 1372-1420 | Категории (CATS), 40 карточек (CARDS) |
| Game logic | 1422-1870 | State, shuffle, timer, answer, feedback, scoring |
| Drag/swipe | 1871-1931 | Touch/mouse drag для свайпа карточек |

### 3.2 Игровая механика

**Уровень 1 (карточки 1-20):**
- 5 секунд на ответ
- 3 жизни
- 100 очков за ответ, 150 за быстрый (< 2 сек)
- x2 множитель за серию >= 3

**Уровень 2 (карточки 21-40):**
- 3 секунды на ответ
- +3 жизни бонус
- x2 множитель за уровень (итого до x4 со стриком)
- 150 за быстрый (< 1.2 сек)

**Карточки (40 шт):**
- 20 друзей (friend) — помогают усвоению железа
- 17 врагов (enemy) — мешают усвоению
- 3 нейтральных (neutral) — зависит от контекста

**Ответы:** свайп вправо (друг), влево (враг), кнопка «Зависит» (нейтральный). Кнопка «Зависит» появляется только для нейтральных карточек (скрытая подсказка по наличию).

**Система скидок:**
- 0-40% верно → Новичок (нет скидки)
- 41-60% → Любознательная (нет скидки)
- 61-74% → Продвинутая (нет скидки)
- 75-99% → Продвинутая (скидка 25%)
- 100% → Железный эксперт (скидка 50%)

### 3.3 Что есть

- ✅ Полная игровая механика (2 уровня, таймер, жизни, очки, стрики)
- ✅ Свайп-механика (touch + mouse)
- ✅ Красивый UI с анимациями
- ✅ Dark mode (TG colorScheme)
- ✅ Haptic feedback (TG HapticFeedback)
- ✅ SVG-иллюстрации для всех 40 продуктов
- ✅ Экран level up между уровнями
- ✅ Экран reward со скидкой и конфетти
- ✅ Экран финальных результатов
- ✅ Пауза с модалкой
- ✅ Smart shuffle (нейтральные равномерно распределены)
- ✅ Responsive (адаптация под маленькие экраны)

### 3.4 Что нужно добавить

| Функция | Приоритет | Описание |
|---------|-----------|----------|
| Авторизация + email | 🔴 Критично | Проверка сессии, привязка email перед игрой |
| Рейтинг игроков | 🔴 Критично | Таблица лидеров, ввод имени, антимат-фильтр |
| Шаринг результата | 🟡 Важно | TG/MAX/Web, на splash/pause/final |
| CTA-ссылки | 🟡 Важно | Заменить заглушки на реальные deep links |
| Промокоды скидок | 🟡 Важно | Генерация кода, таймер 24ч, отправка на email |
| Кнопка «Назад» | 🟢 Мелочь | Возврат в Навигатор |
| Аналитика | 🟢 Позже | Трекинг событий |

### 3.5 Заглушки в коде

```js
const LINKS = {
  postsIron: '#posts-iron',        // → /?goto=topic_iron
  magicPillsIron: '#magic-pills-iron', // → /?goto=pills
  guideIron: '#guide-iron',        // → /?goto=guide_zhelezodeficit
  freeMaterials: '#free-materials' // → /?goto=free
};
```

---

## 4. Авторизация и email

### 4.1 Почему email обязателен

- **Рейтинг:** привязка к аккаунту, чтобы не терялись результаты
- **Скидки:** промокод отправляется на email, нужен для подтверждения
- **Будущие игры:** все результаты привязаны к одному профилю
- **Кросс-платформа:** пользователь заходит из TG, MAX или по прямой ссылке — email объединяет

### 4.2 Флоу авторизации

```
Открыл /games/iron/
    │
    ▼
Читаем sessionToken из localStorage
(localStorage общий — тот же домен app.listoshenkov.ru)
    │
    ├─ НЕТ токена
    │   └─ Экран «Для игры нужно войти в Навигатор»
    │      Кнопка [Войти] → localStorage.setItem('return_to', '/games/iron/')
    │                      → window.location = '/'
    │      (основное приложение авторизует и вернёт обратно)
    │
    ├─ ЕСТЬ токен → запрос user-data (action: get_profile)
    │   │
    │   ├─ Токен невалидный (401/ошибка)
    │   │   └─ Удаляем токен, показываем экран «Войти»
    │   │
    │   ├─ Профиль получен, email ЕСТЬ
    │   │   └─ ✅ Сохраняем в память: user_id, first_name, email, platform
    │   │      → Показываем splash, кнопка «Начать»
    │   │
    │   └─ Профиль получен, email НЕТ
    │       └─ Экран «Привяжи почту»
    │          «Чтобы сохранять результаты и получать скидки,
    │           привяжи свою электронную почту»
    │          [поле ввода email]
    │          [Получить код] → send-otp
    │          [поле ввода OTP]
    │          [Подтвердить] → upsert-user (action: verify_email_otp)
    │          После успеха → splash
    │
    ▼
  Играем!
```

### 4.3 Мультиплатформенная совместимость

| Платформа | Как попадает | Сессия |
|-----------|-------------|--------|
| Telegram | Через бота → mini app → /games/ | initData → upsert-user → sessionToken в localStorage |
| MAX | Через бота MAX → mini app → /games/ | initData MAX → upsert-user → sessionToken в localStorage |
| Email/Web | Прямая ссылка app.listoshenkov.ru → /games/ | Email OTP → upsert-user → sessionToken в localStorage |
| Без входа | Прямая ссылка без авторизации | Нет токена → отправляем авторизоваться |

Во всех случаях в localStorage уже лежит `sessionToken` после авторизации в основном приложении. Игра просто читает его.

### 4.4 Запрос профиля

Существующий endpoint `user-data` расширяем action `get_profile`:

```js
// Запрос из игры
const response = await fetch(SUPABASE_URL + '/functions/v1/user-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_profile',
    sessionToken: localStorage.getItem('sessionToken')
  })
});

// Ответ
{
  "user_id": 42,
  "first_name": "Ирина",
  "email": "irina@mail.ru",   // или null
  "platform": "telegram",      // telegram / max / email / web
  "is_admin": false
}
```

**Альтернатива:** можно сделать отдельную функцию `game-action` и туда же вынести все игровые операции. Тогда user-data не трогаем.

### 4.5 Экран привязки email (UI)

```html
<div class="screen" id="auth-email">
  <div class="auth-icon">📧</div>
  <h2 class="auth-title">Привяжи почту</h2>
  <p class="auth-subtitle">
    Чтобы сохранять результаты игр и получать скидки,
    привяжи свою электронную почту
  </p>

  <div class="auth-form">
    <input type="email" id="emailInput" placeholder="твоя@почта.ru"
           class="auth-input" autocomplete="email">
    <button class="btn-primary" id="sendOtpBtn" onclick="sendOtp()">
      Получить код
    </button>
  </div>

  <div class="auth-otp" id="otpSection" style="display:none;">
    <p class="auth-otp-hint">Код отправлен на <span id="emailSent"></span></p>
    <input type="text" id="otpInput" placeholder="Введи код"
           class="auth-input" maxlength="6" inputmode="numeric">
    <button class="btn-primary" onclick="verifyOtp()">Подтвердить</button>
    <button class="auth-resend" id="resendBtn" disabled onclick="sendOtp()">
      Отправить повторно (60)
    </button>
  </div>
</div>
```

Стилизация — в том же тёплом стиле, что и вся игра.

---

## 5. Рейтинг игроков

### 5.1 Таблица game_scores

```sql
CREATE TABLE game_scores (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  player_name TEXT NOT NULL,
  game TEXT NOT NULL DEFAULT 'iron',
  score INT NOT NULL,
  correct INT NOT NULL,
  total INT NOT NULL DEFAULT 40,
  max_streak INT NOT NULL DEFAULT 0,
  tier TEXT CHECK (tier IN ('beginner', 'middle', 'expert')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game)  -- один лучший результат на игрока на игру
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Рейтинг публичный (чтение)
CREATE POLICY "game_scores_select"
  ON game_scores FOR SELECT
  USING (true);

-- Запись только через Edge Function (service_role)
-- Для anon key — всё закрыто

CREATE INDEX idx_game_scores_game_score ON game_scores (game, score DESC);
CREATE INDEX idx_game_scores_user_game ON game_scores (user_id, game);
```

**Логика upsert:** если у игрока уже есть запись для этой игры, обновляем только если новый score выше:

```sql
INSERT INTO game_scores (user_id, player_name, game, score, correct, total, max_streak, tier)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (user_id, game)
DO UPDATE SET
  score = GREATEST(game_scores.score, EXCLUDED.score),
  correct = CASE WHEN EXCLUDED.score > game_scores.score THEN EXCLUDED.correct ELSE game_scores.correct END,
  max_streak = CASE WHEN EXCLUDED.score > game_scores.score THEN EXCLUDED.max_streak ELSE game_scores.max_streak END,
  tier = CASE WHEN EXCLUDED.score > game_scores.score THEN EXCLUDED.tier ELSE game_scores.tier END,
  player_name = EXCLUDED.player_name,
  updated_at = now();
```

### 5.2 Антимат-фильтр

**Клиентская валидация (первая линия):**

```js
const BAD_PATTERNS = [
  // Корни основных матерных слов (regex)
  // Не храним полные слова — только характерные корни
  /[хxх][уyу][йиеёяюijье]/i,
  /[пp][иieё][зz][дd]/i,
  /[бb][лl][яaъ]/i,
  /[ёeo][бb][аaлl]/i,
  /[сsc][уyu][кk][аa]/i,
  /[мm][уyu][дd][аaоo]/i,
  /[дd][еe][рpr][ьb]?[мm]/i,
  /[жj][оo][пp]/i,
  /[гg][оo][вv][нnh]/i,
  /[шщ][лl][юy][хx]/i,
  // Leet-speak замены тоже ловим через регулярки выше
];

function isNameClean(name) {
  // Базовые проверки
  if (!name || name.trim().length < 2 || name.trim().length > 20) return false;

  // Только кириллица, латиница, цифры, пробелы, дефис
  if (!/^[а-яА-ЯёЁa-zA-Z0-9\s\-]+$/.test(name.trim())) return false;

  // Проверка на мат
  const normalized = name.toLowerCase()
    .replace(/0/g, 'о').replace(/3/g, 'з')
    .replace(/1/g, 'и').replace(/\$/g, 'с');

  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(normalized)) return false;
  }

  return true;
}
```

**Серверная валидация (вторая линия):**
- Тот же фильтр в Edge Function
- Дополнительно: rate limit (1 сохранение в минуту на user_id)

**UX при блокировке:**
```
❌ Выбери другое имя 😊
```

Без объяснений, почему заблокировано — чтобы не помогать обходить фильтр.

### 5.3 Ввод имени и сохранение (UI)

На экране final, после показа результатов:

```html
<div class="leaderboard-save" id="saveSection">
  <label class="save-label">Имя для рейтинга</label>
  <div class="save-row">
    <input type="text" id="playerNameInput"
           class="save-input" maxlength="20"
           placeholder="Как тебя зовут?">
    <button class="save-btn" id="saveBtn" onclick="saveScore()">✓</button>
  </div>
  <div class="save-status" id="saveStatus"></div>
</div>
```

Имя предзаполнено из профиля (`first_name` из user-data). Можно изменить.

### 5.4 Отображение рейтинга

**На splash-экране:** кнопка «🏆 Рейтинг» → показывает топ-20.

**На финальном экране:** рейтинг показывается автоматически после сохранения, с подсветкой позиции игрока.

```html
<div class="leaderboard" id="leaderboard">
  <h3 class="lb-title">🏆 Рейтинг игроков</h3>
  <div class="lb-list" id="lbList">
    <!-- Динамически заполняется -->
  </div>
</div>
```

```js
function renderLeaderboard(data, myUserId) {
  const list = document.getElementById('lbList');
  list.innerHTML = data.map((entry, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    const isMe = entry.user_id === myUserId;
    return `<div class="lb-row ${isMe ? 'lb-me' : ''}">
      <span class="lb-rank">${medal}</span>
      <span class="lb-name">${escapeHtml(entry.player_name)}</span>
      <span class="lb-score">⭐ ${entry.score}</span>
    </div>`;
  }).join('');
}
```

---

## 6. Промокоды и скидки

### 6.1 Таблица user_rewards

```sql
CREATE TABLE user_rewards (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  game TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'discount',
  discount_percent INT NOT NULL,      -- 25 или 50
  code TEXT UNIQUE NOT NULL,           -- уникальный код 'FE-XXXX'
  product_slug TEXT DEFAULT 'zhelezodeficit',
  expires_at TIMESTAMPTZ NOT NULL,     -- created_at + 24 часа
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои
CREATE POLICY "user_rewards_select"
  ON user_rewards FOR SELECT
  USING (false);  -- Только через service_role в Edge Function

-- Запись только через Edge Function
-- Anon key — всё закрыто

CREATE INDEX idx_user_rewards_user ON user_rewards (user_id, game);
CREATE INDEX idx_user_rewards_code ON user_rewards (code);
CREATE INDEX idx_user_rewards_expires ON user_rewards (expires_at) WHERE NOT redeemed;
```

### 6.2 Генерация промокода

```js
// В Edge Function
function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без I,O,0,1 (не путать)
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + '-' + code; // FE-A7K2
}
```

### 6.3 Логика выдачи скидки

```
Игрок набрал >= 75% (30+ из 40):
  │
  ├─ 75-99% (30-39 из 40) → скидка 25%
  │
  └─ 100% (40 из 40) → скидка 50%
  │
  ▼
Edge Function claim_reward:
  1. Проверяем sessionToken → user_id
  2. Проверяем, что нет активной скидки на эту игру
     (нет записи с expires_at > now() и redeemed = false)
  3. Генерируем код (FE-XXXX)
  4. Сохраняем в user_rewards (expires_at = now() + 24h)
  5. Отправляем email через Resend:
     "Твоя скидка -25% на «Полный гайд по железодефициту»
      Промокод: FE-A7K2
      Действует до: 28 апреля 2026, 18:30"
  6. Возвращаем код + expires_at клиенту
```

### 6.4 Обновлённый экран Reward

```
🎉 Поздравляем!

-25%

На «Полный гайд по железодефициту»

Твой промокод:
┌─────────────┐
│   FE-A7K2   │  [Копировать]
└─────────────┘

⏰ Действует: 23:59:42

💌 Код отправлен на irina@mail.ru

[Открыть гайд →]
[Посмотреть результаты]

────────────────────────

💡 А знаешь что?
Тебе не хватило всего 3 правильных ответа до идеала.
Пройди все 40 из 40 правильно - и получи скидку 50%!
🎯 Цель: 40/40 = -50%
```

### 6.5 Таймер обратного отсчёта

```js
function startRewardTimer(expiresAt) {
  const timerEl = document.getElementById('rewardTimer');
  const interval = setInterval(() => {
    const remaining = new Date(expiresAt) - Date.now();
    if (remaining <= 0) {
      timerEl.textContent = 'Срок истёк';
      clearInterval(interval);
      return;
    }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    timerEl.textContent = `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
}
```

### 6.6 Применение промокода

При покупке гайда через Prodamus:
- Пользователь вводит промокод на странице оплаты
- Либо: в Edge Function `prodamus-webhook` проверяем код, если есть — применяем скидку
- Помечаем `redeemed = true, redeemed_at = now()`

**Вариант попроще (на первое время):** промокод — просто текстовый код, который пользователь показывает/сообщает при обращении. Алексей проверяет в админке и применяет скидку вручную.

---

## 7. Шаринг (мультиплатформа)

### 7.1 Три точки шаринга

| Экран | Тип | Текст |
|-------|-----|-------|
| Splash | Приглашение | «Проверь, что помогает, а что мешает усвоению железа!» |
| Пауза | Приглашение | «Я играю в "Враги и друзья железа" — присоединяйся!» |
| Финал | Результат | «🩸 Я прошла игру... 💪 Продвинутая | ⭐ 3200 | 🎯 32/40» |

### 7.2 Код шаринга

```js
function shareGame(type) {
  let text, url;
  const gameUrl = 'https://app.listoshenkov.ru/games/iron/';
  const deepLink = 'https://t.me/listoshenkov_nav_bot/app?startapp=game_iron';

  if (type === 'invite') {
    text = '🩸 Проверь, что помогает, а что мешает усвоению железа!\n' +
           '40 карточек, 2 уровня - попробуй набрать максимум!\n';
  } else if (type === 'result') {
    text = '🩸 Я прошла игру «Враги и друзья железа»!\n' +
           state.finalEmoji + ' ' + state.finalLevel +
           ' | ⭐ ' + state.score +
           ' | 🎯 ' + state.correct + '/40\n' +
           'Проверь себя!\n';
  }

  // Определяем платформу и выбираем метод
  const tg = window.Telegram?.WebApp;
  const maxApp = window.MaxApp;

  if (tg) {
    // Telegram — через switchInlineQuery или shareUrl
    if (tg.switchInlineQuery) {
      tg.switchInlineQuery(text, ['users', 'groups']);
    } else if (tg.openTelegramLink) {
      // Fallback: отправить ссылку
      const encoded = encodeURIComponent(text + deepLink);
      tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(deepLink) + '&text=' + encoded);
    }
  } else if (maxApp && maxApp.share) {
    // MAX Platform
    maxApp.share({ text: text + gameUrl });
  } else if (navigator.share) {
    // Web Share API (мобильные браузеры)
    navigator.share({
      title: 'Враги и друзья железа',
      text: text,
      url: gameUrl
    }).catch(() => {});
  } else {
    // Fallback — копирование в буфер
    navigator.clipboard.writeText(text + gameUrl).then(() => {
      showToast('Скопировано! Отправь подруге 💌');
    });
  }
}
```

### 7.3 Кнопки в UI

**Splash:**
```html
<button class="share-invite-btn" onclick="shareGame('invite')">
  💌 Отправь подруге
</button>
```

**Пауза (добавляем в pause-actions):**
```html
<button class="pause-action secondary" onclick="shareGame('invite')">
  💌 Поделиться
</button>
```

**Финал:**
```html
<button class="share-result-btn" onclick="shareGame('result')">
  📤 Поделиться результатом
</button>
```

---

## 8. CTA-ссылки (замена заглушек)

### 8.1 Обновлённый объект LINKS

```js
const LINKS = {
  postsIron: '/?goto=topic_iron',
  magicPillsIron: '/?goto=pills',
  guideIron: '/?goto=guide_zhelezodeficit',
  freeMaterials: '/?goto=free'
};
```

### 8.2 Обновлённая функция openLink

```js
function openLink(key) {
  const url = LINKS[key];
  if (!url) return;

  const tg = window.Telegram?.WebApp;

  // Внутренние ссылки (начинаются с /)
  if (url.startsWith('/')) {
    // Сохраняем что пришли из игры (для аналитики)
    localStorage.setItem('came_from', 'game_iron_cta_' + key);
    window.location = url;
    return;
  }

  // Внешние ссылки
  if (tg && tg.openTelegramLink && url.indexOf('t.me') !== -1) {
    tg.openTelegramLink(url);
  } else if (tg && tg.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}
```

### 8.3 Обработка goto в основном приложении

В `index.html` уже есть обработка deep links. Нужно убедиться, что `topic_iron` корректно открывает фильтр «Железо / анемия» в разделе «Подборки по темам».

```js
// В index.html, при обработке URL-параметров
const gotoParam = urlParams.get('goto');
if (gotoParam) {
  if (gotoParam.startsWith('topic_')) {
    const topicSlug = gotoParam.replace('topic_', '');
    showSection('posts');
    setTopicFilter(topicSlug); // 'iron' → фильтр «Железо / анемия»
  } else if (gotoParam === 'pills') {
    showSection('supplements');
  } else if (gotoParam.startsWith('guide_')) {
    const slug = gotoParam.replace('guide_', '');
    showSection('guides');
    openGuide(slug);
  } else if (gotoParam === 'free') {
    showSection('free-guides');
  }
}
```

---

## 9. Edge Function: game-action

### 9.1 Архитектура

Отдельная Edge Function `/functions/v1/game-action` с actions:

| Action | Метод | Описание |
|--------|-------|----------|
| `get_profile` | POST | Проверка сессии + email (для авторизации в игре) |
| `save_score` | POST | Сохранить/обновить результат (upsert, антимат) |
| `leaderboard` | POST | Топ-20 по game |
| `claim_reward` | POST | Сгенерировать промокод скидки |
| `my_rewards` | POST | Мои активные скидки |

### 9.2 Структура запроса/ответа

```js
// Все запросы
{
  "action": "save_score",
  "sessionToken": "...",  // из localStorage
  "data": { ... }         // зависит от action
}
```

### 9.3 Action: get_profile

```ts
// Вход
{ action: 'get_profile', sessionToken: '...' }

// Выход (успех)
{
  "ok": true,
  "user_id": 42,
  "first_name": "Ирина",
  "email": "irina@mail.ru",  // null если не привязан
  "platform": "telegram"
}

// Выход (ошибка)
{ "ok": false, "error": "invalid_session" }
```

### 9.4 Action: save_score

```ts
// Вход
{
  action: 'save_score',
  sessionToken: '...',
  data: {
    player_name: 'Ирина',
    game: 'iron',
    score: 3200,
    correct: 32,
    total: 40,
    max_streak: 8,
    tier: 'expert'
  }
}

// Валидация на сервере:
// 1. sessionToken → user_id
// 2. player_name: 2-20 символов, кириллица/латиница/цифры/пробел/дефис
// 3. player_name: антимат-фильтр
// 4. game: должен быть из списка разрешённых ('iron')
// 5. score, correct, total, max_streak: числа в разумных пределах
// 6. Rate limit: 1 сохранение в минуту на user_id

// Выход
{
  "ok": true,
  "position": 7,      // позиция в рейтинге
  "is_new_best": true  // побил ли свой рекорд
}
```

### 9.5 Action: leaderboard

```ts
// Вход
{ action: 'leaderboard', data: { game: 'iron', limit: 20 } }
// sessionToken не обязателен (рейтинг публичный)

// Выход
{
  "ok": true,
  "leaderboard": [
    { "player_name": "Марина", "score": 5200, "correct": 38, "tier": "expert", "user_id": 15 },
    { "player_name": "Светлана", "score": 4800, "correct": 36, "tier": "expert", "user_id": 23 },
    ...
  ]
}
```

### 9.6 Action: claim_reward

```ts
// Вход
{
  action: 'claim_reward',
  sessionToken: '...',
  data: {
    game: 'iron',
    correct: 32,
    total: 40
  }
}

// Логика:
// 1. Проверить sessionToken → user_id, email
// 2. Проверить correct/total (>= 75%)
// 3. Проверить нет ли активной (неистёкшей) скидки на эту игру
// 4. Определить процент: 75-99% → 25%, 100% → 50%
// 5. Сгенерировать код FE-XXXX
// 6. Сохранить в user_rewards
// 7. Отправить email через Resend
// 8. Вернуть код + expires_at

// Выход
{
  "ok": true,
  "code": "FE-A7K2",
  "discount_percent": 25,
  "expires_at": "2026-04-28T18:30:00Z",
  "email_sent": true
}

// Или если уже есть активная скидка
{
  "ok": true,
  "existing": true,
  "code": "FE-B3M9",
  "discount_percent": 25,
  "expires_at": "2026-04-28T14:00:00Z"
}
```

### 9.7 CORS

Добавить в разрешённые origins (как у всех функций):
```
https://app.listoshenkov.ru
https://dev.listoshenkov.ru
```

Функция не нужна извне (TG/MAX) — вызывается только с нашего домена.

---

## 10. Хаб игр (games/index.html)

### 10.1 Дизайн

Лёгкая промежуточная страница. Тот же стиль, что основное приложение:

```
┌─────────────────────────────┐
│  ← В Навигатор              │
│                              │
│  🎮 Полезные игры            │
│                              │
│  ┌──────────────────────┐    │
│  │  🩸                   │    │
│  │  Враги и друзья       │    │
│  │  железа               │    │
│  │                       │    │
│  │  40 карточек -        │    │
│  │  проверь, что         │    │
│  │  помогает, а что      │    │
│  │  мешает усвоению      │    │
│  │  железа               │    │
│  │                       │    │
│  │  [🏆 Рейтинг]         │    │
│  │  [▶ Играть]           │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  🔒 Скоро             │    │
│  │  Новая игра           │    │
│  │  про витамин B12      │    │
│  └──────────────────────┘    │
│                              │
└─────────────────────────────┘
```

### 10.2 Ключевые элементы

- Шапка с кнопкой «← В Навигатор»
- Карточки игр (пока одна активная + одна-две "скоро")
- Каждая карточка: иконка, название, описание, кнопки «Рейтинг» и «Играть»
- Dark mode (TG/MAX)
- Шрифт Nunito
- Responsive

---

## 11. Кнопка в основном приложении

### 11.1 Где добавить

В секции навигации по разделам (рядом с «Подборки по темам», «Полезные материалы» и т.д.):

```js
// В массиве разделов (или там, где они определяются)
{
  id: 'games',
  icon: '🎮',
  title: 'Полезные игры',
  badge: 'NEW',  // временно, чтобы привлечь внимание
  action: () => {
    localStorage.setItem('app_return_state', JSON.stringify({
      section: currentSection,
      scrollY: window.scrollY,
      timestamp: Date.now()
    }));
    window.location = '/games/';
  }
}
```

### 11.2 Позиция в меню

Предлагаю после «Отзывы» и перед скрытыми разделами. Или даже выше — после «Волшебные таблетки», чтобы было заметнее.

### 11.3 Баннер / промо-карточка (позже)

Можно добавить в баннерную карусель на главной:
- «🩸 Новая игра! Проверь, что помогает усвоению железа → Играть»
- Клик → `/games/iron/`

---

## 12. Аналитика (этап 6, позже)

### 12.1 Новые события

| Событие | Параметры | Когда |
|---------|-----------|-------|
| `game_opened` | game, platform, referer | Открыл страницу игры |
| `game_started` | game | Нажал «Начать» |
| `game_paused` | game, card_index | Поставил на паузу |
| `game_resumed` | game, card_index | Продолжил |
| `game_levelup` | game, l1_score, l1_correct | Перешёл на уровень 2 |
| `game_completed` | game, score, correct, tier, time_total | Завершил игру |
| `game_score_saved` | game, score, position | Сохранил в рейтинг |
| `game_reward_claimed` | game, discount_percent, code | Получил промокод |
| `game_cta_clicked` | game, cta_key (postsIron/guideIron/...) | Кликнул CTA |
| `game_shared` | game, share_type (invite/result), platform | Поделился |
| `game_email_bound` | game | Привязал email (если не был) |

### 12.2 Реализация

Используем тот же `trackEvent()` что в основном приложении:

```js
function trackEvent(name, params) {
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) return;

  fetch(SUPABASE_URL + '/functions/v1/user-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'track_event',
      sessionToken: sessionToken,
      event: name,
      params: params || {}
    })
  }).catch(() => {});
}
```

---

## 13. Безопасность

### 13.1 Чеклист

| Пункт | Описание | Решение |
|-------|----------|---------|
| RLS | game_scores, user_rewards | Включён. SELECT public, INSERT/UPDATE через service_role |
| CORS | game-action | Только app/dev.listoshenkov.ru |
| sessionToken | Валидация HMAC | Тот же механизм что в upsert-user |
| Антимат | Клиент + сервер | Regex-фильтр на корни |
| Rate limit | save_score | 1 запись в минуту на user_id |
| Rate limit | claim_reward | 1 промокод на user_id+game (пока активен) |
| XSS | player_name в рейтинге | escapeHtml() при рендере |
| Промокоды | Не угадываемые | 4 символа из 32 знаков = 1M+ комбинаций |
| Email | Привязка перед игрой | OTP верификация через Resend |

### 13.2 Nginx

Папка `/games/` наследует security headers от основного vhost `app.listoshenkov.ru`. Дополнительная настройка не нужна, если CSP основного приложения покрывает нужные домены (fonts.googleapis, fonts.gstatic, uckuyoyubub.beget.app для API).

---

## 14. Перспективы и будущие игры

### 14.1 Потенциальные игры

| Игра | Механика | Тема |
|------|----------|------|
| Враги и друзья B12 | Свайп (как железо) | Витамин B12 |
| Щитовидка: правда/миф | True/False карточки | Мифы о щитовидке |
| Анализы: норма или нет | Показатель + значение → оценить | Чтение анализов |
| Что сначала? | Drag-and-drop порядка | Протокол восстановления |
| Найди причину | Квест с ветвлением | Диагностика по симптомам |

### 14.2 Общий фреймворк для игр

Когда будет 2+ игры, можно выделить общие компоненты:

```
/games/
├── common/
│   ├── auth.js          ← авторизация, проверка email
│   ├── share.js         ← шаринг (TG/MAX/Web)
│   ├── leaderboard.js   ← компонент рейтинга
│   ├── rewards.js       ← промокоды, таймер
│   ├── analytics.js     ← трекинг событий
│   └── styles.css       ← общие стили (кнопки, модалки)
├── index.html           ← хаб
├── iron/index.html
├── b12/index.html
└── thyroid/index.html
```

Пока что всё в одном файле (как и основное приложение) — выносить на этапе 2-3 игр.

### 14.3 Монетизация через игры

- **Скидки:** геймифицированные промокоды (уже реализуем)
- **Баннеры:** после игры — релевантные CTA на продукты
- **Курсы:** «Хочешь разобраться глубже? → Курс по железу»
- **Рефералы:** «Приведи 3 подруг → бонус»
- **Подписка «Ближний круг»:** после 3+ игр → предложение

### 14.4 Социальная механика

- **Рейтинг по неделям:** «Лучший результат недели»
- **Сравнение с подругой:** «Ирина набрала 3200, попробуй больше!»
- **Ачивки:** «Первая игра», «5 игр подряд», «Все 40/40»
- **Турниры:** ежемесячный рейтинг с призом

---

## 15. Порядок реализации

### Этап 1 — Файлы (Claude.ai)

| # | Файл | Описание |
|---|------|----------|
| 1.1 | `games/iron/index.html` | Доработанная игра: авторизация, email, рейтинг, шаринг, промокоды, CTA |
| 1.2 | `games/index.html` | Хаб игр |

### Этап 2 — Серверная часть (задача для CC)

| # | Задача | Описание |
|---|--------|----------|
| 2.1 | SQL миграция | Таблицы game_scores + user_rewards + RLS + индексы |
| 2.2 | Edge Function | game-action (get_profile, save_score, leaderboard, claim_reward) |
| 2.3 | Деплой функции | SSH → docker compose up -d --force-recreate functions |

### Этап 3 — Основное приложение (задача для CC)

| # | Задача | Описание |
|---|--------|----------|
| 3.1 | Кнопка в меню | «🎮 Полезные игры» + badge NEW |
| 3.2 | Deep links | startapp=games, startapp=game_iron |
| 3.3 | return_to | Логика возврата после авторизации |
| 3.4 | goto handler | Обработка /?goto=topic_iron и др. |

### Этап 4 — Деплой и тест

| # | Задача |
|---|--------|
| 4.1 | Деплой всего на dev (miniapp-dev) |
| 4.2 | Тест: авторизация TG / MAX / email |
| 4.3 | Тест: игра, рейтинг, шаринг |
| 4.4 | Тест: скидки и email с промокодом |
| 4.5 | Перенос на prod (после ОК от Алексея) |

### Этап 5 — Аналитика (позже)

| # | Задача |
|---|--------|
| 5.1 | Добавить trackEvent() во все точки |
| 5.2 | Отчёт в админке: игры → кол-во игроков, средний результат, конверсия в CTA |

---

## 16. Конфигурация для Edge Function

### Секреты (уже есть в docker-compose.yml)

- `SUPABASE_URL` — для запросов к БД
- `SUPABASE_SERVICE_ROLE_KEY` — для записи в таблицы
- `RESEND_API_KEY` — для отправки email с промокодом

Новых секретов НЕ нужно.

### CORS origins для game-action

```ts
const ALLOWED_ORIGINS = [
  'https://app.listoshenkov.ru',
  'https://dev.listoshenkov.ru',
];
```

---

## 17. Примечания

### Что НЕ менять

- Mini App URL (app.listoshenkov.ru) — не менять на github.io
- RLS — не ослаблять
- CORS — не добавлять listosha.github.io
- Docker-порты — не открывать наружу

### Зависимости от существующего кода

- `sessionToken` в localStorage — формат и валидация совместимы с upsert-user
- `send-otp` — готовый endpoint для привязки email
- `user-data` — можно расширить action get_profile или сделать отдельно
- Система deep links в index.html — расширяем, не ломаем

### Размер файла игры

Исходный файл: ~1930 строк. После доработки (авторизация, рейтинг, шаринг, скидки): ~2500-2800 строк. Это нормально — файл самодостаточный и не подключается в index.html.
