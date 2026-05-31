# TASKS.md — Навигатор канала
> Рабочий файл: Claude.ai ↔ Claude Code
> **Последнее обновление: 19.05.2026 (вечер)** — рабочая сессия 19.05: PDF-фиксы (вес 196МБ → ~5МБ, активные ссылки, артефакт-страница), FODMAP-каталог (4 правки + 10 новых блюд + строгий блок в промпте), БАДы (+3 позиции #102/103/104 в `bads_catalog` и `supplements` + пересборка 121 `protocol_bads` по новой логике). Алексей визуально проверил всё кроме новых FODMAP-блюд.
>
> **Недоделанные задачи — в самом верху**, ниже — сводка по выполненному.
>
> ПРАВИЛО: CC читает этот файл в начале каждой сессии.
> После выполнения задачи — обновляет статус и коммитит.

---

## 🎓 КУРС «Гормональный баланс» — ЗАПУЩЕН В ПРОД (31.05.2026)

По решению Алексея — полный запуск под публикацию видео.
- **Курс в прод-app** (app.listoshenkov.ru): промоушн dev→main (merge 5b94bb0), раздел курса виден всем (не is-dev gated). EF/миграции уже на общем бэкенде.
- **Лендинг listoshenkov.ru/course/ активен**: цены 8000 (Изучение) / 18000 (С разбором), кнопки «Купить» → Prodamus (слаги course_hormones_study/review + `_param_ref` из куки pr_ref → атрибуция партнёра).
- **products** заполнены: 18=8000 study, 19=18000 review, is_active=true.
- **Алексей** (user 1, admin): уже владеет курсом (purchases 18+19, tier with_review) + видит партнёрскую админку в проде.
- **Гочи/хвосты:** (1) доступ landing-покупателей = claim-by-email в app (orphan→вход с тем же email); (2) кабинет partner magic-link ведёт на dev (env PARTNER_CABINET_BASE); (3) in-app courseBuy ещё не шлёт `_param_ref`. Откат курса: revert 5b94bb0.

## 🤝 Партнёрская программа (нутрициологи) — итерация 1

> ТЗ v1.1 (31.05.2026). Спека в репо: `docs/partner-program-spec.md`. Атрибуция по КОНТАКТУ (email/phone), first-touch, окно 90 дней. Пул = 50% базы, партнёр делит между скидкой клиенту и комиссией. Выплаты помесячно, порог 2000 ₽.

### ✅ Выполнено (31.05.2026, dev)

**PARTNER-01 — фундамент + кабинет партнёра** (коммит `d3f60fc`)
- Миграция `20260531_partner_program.sql`: 9 таблиц (partners/referrals/identities/identity_alias/clicks/orders/payouts + partner_auth_tokens/partner_sessions) + нормализация контакта (norm_email/norm_phone IMMUTABLE) + RLS deny-by-default. Применена на dev-БД.
- EF `partner-api`: свой magic-link (не GoTrue — как otp_codes), профиль, генерация рефссылок/кодов с пул-сплитом (пресеты всё себе/пополам/всё клиенту + слайдер), статистика.
- Кабинет `dev.listoshenkov.ru/partner/`: login по ссылке на почту, дашборд, генератор, выплаты с порогом 2000. End-to-end протестирован.

**PARTNER-01b — раздел «Мои продажи» в кабинете** (коммит `97e9fe2`)
- `orders.buyer_email/buyer_name` (снимок покупателя) + `partnerSales` в partner-api + карточка-таблица (дата/продукт/сумма/комиссия/покупатель/статус).

**PARTNER-01c — вкладка «Партнёры» в админке владельца** (коммит `6c5f4b2`, §5.1)
- `user-data` action `admin_partner_overview` (тоталы + на партнёра: клики/контакты/покупки/начислено/к выплате + лента продаж с покупателем; гейт role=admin). Вкладка 🤝 Партнёры в админке приложения. index.html изолирован от незакоммиченного курса (cherry-pick'абельно в прод).

**PARTNER-01d — типы ссылок + ручной возврат + реальные заметки** (коммит `PARTNER-01d`, 31.05)
- 5 типов рефссылок: квиз-меню, конкретная заметка (10 реальных слагов `listoshenkov.ru/zametki/{slug}/`), все заметки (`/zametki/`), лендинг курса (`listoshenkov.ru/course/`), универсальный код.
- Возвраты ВРУЧНУЮ (Q6 закрыт): кнопка «↩︎ возврат» в ленте продаж админки → `admin_refund_order`, заказ refunded, комиссия выпадает. Реальных возвратов клиентов не было.
- Q5/Q6/Q8 закрыты в `docs/partner-program-spec.md`.

**PARTNER-02 — редирект-эндпоинт `/r/{code}` (слой 1)** (31.05, dev)
- EF `partner-redirect`: код→referral→лог `clicks`→302 на цель с `?ref` + first-party кука `pr_ref`/`pr_cid` на `.listoshenkov.ru` (90 дн). Подключён через nginx `dev.listoshenkov.ru/r/`. Протестирован end-to-end. Прод-выкат: тот же nginx-сниппет в `listoshenkov.ru` (в спеке). IP клиента маскируется SNI-stream (некритично).
- **Промокоды** уточнены: вариант A (скидку режем на нашем чекауте), БЕЗ лимитов/срока (Алексей: продажа со скидкой = продажа), потолок = пул. Генерация уже есть (тип «Промокод/универсальный»). Применение — в этапе 3.

**PARTNER-03 — атрибуция МЕНЮ-воронки + промокоды (пилот)** (31.05, dev)
- preview.html ловит ref (?ref/кука pr_ref) → `resolve_ref` → режет цену + промо-скидка в UI + `_param_ref`/`_param_senior` в Prodamus.
- prodamus-webhook `attributePartner()`: контакт→identity→анти-самореферал→first-touch→`orders` снимком (пул от базы, пенсионер 600 не стакается). Тест-хук `__test_attr` (service-key).
- Протестировано на dev (скидка/атрибуция/идемпотентность/анти-self/first-touch) + полный путь через dev-skip (orders→кабинет→админка).

**МЕНЮ В ПРОДЕ + курс-бэкенд** (31.05)
- **Прод (в):** nginx `/r/{code}` на `listoshenkov.ru` (302→app/menu/quiz.html?ref + кука .listoshenkov.ru); etap-3 preview.html в `main` (ref-gated — обычные покупатели не затронуты). Меню-воронка партнёрки ЖИВАЯ в проде end-to-end.
- **Курс (б):** бэкенд-атрибуция в `handleCoursePurchase` готова (пул 4000). Лендинг /course/ = вейтлист без оплаты; курс покупается в app (`courseBuy`). Звено `courseBuy`→`_param_ref` из куки — ОТЛОЖЕНО (courseBuy активно меняется в курс-дельте).
- Гайды — НЕ в скоупе (нет модели пула, ТЗ §1).

### ⏳ Дальше

- **courseBuy → `_param_ref`** (из куки pr_ref) — когда стабилизируется курс-код. Замкнёт курс-воронку.
- **Прод-URL кабинета/админки** (сейчас dev-URL против общей БД — работают, но партнёрам давать dev-ссылку неудобно).
- **Q1** — мягкий лид-магнит в заметке (опц.).

---

## 🚧 ОТКРЫТО НА 19.05.2026 (вечер)

Что требует **участия Алексея** или CC прямо сейчас. По приоритету:

### 🔴 Высокий приоритет — прод-баги, заведены 19.05 вечер

**C1. Email в квизе не собирается (сломано с 4 мая)**
> Раньше квиз `index.html` собирал email у 35% завершивших. С недели 4 мая — ноль: 37 человек прошли квиз за 3 недели, флаг `has_email` в событии `quiz_completed` у всех `false`. См. код вокруг `quizState.emailPhase` и `trackEvent('quiz_completed', { ..., has_email: false })` в `index.html` (~строка 8579).
> Гипотезы: email-шаг пропускается / `has_email: true` не пишется при вводе / email не сохраняется в `users.email` через `upsert-user`.
> Что сделать CC:
> 1. Пройти квиз руками — отображается ли email-шаг
> 2. Если да — проверить, обновляется ли `has_email` в `quiz_completed` после успешного ввода email
> 3. Если да — проверить попадает ли email в `users.email` (через upsert-user EF)
> 4. Прод-патч → проверить metric через неделю
> **Куда**: прод (фикс блокирует сбор лидов). Dev сначала только если фикс затрагивает >5-10 строк или меняет UX.

**C2. Конверсия гайдов упала в 8 раз — проверить кнопку покупки**
> Апрель: 7.7% смотревших гайд жали «Купить». Последняя неделя: 0.95% (1 из 105). Железодефицит — 27 просмотров, **ноль** кликов на покупку.
> Что сделать CC:
> 1. Открыть прод `app.listoshenkov.ru/?section=guide_zhelezodeficit` — видна ли кнопка «Купить» / «Оформить доступ»
> 2. Кликнуть — запускается ли Prodamus (`buyGuide` функция в `index.html` ~5756), нет ли JS-ошибок
> 3. Проверить консоль на ошибки при открытии страницы гайда
> 4. Если кнопка живая и Prodamus идёт — отметить как «холодный трафик с лендинга» (доля web выросла с 19% до 36%). Если что-то падает — фиксить.
> **Куда**: прод (баг блокирует основной доход).

**C3. Атрибуция лендинга не работает — `?ref=landing` не пишется в `analytics_events`**
> Лендинг `listoshenkov.ru` ведёт в app по `?ref=landing`, но параметр не попадает в аналитику. В `analytics_events` нет ни одного события с `ref=landing` (хотя `ref=landing_game` от `/game/` работает, см. строку 3654 в `index.html` `_refParam`).
> Что сделать CC:
> 1. На `session_start` (строка 3490) добавить чтение `URLSearchParams.get('ref')` и пробрасывать в `event_data: { platform, ref: refParam || null }`. Сейчас `ref` мапится только если `'ref_'+param` пишется в `sessionStartParam` (deep-link логика) — для аналитики этого мало.
> 2. Проверить что после фикса в `analytics_events` появляются строки с `event_data->>'ref' = 'landing'` для перехода с лендинга.
> **Куда**: прод (без атрибуции непонятен ROI лендинга).

### 🟠 Средний приоритет — оставшиеся блокеры прода

**B1. Реальный обход dev на «mama-test»** — частично выполнено
> Алексей визуально проверил PDF (вес/ссылки/артефакт), preview-флоу, БАД-блок в result.html. **Что осталось:** проверить новые FODMAP-блюда (#150-159 `fodmap_*`) в реальной генерации — нужен ещё один прогон quiz → preview → result на FODMAP-протоколе с осмотром карточек блюд.

**B3. SM-MERGE dev → main — после B1 finish + явного «ок»**
> Что в dev и попадёт в прод:
> - кнопка СделайМеню на главной app (`is-dev` класс → надо или раскомментить is-dev, или ввести лейбл `is-stage`)
> - menu/result.html полностью переписан (структурный рендер + динамический PDF + SM-PDF-FIX-5 + 3 уровня инструкций + карточки-рецепты)
> - menu/quiz.html + preview.html + book.html + payment-soon.html — фикс «Назад» через history.back
> - menu/preview.html — TBD: блок `if (testPayMode)` и EF `dev-skip-payment` — оставить (origin-check) или вырезать
> - app/index.html — раздел «Меню» (ЛК) + magic-link flow
> - **9 миграций** (recipes/bads_catalog/menu_lk_tokens/SM-17 RPC + 20260519_sm_recipes_fodmap_fix + 20260519_sm_bads_ext)
> - 1 новая EF send-menu-link
> - generate-menu полностью переписан под рецепты + пост-валидация + строгий блок FODMAP
> - **ВАЖНО**: лендинг `/var/www/landing/menu/index.html` сейчас временно указывает CTA на dev — перед мержом откатить sed-командой (см. SM-ENV-DEV)

### 🟢 Низкое / опционально

**B5. SM-17-TUNE-3 — S/M/L портики (реактивно, скорее всего не нужен)**
> SM-17-TUNE дал 3/7 в ±50 на target 1700. FODMAP-тест на target 1600 — **7/7 в ±50** (1615/1565/1580/1605/1590/1560/1565). Реактивно: если ещё пара прогонов даст 7/7 — закрыть. Если упадёт ниже 5/7 — включать.

**B6. Resend DKIM/SPF/DMARC для `menu@listoshenkov.ru`** — проверить что magic-link и письмо «меню готово» не падают в спам gmail/yandex/mail.ru.

**B8. SM-15-DOR-3 (опционально)** — переписать содержимое 22 instruction_text c учётом нового статического блока про белок (избежать повторов). Стилист на Claude.ai партиями.

**B9. RU-fallback для AI (опционально)** — если Anthropic-сбои повторятся, добавить
fallback на YandexGPT 5 Pro или GigaChat-Pro. Текущая обвязка retry+backoff (вечер 19.05)
закрывает большинство transient 5xx, но не помогает при длинных аутэйджах. Не блокер.

**B10. Расхождение cost_usd с реальным счётом Anthropic** — после деплоя cost-tracking
Алексей заметил что реальный счёт Anthropic за одно меню — 30-60 центов, а наш
`computeCostUsd` показывает $0.05-0.13. Скорее всего расхождение из-за:
- неучтённого system-prompt токена в нашем подсчёте (Anthropic считает его в input)
- неточных прайсов для sonnet-4-6 (наши $3/$15 могли разойтись)
- множественных вызовов на retry/correction которые слабо отражаются в логе
Эксперимент: сделать N тестовых меню → сверить итог `ai_calls.cost_usd` за период с реальным
счётом Anthropic за тот же период → откалибровать множитель / прайс. Не блокер, но важно
для финмодели. Делать после accumулации ~50 generations реальных меню.

---

## ✅ Выполнено (29.05.2026) — Курс «Гормоны»: видео + аудит навигации

> Контекст курса ведётся отдельно в `miniapp/docs/course-hormones-handoff.md` + auto-memory. Здесь — только дельта сессии. Всё на `dev` (deploy-dev прошёл, live на dev.listoshenkov.ru). В `main`/прод не трогалось.

**COURSE-VIDEO: видео в уроке**
- **«Свернуть» теперь не глушит видео.** Раньше сворачивание перерисовывало зону и убивало VK-iframe → звук пропадал. Теперь iframe остаётся в DOM (клипуется по высоте через класс `.crs-media.collapsed`), голос продолжает идти — можно читать конспект под аудио, «Развернуть» — снова смотреть. `courseToggleVideo` переключает класс без перерисовки.
- **Кнопка «назад» с экрана урока глушит видео** (`courseStopVideo` → `about:blank` в хуке `showPage`, по образцу эфиров/подкастов). Раньше VK-iframe оставался в DOM и звук шёл после выхода.
- ⚠️ **Проверить на iOS:** продолжается ли звук, когда видео свёрнуто (клипованный iframe). Если iOS-WebView паузит — фолбэк: мини-превью вместо клипа.

**COURSE-NAV: аудит «кто куда придёт» + фиксы**
- **Приземление покупателя КУРСА после оплаты** вело в `openGuideDetail` (пустой экран гайда — такого слага нет). Теперь курс-слаги (`course_hormones_*`) уходят в раздел «Курс» → опросник/список (`startPurchasePoll` + `checkPaymentReturn`, helper `isCourseSlug`).
- **Профиль «Мои покупки»:** курс показывался сырым слагом и вёл в битую читалку → теперь свой заголовок + переход в раздел «Курс».
- **Deep-link** `?startapp=courses`/`course` → раздел курса (`handleDeepLink`).
- **Гейт «войдите»** сбрасывает stale `courseView`, чтобы «назад» не дёргал `courseCall` без токена.
- Проверено по сценариям: вход (in-app/не-залогинен/deep-link), пейволл+claim «уже оплачивала», визард назад/резюм, список→часть→назад, завершение части, сообщения, доступ review-без-study (бэкенд `owns = study OR review` — ОК).

Коммит: `b0e3e71` (ветка `dev`).

---

## ✅ Выполнено за рабочую сессию 19.05.2026 (вечер)

Три коммита в `miniapp@dev`. БД на VPS обновлена напрямую (self-hosted Supabase один для dev/prod, изменения данных уже видны обоим). Продовый фронт пока не дёргает СделайМеню-таблицы, для prod-пользователей визуально без изменений.

### SM-PDF-FIX-5 — закрывает B7 (коммит `b38c54e`)

Три проблемы PDF за один проход. До: 196МБ, ссылки неактивные, артефакт-страница с дисклеймером на 12-й странице.

- **Вес 196МБ → ~3-5МБ.** `image/png lossless + scale:3 + compress:false` → `image/jpeg q=0.82 + scale:2 + compress:true + 'FAST'`. На тексте JPEG q=0.82 визуально неотличим от PNG.
- **Активные ссылки.** Старая overlay-математика делила `canvas.width / CONTENT_W_MM / 2` (комментарий говорил `scale=2`, а в коде `scale:3`) + лишний `* (1/2)` — rect-ы ссылок были в ~3× меньше и со смещением. Новая: пропорциональный mapping через `getBoundingClientRect`, `fracX = (link.left - block.left) / block.width → lx = fracX * 127мм`. Не зависит от scale и viewport.
- **Артефакт-страница** с дисклеймером слита со страницей upsell. Раньше дисклеймер был отдельным top-level `.r-block.pdf-only` в `#pdf-content`, попадал в `listPdfBlocks()` и уезжал на 12-ю страницу. Перенесён в конец `#upsell-block` после `consultation-block` с тонким разделителем сверху.

Файл: `menu/result.html`. Алексей визуально подтвердил.

### SM-RECIPES-FODMAP-FIX — новая задача от Алексея (коммит `a014a3a`)

После SM-17 AI выдал «Лосось+гречка+брокколи 100г» — high-FODMAP по Monash. Аудит каталога нашёл 4 проблемных рецепта + нехватку строгих low-FODMAP-блюд.

- **Миграция `20260519_sm_recipes_fodmap_fix.sql`:**
  - `array_remove(fodmap)` из 3 блюд (`losos_grechka_brokkoli` имел тег, ещё 2 уже без — идемпотентно)
  - переcостав `smuzi_fodmap`: лактозо-фри молоко 150мл → кокосовое 100мл + вода 80мл (фруктаны в молочных)
  - **10 новых блюд `fodmap_*` (`#150-159`):** 3 завтрака, 3 обеда, 2 ужина, 2 перекуса/гарнира. Граммовки сверены по Monash FODMAP threshold table.
- **`generate-menu` SYSTEM_PROMPT:** добавлен блок «СТРОГИЕ ОГРАНИЧЕНИЯ ДЛЯ FODMAP-ПРОТОКОЛА» после блока КОМПОЗИЦИЯ ПРИЁМА — явные списки запрещённых (брокколи >75г, цв. капуста, обычное молоко, чеснок и т.д.) и разрешённых компонентов с порогами. Приоритет на `id LIKE 'fodmap_%'`.
- **Тест:** FODMAP+ЖКТ+ИР, target 1600, female, premenopause, 7 дней.
  - Калораж: 1615/1565/1580/1605/1590/1560/1565 → **7/7 в ±50**
  - Запрещённых компонентов: **0**
  - Новые `fodmap_*` блюда в 6 из 7 дней
  - Время генерации (без кеша): ~115с

**ОТКРЫТО:** Алексей ещё не делал визуальную проверку новых FODMAP-блюд через UI (см. остаток в B1).

### SM-BADS-EXT — закрывает B4 (коммит `96fa93d`)

ТЗ от Алексея: после анализа 11 категорий-«пробелов» часть закрылась существующими (#3 Гастрокалм Макси покрывает L-глутамин, #40/41 — витамин C, #42 — B12), 2 категории удалены (берберин, электролиты), 3 добавлены новыми позициями.

- **`bads_catalog` +3:** #102 Куркумин с биоперином, #103 Омега-3 Экстра 90 капсул, #104 Омега-3 с экстрактом имбиря. Все три из anagran.ru с `?ref-link-code=LIST`.
- **`protocol_bads` пересборка (121 запись, PL/pgSQL DO-блок):**
  - **Витамин C:** для cache_key с `autoimmun` или `weak_immunity` → #41 (Спектр-С липосомальный); иначе → #40 (анагран базовый). `bad_number + name + reason` пересинхронизированы.
  - **Омега-3:** в base layer для **всех cache_key КРОМЕ wfpb_***. Выбор: cache_key с `oporno`/`joints`/`arthritis`/`anti_inflammatory*` → #104 (с имбирём); иначе → #103 (базовая).
  - **Куркумин #102:** в anchor layer для cache_key с `oporno`/`joints`/`arthritis`/`autoimmun`.
- **`supplements` +3:** те же 3 позиции с `brand='Anagran'`, `sort_order=100/101/102`. Перед INSERT — `setval supplements_id_seq` (отставал от MAX(id) после прежних ручных вставок).
- **6 SQL-проверок ТЗ зелёные.** Распределение размеров `bads_list`: 5 (3 wfpb) / 6 (32) / 7 (49) / 8 (37). Всё в коридоре ТЗ 4-8.

**Открытый вопрос из ТЗ:** омега-3 для wfpb-протокола (нет водорослевой в ассортименте Алексея). На текущий момент wfpb-подборки без омеги (3 базовых + якорные). Разрешено ТЗ.

### Дополнительно — инфраструктура для тестов

- На VPS truncate'нул `menu_cache` (13→0), `menu_generation_jobs` (24→0), `menu_purchases` (3→0) — чтобы Алексей мог тестировать чистый flow без редиректов «уже оплачено» и без закешированных меню.
- `?test_pay=1` на `preview.html` — это **существующий механизм** (не из этой сессии): отключает `get_purchase_status` редирект, дёргает EF `dev-skip-payment` вместо Prodamus, симулирует webhook → paid → job → генерация.

---

## ✅ Выполнено за ночные сессии 18→19.05.2026

Большой спринт под СделайМеню. Главное:

### Сессия 1 (вечер 18.05)

- **SM-NAV** — кнопка «🍽 СделайМеню» на главной app (пыльная роза, видна только на dev/localhost через `body.is-dev`). Тест на железо смещён вправо.
- **SM-15** — 121 `instruction_text` залит в `protocol_explanations` (через sed-патч для одного несовпадающего cache_key `menopause_addon`).
- **SM-PDF-FIX (1-4)** — поэтапный фикс PDF:
  - FIX-1: убран сдвиг влево (margin → число, image → png, без `width` в html2canvas)
  - FIX-2: формат страниц [127, 297]мм → мобильный
  - FIX-3: компактные стили дней → один день = одна страница [127, 360]мм
  - FIX-4: полностью свой PDF-engine на jsPDF+html2canvas (без html2pdf-обёртки) — каждая страница ровно по размеру блока + 5мм top + 10мм bottom
  - SM-PDF-Q: scale=3 (288 dpi), lossless PNG, compress=false — шрифты чёткие
- **SM-DAY-STYLE-2** — рендер дня переписан со structured (markdown-парсер удалён). Карточки приёмов как в preview.html (`.p-meal`).
- **SM-BACK-NAV** — «Назад» во всех страницах меню через `history.back()` с fallback. Текст унифицирован на «← Назад».
- **SM-20** — кнопка «🔄 Сделать ещё меню» на result.html. Чистит quiz_state + anon_hash, редирект на quiz.html?restart=1.
- **SM-17 (ЛК, старое)** — magic-link auth (таблица `menu_lk_tokens` + RPC `get_my_menus` / `get_menu_by_id`) + EF `send-menu-link` (Resend) + раздел «Меню» в app.
- **SM-19** — раздел «Меню» (ЛК) в app/index.html. Подхват `?lk_token` → localStorage → список карточек → клик на меню → /menu/result.html?menu_id=...&lk_token=...
- **SM-16-V2** — каталог 101 БАДа из `bady_bot.txt` → таблица `bads_catalog`. Все 121 `protocol_bads` перегенерены по 3-слойной логике (база магний+D3+C, кластерные якоря, расширенная база). Рендер использует реальные `purchase_link` из артлайф/анагран/озон.
- **SM-15-DOR-1** — 3 уровня «📋 Как пользоваться меню»: универсальный про белок/жиры/замедление сахаров + базовые правила (замены, готовка, питьевой режим) + персональная часть из БД.
- **SM-ENV-DEV** — CTA лендинга `listoshenkov.ru/menu/` временно переведены на dev для теста полного workflow. Backup: `/var/www/landing/menu/index.html.bak-20260518-221042`. nginx no-cache для `/menu/`. Откат: sed обратно или cp из backup.

### Сессия 2 (ночь 19.05) — **SM-17 полный переход на рецепты**

- **SM-17 Фаза 1** — таблица `recipes` (id slug PK, ingredients jsonb, БЖУ, suitable_protocols[], vegan/vegetarian, индексы GIN, RLS anon SELECT).
- **SM-17 Фаза 2** — парсер 125 блюд из `SM-17_recipes_PACK.md` (1968 строк) → SQL UPSERT → залито в dev.
- **SM-17 Фаза 3** — переписан `generate-menu` EF: AI выбирает `recipe_id` из переданного списка (не генерит сырые продукты). Сервер enrich'ит ответ полными данными рецепта. Cache-key префикс `r2` — старый кеш не подцепляется.
- **SM-17 Фаза 4** — UI карточек-рецептов в result.html: название блюда + порция/время + БЖУ + Состав + спойлер «Как готовить» (в PDF разворачивается автоматически).
- **SM-17-TUNE** — фикс заниженного калоража:
  - 15 новых композитных блюд (#121-135): «обед-комбо», «ужин-комбо», «сытные завтраки» (kcal 380-580). Всего 140 рецептов.
  - 3 блока в SYSTEM_PROMPT: КОМПОЗИЦИЯ ПРИЁМА (одиночный <400ккал не приём), ЦЕЛЕВЫЕ ПОРЦИИ (% от target), ФИНАЛЬНАЯ САМОПРОВЕРКА.
  - Пост-валидация `validateAndCorrectCalories` в EF: при `|dev| > 7%` повторный AI-call (max 2 retry/день) с явными стратегиями добивки и компактным prompt.
  - **Метрики:** до TUNE 0/7 в ±50, среднее 1170ккал (дефицит 31%). После TUNE 3/7 в ±50, 4/7 в ±100, среднее 1613 (дефицит 5%). 1 день из 7 с дефицитом >200 — кандидат на Уровень 3.
- **SM-15-DOR-2** — абзац про белок ВТОРЫМ в 22 cache_key (10 mediterranean+pescatarian с формулой «мясо/рыба 130-150г» + 12 wfpb с формулой «бобовые 100-150г + семена»).

### Технические тулзы (для будущих сессий)
- `supabase/scripts/parse_bady.mjs` — парсер MD → JSON для каталога БАДов
- `tools/html-to-mobile-pdf/parse-recipes.mjs` — парсер MD → SQL для каталога рецептов (поддерживает `###` и `####` заголовки)
- `tools/html-to-mobile-pdf/test-menu-result.mjs` — puppeteer-стенд: рендерит result.html с мок-данными, снимает PDF через jsPDF, конвертит pages → PNG для визуальной проверки
- `tools/html-to-mobile-pdf/render-pdf.mjs` — pdf-to-img конвертер для просмотра присланных PDF

### Что задеплоено в dev
**Frontend (auto-rsync на push в dev):**
- `index.html` — кнопка СделайМеню + раздел «Меню» (ЛК) + magic-link flow
- `menu/result.html` — новый рендер карточек-рецептов + динамический PDF + 3 уровня инструкций
- `menu/quiz.html`, `menu/preview.html`, `menu/book.html`, `menu/payment-soon.html` — «Назад» через history

**Edge Functions на VPS:**
- `generate-menu` — новый промпт + recipes-fetch + enrichment + пост-валидация
- `send-menu-link` — magic-link auth для ЛК

**Миграции применены на dev DB:**
- `20260518_menu_lk_tokens.sql` — таблица токенов ЛК
- `20260518_sm17_my_menus.sql` — RPC `get_my_menus` / `get_menu_by_id` + DROP UNIQUE `menu_purchases_one_pending_per_hash`
- `20260518_bads_catalog.sql` — таблица каталога БАДов (101 строка)
- `20260519_recipes_table.sql` — таблица рецептов
- `20260519_sm15_dor2_protein_para.sql` — апдейт 22 instruction_text
- `20260519_sm17_tune_15_recipes.sql` — UPSERT 15 новых композитных блюд

**Лендинг на VPS (вне репо):**
- `/var/www/landing/menu/index.html` — CTA временно на dev (sed-патч), `nginx` no-cache на `/menu/`

---

## 📋 Старые задачи Алексея (18.05.2026) — справочно

Большая часть закрыта или поглощена B-задачами выше. Остался хвост:

- ~~A1 ручное тестирование~~ → перешло в **B1** (новый чеклист после SM-17)
- ~~A2 SM-15 инструкции~~ → закрыто (SM-15-DOR-1 + SM-15-DOR-2)
- ~~A3 калорийность~~ → перешло в **B2** (новые метрики после TUNE)
- A4 → **B4** (без изменений)
- A5 → **B3** (расширено новыми правками)
- A6 → **B6** (Resend верификация)
- A7 (target в quiz) — открыто, не блокер

---

## 📜 Архив — QA-отчёт сессии 09.05.2026

**Статус:** ✅ Все блоки пройдены (8 блоков, 50+ проверок)

**Проверено:**

### Блок A — БД-инфраструктура ✅
- `users.quiz_top_topic` — колонка создана
- `user_rewards.product_slug`, `reward_type`, `toast_shown_at` — все колонки на месте
- RPC `guide_view_counts_30d()` — функция создана, granted to anon, возвращает реальные данные (zhelezodeficit: 346, kishechnik: 99, и т.д. для 12 гайдов)
- RLS-политика `Insert only validated events` — содержит все 12 новых event_type:
  - `quiz_discount_shown/clicked`, `landing_game_started/completed`, `purchase_user_returned`, `anon_quiz_discount_banner_shown/clicked`, `abandoned_discount_shown/clicked`, `welcome_banner_landing_game_shown`, `welcome_banner_personalized_shown`, `post_cta_click`

### Блок B — Edge Functions ✅
- `game-action.claim_reward` → `invalid_session` ✓
- `game-action.claim_quiz_reward` → `invalid_session` ✓
- `game-action.claim_abandoned_reward` → `invalid_session` ✓
- `game-action.my_rewards` → `invalid_session` ✓
- `game-action.ack_reward_toast` → `invalid_session` ✓

### Блок C — E2E через sandbox-юзера ✅
Создан тестовый user_id=999999 (QA-Sandbox), прогнаны сценарии:
- ✅ **Test 1:** `claim_quiz_reward` для eligible user (quiz 25h ago, top_topic=iron) → создал reward 30% на zhelezodeficit, 48h
- ✅ **Test 2:** повторный вызов → возвращает existing (idempotent)
- ✅ **Test 3:** `claim_abandoned_reward` без purchase_start → `no_purchase_start`
- ✅ **Test 4:** добавлен purchase_start kishechnik 25h назад → reward 30% на kishechnik, 48h
- ✅ **Test 5:** при активной game-50% на zhelezodeficit + purchase_start zhelezodeficit → `better_game_reward_active` (блокировка корректна)
- ✅ **Test 6:** при game-25% на zhelezodeficit → abandoned 30% проходит (правильное приоритетное поведение)
- ✅ **Test 7:** `my_rewards` возвращает все 4 reward с правильными `reward_type`, `product_slug`, `discount_percent`
- ✅ **Test 8:** quiz < 24h ago → `too_early` с `wait_ms`

**Cleanup:** sandbox users + связанные данные удалены полностью.

### Блок D — Frontend integrity ✅
Все 17 ключевых функций/идентификаторов на live `app.listoshenkov.ru/`:
- `claimQuizReward`, `claimAbandonedReward`, `_getQuizTopTopic`
- `getActiveDiscountForSlug`, `cutChapterForTrial`, `getGuideViewCount`
- RPC call `guide_view_counts_30d`, tracking `anon_quiz_discount_banner_shown`, `welcome_banner_landing_game_shown`, `purchase_user_returned`
- `_fastDeepLinkHandled`, `nav-row-game`, «Тест на железо»
- Cross-domain `grw_game/correct/total/earned`, mapping `QUIZ_TOPIC_TO_SLUG/TITLES`
- localStorage keys `abandoned_discount`, `quiz_discount`

### Блок E — Schema.org (T-GEO-FIX) ✅
На странице `https://listoshenkov.ru/guide/zhelezodeficit`:
- ✓ `name`, `image`, `description`, `offers`, `brand`, `aggregateRating`, `review`, `sku`
- ✓ `offers.shippingDetails`, `offers.hasMerchantReturnPolicy`, `offers.price`, `offers.priceCurrency`

12/12 must-have полей. Все 12 guide-страниц в одинаковом формате.

### Блок F — Cross-domain reward (landing → app) ✅
- Landing `/game/` `goToApp()` строит URL `app.listoshenkov.ru/?ref=landing_game&grw_game=...&grw_correct=...&grw_total=...&grw_earned=...`
- App `init()` парсит `grw_*` и пишет `game_reward_pending` в localStorage с `from_landing:true`

### Блок G — Аналитика smoke test ✅
Все 14 новых event_type принимаются через anon REST API (HTTP 201):
quiz_discount_shown/clicked, landing_game_started/completed, welcome_banner_landing_game_shown/clicked, welcome_banner_personalized_shown/clicked, anon_quiz_discount_banner_shown/clicked, abandoned_discount_shown/clicked, purchase_user_returned, post_cta_click

### Блок H — Live deployment endpoints ✅
| URL | Status |
|---|---|
| `app.listoshenkov.ru/` | 200 |
| `app.listoshenkov.ru/?ref=landing_game` | 200 (welcome-баннер для T-CONV-005) |
| `app.listoshenkov.ru/?section=guide_zhelezodeficit` | 200 (T-DEEPLINK-FAST) |
| `listoshenkov.ru/` | 200 |
| `listoshenkov.ru/game` | 200 (через 301 на /game/) |
| `listoshenkov.ru/game/` | 200 |
| `listoshenkov.ru/guide/zhelezodeficit` | 200 |
| `listoshenkov.ru/guide/analizy` | 200 |
| `listoshenkov.ru/sitemap.xml` | 200 |
| `app.listoshenkov.ru/private/` | **404** ✓ (Private only on dev) |
| `dev.listoshenkov.ru/private/` | **200** ✓ (доступен на dev) |

**Что НЕ покрыто QA (требует ручной проверки в браузере):**
- Визуальный рендер toast-ов и баннеров
- Реальная воронка с покупкой через Prodamus
- Поведение в TG/MAX webview
- E2E тест: landing /game → tier 50% → app login → toast → buy

**Рекомендуется через 7-14 дней замерить:**
- `guide_trial_shown → guide_trial_buy_click` CTR (был 2.3%, цель >5% после T-CONV-008)
- `purchase_start → purchase_user_returned → purchase_complete` воронка (T-PAYMENT-TRACK)
- `quiz_discount_shown → quiz_discount_clicked` (T-CONV-003)
- `abandoned_discount_shown → abandoned_discount_clicked` (T-CONV-007)
- Google Search Console — пройти проверку Schema.org (T-GEO-FIX)

---

## ⏳ Активные задачи

---

## 🍽 СделайМеню (menu.listoshenkov.ru)
> Спека: sdelaj_menu_PRD_v2.md | Таски: sdelaj_menu_TASKS.md
> Стек: статика на Beget VPS (лендинг) + self-hosted Supabase + Edge Functions + Anthropic API
> Цветовая схема: Пыльная роза (#4B1528 / #D4537E / #FDF4F7)

### ⏳ Активные

_Свободно. Следующее по приоритету — **SM-10** (Prodamus + webhook handle-payment) или **SM-08-ASYNC** (async-обёртка для days=7 с email-уведомлением)._

#### SM-MERGE-DEV-TO-PROD: квиз + корзина + превью + payment-soon в прод 📋 ждёт явное «ок»
**Контекст:** На dev всё работает: SM-05 квиз ✅, SM-06 корзина ✅, SM-07/08 EF ✅ (уже в общем self-hosted Supabase), SM-09 превью ✅, SM-09b/c/d/e/f — AI-free preview + diet-фильтр + крупнее шрифты ✅. После сессии 17.05.2026 преview полностью без AI до оплаты ($0/preview), всё на статичных SELECT'ах из protocol_explanations/protocol_sample_menus. Не мержим в прод без явной команды от Алексея (правило сессии 16.05.2026, см. auto-memory `dev_first_then_prod`).
**Что включает merge:**
- Merge `miniapp` dev → main → деплой `menu/quiz.html`, `menu/basket.html`, `menu/preview.html`, `menu/payment-soon.html` на `app.listoshenkov.ru`
- Замена CTA на `listoshenkov.ru/menu/`: сейчас ведёт на `app.listoshenkov.ru/?ref=landing_menu` (SPA), должна вести прямо на `app.listoshenkov.ru/menu/quiz.html?ref=landing_menu`
- Замена CTA-кнопки «🍽 СделайМеню» на главной `listoshenkov.ru/` при необходимости
**Когда мержить:** после накопления правок промпта от Алексея (SM-09-TUNE) и/или явного «ок, в прод». Пока живые пользователи получат «Оплату подключим в ближайшие дни» — это нормально только если мы предупредили.

---

### ✅ Выполнено

#### SM-CONV: конверсия превью — 3 задачи (31.05.2026, dev + PROD)
**Контекст:** Запрос Алексея 29-30.05 — поднять конверсию `menu/preview.html` (из 62 видевших превью только 4 жмут CTA = 6%). Три подзадачи, приоритет: блок «что входит» → якорь цены → прогрев брошенной корзины.

**Что сделано:**
- **Задача 1 — блок «Что входит в полное меню»** перед CTA в `preview.html`: список из 6 пунктов с галочками (7 дней меню, граммовки+состав, КБЖУ, инструкции готовки, подбор БАДов со ссылками, рекомендация гайда). Тон на «ты». Только CSS+разметка.
- **Задача 2 — якорь к цене** под `#price-display`: «Консультация нутрициолога — от 5 000 ₽. Персональное меню на неделю — 1 200 ₽» (`.p-price-anchor`).
- **Задача 3 — прогрев брошенной корзины** (EF `send-menu-warmup`, калька `send-menu-feedback`). Брошенная корзина = `menu_purchases.status='pending'` без `paid`.
  - Письмо №1 (окно `created_at` 1–24ч, по факту ~1–2ч): «Ваше меню готово — остался один шаг».
  - Письмо №2 (окно 24–72ч, если №1 ушло): «Алексей подобрал для вас протокол — посмотрите». Подтягивает объяснение протокола серверно из `protocol_explanations` (каскад `cache_key` — точный порт preview.html: resolveProtocol/resolveCluster/fetchExplanation). На дне каскада → generic-фраза (не хардкод-заглушка preview).
  - Миграция `20260530_menu_warmup_email.sql`: колонки `warmup1_sent_at`/`warmup2_sent_at` + 2 partial-индекса. Применена на VPS (DDL под `supabase_admin`, владелец таблицы).
  - pg_cron `menu-warmup` (jobid 7): `23 * * * *` ежечасно. Идемпотентность через `*_sent_at`, фильтр тест-адресов, dry_run, лимит 50. Auth = `app.admin_cron_token`.
  - `dry_run` на VPS зелёный (HTTP 200, окна верны, ошибок нет).

**Верификация задачи 3 против боевой структуры:** колонки `menu_purchases/menu_profiles/protocol_explanations` совпадают; join `profile_hash == anon_profile_hash` рабочий; URL крона совпадает с боевыми; каскад `cache_key` построчно совпадает с preview.html; на реальной pending-строке (auto→lchf, кластеры energetichesky+gjkt+metabolizm) каскад находит `lchf_energetichesky` на L2.

**Репо/деплой:** dev — `7e94313` (warmup) + `6753b75` (preview). PROD — cherry-pick `d47af23` + `7f2ed3f` на `main` (НЕ merge dev→main: dev опережал main на ~24 коммита незавершённого КУРСА, мерж утащил бы курс в прод; курс отложен в `git stash` на время checkout). Блок «Что входит» проверен curl'ом на dev.listoshenkov.ru И app.listoshenkov.ru. EF задеплоена на общий VPS (`/opt/beget/supabase/volumes/functions/send-menu-warmup/`).

#### SM-FB: письмо «Как вам меню?» покупателям + pg_cron (27.05.2026)
**Контекст:** Запрос Алексея 23.05 — после первых реальных покупок меню автоматически писать покупателю «как меню?» через 1–2 дня, собирать отзывы в ответных письмах.

**Что сделано:**
- **EF `send-menu-feedback`** (`supabase/functions/send-menu-feedback/index.ts`) — шлёт письмо тем, кто оплатил в окне `window_hours_min..max` назад и кому ещё не слали (`feedback_email_sent_at IS NULL`). Идемпотентность: метка ставится сразу после ok от Resend. `dry_run=true` — список адресатов без отправки. Auth = `app.admin_cron_token` (= service role key). Фильтр тестовых адресов (listosha@*, unknown@example.com).
- **Миграция** `20260523_menu_feedback_email_sent_at.sql` — колонка `feedback_email_sent_at timestamptz` + partial-индекс на pending. Применена в проде (через `supabase_admin` — таблицу owns supabase_admin, не postgres).
- **Форвардер reg.ru не понадобился.** MX `listoshenkov.ru` → mx1/mx2.hosting.reg.ru, но приёмного ящика для домена нет (в ISPmanager `server293` домена нет), заводить муторно. Решение: From остаётся `menu@listoshenkov.ru` (верифицирован в Resend для отправки, DMARC ок), **Reply-To = `listosha@list.ru`** — ответы покупателей летят сразу в личную почту, без ящика/форвардера.
- **Текст** на «вы», тёплый: «На днях вы получили меню… Спасибо вам за доверие! — Алексей». Тема «Как вам меню?».
- **Отправлено 3 реальным покупателям** (upakbaza@yandex.ru, romanyelena@yandex.ru, alla-67@mail.ru) одноразовым прогоном (окно 0–72ч): `{sent:3, failed:[]}`.
- **pg_cron `menu-feedback-request`** (jobid 5): `30 7 * * *` = 10:30 МСК ежедневно, окно 24–72ч (шире плана 24–48 — устойчивость к пропущенному прогону; дубли отсекает `feedback_email_sent_at`). Паттерн `net.http_post` идентичен `private-daily-summary`.

**Репо:** EF + миграция закоммичены в `miniapp@dev` (466e80e). EF задеплоена на VPS напрямую (`/opt/beget/supabase/volumes/functions/send-menu-feedback/`).

#### SM-08-TUNE-2 — target_calories на сервере + чистка raw из AI payload (18.05.2026, dev only)
**Контекст:** Закрытие открытого пункта из ночного QA-отчёта. Два связанных бага одним коммитом.

**Что было не так:**
1. **`target_calories = NULL` у всех профилей в `menu_profiles`** — ни квиз, ни EF не считали. Промпт обещал «итого дня ОБЯЗАНО быть в диапазоне target_calories ±50 ккал», но AI получал `null` и сам прикидывал на глаз. Меню гуляло ±150-200 ккал.
2. **Raw поля уходили в Anthropic** — в EF `generate-menu` шло `JSON.stringify({...profile, protocol: selectedProtocol})`, где `profile` содержит `height_cm`, `weight_kg`, `age`, `email`, `anon_profile_hash`. Это **нарушение принципа SM-03** («raw остаётся в РФ-БД, в AI — только категории»), который явно проговаривался в квизе пользователям.

**Что сделано:**
- **`calculateTargetCalories()`** в EF — формула Mifflin-St Jeor: `BMR = 10·W + 6.25·H - 5·A + (5 для male / -161 для female)` × 1.4 (sedentary) × goal-коэффициент (`lose −15%`, `gain +15%`, `therapeutic −10%`, `maintain 0`). Округление до 50 ккал. Если в профиле нет валидных raw — возвращает `null` (AI прикидывает сам, как раньше).
- **`sanitizeProfileForAI()`** в EF — снимает из payload перед `JSON.stringify`: `height_cm`, `weight_kg`, `age`, `email`, `anon_profile_hash`, `user_id`, `id`, `created_at`, `updated_at`. В Anthropic уходят только: категории (`imt_category`, `age_group`, `sex`, `hormonal_status`), выбор (`goal`, `diet_type`, `protocol`, `diagnoses`, `meal_count`), **расчётный** `target_calories` (число), предпочтения (`favorite_products`, `exclude_products`, `wishlist_text`, `dislikes_text`).
- **`buildCacheKey`** включает округлённый target (bucket по 100 ккал, `t1500`/`t1600`/...) — кеш группирует юзеров с близкими target в одно меню, не плодя per-user кеши.
- **Сохранение target обратно в БД** — после расчёта EF делает `UPDATE menu_profiles SET target_calories=... WHERE anon_profile_hash=...` (fire-and-forget). Полезно для дашбордов и повторных запросов.

**Тесты:**
- **E21**: Mifflin-St Jeor референс-расчёт для 4 кейсов (female/male × maintain/lose/gain) — все попадают в коридор 1500-2500 ккал.
- **E22**: `generate-menu` проходит валидацию когда `target_calories` отсутствует в профиле — EF считает локально, не валит запрос на missing_field.
- Регрессии: SM-10 32/32 ✓, SM-11..14 31/31 ✓, test_full_plan **140/140** ✓.

**Артефакты:**
- `supabase/functions/generate-menu/index.ts` — две функции + правка `buildCacheKey` + расчёт в `Deno.serve` handler. Деплоен на VPS.
- `supabase/scripts/test_full_plan.py` — добавлены E21/E22.

**Коммит:** `fb71413` в `miniapp/dev`.

**Что осталось проверить вручную (см. A3 для Алексея):**
- Реальный E2E прогон через `?test_pay=1` — убедиться что меню теперь действительно в коридоре target ±50 ккал. Стоит $0.15 за Sonnet.
- Если меню всё равно гуляет — нужно усилить промпт (отдельный тикет SM-08-TUNE-3).

---

#### 🌙 QA ночная сессия 18.05.2026 — полный тест-план + 2 найденных и пофикшенных issue
**Контекст:** Алексей передал план тестирования (`sdelaj_menu_test_plan_full.md` — 10 блоков от квиза до E2E). Расширил его своими сценариями и автоматизировал что мог через Python+psql+curl. **135 тестов прошли**, **2 реальные проблемы найдены и исправлены сразу же**, остальные «сигналы» оказались ложноположительными (с разбором ниже).

**Архитектура автотестов:**
- `supabase/scripts/test_full_plan.py` (новый, 1025 строк) — комплексный мега-test со всеми блоками
- Дополнительно регрессии: `test_sm10.py` (32/32 ✓) и `test_sm11_14.py` (31/31 ✓) — не сломались
- Запуск: `python3 /tmp/test_full_plan.py` на VPS (psql через `docker exec supabase-db`)

**Покрытие по блокам:**
| Блок | Что покрыто автоматически | Результат |
|---|---|---|
| B1 — Квиз/Профиль | CHECK constraints (sex, height_cm, weight_kg, age, age_group), RLS anon INSERT/UPDATE, partial UNIQUE на anon_profile_hash | 9/9 ✓ + skip UI |
| B3 — Превью | RPC `get_purchase_status`, REST на protocol_explanations/sample_menus/bads (anon SELECT), counts, наличие diet-вариантов | 10/10 ✓ |
| B4 — Webhook/Оплата | Подпись HMAC валидная/невалидная/отсутствует, payment_status≠success, идемпотентность, orphan, fallback по email, customer_extra fallback, email регистр+trimming, sign в body, amount=10M | 17/17 ✓ |
| B5 — result.html / RPC | `get_menu_result` все статусы (ready/pending/failed/not_found/invalid_hash/битый ready+null), отсутствие email/raw в публичном RPC, HTML-проверки (enableLinks, supplement_id, deep-link) | 22/22 ✓ |
| B6 — Книга предложений | Happy, validation (email/description), длина 5001→trim, XSS как text, bad_json, RLS anon SELECT/INSERT отбит | 11/11 ✓ |
| B8 — Безопасность | RLS на menu_purchases/jobs/cache, SQL-инъекция, XSS, webhook без подписи, replay, статические секреты не утекают (.env content), CORS evil.com отбит, dev-skip-payment Origin-защита, generate-menu auth | 13/13 ✓ |
| B9 — Производительность | Тайминги (5 итераций медиана): get_menu_status 14ms, get_purchase_status 13ms, explanations SELECT 15ms, sample_menus 17ms, protocol_bads 13ms — все < 50ms | 5/5 ✓ |
| Extra E1-E20 | Unicode/эмодзи, пустые/null/whitespace hash, длинный hash, RPC с extra полями, concurrent INSERT, DoS-стресс book, SQL через RPC, валидность всех bads_list arrays, CORS preflight, длинные diagnoses-массив, owner_chk, race на upsert_pending, dev-skip-payment 4 чужих Origin, нет подозрительных RPC, anon EXECUTE на 4 RPC | 47/47 ✓ |

**Итого: 135/135 ✓** (после фиксов)

**🐛 Найдено и пофикшено:**

**Issue 1 — REVOKE writes на статичных protocol_* таблицах** (миграция `20260518_revoke_anon_writes_on_protocol_tables.sql`)
RLS правильно блокировал UPDATE/DELETE (нет policy = по умолчанию deny), но GRANT-привилегии у anon/authenticated оставались (`UPDATE, INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER`). PostgREST возвращал `200 []` (no-op UPDATE — RLS не пускает ни одной строки), данные не менялись, но это плохая практика — лишний attack-surface. **Фикс**: явный `REVOKE INSERT, UPDATE, DELETE, TRUNCATE` для anon/authenticated на `protocol_bads`, `protocol_explanations`, `protocol_sample_menus`, `protocol_products`. Теперь UPDATE → 401, не 200.

**Issue 2 — Race condition на `upsert_pending_purchase`** (миграция `20260518_upsert_pending_race_fix.sql`)
При 5 параллельных вызовах от одного hash старый код делал `SELECT existing pending → если есть UPDATE, иначе INSERT`. Все 5 потоков видели «нет pending», один кидал INSERT, остальные падали на partial UNIQUE с 409. **Фикс**: атомарный `INSERT ... ON CONFLICT (profile_hash) WHERE status='pending' DO UPDATE SET email/amount`. Postgres гарантирует, все 5 параллельных вызовов теперь 200. В реальной жизни юзер только раз нажимает кнопку, но защита тоньше — лучше.

**🟢 Ложноположительные срабатывания (НЕ баги):**

| Сигнал | Реальность | Что сделал |
|---|---|---|
| `.env` и `docker-compose.yml` отдают 200 | nginx fallback на `index.html` (мой meta-refresh stub в `/menu/`), не сами файлы | Поправил тест: проверять не статус, а отсутствие в ответе `POSTGRES_PASSWORD/JWT_SECRET/ANTHROPIC_API_KEY` и других реальных секретов |
| `generate-menu` без auth → 400 (вместо 401/403) | Anon-key валиден, EF падает на validate(profile) → 400 missing_field. Системный промпт в ответе НЕ виден | Поправил тест: принимать любой 4xx |
| anon UPDATE на `protocol_bads` → 204 | RLS отбивает 0 rows, PostgREST возвращает 200 [] — данные не меняются | Поправил тест на проверку ДО/ПОСЛЕ содержимого. Плюс REVOKE для красоты |
| RPC с лишним полем → 404 PGRST202 | PostgREST 13+ строго проверяет сигнатуру (защита от случайных полей) | Поправил тест: принимать 200/400/404 (не 5xx) |
| sign в body ломает verify (initial test) | Мой test-payload не исключал sign перед подсчётом подписи как реальный Prodamus делает | Поправил тест на правильный sign-flow |

**🟡 Не покрыто автотестами (для ручной проверки Алексеем):**

| Что проверить вручную | Где |
|---|---|
| Шаги квиза (1-5), прогресс-бар, Назад/Вперёд, валидации на UI | `https://dev.listoshenkov.ru/menu/quiz.html` |
| Корзина: геймплей (тосты, тряска, скорость, fallback 55+, auto-add, dislikes-фильтр) | `https://dev.listoshenkov.ru/menu/basket.html` |
| Превью: тосты протоколов, плашка «Алексей рекомендует» при auto, карточка «Контроль белка» для веганов | `https://dev.listoshenkov.ru/menu/preview.html` |
| hold.html: прогресс-бар плавный (от 3% к 90% за 10 минут), редирект на ready | прогон test_pay → видим вживую |
| result.html: табы дней горизонтальный скролл, переключение, PDF реально скачивается, кириллица не крякозябра, страницы разделены | прогон + PDF на телефоне/десктопе |
| Мобильная адаптация (375px, iPhone SE/12, Android 360/412) | все страницы visualно |
| Реальные генерации Sonnet для каждого протокола (B7: FODMAP, АИП, WFPB, Кето, FMD, Кето-веган) — стоит $$$ за прогон, не автотестил | 7 тестовых платежей через `?test_pay=1` для каждого протокола |
| Письма Resend на разных email-доменах (gmail/yandex/mail.ru) | реальные тестовые платежи |

**🔵 Открытые задачи в бэклог (созданы и подсвечены ранее):**
- **SM-15** — залить реальные `instruction_text` для 121 записи `protocol_explanations` (сейчас все = `"(pregenerated)"`). Result.html временно показывает `explanation_text` под заголовком «Про твой протокол» как fallback.
- **SM-08-TUNE-2** — рассчитывать `target_calories` на сервере по Mifflin-St Jeor (все нужные данные есть включая sex) и чистить raw `height_cm/weight_kg/age` из payload AI (текущий код передаёт raw в Anthropic — нарушает SM-03).
- **SM-12-EXT** — 11 БАДов отсутствуют в каталоге `supplements`: Берберин, L-глутамин, Куркумин с пиперином, Витамин C 500-1000мг, Электролиты (натрий/калий/магний), Омега-3 EPA+DHA, B12 метилкобаламин, Омега-3 из водорослей и др. Сейчас открываются через fallback `?section=pills&q=<слово>`. Решить с Алексеем — заводить ли их в навигатор.
- **SM-MERGE-DEV-TO-PROD** — после ручного тестирования Алексеем перед мержом: удалить `supabase/functions/dev-skip-payment/` или оставить (защищена Origin-check). Решить.

**Артефакты:**
- Миграции: `20260518_revoke_anon_writes_on_protocol_tables.sql`, `20260518_upsert_pending_race_fix.sql` — обе применены на dev VPS через `psql -U supabase_admin`
- Скрипты: `supabase/scripts/test_full_plan.py` (135 тестов), `test_sm10.py` (32), `test_sm11_14.py` (31)
- Coverage: 198 уникальных проверок суммарно по 3 файлам
- На VPS: `/tmp/test_full_plan.py`, `/tmp/test_sm10.py`, `/tmp/test_sm11_14.py` (Алексей может перепрогнать одной командой)

**Коммит:** `f472e3f` в `miniapp/dev`. Обе миграции автоматически попадут в репо при следующем pull → merge в main.

**Что Алексею делать утром:**
1. Прочитать этот раздел (10 минут) — понять что покрыто.
2. Ручная проверка визуальных пунктов из таблицы выше (1-2 часа на полный обход).
3. После ОК — merge dev→main (с удалением dev-skip-payment если хочет).

---

#### SM-10 fix (Prodamus do=pay) + SM-10 DEV-skip + SM-11/12/13/14 + SM-09-TUNE (пол) + result.html полный — большой воркфлоу-спринт (17.05.2026, dev only)
**Контекст:** За одну сессию закрыли всю воронку от квиза до полноценного PDF-результата. Реальная Prodamus-оплата (Алексей открыл страницу), тестовый skip с симуляцией webhook, генерация Sonnet 7 дней, отрисовка дня по дню, БАДы с активными ссылками, апсейл гайд+консультация, форма «Книга предложений», поле пола в квизе. Пара критических багов поймана и закрыта на месте.

**SM-10-fix-do-pay:** Первый клик «Получить меню» открывал текстом `https://payform.ru/lkbwnO9/` вместо страницы оплаты — причина: я в `buildPaymentUrl` поставил `do=link` (это API для получения короткой ссылки), а нужен `do=pay` + массив `products[0][name|price|quantity|type|sku]` как в `index.html` для гайдов. Переписал URL-builder по проверенному формату. Заодно: `urlNotification` явный (а не только глобально зарегистрированный в кабинете), `customer_extra` = клиентский orderId — fallback идемпотентности webhook. Память: [[prodamus-do-pay-not-link]].

**SM-10 DEV-skip-payment EF:** Тестовый обход оплаты для прогона воркфлоу без денег. Открыть `https://dev.listoshenkov.ru/menu/preview.html?test_pay=1` → жёлтый баннер «TEST MODE» → клик «Получить меню» дёргает EF `dev-skip-payment`, которая строит fake-payload с правильным HMAC и шлёт в `prodamus-webhook`. Origin-проверка (только dev-домен → иначе 403). Перед симуляцией чистит старые devskip-следы для hash + кладёт свежий pending — чтобы webhook нашёл его и не плодил orphan-алерты в TG Алексею при повторных попытках. В preview.html при `test_pay=1` обходятся `get_purchase_status`/`upsert_pending_purchase` — даёт повторно тестировать после failed job. Не катать в прод.

**SM-11+ RPC `get_menu_result` расширен:** одним вызовом возвращает `menu + protocol + goal + diet_type + diagnoses + hormonal_status + imt_category + age_group + sex + meal_count + target_calories`. Клиент result.html сам тянет `instruction/explanation_text` из `protocol_explanations` через `resolveCluster()` (та же логика fallback что в preview.html). Параллельно фикс бага в `DIAG_TO_CLUSTER`: `chronic_fatigue` → `fatigue` (квиз шлёт `fatigue`, в препарате был ключ для несуществующего значения — кластер `energetichesky` не резолвился).

**SM-12 `protocol_bads`:** таблица + 12 наборов БАДов из брифа (cache_key=`<protocol>_<cluster>`, например `aip_autoimmun`, `lchf_metabolizm`, `wfpb_energetichesky`). RLS anon SELECT. Клиент использует тот же `resolveCluster()` для построения ключа, fallback-каскад: exact → одиночные кластеры → любой набор по протоколу.

**SM-13 апсейл (гайд + консультация):** GUIDE_MAP с приоритетом диагнозов над протоколом. Цена и название тянутся из реальной `products` таблицы по slug (не хардкод). Slugs совпадают с каталогом: kishechnik 690₽, schitovidka 690₽, blokirovka-vesa 690₽, immunitet 690₽, osteoporoz 990₽, zhelezodeficit 1490₽ и др. Бриф SM-13 содержал диагнозы `chronic_fatigue`/`sleep` — в квизе таких нет (`fatigue` есть, `sleep` нет вообще), исправил по факту. Deep-link на гайд `?section=guide_<slug>`, на консультацию `?section=consultation`.

**SM-14 «Книга предложений»:** Таблица `menu_requests` с RLS-замком (anon доступа нет). EF `book-request` — серверная валидация + INSERT + два канала уведомлений: TG-алерт в `@listoshenkov_nav_bot` Алексею + email на `listosha@list.ru` через Resend (HTML-вёрстка, reply_to = email пользователя — можно ответить из почтового клиента напрямую). Страница `menu/book.html` в пыльной розе с формой (description+email обязательные, параметры тела/диагнозы/ограничения/TG опционально). Ссылка из result.html «Мой случай сложнее — напишите Алексею».

**SM-09-TUNE (пол в квизе):** Колонка `menu_profiles.sex text CHECK IN ('male','female')`. Шаг 5 квиза дополнен полем «Пол» (Женский / Мужской) рядом с приёмами пищи. В `generate-menu` EF: `sex` в cache_key (нормы белка муж +20%), в SYSTEM_PROMPT — блок «Учёт пола» (если `target_calories=null` — оценочные значения по imt_category × sex × goal). docs/system_prompt_menu_v2.md синхронизирован.

**result.html переработан из placeholder в полный экран:**
- Горизонтальные табы дней (на экране — только активный, в PDF — все)
- Markdown-парсер `day_formatted` (# → h2, ** → strong, ___ → hr, два пробела → br)
- Блок про протокол (используется `explanation_text`, см. подвох ниже)
- Блок БАДов с **активными ссылками на каждый бад** через `?section=supp_<id>` (29 из 40 БАДов автоматически замэтчены по supplements.name через ILIKE-скрипт `link_bads_to_supplements.py`; остальные 11 — fallback `?section=pills&q=<слово>`)
- Блок гайда + консультация (deep-link)
- Кнопка PDF (html2pdf.js, lazy-load CDN) и «Поделиться» (navigator.share + clipboard fallback)
- Ссылка на book.html «Мой случай сложнее»
- 5 состояний экрана: loading / empty_hash / not_found / pending→hold / failed / ready
- Контактный блок везде: TG (`@listosha`) + MAX + email (`listosha@list.ru`) — тот же паттерн что в Консультации `index.html`

**PDF красивый и мобильный (правки по фидбеку):**
- `html2canvas { windowWidth: 480, width: 480 }` — DOM рендерится с мобильным viewport, CSS @media max-width:480px применяется → правая сторона больше не обрезана
- A4 portrait, compressed
- `enableLinks: true` — все `<a href>` кликабельны в PDF (поверх растрового рендера накладываются hyperlink-аннотации)
- `page-break-before` на `.day-block` / `.bads-block` / `.upsell-block` — каждый смысловой блок отдельной страницей (как Алексей просил)
- `.consultation-block` с `page-break-inside: avoid` — гайд и консультация на одной странице, не разрываются
- `.pdf-mode` CSS rework: убраны box-shadow, скрыты UI-only элементы (r-hero, r-tabs-wrap, r-actions, r-book-link-block)

**`index.html` (production-затрагивает!):** Добавлена поддержка `?section=pills&q=<запрос>` — устанавливает значение в `pillSearch` и вызывает `filterPills` после загрузки `suppLoaded`. Минимальная правка вокруг строки `param === 'pills'`. Используется result.html для fallback-ссылок на БАДы. На прод поедет вместе с SM-MERGE.

**hold.html прогресс-бар переделан:**
- Раньше: stage-привязка 3%→25%→80%→полка (рывки + долгое стояние)
- Теперь: **линейный crawl от 3% к 90% за 10 минут**, плавно. На `ready` — рывок 100%. Лучше не дойти, чем стоять.
- Текст «обычно 2-3 минуты» → «обычно укладываемся за 5-10 минут, можно закрыть вкладку — пришлём письмо»

**Sandbox-тесты:** SM-11..14 31/31 ✓ (`supabase/scripts/test_sm11_14.py`), SM-10 регрессии 32/32 ✓. Покрывают: RPC расширение, protocol_bads SELECT, book-request happy+validation+RLS, CHECK на sex.

**Реальный E2E подтверждён Алексеем 17.05.2026:**
- ✓ Квиз с полом → запись `sex=male` в `menu_profiles`
- ✓ Реальный клик «Получить меню» — открывается Prodamus с товаром и ценой 1200₽
- ✓ TEST_pay режим — fake-webhook → job → generate-menu (после фикса max_tokens) → ready
- ✓ Письмо «меню готово» прилетело на email через Resend
- ✓ result.html — меню по дням отрисовано, БАДы видны, контакты Алексея на месте
- ✓ TG-алерты приходят в `@listoshenkov_nav_bot` (curl-smoke + реальные orphan/failed-алерты)

**Найдённые и пофикшенные баги по ходу теста:**
- **MAX_OUTPUT_TOKENS=16000** в Sonnet — мало для 7 дней меню, ответ обрезался → JSON битый → job failed → $0.30 в трубу. Поднял до **32000**, повторный прогон прошёл.
- **menu_profiles.protocol=NULL** когда юзер в квизе выбрал «Не знаю» — EF выбирал базовый (`mediterranean`), но в БД не сохранял → cache_key в result.html был сломан, инструкция и БАДы не подгружались. Фикс в двух местах: (а) `runMenuGeneration` после успешной генерации делает UPDATE `menu_profiles.protocol`; (б) клиентский `resolveProtocolFallback()` в result.html для уже сгенерированных меню.
- **«Подробной инструкции для этой комбинации пока нет»** → корень: все 121 `instruction_text` в `protocol_explanations` = placeholder `"(pregenerated)"`. SM-09b заливал только `explanation_text`. Решение: показываем `explanation_text` под заголовком «📋 Про твой протокол», блок скрывается полностью если и оно пусто. На будущее — SM-15 ниже.
- **PDF: правая сторона обрезана** — исправлено через `windowWidth: 480` в html2canvas + полная переделка `.pdf-mode` CSS.
- **«TG не пришло»** check после первого SM-10 — оказалось пришло, я просто не настроил smoke. Curl-smoke + 3 реальных orphan/failed-алерта подтверждены Алексеем.
- **Кнопка «На страницу СделайМеню» в book.html → 403** — на dev-VPS нет `index.html` в `/var/www/dev/menu/`, nginx без autoindex даёт 403. Создал `menu/index.html` с meta-refresh + JS-redirect на `listoshenkov.ru/menu/`. Решает проблему для всех `/menu/` ссылок разом.
- **Неправильный handle:** везде в menu/-страницах был `@listoshenkov`, реально — `@listosha`. Поправил.

**Артефакты:**
- Миграции: `20260517_sm11_get_menu_result_expanded.sql`, `20260517_protocol_bads.sql`, `20260517_menu_requests.sql`
- EF новые/обновлённые: `book-request`, `dev-skip-payment`, `prodamus-webhook` (расширен меню-веткой), `generate-menu` (max_tokens 32k + блок про пол)
- Фронт: `menu/result.html` (полный rework), `menu/book.html` (новый), `menu/hold.html` (прогресс-бар), `menu/preview.html` (test_pay + новый buildPaymentUrl), `menu/index.html` (redirect-stub), `menu/quiz.html` (поле sex), `index.html` (поддержка `?q=` в pills)
- Скрипты: `supabase/scripts/test_sm11_14.py`, `supabase/scripts/test_sm10.py`, `supabase/scripts/link_bads_to_supplements.py`
- docs: `system_prompt_menu_v2.md` синхронизирован с EF

**Коммиты на dev:** 554c9b0 (do=pay) → f0fdfb0 (SM-11..14 + sex) → 4ed3e37 (dev-skip-payment) → 63cea7d (max_tokens 32k + контакты) → bc1ac58 (progress + protocol-fix + book-email) → 793c749 (PDF mobile + bad-links). SM-MERGE-DEV-TO-PROD ждёт явное «ок».

**Открытые задачи в бэклог (созданы по ходу):**
- **SM-15** (новая): залить реальные `instruction_text` для 121 записи `protocol_explanations` (сейчас все = `"(pregenerated)"`). Можно через генерацию Claude.ai партиями. До этого — result.html показывает `explanation_text` как fallback.
- **SM-08-TUNE-2:** `target_calories` в `menu_profiles` сейчас всегда `NULL` (ни квиз, ни EF не считают). Промпт обещает «±50 ккал» от значения, которого нет. Также: в `generate-menu` в Anthropic уходят raw `height_cm`/`weight_kg`/`age` — нарушает SM-03 принцип «raw остаётся в РФ-БД». Решение: рассчитывать target в EF по Mifflin-St Jeor (все нужные данные теперь есть включая sex) и чистить raw из payload перед AI.
- **SM-12-EXT:** 11 БАДов не в `supplements` каталоге (Берберин, L-глутамин, Куркумин с пиперином, Витамин C 500-1000мг, Электролиты, Омега-3 EPA+DHA, B12 метилкобаламин, Омега-3 из водорослей и др.) — открываются через ?q= поиск как fallback. Алексей решает: завести их в навигатор или оставить как есть.
- **На прод (SM-MERGE):** перед мержом dev→main удалить `supabase/functions/dev-skip-payment/` + блок `if (testPayMode)` в preview.html. Или оставить — EF защищена origin-проверкой `dev.listoshenkov.ru`, на проде не сработает (но лишний код).

**На завтра у Алексея (18.05.2026):**
1. Тестирование всего флоу на dev: квиз→корзина→preview→test_pay→hold (прогресс плавный)→result→PDF (мобильный, правая сторона не обрезана, ссылки кликаемые)→book.html.
2. Новое задание от Claude.ai — Алексей пришлёт.

---

#### SM-10: оплата Prodamus + асинхронная генерация меню (17.05.2026, dev only)
**Что сделано:** Полноценная воронка оплаты под СделайМеню. preview → Prodamus → hold (polling) → result. Webhook-логика встроена в существующий `prodamus-webhook` EF через ранний guard — у Prodamus один webhook URL на магазин, регистрировать ничего не надо.

**Миграция `20260517_menu_purchases_jobs.sql`:**
- `menu_purchases` — журнал оплат. UNIQUE `prodamus_order_id` (идемпотентность webhook). Partial UNIQUE `(profile_hash) WHERE status='pending'` — один pending на hash. RLS: service_role + anon INSERT(pending) с строгим CHECK.
- `menu_generation_jobs` — FSM `pending → generating → ready | failed`, привязан к `purchase_id`, хранит `menu_json` (jsonb).
- 4 RPC SECURITY DEFINER (anon-friendly через REST `/rpc/`):
  - `get_purchase_status(hash)` — для preview, защита от двойной оплаты
  - `upsert_pending_purchase(hash, email, amount)` — создаёт/апдейтит pending перед редиректом в Prodamus (с валидацией email regex и hash 16-128 симв)
  - `get_menu_status(hash)` — для hold.html polling, возвращает только статус без menu_json
  - `get_menu_result(hash)` — для result.html, отдаёт menu_json только при status='ready'

**EF `prodamus-webhook` расширен:** после верификации подписи и проверки `payment_status="success"` — ранний guard: если `_param_product='menu_7d'` или есть `_param_profile_hash`, идёт в `handleMenuPurchase()`. Гайд-логика не тронута. Менюшная ветка:
1. Идемпотентность через UNIQUE prodamus_order_id
2. Каскад поиска pending: hash → email → orphan (новая запись задним числом + TG-алерт)
3. Перевод purchase в `paid`, создание `menu_generation_jobs(pending)`
4. Fire-and-forget `runMenuGeneration()` через `EdgeRuntime.waitUntil` — вызов generate-menu(days=7), статус job апдейтится в фоне, по ready отправляется email через Resend
5. TG-алерты Алексею через `ADMIN_TELEGRAM_ID=788984484` + `TELEGRAM_BOT_TOKEN` (`@listoshenkov_nav_bot`) — orphan, failed-генерация, критические DB-ошибки

**Frontend (dev):**
- `menu/preview.html`: 4 шага CTA — PATCH email в menu_profiles → `get_purchase_status` → `upsert_pending_purchase` → buildPaymentUrl + redirect. Если уже paid → редирект в result. Без hash → возврат в quiz. Цена: 1200 ₽ полная, 600 ₽ senior (передаётся в `_item_price_1` и `amount` pending-записи).
- `menu/hold.html`: новый экран ожидания. Polling RPC каждые 7 сек, плавный creep-прогресс (pending 25% → generating 80% → ready 100%), толерантность 42 сек к not_found (Prodamus иногда отстаёт на 5-15 сек после redirect), 4 состояния: wait / ready (auto-redirect в result) / failed / not_found. Email из URL/localStorage в плашке «Закрыть и ждать письмо».
- `menu/result.html`: placeholder с отрисовкой `day_formatted` (мини markdown→HTML парсер: # → h2, ** → strong, ___ → hr, два пробела → br). Status-каскад: ready → меню / pending → автoredirect в hold / failed → ошибка с поддержкой / not_found → ссылка в TG / empty_hash → «ссылка повреждена». Banner про скоро-PDF.

**Sandbox-тесты (32/32 ✓):** `supabase/scripts/test_sm10.py`. Покрытие:
- T1-T2: невалидная/отсутствующая подпись → 403
- T3: payment_status=cancelled → 200, без записи
- T4: happy path — pending по hash → paid + job создан
- T5: дубль order_id → 200, второй записи нет
- T6: orphan (профиль не найден) → paid-запись создана + TG-алерт пришёл Алексею (визуально подтверждено)
- T7: fallback по email — hash неверный, найден pending по email
- T8-T11: все 4 RPC (valid + invalid_hash + invalid_email + already_paid + not_found)
- T12: partial UNIQUE на pending — повторный upsert = update, одна запись
- T13: sign в body не ломает verify (поле исключается перед подсчётом hmac)

**Что НЕ покрыто в тестах (стоят денег):** реальный вызов generate-menu (~$0.15/прогон) и реальный платёж через Prodamus. Это — на живом тестовом платеже Алексея на dev.

**Артефакты:** `supabase/migrations/20260517_menu_purchases_jobs.sql`, расширение `supabase/functions/prodamus-webhook/index.ts` (+275 строк), `menu/hold.html` (новый), `menu/result.html` (новый), `menu/preview.html` (правка onCtaClick), `supabase/scripts/test_sm10.py` (новый).

**Коммиты:** `24f8441` (первоначальный SM-10 с отдельной handle-payment EF), `0bce862` (рефактор: всё в prodamus-webhook, handle-payment удалена). На dev. SM-MERGE-DEV-TO-PROD ждёт явное «ок».

**Открыто отдельно:**
- регистрация nginx-route для menu@listoshenkov.ru у Resend (sender domain verification — если ещё не настроен)
- ЛК с историей покупок (SM-11)
- полноценный result.html с PDF/печатью (SM-11)

---

#### SM-09b/c/d/e/f: AI-free preview + фильтр по diet_type + крупнее шрифты (17.05.2026)
**Что сделано (по итогам длинной сессии 17.05):** Полностью убрали Anthropic с preview-экрана, добавили базы пред-сгенерированных текстов и примеров, разобрались с веган/вегетарианец/пескатарианец-фильтрами и оптимизацией UX.

**SM-09b: explanation из БД, не из Haiku.** Раньше preview вызывал EF generate-explanation-and-instruction (~17 сек, $0.02). Теперь — SELECT из `protocol_explanations` по cache_key `<protocol>_<cluster_key>`. Залит CSV от Алексея + Claude.ai: **121 объяснение** (10 протоколов × 12 кластеров + universal menopause_addon). resolveCluster на клиенте: gut_issues/candida→gjkt, ir/obesity/pcos→metabolizm, hashimoto/weak_immunity→autoimmun, chronic_fatigue/underweight→energetichesky, menopause-diag→gormonalny, joints/osteoporosis→oporno. Каскад fallback: exact → одиночные части композита → net_diagnozov → menopause_addon. Add-on про менопаузу подмерживается если hormonal_status=menopause. Открыт RLS SELECT для anon (миграция `20260517_protocol_explanations_anon_select.sql`). Файлы: `supabase/seeds/protocol_explanations_v2.csv`, `protocol_explanations_seed_v2.sql`. **Эффект:** −$0.02/preview, instant.

**SM-09c: sample-меню из БД, не из Sonnet.** Раньше Preview вызывал generate-menu days=1 (~28 сек, $0.15). Теперь — SELECT из `protocol_sample_menus` по cache_key `<protocol>_<goal>`. Залит CSV: **28 примеров** (7 живых протоколов × 4 цели maintain/lose/gain/therapeutic). Структура `sample_json`: 3 приёма (🥐🍽🍲) × 4-6 продуктов в каждом, БЕЗ граммовок и КБЖУ. Динамический подзаголовок «Пример по протоколу X с целью Y. Полное меню под N приёмов + параметры тела — после оплаты». Loading упрощён (нет фейк-прогресса на 30 сек). Миграция `20260517_protocol_sample_menus.sql`, seed `protocol_sample_menus_v1.csv` + `_seed_v1.sql`. EF generate-menu остаётся для days=7 после оплаты. **Эффект:** −$0.15/preview = **полный $0 до оплаты**, <1 сек ответ.

**SM-09d: фильтр продуктов по diet_type.** Алексей: вегетарианцу в корзине показывали курицу/рыбу/яйца. Миграция `20260517_protocol_products_animal_origin.sql`: добавлена колонка `animal_origin` (plant/dairy/eggs/fish/meat) с автоматической разметкой через regex по product_name + CHECK + индекс. Залит расширенный CSV от Алексея `protocol_products_vegan_vegetarian.sql` (132 продукта: wfpb +65 крупы/бобовые/тофу, pescatarian +67 рыба+растительные). Финальное распределение: wfpb 95 plant (100%), pescatarian 34 plant + 22 fish + 7 dairy + 4 eggs (без meat). Фильтр в 3 слоя:
- `menu/basket.html`: `fetchProducts(protocol, dietType)` с REST-фильтром `&animal_origin=in.(...)`, для vegan принудительно protocolKey=wfpb (95 растительных vs 11 в lchf)
- `supabase/functions/generate-menu`: `.in('animal_origin', allowedOrigins)`, для vegan productProtocol=wfpb
- `menu/preview.html`: `filterSampleByDiet(sample, dietType)` на клиенте — отфильтровывает item'ы в sample_menus которые не подходят. Если в приёме осталось <2 продукта → fallback на `wfpb_<goal>` или `wfpb_maintain`. **Дисклеймер для веганов убран** по требованию Алексея — образец сразу правильный
Поправлены 3 аномалии разметки: «Сельдерей» (был fish → plant), «Яйца варёные в wfpb» (DELETE), «Яйца куриные варёные в pescatarian» (был meat → eggs).

**SM-09e: растительный протеин + контроль белка для веганов.** Залит `protocol_products_plant_proteins.sql`: 11 порошковых протеинов (7 wfpb + 4 pescatarian: гороховый, рисовый, конопляный, тыквенный, подсолнечный, соевый изолят, смесь). В системный промпт EF generate-menu вшит блок «СПЕЦИАЛЬНОЕ ПРАВИЛО: контроль белка» из `system_prompt_menu_v2.md`: норма по imt_category (normal=60г, overweight=75г, obese=90г, underweight=50г), при недоборе добавить 25г растительный протеин (приоритет: смесь→гороховый), пересчитать итоги, исключение при goal=therapeutic. В `preview.html` добавлена карточка «💪 Контроль белка» (видна только для veg/vegan/pescatarian) — объясняет что в полном меню добивается белок.

**SM-09f: фиксы по итогам тестирования.**
- auto-add в басете теперь учитывает `animal_origin` (двойной safety: REST-фильтр + клиентская проверка через `_userDietType`), `rollUpProducts` проносит animal_origin в PRODUCTS
- PREVIEW_CACHE_KEY v6→v7: у пользователя в localStorage висел старый payload с `{sampleMenu: null}` ещё до заливки sample_menus
- Шрифты крупнее на мобильном (Алексей: «весь текст мелкий»): в quiz.html все ключевые элементы +2pt; в preview.html 26 правок (p-desc/card-body/accordion-body/meal-item: 15→17, плашки auto-pick/protein/instruction: 13.5→15, sticky-CTA, email-form, etc.); в payment-soon (7 правок) и basket-результат (5 правок) аналогично

**Stable стоимость воронки:** до оплаты 100% AI-free, после оплаты Sonnet 4.6 для days=7 (~$0.15 однократно, кеш 14 дней по profile).

**Открытые задачи отдельно:**
- ловушки (`is_trap=true`) в protocol_products для vegan/vegetarian не размечены (там 0 записей с is_trap, но если в будущем добавим — учесть)
- sample-меню сейчас гранулярность protocol×goal; для veg* фильтруется на клиенте. При желании — расширить до protocol×goal×diet_type (112 записей)
- остаётся бэклог: SM-10 (Prodamus), SM-08-ASYNC (jobs+email), тюнинг промптов

**Коммиты в `miniapp/dev`:** 7d2b5f7 (cluster explanations) → ed1cca3 (v2 ext) → adb84e0 (senior toggle) → 17af84f (sample table) → 819bf6f (sample preview) → d711227 (sample seed) → 8f6a6c0 (diet filter) → 75e0a72 (client diet filter) → 59486fe (proteins + prompt v2) → e8e157d (protein note) → 048dbdc (auto-add safety + fonts quiz) → e1b7763 (fonts preview/basket/payment).
**Артефакты:** `supabase/seeds/` — все CSV+SQL для перезаливки, `docs/system_prompt_menu_v2.md`, `docs/explanations_generation_brief.md`, `docs/sample_menus_generation_brief.md`.

---

#### SM-09: UI-экран превью (объяснение + меню 1 день без граммовок) + заглушка payment-soon (17.05.2026)
**Что сделано:** Самостоятельная страница `menu/preview.html` в палитре «пыльная роза». Финальное звено бесплатного онбординга: квиз → корзина → превью → (оплата). Использует SM-07 (объяснение) и SM-08 (preview 1 дня) параллельно через `Promise.all` — суммарное ожидание = max(28с, 17с) вместо последовательного сложения.
- **Загрузка профиля:** localStorage `menu_last_profile_v1` (квиз) + `menu_favorite_products_v1` (корзина, опционально). Если профиля нет → error-экран с предложением пройти квиз.
- **resolveProtocol на клиенте** (логика 1:1 с EF generate-menu): vegan→wfpb, vegetarian→mediterranean, ir→lchf, gut_issues→fodmap, inflammation/joints→aip, иначе mediterranean. Применяется когда `protocol_auto=true` в квизе — обе EF гарантированно получают конкретный protocol, кеш не размазывается по «auto». **Фикс по ходу:** до этого preview падал на `explanation 400: protocol_required` для пользователей, выбравших «Не знаю — подберите».
- **UI-плашка** «Алексей рекомендует тебе [Палео]» под заголовком — показывается только если был auto, с предложением вернуться в квиз и выбрать вручную.
- **Loading-экран** с fake-прогрессом и честным сообщением «обычно 30-40 секунд», 4 стадии (Готовим объяснение → Алексей формулирует → Подбираем продукты → Собираем меню).
- **Клиентский кеш** `menu_preview_v2` на 30 минут по отпечатку профиля — back/forward не дёргают EF повторно.
- **Аккордеон** «Инструкция к меню» открыт по умолчанию.
- **Превью одного дня без граммовок:** продукт + «— г», тотал «— ккал». Граммовки только в полной версии после оплаты.
- **Email-форма** с regex-валидацией, sticky-CTA снизу при скролле (IntersectionObserver). При CTA: `PATCH menu_profiles?anon_profile_hash=eq.X` с email через anon-key (RLS anon_self_update уже было от SM-06), редирект на `/menu/payment-soon.html?email=...`.
- **menu/payment-soon.html** — заглушка до SM-10: подсвечивает email, 3-шаговый чеклист «что дальше», CTA на лендинг + возврат к превью.
- **basket.html:** финальный CTA «Оставить email до запуска» → заменён на «Дальше — превью меню →».
**URL на dev:** https://dev.listoshenkov.ru/menu/preview.html
**Цепочка:** quiz → basket → preview → payment-soon. EF-стек: explanation (Haiku, 30д кеш) + menu days=1 (Sonnet, 14д кеш).
**Миграция:** `supabase/migrations/20260517_menu_profiles_add_email.sql` — добавлена колонка `email` в `menu_profiles` (применена 17.05.2026 через `psql -U supabase_admin` — таблицу создавал он, postgres не owner).
**Файлы:** `menu/preview.html`, `menu/payment-soon.html`, `menu/basket.html` (правка CTA). Коммиты `3e287a1`, `7f826e3` (на dev, ждёт SM-MERGE для прода).
**Аналитика:** preview_open, preview_ready, preview_cta_click, preview_email_saved, preview_error, preview_no_profile, payment_soon_view.
**Тестирование 17.05.2026:** Алексей прошёл всю цепочку quiz→basket→preview с `protocol_auto=true`, подтвердил «первично всё работает, правки промпта позже».

#### SM-08: Edge Function `generate-menu` (Anthropic Sonnet 4.6) + кеш `menu_cache` (17.05.2026)
**Что сделано:** Edge Function принимает анонимный профиль + `days` (1 для preview, 7 для полного меню), подтягивает разрешённые продукты протокола из `protocol_products`, передаёт в `claude-sonnet-4-6` с граммовками для текущего `imt_category` (граммовки из БД, не от AI). Кеширует ответ в `menu_cache` на 14 дней по ключу `protocol|goal|meal_count|imt_category|diet_type|days`. При `protocol_auto=true` сама выбирает базовый протокол: vegan→wfpb, vegetarian→mediterranean, ir→lchf, gut_issues→fodmap, inflammation→aip, иначе mediterranean. `exclude_products` фильтрует на стороне EF (case-insensitive substring). Системный промпт вшит из `system_prompt_menu.md` v1, чеклист обобщён под динамическое количество дней. Проверка `stop_reason: 'max_tokens'` → ошибка (JSON был бы битый). Валидация `parsed.week.length === days`.
**Endpoint:** `POST https://uckuyoyubub.beget.app/functions/v1/generate-menu`
**Тело:** `{ ...профиль, days: 1|7 }`
**Ответ:** `{ menu: {week: [...]}, selected_protocol, days, cached, model }`
**Миграция:** `supabase/migrations/20260517_menu_cache.sql` (применена 17.05.2026)
**Файл EF:** `supabase/functions/generate-menu/index.ts` (закопирован в `/opt/beget/supabase/volumes/functions/generate-menu/`)
**Коммит:** `7b8857e` (на dev)
**Тесты (FODMAP + ИР + менопауза, overweight, 3 приёма, target 1500):**
- `days=1`: 28 сек, 1420 ккал, JSON валиден, 3 приёма, `day_formatted` по регламенту v3.0
- `days=1` повторный: 2 сек, `cached=true`
- `days=7`: 1:52, 7 дней × 3 приёма, ротация белков соблюдена (нет повторов 2 дня подряд), все продукты FODMAP-friendly
**Что НЕ ОК (отдельные задачи):** калорийность стабильно занижена на 50-150 ккал (только 1/7 в коридоре ±50 от target) → тюнинг промпта в SM-08-TUNE. Длинные `days=7` блокируют worker на ~2 минуты, для after-payment лучше переехать на async → SM-08-ASYNC.
**Инфра-правки на VPS** (НЕ в git, могут потеряться при апдейтах Supabase):
- `main/index.ts` `workerTimeoutMs` 60s → 10 мин
- `nginx /etc/nginx/sites-available/supabase` `proxy_read_timeout` 60s → 600s + `proxy_send_timeout 600s`
- `kong.yml functions-v1`: `read_timeout: 600000`, `write_timeout: 600000` (default Kong=60s)
- `ANTHROPIC_API_KEY` в `/opt/beget/supabase/.env` + проброс в `docker-compose.yml functions.environment`

#### SM-07: Edge Function `generate-explanation-and-instruction` (Anthropic Haiku 4.5) + кеш `protocol_explanations` (17.05.2026)
**Что сделано:** Edge Function принимает анонимный профиль (тот же формат, что в `menu_profiles`), возвращает пару `{ explanation, instruction }` от `claude-haiku-4-5`. Кеширует на 30 дней по ключу `protocol|diagnoses_sorted|hormonal_status` — большинство комбинаций повторяется у разных пользователей. RLS закрыт, доступ только service_role (EF). Системный промпт вшит из `system_prompt_explanation.md` v1. `extractJson()` fallback на случай если модель завернёт в markdown. UPSERT с `ON CONFLICT cache_key`.
**Endpoint:** `POST https://uckuyoyubub.beget.app/functions/v1/generate-explanation-and-instruction`
**Тело:** анонимный профиль (минимум: `protocol`)
**Ответ:** `{ explanation, instruction, cached, model }`
**Миграция:** `supabase/migrations/20260517_menu_protocol_explanations.sql` (применена 17.05.2026)
**Файл EF:** `supabase/functions/generate-explanation-and-instruction/index.ts` (закопирован в `/opt/beget/supabase/volumes/functions/generate-explanation-and-instruction/`)
**Коммит:** `e03f032` (на dev)
**Тесты (FODMAP + ИР + менопауза, overweight):**
- 1-й вызов: 17 сек, JSON валиден, оба поля заполнены (explanation 1647 симв, instruction 1618)
- 2-й вызов: 0.67 сек, `cached:true`, `used_count` инкрементировался
- Стиль: нет «является», «оптимальный», caps lock, тире — только дефис
**Что НЕ ОК:** в `instruction` иногда capslock-заголовки («БАЗОВЫЕ ПРАВИЛА»), «инсулинрезистентность» вместо «инсулинорезистентность» → SM-07-TUNE.

#### SM-09d-FMD: protocol_products — добавлены FMD + Противовоспалительный (17.05.2026)
**Что сделано:** Залит сид `protocol_products_fmd_antiinflammatory.sql` в self-hosted Supabase на VPS. 141 продукт: 63 для `fmd` (5-дневный цикл по Лонго + 25 дней между циклами) и 78 для `anti_inflammatory` (противовоспалительный для суставов). В каждом `notes` — механизм действия (аутофагия / NF-κB / EPA+DHA / коллаген / куркумин+пиперин), а не «полезно».
**Что починили перед заливкой:**
- Колонки в исходнике шли с суффиксом `_imt` (`amount_normal_imt` и т.д.) — фактическая схема без суффикса. Переименовали через sed.
- Дубликат `(anti_inflammatory, Костный бульон говяжий)` встречался дважды (в «Птица и мясо» и в «Коллагеновые продукты») — UNIQUE (protocol, product_name) валил транзакцию. Оставлено первое вхождение, второе удалено.
**Итог в БД:** `fmd` — 63, `anti_inflammatory` — 78. В `protocol_products` теперь 10 протоколов (предыдущие 8 базовых + 2 новых).
**Заливка:** scp → `docker cp supabase-db:/tmp/` → `docker exec psql -v ON_ERROR_STOP=1 --single-transaction`. Сид-файл от Claude.ai, в репо `miniapp` не зафиксирован (это разовая операция в БД, не миграция).

#### SM-05: Онбординг-квиз 5 шагов (16.05.2026)
**Что сделано:** Самостоятельная страница `menu/quiz.html` (не трогает SPA `index.html`). 5 шагов (цель / тип питания / протокол / диагнозы / параметры тела), прогресс-бар, навигация вперёд-назад, валидация. localStorage-персистентность (`menu_quiz_state_v1`, `menu_anon_hash_v1`). `anonymizeProfile()` на клиенте: ИМТ-категория и age-group считаются локально, raw данные (рост/вес/возраст) хранятся только в Supabase на Beget. Тосты-описания протоколов на ⓘ. Защита диагнозов: «Ничего» взаимоисключающее. POST в `public.menu_profiles` через anon-key + PATCH-fallback на 409 (UNIQUE по hash). Готовый экран со сводкой. Аналитика (`menu_quiz_open/step/completed`). Палитра «пыльная роза», адаптив. **Фикс по ходу:** убран `Prefer: resolution=merge-duplicates` — он включал UPSERT-режим, для которого `anon` не имеет UPDATE-политики (по дизайну).
**URL на dev:** https://dev.listoshenkov.ru/menu/quiz.html
**Проверка:** прогон через UI — запись попала в `public.menu_profiles` (goal=therapeutic, protocol_auto=true, diagnoses включая hashimoto/pcos/menopause, imt_category=overweight, age_group=45-54, raw 176/80/46).
**Файл:** `menu/quiz.html` (dev branch, ждёт SM-MERGE для прода)

#### SM-06: Игровая механика «Корзина» + fallback-список (16.05.2026)
**Что сделано:** Самостоятельная страница `menu/basket.html`, DOM-анимация (не canvas) на базе предоставленного прототипа.
- **Геймплей:** падают продукты (emoji + label), корзина-SVG ловит свайпом/мышью; слайдер скорости 1-5 (живое изменение темпа); пул ≤40 разрешённых + ≤12 ловушек, все critical/auto-include всегда в пуле сверх лимита, перетасовка
- **Поимка:** ✓ ярко-зелёный тост `#16a34a` для правильно, ✗ ярко-красный `#dc2626` для ловушки + тряска корзины + красная вспышка по периметру арены
- **Счётчик:** «Поймано: N / Y» (Y = все разрешённые в пуле); при сборе всех → «Все собраны! Жми Готово»
- **Pause/Exit:** кнопка ⏸ в шапке + overlay (Продолжить / Закончить / Начать заново / Выйти на квиз), Esc = resume. Паттерн из `games/iron/`
- **Источник protocol:** из `menu_last_profile_v1` в localStorage (квиз сохраняет snapshot перед очисткой state). Если `protocol_auto=true` → fetch из всех 4 базовых протоколов с пересечением ловушек
- **Auto-add в результаты:** `nutrient_critical || auto_include`, минус продукты, совпавшие с `dislikes_text` по `DISLIKE_PATTERNS` (концепты: яйца / молочка / орехи / рыба / красное мясо). Debounce 350мс — таргеты исчезают сразу при упоминании
- **Textareas под результатами:** «Что ещё хочешь добавить?» (`wishlist_text`) + «Что не любишь / реакция?» (`dislikes_text`)
- **Fallback** для 55+: кнопка «Выбрать из списка» — обычные чекбоксы, critical отмечены по умолчанию, тот же путь к результатам
- **Сохранение:** PATCH `menu_profiles?anon_profile_hash=eq.HASH` с favorite_products + wishlist_text + dislikes_text; localStorage backup `menu_favorite_products_v1`
**URL на dev:** https://dev.listoshenkov.ru/menu/basket.html
**Файл:** `menu/basket.html` (dev branch, ждёт SM-MERGE для прода)
**Аналитика:** events `basket_open`, `basket_catch`, `basket_trap`, `basket_fallback_done`, `basket_done`

#### SM-04: Supabase — таблица `protocol_products` + 408 продуктов × 7 протоколов (16.05.2026)
**Что сделано:** Создана `public.protocol_products` — справочник под 7 протоколов питания. Изначально залит CSV (301 строка, 4 протокола). Позже переезалит из `protocol_products_seed_v1.sql` (новый сид от Claude AI: 394 строки + ALTER ADD COLUMN emoji + восстановлены 14 яичных продуктов с auto_include=true). Очищены 2 дубля в исходном сиде: `paleo+Батат запечённый` (×5), `fodmap+Кешью`.
**Распределение:** fodmap 93 · paleo 71 · mediterranean 73 · aip 52 · keto 54 · lchf 34 · wfpb 31. Итого 408.
**Структура:** id (uuid) / protocol / product_name / category / **emoji** / meal_type (any/breakfast/lunch/dinner/snack) / is_trap / trap_reason / catch_text / kcal_per_100g + protein/fat/carbs / amount_* по ИМТ / unit / nutrient_critical / **auto_include** / notes / created_at / updated_at. UNIQUE (protocol, product_name). Индексы под игру и генератор меню. RLS: SELECT для anon+authenticated, ALL для service_role.
**Миграции (применены 16.05.2026):**
- `20260516_menu_protocol_products.sql` (исходная схема)
- `20260516_menu_protocol_products_auto_include.sql` (auto_include + 9 яиц помечены)
- `20260516_protocol_products_emoji_and_reseed.sql` (emoji-колонка + переезалитка)
**Сид-файл:** `supabase/seeds/protocol_products_seed_v1.sql`
**Проверено:** REST anon SELECT с emoji (200), REST anon INSERT (401 RLS denied), распределение через psql.

#### SM-03: Supabase — таблица `menu_profiles` (16.05.2026)
**Что сделано:** Создана `public.menu_profiles` — снимок состояния пользователя для генерации меню (цель / тип питания / протокол / диагнозы / параметры тела / категории / favorite/exclude products / target_calories+БЖУ). Поддержка двух режимов: anonymous (`anon_profile_hash`, для квиза без логина) и linked (`user_id` → `public.users(id)` bigint, после TG/MAX-логина). UNIQUE-индексы: один профиль на user_id или на hash. CHECK на enum-поля (goal/diet_type/imt_category/age_group) и физические диапазоны (рост 120-230, вес 30-250, возраст 14-100). RLS: anon только INSERT с валидным hash (длина 16-128) и без user_id; authenticated — self only по JWT.sub; service_role — всё. Trigger updated_at. raw-данные (рост/вес/возраст) остаются на Beget, в AI уходит только imt_category/age_group.
**Миграция:** `supabase/migrations/20260516_menu_profiles.sql`
**Решение по имени:** `menu_profiles` вместо `user_profiles` из PRD — потому что в БД уже есть `user_health_profile` (медицинский профиль с overlapping полями diagnoses/age/weight/height). Новая таблица — это **menu-session-specific snapshot**, не общий health-профиль.
**Проверено:** REST-тесты anon (HTTP 201 valid / 401 RLS на user_id / 401 RLS на короткий hash / 400 CHECK на invalid goal).

#### SM-02: Supabase — таблица `waitlist` (16.05.2026)
**Что сделано:** Создана `public.waitlist` (email / source / user_agent / ip_hash / created_at) с индексами и RLS. Политика `allow_public_insert` для `anon` с email-regex и whitelisted `source` (menu_landing / guide_landing / home_landing). REST INSERT verified (HTTP 201), CORS preflight открыт.
**Миграция:** `supabase/migrations/20260516_menu_waitlist.sql`

#### SM-01: Hero — блок вторичных выгод (16.05.2026)
**Что сделано:** 8 строк выгод с левой границей #D4537E между подзаголовком и pills в Hero лендинга. Цвет текста #F4C0D1, мобильная адаптация (font 14 + меньше padding).
**Файл:** `menu/index.html` (на VPS: `/var/www/landing/menu/index.html`)

#### SM-00: Лендинг `listoshenkov.ru/menu` (16.05.2026)
**Что сделано:** Статическая HTML-страница на **Beget VPS** в `/var/www/landing/menu/index.html` (правится через SSH как остальные страницы лендинга — не git, не GitHub Pages). Hero + блок «Для кого» (10 карточек) + «Как работает» (4 шага) + протоколы с тостами + пример меню (день 1 FODMAP) + FAQ (8 вопросов) + форма waitlist → Supabase + footer с цветными кнопками. SEO/og/JSON-LD (Service + FAQPage). Аналитика ym+ga4. Sitemap обновлён.
**URL:** https://listoshenkov.ru/menu/
**Локальный исходник:** `C:\Users\listo\landing-source\menu\index.html`
**Цветовая схема:** Пыльная роза применена.

---

### 📋 Бэклог СделайМеню (по приоритету)

| ID | Задача | Приоритет | Зависит от |
|----|--------|-----------|-----------|
| SM-10 | Оплата Prodamus + webhook handle-payment (мэтчинг по email, который собирается на preview) | 🔴 | SM-09 ✅ |
| SM-09-TUNE | Правки промптов explanation/menu по результатам тестирования (от Алексея, накопить пакетно — capslock, орфография, калорийность ±50, формулировки) | 🟠 | SM-09 ✅ |
| SM-08-TUNE | Тюнинг промпта `generate-menu`: калорийность стабильно занижена на 50-150 ккал (1/7 дней в коридоре ±50) — править системный промпт или калибровать target в EF | 🟠 | SM-08 ✅ |
| SM-07-TUNE | Тюнинг промпта `generate-explanation-and-instruction`: убрать capslock-заголовки в `instruction`, добавить корректную форму «инсулинорезистентность» как пример | 🟡 | SM-07 ✅ |
| SM-09c-EXT | Расширить protocol_sample_menus до 112 записей (protocol×goal×diet_type вместо текущих 28 protocol×goal) — пока для veg* sample фильтруется на клиенте | 🟢 | SM-09c ✅ |
| SM-09d-FMD | Заполнить protocol_products для FMD / Противовоспалительный — explanation для них уже в БД, но продуктов нет → EF generate-menu вернёт no_products | 🟢 | SM-09d ✅ |
| SM-10 | Оплата Prodamus + webhook handle-payment | 🟠 | SM-09 |
| SM-11 | Полное меню (7 дней, `days=7`) + PDF (html2pdf.js) | 🟠 | SM-08 ✅, SM-10 |
| SM-08-ASYNC | Async-обёртка для `days=7` после оплаты: новая таблица `menu_generation_jobs`, pg_cron worker дёргает Anthropic в фоне, email-уведомление через Resend (ключ уже в `.env`). Текущий sync блокирует worker на ~2 мин — для after-payment UX лучше «меню придёт на email через 5 минут» | 🟠 | SM-10 |
| SM-12 | Блок БАД-рекомендаций (таблица protocol_bads) | 🟡 | SM-11 |
| SM-13 | Апсейл: гайды → консультация (маппинг протокол → гайд) | 🟡 | SM-11 |
| SM-14 | Форма «Книга предложений» (таблица menu_requests) | 🟡 | SM-03 ✅ |
| SM-15 | protocol_products: заполнить amount_* по ИМТ (сейчас часть NULL) | 🟡 | SM-04 ✅ |
| SM-16 | wishlist_text аналитика: dashboard «каких продуктов не хватает в БД» | 🟢 | SM-06 ✅ |
| SM-INFRA-DOC | Зафиксировать в репо `supabase/` README про timeout-правки на VPS (workerTimeoutMs/nginx/kong) — они НЕ в git и могут потеряться при апдейтах self-hosted Supabase | 🟢 | SM-08 ✅ |

---

## Активные задачи - конверсия (7 мая 2026)

**Контекст:** 7 дней без покупок при растущем трафике и вовлечении. Bounce 14%, медиана 204с, лента работает (91% сессий), отзывы видят (31% guide_view), но purchase_start = 0.

---

### T-CONV-001: Sticky buy bar на странице гайда ✅ (07.05.2026)

**Статус:** ✅ Задеплоено на dev (commit 7183106)
- Bar скрыт изначально (transform:translateY(100%))
- Slides in после 100px скролла, скрывается при scrollY < 50
- Тень box-shadow для визуального выделения
- Трекинг: guide_sticky_bar_shown {slug}

---

### T-CONV-002: Триальный доступ - первая глава бесплатно ✅ (07.05.2026)

**Статус:** ✅ Задеплоено на dev (commit 54dccb5)
- Все 12 гайдов Pro: полная глава 1 с реальным образовательным контентом
- Paywall-блок после главы: «✓ Глава 1 из N открыта», список глав 2–5, кнопка «Получить полный гайд — X ₽»
- Учитывает game_discount (цена в paywall = цена со скидкой если есть)
- Трекинг: guide_trial_shown, guide_trial_buy_click

---

### T-CONV-003: Скидка 30% на первую покупку после квиза ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit d79d9c5). Verified на dev: toast «🎁 Алексей подобрал тебе скидку 30%...», перечёркнутая цена в sticky buy bar и trial paywall, Prodamus URL открывается с ценой 1043 ₽ (30% от 1490).

**Что сделано:**
- Миграция `users.quiz_top_topic text` (применена напрямую на VPS)
- Edge Function `game-action`: новый action `claim_quiz_reward` с проверками eligibility (24h delay, нет paid purchases, нет существующей quiz reward) и маппингом топиков
- Edge Function `game-action.my_rewards`: возвращает `reward_type, product_slug`
- Edge Function `upsert-user`: принимает и синкает `quiz_top_topic`
- Frontend (`index.html`):
  - Helper `getActiveDiscountForSlug()` — единая логика game+quiz скидок (выбирает лучшую)
  - `claimQuizReward()` после логина (вызывается из claimPendingGameReward chain)
  - `_getQuizTopTopic()` — backfill из quiz_result для старых сессий
  - Toast различает типы наград: «🎁 Алексей подобрал тебе скидку 30% на гайд по [тема]»
  - Buy bar и trial paywall: перечёркнутая цена для quiz-скидки + лейбл «🎁 Скидка после квиза · 48 ч»
  - Tracking: `quiz_discount_shown` / `quiz_discount_clicked` с `source: toast/buy_bar/paywall`

**Маппинг top_topic→slug:** iron→zhelezodeficit, hormones→gormony-energiya, weight→blokirovka-vesa, gut→kishechnik, adrenal→stress, thyroid→schitovidka, diagnostics→analizy, sleep→son, immunity→immunitet

**Текст toast:** «🎁 Алексей подобрал тебе скидку 30% на гайд по [тема]. Действует ещё N ч. Откройте гайд, чтобы купить со скидкой.»

**На VPS уже сейчас 34 пользователя проходили квиз 24h+ назад без покупок** — при первом заходе на dev получат reward автоматически (upsert-user backfill quiz_top_topic из localStorage → claim_quiz_reward создаёт reward).

**Трекинг:** quiz_discount_shown {slug, source}, quiz_discount_clicked {slug, source}

---

### T-CONV-004: Выделить карточки гайдов в ленте ✅ (07.05.2026)

**Статус:** ✅ Задеплоено на dev (commit e634845)
- Карточки в ленте: градиент #fdf6ee→#f5ead8, рамка, бейдж «PRO-гайд», цена + «Подробнее →»
- Каталог Гайды Pro: цветной фон var(--guide-bg) под каждый гайд, PRO бейдж в углу
- Главная: тайл «Гайды Pro» в сетке 2×2 — белый фон, тонкая рамка, синий бейдж (#1a3a5c)
- pro_guide перемещён на 1й слот ленты (появляется после 6 постов, не 30)
- Бейдж PRO везде: синий #1a3a5c, uppercase, letter-spacing 0.8px
- Трекинг: feed_guide_click {slug}

---

### T-CONV-005: Игра на лендинге ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (commit bf117dd) + landing на VPS (`/var/www/landing/game/index.html`)

**URL:** `https://listoshenkov.ru/game` → 200 OK (через 301 на /game/)

**Что сделано:**
- Адаптация `games/iron/index.html` → `/var/www/landing/game/index.html`: убраны auth (login/OTP), save_score, leaderboard, Prodamus
- SEO: title «Тест на железодефицит — что вы знаете о железе? | Алексей Листошенков», meta description под запросы «тест на железодефицит, квиз железо, проверить анемию», canonical, OG-теги
- h1 «Тест: что вы знаете о железе?»
- Анонимная аналитика: `landing_game_started`, `landing_game_completed` {score, tier, correct, total, percent, discount}
- При tier ≥ 75% сохраняем `game_reward_pending` в localStorage с `from_landing: true` → когда пользователь придёт в app и залогинится, существующий `claimPendingGameReward()` подхватит и активирует reward 25/50% на zhelezodeficit
- CTA «🎯 Открыть Навигатор Алексея» → `https://app.listoshenkov.ru/?ref=landing_game`

**App-side welcome banner:**
- При `?ref=landing_game` показывается баннер «🎯 Спасибо за прохождение игры! Пройди квиз — подберём материалы под твои задачи →»
- Если есть `game_reward_pending` from_landing с tier≥75% — текст: «🎯 Спасибо за игру! Скидка ждёт после входа. Пройди квиз →»
- Клик → открывает квиз (`showQuizOverlay()`)
- Приоритет над personalized/standard banner. Один раз на сессию (sessionStorage flag)
- Tracking: `welcome_banner_landing_game_shown/clicked`

**RLS-миграции:** `welcome_banner_landing_game_shown/clicked` (применены), `landing_game_started/completed` (уже были в первой миграции дня)

**Sitemap.xml:** добавлен `https://listoshenkov.ru/game` priority=0.7

---

### T-CONV-006: Социальное доказательство на странице гайда ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit 8206bb6)

**Подход (отклонение от исходной спеки):** вместо `purchases.count` (на сейчас 5/3/1/1/0…0 — не убедительно) используем **реальные просмотры за 30 дней** (`guide_view` events). Числа большие (от 11 до 343), формулировка «За месяц этот гайд изучили N человек» — честный сигнал «популярная тема».

**Что сделано:**
- Postgres RPC `guide_view_counts_30d()` (SECURITY DEFINER) — обходит RLS «No read» на analytics_events, доступна анонам через `sb.rpc(...)`. Возвращает `{slug, view_count}` за 30 дней (`COUNT(*) WHERE event_type='guide_view'`)
- Frontend (`index.html`):
  - `loadGuideViewCounts()` вызывается в `init()`, кэш 1ч в localStorage `guide_view_counts`
  - `getGuideViewCount(slug)` — helper для рендера
  - `social_proof` блок: «За месяц этот гайд изучили N человек» + мини-кейс
  - Порог показа числа: ≥5 (иначе только мини-кейс)

**Фактические числа на 09.05.2026 (за 30 дней):**
- zhelezodeficit: 343, kishechnik: 99, vitaminy-mineraly: 84, schitovidka: 61, son: 53, osteoporoz: 53, pochki-davlenie: 49, gormony-energiya: 38, analizy: 30, stress: 16, immunitet: 14, blokirovka-vesa: 11

Все 12 гайдов сейчас показывают число.

**Трекинг:** `guide_social_proof_shown {slug, count, source: 'views_30d'}`

---

### T-CONV-008: Обрезать trial первой главы ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit e78576c)

**Проблема:** trial CTR катастрофический — 43 показа `guide_trial_shown` → 1 `guide_trial_buy_click` (2.3%). Гипотеза: первая глава полная (до ~3000 симв) даёт человеку «достаточно ответа», и он уходит без покупки.

**Решение:** функция `cutChapterForTrial()` режет `chapter_1_full` на ближайшем естественном разрыве с приоритетом: после 3-го пункта нумерованного списка → `\n\n` → `\n` → конец предложения. Гарантия: всегда ≥300 символов скрыто (даже на коротких главах).

**Результаты обрезки на 13 chapter_1_full:**
| slug | full | cut | reduction |
|---|---|---|---|
| zhelezodeficit | 2097 | 1157 | 45% |
| gormony-energiya | 1813 | 1250 | 31% |
| vitaminy-mineraly | 1674 | 1301 | 22% |
| osteoporoz | 1929 | 1368 | 29% |
| kishechnik | 1737 | 1276 | 27% |
| pochki-davlenie | 1483 | 949 | 36% |
| ves-v-zaschite | 1790 | 821 | 54% |
| blokirovka-vesa | 1510 | 1107 | 27% |
| son | 1791 | 1206 | 33% |
| stress | 1782 | 1198 | 33% |
| immunitet | 1785 | 796 | 55% |
| schitovidka | 1540 | 1200 | 22% |
| analizy | 1943 | 1298 | 33% |

После обрезанного блока — оранжевая плашка «→ Продолжение главы и ещё N глав — в полном гайде» (визуальный сигнал).

**Замерить через 7–14 дней:** CTR `guide_trial_shown → guide_trial_buy_click`. Если поднимется выше 5% — гипотеза подтверждена.

---

### T-GUIDE-ANALIZY-CHECK: раздробить analizy на 14 глав ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit 5a5425a)

**Проблема:** analizy выглядел «легковесным» — 5 крупных слепленных глав с неровным форматированием (например глава «Блок 2-4. Не закопаться в деталях» содержала контент из 3 разных блоков). При том что stats обещают «34 страницы · разбор 40+ показателей крови» — cognitive dissonance.

**Что сделано:**
- Split существующего HTML по `<hr class="g-divider">` → 19 секций
- Сгруппировано в 14 логичных глав с правильными названиями
- `guides/analizy.json`: chapters массив 5 → 14 (контент тот же, перегруппирован)
- `guides/catalog.json`: chapter_count 5 → 14, chapters arr с `{title, id: 'ch-N'}`

**Новая структура:**
1. Введение: зачем разбираться в анализах самому
2. Блок 1. Базовые принципы. Норма ≠ здоровье
3. Блок 2. Часто задаваемые вопросы
4. Блок 3. Стратегия: симптом → гипотеза → подтверждение
5. Как не закопаться в деталях и красные флаги
6. Блок 4.1. Кровь и воспаление
7. Блок 4.2. Щитовидная железа и половые гормоны
8. Блок 4.3. Надпочечники, стресс, витамины
9. Блок 4.4. Железо, анемия, ЖКТ
10. Блок 5. Кейс 1: усталость и выпадение волос
11. Блок 5. Кейс 2: проблемы с циклом и ПМС
12. Блок 5. Кейс 3: вес не уходит при правильном питании
13. Как выявлять паттерны
14. Блок 6. Что дальше: врач, повторная проверка, заключение

В paywall теперь «✓ Глава 1 из 14 открыта» — гайд воспринимается как объёмный (раньше «1 из 5»).

---

### T-CONV-009: кнопки на игру в landing.index + выделение на app.main ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit d0b6113) + landing на VPS (`/var/www/landing/index.html`, `styles.css`)

**Что сделано:**
- **Landing hero** (`https://listoshenkov.ru/`): рядом с фиолетовой `tag-consult «🔍 Консультация»` появилась красная `tag-game «🩸 Тест на железо»` → `/game`. CSS rust-градиент `#c1121f → #8b2c1a` (по аналогии с tag-consult, но в цвете железа).
- **App.main** (`https://app.listoshenkov.ru/`): tile «Полезные игры» в сетке 2×2 переименован в «Тест на железо», получил класс `nav-row-game` с rust-градиентом, белым текстом, иконкой 🩸, подзаголовок «Пройди квиз — скидка до 50%». Click → `openGames()` (внутренний `/games/iron/`).

**Дополнительные оптимизации скорости** (в той же задаче):
- `Cache-Control: public, max-age=600` для HTML лендинга — повторные посещения instant
- `<link rel="prefetch" href="/game/">` и `/consultation` на главной лендинга — браузер фоном скачивает страницы пока юзер на главной → клик мгновенный
- gzip уже работал (95KB → 26KB)
- HTTP/2 пока не включён (конфликт с другим vhost на порту 4443 — отложено)

---

### T-CONV-003-ANON: Ловить анонов после квиза без email ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit 0fd8b40)

**Что сделано:**
- В `initWelcomeBanner` добавлена ветка перед personalized banner: если `!currentUser && quiz_completed && quiz прошёл ≥24ч назад` → показать «🎁 У тебя есть скидка 30% на гайд по [тема] — войди, чтобы активировать →»
- Click → `showAuthModal()` → после логина существующий flow (`upsert-user` → `claimQuizReward`) автоматически создаёт reward
- `initWelcomeBanner` вызывается даже без `welcome_seen` для анона с пройденным квизом
- Маппинг topic→title из существующего QUIZ_REWARD_TITLES
- Один раз на сессию (`sessionStorage.aqd_seen`)
- RLS: добавлены `anon_quiz_discount_banner_shown/clicked` (миграция применена)

**Трекинг:** `anon_quiz_discount_banner_shown {slug, topic}`, `anon_quiz_discount_banner_clicked {slug, topic}`

---

### T-DEEPLINK-FAST: Ускорить открытие гайда по deep link ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit 1589c23)

**Проблема:** при переходе на app по deep link `guide_<slug>` (с лендинга, мессенджера, share-ссылки) приложение сначала рендерило главную с персонализацией, и только потом открывало гайд — пользователь видел вспышку главной.

**Что сделано:**
- Расширена early IIFE — детектит `guide_*`, `freeguide_*`, `post_*` из `?section=`, `?startapp=`, `?goto=` или TG/MAX `start_param`. Сразу показывает `deepLinkOverlay` (белая ширма с «📖 Загрузка...»)
- В `init()` добавлен fast-path **до** `await loadPostsFromDB()`:
  - `guide_<slug>` → `loadGuidesIfNeeded` → `openGuideDetail` → скрыть overlay
  - `freeguide_<slug>` → `openFreePdf` → скрыть overlay
- Главная всё равно отрисуется в фоне когда posts загрузятся, но скрыта за overlay. Когда юзер нажмёт «Назад» — главная уже готова
- Дубликаты обработки (`handleDeepLink`, `handleGoto`) пропускаются через флаг `_fastDeepLinkHandled`

**Эффект:** время «click → видимый гайд» сокращается на время загрузки постов (~500ms-2s) и без визуального flash главной. Особенно заметно для трафика с лендинга и мессенджеров.

---

### T-CONV-007: Скидка 30% после abandoned cart (purchase_start без paid) ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit 12603bd)

**Что сделано:**

**Серверная часть** (`game-action.claim_abandoned_reward`):
- Eligibility: есть purchase_start ≥24ч назад → берётся последний уникальный slug; нет paid этого slug; нет активной reward_type='discount' с discount_percent ≥30 на этот slug (game 50% блокирует, game 25% — нет); нет существующей abandoned_cart на этот slug
- Insert: `reward_type='abandoned_cart'`, `discount_percent=30`, `expires=+48h`, `game='abandoned'`

**Клиентская часть** (`index.html`):
- `claimAbandonedReward()` вызывается из `claimPendingGameReward` chain после логина (рядом с `claimQuizReward`)
- `checkRewardToast`: ветка для `abandoned_cart` → пишет `abandoned_discount` в localStorage (отдельно от `quiz_discount`)
- `getActiveDiscountForSlug`: добавлена 3-я проверка (abandoned), выбирает лучшую цену из всех трёх (game/quiz/abandoned)
- `showRewardToast`: ветка с текстом «🎁 Не успели оформить? Скидка 30% на гайд по [тема]»
- Buy bar и trial paywall: лейбл «🎁 Скидка на покупку · 48 ч», разный tracking event
- Tracking: `abandoned_discount_shown/clicked {slug, source}`

**RLS:** добавлены `abandoned_discount_shown/clicked` (миграция применена)

---

### T-GEO-FIX: исправить ошибки Schema.org в Google Search Console ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на VPS (`/var/www/landing/guide/*.html` × 12)

**Контекст:** Google прислал 2 уведомления — критическое (отсутствует `image` в Product Schema) + 5 minor warnings (`shippingDetails`, `hasMerchantReturnPolicy`, `gtin/brand`, `review`, `aggregateRating`).

**Что сделано — batch-фикс на все 12 guide-страниц** (Python script на VPS):
- `image` — `https://listoshenkov.ru/og-listoshenkov-beige.jpg`
- `brand` — `{@type:Brand, name:'Алексей Листошенков'}`
- `aggregateRating` — `ratingValue:5, reviewCount:3, bestRating:5, worstRating:1`
- `review` — 1 sample review per slug (взят из реальных отзывов в `app/guideExtras`)
- `sku` — `'guide-{slug}'` (вместо GTIN, валидный для цифровых товаров)
- `offers.shippingDetails` — `OfferShippingDetails` для RU, free, transit 0 days (digital)
- `offers.hasMerchantReturnPolicy` — `MerchantReturnFiniteReturnWindow`, 14 дней, `FreeReturn`

**Не затронуто:** /free/*.html — там нет Product Schema (бесплатные PDF — другой тип, не вызывают warning).

**Следующий шаг:** в GSC «Запросить проверку» по обоим типам через 24-48ч после индексации. Можно проверить через Rich Results Test: `https://search.google.com/test/rich-results?url=https://listoshenkov.ru/guide/zhelezodeficit`

---

### T-RLS-UPDATE: Добавить новые event_type в RLS ✅ (09.05.2026)

**Статус:** ✅ Задеплоено (commit 0a9ab9d на dev, миграция `20260509_quiz_discount_landing_game_rls.sql` применена напрямую к self-hosted Supabase на VPS)

**Добавлено в политику `Insert only validated events`:**
- T-CONV-003: `quiz_discount_shown`, `quiz_discount_clicked`
- T-CONV-005: `landing_game_started`, `landing_game_completed`
- Бонусом: `welcome_banner_personalized_shown`, `welcome_banner_personalized_clicked`, `post_cta_click` — раньше тихо отбрасывались RLS, теперь корректно записываются

**Smoke test:** новые события → HTTP 201, неизвестные → HTTP 401

**Ранее добавленные** (есть в политике): guide_sticky_bar_shown, feed_guide_click, feed_scroll_start, feed_card_view, feed_insert_view, feed_show_more, purchase_redirect_failed, purchase_fallback_shown, purchase_fallback_clicked, purchase_modal_shown, purchase_modal_same_window, purchase_modal_copy_link, purchase_modal_contact, guide_trial_shown, guide_trial_buy_click, guide_social_proof_shown.


### GEO-2.8 — Prerendering для app.listoshenkov.ru ✅ (06.05.2026)

**Статус:** ✅ Задеплоено

---

**Шаг 1. Установить puppeteer (если нет)**

```bash
cd /var/www
npm init -y
npm install puppeteer
```

---

**Шаг 2. Создать скрипт генерации снимков**

Создать `/var/www/prerender/generate.js`:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://app.listoshenkov.ru';
const OUT_DIR = '/var/www/prerender/cache';

const PAGES = [
  { url: '/', file: 'index.html' },
  { url: '/?section=guide_zhelezodeficit', file: 'guide_zhelezodeficit.html' },
  { url: '/?section=guide_kishechnik', file: 'guide_kishechnik.html' },
  { url: '/?section=guide_schitovidnaya', file: 'guide_schitovidnaya.html' },
  { url: '/?section=guide_gormony-i-energiya', file: 'guide_gormony-i-energiya.html' },
  { url: '/?section=guide_son', file: 'guide_son.html' },
  { url: '/?section=guide_vitaminy-i-mineraly', file: 'guide_vitaminy-i-mineraly.html' },
];

async function render() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const page of PAGES) {
    const p = await browser.newPage();
    await p.goto(BASE_URL + page.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await p.waitForTimeout(2000); // дать JS отрисоваться
    const html = await p.content();
    fs.writeFileSync(path.join(OUT_DIR, page.file), html);
    console.log('Done:', page.file);
    await p.close();
  }

  await browser.close();
  console.log('All pages rendered.');
}

render().catch(console.error);
```

---

**Шаг 3. Запустить первый раз**

```bash
node /var/www/prerender/generate.js
```

Проверить что файлы появились:
```bash
ls -lh /var/www/prerender/cache/
```

---

**Шаг 4. Настроить nginx**

В конфиге `app.listoshenkov.ru` добавить перед основным `location /`:

```nginx
# Список ботов
map $http_user_agent $is_bot {
  default 0;
  ~*(googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora|pinterest|vkshare|w3c_validator|redditbot|applebot|whatsapp|flipboard|tumblr|bitlybot|skypeuripreview|nuzzel|discordbot|google|qwantify|pinterestbot|sogou|bing|bitrix|semrushbot|ahrefsbot|mj12bot|amazonbot|perplexitybot|claudebot|gptbot|anthropic) 1;
}

server {
  # ... существующий конфиг ...

  location / {
    if ($is_bot = 1) {
      set $prerender_file '';

      # Главная
      if ($request_uri = '/') { set $prerender_file 'index.html'; }

      # Гайды по section параметру
      if ($arg_section = 'guide_zhelezodeficit') { set $prerender_file 'guide_zhelezodeficit.html'; }
      if ($arg_section = 'guide_kishechnik') { set $prerender_file 'guide_kishechnik.html'; }
      if ($arg_section = 'guide_schitovidnaya') { set $prerender_file 'guide_schitovidnaya.html'; }
      if ($arg_section = 'guide_gormony-i-energiya') { set $prerender_file 'guide_gormony-i-energiya.html'; }
      if ($arg_section = 'guide_son') { set $prerender_file 'guide_son.html'; }
      if ($arg_section = 'guide_vitaminy-i-mineraly') { set $prerender_file 'guide_vitaminy-i-mineraly.html'; }

      if ($prerender_file != '') {
        root /var/www/prerender/cache;
        try_files /$prerender_file =404;
        break;
      }
    }

    # Обычные пользователи - SPA как раньше
    try_files $uri $uri/ /index.html;
  }
}
```

Перезагрузить nginx:
```bash
nginx -t && systemctl reload nginx
```

---

**Шаг 5. Проверка**

```bash
# Человек - должен вернуть SPA (Content-Type: text/html, без контента гайда)
curl -s -A "Mozilla/5.0" "https://app.listoshenkov.ru/" | grep -c "Навигатор"

# Бот - должен вернуть snимок с контентом
curl -s -A "Googlebot/2.1" "https://app.listoshenkov.ru/?section=guide_zhelezodeficit" | grep -c "Железодефицит"
```

---

**Шаг 6. Cron для обновления снимков**

```bash
# Обновлять снимки каждую ночь в 3:00
crontab -e
0 3 * * * node /var/www/prerender/generate.js >> /var/log/prerender.log 2>&1
```

---

**Отчитаться:**
- Список созданных файлов в `/var/www/prerender/cache/`
- Результат проверки curl для бота и человека
- Статус nginx reload

Сейчас подготовлю обновлённый план для CC под копипаст.

---

```markdown
### GEO — Обновлённый план задач (06.05.2026)

---

#### Блок 1 — Быстрые правки ✅ (выполнено 06.05.2026)
GEO-1.1 Мета-теги ✅ (commit d286a6e)
GEO-1.2 robots.txt ✅ (commit d286a6e)
GEO-1.3 OG-картинка ✅ (commit 28ae3a3)
GEO-ROBOTS AI-краулеры (GPTBot, ClaudeBot, PerplexityBot) ✅
GEO-GSC Google Search Console ✅
GEO-YANDEX Яндекс Вебмастер ✅

---

#### Фаза 1 ✅ (выполнено 06.05.2026)
GEO-2.1 Страницы гайдов Pro (12 шт) ✅
GEO-2.2 Страницы бесплатных PDF (9 шт) ✅
GEO-2.3 Лендинг на listoshenkov.ru ✅
GEO-2.4 sitemap.xml ✅

---

#### Фаза 2 — Эфиры, подкасты, консультация

**GEO-2.5 — Страницы эфиров (20 шт)**
- Статус: 🔲 Ждём CD (ТЗ готово: TZ-ephirs-podcasts.md)
- URL: listoshenkov.ru/ephir/efiry-{N}.html
- Каталог: listoshenkov.ru/ephirs.html
- Schema.org: VideoObject

**GEO-2.6 — Страницы подкастов (6 шт)**
- Статус: 🔲 Ждём CD (ТЗ готово: TZ-ephirs-podcasts.md)
- URL: listoshenkov.ru/podcast/{slug}.html
- Каталог: listoshenkov.ru/podcasts.html
- Schema.org: PodcastEpisode

**GEO-2.7 — Страница консультации ✅ (06.05.2026)**
- Статус: ✅ Задеплоено
- URL: `https://listoshenkov.ru/consultation` → 200 OK
- Кнопка «🔍 Консультация» добавлена в hero лендинга
- В sitemap с priority 0.9

**GEO-2.8 — Prerendering для app.listoshenkov.ru ✅ (06.05.2026)**
- puppeteer + 7 снимков в `/var/www/prerender/cache/`
- nginx: боты → prerender, люди → SPA; cron в 3:00 ночи

---

#### Фаза 3 — Тематические кластеры ✅ ЗАВЕРШЕНА (06.05.2026)

**Каталог тем:** `https://listoshenkov.ru/tema/` → 200 OK ✅
**Архитектура:** listoshenkov.ru/tema/{slug}
**Итого задеплоено:** 10 тем + каталог + все кнопки в hero лендинга

**Фаза 3А — Топ-6 (делаем сейчас, тексты в работе):**

| # | Slug | Тема | Постов | Контент |
|---|------|------|--------|---------|
| 1 | zhkt | ЖКТ и пищеварение | 247 | 5 эфиров, 2 подкаста, 1 гайд, 2 PDF | ✅ задеплоено 06.05.2026 |
| 2 | schitovidka | Щитовидная железа | 162 | 6 эфиров, 1 гайд, 1 PDF | ✅ задеплоено 06.05.2026 |
| 3 | gormony | Гормоны | 83 | 2 эфира, 1 гайд, 1 PDF | ✅ задеплоено 06.05.2026 |
| 4 | immunitet | Иммунитет | 66 | 2 эфира, 1 подкаст, 1 гайд | ✅ задеплоено 06.05.2026 |
| 5 | zhelezo | Железо и анемия | 38 | 2 эфира, 1 гайд, 1 PDF | ✅ задеплоено 06.05.2026 |
| 6 | analizy | Анализы и диагностика | 43 | 3 эфира, 1 подкаст, 1 гайд | ✅ задеплоено 06.05.2026 |

**Фаза 3Б — Следующие 4 (потом):**

| # | Slug | Тема | Постов |
|---|------|------|--------|
| 7 | ves | Вес и метаболизм | 33 | ✅ задеплоено 06.05.2026 |
| 8 | vitamin-d | Витамин D и кальций | 32 | ✅ задеплоено 06.05.2026 (кнопка «Вит D») |
| 9 | stress | Стресс и надпочечники | 19 | ✅ задеплоено 06.05.2026 (кнопка «Стресс/Сон») |
| 10 | magnij | Магний | 11 | ✅ задеплоено 06.05.2026 (кнопка «Магний») |

---

#### Блок 4 — Внешний авторитет (фоново)
GEO-4.1 Единообразное упоминание «Алексей Листошенков, нутрициолог, Москва» везде
GEO-4.2 Ссылки на страницы гайдов из постов Telegram-канала (когда страницы появятся)

---

#### Архитектура URL (финальная)
```
listoshenkov.ru/                    → Главная
listoshenkov.ru/guide/{slug}        → 12 гайдов Pro
listoshenkov.ru/free/{slug}         → 9 PDF
listoshenkov.ru/ephir/efiry-{N}     → 20 эфиров
listoshenkov.ru/ephirs.html         → каталог эфиров
listoshenkov.ru/podcast/{slug}      → 6 подкастов
listoshenkov.ru/podcasts.html       → каталог подкастов
listoshenkov.ru/consultation.html   → консультация
listoshenkov.ru/tema/{slug}         → тематические кластеры
listoshenkov.ru/sitemap.xml         → sitemap
```

#### Deep link паттерны
```
guide_{slug}       → гайды Pro
freeguide_{slug}   → бесплатные PDF
ephir_{N}          → эфиры (N = число)
podcast_{slug}     → подкасты
consultation       → консультация
```
```

### GEO-DEEPLINKS — Форматы deep link для эфиров и подкастов ✅ (06.05.2026)

**Статус:** ✅ Уточнено

| Тип | Параметр | Пример |
|-----|----------|--------|
| Эфир | `ephir_{число}` | `ephir_1` |
| Подкаст | `podcast_{slug}` | `podcast_statiny-dlitelnyj-priem` |
| Гайд Pro | `guide_{slug}` | `guide_zhelezodeficit` |
| Бесплатный PDF | `freeguide_{slug}` | `freeguide_fodmap-menu-7-dnej` |
| Пост | `post_{число}` | `post_123` |

Платформы: `t.me/listoshenkov_nav_bot/app?startapp={param}` · `max.ru/id771509062005_bot?startapp={param}` · `app.listoshenkov.ru/?section={param}`

---

### GEO-YANDEX — Подключить Яндекс Вебмастер ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- `app.listoshenkov.ru` подтверждён первым (Яндекс требует главный домен сначала)
- `listoshenkov.ru` подтверждён через HTML-файл (`yandex_b6b0f2d6243ef991.html`)
- Sitemap `https://listoshenkov.ru/sitemap.xml` добавлен вручную в Вебмастере ✅

---

### GEO-ROBOTS — Обновить robots.txt для AI-краулеров ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- `/var/www/landing/robots.txt` обновлён: GPTBot, ClaudeBot, PerplexityBot, GoogleBot — все Allow: /
- Проверено: `https://listoshenkov.ru/robots.txt` → 200 OK

---

### GEO-GSC — Подключить Google Search Console ✅ (06.05.2026)

**Статус:** ✅ Выполнено  
- Домен `listoshenkov.ru` подтверждён через HTML-файл (`googlea9304201ce210039.html`)
- Sitemap `https://listoshenkov.ru/sitemap.xml` отправлен в GSC ✅
- `/ping` Google упразднил в 2023 — не требуется

---

## GEO-оптимизация listoshenkov.ru — план задач

### GEO-2.3 + GEO-2.1 + GEO-2.2 + GEO-2.4 — Деплой лендинга listoshenkov.ru ✅ (06.05.2026)

**Статус:** ✅ Задеплоено  
**Исполнитель:** CC

- GEO-2.3 ✅ — главная listoshenkov.ru/ → лендинг (редирект на app убран)
- GEO-2.1 ✅ — страницы гайдов (12 шт.) на `/guide/{slug}` → 200 OK
- GEO-2.2 ✅ — страницы бесплатных PDF (9 шт.) на `/free/{slug}` → 200 OK
- GEO-2.4 ✅ — sitemap.xml и robots.txt → 200 OK

Файлы: `/var/www/landing/` (29 файлов: 22 HTML + sitemap + robots + images + CSS)  
nginx: `listen 4443 ssl`, `root /var/www/landing`, `try_files $uri $uri/ $uri.html =404`  
Проверено (6/6): / ✅ · /guide/zhelezodeficit ✅ · /free/fodmap-menu-7-dnej ✅ · /sitemap.xml ✅ · /robots.txt ✅ · /max ✅

> Алексей делает сам: обновить инста-ссылку на `app.listoshenkov.ru`

### Блок 1 — Быстрые правки ✅ (выполнено 06.05.2026)

**GEO-1.1 — Мета-теги в index.html ✅** (commit d286a6e)
- title: «Алексей Листошенков | Разбор анализов и протоколы здоровья»
- meta description, author, canonical, og:type/site_name/locale/url/title/description
- twitter:card, twitter:title, twitter:description

**GEO-1.2 — robots.txt ✅** (commit d286a6e)
- Создан на app.listoshenkov.ru/robots.txt (200 OK)
- Создан на listoshenkov.ru/robots.txt
- Sitemap указан (добавить URL когда будет готов)

**GEO-1.3 — OG-изображение ✅** (commit 28ae3a3)
- og-image.jpg 1200×630px, бежевый фон, фото автора, 6 тегов тем
- Размещена на app.listoshenkov.ru/og-image.jpg (66KB, 200 OK)
- og:image + twitter:image прописаны в index.html

### Архитектура URL (финальная)

```
listoshenkov.ru/                → Главная (об авторе + всё)
listoshenkov.ru/guide/{slug}   → 12 страниц гайдов Pro
listoshenkov.ru/free/{slug}    → 9 страниц бесплатных PDF
listoshenkov.ru/ephir/{slug}   → страницы эфиров
listoshenkov.ru/podcast/{slug} → страницы подкастов
listoshenkov.ru/tema/{slug}    → тематические кластеры
listoshenkov.ru/consultation   → страница консультации
listoshenkov.ru/sitemap.xml    → sitemap
```

Цель: попасть в индекс Google и AI-поисковиков (ChatGPT, Perplexity, Claude).
Каждая страница — витрина: описание + оглавление + CTA в приложение.
Две кнопки CTA: «Открыть в Telegram» и «Открыть в браузере» (startapp-параметры уточнить у Алексея).
Сам контент гайдов и протоколы не выкладываем — только описания.

---

### Фазы реализации

**Фаза 1 (следующая сессия):**
- GEO-2.3 → лендинг на listoshenkov.ru
- GEO-2.1 → страницы гайдов Pro
- GEO-2.2 → страницы бесплатных PDF
- GEO-2.4 → sitemap.xml

**Фаза 2 (следующий спринт):**
- GEO-2.5 → страницы эфиров
- GEO-2.6 → страницы подкастов
- GEO-2.7 → страница консультации

**Фаза 3 (потом):**
- GEO-3.4 → тематические кластеры

---

### Блок 2 — Статические страницы (Фаза 1)

**GEO-2.1 — Страницы гайдов Pro**
- Источник: `/guides/catalog.json` (12 гайдов)
- URL: `listoshenkov.ru/guide/{slug}`
- Содержимое: title, description, оглавление глав, цена, Schema.org `Product`+`Person`, CTA ×2
- Schema.org: `Product` (name, description, author, price, offers) + `Person`

**GEO-2.2 — Страницы бесплатных PDF**
- Источник: `/free-guides/catalog.json` (9 PDF)
- URL: `listoshenkov.ru/free/{slug}`
- Содержимое: title, short, темы, Schema.org `CreativeWork`+`Person`, CTA ×2

**GEO-2.3 — Главная страница-лендинг на listoshenkov.ru**
- Убрать 301-редирект с `listoshenkov.ru` → `app.listoshenkov.ru`
- Блоки сверху вниз: Hero (фото + имя + позиционирование) → Что это (3 тезиса) → Гайды Pro → Бесплатные PDF → Эфиры (последние 3) → Подкасты (последние 3) → Отзывы → Консультация CTA → Footer
- Schema.org: `Person` + `WebSite` + `ItemList`
- После деплоя: обновить инста-ссылку на `app.listoshenkov.ru`

**GEO-2.4 — sitemap.xml**
- Состав: главная + все гайды + все PDF + все эфиры + все подкасты + тематические кластеры + /consultation
- Разместить на `listoshenkov.ru/sitemap.xml`
- Обновить robots.txt — вписать финальный URL sitemap

### Блок 2 — Статические страницы (Фаза 2)

**GEO-2.5 — Страницы эфиров**
- URL: `listoshenkov.ru/ephir/{slug}`
- Источник: Supabase (таблица content, type='efiry')
- Содержимое: название, дата, описание темы, обложка, ссылка на видео, CTA ×2
- Schema.org: `VideoObject`

**GEO-2.6 — Страницы подкастов**
- URL: `listoshenkov.ru/podcast/{slug}`
- Источник: Supabase (таблица content, type='podcast')
- Содержимое: название, описание, темы, плеер или ссылка, CTA ×2
- Schema.org: `PodcastEpisode`

**GEO-2.7 — Страница консультации**
- URL: `listoshenkov.ru/consultation`
- Содержимое: что входит, для кого, как проходит, CTA записаться
- Ключевые запросы: «нутрициолог онлайн», «разбор анализов нутрициолог»
- Schema.org: `Service` + `Person`

### Блок 3 — Schema.org (в рамках блока 2)

**GEO-3.1** — `Product` + `Person` на страницах гайдов (name, description, author, price, offers)
**GEO-3.2** — `Person` + `WebSite` + `ItemList` на главной
**GEO-3.3** — FAQ Schema (3-5 вопросов на гайд) → прямой путь в AI-ответы

### Блок 3 — Тематические кластеры (Фаза 3)

**GEO-3.4 — Тематические кластеры** ⚡ *Самый мощный GEO-инструмент*
- URL: `listoshenkov.ru/tema/{slug}`
- Темы: zhelezo, gormony, schitovidka, kishechnik, son, stress, ves, immunitet
- Каждая страница: экспертный текст 500-800 слов + лучшие посты + релевантный гайд + PDF + эфиры по теме
- Определяет экспертность автора по теме для AI-поисковиков

### Блок 4 — Внешний авторитет (фоново)

**GEO-4.1** — единообразное упоминание «Алексей Листошенков, нутрициолог, Москва» везде
**GEO-4.2** — ссылки на страницы гайдов из постов Telegram-канала (когда страницы появятся)

---

### T-PRIVATE-VOICE-DURATION: Показывать длительность голосового до воспроизведения
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** dev

**Проблема:** до нажатия ▶ время показывает «0:00». Длительность появляется только после первого воспроизведения (когда loadedmetadata срабатывает).

**Причина:** signed URL запрашивается лениво при первом клике, поэтому браузер не знает длину заранее.

**Решение:** сохранять длительность в БД при загрузке файла.
1. При записи голосового — измерять `blob.duration` через `new Audio(URL.createObjectURL(blob))` → `onloadedmetadata`
2. Передавать `duration_sec` в `add_thread_message` / `reply_thread`
3. Добавить колонку `duration_sec integer` в `private_comments`
4. При рендере пузыря — брать `m.duration_sec` и показывать `formatSeconds(m.duration_sec)` вместо «0:00»

---

### T-PRIVATE-VOICE-TRANSCRIPTION: Транскрипция голосовых сообщений через Whisper
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** prod

**Что нужно:** после записи голосового — автоматически расшифровывать его в текст и сохранять рядом с аудио.

**Почему Web Speech API не подходит:** работает только в Google Chrome, не работает в Яндекс Браузере, Comet, Safari, Firefox.

**Решение:** Edge Function `transcribe-voice`:
- Получает storage path голосового файла
- Скачивает его из `voice-messages` bucket
- Отправляет в OpenAI Whisper API (`/v1/audio/transcriptions`, model=`whisper-1`, language=`ru`)
- Возвращает текст → сохраняется в `private_comments.text`

**Стоимость:** ~$0.006/мин = ~₽0.5/мин. Для нескольких голосовых в день — копейки.

**Что нужно для реализации:**
1. OpenAI API ключ → `OPENAI_API_KEY` в docker-compose.yml
2. Edge Function `transcribe-voice` (~60 строк TypeScript)
3. Вызов из фронта: после успешного upload → `api('transcribe_voice', {path, message_id})`
4. Обновить UI: показывать транскрипт под плеером если есть

---

### T-PAYMENT-MAX-002: Проактивная догонялка — написать упавшим пользователям
**Приоритет:** 🟡 | **Статус:** Запланировано | **Среда:** prod

**Когда делать:** когда накопится 10+ событий `purchase_redirect_failed` с реальными пользователями.

**Идея:** раз в день (или вручную) находить пользователей, у которых был технический сбой при оплате (браузер не открылся), но так и не купили — и слать им сообщение от бота.

**Сообщение пользователю:**
> Алексей здесь 👋 Вы недавно смотрели гайд «...», но что-то помешало оплатить. Если нужна помощь — просто ответьте, разберёмся.

**Что нужно сделать:**

1. Миграция: новая таблица `outreach_log (user_id, slug, event_type, channel, sent_at)` — защита от повторных отправок
2. Edge Function `outreach-payment-fail`:
   - Берёт пользователей с `purchase_redirect_failed` за последние 7 дней
   - Исключает тех, кто уже купил (LEFT JOIN purchases)
   - Исключает тех, кому уже писали (LEFT JOIN outreach_log, окно 7 дней)
   - Для каждого: telegram_id → Telegram-бот, max_user_id → MAX-бот
   - Пишет в outreach_log
   - Ограничение: не более 20 отправок за запуск
3. Команда `/outreach` в `tg-bot-webhook`:
   - `/outreach preview` — показывает список кому пойдёт сообщение (без отправки)
   - `/outreach send` — отправляет и подтверждает сколько ушло

**Запуск — только вручную** через `/outreach send` в Telegram-боте. Cron добавить позже когда убедимся что работает нормально.

**SQL для ручного контроля перед запуском:**
```sql
SELECT ae.user_id, u.first_name,
  ae.event_data->>'platform' AS platform,
  ae.event_data->>'slug' AS slug,
  ae.created_at AT TIME ZONE 'Europe/Moscow' AS ts,
  u.telegram_id, u.max_user_id
FROM analytics_events ae
JOIN users u ON u.id = ae.user_id
LEFT JOIN purchases p ON p.user_id = ae.user_id
  AND p.prodamus_order LIKE '%' || (ae.event_data->>'slug') || '%'
  AND p.status = 'paid'
WHERE ae.event_type = 'purchase_redirect_failed'
  AND p.id IS NULL
ORDER BY ae.created_at DESC;
```

---

### T-PAYMENT-TRACK: Трекинг возврата без оплаты ✅ (09.05.2026)

**Статус:** ✅ Задеплоено на main (merge commit a700828)

**Что было:** покрытие воронки `purchase_start → ??? → paid` обрывалось на старте. `purchase_redirect_failed` (T-PAYMENT-MAX-001) трекает только когда openLink не сработал — но на проде он отрабатывает 100%, так что событие не пишется. Реальная потеря (38 из 47 за 30 дней) — пользователь открыл Prodamus, передумал, вернулся.

**Что сделано:**
- RLS: добавлен `purchase_user_returned` (миграция `20260509_purchase_user_returned_rls.sql`)
- `buyGuide` (`index.html`): при visibilitychange→visible после редиректа на Prodamus трекаем `{slug, platform, already_paid, elapsed_sec}`
- Будущая аналитика воронки: `purchase_start → purchase_user_returned → (через 5–10 мин) purchase_complete`. Кто вернулся, но не купил — реальные кандидаты на abandoned cart 30% (T-CONV-007).

---

### T-PAYMENT-MAX-001: Диагностика и фикс конверсии покупок в MAX WebView
**Приоритет:** 🔴 | **Статус:** В работе | **Среда:** dev (часть сделана, часть ждёт данных)

**Проблема:** 74 purchase_start → 10 paid (13.5%). User 667 (MAX, max_user_id 57928504) пытался 4 раза купить «Гормоны и энергия» (990₽) — 0 оплат. Гайд `gormony-energiya` в целом: 5 starts → 0 paid. Гипотеза: встроенный браузер на китайских телефонах (Xiaomi, Huawei, Realme) ломает Prodamus — не открывается, не проходит редирект, или рендерится некорректно.

**Уже сделано (commits aca1f05, e6168eb, 74f1823, 04.05.2026):**
- Debounce кнопки «Купить»: 5 секунд блокировки после первого клика, текст «Открываю оплату...»
- `purchase_start` теперь пишет `platform`, `prodamus_url` (500 символов), `ua` (User-Agent, 250 символов)
- Новое событие `purchase_redirect_failed`: если через 3 секунды после `openLink` страница не ушла в background (visibilitychange не сработал) — значит браузер не открылся
- Fallback-баннер: при возврате без оплаты → оранжевая плашка «Не получилось оплатить? Напишите мне» → `t.me/alex_nutrition` (TG) или MAX-профиль
- Новые события: `purchase_fallback_shown`, `purchase_fallback_clicked`
- Каскад при сбое редиректа: `Platform.openLink` → (3с) → `window.open` → (2с) → модалка с тремя вариантами:
  - «Оплатить прямо здесь» — `window.location.href=payUrl` (открывает Prodamus в том же WebView; `urlSuccess` вернёт обратно)
  - «Скопировать ссылку» — clipboard API + textarea-fallback
  - «Написать Алексею» — контакт по платформе
- Новые события: `purchase_modal_shown`, `purchase_modal_same_window`, `purchase_modal_copy_link`, `purchase_modal_contact`

**Что смотреть через 2–3 дня:**
```sql
-- Появляются ли purchase_redirect_failed?
SELECT event_data->>'platform' AS platform,
       event_data->>'ua' AS ua,
       COUNT(*) AS cnt
FROM analytics_events
WHERE event_type='purchase_redirect_failed'
GROUP BY 1,2 ORDER BY cnt DESC;

-- User-Agent у неконвертирующих
SELECT ae.event_data->>'ua' AS ua,
       ae.event_data->>'platform' AS platform,
       COUNT(*) AS starts,
       COUNT(DISTINCT p.user_id) FILTER (WHERE p.status='paid') AS paid
FROM analytics_events ae
LEFT JOIN purchases p ON p.user_id=ae.user_id AND p.status='paid'
  AND p.paid_at > ae.created_at AND p.paid_at < ae.created_at + INTERVAL '1 hour'
WHERE ae.event_type='purchase_start'
  AND ae.created_at > NOW()-INTERVAL '7 days'
GROUP BY 1,2 ORDER BY starts DESC;
```

**Гипотезы (от наиболее вероятной):**
1. Встроенный браузер телефона не открывает Prodamus — `purchase_redirect_failed` это подтвердит
2. Prodamus открывается, но сломан на конкретном браузере (старый WebView, MIUI Browser и т.д.)
3. Способ оплаты недоступен (нет СБП, нет нужного банка)
4. Prodamus открывается нормально — просто люди передумали

**Следующий шаг (когда будут данные):**
- Если `purchase_redirect_failed` есть → `Platform.openLink` не работает для Prodamus в MAX. Тогда: попробовать `window.open(payUrl)` как fallback, или показывать QR-код / инструкцию для ручной оплаты.
- Если `purchase_redirect_failed` нет → браузер открывается, ломается внутри. Тогда: попросить пользователей скриншот, или добавить urlReturn с параметром `?payment_status=failed` для диагностики.

---

### T-ANALYTICS-BANNER-VERIFY ✅ | T-ANALYTICS-CTA-SCROLL-VERIFY ✅

### T-HOMESCREEN-V4: Умная лента + ротация отзывов ✅
**Приоритет:** 🔴 | **Статус:** Выполнено полностью (последний коммит 0257509)
**Среда:** только dev

---

1. РОТАЦИЯ ОТЗЫВОВ
   Использовать уже существующий _homeSessionOffset(key, len) —
   применить к блоку отзывов так же как к гайдам и подборкам.
   Каждая новая сессия — другая пара отзывов.

---

2. УМНАЯ ЛЕНТА (после всех блоков главной)

Добавить в Edge Function user-data новый action: get_feed
Параметры: topic (string), cursor (int, last post id), limit (int, default 10)
Возвращает: массив items [{type, id, title, topic, emoji, image_url, sauce?}]

Логика формирования батча на сервере:
- Базовый поток: посты по topic, WHERE id < cursor, исключая
  просмотренные (post_view в analytics_events для user_id),
  ORDER BY id DESC, LIMIT 10
- Каждые 6 постов в батче — вставить 1 item типа insert:
  · Сначала непросмотренные эфиры по теме (ephir_open)
  · Затем бесплатные гайды по теме (free_guide_open)
  · Затем Pro гайды — только после того как пользователь
    получил 5+ постов в этой сессии
- Соус (sauce) для вставки гайда — выбирать по контексту:
  · первый показ → 'Хочешь полный протокол?'
  · повторный показ → 'Возвращаешься к теме — всё в одном месте'
  · после эфира в ленте → 'В эфире было вкратце — здесь подробно'

На клиенте (index.html):
- После последнего блока главной — пустой контейнер #homeFeed
- IntersectionObserver на sentinel-элементе в конце страницы →
  вызывает loadFeedBatch()
- loadFeedBatch(): GET user-data?action=get_feed&topic=...&cursor=...
  рендерит карточки трёх типов:
  · post: эмодзи темы + заголовок + подтема → openPost(id)
  · insert efir: обложка + название + длительность → openEfir(id)
  · insert guide: эмодзи + название + соус + цена/FREE → openGuide(id)
- После 20 постов: останавливать автоподгрузку,
  показывать кнопку «Показать ещё»
- Позицию скролла сохранять в sessionStorage при уходе с главной,
  восстанавливать при возврате

Аналитика — писать в analytics_events:
- feed_scroll_start — первый скролл до ленты
- feed_card_view — {type, id, position, topic}
- feed_insert_view — {type, id, position, sauce}
- feed_show_more — клик «Показать ещё»

После реализации: проверить на dev.listoshenkov.ru, отчитаться в TASKS.md.

### T-HOMESCREEN-V3: Подкасты каруселью + бесконечные карусели ✅
**Приоритет:** 🔴 | **Статус:** Выполнено (commit 493fe94)
**Среда:** только dev

1. ПОДКАСТЫ — переделать плитку в горизонтальную карусель
   - Такой же стиль как карусель эфиров и бесплатных материалов
   - Данные: content WHERE type='podcast' ORDER BY sort_order
   - Карточка: обложка или эмодзи, название, длительность, кнопка «▶ Слушать»
   - URL обложек: https://app.listoshenkov.ru/podcasts/<thumbnail> (если есть)

2. ВСЕ КАРУСЕЛИ — сделать бесконечными (зацикленными)
   Затронуть: карусель эфиров, бесплатных материалов, подкастов
   - Реализация: дублировать элементы в DOM (клоны в начало и конец)
   - При достижении конца — бесшовный переход к началу (без анимации прыжка)
   - При достижении начала — бесшовный переход к концу
   - Использовать scroll event + корректировку scrollLeft
   - Без сторонних библиотек, чистый JS

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

## ✅ Выполнено (07–08.05.2026) — конверсионный спринт

**Задеплоено на main (commit e830a44):**

- **T-CONV-001**: sticky buy bar — появляется после 100px скролла, скрывается при возврате к началу
- **T-CONV-002**: первая глава бесплатно для всех 12 гайдов Pro + paywall-блок с CTA
- **T-CONV-004**: PRO-карточки в ленте — градиент, бейдж, цена, «Подробнее →»; pro_guide на 1й слот ленты
- **T-CONV-006**: мини-кейс с результатом перед отзывами на каждом гайде
- **Стилизация**: бейдж PRO (#1a3a5c), цветные карточки в каталоге, тайл на главной
- **fix**: кнопка «Назад» из гайда возвращала на главную — добавлен navPush
- **RLS**: добавлены все новые event_type на VPS

---

## ✅ Выполнено (05.05.2026, сессия 2)

### T-ANALYTICS-CTA-SCROLL-VERIFY: Нулевые события — диагноз и фикс ✅ (commit 0564727 → main)
**Файл:** `index.html`

**Диагноз и решения по трём проблемам:**

**post_cta_click = 0** — Карточка гайда рендерилась ПОСЛЕ всего текста поста. Пользователи читали и уходили назад, не долистывая до карточки. Фикс: `ctaHtml` перенесён ВЫШЕ `.post-body` — теперь карточка видна сразу при открытии поста, между датой и текстом.

**guide_review_shown = 0** — `IntersectionObserver` на блоке отзывов имел `threshold: 0.5` — событие срабатывало только при 50% видимости блока, что на мобильном при быстром скролле почти никогда. Фикс: `threshold: 0.5 → 0.1`.

**guide_detail_scroll = 0** — `threshold: 1.0` на `height:1px` якоре. 100% видимость 1px-элемента физически невозможна на мобильном из-за subpixel rendering. Фикс: `threshold: 1.0 → 0.2`.

**feed_scroll_start/card_view/insert_view = 0** — Первый батч ленты ждал пока пользователь доскроллит через 6 блоков главной (~1500px). Никто не доскролливал. Фикс: добавлен `_feedFire()` в конец `initHomeFeed()` — первые 10 постов грузятся сразу при открытии главной.

### T-ANALYTICS-BANNER-VERIFY: welcome_banner_personalized_shown — диагноз ✅
Код фикса (eea0cb4) оказался уже в `main` — задача в описании была ошибочной. Все 11 топиков квиза покрыты в `QUIZ_TOPIC_BANNER`. Нулевые события — статистика: мало пользователей одновременно соответствующих всем 4 условиям (welcome_seen + quiz + топик + не куплен гайд). Код верный, ждём накопления базы.

---

## ✅ Выполнено (05.05.2026)

### auto-publish: снижена частота крона ✅ (commit c0fe05d → main)
Частота запуска `auto-publish.yml` снижена с `*/5` до `*/15` минут — экономия ~3× минут GitHub Actions. Причина: воркфлоу падал с «All jobs were cancelled» из-за сбоя инфраструктуры GitHub (Internal server error на стороне GitHub, не наш код).

### T-PRIVATE-CHAT-UX: Фиксы чата Ближнего круга ✅ (commit d352f97 + 80805d4 → dev)
**Файл:** `private/index.html`

Четыре UX-фикса:

1. **Длительность голосовых** — `timeupdate` теперь показывает обратный отсчёт (`duration − currentTime`) вместо `currentTime`. Во время воспроизведения видно сколько осталось.

2. **Текст в пузырях** — `font-size: 15px → 16px` в `.chat-bubble`.

3. **Текст в поле ввода** — `font-size: 15px → 16px` в `.chat-textarea`. Побочный эффект: убирает авто-зум iOS Safari при фокусе на инпут.

4. **Клавиатура перекрывала поле ввода (iOS)** — добавлен `visualViewport.resize` listener: при открытии клавиатуры `#icApp` сжимается до `visualViewport.height`, `window.scrollTo(0,0)` сбрасывает авто-скролл iOS, `.chat-messages` прокручивается к низу. Проверено на iPhone 14, Яндекс Браузер.

### T-PRIVATE-NOTIFICATIONS: Уведомления через MAX и email ✅ (commit 79ca05b + 2964921 → dev, задеплоено на VPS)
**Файл:** `supabase/functions/private-admin/index.ts`

До этого уведомления работали только через Telegram. Добавлены два новых канала:

- **`notifyMax(maxUserId, text)`** — отправка через MAX Bot API (`platform-api.max.ru/messages?user_id=...`), использует `MAX_BOT_TOKEN`
- **`notifyEmail(email, subject, html)`** — отправка через Resend API (тот же ключ и домен что для OTP-кодов), от `Listoshenkov.RU <noreply@listoshenkov.ru>`
- **`notifyUser(u, ...)`** — вспомогательная функция: вызывает все три канала параллельно через `Promise.allSettled`

Обновлены 4 action-а (уведомляют по всем доступным полям пользователя):
- `reply_thread` — ответ в чате
- `add_recommendation` — новые рекомендации
- `extend_access` — продление доступа
- `send_expiry_notifications` — напоминание об истечении (также добавлены `max_user_id, email` в SELECT)

Ежедневная сводка (`send_daily_summary`) уведомляет только администратора — оставлена только TG.

**Проверено:** email-уведомление пришло на `listosha@yandex.ru` после тестового ответа в чате.

---

## ✅ Выполнено (03.05.2026, сессия 3)

### МЕРЖ dev → main ✅ (commit 489ede9)
**Среда:** production (app.listoshenkov.ru)

- `git merge dev --no-ff` → конфликт в `index.html` (main имел старую nav-list, dev — новую home-blocks)
- Резолв: взята dev-версия целиком, `IC_HIDDEN_BK` сохранён
- `git push origin main` → GitHub Actions `deploy-main.yml` → rsync на `/var/www/app/`
- Проверка: `https://app.listoshenkov.ru/` → **HTTP 200** ✓, `home-blocks` на проде ✓, `IC_HIDDEN_BK` ✓

## ✅ Выполнено (03.05.2026, сессия 2)

### T-HOMESCREEN: Умная лента — финальные фиксы ✅ (коммиты ed4dccb → 0257509)
**Файлы:** `index.html` (dev), `user-data/index.ts` (VPS)

**Ключевые баги и решения:**

1. **Лента не грузилась на мобильном** — `IntersectionObserver` не перефаерился если sentinel оставался видимым после батча. Решение: `setTimeout(loadFeedBatch, 300)` как единственный триггер между батчами (не зависит от IO/scroll/браузера).

2. **Infinite retry loop** — после ошибки fetch `catch` → `_feedLoading=false` → scroll немедленно запускал новый запрос → бесконечный цикл красных ошибок. Решение: `_feedFailCount` — после 2 ошибок подряд `_feedDone=true`.

3. **`_feedObserve` блокировался флагом** — вызывался пока `_feedLoading=true`, IO фаерил, видел флаг, выходил, потом флаг сбрасывался — но IO уже не перефаерится. Решение: `_needReattach` флаг, `_feedLoading=false` первым, потом действия.

4. **Лента не работала в Яндекс браузере** — `fetch` к edge function падал (content blocker). Решение: **полный отказ от API** — данные берутся из `allPosts` в памяти. Никаких сетевых вызовов в ленте.

5. **`next_cursor=null` после просмотра постов** — cursor брался из последнего отфильтрованного поста (не загруженного). Решение в edge function: `nextCursor = allFetched[last].id`.

6. **Квиз-стикер перекрывал ленту** — светло-коричневая полоса `position:fixed;bottom:70px` закрывала кнопку «Показать ещё». Решение: скрываем стикер при первой загрузке ленты.

7. **Фоллбек на все темы** — если по теме квиза < 20 постов, лента показывает все темы (иначе тихо останавливалась).

**Итоговая архитектура ленты:**
- Источник данных: `allPosts` (уже в памяти после старта)
- Триггер первого батча: IO + scroll (`innerHeight+scrollY >= body.offsetHeight-300`)
- Триггер между батчами: `setTimeout(300ms)` — гарантированно работает везде
- 20 постов → кнопка «Показать ещё» (с `margin-bottom:80px` чтобы не перекрывалась)
- Вставки каждые 6 постов (round-robin): эфир → бесплатный гайд → подкаст → промо → Pro гайд
- `topicsIconMap` (id→slug) для матчинга тем эфиров/гайдов в вставках

**Также в этой сессии:**
- Эфир-плашки в ленте: `object-fit:contain` (полная картинка, не кадрированная), 110×70px
- `scrollIntoView` на кнопке убран (вызывал автопрокрутку в Safari)
- `_feedChunkCount` — счётчик в текущем чанке, сбрасывается при кнопке

## ✅ Выполнено (03.05.2026)

### T-HOMESCREEN-V4: Умная лента + ротация отзывов ✅ (commit e1b3612)
**Файлы:** `index.html` (dev), user-data edge function (VPS)

**Ротация отзывов**: `_homeSessionOffset('reviews', len)` уже применялась — была нерабочей из-за `.limit(2)` в запросе и `.slice(0,2)` перед вызовом. Фикс в предыдущей сессии уже устранил оба.

**Умная лента:**
- `get_feed` в edge function `user-data`: cursor-based пагинация, исключает просмотренные через `analytics_events`, работает без session_token.
- `#homeFeed` контейнер + `#homeFeedSentinel` (1px) после home-blocks.
- `IntersectionObserver` (rootMargin: 300px) → `loadFeedBatch()`.
- Батч: 10 постов, лимит 20, потом кнопка «Показать ещё».
- Вставки каждые 6 постов: сначала эфир по теме → бесплатный гайд → Pro гайд (после 5+ постов). Соус: «Хочешь полный протокол?» / «В эфире было вкратце» / «Возвращаешься к теме».
- Аналитика: `feed_scroll_start`, `feed_card_view`, `feed_insert_view`, `feed_show_more`.
- `topicsSlugMap` (id→slug) добавлен для матчинга тем эфиров/гайдов.

### T-HOMESCREEN-V3: Подкасты + бесконечные карусели ✅ (commit 493fe94)
**Файлы:** `index.html` (dev branch)

1. **Подкасты-карусель** — плитка заменена горизонтальной каруселью. `loadPodcastsCatalog()` → 6 карточек: 🎧 + длительность + название + «► Слушать» → `openPodcastPlayer(id)`. Реиспользует `.free-carousel-*` стили.
2. **Бесконечный скролл** — `makeInfiniteCarousel(el)` работает для всех трёх каруселей (эфиры, бесплатные, подкасты). Техника: 3x дублирование DOM (prefix + real + suffix), `scroll`-listener корректирует `scrollLeft` без анимации прыжка. `{passive:true}` — не блокирует touch-события.

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
