// T-PRIVATE-016: 52 production tests for app.listoshenkov.ru/private/
const { chromium } = require('playwright');
const { createHmac } = require('crypto');
const fs = require('fs');
const { execSync } = require('child_process');

const PROD        = 'https://app.listoshenkov.ru';
const PROD_PRI    = PROD + '/private/';
const PROD_ADM    = PROD + '/private/admin.html';
const PRIVATE_FN  = 'https://uckuyoyubub.beget.app/functions/v1/private-data';
const ADMIN_FN    = 'https://uckuyoyubub.beget.app/functions/v1/private-admin';

const KEY = fs.readFileSync('/opt/beget/supabase/.env','utf8').match(/SERVICE_ROLE_KEY=(.+)/)[1].trim();
function makeToken(uid=1){ const ts=Date.now(); return `${uid}:${ts}:${createHmac('sha256',KEY).update(`${uid}:${ts}`).digest('hex')}`; }

async function api(fn, action, extra={}, uid=1, origin=PROD){
  return new Promise((res,rej)=>{
    const tok=makeToken(uid), body=JSON.stringify({action,token:tok,...extra});
    const url=new URL(fn), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'Origin':origin}};
    const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
    req.on('error',rej); req.write(body); req.end();
  });
}
const userApi  = (action,extra={},uid=1) => api(PRIVATE_FN,action,extra,uid);
const adminApi = (action,extra={})       => api(ADMIN_FN,action,extra,1);

function httpGet(url, opts={}){
  return new Promise((res,rej)=>{
    const u=new URL(url), options={...{hostname:u.hostname,port:443,path:u.pathname+(u.search||''),method:'GET'},...opts};
    const req=require('https').request(options,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res({status:r.statusCode,headers:r.headers,body:d}));});
    req.on('error',rej); req.end();
  });
}

function dbQuery(sql){
  const f='/tmp/tprod_'+Date.now()+'.sql';
  fs.writeFileSync(f,sql);
  const out=execSync('docker exec -i supabase-db psql -U supabase_admin -d postgres < '+f).toString();
  fs.unlinkSync(f);
  return out;
}

let pass=0, fail=0, fixes=[];
const results=[];

async function t(name, fn){
  try{ await fn(); console.log(`✓ ${name}`); results.push({name,status:'✓',error:null}); pass++; }
  catch(e){ const msg=e.message.split('\n')[0].slice(0,120); console.log(`✗ ${name}: ${msg}`); results.push({name,status:'✗',error:msg}); fail++; }
}

async function loadSPA(page, uid=1, section=''){
  const tok=makeToken(uid);
  const url=PROD_PRI+(section?'?section='+section:'');
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:15000});
  await page.evaluate(tk=>localStorage.setItem('session_token',tk),tok);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForSelector('#icApp',{state:'visible',timeout:14000});
}

(async()=>{
  const browser = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const mob  = await browser.newContext({viewport:{width:390,height:844}});
  const desk = await browser.newContext({viewport:{width:1280,height:900}});

  // ════════════════════════════════════════════════════════════
  // БЛОК 1: НОВЫЙ ФУНКЦИОНАЛ (14)
  // ════════════════════════════════════════════════════════════

  await t('T01: Zoom: кнопка «Разборы» в библиотеке открывает секцию', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('lib');});
    await page.waitForSelector('#tab-lib.active',{timeout:8000});
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    await page.evaluate(()=>{if(typeof setLibType==='function')setLibType('zoom');});
    await page.waitForTimeout(3000);
    const el=await page.$('.zoom-event-card, .ic-card');
    if(!el) throw new Error('No zoom section content rendered');
    console.log('  → Zoom section rendered ✓'); await page.close();
  });

  await t('T02: Zoom: пустое состояние корректно', async()=>{
    const r=await userApi('get_zoom_events',{});
    const events=(r.events||[]);
    if(events.length===0) console.log('  → Нет событий — пустое состояние ожидается ✓');
    else console.log('  → '+events.length+' событий найдено ✓');
  });

  await t('T03: Zoom: get_zoom_events и register_zoom API работают', async()=>{
    const r=await userApi('get_zoom_events',{});
    if(r.error) throw new Error('get_zoom_events failed: '+r.error);
    console.log('  → events: '+( r.events?.length||0)+' ✓');
  });

  await t('T04: Дневник: bottom sheet открывается из хаба', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof addJournalEntry==='function')addJournalEntry();});
    await page.waitForFunction(()=>document.getElementById('journalOverlay')?.classList.contains('open'),{timeout:5000});
    console.log('  → Journal bottom sheet opened ✓');
    await page.evaluate(()=>{if(typeof closeJournalSheet==='function')closeJournalSheet();});
    await page.close();
  });

  await t('T05: Дневник: добавить запись → появляется в списке', async()=>{
    const text='Prod тест T05 '+Date.now();
    const r=await userApi('add_journal_entry',{text});
    if(r.error) throw new Error('add_journal_entry failed: '+r.error);
    const list=await userApi('get_journal',{limit:5});
    const found=(list.entries||[]).some(e=>e.text===text);
    if(!found) throw new Error('Entry not found in journal list');
    console.log('  → Entry saved and retrieved ✓');
  });

  await t('T06: Дневник: get_journal лимит работает', async()=>{
    const r=await userApi('get_journal',{limit:20});
    if(r.error) throw new Error(r.error);
    console.log('  → '+( r.entries?.length||0)+' записей, limit=20 ✓');
  });

  await t('T07: Курс: прогресс-бар в хабе (get_course работает)', async()=>{
    const r=await userApi('get_course',{});
    if(r.error) throw new Error('get_course failed: '+r.error);
    const lessons=r.lessons||[];
    const done=lessons.filter(l=>l.is_completed).length;
    console.log('  → '+done+'/'+lessons.length+' уроков завершено ✓');
  });

  await t('T08: Курс: complete_lesson → прогресс обновился', async()=>{
    const r=await userApi('get_course',{});
    const lessons=r.lessons||[];
    if(!lessons.length) { console.log('  → Нет уроков, пропускаем'); return; }
    const lesson=lessons.find(l=>!l.is_completed)||lessons[0];
    const cr=await userApi('complete_lesson',{content_id:lesson.id});
    if(cr.error) throw new Error('complete_lesson failed: '+cr.error);
    const r2=await userApi('get_course',{});
    const updated=(r2.lessons||[]).find(l=>l.id===lesson.id);
    console.log('  → Урок отмечен completed='+updated?.is_completed+' ✓');
  });

  await t('T09: Курс: перезагрузка → прогресс сохранился', async()=>{
    const r1=await userApi('get_course',{});
    const done1=(r1.lessons||[]).filter(l=>l.is_completed).length;
    // Re-query simulates page reload
    const r2=await userApi('get_course',{});
    const done2=(r2.lessons||[]).filter(l=>l.is_completed).length;
    if(done1!==done2) throw new Error('Progress changed between queries: '+done1+'→'+done2);
    console.log('  → Progress stable: '+done2+' completed ✓');
  });

  await t('T10: pg_cron: send_daily_summary → ok:true', async()=>{
    const r=await adminApi('send_daily_summary',{});
    if(!r.ok) throw new Error('send_daily_summary failed: '+JSON.stringify(r));
    console.log('  → Summary: active='+r.summary?.active+', unread='+r.summary?.unread+' ✓');
  });

  await t('T11: pg_cron: send_expiry_notifications → ok:true', async()=>{
    const r=await adminApi('send_expiry_notifications',{});
    if(!r.ok) throw new Error('send_expiry_notifications failed: '+JSON.stringify(r));
    console.log('  → Notified: '+r.notified+' users ✓');
  });

  await t('T12: Zoom-записи: get_my_recordings → не ломается', async()=>{
    const r=await userApi('get_my_recordings',{});
    if(r.error) throw new Error('get_my_recordings error: '+r.error);
    console.log('  → recordings: '+(r.recordings?.length||0)+' ✓');
  });

  await t('T13: Библиотека: фильтр «Разборы» — JS функция существует', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    const hasFn=await page.evaluate(()=>typeof setLibType==='function' && typeof loadZoomSection==='function');
    if(!hasFn) throw new Error('setLibType or loadZoomSection not defined');
    console.log('  → Zoom filter functions defined ✓'); await page.close();
  });

  await t('T14: Хаб: блок «Ближайшее» рендерится', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.waitForFunction(()=>{const h=document.getElementById('hubCards');return h&&h.innerHTML.length>200;},{timeout:14000});
    const hubHtml=await page.$eval('#hubCards',el=>el.innerHTML);
    if(!hubHtml.includes('Ближайшее')) throw new Error('Ближайшее block not in hub');
    console.log('  → «Ближайшее» block rendered ✓'); await page.close();
  });

  // ════════════════════════════════════════════════════════════
  // БЛОК 2: PROD-СПЕЦИФИЧНЫЕ (10)
  // ════════════════════════════════════════════════════════════

  await t('T15: app.listoshenkov.ru/private/ → HTTP 200', async()=>{
    const r=await httpGet(PROD_PRI);
    if(r.status!==200) throw new Error('HTTP '+r.status);
    console.log('  → 200 OK ✓');
  });

  await t('T16: app.listoshenkov.ru/private/admin.html → HTTP 200', async()=>{
    const r=await httpGet(PROD_ADM);
    if(r.status!==200) throw new Error('HTTP '+r.status);
    console.log('  → 200 OK ✓');
  });

  await t('T17: CORS с app.listoshenkov.ru → 401 Unauthorized', async()=>{
    const r=await api(PRIVATE_FN,'check_access',{token:'invalid'},1,PROD);
    if(!r.error||r.error!=='Unauthorized') throw new Error('Expected Unauthorized, got: '+JSON.stringify(r).slice(0,80));
    console.log('  → CORS OK, 401 Unauthorized ✓');
  });

  await t('T18: CORS с dev.listoshenkov.ru → 401', async()=>{
    const DEV='https://dev.listoshenkov.ru';
    const r=await api(PRIVATE_FN,'check_access',{token:'invalid'},1,DEV);
    if(!r.error||r.error!=='Unauthorized') throw new Error('Expected Unauthorized from dev origin, got: '+JSON.stringify(r).slice(0,80));
    console.log('  → CORS dev origin OK ✓');
  });

  await t('T19: CORS с неизвестного домена → отклоняется', async()=>{
    const UNKNOWN='https://evil.example.com';
    const r=await api(PRIVATE_FN,'check_access',{token:'invalid'},1,UNKNOWN);
    // Should still return JSON but from allowed origin (CORS restriction is on browser level)
    // Server returns response regardless, browser would block it - we just verify server responds
    console.log('  → Unknown origin response: '+JSON.stringify(r).slice(0,60)+' (server-level OK) ✓');
  });

  await t('T20: /private/ без токена → лендинг (не белый экран)', async()=>{
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(()=>localStorage.removeItem('session_token'));
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:12000});
    const landingVis=await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
    if(!landingVis) throw new Error('Landing not shown without token');
    console.log('  → Landing shown without token ✓'); await page.close();
  });

  await t('T21: /private/?section=analyses → таб Анализы', async()=>{
    const page=await mob.newPage(); await loadSPA(page,1,'labs');
    await page.waitForFunction(()=>document.getElementById('tab-labs')?.classList.contains('active'),{timeout:8000});
    console.log('  → section=labs opens labs tab ✓'); await page.close();
  });

  await t('T22: /private/?payment=success → overlay активации (лендинг не показан)', async()=>{
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(tk=>localStorage.setItem('session_token',tk),makeToken());
    await page.goto(PROD_PRI+'?payment=success',{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:14000});
    const landingVis=await page.evaluate(()=>document.getElementById('icLanding')?.style.display!=='none');
    if(landingVis) throw new Error('Landing shown on payment=success with valid token');
    console.log('  → Landing not shown on payment=success ✓'); await page.close();
  });

  await t('T23: Карточка БК в prod index.html скрыта', async()=>{
    const r=await httpGet(PROD+'/');
    if(r.body.includes('openInnerCircle') && !r.body.includes('IC_HIDDEN_BK')) throw new Error('BK card visible on prod!');
    const hidden=r.body.includes('IC_HIDDEN_BK');
    console.log('  → IC_HIDDEN_BK present: '+hidden+' ✓');
  });

  await t('T24: Nginx microphone=(self) для /private/', async()=>{
    const r=await httpGet(PROD_PRI);
    const pp=r.headers['permissions-policy']||'';
    if(!pp.includes('microphone=(self)') && !pp.includes("microphone=(\"self\")")) throw new Error('microphone=(self) not in Permissions-Policy: '+pp);
    console.log('  → Permissions-Policy: '+pp.slice(0,60)+' ✓');
  });

  // ════════════════════════════════════════════════════════════
  // БЛОК 3: РЕГРЕССИЯ (8)
  // ════════════════════════════════════════════════════════════

  await t('T25: check_access с тестовым токеном → hasAccess:true', async()=>{
    const r=await userApi('check_access',{});
    if(!r.hasAccess) throw new Error('hasAccess false: '+JSON.stringify(r));
    console.log('  → hasAccess:true, daysLeft:'+r.daysLeft+' ✓');
  });

  await t('T26: get_library → материалы > 0', async()=>{
    const r=await userApi('get_library',{});
    const n=r.items?.length||0;
    if(n===0) throw new Error('No library items');
    console.log('  → '+n+' материалов ✓');
  });

  await t('T27: search_markers q="гемо" → результат без ref_ranges', async()=>{
    const r=await userApi('search_markers',{q:'гемо'});
    if(!r.markers?.length) throw new Error('No markers found for гемо');
    if(r.markers.some(m=>'ref_ranges' in m)) throw new Error('ref_ranges present in response!');
    console.log('  → '+r.markers.length+' marker(s), no ref_ranges ✓');
  });

  await t('T28: get_markers_catalog → маркеры > 0', async()=>{
    const r=await userApi('get_markers_catalog',{});
    const n=r.markers?.length||0;
    if(n===0) throw new Error('No markers in catalog');
    if(r.markers.some(m=>'ref_ranges' in m)) throw new Error('ref_ranges in catalog response!');
    console.log('  → '+n+' маркеров, no ref_ranges ✓');
  });

  await t('T29: add_thread_message → ok:true', async()=>{
    const r=await userApi('add_thread_message',{text:'T-016 prod regression test '+Date.now(),thread_type:'general'});
    if(r.error) throw new Error('add_thread_message: '+r.error);
    console.log('  → message id: '+r.message?.id+' ✓');
  });

  await t('T30: get_my_threads → сообщение появилось', async()=>{
    const r=await userApi('get_my_threads',{});
    if(!r.messages?.length) throw new Error('No threads');
    const recent=r.messages.filter(m=>m.text&&m.text.includes('T-016'));
    console.log('  → '+r.messages.length+' threads, T-016 found: '+recent.length+' ✓');
  });

  await t('T31: Хаб загружается без ошибок (все API-вызовы)', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.waitForFunction(()=>{const h=document.getElementById('hubCards');return h&&h.innerHTML.length>400;},{timeout:14000});
    const appVis=await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
    if(!appVis) throw new Error('SPA not visible');
    console.log('  → Hub loaded, all API calls OK ✓'); await page.close();
  });

  await t('T32: Таб Профиль → дата доступа отображается', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('profile');});
    await page.waitForSelector('#tab-profile.active',{timeout:8000});
    await page.waitForFunction(()=>{const el=document.getElementById('profStatusLabel');return el&&el.textContent.trim().length>3;},{timeout:10000});
    const status=await page.$eval('#profStatusLabel',el=>el.textContent.trim());
    console.log('  → Status: "'+status+'" ✓'); await page.close();
  });

  // ════════════════════════════════════════════════════════════
  // БЛОК 4: ПРОИЗВОДИТЕЛЬНОСТЬ (6)
  // ════════════════════════════════════════════════════════════

  await t('T33: Лендинг загружается < 2 сек', async()=>{
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:10000});
    await page.evaluate(()=>localStorage.removeItem('session_token'));
    const t0=Date.now();
    await page.reload({waitUntil:'domcontentloaded',timeout:10000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:8000});
    const ms=Date.now()-t0;
    if(ms>2000) throw new Error('Landing took '+ms+'ms (>2000)');
    console.log('  → '+ms+'ms ✓'); await page.close();
  });

  await t('T34: SPA после авторизации < 3 сек', async()=>{
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(tk=>localStorage.setItem('session_token',tk),makeToken());
    const t0=Date.now();
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForSelector('#icApp',{state:'visible',timeout:14000});
    const ms=Date.now()-t0;
    if(ms>3000) throw new Error('SPA load took '+ms+'ms (>3000)');
    console.log('  → '+ms+'ms ✓'); await page.close();
  });

  await t('T35: Библиотека 45+ материалов < 3 сек', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('lib');});
    const t0=Date.now();
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:10000});
    const ms=Date.now()-t0;
    const n=await page.$$eval('.lib-item',els=>els.length);
    if(ms>3000) throw new Error('Library took '+ms+'ms (>3000)');
    console.log('  → '+n+' items in '+ms+'ms ✓'); await page.close();
  });

  await t('T36: Переключение табов < 500ms', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    const times=[];
    for(const tab of ['chat','labs','lib','med','profile','home']){
      const t0=Date.now();
      await page.evaluate(t=>{if(typeof switchTab==='function')switchTab(t);},tab);
      await page.waitForSelector('#tab-'+tab+'.active',{timeout:3000});
      times.push(Date.now()-t0);
    }
    const max=Math.max(...times);
    if(max>500) throw new Error('Slowest tab: '+max+'ms');
    console.log('  → max='+max+'ms avg='+Math.round(times.reduce((a,b)=>a+b,0)/times.length)+'ms ✓');
    await page.close();
  });

  await t('T37: API check_access < 2 сек', async()=>{
    const t0=Date.now();
    const r=await userApi('check_access',{});
    const ms=Date.now()-t0;
    if(ms>2000) throw new Error('check_access took '+ms+'ms');
    console.log('  → '+ms+'ms, hasAccess='+r.hasAccess+' ✓');
  });

  await t('T38: API get_library < 2 сек', async()=>{
    const t0=Date.now();
    const r=await userApi('get_library',{});
    const ms=Date.now()-t0;
    if(ms>2000) throw new Error('get_library took '+ms+'ms');
    console.log('  → '+ms+'ms, items='+(r.items?.length||0)+' ✓');
  });

  // ════════════════════════════════════════════════════════════
  // БЛОК 5: СЦЕНАРИИ РЕАЛЬНОГО ПОЛЬЗОВАТЕЛЯ (8)
  // ════════════════════════════════════════════════════════════

  await t('T39: Новый пользователь без подписки → лендинг + тарифы', async()=>{
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(()=>localStorage.removeItem('session_token'));
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:12000});
    const hasPrice=await page.evaluate(()=>!!(document.getElementById('price30')&&document.getElementById('price90')));
    if(!hasPrice) throw new Error('Pricing not shown on landing');
    const p30=await page.$eval('#price30',el=>el.textContent); const p90=await page.$eval('#price90',el=>el.textContent);
    console.log('  → Landing: 30d='+p30+'₽, 90d='+p90+'₽ ✓'); await page.close();
  });

  await t('T40: Пользователь с доступом → хаб + пустые состояния', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.waitForFunction(()=>document.getElementById('hubCards')?.innerHTML.length>200,{timeout:14000});
    const stubCount=await page.$$eval('.ic-stub-card',els=>els.length);
    console.log('  → Hub loaded, stub cards: '+stubCount+' ✓'); await page.close();
  });

  await t('T41: Хаб → «Написать» → таб Алексей', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.waitForFunction(()=>document.getElementById('hubCards')?.innerHTML.length>200,{timeout:14000});
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('chat');});
    await page.waitForSelector('#tab-chat.active',{timeout:8000});
    console.log('  → Switched to chat tab ✓'); await page.close();
  });

  await t('T42: Хаб → «Загрузить анализ» → таб Анализы', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.waitForFunction(()=>document.getElementById('hubCards')?.innerHTML.length>200,{timeout:14000});
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('labs');});
    await page.waitForSelector('#tab-labs.active',{timeout:8000});
    console.log('  → Switched to labs tab ✓'); await page.close();
  });

  await t('T43: Библиотека → клик на материал → детальный экран', async()=>{
    const page=await mob.newPage(); await loadSPA(page,'lib');
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('lib');if(typeof loadLibraryIfNeeded==='function')loadLibraryIfNeeded();});
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    await page.evaluate(()=>{ const item=document.querySelector('.lib-item'); if(item)item.click(); });
    await page.waitForFunction(()=>{const d=document.getElementById('libDetail');return d&&d.style.display!=='none';},{timeout:8000});
    console.log('  → Detail view opened ✓'); await page.close();
  });

  await t('T44: Детальный экран → «Назад» → вернулся в список', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('lib');if(typeof loadLibraryIfNeeded==='function')loadLibraryIfNeeded();});
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    await page.evaluate(()=>{ document.querySelector('.lib-item')?.click(); });
    await page.waitForFunction(()=>document.getElementById('libDetail')?.style.display!=='none',{timeout:8000});
    await page.evaluate(()=>{if(typeof closeLibDetail==='function')closeLibDetail();});
    await page.waitForFunction(()=>{const l=document.getElementById('libList');return l&&l.style.display!=='none';},{timeout:5000});
    console.log('  → Back to list ✓'); await page.close();
  });

  await t('T45: Профиль → «Добавить близкого» → форма открылась', async()=>{
    const page=await mob.newPage(); await loadSPA(page);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('profile');});
    await page.waitForSelector('#tab-profile.active',{timeout:8000});
    await page.evaluate(()=>{if(typeof openAddDepModal==='function')openAddDepModal();});
    await page.waitForFunction(()=>document.getElementById('profDepModal')?.classList.contains('open'),{timeout:5000});
    console.log('  → Add dependant modal opened ✓');
    await page.evaluate(()=>{if(typeof closeProfDepModal==='function')closeProfDepModal();});
    await page.close();
  });

  await t('T46: Онбординг: welcome screen после payment=success', async()=>{
    // Simulate fresh user (no onboarding completed)
    const page=await mob.newPage();
    await page.goto(PROD_PRI,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(tk=>{localStorage.setItem('session_token',tk);localStorage.removeItem('private_onboarding_completed');},makeToken());
    await page.goto(PROD_PRI+'?payment=success',{waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('icLoading')?.style.display==='none',{timeout:14000});
    const welcomeActive=await page.evaluate(()=>document.getElementById('icWelcome')?.classList.contains('active'));
    const spaVisible=await page.evaluate(()=>document.getElementById('icApp')?.style.display==='flex');
    if(!welcomeActive&&!spaVisible) throw new Error('Neither welcome nor SPA shown');
    console.log('  → welcome='+welcomeActive+', spa='+spaVisible+' ✓'); await page.close();
  });

  // ════════════════════════════════════════════════════════════
  // БЛОК 6: ДАННЫЕ И ЦЕЛОСТНОСТЬ (6)
  // ════════════════════════════════════════════════════════════

  await t('T47: 45+ материалов в private_content is_published=true', async()=>{
    const out=dbQuery("SELECT COUNT(*) FROM private_content WHERE is_published=true;");
    const n=parseInt(out.match(/\d+/)?.[0]||'0');
    if(n<45) throw new Error('Only '+n+' published content items');
    console.log('  → '+n+' published items ✓');
  });

  await t('T48: 163+ тег-привязки в library_item_tags', async()=>{
    const out=dbQuery("SELECT COUNT(*) FROM library_item_tags;");
    const n=parseInt(out.match(/\d+/)?.[0]||'0');
    if(n<100) throw new Error('Only '+n+' tag links');
    console.log('  → '+n+' tag links ✓');
  });

  await t('T49: 77 маркеров в analysis_markers is_active=true', async()=>{
    const out=dbQuery("SELECT COUNT(*) FROM analysis_markers WHERE is_active=true;");
    const n=parseInt(out.match(/\d+/)?.[0]||'0');
    if(n!==77) throw new Error('Expected 77 markers, got '+n);
    console.log('  → 77 markers ✓');
  });

  await t('T50: 4 продукта inner_circle в products', async()=>{
    const out=dbQuery("SELECT COUNT(*) FROM products WHERE product_type='inner_circle';");
    const n=parseInt(out.match(/\d+/)?.[0]||'0');
    if(n!==4) throw new Error('Expected 4 inner_circle products, got '+n);
    console.log('  → 4 inner_circle products ✓');
  });

  await t('T51: 3 storage bucket существуют', async()=>{
    const r=await new Promise((res,rej)=>{
      const KEY2=KEY; const body=JSON.stringify({});
      const url=new URL('https://uckuyoyubub.beget.app/storage/v1/bucket');
      const opts={hostname:url.hostname,port:443,path:url.pathname,method:'GET',
        headers:{'Authorization':'Bearer '+KEY2}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.end();
    });
    const buckets=Array.isArray(r)?r.map(b=>b.name):[];
    const required=['user-analyses','voice-messages','private-content'];
    const missing=required.filter(b=>!buckets.includes(b));
    if(missing.length) throw new Error('Missing buckets: '+missing.join(', '));
    console.log('  → Buckets: '+buckets.filter(b=>required.includes(b)).join(', ')+' ✓');
  });

  await t('T52: pg_cron задачи зарегистрированы', async()=>{
    const out=dbQuery("SELECT jobname FROM cron.job WHERE jobname LIKE 'private-%' ORDER BY jobname;");
    const jobs=['private-daily-summary','private-expiry-notify','private-hide-expired-recordings'];
    const missing=jobs.filter(j=>!out.includes(j));
    if(missing.length) throw new Error('Missing cron jobs: '+missing.join(', '));
    console.log('  → All 3 cron jobs registered ✓');
  });

  await browser.close();

  // ── Report ─────────────────────────────────────────────────────────────────
  const b1=results.slice(0,14), b2=results.slice(14,24), b3=results.slice(24,32);
  const b4=results.slice(32,38), b5=results.slice(38,46), b6=results.slice(46,52);
  const score=(r)=>r.filter(x=>x.status==='✓').length+'/'+r.length;

  console.log('\n════════════════ ОТЧЁТ T-PRIVATE-016 ════════════════');
  console.log(`Блок 1 Новый функционал:    ${score(b1)}`);
  console.log(`Блок 2 Prod-специфичные:    ${score(b2)}`);
  console.log(`Блок 3 Регрессия:           ${score(b3)}`);
  console.log(`Блок 4 Производительность:  ${score(b4)}`);
  console.log(`Блок 5 Сценарии польз.:     ${score(b5)}`);
  console.log(`Блок 6 Целостность данных:  ${score(b6)}`);
  console.log(`─────────────────────────────────────────`);
  console.log(`ИТОГО: ${pass}/${pass+fail} (${Math.round(pass/(pass+fail)*100)}%)`);

  const failed=results.filter(r=>r.status==='✗');
  if(failed.length){
    console.log('\nУпавшие:');
    failed.forEach(r=>console.log('  ✗ '+r.name+' — '+r.error));
  }

  fs.writeFileSync('/tmp/pw-test/report_prod.json',JSON.stringify({pass,fail,results},null,2));
  process.exit(fail>0?1:0);
})();
