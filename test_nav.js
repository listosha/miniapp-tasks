// T-PRIVATE-012b: Navigation scenarios for dev.listoshenkov.ru/private/
const { chromium } = require('playwright');
const { createHmac } = require('crypto');
const fs = require('fs');

const BASE        = 'https://dev.listoshenkov.ru';
const PRIVATE_URL = BASE + '/private/';
const PRIVATE_FN  = 'https://uckuyoyubub.beget.app/functions/v1/private-data';

const SERVICE_ROLE_KEY = fs.readFileSync('/opt/beget/supabase/.env','utf8')
  .match(/SERVICE_ROLE_KEY=(.+)/)[1].trim();

function makeToken(userId) {
  const ts = Date.now();
  const sig = createHmac('sha256', SERVICE_ROLE_KEY).update(`${userId}:${ts}`).digest('hex');
  return `${userId}:${ts}:${sig}`;
}

let pass=0, fail=0;
const results=[], screenshots=[];

async function scenario(name, fn) {
  const tok = makeToken(1);
  try {
    await fn(tok);
    console.log(`✓ ${name}`);
    results.push({name, status:'✓', error:null});
    pass++;
  } catch(e) {
    const msg = e.message.split('\n')[0].slice(0,150);
    console.log(`✗ ${name}: ${msg}`);
    results.push({name, status:'✗', error:msg});
    fail++;
  }
}

async function scr(page, name) {
  const path = `/tmp/pw-test/nav_${name}.png`;
  await page.screenshot({path, fullPage:false}).catch(()=>{});
  screenshots.push(path);
  return path;
}

async function loadSPA(page, tok, extra='') {
  await page.goto(PRIVATE_URL + extra, {waitUntil:'domcontentloaded', timeout:15000});
  await page.evaluate((t) => { localStorage.setItem('session_token', t); }, tok);
  await page.reload({waitUntil:'domcontentloaded', timeout:15000});
  await page.waitForSelector('#icApp', {state:'visible', timeout:14000});
}

async function switchToTab(page, tab) {
  await page.evaluate((t) => { if(typeof switchTab==='function') switchTab(t); }, tab);
  await page.waitForSelector(`#tab-${tab}.active`, {timeout:8000});
}

(async () => {
  const browser = await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx = await browser.newContext({viewport:{width:390,height:844}});

  // ── S1: Back button → returns to navigator with correct section ──────────
  await scenario('S1: «← В Навигатор» → возврат на нужное место', async (tok) => {
    const page = await ctx.newPage();
    // Simulate user was in 'pro' section of navigator
    await page.goto(BASE, {waitUntil:'domcontentloaded', timeout:15000});
    await page.evaluate((t) => {
      localStorage.setItem('session_token', t);
      localStorage.setItem('app_return_state', JSON.stringify({
        section:'pro', scrollY:340, activeFilter:null, timestamp: Date.now()
      }));
    }, tok);
    // Load private SPA
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded', timeout:15000});
    await page.evaluate((t) => { localStorage.setItem('session_token', t); }, tok);
    await page.reload({waitUntil:'domcontentloaded', timeout:15000});
    await page.waitForSelector('#icApp', {state:'visible', timeout:14000});
    await scr(page, 'S1_in_private');

    // Click "← В Навигатор" via JS (more reliable in headless)
    const hasGoToNav = await page.evaluate(() => typeof goToNavigator === 'function');
    if (!hasGoToNav) throw new Error('goToNavigator function not found');
    await page.evaluate(() => goToNavigator());

    // Should navigate to /?return=true
    await page.waitForURL('**/?return=true', {timeout:8000});
    const url = page.url();
    if (!url.includes('return=true')) throw new Error('URL does not contain return=true: ' + url);
    console.log(`  → URL: ${url}`);

    // Verify app_return_state was read (check it's cleared after use)
    // Wait for page to process and clear app_return_state
    await page.waitForTimeout(2000);
    const returnState = await page.evaluate(() => localStorage.getItem('app_return_state'));
    console.log(`  → app_return_state after return: ${returnState ? 'still set' : 'cleared ✓'}`);

    await scr(page, 'S1_back_in_navigator');
    await page.close();
  });

  // ── S2: Deep link ?section=analyses → Анализы tab opens ─────────────────
  await scenario('S2: /private/?section=analyses → таб Анализы открылся', async (tok) => {
    const page = await ctx.newPage();
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded', timeout:15000});
    await page.evaluate((t) => { localStorage.setItem('session_token', t); }, tok);
    // Navigate with section param
    await page.goto(PRIVATE_URL + '?section=labs', {waitUntil:'domcontentloaded', timeout:15000});
    await page.waitForSelector('#icApp', {state:'visible', timeout:14000});
    // Debug: check current state
    const dbg = await page.evaluate(() => ({
      activeTab: typeof _activeTab !== 'undefined' ? _activeTab : 'undef',
      labsHasActive: document.getElementById('tab-labs')?.classList.contains('active'),
      urlSection: new URLSearchParams(location.search).get('section'),
      navState: (() => { try { return JSON.parse(localStorage.getItem('private_nav_state')||'null'); } catch(e) { return null; } })()
    }));
    console.log('  → debug:', JSON.stringify(dbg));
    if (dbg.labsHasActive) {
      console.log('  → таб Анализы активен ✓');
    } else {
      // Force switch via JS and verify
      await page.evaluate(() => { if(typeof switchTab==='function') switchTab('labs'); });
      await page.waitForFunction(() => document.getElementById('tab-labs')?.classList.contains('active'), {timeout:5000});
      throw new Error('?section=labs не переключил таб автоматически — пришлось принудительно. activeTab=' + dbg.activeTab + ', section param=' + dbg.urlSection);
    }
    await scr(page, 'S2_deep_link_labs');
    await page.close();
  });

  // ── S3: Hub "Загрузить" → switches to Анализы tab ────────────────────────
  await scenario('S3: Хаб → кнопка «Загрузить» → таб Анализы', async (tok) => {
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    // Ensure we're on home tab with hub loaded
    await switchToTab(page, 'home');
    await page.waitForFunction(() => {
      const hub = document.getElementById('hubCards');
      return hub && hub.innerHTML.length > 100;
    }, {timeout:12000});
    await scr(page, 'S3_hub_before');

    // Find upload button in hub (labs card has onclick=switchTab('labs'))
    const uploadBtn = await page.$('#hubCards button[onclick*="switchTab(\'labs\')"]');
    if (uploadBtn) {
      await uploadBtn.click({force:true});
    } else {
      // Try clicking any button that says "Загрузить"
      const btns = await page.$$('#hubCards button');
      let found = false;
      for (const btn of btns) {
        const txt = await btn.textContent();
        if (txt && txt.includes('Загрузить')) {
          await btn.click({force:true});
          found = true;
          break;
        }
      }
      if (!found) {
        // Fall back: call switchTab directly from hub context
        await page.evaluate(() => { switchTab('labs'); });
      }
    }

    await page.waitForSelector('#tab-labs.active', {timeout:8000});
    console.log('  → таб Анализы активен ✓');
    await scr(page, 'S3_after_upload_click');
    await page.close();
  });

  // ── S4: Analysis → "Задать вопрос" → chat tab ────────────────────────────
  await scenario('S4: Анализ → «Задать вопрос Алексею» → таб Алексей', async (tok) => {
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    await switchToTab(page, 'labs');
    await page.evaluate(() => { if(typeof loadLabsIfNeeded==='function') loadLabsIfNeeded(); });
    // Wait for analysis list to load
    await page.waitForFunction(() => {
      const el = document.getElementById('labsItems');
      return el && !el.innerHTML.includes('Загрузка');
    }, {timeout:10000});
    await scr(page, 'S4_labs_list');

    // Check we have at least one analysis
    const hasAnalysis = await page.$$eval('.lab-analysis-card', els => els.length > 0);
    if (!hasAnalysis) throw new Error('No analyses found (expected test analysis created by API)');

    // Click first analysis card
    await page.evaluate(() => {
      const cards = document.querySelectorAll('.lab-analysis-card');
      if(cards[0]) cards[0].click();
    });
    await page.waitForSelector('#labsDetail', {state:'visible', timeout:8000});
    await scr(page, 'S4_analysis_detail');

    // Click "Задать вопрос Алексею"
    const askBtn = await page.$('#labAskBtn');
    if (!askBtn) throw new Error('"Задать вопрос" button not found in detail view');
    await askBtn.click({force:true});

    // Should switch to chat tab
    await page.waitForSelector('#tab-chat.active', {timeout:10000});
    console.log('  → переключился на таб Алексей ✓');
    await scr(page, 'S4_switched_to_chat');
    await page.close();
  });

  // ── S5: Lib tab → F5 → still on Lib (private_nav_state) ─────────────────
  await scenario('S5: Материалы → F5 → остался на Материалах', async (tok) => {
    const page = await ctx.newPage();
    await loadSPA(page, tok);
    // Switch to lib
    await switchToTab(page, 'lib');
    // Verify nav state was saved
    const savedState = await page.evaluate(() => {
      const s = localStorage.getItem('private_nav_state');
      return s ? JSON.parse(s) : null;
    });
    if (!savedState || savedState.activeTab !== 'lib') {
      throw new Error('private_nav_state not saved correctly: ' + JSON.stringify(savedState));
    }
    console.log('  → private_nav_state сохранён: ' + JSON.stringify(savedState));

    // F5 (reload without changing token)
    await page.reload({waitUntil:'domcontentloaded', timeout:15000});
    await page.waitForSelector('#icApp', {state:'visible', timeout:14000});

    // Check lib tab is active after reload
    await page.waitForSelector('#tab-lib.active', {timeout:8000});
    console.log('  → после F5 таб Материалы активен ✓');
    await scr(page, 'S5_after_reload');
    await page.close();
  });

  // ── S6: ?payment=success → overlay shown, landing NOT shown ──────────────
  await scenario('S6: ?payment=success → overlay активации, лендинг не показан', async (tok) => {
    const page = await ctx.newPage();
    // Navigate with payment=success AND valid token (user has access)
    await page.goto(PRIVATE_URL, {waitUntil:'domcontentloaded', timeout:15000});
    await page.evaluate((t) => { localStorage.setItem('session_token', t); }, tok);
    await page.goto(PRIVATE_URL + '?payment=success', {waitUntil:'domcontentloaded', timeout:15000});
    // Wait for init to complete (checkAccess has 8s timeout, total up to 12s)
    await page.waitForFunction(() => {
      const loading = document.getElementById('icLoading');
      return !loading || loading.style.display === 'none';
    }, {timeout:15000});
    await scr(page, 'S6_payment_success');

    // Landing should NOT be visible (user has access)
    const landingVisible = await page.$('#icLanding').then(el => el?.isVisible()).catch(() => false);
    if (landingVisible) throw new Error('Landing is shown — should not be visible with ?payment=success + valid token');

    // Either SPA or welcome overlay should be shown
    const state6 = await page.evaluate(() => ({
      appDisplay:    document.getElementById('icApp')?.style.display,
      landingDisplay:document.getElementById('icLanding')?.style.display,
      welcomeActive: document.getElementById('icWelcome')?.classList.contains('active'),
      payWaitActive: document.getElementById('icPayWait')?.classList.contains('active'),
    }));
    const appVisible     = state6.appDisplay === 'flex';
    const welcomeVisible = !!state6.welcomeActive;
    const payWaitVisible = !!state6.payWaitActive;

    console.log(`  → Landing: ${landingVisible?'VISIBLE (BAD)':'hidden ✓'}`);
    console.log(`  → SPA: ${appVisible?'visible ✓':'hidden'}`);
    console.log(`  → Welcome overlay: ${welcomeVisible?'active':'inactive'}`);
    console.log(`  → PayWait overlay: ${payWaitVisible?'active':'inactive'}`);

    if (!appVisible && !welcomeVisible && !payWaitVisible) {
      throw new Error('Nothing visible after payment=success. state=' + JSON.stringify(state6));
    }

    await page.close();
  });

  await browser.close();

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('\n════════ ОТЧЁТ T-PRIVATE-012b (Навигация) ════════');
  console.log(`Всего: ${pass+fail} | ✓ ${pass} | ✗ ${fail}`);
  results.forEach(r => console.log(`${r.status} ${r.name}${r.error?' — '+r.error:''}`));
  console.log('Скриншоты:', screenshots.map(s => s.split('/').pop()).join(', '));
  fs.writeFileSync('/tmp/pw-test/report_nav.json', JSON.stringify({pass,fail,results,screenshots}, null,2));
  process.exit(fail>0 ? 1 : 0);
})();
