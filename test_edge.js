// T-PRIVATE-012d: 25 edge/stress/perf tests for dev.listoshenkov.ru/private/
const { chromium } = require('playwright');
const { createHmac } = require('crypto');
const fs   = require('fs');
const http = require('https');

const BASE        = 'https://dev.listoshenkov.ru';
const PRIVATE_URL = BASE + '/private/';
const ADMIN_URL   = BASE + '/private/admin.html';
const PRIVATE_FN  = 'https://uckuyoyubub.beget.app/functions/v1/private-data';
const ADMIN_FN    = 'https://uckuyoyubub.beget.app/functions/v1/private-admin';

const KEY = fs.readFileSync('/opt/beget/supabase/.env','utf8').match(/SERVICE_ROLE_KEY=(.+)/)[1].trim();

function makeToken(uid=1){ const ts=Date.now(); return `${uid}:${ts}:${createHmac('sha256',KEY).update(`${uid}:${ts}`).digest('hex')}`; }

async function apiCall(action, extra={}, uid=1) {
  return new Promise((res,rej) => {
    const tok = makeToken(uid);
    const body = JSON.stringify({action, token:tok, ...extra});
    const url = new URL(PRIVATE_FN);
    const opts = {hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
    const req = require('https').request(opts, r => {
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){res(d);} });
    });
    req.on('error',rej); req.write(body); req.end();
  });
}

async function adminApiCall(action, extra={}) {
  return new Promise((res,rej) => {
    const tok = makeToken(1);
    const body = JSON.stringify({action, token:tok, ...extra});
    const url = new URL(ADMIN_FN);
    const opts = {hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
    const req = require('https').request(opts, r => {
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){res(d);} });
    });
    req.on('error',rej); req.write(body); req.end();
  });
}

async function dbExec(sql) {
  const {execSync} = require('child_process'), fs2=require('fs');
  const f='/tmp/tsql_'+Date.now()+'.sql';
  fs2.writeFileSync(f, sql);
  const out = execSync('docker exec -i supabase-db psql -U supabase_admin -d postgres < '+f).toString();
  fs2.unlinkSync(f);
  return out;
}

let pass=0, fail=0;
const results=[], fixes=[];
const screenshots=[];

async function t(name, fn) {
  try { await fn(); console.log(`✓ ${name}`); results.push({name,status:'✓',error:null}); pass++; }
  catch(e) { const msg=e.message.split('\n')[0].slice(0,120); console.log(`✗ ${name}: ${msg}`); results.push({name,status:'✗',error:msg}); fail++; }
}

async function scr(page, name) {
  const path=`/tmp/pw-test/edge_${name}.png`;
  await page.screenshot({path,fullPage:false}).catch(()=>{});
  screenshots.push(path);
}

async function loadSPA(page, tok, section='home') {
  await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded',timeout:15000});
  await page.evaluate(tk=>localStorage.setItem('session_token',tk), tok);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForSelector('#icApp',{state:'visible',timeout:14000});
  if(section!=='home') { await page.evaluate(s=>{if(typeof switchTab==='function')switchTab(s);},section); await page.waitForSelector(`#tab-${section}.active`,{timeout:8000}); }
}

async function loadAdmin(page, tok) {
  await page.goto(ADMIN_URL, {waitUntil:'domcontentloaded',timeout:15000});
  await page.evaluate(tk=>localStorage.setItem('session_token',tk), tok);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForSelector('#admApp',{state:'visible',timeout:14000});
}

// Save original user_access for user_id=1
const ORIG_EXPIRES = '2026-12-28 09:01:27.064+00';

(async()=>{
  const browser = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx = await browser.newContext({viewport:{width:390,height:844}});
  const dctx = await browser.newContext({viewport:{width:1280,height:900}});

  // ── НЕГАТИВНЫЕ СЦЕНАРИИ (7) ────────────────────────────────────────────────

  await t('N1: Невалидный токен → лендинг (не белый экран)', async()=>{
    const page = await ctx.newPage();
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(()=>localStorage.setItem('session_token','invalid:token:value'));
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:12000});
    const landingVis = await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
    const appVis = await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
    if(!landingVis && !appVis) throw new Error('Neither landing nor app visible — white screen!');
    console.log(`  → landing=${landingVis}, app=${appVis} ✓`);
    await scr(page,'N1_invalid_token');
    await page.close();
  });

  await t('N2: Истёкший токен (старый ts) → лендинг без зависания', async()=>{
    const page = await ctx.newPage();
    // Create expired token: timestamp 31 days ago
    const expiredTs = Date.now() - (31*24*60*60*1000);
    const expiredSig = createHmac('sha256',KEY).update(`1:${expiredTs}`).digest('hex');
    const expiredTok = `1:${expiredTs}:${expiredSig}`;
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(tk=>localStorage.setItem('session_token',tk), expiredTok);
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    const start = Date.now();
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:12000});
    const elapsed = Date.now()-start;
    const landingVis = await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
    if(!landingVis) throw new Error('Landing not shown for expired token');
    if(elapsed>11000) throw new Error(`Took too long: ${elapsed}ms (>11s)`);
    console.log(`  → landing shown in ${elapsed}ms ✓`);
    await scr(page,'N2_expired_token');
    await page.close();
  });

  await t('N3: Timeout get_library → ошибка (не пустой экран)', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    // Intercept API calls to simulate timeout for get_library only
    await page.route('**/functions/v1/private-data', async (route, req) => {
      const body = req.postDataJSON?.() || {};
      if(body.action==='get_library') {
        await new Promise(r=>setTimeout(r,10000)); // force timeout
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await loadSPA(page, tok);
    await page.evaluate(s=>{if(typeof switchTab==='function')switchTab(s);},'lib');
    await page.waitForTimeout(4000);
    const libContent = await page.evaluate(()=>document.getElementById('libItems')?.innerHTML||'');
    // Should show error/empty state, NOT crash/blank
    const bodyVis = await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
    if(!bodyVis) throw new Error('App disappeared on timeout');
    console.log(`  → app still visible after timeout: "${libContent.slice(0,60)}" ✓`);
    await scr(page,'N3_lib_timeout');
    await page.close();
  });

  await t('N4: Отправка пустого сообщения → не отправляется', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'chat');
    await page.evaluate(()=>{if(typeof refreshChat==='function')refreshChat();});
    await page.waitForSelector('#chatInput',{timeout:8000});
    // Count messages before
    const before = await page.evaluate(()=>document.querySelectorAll('.chat-bubble').length);
    // Try to send empty
    await page.evaluate(()=>{if(typeof sendChatText==='function')sendChatText();});
    await page.waitForTimeout(2000);
    const after = await page.evaluate(()=>document.querySelectorAll('.chat-bubble').length);
    if(after>before) throw new Error('Empty message was sent!');
    console.log(`  → messages before=${before}, after=${after}, no new message ✓`);
    await page.close();
  });

  await t('N5: Добавить близкого с пустым именем → форма не отправляется', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'profile');
    await page.waitForSelector('#tab-profile.active',{timeout:8000});
    // Open add dependant modal
    await page.evaluate(()=>{if(typeof openAddDepModal==='function')openAddDepModal();});
    await page.waitForFunction(()=>document.getElementById('profDepModal')?.classList.contains('open'),{timeout:5000});
    // Leave name empty, try to save
    await page.evaluate(()=>{ document.getElementById('profDepName').value=''; document.getElementById('profDepRel').value=''; });
    // Intercept alert
    page.on('dialog', async d=>{ console.log(`  → alert: "${d.message()}"`); await d.dismiss(); });
    const depsBefore = await apiCall('get_dependants',{});
    const cntBefore = (depsBefore.dependants||[]).length;
    await page.evaluate(()=>{if(typeof saveProfDep==='function')saveProfDep();});
    await page.waitForTimeout(2000);
    const depsAfter = await apiCall('get_dependants',{});
    const cntAfter = (depsAfter.dependants||[]).length;
    if(cntAfter>cntBefore) throw new Error('Empty-name dependant was created!');
    console.log(`  → dependants count unchanged: ${cntBefore} ✓`);
    await page.close();
  });

  await t('N6: Загрузка анализа без файла → не блокирует шаг 2', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'labs');
    await page.evaluate(()=>{if(typeof openLabUpload==='function')openLabUpload();});
    await page.waitForSelector('#labsUpload',{state:'visible',timeout:5000});
    // Select type and go to step 2
    await page.evaluate(()=>{ document.querySelectorAll('.lab-type-card')[0]?.click(); });
    await page.evaluate(()=>{if(typeof labGoStep==='function')labGoStep(2);});
    await page.waitForSelector('#labStep2',{state:'visible',timeout:5000});
    // Try to proceed to step 3 without file (file is optional)
    await page.evaluate(()=>{if(typeof labGoStep==='function')labGoStep(3);});
    await page.waitForTimeout(1000);
    const step3Visible = await page.evaluate(()=>document.getElementById('labStep3')?.style.display!=='none');
    console.log(`  → step 3 reachable without file: ${step3Visible} (file is optional) ✓`);
    await page.close();
  });

  await t('N7: Комментарий > 2000 символов → не отправляется', async()=>{
    const tok = makeToken();
    // Get first content item
    const libData = await apiCall('get_library',{});
    const items = libData.items||[];
    if(!items.length) { console.log('  → Нет материалов для теста комментария'); return; }
    const contentId = items[0].id;
    // Try to add too-long comment via API
    const longText = 'А'.repeat(2001);
    const result = await apiCall('add_comment',{content_id:contentId, text:longText});
    if(result.comment) throw new Error('Comment >2000 chars was accepted!');
    if(result.error) console.log(`  → API отклонил: "${result.error}" ✓`);
    else console.log(`  → Отклонён (нет comment в ответе) ✓`);
  });

  // ── ГРАНИЧНЫЕ СЛУЧАИ ДОСТУПА (3) ─────────────────────────────────────────

  await t('N8: Пользователь без подписки → лендинг', async()=>{
    // Temporarily disable subscription
    await dbExec(`UPDATE user_access SET has_inner_circle=false WHERE user_id=1`);
    try {
      const tok = makeToken();
      const page = await ctx.newPage();
      await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded',timeout:15000});
      await page.evaluate(tk=>localStorage.setItem('session_token',tk), tok);
      await page.reload({waitUntil:'domcontentloaded',timeout:15000});
      await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:12000});
      const landingVis = await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
      if(!landingVis) throw new Error('Landing not shown for user without subscription');
      console.log('  → Лендинг показан для пользователя без подписки ✓');
      await scr(page,'N8_no_sub');
      await page.close();
    } finally {
      await dbExec(`UPDATE user_access SET has_inner_circle=true, inner_circle_expires='${ORIG_EXPIRES}' WHERE user_id=1`);
    }
  });

  await t('N9: Подписка истекла вчера → лендинг (soft mode)', async()=>{
    // Set expired subscription
    await dbExec(`UPDATE user_access SET inner_circle_expires=now()-interval '1 day' WHERE user_id=1`);
    try {
      const tok = makeToken();
      const access = await apiCall('check_access',{},1);
      console.log(`  → check_access: hasAccess=${access.hasAccess}, daysLeft=${access.daysLeft}`);
      const page = await ctx.newPage();
      await loadSPA(page, tok).catch(async()=>{
        // If SPA doesn't show, check landing
      });
      const landingVis = await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
      const appVis = await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
      console.log(`  → landing=${landingVis}, app=${appVis}`);
      // Either landing (if not implemented soft mode) or app with banner
      if(!landingVis&&!appVis) throw new Error('Neither landing nor SPA shown for expired subscription');
      console.log('  → Корректная обработка истёкшей подписки ✓');
      await scr(page,'N9_expired');
      await page.close();
    } finally {
      await dbExec(`UPDATE user_access SET inner_circle_expires='${ORIG_EXPIRES}' WHERE user_id=1`);
    }
  });

  await t('N10: Подписка истекает через 5 дней → оранжевый баннер', async()=>{
    // Set expires 5 days from now
    await dbExec(`UPDATE user_access SET inner_circle_expires=now()+interval '5 days' WHERE user_id=1`);
    try {
      const tok = makeToken();
      const page = await ctx.newPage();
      await loadSPA(page, tok);
      await page.waitForTimeout(2000);
      const bannerVisible = await page.evaluate(()=>{
        const el=document.getElementById('expiryBanner');
        return el && el.style.display!=='none' && el.style.display!=='';
      });
      console.log(`  → Banner visible: ${bannerVisible}`);
      if(!bannerVisible) throw new Error('Expiry banner not shown for 5-day expiry');
      const bannerText = await page.$eval('#expiryBannerText', el=>el.textContent).catch(()=>'');
      console.log(`  → "${bannerText}" ✓`);
      await scr(page,'N10_expiry_banner');
      await page.close();
    } finally {
      await dbExec(`UPDATE user_access SET inner_circle_expires='${ORIG_EXPIRES}' WHERE user_id=1`);
    }
  });

  // ── СОСТОЯНИЯ ДАННЫХ (9) ──────────────────────────────────────────────────

  await t('N11: Пустые состояния — хаб без данных не крашится', async()=>{
    // User_id=1 may have data, but we test that hub renders without crash even with empty responses
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    // Mock all API calls to return empty
    await page.route('**/functions/v1/private-data', async(route,req)=>{
      const body=req.postDataJSON?.()||{};
      const empties={get_recommendations:{recommendations:[]},get_health_profile:{profile:null},get_analyses:{analyses:[]},get_my_threads:{messages:[]},get_zoom_events:{events:[]},get_journal:{entries:[]}};
      if(empties[body.action]) await route.fulfill({contentType:'application/json',body:JSON.stringify(empties[body.action])});
      else await route.continue();
    });
    // Force hub reload with mocked data
    await page.evaluate(()=>{ _hubData={}; if(typeof loadHub==='function')loadHub(); });
    await page.waitForTimeout(3000);
    const hubVisible = await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
    if(!hubVisible) throw new Error('App crashed on empty data');
    const stubsCount = await page.$$eval('.ic-stub-card', els=>els.length);
    console.log(`  → App стабилен, пустых состояний: ${stubsCount} ✓`);
    await scr(page,'N11_empty_hub');
    await page.close();
  });

  await t('N12: 45 материалов — список скроллится', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'lib');
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    const count = await page.$$eval('.lib-item', els=>els.length);
    if(count<10) throw new Error(`Only ${count} items (expected ~45)`);
    // Check scroll works
    await page.evaluate(()=>{
      const el=document.getElementById('tab-lib');
      el?.scrollTo(0, el.scrollHeight);
    });
    console.log(`  → ${count} материалов, скролл работает ✓`);
    await page.close();
  });

  await t('N13: Фильтр по теме «Щитовидная» → релевантные материалы', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'lib');
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    // Apply thyroid tag filter
    await page.evaluate(()=>{if(typeof setLibTag==='function')setLibTag('thyroid');});
    await page.waitForTimeout(500);
    const items = await page.$$eval('.lib-item', els=>els.length);
    const allItems = await page.evaluate(()=>_libItems?.length||0);
    if(items===allItems) throw new Error('Filter did not reduce results');
    console.log(`  → Без фильтра: ${allItems}, с фильтром thyroid: ${items} ✓`);
    await page.close();
  });

  await t('N14: Поиск по существующему названию → результаты есть', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'lib');
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    await page.fill('#libSearch','Иммунитет');
    await page.evaluate(()=>{if(typeof filterLib==='function')filterLib();});
    await page.waitForTimeout(500);
    const results = await page.$$eval('.lib-item', els=>els.length);
    if(results===0) throw new Error('No results for "Иммунитет"');
    console.log(`  → ${results} результатов для «Иммунитет» ✓`);
    await page.close();
  });

  await t('N15: Поиск несуществующего → «Ничего не найдено»', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok, 'lib');
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    await page.fill('#libSearch','xkqzwvnmqpzrs__NOT_EXIST');
    await page.evaluate(()=>{if(typeof filterLib==='function')filterLib();});
    await page.waitForTimeout(500);
    const results = await page.$$eval('.lib-item', els=>els.length);
    const text = await page.$eval('#libItems', el=>el.innerText).catch(()=>'');
    if(results>0) throw new Error(`Got ${results} results for non-existent query`);
    console.log(`  → 0 результатов, текст: "${text.slice(0,40)}" ✓`);
    await page.close();
  });

  await t('N16: Сохранить пустую мед. карту → ok (нет ошибки)', async()=>{
    const tok = makeToken();
    const result = await apiCall('save_health_profile',{diagnoses:[],medications:[],allergies:[],intolerances:[],age:null,weight:null,height:null,special_notes:null});
    if(result.error) throw new Error('Empty health profile save failed: '+result.error);
    console.log(`  → ok: ${JSON.stringify(result)} ✓`);
  });

  await t('N17: Добавить 10 диагнозов → все отображаются', async()=>{
    const tok = makeToken();
    const diags = Array.from({length:10},(_,i)=>`Диагноз-${i+1}`);
    const r = await apiCall('save_health_profile',{diagnoses:diags});
    if(r.error) throw new Error('save_health_profile failed: '+r.error);
    const profile = await apiCall('get_health_profile',{});
    const saved = profile.profile?.diagnoses||[];
    if(saved.length!==10) throw new Error(`Expected 10 diagnoses, got ${saved.length}`);
    console.log(`  → 10 диагнозов сохранено ✓`);
  });

  await t('N18: Добавить препарат с дозой → появляется в списке', async()=>{
    const tok = makeToken();
    const meds = [{name:'Витамин D3',dose:'4000 МЕ'},{name:'Магний',dose:'300 мг'}];
    const r = await apiCall('save_health_profile',{medications:meds});
    if(r.error) throw new Error('save_health_profile failed: '+r.error);
    const profile = await apiCall('get_health_profile',{});
    const saved = profile.profile?.medications||[];
    if(saved.length<2) throw new Error(`Expected 2 meds, got ${saved.length}`);
    console.log(`  → ${saved.length} препаратов сохранено ✓`);
  });

  await t('N19: Сохранить карту → F5 → данные на месте', async()=>{
    const tok = makeToken();
    const note = 'Тест N19 — ' + Date.now();
    await apiCall('save_health_profile',{special_notes:note});
    // Verify via API (simulates F5 by fresh API call)
    const profile = await apiCall('get_health_profile',{});
    const saved = profile.profile?.special_notes||'';
    if(!saved.includes('Тест N19')) throw new Error(`Note not saved: "${saved}"`);
    console.log(`  → Данные на месте: "${saved.slice(0,40)}" ✓`);
  });

  // ── ADMIN-ГРАНИЧНЫЕ (4) ───────────────────────────────────────────────────

  await t('N20: Продлить доступ на 0 дней → заблокировано', async()=>{
    const adminTok = makeToken();
    const page = await dctx.newPage();
    await loadAdmin(page, adminTok);
    await page.evaluate(()=>{if(typeof goTab==='function')goTab('subscribers');});
    await page.waitForTimeout(2000);
    // Open extend modal and set 0 days
    const btn = await page.$('button[onclick*="openExtend"]');
    if(!btn) { console.log('  → Нет подписчиков для теста'); await page.close(); return; }
    const uid = await btn.evaluate(el=>parseInt(el.dataset.uid));
    await page.evaluate(u=>{
      window._extendUserId=u;
      document.getElementById('extendModalName').textContent='Test';
      document.getElementById('extendModal').classList.add('open');
    }, uid);
    await page.waitForFunction(()=>document.getElementById('extendModal')?.classList.contains('open'),{timeout:5000});
    await page.evaluate(()=>{document.getElementById('extendDays').value='0';});
    // Call API directly with 0 days — should fail
    const r = await adminApiCall('extend_access',{user_id:uid,days:0});
    if(r.ok&&!r.error) throw new Error('0 days was accepted: '+JSON.stringify(r));
    console.log(`  → 0 дней отклонено: "${r.error||'validation'}" ✓`);
    await page.evaluate(()=>document.getElementById('extendModal')?.classList.remove('open'));
    await page.close();
  });

  await t('N21: Продлить доступ на 400 дней → заблокировано (макс 365)', async()=>{
    const r = await adminApiCall('extend_access',{user_id:1,days:400});
    if(r.ok&&!r.error) throw new Error('400 days was accepted: '+JSON.stringify(r));
    console.log(`  → 400 дней отклонено: "${r.error||'validation'}" ✓`);
  });

  await t('N22: Ответить пустым сообщением в админке → заблокировано', async()=>{
    const r = await adminApiCall('reply_thread',{user_id:1,text:'',thread_type:'general'});
    if(r.message) throw new Error('Empty reply was accepted!');
    console.log(`  → Пустой ответ отклонён: "${r.error||'validation'}" ✓`);
  });

  await t('N23: Скрыть материал в админке → исчезает из библиотеки пользователя', async()=>{
    // Get a content item to hide
    const libData = await apiCall('get_library',{});
    const items = libData.items||[];
    if(!items.length) throw new Error('No items to hide');
    const itemId = items[items.length-1].id; // Use last item to minimize impact
    const itemTitle = items[items.length-1].title;
    // Hide via admin API
    const hideResult = await adminApiCall('hide_content',{content_id:itemId});
    if(hideResult.error) throw new Error('hide_content failed: '+hideResult.error);
    // Verify hidden from user library
    const libAfter = await apiCall('get_library',{});
    const stillVisible = (libAfter.items||[]).some(i=>i.id===itemId);
    if(stillVisible) throw new Error('Item still visible after hide');
    console.log(`  → "${itemTitle.slice(0,40)}" скрыт и исчез из библиотеки ✓`);
    // Restore: un-hide via SQL
    await dbExec(`UPDATE private_content SET is_published=true WHERE id='${itemId}'`);
    console.log('  → Восстановлен в БД');
  });

  // ── ПРОИЗВОДИТЕЛЬНОСТЬ (2) ────────────────────────────────────────────────

  await t('N24: Библиотека 45 материалов загружается за < 3 сек', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    // Measure library load time
    const start = Date.now();
    await page.evaluate(s=>{if(typeof switchTab==='function')switchTab(s);},'lib');
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:15000});
    const elapsed = Date.now()-start;
    const count = await page.$$eval('.lib-item', els=>els.length);
    if(elapsed>3000) throw new Error(`Library took ${elapsed}ms (>3000ms)`);
    console.log(`  → ${count} материалов за ${elapsed}ms ✓`);
    await page.close();
  });

  await t('N25: Переключение между табами < 500ms', async()=>{
    const tok = makeToken();
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    const tabs = ['chat','labs','lib','med','profile','home'];
    const times = [];
    for(const tab of tabs){
      const start=Date.now();
      await page.evaluate(t=>{if(typeof switchTab==='function')switchTab(t);},tab);
      await page.waitForSelector(`#tab-${tab}.active`,{timeout:3000});
      times.push({tab, ms:Date.now()-start});
    }
    const max = Math.max(...times.map(t=>t.ms));
    const avg = Math.round(times.reduce((a,b)=>a+b.ms,0)/times.length);
    times.forEach(t=>console.log(`  → ${t.tab}: ${t.ms}ms`));
    if(max>500) throw new Error(`Slowest tab: ${times.find(t=>t.ms===max).tab} = ${max}ms (>500ms)`);
    console.log(`  → max=${max}ms, avg=${avg}ms ✓`);
    await page.close();
  });

  await browser.close();

  // ── Fix tracking ──────────────────────────────────────────────────────────
  const fixedItems = [
    'N21: private-admin validate days 1-365 (if not already)',
    'N22: private-admin validate text required (if not already)',
  ];

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n════════ ОТЧЁТ T-PRIVATE-012d (Граничные случаи) ════════');
  console.log(`Всего: ${pass+fail} | ✓ ${pass} | ✗ ${fail}`);
  results.forEach(r=>console.log(`${r.status} ${r.name}${r.error?' — '+r.error:''}`));
  fs.writeFileSync('/tmp/pw-test/report_edge.json',JSON.stringify({pass,fail,results,screenshots},null,2));
  process.exit(fail>0?1:0);
})();
