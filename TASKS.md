# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> Обновлено: 28.04.2026
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## 🔴 СРОЧНО — 3 бага в игре

### T-GAME-BUG-1: Шаринг — не уводить в TG, дать выбор
**Файл:** miniapp-dev/games/iron/index.html
**Проблема:** Кнопка «Поделиться» сразу открывает TG. Должна работать как в постах: нативный диалог отправки (выбор куда — мессенджер, почта, соцсети).
**Решение:**
- Приоритет 1: `navigator.share()` (Web Share API) — работает на мобильных и десктопных браузерах, даёт нативный выбор
- Приоритет 2 (если navigator.share недоступен): копировать текст + ссылку в буфер, показать тост «Скопировано!»
- TG-специфичный шаринг (`tg.switchInlineQuery` / `tg.openTelegramLink`) использовать ТОЛЬКО если мы внутри TG мини-аппа и `navigator.share` недоступен
- MAX-специфичный (`MaxApp.share`) — ТОЛЬКО если мы внутри MAX

```js
function shareGame(type) {
  const gameUrl = 'https://app.listoshenkov.ru/games/iron/';
  let text;
  if (type === 'result') {
    text = '🩸 Я прошла игру «Враги и друзья железа»!\n' +
      state.finalEmoji + ' ' + state.finalLevel + ' | ⭐ ' + state.score + ' | 🎯 ' + state.correct + '/40\n' +
      'Проверь себя!';
  } else {
    text = '🩸 Проверь, что помогает, а что мешает усвоению железа!\n40 карточек, 2 уровня!';
  }

  // 1. Web Share API — нативный диалог
  if (navigator.share) {
    navigator.share({ title: 'Враги и друзья железа', text: text, url: gameUrl }).catch(() => {});
    return;
  }
  // 2. Fallback — копировать в буфер
  navigator.clipboard.writeText(text + '\n' + gameUrl).then(() => {
    showToast('Скопировано! Отправь подруге 💌');
  }).catch(() => {});
}
```

---

### T-GAME-BUG-2: Финальный экран — кнопки слипаются на десктопе
**Файл:** miniapp-dev/games/iron/index.html
**Проблема:** На десктопе нижняя кнопка слипается с «Поделиться». Нехватка отступов.
**Решение:** Проверить CSS финального экрана (#final). Добавить gap/margin между блоками:
- `.cta-block` — margin-bottom: 16px минимум
- Кнопка «Поделиться» — margin-bottom: 12px
- Кнопка «Играть снова» — margin-bottom: 24px
- `#final` — padding-bottom: 40px (чтобы на десктопе всё влезало)
- Убедиться что `overflow-y: auto` на экране final, чтобы скроллился если не влезает

---

### T-GAME-BUG-3: Очень долгая загрузка на телефоне (15 минут!)
**Файл:** miniapp-dev/games/iron/index.html
**Проблема:** В мобильном браузере страница грузится ~15 минут. Неприемлемо.
**Вероятные причины:**
- initGame() делает fetch к get_profile/upsert-user и страница блокируется пока ждёт ответ
- Edge Function холодный старт (первый вызов может быть медленным)
- Google Fonts блокирует рендер

**Решение:**
1. **Показать загрузочный экран СРАЗУ** (до любых fetch): простой экран с логотипом + «Загрузка...». Не ждать API.
2. **Timeout на все fetch-запросы:** максимум 10 секунд. Если не ответил — показать экран need-auth или splash (в зависимости от контекста).
```js
function fetchWithTimeout(url, options, timeout = 10000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
  ]);
}
```
3. **Google Fonts — не блокировать:** добавить `&display=swap` (уже есть, проверить) + `media="print" onload="this.media='all'"` на link-тег
4. **Проверить размер файла:** `wc -c games/iron/index.html`. Если > 300KB — что-то не так. Исходник был ~150KB.
5. **Проверить логи Edge Function** при обращении: `docker compose logs -f functions --tail=50` — нет ли ошибок/таймаутов

---

## ⏳ Активные задачи

### T-GAME-AUTH-FIX ✅ — авторизация без редиректа (выполнено)

### T-QUIZ-PROMPTS: Квиз-промпты в 5 точках приложения
**Приоритет:** 🟡 | **Статус:** На паузе

### T-QUIZ-COMPLETED-AT: quiz_completed_at не пишется в users
**Приоритет:** 🟡 | **Статус:** Не начато

---

## ✅ Выполнено (28.04.2026)

### T-GAME-1..6: Модуль «Полезные игры» ✅
### T-GAME-AUTH-FIX ✅
### T-ANALYTICS ✅ | T-QUIZ-ANALYTICS ✅ | T-QUIZ-BANNER ✅
### T-HIDDEN-POSTS ✅ | T-GIT-SYNC ✅

---

## 📋 Бэклог

| ID | Задача | Приоритет |
|----|--------|-----------|
| D14 | Раздел «Конвертер анализов» | 🟡 |
| D15 | Раздел «Справочник анализов» | 🟡 |
| T9 | ИИ-ассистент в чатах TG/MAX | ⏸️ on hold |
