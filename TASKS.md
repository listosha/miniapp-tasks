# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## ⏳ Активные задачи

### T-QUIZ-PROMPTS: Квиз-промпты в 3 каналах приложения
**Приоритет:** 🔴 | **Статус:** Готово к выполнению
**Цель:** Дать второй шанс пройти квиз тем, кто не увидел/проигнорировал баннер на главной. Покрытие 3 разных паттернов поведения без дублирования и без вреда конверсии.

**Решение по форматам (28.04, после повторного анализа):**
- ❌ Тост 10 сек — раздражает ЦА (женщины 35-65), дублирует sticky.
- ❌ Каталог БАДов — ломает воронку покупки.
- ❌ Inline-разрыв в середине поста — агрессивный паттерн, противоречит тёплому тону.
- ❌ Exit-intent попап — на мобильном TG/MAX некорректно работает с системной Back.
- ✅ Sticky-плашка при доскролле поста (канал A).
- ✅ Карточка между постами в ленте (канал B).
- ✅ Блок после возврата из PDF (канал C).

**Подзадачи и порядок выполнения:**
1. T-QUIZ-PROMPTS-RLS — миграция RLS (блокер).
2. T-QUIZ-PROMPTS-COMMON — общие JS-утилиты (блокер для A/B/C).
3. T-QUIZ-PROMPTS-A — sticky-плашка.
4. T-QUIZ-PROMPTS-B — карточка в ленте.
5. T-QUIZ-PROMPTS-C — блок после PDF.

> Делаем сначала на DEV (miniapp-dev), после ОК Алексея — переносим на PROD.
> Все 9 новых event_name должны логироваться в analytics_events корректно.

---

### T-QUIZ-PROMPTS-RLS: Расширить RLS для новых quiz-событий
**Приоритет:** 🔴 | **Статус:** ✅ Выполнено | **Зависимости:** нет
**Цель:** Разрешить запись 9 новых quiz-событий (анонимно и авторизованно) в analytics_events.

**FOCUS:**
- Таблица `analytics_events`, политика INSERT для anonymous и authenticated.

**EXCLUDE:**
- Не трогать другие политики (SELECT, UPDATE, DELETE).
- Не трогать другие таблицы.
- Не отключать существующие event_name из whitelist.

**Что сделать:**
1. SSH на сервер: `ssh root@159.194.213.14`.
2. Найти текущую политику RLS на analytics_events для INSERT (там есть whitelist event_name для анонимов).
   ```bash
   docker exec -i supabase-db psql -U supabase_admin -d postgres -c "SELECT polname, pg_get_expr(polqual, polrelid) FROM pg_policy WHERE polrelid = 'public.analytics_events'::regclass;"
   ```
3. Добавить в whitelist 9 новых event_name:
   - `quiz_sticky_shown`, `quiz_sticky_dismissed`, `quiz_sticky_clicked`
   - `quiz_feedcard_shown`, `quiz_feedcard_dismissed`, `quiz_feedcard_clicked`
   - `quiz_postpdf_shown`, `quiz_postpdf_dismissed`, `quiz_postpdf_clicked`
4. Применить миграцию через `ALTER POLICY` или `DROP POLICY + CREATE POLICY` (как сделано для предыдущих 10 quiz-событий).
5. Сохранить SQL миграции в `miniapp-dev/db/migrations/2026-04-28-quiz-prompts-rls.sql` (или аналогичный путь, как принято в репо).

**Acceptance:**
- [ ] Политика INSERT включает все 9 новых event_name плюс старые.
- [ ] Тест через анонимный INSERT с одним из новых event_name проходит.
- [ ] SQL-файл миграции закоммичен в miniapp-dev.

---

### T-QUIZ-PROMPTS-COMMON: Общие утилиты квиз-промптов
**Приоритет:** 🔴 | **Статус:** Готово к выполнению | **Зависимости:** T-QUIZ-PROMPTS-RLS
**Цель:** Один раз написать общую логику блокировок и трекинга, чтобы каналы A/B/C использовали её, а не дублировали.

**FOCUS:**
- `index.html` (или соответствующий JS-модуль), новый блок утилит `// ===== Quiz Prompts: common =====`.
- Использует существующий `currentUser`, `trackEvent`, `localStorage`, `sessionStorage`.

**EXCLUDE:**
- Не трогать логику квиза самого по себе (quizFinish, quiz-баннер).
- Не менять формат событий quiz_completed/quiz_skipped (это уже сделано в T-QUIZ-ANALYTICS).
- Не трогать quiz_completed_at в users (это отдельная задача T-QUIZ-COMPLETED-AT).

**Что сделать:**
Добавить функции в общий блок:

```js
// ===== Quiz Prompts: common =====

// Глобальная блокировка (квиз пройден или 3 dismiss за всё время)
function isQuizPromptBlocked() {
  // 1. Авторизованный юзер уже прошёл квиз
  if (window.currentUser && window.currentUser.quiz_completed_at) return true;
  // 2. Локальный флаг прохождения (на случай если currentUser ещё не подгружен)
  if (localStorage.getItem('quiz_completed') === '1') return true;
  // 3. Активный платный CTA на текущем экране (см. p.4 ниже) — флаг ставит вызывающий код
  // 4. Глобальный лимит dismiss
  const dismissTotal = parseInt(localStorage.getItem('quiz_prompt_dismiss_total') || '0', 10);
  if (dismissTotal >= 3) return true;
  // 5. Deep-link заход — не отвлекать пользователя
  if (window.__deepLinkActive === true) return true;
  return false;
}

// Локальная блокировка по сессии (один канал — один показ за сессию)
function isChannelBlockedThisSession(channel) {
  return sessionStorage.getItem('quiz_prompt_' + channel + '_shown') === '1';
}

function markChannelShown(channel) {
  sessionStorage.setItem('quiz_prompt_' + channel + '_shown', '1');
  trackEvent('quiz_' + channel + '_shown', {});
}

function onQuizPromptDismiss(channel) {
  const total = parseInt(localStorage.getItem('quiz_prompt_dismiss_total') || '0', 10);
  localStorage.setItem('quiz_prompt_dismiss_total', String(total + 1));
  trackEvent('quiz_' + channel + '_dismissed', {});
}

function onQuizPromptClick(channel) {
  trackEvent('quiz_' + channel + '_clicked', {});
  // Открыть квиз — использовать существующую функцию
  openQuiz({ source: 'prompt_' + channel });
}
```

Где `channel` принимает значения: `'sticky'`, `'feedcard'`, `'postpdf'`.

**Acceptance:**
- [ ] Утилиты добавлены в один блок, не разбросаны по файлу.
- [ ] `isQuizPromptBlocked()` возвращает true если квиз пройден.
- [ ] `isQuizPromptBlocked()` возвращает true после 3-го dismiss.
- [ ] `markChannelShown('sticky')` пишет в analytics_events событие `quiz_sticky_shown`.
- [ ] Существующая функция `openQuiz` (или её аналог) находится и вызывается с параметром source.

---

### T-QUIZ-PROMPTS-A: Sticky-плашка при доскролле поста
**Приоритет:** 🔴 | **Статус:** Готово к выполнению | **Зависимости:** T-QUIZ-PROMPTS-COMMON
**Цель:** Когда пользователь доскроллил пост на 80%+, снизу выезжает плашка с CTA на квиз. Не блокирует контент, не пропадает сама.

**FOCUS:**
- `index.html` — экран просмотра поста (post detail).
- Новый HTML-блок `#quizStickyBar` в конце body.
- Новый CSS-блок `.quiz-sticky-*`.
- Новая JS-функция `initQuizSticky()`, вызывается при открытии поста.

**EXCLUDE:**
- Лента постов (это канал B).
- PDF viewer (это канал C).
- Не менять логику открытия/закрытия поста.
- Не менять разметку самого поста.

**Что сделать:**

1. HTML (добавить в конец body):
```html
<div id="quizStickyBar" class="quiz-sticky-bar" hidden>
  <button class="quiz-sticky-close" aria-label="Закрыть" onclick="dismissQuizSticky()">×</button>
  <div class="quiz-sticky-icon">🧭</div>
  <div class="quiz-sticky-text">
    <strong>Не знаешь с чего начать?</strong>
    <span>Мини-тест на 1 минуту - подскажем направление</span>
  </div>
  <button class="quiz-sticky-cta" onclick="clickQuizSticky()">Пройти</button>
</div>
```

2. CSS (тон тёплый, не агрессивный, шрифт Nunito):
```css
.quiz-sticky-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-bg, #fff);
  border-top: 1px solid var(--border, #eee);
  box-shadow: 0 -6px 20px rgba(0,0,0,0.08);
  padding: 14px 16px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 50;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  font-family: 'Nunito', sans-serif;
}
.quiz-sticky-bar.visible { transform: translateY(0); }
.quiz-sticky-icon { font-size: 24px; }
.quiz-sticky-text { flex: 1; display: flex; flex-direction: column; }
.quiz-sticky-text strong { font-size: 15px; color: var(--text); }
.quiz-sticky-text span { font-size: 13px; color: var(--text-secondary, #777); }
.quiz-sticky-cta {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.quiz-sticky-close {
  position: absolute;
  top: 6px;
  right: 8px;
  background: transparent;
  border: 0;
  font-size: 22px;
  color: var(--text-secondary, #777);
  cursor: pointer;
  padding: 4px 8px;
}
```

3. JS:
```js
function initQuizSticky() {
  if (isQuizPromptBlocked()) return;
  if (isChannelBlockedThisSession('sticky')) return;
  if (window.__postHasPaidCta === true) return; // выставляется при рендере поста с активным CTA на покупку

  const post = document.querySelector('#postDetail') || document.querySelector('.post-content');
  if (!post) return;

  let triggered = false;
  const onScroll = () => {
    if (triggered) return;
    const rect = post.getBoundingClientRect();
    const scrolled = (window.innerHeight - rect.top);
    const total = post.offsetHeight;
    if (total > 0 && scrolled / total >= 0.8) {
      triggered = true;
      window.removeEventListener('scroll', onScroll);
      showQuizSticky();
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

function showQuizSticky() {
  const bar = document.getElementById('quizStickyBar');
  if (!bar) return;
  bar.hidden = false;
  requestAnimationFrame(() => bar.classList.add('visible'));
  markChannelShown('sticky');
}

function dismissQuizSticky() {
  const bar = document.getElementById('quizStickyBar');
  if (!bar) return;
  bar.classList.remove('visible');
  setTimeout(() => { bar.hidden = true; }, 300);
  onQuizPromptDismiss('sticky');
}

function clickQuizSticky() {
  dismissQuizSticky();
  onQuizPromptClick('sticky');
}
```

4. Вызвать `initQuizSticky()` в функции открытия поста (после рендера контента).
5. Очистить состояние при закрытии поста (`removeEventListener`, скрыть бар).

**Acceptance:**
- [ ] На посте без CTA на покупку, при скролле 80%+ — плашка выезжает снизу.
- [ ] Плашка не закрывает кнопку «Назад» / нативные UI MAX и TG.
- [ ] Клик «×» закрывает плашку и пишет `quiz_sticky_dismissed`.
- [ ] Клик «Пройти» открывает квиз и пишет `quiz_sticky_clicked`.
- [ ] Повторное открытие того же или другого поста в той же сессии — плашка не показывается.
- [ ] После 3 dismiss суммарно — плашка не показывается.
- [ ] Если у юзера `quiz_completed_at` — плашка не показывается.
- [ ] При закрытии поста event-listener скролла снят (нет утечки).

---

### T-QUIZ-PROMPTS-B: Карточка между постами в ленте
**Приоритет:** 🔴 | **Статус:** Готово к выполнению | **Зависимости:** T-QUIZ-PROMPTS-COMMON
**Цель:** В ленте постов на главной экран — между 4-м и 5-м постом вставлять промо-карточку квиза, визуально отличающуюся от карточки поста.

**FOCUS:**
- `index.html` — функция рендера ленты постов (там где `<div class="post-card">` или аналог).
- Новый CSS-блок `.quiz-feedcard-*`.

**EXCLUDE:**
- Карточка просмотра поста (канал A).
- PDF viewer (канал C).
- Не менять структуру `<div class="post-card">`.
- Не менять логику пагинации/загрузки постов.

**Что сделать:**

1. В функции рендера ленты после 4-го элемента вставить:
```js
function renderFeedQuizCard() {
  if (isQuizPromptBlocked()) return '';
  if (isChannelBlockedThisSession('feedcard')) return '';
  // Помечаем что показали — но только когда DOM реально вставлен (см. p.2)
  return `
    <div class="quiz-feedcard" data-channel="feedcard">
      <button class="quiz-feedcard-close" aria-label="Закрыть">×</button>
      <div class="quiz-feedcard-icon">🧭</div>
      <div class="quiz-feedcard-title">Не знаешь, с чего начать разбор?</div>
      <div class="quiz-feedcard-text">Мини-тест на 1 минуту - подскажем твоё главное направление прямо сейчас.</div>
      <button class="quiz-feedcard-cta">Пройти тест</button>
    </div>
  `;
}
```

2. После innerHTML рендера ленты — вызвать `markChannelShown('feedcard')` если DOM содержит `.quiz-feedcard`. Подвесить обработчики на close/cta:
```js
function bindFeedQuizCard() {
  const card = document.querySelector('.quiz-feedcard');
  if (!card) return;
  markChannelShown('feedcard');
  card.querySelector('.quiz-feedcard-close').addEventListener('click', () => {
    card.remove();
    onQuizPromptDismiss('feedcard');
  });
  card.querySelector('.quiz-feedcard-cta').addEventListener('click', () => {
    onQuizPromptClick('feedcard');
  });
}
```

3. CSS:
```css
.quiz-feedcard {
  position: relative;
  background: linear-gradient(135deg, #fff5e6 0%, #ffe7d4 100%);
  border-radius: 16px;
  padding: 20px 18px 18px;
  margin: 12px 0;
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  font-family: 'Nunito', sans-serif;
}
.quiz-feedcard-icon { font-size: 28px; margin-bottom: 8px; }
.quiz-feedcard-title { font-weight: 700; font-size: 17px; margin-bottom: 6px; }
.quiz-feedcard-text { font-size: 14px; color: var(--text-secondary, #555); margin-bottom: 14px; line-height: 1.4; }
.quiz-feedcard-cta {
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 10px 22px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.quiz-feedcard-close {
  position: absolute;
  top: 8px;
  right: 10px;
  background: transparent;
  border: 0;
  font-size: 20px;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 4px 8px;
}
```

4. Если в ленте меньше 5 постов — не вставлять карточку (cделать проверку `posts.length >= 5`).

**Acceptance:**
- [ ] При >= 5 постах в ленте между 4-м и 5-м постом — карточка квиза.
- [ ] Карточка визуально отличается от карточки поста (тёплый градиент, иконка компаса).
- [ ] Клик «×» убирает карточку и пишет `quiz_feedcard_dismissed`.
- [ ] Клик «Пройти тест» открывает квиз и пишет `quiz_feedcard_clicked`.
- [ ] При повторном рендере ленты в той же сессии — карточка не вставляется.
- [ ] После 3 dismiss суммарно — карточка не показывается.
- [ ] Если у юзера `quiz_completed_at` — карточка не показывается.

---

### T-QUIZ-PROMPTS-C: Блок после возврата из PDF
**Приоритет:** 🔴 | **Статус:** Готово к выполнению | **Зависимости:** T-QUIZ-PROMPTS-COMMON
**Цель:** После закрытия PDF (особенно гайда «Железодефицит» — топ-контент) показать блок с предложением пройти квиз. Самая горячая аудитория, момент пиковой вовлечённости.

**FOCUS:**
- `index.html` — функция/обработчик закрытия PDF viewer (искать `closePdf`, `pdfViewerClose`, `viewer.close` или аналог).
- Новый HTML-блок-модалка `#quizPostPdfBlock`.
- Новый CSS-блок `.quiz-postpdf-*`.

**EXCLUDE:**
- Не менять PDF viewer сам по себе.
- Не менять auth-флоу.
- Не отслеживать «как долго читал PDF» — упрощаем, показываем при любом закрытии.

**Что сделать:**

1. HTML (модалка-карточка по центру):
```html
<div id="quizPostPdfBlock" class="quiz-postpdf-overlay" hidden>
  <div class="quiz-postpdf-card">
    <div class="quiz-postpdf-icon">🧭</div>
    <div class="quiz-postpdf-title">Понравился гайд?</div>
    <div class="quiz-postpdf-text">
      Если хочешь понять, какое направление здоровья сейчас просит твоего внимания -
      сделай мини-тест. 5 вопросов, 1 минута.
    </div>
    <button class="quiz-postpdf-cta" onclick="clickQuizPostPdf()">Пройти тест</button>
    <button class="quiz-postpdf-skip" onclick="dismissQuizPostPdf()">Не сейчас</button>
  </div>
</div>
```

2. CSS:
```css
.quiz-postpdf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  font-family: 'Nunito', sans-serif;
}
.quiz-postpdf-card {
  background: var(--card-bg, #fff);
  width: 100%;
  max-width: 480px;
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 28px;
  text-align: center;
  animation: quizPostPdfSlideUp 0.3s ease;
}
@keyframes quizPostPdfSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.quiz-postpdf-icon { font-size: 36px; margin-bottom: 10px; }
.quiz-postpdf-title { font-weight: 700; font-size: 19px; margin-bottom: 10px; }
.quiz-postpdf-text { font-size: 14px; color: var(--text-secondary, #555); line-height: 1.5; margin-bottom: 20px; }
.quiz-postpdf-cta {
  display: block;
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 14px;
  font-weight: 700;
  font-size: 15px;
  font-family: inherit;
  cursor: pointer;
  margin-bottom: 8px;
}
.quiz-postpdf-skip {
  background: transparent;
  border: 0;
  color: var(--text-secondary, #888);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  padding: 8px;
}
```

3. JS:
```js
function maybeShowQuizPostPdf() {
  if (isQuizPromptBlocked()) return;
  if (isChannelBlockedThisSession('postpdf')) return;

  const overlay = document.getElementById('quizPostPdfBlock');
  if (!overlay) return;
  overlay.hidden = false;
  markChannelShown('postpdf');
}

function dismissQuizPostPdf() {
  const overlay = document.getElementById('quizPostPdfBlock');
  if (!overlay) return;
  overlay.hidden = true;
  onQuizPromptDismiss('postpdf');
}

function clickQuizPostPdf() {
  const overlay = document.getElementById('quizPostPdfBlock');
  if (overlay) overlay.hidden = true;
  onQuizPromptClick('postpdf');
}
```

4. В существующей функции закрытия PDF — после её основной логики добавить вызов `maybeShowQuizPostPdf()` (с небольшой задержкой 300ms если есть анимация закрытия PDF).

**Acceptance:**
- [ ] После закрытия любого PDF (гайд) — поднимается модалка снизу.
- [ ] Клик «Пройти тест» открывает квиз и пишет `quiz_postpdf_clicked`.
- [ ] Клик «Не сейчас» или клик по затемнению — закрывает модалку и пишет `quiz_postpdf_dismissed`.
- [ ] При повторном открытии и закрытии PDF в той же сессии — модалка не показывается второй раз.
- [ ] После 3 dismiss суммарно — модалка не показывается.
- [ ] Если у юзера `quiz_completed_at` — модалка не показывается.
- [ ] Модалка не ломает обычное закрытие PDF (если убрать модалку через DevTools — закрытие работает).

---

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато
**Проблема:** UPDATE в quizFinish() не срабатывает для анонимов (currentUser=null).
**Решение:** Проверить код, для анонимов — записать при следующей авторизации.
> Связь с T-QUIZ-PROMPTS: пока эта задача не сделана, для анонимов прошедших квиз будем полагаться на localStorage флаг `quiz_completed`. После авторизации сервер должен это сериализовать.

---

## ✅ Выполнено (28.04.2026)

### T-ANALYTICS: Аналитика приложения за 2 недели
- 12 SQL-запросов через SSH, период 15–28 апреля 2026
- DAU: 12–77/день, в среднем ~45; 405 юзеров всего, 255 активны за 14 дней
- Топ контент: Железо и анемия доминирует, гайд «Железодефицит» — 174 просмотра (93 юзера)
- Платформы: MAX 832 сессии / 161 юзер, TG 388 / 162, web 140 / 9
- Покупки (14 дней): 5 продаж на 6160 ₽ (всего 8 продаж, 9020 ₽)
- Подробности: ANALYTICS.md

### T-QUIZ-ANALYTICS: Полная аналитика квиза
- quiz_completed: +female_ctx, step2_ans, doctor_ans, has_email
- quiz_skipped: +at_step
- RLS: анонимные quiz-события разрешены (10 типов)
- Протестировано, данные пишутся

### T-QUIZ-BANNER: Квиз-баннер вместо карусели
- Баннер на главной для всех платформ (TG, MAX, web)
- Не показывается при deep link, макс 5 dismiss
- Серверная синхронизация quiz_completed_at
- Трекинг: quiz_banner_shown, quiz_banner_dismissed
- Git: коммиты 36aa53c (dev), 7da79ba (prod)

### T-HIDDEN-POSTS: Удаление скрытых постов
- 468 скрытых постов удалены из БД (бэкап сделан)
- 5 связанных favorites удалены

### T-GIT-SYNC: Синхронизация DEV → PROD
- DEV-правки закоммичены в miniapp-dev
- Перенесено на PROD (miniapp main)
- Ветки синхронизированы

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
