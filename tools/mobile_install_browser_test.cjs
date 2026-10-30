const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const puppeteer = require(process.env.ALLSTAR_TEST_PUPPETEER || 'puppeteer-core');
const base = (process.env.ALLSTAR_TEST_URL || 'http://127.0.0.1:8268').replace(/\/$/, '');
const output = path.resolve(__dirname, '../../../outputs/mobile-install-qa');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.ALLSTAR_TEST_BROWSER, headless: true, pipe: true, args: ['--no-sandbox'] });
  try {
    async function tap(frame, selector) {
      const point = await frame.$eval(selector, el => {
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      const p = frame.page();
      const rect = await p.$eval('iframe', el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, scale: r.width / el.clientWidth }; });
      await p.touchscreen.tap(rect.x + point.x * rect.scale, rect.y + point.y * rect.scale);
    }
    async function page(userAgent, installed = false) {
      const p = await browser.newPage();
      await p.evaluateOnNewDocument(() => addEventListener('beforeinstallprompt', event => {
        if (event.isTrusted) { event.preventDefault(); event.stopImmediatePropagation(); }
      }));
      await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true });
      if (userAgent) await p.setUserAgent(userAgent);
      if (installed) await p.evaluateOnNewDocument(() => {
        const original = matchMedia;
        window.matchMedia = query => query.includes('display-mode: standalone') ? { matches: true, addEventListener() {} } : original(query);
      });
      await p.goto(base + '/');
      const frame = await (await p.$('iframe')).contentFrame();
      await frame.waitForSelector('#mobileCardViewer');
      return { p, frame };
    }
    const android = await page('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36');
    const { p, frame: f } = android;
    await f.waitForSelector('#mobileEntryPlay');
    assert.equal(await f.$eval('#saveScreen', el => el.inert), true);
    assert.deepEqual(await f.$$eval('#mobileEntryChoices button', els => els.map(el => el.textContent)), ['Jouer', 'Installer']);
    assert.equal(await f.$$eval('[id]', els => new Set(els.map(el => el.id)).size === els.length), true, 'No duplicated account IDs');
    await p.screenshot({ path: output + '/entry-android.png' });
    await tap(f, '#mobileEntryInstall');
    await f.waitForSelector('#mobileInstallGuide', {visible: true});
    assert.match(await f.$eval('#mobileInstallSteps', el => el.textContent), /menu du navigateur/);
    await p.screenshot({ path: output + '/guide-android.png' });
    await p.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async value => { window.copiedLink = value; }
    } }));
    await tap(f, '#mobileInstallCopy');
    await f.waitForFunction(() => document.getElementById('mobileInstallStatus').textContent.includes('Lien copié'));
    assert.equal(await p.evaluate(() => copiedLink), 'https://allstar-mobile-65102.web.app/');
    await p.evaluate(() => { navigator.clipboard.writeText = async () => { throw Error('Clipboard unavailable'); }; });
    await tap(f, '#mobileInstallCopy');
    await f.waitForFunction(() => document.getElementById('mobileInstallStatus').textContent.includes('Lien à copier : https://allstar-mobile-65102.web.app/'));
    // Exercise real click wiring with synthetic browser events; no claim of a native prompt here.
    await tap(f, '#mobileInstallBack');
    await p.evaluate(() => {
      window.promptCalls = 0;
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { promptCalls++; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'dismissed' });
      dispatchEvent(e);
      if (!e.defaultPrevented) throw Error('Browser prompt was not retained');
    });
    await tap(f, '#mobileEntryInstall');
    await f.waitForFunction(() => document.getElementById('mobileInstallStatus').textContent.includes('plus tard'));
    assert.equal(await p.evaluate(() => promptCalls), 1);
    await tap(f, '#mobileInstallBack');
    await p.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true });
      e.prompt = () => { promptCalls++; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      dispatchEvent(e);
    });
    await tap(f, '#mobileEntryInstall');
    await f.waitForFunction(() => document.getElementById('mobileInstallStatus').textContent.includes('Installation demandée'));
    assert.equal(await p.evaluate(() => promptCalls), 2);
    await tap(f, '#mobileInstallBack');
    await p.evaluate(() => dispatchEvent(new Event('appinstalled')));
    assert.equal(await f.$eval('#mobileEntryInstall', el => el.disabled), true);
    await f.evaluate(() => { parent.requestAllstarLandscape = async () => {}; });
    await tap(f, '#mobileEntryPlay');
    assert.equal(await f.$('#mobileEntryScreen'), null);
    assert.equal(await f.$eval('#saveScreen', el => el.inert), false);
    await tap(f, '#openLoginButton');
    assert.equal(await f.$eval('#accountLoginView', el => el.classList.contains('active')), true);
    const iphone = await page('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1');
    await tap(iphone.frame, '#mobileEntryInstall');
    assert.match(await iphone.frame.$eval('#mobileInstallSteps', el => el.textContent), /Safari.*Partager.*Sur l’écran d’accueil/);
    await iphone.p.screenshot({ path: output + '/guide-iphone.png' });
    for (const [device, ua, target] of [
      ['android', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Instagram 350.0.0 Android', 'Chrome'],
      ['iphone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Instagram 350.0.0', 'Safari']
    ]) {
      const ig = await page(ua);
      assert.equal(await ig.frame.$eval('#mobileInstagramNotice', el => el.hidden), false);
      await tap(ig.frame, '#mobileEntryInstall');
      await ig.frame.waitForSelector('#mobileInstallGuide', {visible:true});
      const steps = await ig.frame.$eval('#mobileInstallSteps', el => el.textContent);
      assert.match(steps, /menu ⋯ ou ⋮ d’Instagram/);
      assert.ok(steps.includes(target));
      assert.match(steps, /touche à nouveau Installer/);
      await ig.p.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async value=>{window.copiedLink=value}} }));
      await tap(ig.frame, '#mobileInstallCopy');
      await ig.frame.waitForFunction(target=>document.getElementById('mobileInstallStatus').textContent.includes(`Ouvre ${target}`),{},target);
      assert.equal(await ig.p.evaluate(()=>copiedLink),'https://allstar-mobile-65102.web.app/');
      await ig.p.screenshot({path:output+`/guide-instagram-${device}.png`});
      await ig.p.close();
    }
    const installed = await page(null, true);
    assert.equal(await installed.frame.$('#mobileEntryScreen'), null, 'Installed launch skips installation gate');
    const desktop = await browser.newPage();
    await desktop.goto(f.url().split('?')[0]);
    assert.equal(await desktop.$('#mobileEntryScreen'), null, 'Desktop connection is unchanged');
    console.log('Mobile entry: Android/iPhone and Instagram guides, copy, delayed install availability, dismissal, appinstalled, Play/login, installed/desktop isolation OK. Native prompts and Instagram user agents simulated; no physical iPhone test.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
