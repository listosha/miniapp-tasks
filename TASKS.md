# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## 🔴 ПРИОРИТЕТ: Модуль «Полезные игры»

### T-GAME-FULL: Внедрение игры «Враги и друзья железа»
**Приоритет:** 🔴 | **Статус:** ✅ Выполнено на DEV — ждёт тестирования и ОК Алексея
**Спецификация:** файл `zhelezo-development.md` в проекте Claude.ai (полная документация: архитектура, таблицы, Edge Function, авторизация, рейтинг, шаринг, промокоды, безопасность)
**Исходный файл игры:** `~/Downloads/index.html` (игра «Враги и друзья железа», 1933 строки). Если нет в Downloads — спросить у Алексея.

**Цель:** полностью рабочий модуль игр на dev.listoshenkov.ru, готовый к переносу на прод.

---

#### T-GAME-1: SQL миграция
**Статус:** ✅ Выполнено
**Цель:** создать таблицы game_scores и user_rewards в БД

```sql
-- Выполнить через: ssh root@159.194.213.14
-- docker exec -i supabase-db psql -U supabase_admin -d postgres

CREATE TABLE IF NOT EXISTS game_scores (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT '',
  game TEXT NOT NULL DEFAULT 'iron',
  score INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 40,
  max_streak INT NOT NULL DEFAULT 0,
  tier TEXT CHECK (tier IN ('beginner', 'middle', 'expert')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game)
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_scores_select_all" ON game_scores FOR SELECT USING (true);
CREATE INDEX idx_game_scores_game_score ON game_scores (game, score DESC);
CREATE INDEX idx_game_scores_user_game ON game_scores (user_id, game);

CREATE TABLE IF NOT EXISTS user_rewards (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  discount_percent INT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  product_slug TEXT DEFAULT 'zhelezodeficit',
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
-- SELECT/INSERT/UPDATE закрыты для anon. Только через service_role (Edge Function).
CREATE INDEX idx_user_rewards_user ON user_rewards (user_id, game);
CREATE INDEX idx_user_rewards_code ON user_rewards (code);
```

**Проверка:** `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('game_scores', 'user_rewards');` — обе true.

---

#### T-GAME-2: Edge Function game-action
**Статус:** ✅ Выполнено, задеплоено | **Зависит от:** T-GAME-1
**Цель:** новая Edge Function `game-action` с 5 actions

**Создать файл:** `/opt/beget/supabase/volumes/functions/game-action/index.ts`

**Actions:**
1. `get_profile` — проверка sessionToken → user_id, first_name, email, platform. Тот же HMAC что в upsert-user.
2. `save_score` — upsert в game_scores. Валидация: player_name (2-20 символов, кириллица/латиница/цифры/пробел/дефис, антимат-фильтр), rate limit 1 запись в минуту на user_id. Обновлять только если новый score выше (GREATEST).
3. `leaderboard` — SELECT топ-20 из game_scores по game ORDER BY score DESC. sessionToken не обязателен.
4. `claim_reward` — проверить sessionToken + email + correct/total >= 75%. Проверить нет ли активной скидки (expires_at > now()). Сгенерировать код FE-XXXX (буквы без I/O + цифры без 0/1). Сохранить в user_rewards (expires_at = now() + 24h). Отправить email через Resend. Rate limit: 1 промокод на user_id+game пока активен.
5. `my_rewards` — вернуть активные скидки пользователя

**CORS:** только `https://app.listoshenkov.ru` и `https://dev.listoshenkov.ru`
**Безопасность:** sessionToken валидация через HMAC (как в upsert-user), service_role для записи в таблицы, escapeHtml для player_name
**Деплой:** `cd /opt/beget/supabase && docker compose up -d --force-recreate functions`

**Ссылка на полную спецификацию API:** zhelezo-development.md, разделы 4, 5, 6, 9

---

#### T-GAME-3: Доработка файла игры → games/iron/index.html
**Статус:** ✅ Выполнено | **Зависит от:** T-GAME-2
**Цель:** доработать исходный HTML игры, положить в miniapp-dev/games/iron/index.html

**Исходник:** ~/Downloads/index.html (или где Алексей положил файл)
**Спецификация изменений:** zhelezo-development.md, разделы 3.4, 4, 5, 7, 8

**Что добавить в файл:**

1. **Авторизация (перед splash):** проверка sessionToken → get_profile. Нет токена → экран «Войди в Навигатор» с кнопкой → redirect на `/` с `return_to` в localStorage. Токен есть, email нет → экран «Привяжи почту» (OTP через send-otp + upsert-user). Токен есть, email есть → splash.

2. **Рабочие CTA-ссылки (заменить LINKS):**
```js
const LINKS = {
  postsIron: '/?goto=topic_iron',
  magicPillsIron: '/?goto=pills_iron',
  guideIron: '/?goto=guide_zhelezodeficit',
  freeMaterials: '/?goto=freeguide_protokol-zhelezo-8-nedel'
};
```
Функция openLink — через `window.location` (тот же домен).

3. **Рейтинг:**
   - На splash: кнопка «🏆 Рейтинг» (загружает leaderboard)
   - На final: поле ввода имени (предзаполнено из first_name) + кнопка сохранить
   - После сохранения: показать рейтинг с подсветкой позиции игрока
   - Антимат-фильтр на клиенте (regex, см. спецификацию раздел 5.2)

4. **Шаринг (3 точки):**
   - Splash: кнопка «💌 Отправь подруге»
   - Пауза: кнопка «💌 Поделиться»
   - Финал: кнопка «📤 Поделиться результатом»
   - Мультиплатформа: TG (switchInlineQuery/openTelegramLink), MAX (MaxApp.share), Web (navigator.share), fallback clipboard
   - Код: zhelezo-development.md, раздел 7.2

5. **Промокоды:** при >= 75% верно → вызов claim_reward → показ кода + таймер обратного отсчёта + «Код отправлен на email». Код: zhelezo-development.md, раздел 6

6. **Кнопка «← В Навигатор»** на splash и финале

7. **Исправить emoji:** 🫥 → 😔 (не отображается на Windows)

8. **Порядок CTA-кнопок на финале (для всех тиров):**
   - 🔥 Гайд по железодефициту — 1490₽ (со скидкой если есть)
   - 💊 Волшебные таблетки — Железо
   - 📋 Бесплатные материалы — Протокол 8 недель
   - 📚 Посты по железу
   - 💾 Сохранить результат (рейтинг)
   - 📤 Поделиться результатом
   - 🔄 Играть снова

**SUPABASE_URL** для fetch: `https://uckuyoyubub.beget.app`

---

#### T-GAME-4: Хаб игр — games/index.html
**Статус:** ✅ Выполнено
**Цель:** создать miniapp-dev/games/index.html — страница-список игр

**Дизайн:** тот же стиль (Nunito, тёплые тона, dark mode через TG colorScheme). Кнопка «← В Навигатор». Одна активная карточка «Враги и друзья железа» (с кнопками Играть и Рейтинг). Одна заглушка «🔒 Скоро — Витамин B12». Подробности: zhelezo-development.md, раздел 10.

---

#### T-GAME-5: Кнопка + deep links в основном приложении
**Статус:** ✅ Выполнено
**Цель:** добавить в miniapp-dev/index.html

1. **Кнопка «🎮 Полезные игры»** в меню (после «Волшебные таблетки» или «Отзывы»), badge NEW. При клике: сохранить состояние в localStorage → `window.location = '/games/'`

2. **Deep links в handleDeepLink:**
```js
} else if (param === 'games') {
  window.location = '/games/';
} else if (param.startsWith('game_')) {
  window.location = '/games/' + param.replace('game_', '') + '/';
} else if (param === 'posts_iron') {
  currentFilter = 'Железо и анемия';
  openSection('podborki');
} else if (param === 'pills_iron') {
  suppFilter = 'Железо';
  openSection('pills');
}
```

3. **return_to:** после авторизации проверить `localStorage.getItem('return_to')`, если есть — redirect туда и удалить.

4. **goto handler:** если URL содержит `?goto=topic_iron` → открыть подборки с фильтром Железо. `?goto=pills_iron` → БАДы с фильтром. `?goto=guide_xxx` → открыть гайд. `?goto=freeguide_xxx` → открыть бесплатный материал.

---

#### T-GAME-6: Деплой на dev и тест
**Статус:** ✅ Запушено на dev — нужно тестирование Алексея | **Зависит от:** T-GAME-1..5
**Цель:** всё работает на dev.listoshenkov.ru

1. Закоммитить и запушить в miniapp-dev
2. Проверить: dev.listoshenkov.ru/games/ → хаб
3. Проверить: dev.listoshenkov.ru/games/iron/ → игра
4. Проверить авторизацию (с токеном, без токена, без email)
5. Проверить рейтинг (сохранение, отображение)
6. Проверить CTA-ссылки (все 4 ведут куда надо)
7. Проверить шаринг
8. Проверить deep link: ?startapp=game_iron

**НЕ переносить на прод без ОК от Алексея.**

---

## ⏳ Активные задачи

### T-QUIZ-PROMPTS: Квиз-промпты в 5 точках приложения
**Приоритет:** 🟡 | **Статус:** На паузе (ждём данные аналитики квиза)

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато

---

## ✅ Выполнено (28.04.2026)

### T-ANALYTICS: Аналитика приложения за 2 недели ✅
### T-QUIZ-ANALYTICS: Полная аналитика квиза ✅
### T-QUIZ-BANNER: Квиз-баннер вместо карусели ✅
### T-HIDDEN-POSTS: Удаление скрытых постов ✅
### T-GIT-SYNC: Синхронизация DEV → PROD ✅

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
