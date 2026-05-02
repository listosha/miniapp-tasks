// T-PRIVATE-012: UI tests for dev.listoshenkov.ru/private/
const { chromium } = require('playwright');
const { createHmac } = require('crypto');
const fs = require('fs');

const BASE = 'https://dev.listoshenkov.ru';
const PRIVATE_URL = BASE + '/private/';
const ADMIN_URL   = BASE + '/private/admin.html';
const PRIVATE_FN  = 'https://uckuyoyubub.beget.app/functions/v1/private-data';

const SERVICE_ROLE_KEY = fs.readFileSync('/opt/beget/supabase/.env','utf8')
  .match(/SERVICE_ROLE_KEY=(.+)/)[1].trim();

function makeToken(userId) {
  const ts = Date.now();
  const sig = createHmac('sha256', SERVICE_ROLE_KEY).update(`${userId}:${ts}`).digest('hex');
  return `${userId}:${ts}:${sig}`;
}

let TOKEN = makeToken(1);

let pass=0, fail=0;
const results=[], screenshots=[];

async function test(name, fn) {
  try {
    TOKEN = makeToken(1); // fresh token each test
    await fn();
    console.log(`✓ ${name}`);
    results.push({name, status:'✓', error:null});
    pass++;
  } catch(e) {
    const short = e.message.split('\n')[0].slice(0,120);
    console.log(`✗ ${name}: ${short}`);
    results.push({name, status:'✗', error:short});
    fail++;
  }
}

async function scr(page, name) {
  const path = `/tmp/pw-test/scr_${name}.png`;
  await page.screenshot({path, fullPage:false}).catch(()=>{});
  screenshots.push(path);
}

async function gotoClean(page, url) {
  // Navigate first, then clear storage on the correct origin
  await page.goto(url, {waitUntil:'domcontentloaded', timeout:15000});
  await page.evaluate(()=>{ try{localStorage.clear();}catch(e){} });
  await page.reload({waitUntil:'domcontentloaded', timeout:15000});
}

async function setToken(page, tok) {
  await page.evaluate((t)=>{ localStorage.setItem('session_token',t); }, tok);
}

(async()=>{
  const browser = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx = await browser.newContext({viewport:{width:390,height:844}});
  const page = await ctx.newPage();

  // T1: landing opens (no token)
  await test('T1: лендинг открывается без токена', async()=>{
    await gotoClean(page, PRIVATE_URL);
    await page.waitForSelector('#icLanding', {state:'visible', timeout:10000});
    await scr(page,'T1_landing');
  });

  // T2: no token → landing shown, not SPA
  await test('T2: без токена → лендинг (не SPA)', async()=>{
    const landingVis = await page.$('#icLanding').then(el=>el?.isVisible());
    const appDisplay = await page.$('#icApp').then(el=>el?.evaluate(e=>e.style.display));
    if(!landingVis) throw new Error('Landing not visible');
    if(appDisplay==='flex') throw new Error('SPA visible without token');
  });

  // T3: with token + access → SPA shown
  await test('T3: с токеном + доступом → SPA (хаб)', async()=>{
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded', timeout:15000});
    await setToken(page, TOKEN);
    await page.reload({waitUntil:'domcontentloaded', timeout:15000});
    await page.waitForSelector('#icApp', {state:'visible', timeout:14000});
    await page.waitForSelector('#tab-home.active', {timeout:8000});
    await scr(page,'T3_spa_hub');
  });

  // helper: switch tab via JS (more reliable than click in headless)
  async function switchToTab(tab) {
    await page.evaluate((t)=>{ if(typeof switchTab==='function') switchTab(t); }, tab);
    await page.waitForSelector(`#tab-${tab}.active`, {timeout:8000});
  }

  // T4: materials tab → cards load
  await test('T4: таб Материалы → карточки загружаются', async()=>{
    await switchToTab('lib');
    await page.waitForFunction(()=>{
      const el=document.getElementById('libItems');
      return el && el.querySelectorAll('.lib-item').length>0;
    }, {timeout:14000});
    const count = await page.$$eval('.lib-item', els=>els.length);
    if(count===0) throw new Error('No items');
    console.log(`  → ${count} материалов`);
    await scr(page,'T4_library');
  });

  // T5: click material → detail opens
  await test('T5: клик на материал → детальный экран', async()=>{
    const firstItem = await page.$('.lib-item');
    if(!firstItem) throw new Error('No lib-item found');
    await firstItem.click({force:true});
    await page.waitForFunction(()=>{
      const d=document.getElementById('libDetail');
      return d && d.style.display!=='none';
    }, {timeout:8000});
    await scr(page,'T5_detail');
    await page.evaluate(()=>{ if(typeof closeLibDetail==='function') closeLibDetail(); });
    await page.waitForFunction(()=>{
      const l=document.getElementById('libList');
      return l && l.style.display!=='none';
    }, {timeout:5000});
  });

  // T6: chat tab → input form exists
  await test('T6: таб Алексей → форма отправки есть', async()=>{
    await switchToTab('chat');
    await page.evaluate(()=>{ if(typeof loadChatIfNeeded==='function') loadChatIfNeeded(); });
    await page.waitForSelector('#chatInput', {timeout:10000});
    await scr(page,'T6_chat');
  });

  // T7: send message → appears in chat
  await test('T7: отправить сообщение → появляется в чате', async()=>{
    const msg = 'UI-test-' + Date.now();
    await page.fill('#chatInput', msg);
    await page.keyboard.press('Control+Enter');
    await page.waitForFunction((m)=>{
      const el=document.querySelector('#chatMessages');
      return el && el.innerText.includes(m);
    }, msg, {timeout:12000});
    await scr(page,'T7_chat_sent');
  });

  // T8: labs tab → upload button
  await test('T8: таб Анализы → кнопка загрузки есть', async()=>{
    await switchToTab('labs');
    await page.evaluate(()=>{ if(typeof loadLabsIfNeeded==='function') loadLabsIfNeeded(); });
    await page.waitForSelector('#labsList', {state:'visible', timeout:8000});
    const btn = await page.$('#labsList button');
    if(!btn) throw new Error('Upload button not found');
    await scr(page,'T8_labs');
  });

  // T9: med card tab → form opens
  await test('T9: таб Карта → форма редактирования открывается', async()=>{
    await switchToTab('med');
    await page.waitForSelector('.ic-medcard-tabs', {timeout:8000});
    await scr(page,'T9_medcard');
  });

  // T10: profile tab → access date shown
  await test('T10: таб Профиль → дата доступа отображается', async()=>{
    await switchToTab('profile');
    await page.waitForFunction(()=>{
      const el=document.getElementById('profStatusLabel');
      return el && el.textContent.trim().length>3 && el.textContent.trim()!=='—';
    }, {timeout:10000});
    const status = await page.$eval('#profStatusLabel', el=>el.textContent.trim());
    console.log(`  → "${status}"`);
    await scr(page,'T10_profile');
  });

  // T11: admin.html without token → blocked
  await test('T11: admin.html без токена → заблокирован', async()=>{
    const p2 = await ctx.newPage();
    await p2.goto(ADMIN_URL, {waitUntil:'domcontentloaded', timeout:12000});
    await p2.evaluate(()=>localStorage.removeItem('session_token'));
    await p2.reload({waitUntil:'domcontentloaded', timeout:12000});
    await p2.waitForTimeout(4000);
    const loading = await p2.$eval('#admLoading', el=>el.textContent).catch(()=>'');
    const appDisplay = await p2.$('#admApp').then(el=>el?.evaluate(e=>e.style.display)).catch(()=>'none');
    if(appDisplay==='grid') throw new Error('Admin app visible without valid token');
    console.log(`  → blocked: "${loading.trim().slice(0,60)}"`);
    await scr(p2,'T11_admin_noauth');
    await p2.close();
  });

  // T12: admin.html with admin token → dashboard
  await test('T12: admin.html с admin-токеном → дашборд + счётчики', async()=>{
    const p3 = await ctx.newPage();
    await p3.goto(ADMIN_URL, {waitUntil:'domcontentloaded', timeout:12000});
    await setToken(p3, TOKEN);
    await p3.reload({waitUntil:'domcontentloaded', timeout:12000});
    await p3.waitForSelector('#admApp', {state:'visible', timeout:14000});
    await p3.waitForFunction(()=>{
      const vals=document.querySelectorAll('.adm-metric-val');
      return vals.length>=4;
    }, {timeout:8000});
    const metrics = await p3.$$eval('.adm-metric-val', els=>els.map(e=>e.textContent.trim()));
    console.log(`  → Счётчики: ${metrics.join(', ')}`);
    await scr(p3,'T12_admin');
    await p3.close();
  });

  await browser.close();

  console.log('\n════════════ ОТЧЁТ T-PRIVATE-012 ════════════');
  console.log(`Всего: ${pass+fail} | ✓ ${pass} | ✗ ${fail}`);
  results.forEach(r=>console.log(`${r.status} ${r.name}${r.error?' — '+r.error:''}`));
  console.log('Скриншоты: /tmp/pw-test/');
  fs.writeFileSync('/tmp/pw-test/report.json', JSON.stringify({pass,fail,results,screenshots}, null,2));
  process.exit(fail>0?1:0);
})();
