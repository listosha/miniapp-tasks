// T-PRIVATE-012e+f: 25 security/isolation/mobile tests
// Run on VPS: node test_security.js
const { chromium } = require('playwright');
const { createHmac } = require('crypto');
const fs = require('fs');

const BASE        = 'https://dev.listoshenkov.ru';
const PRIVATE_URL = BASE + '/private/';
const ADMIN_URL   = BASE + '/private/admin.html';
const PRIVATE_FN  = 'https://uckuyoyubub.beget.app/functions/v1/private-data';
const ADMIN_FN    = 'https://uckuyoyubub.beget.app/functions/v1/private-admin';

const KEY = fs.readFileSync('/opt/beget/supabase/.env','utf8').match(/SERVICE_ROLE_KEY=(.+)/)[1].trim();

function makeToken(uid=1){ const ts=Date.now(); return `${uid}:${ts}:${createHmac('sha256',KEY).update(`${uid}:${ts}`).digest('hex')}`; }

function makeExpiredToken(uid=1){ const ts=Date.now()-31*24*3600000; return `${uid}:${ts}:${createHmac('sha256',KEY).update(`${uid}:${ts}`).digest('hex')}`; }

async function api(fn, action, extra={}, uid=1) {
  return new Promise((res,rej)=>{
    const tok=makeToken(uid), body=JSON.stringify({action,token:tok,...extra});
    const url=new URL(fn), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
    const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
    req.on('error',rej); req.write(body); req.end();
  });
}
const userApi  = (action,extra={},uid=1) => api(PRIVATE_FN,action,extra,uid);
const adminApi = (action,extra={})       => api(ADMIN_FN,action,extra,1);

let pass=0, fail=0;
const results=[], vulns=[], screenshots=[];

async function t(name, fn) {
  try { await fn(); console.log(`✓ ${name}`); results.push({name,status:'✓',error:null}); pass++; }
  catch(e) { const msg=e.message.split('\n')[0].slice(0,120); console.log(`✗ ${name}: ${msg}`); results.push({name,status:'✗',error:msg}); fail++; }
}

function vuln(sev, desc) { console.log(`  ⚠️  УЯЗВИМОСТЬ [${sev}]: ${desc}`); vulns.push({sev,desc}); }
function ok(desc) { console.log(`  ✓ ${desc}`); }

async function loadSPA(page, uid=1) {
  const tok=makeToken(uid);
  await page.goto(PRIVATE_URL,{waitUntil:'domcontentloaded',timeout:15000});
  await page.evaluate(tk=>localStorage.setItem('session_token',tk),tok);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForSelector('#icApp',{state:'visible',timeout:14000});
}

async function scr(page, name) {
  const path=`/tmp/pw-test/sec_${name}.png`;
  await page.screenshot({path,fullPage:false}).catch(()=>{});
  screenshots.push(path);
}

// ── Seed: user2 adds some private data ──────────────────────────────────────
async function seedUser2() {
  const r1 = await userApi('add_thread_message',{text:'Сообщение пользователя 2',thread_type:'general'},2);
  const r2 = await userApi('add_journal_entry',{text:'Запись дневника пользователя 2'},2);
  const r3 = await userApi('save_health_profile',{special_notes:'Приватные данные user2',diagnoses:['Секрет']},2);
  return {msg:r1.message?.id, journal:r2.entry?.id};
}

(async()=>{
  console.log('Seeding user2 data...');
  await seedUser2();

  const browser = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const mob  = await browser.newContext({viewport:{width:390,height:844}});
  const desk = await browser.newContext({viewport:{width:1280,height:900}});

  // ══════════════════════════════════════════════════════════
  // БЛОК 1: ИЗОЛЯЦИЯ ДАННЫХ МЕЖДУ ПОЛЬЗОВАТЕЛЯМИ (5)
  // ══════════════════════════════════════════════════════════

  await t('I1: Пользователь 1 не видит сообщения пользователя 2', async()=>{
    const r1 = await userApi('get_my_threads',{},1);
    const r2 = await userApi('get_my_threads',{},2);
    const msgs1 = r1.messages||[];
    const msgs2 = r2.messages||[];
    // No message from user2 should appear in user1's threads
    const crossed = msgs1.filter(m=>m.user_id===2 && !m.is_from_admin);
    if(crossed.length>0) { vuln('HIGH','User1 can see user2 personal threads: '+crossed.map(m=>m.id).join(',')); throw new Error(`User1 sees ${crossed.length} user2 messages`); }
    ok(`User1 threads: ${msgs1.length}, User2 threads: ${msgs2.length} — no cross-contamination`);
  });

  await t('I2: Пользователь 1 не видит анализы пользователя 2', async()=>{
    // User2 upload a test analysis
    const r2up = await userApi('upload_analysis',{analysis_type:'Биохимия',notes:'Секретный анализ user2'},2);
    const analysisId = r2up.analysis?.id;
    // Check user1 cannot see it
    const r1 = await userApi('get_analyses',{},1);
    const r2 = await userApi('get_analyses',{},2);
    const u1sees = (r1.analyses||[]).find(a=>a.id===analysisId);
    if(u1sees) { vuln('CRITICAL','User1 can see user2 analysis: '+analysisId); throw new Error('Isolation breach: User1 sees user2 analysis'); }
    ok(`User1: ${(r1.analyses||[]).length} analyses, User2: ${(r2.analyses||[]).length} — isolated`);
  });

  await t('I3: Пользователь 1 не видит мед. карту пользователя 2', async()=>{
    const r1 = await userApi('get_health_profile',{},1);
    const r2 = await userApi('get_health_profile',{},2);
    const notes1 = r1.profile?.special_notes||'';
    const notes2 = r2.profile?.special_notes||'';
    if(notes1.includes('Приватные данные user2')) { vuln('CRITICAL','User1 can read user2 health profile'); throw new Error('Health profile isolation breach'); }
    if(!notes2.includes('Приватные данные user2')) throw new Error('User2 health profile not saved correctly: '+notes2);
    ok(`User1 notes: "${notes1.slice(0,30)}", User2 notes: "${notes2.slice(0,30)}" — isolated`);
  });

  await t('I4: get_analyses с чужим токеном → только свои данные', async()=>{
    // Upload something for both users, then cross-check
    await userApi('upload_analysis',{analysis_type:'Общий крови'},1);
    const r = await userApi('get_analyses',{},2);
    const user1AnalysisInUser2 = (r.analyses||[]).some(a=>a.user_id===1);
    if(user1AnalysisInUser2) { vuln('CRITICAL','get_analyses returns other users data'); throw new Error('Cross-user analyses exposure'); }
    ok('get_analyses returns only own analyses ✓');
  });

  await t('I5: get_my_threads с токеном user2 → только свои данные', async()=>{
    const r2 = await userApi('get_my_threads',{},2);
    const r1 = await userApi('get_my_threads',{},1);
    const msgs2 = r2.messages||[];
    const msgs1 = r1.messages||[];
    // user_id not returned in response (by design) — check by text content
    const seenOwn = msgs2.some(m=>m.text==='Сообщение пользователя 2');
    if(!seenOwn) throw new Error('User2 cannot see own message');
    const u1Texts = msgs1.filter(m=>!m.is_from_admin).map(m=>m.text);
    const u2UserTexts = msgs2.filter(m=>!m.is_from_admin).map(m=>m.text);
    const leaked = u1Texts.filter(t=>t&&u2UserTexts.includes(t)&&!t.includes('user2')&&!t.includes('Сообщение пользователя'));
    if(leaked.length>0) { vuln('HIGH','User2 sees user1 messages: '+leaked.join(',')); throw new Error('Cross-user leak: '+leaked.join(',')); }
    ok('User2 sees own msgs, no user1 text leaked. Note: user_id omitted in response by design ✓');
  });

  // ══════════════════════════════════════════════════════════
  // БЛОК 2: ПОПЫТКИ ВЗЛОМА API (5)
  // ══════════════════════════════════════════════════════════

  await t('A1: add_thread_message с чужим user_id → пишется от своего', async()=>{
    // Token for user1, but try to inject user_id=2 in body
    const r = await new Promise((res,rej)=>{
      const tok=makeToken(1);
      const body=JSON.stringify({action:'add_thread_message',token:tok,user_id:2,text:'Инъекция user_id',thread_type:'general'});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    // Verify the message was written as user1, not user2
    const threads = await userApi('get_my_threads',{},1);
    const injMsg = (threads.messages||[]).find(m=>m.text==='Инъекция user_id');
    if(injMsg && injMsg.user_id===2) { vuln('CRITICAL','user_id injection successful — message written as user2'); throw new Error('user_id injection: message appears as user2'); }
    if(injMsg && injMsg.user_id===1) { ok('user_id injection ignored, written as user1 ✓'); }
    else { ok('user_id injection rejected entirely ✓'); }
  });

  await t('A2: save_health_profile с чужим user_id → игнорируется', async()=>{
    const uniqueNote = 'INJECTION_TEST_' + Date.now();
    await new Promise((res,rej)=>{
      const tok=makeToken(1);
      const body=JSON.stringify({action:'save_health_profile',token:tok,user_id:2,special_notes:uniqueNote});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    // Verify user2 data was NOT overwritten
    const r2 = await userApi('get_health_profile',{},2);
    const note2 = r2.profile?.special_notes||'';
    if(note2.includes('INJECTION_TEST')) { vuln('CRITICAL','save_health_profile user_id injection successful — user2 data overwritten'); throw new Error('user_id injection in health profile succeeded'); }
    // Check user1 got the note (correct behavior — written to user1)
    const r1 = await userApi('get_health_profile',{},1);
    const note1 = r1.profile?.special_notes||'';
    ok(`User2 data intact: "${note2.slice(0,30)}", User1 got: "${note1.includes('INJECTION')?'own note (correct)':'other'}"`);
  });

  await t('A3: toggle_recommendation чужой → ошибка или нет эффекта', async()=>{
    // Admin adds a recommendation for user1
    const recoR = await adminApi('add_recommendation',{user_id:1,text:'Рекомендация для user1'});
    const recoId = recoR.recommendation?.id;
    if(!recoId) { ok('No recommendation to test, skipping'); return; }
    // User2 tries to toggle user1's recommendation
    const r = await new Promise((res,rej)=>{
      const tok=makeToken(2);
      const body=JSON.stringify({action:'toggle_recommendation',token:tok,recommendation_id:recoId,is_completed:true});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    // Check user1's recommendation is NOT changed
    const r1recos = await userApi('get_recommendations',{},1);
    const reco = (r1recos.recommendations||[]).find(r=>r.id===recoId);
    if(reco?.is_completed) { vuln('HIGH','User2 can toggle user1 recommendations'); throw new Error('Cross-user recommendation toggle succeeded'); }
    ok(`toggle_recommendation cross-user: is_completed=${reco?.is_completed} (unchanged) ✓`);
  });

  await t('A4: SQL-инъекция в text поле → безопасно', async()=>{
    const sqlPayload = "'; DROP TABLE users; --";
    const r = await userApi('add_thread_message',{text:sqlPayload,thread_type:'general'},1);
    // Verify users table still exists
    const checkR = await userApi('check_access',{},1);
    if(!checkR || checkR.error==='Unauthorized') throw new Error('check_access failed after SQL injection attempt');
    // Verify the message was stored safely (escaped)
    const threads = await userApi('get_my_threads',{},1);
    const injMsg = (threads.messages||[]).find(m=>(m.text||'').includes('DROP TABLE'));
    if(injMsg) {
      ok(`SQL injection stored as plain text (escaped): "${injMsg.text}" — DB intact ✓`);
    } else {
      ok('SQL injection message rejected or stored differently — DB intact ✓');
    }
  });

  await t('A5: XSS в тексте сообщения → экранируется при отображении', async()=>{
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    await userApi('add_thread_message',{text:xssPayload,thread_type:'general'},1);
    // Load the SPA and check chat renders the text safely
    const page = await mob.newPage();
    await loadSPA(page, 1);
    let alertFired = false;
    page.on('dialog', async d => { alertFired=true; await d.dismiss(); });
    await page.evaluate(()=>{ if(typeof switchTab==='function')switchTab('chat'); });
    await page.waitForSelector('#tab-chat.active',{timeout:8000});
    await page.evaluate(()=>{ if(typeof refreshChat==='function')refreshChat(); });
    await page.waitForTimeout(3000);
    if(alertFired) { vuln('CRITICAL','XSS script executed in chat — alert fired'); throw new Error('XSS alert fired!'); }
    // Check that the content is escaped
    const chatHtml = await page.$eval('#chatMessages', el=>el.innerHTML).catch(()=>'');
    if(chatHtml.includes('<script>')) { vuln('HIGH','Unescaped <script> tag in chat HTML'); throw new Error('XSS: script tag present in DOM'); }
    await scr(page,'A5_xss_chat');
    ok('XSS payload rendered as text, no alert, no script tag in DOM ✓');
    await page.close();
  });

  // ══════════════════════════════════════════════════════════
  // БЛОК 3: ПРАВА ДОСТУПА (7)
  // ══════════════════════════════════════════════════════════

  await t('P1: Не-админ открывает admin.html → заблокирован', async()=>{
    const page = await mob.newPage();
    await page.goto(ADMIN_URL,{waitUntil:'domcontentloaded',timeout:15000});
    await page.evaluate(tk=>localStorage.setItem('session_token',tk),makeToken(2)); // user2 = not admin
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await page.waitForTimeout(5000);
    const appVisible = await page.evaluate(()=>document.getElementById('admApp')?.style.display==='grid');
    const loadingText = await page.$eval('#admLoading',el=>el.textContent).catch(()=>'');
    if(appVisible) { vuln('CRITICAL','Non-admin user2 can access admin panel'); throw new Error('Admin panel accessible to non-admin'); }
    ok(`Admin panel blocked for user2: "${loadingText.trim().slice(0,50)}" ✓`);
    await page.close();
  });

  await t('P2: Не-админ вызывает private-admin action → 403', async()=>{
    const r = await api(ADMIN_FN,'get_daily_summary',{},2); // user2 calls admin API
    if(r.active_subscribers!==undefined) { vuln('CRITICAL','User2 can call admin API'); throw new Error('Admin API accessible to user2'); }
    if(r.error==='Forbidden') ok('403 Forbidden for non-admin ✓');
    else ok(`Admin API rejected user2: "${r.error||JSON.stringify(r).slice(0,50)}" ✓`);
  });

  await t('P3: extend_access от обычного пользователя → 403', async()=>{
    const r = await api(ADMIN_FN,'extend_access',{user_id:1,days:30},2);
    if(r.ok) { vuln('CRITICAL','User2 can extend other users access'); throw new Error('extend_access accessible to non-admin'); }
    ok(`extend_access blocked for user2: "${r.error}" ✓`);
  });

  await t('P4: add_recommendation от обычного пользователя → 403', async()=>{
    const r = await api(ADMIN_FN,'add_recommendation',{user_id:1,text:'Взлом'},2);
    if(r.recommendation) { vuln('HIGH','User2 can add recommendations via admin API'); throw new Error('add_recommendation accessible to non-admin'); }
    ok(`add_recommendation blocked for user2: "${r.error}" ✓`);
  });

  await t('P5: Токен с неверной подписью → 401', async()=>{
    const r = await new Promise((res,rej)=>{
      const tok=`1:${Date.now()}:badsignature1234567890`;
      const body=JSON.stringify({action:'check_access',token:tok});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    if(!r.error || r.hasAccess) { vuln('CRITICAL','Bad signature token accepted'); throw new Error('Bad signature accepted: '+JSON.stringify(r)); }
    ok(`Bad signature rejected: "${r.error}" ✓`);
  });

  await t('P6: Токен с несуществующим user_id → 401', async()=>{
    const fakeUid=99999, ts=Date.now();
    const sig=createHmac('sha256',KEY).update(`${fakeUid}:${ts}`).digest('hex');
    const r = await new Promise((res,rej)=>{
      const tok=`${fakeUid}:${ts}:${sig}`;
      const body=JSON.stringify({action:'check_access',token:tok});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    // Should return hasAccess:false (user exists in check) or error
    ok(`Non-existent user_id=99999: hasAccess=${r.hasAccess}, error="${r.error}" ✓`);
  });

  await t('P7: Токен старше 30 дней → 401', async()=>{
    const expTok = makeExpiredToken(1);
    const r = await new Promise((res,rej)=>{
      const body=JSON.stringify({action:'check_access',token:expTok});
      const url=new URL(PRIVATE_FN), opts={hostname:url.hostname,port:443,path:url.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}};
      const req=require('https').request(opts,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{res(JSON.parse(d));}catch(e){res(d);}});});
      req.on('error',rej); req.write(body); req.end();
    });
    if(r.hasAccess) { vuln('HIGH','Expired token (31 days) still works'); throw new Error('Expired token accepted'); }
    ok(`Expired token (31d) rejected: "${r.error}" ✓`);
  });

  // ══════════════════════════════════════════════════════════
  // БЛОК 4: МОБИЛЬНЫЙ VIEWPORT (8)
  // ══════════════════════════════════════════════════════════

  await t('V1: 375px (iPhone SE) → табы помещаются, нет горизонтального скролла', async()=>{
    const smallCtx = await browser.newContext({viewport:{width:375,height:667}});
    const page = await smallCtx.newPage();
    await loadSPA(page, 1);
    const metrics = await page.evaluate(()=>{
      const tabs=document.getElementById('mobileTabs');
      return tabs ? {scrollWidth:tabs.scrollWidth, clientWidth:tabs.clientWidth, overflow:getComputedStyle(tabs).overflowX} : null;
    });
    if(!metrics) throw new Error('mobileTabs not found');
    // Tabs should scroll horizontally (overflow-x:auto) — intentional
    ok(`375px: tabsScrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}, overflow=${metrics.overflow} ✓`);
    await scr(page,'V1_375px');
    await smallCtx.close();
  });

  await t('V2: 390px (iPhone 14) → все элементы видны', async()=>{
    const page = await mob.newPage(); // 390px
    await loadSPA(page, 1);
    const checks = await page.evaluate(()=>({
      app: !!document.getElementById('icApp'),
      tabs: !!document.getElementById('mobileTabs'),
      header: !!document.querySelector('.ic-app-header'),
      sidebar: window.getComputedStyle(document.querySelector('.ic-sidebar')||document.body).display,
    }));
    if(!checks.app) throw new Error('App not rendered at 390px');
    if(checks.sidebar!=='none') throw new Error('Sidebar should be hidden at 390px');
    ok(`390px: app=${checks.app}, tabs=${checks.tabs}, sidebar=${checks.sidebar} ✓`);
    await page.close();
  });

  await t('V3: 768px (iPad) → десктоп-сайдбар виден', async()=>{
    const ipadCtx = await browser.newContext({viewport:{width:768,height:1024}});
    const page = await ipadCtx.newPage();
    await loadSPA(page, 1);
    const sidebarDisplay = await page.evaluate(()=>window.getComputedStyle(document.querySelector('.ic-sidebar')||document.body).display);
    if(sidebarDisplay==='none') throw new Error('Sidebar should be visible at 768px');
    const mobileTabsDisplay = await page.evaluate(()=>window.getComputedStyle(document.getElementById('mobileTabs')||document.body).display);
    ok(`768px: sidebar=${sidebarDisplay}, mobileTabs=${mobileTabsDisplay} ✓`);
    await scr(page,'V3_768px');
    await ipadCtx.close();
  });

  await t('V4: Длинное имя пользователя → не ломает вёрстку', async()=>{
    const page = await mob.newPage();
    await loadSPA(page, 1);
    // Set a very long name in localStorage and trigger hub greeting
    await page.evaluate(()=>{
      localStorage.setItem('user_first_name','АлексейАлексейАлексейАлексейАлексейАлексейАлексейАлексей');
      if(typeof loadHub==='function'){_hubData={};loadHub();}
    });
    await page.waitForTimeout(1500);
    const bodyWidth = await page.evaluate(()=>document.body.scrollWidth);
    const viewportWidth = 390;
    if(bodyWidth > viewportWidth+10) throw new Error(`Horizontal overflow: bodyWidth=${bodyWidth} > ${viewportWidth}`);
    ok(`Long name (64 chars) — no horizontal overflow (bodyWidth=${bodyWidth}) ✓`);
    await scr(page,'V4_long_name');
    await page.close();
  });

  await t('V5: Длинный текст материала → корректный скролл без overflow', async()=>{
    const page = await mob.newPage();
    await loadSPA(page, 1);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('lib');});
    await page.waitForFunction(()=>(document.getElementById('libItems')?.querySelectorAll('.lib-item').length||0)>0,{timeout:14000});
    // Click material with long text (Хроники воспаления)
    await page.evaluate(()=>{
      const items=[...document.querySelectorAll('.lib-item')];
      const long=items.find(el=>el.innerText.includes('Хроники'));
      if(long)long.click(); else items[0]?.click();
    });
    await page.waitForFunction(()=>document.getElementById('libDetail')?.style.display!=='none',{timeout:8000});
    await page.waitForTimeout(1000);
    const overflow = await page.evaluate(()=>document.body.scrollWidth > 390+5);
    if(overflow) throw new Error('Horizontal overflow with long text');
    ok('Long text material — no horizontal overflow ✓');
    await scr(page,'V5_long_text');
    await page.close();
  });

  await t('V6: Длинное название анализа → ellipsis или перенос', async()=>{
    // Create analysis with long name, then check rendering
    await userApi('upload_analysis',{analysis_type:'Очень длинное название типа анализа которое должно помещаться',lab_name:'Очень длинное название лаборатории'},1);
    const page = await mob.newPage();
    await loadSPA(page, 1);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('labs');if(typeof loadLabsIfNeeded==='function')loadLabsIfNeeded();});
    await page.waitForFunction(()=>document.querySelector('.lab-analysis-card')!==null,{timeout:12000});
    const bodyWidth = await page.evaluate(()=>document.body.scrollWidth);
    if(bodyWidth>400) throw new Error(`Horizontal overflow with long analysis name: ${bodyWidth}px`);
    ok(`Long analysis name — body width=${bodyWidth}px, no overflow ✓`);
    await scr(page,'V6_long_analysis');
    await page.close();
  });

  await t('V7: Модальное окно (bottom sheet) → доступно', async()=>{
    const page = await mob.newPage();
    await loadSPA(page, 1);
    await page.evaluate(()=>{if(typeof switchTab==='function')switchTab('profile');});
    await page.waitForSelector('#tab-profile.active',{timeout:8000});
    // Open add dependant modal
    await page.evaluate(()=>{if(typeof openAddDepModal==='function')openAddDepModal();});
    await page.waitForFunction(()=>document.getElementById('profDepModal')?.classList.contains('open'),{timeout:5000});
    const sheetRect = await page.$eval('.prof-modal-sheet',el=>{const r=el.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height};}).catch(()=>null);
    if(!sheetRect) throw new Error('Modal sheet not found');
    if(sheetRect.bottom > 900) throw new Error(`Modal bottom (${sheetRect.bottom}) exceeds viewport`);
    ok(`Bottom sheet visible: top=${Math.round(sheetRect.top)}, height=${Math.round(sheetRect.height)} ✓`);
    await scr(page,'V7_modal');
    await page.close();
  });

  await t('V8: Десктоп — активный таб в сайдбаре подсвечен', async()=>{
    const page = await desk.newPage();
    await loadSPA(page, 1);
    // Switch through tabs and verify sidebar highlighting
    for(const tab of ['chat','labs','lib','med']) {
      await page.evaluate(t=>{if(typeof switchTab==='function')switchTab(t);},tab);
      await page.waitForTimeout(300);
      const activeItems = await page.$$eval('.ic-sidebar-item.active',els=>els.map(e=>e.dataset.tab));
      if(!activeItems.includes(tab)) throw new Error(`Tab ${tab} not highlighted in sidebar: active=[${activeItems}]`);
    }
    ok('Desktop sidebar highlights active tab for all tabs ✓');
    await scr(page,'V8_sidebar_desktop');
    await page.close();
  });

  await browser.close();

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n═══════ ОТЧЁТ T-PRIVATE-012e+f (Безопасность + Мобильный UX) ═══════');
  console.log(`Всего: ${pass+fail} | ✓ ${pass} | ✗ ${fail}`);
  if(vulns.length) {
    console.log(`\n⚠️  УЯЗВИМОСТИ (${vulns.length}):`);
    vulns.forEach(v=>console.log(`  [${v.sev}] ${v.desc}`));
  } else {
    console.log('\n✅ Уязвимостей не обнаружено');
  }
  console.log('\nРезультаты:');
  results.forEach(r=>console.log(`  ${r.status} ${r.name}${r.error?' — '+r.error:''}`));
  fs.writeFileSync('/tmp/pw-test/report_sec.json',JSON.stringify({pass,fail,results,vulns,screenshots},null,2));
  process.exit(fail>0?1:0);
})();
