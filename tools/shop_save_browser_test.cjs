const assert=require('assert/strict'),path=require('path'),fs=require('fs');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const {store,service,clone}=require('./account_save_test.js');
const base=process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268',uid='shop-phone-browser-fixture';
const out=path.resolve(__dirname,'../../../outputs/shop-save-conflict-qa');fs.mkdirSync(out,{recursive:true});
(async()=>{
 store.set(uid,{uid,playerState:{credits:5000,collection:{standard_catcheurs_angelo_folena:1},careerUnlocked:0,starterGranted:true,welcomeClaimed:true,cosmeticInventory:{sleeves:{halloween:true}}},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'pc-import'}});
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.setViewport({width:1360,height:768,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
  let hold=false,release;
  for(const name of ['loadPlayerData','commitProgression'])await page.exposeFunction('__shop_'+name,async(...args)=>{
   assert.equal(args[0],uid);const result=await service[name](...args);
   if(name==='loadPlayerData'&&hold){hold=false;return new Promise(resolve=>release=()=>resolve(result))}return result;
  });
  await page.goto(base+'/index.html?mobile=1');await page.waitForFunction(()=>typeof hydrateCloudSaveForUser==='function');
  await page.evaluate(async uid=>{
   audioManager.stopMusic();document.getElementById('mobileEntryPlay')?.click();
   window.AllstarAuthService={getCurrentUser:async()=>({uid})};
   for(const name of ['loadPlayerData','commitProgression'])window.AllstarSaveService[name]=(...args)=>window['__shop_'+name](...args);
   await hydrateCloudSaveForUser({uid});loadPlayerState();loadDeckState();showShop();await pushCloudSaveNow();
  },uid);
  await page.waitForSelector('#shop.active');
  await page.waitForFunction(()=>{const b=document.querySelector('button[onclick*="buyBooster"][onclick*="classic"]'),r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))});
  hold=true;await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  const end=Date.now()+5000;while(!release&&Date.now()<end)await new Promise(r=>setTimeout(r,10));assert(release,'Foreground check sent a held read');
  await page.click('button[onclick*="buyBooster"][onclick*="classic"]');await page.evaluate(()=>pushCloudSaveNow());release();
  await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,50));await accountSaveChain});
  assert.equal(await page.evaluate(()=>accountSaveSession.conflict),false);
  if(store.get(uid).playerState.credits!==4750)console.error(await page.evaluate(()=>({credits:playerState.credits,status:document.getElementById('shopStatus')?.textContent,overlays:[...document.querySelectorAll('.overlay.active')].map(e=>e.id),screen:[...document.querySelectorAll('.screen.active')].map(e=>e.id),blocked:accountSaveSession?.blocked,conflict:accountSaveSession?.conflict})));
  assert.equal(store.get(uid).playerState.credits,4750);assert.equal(Object.values(store.get(uid).playerState.collection).reduce((a,b)=>a+b,0),6);
  await page.waitForFunction(()=>document.getElementById('boosterActions').classList.contains('active'));await page.evaluate(()=>closeBooster());
  // UI recovery retries only the same last-accepted account version.
  await page.evaluate(()=>{buyBooster('classic');closeBooster();clearTimeout(cloudSaveSyncTimer);accountSaveSession.conflict=true;document.getElementById('accountSaveConflict').classList.add('active')});
  await page.screenshot({path:out+'/safe-retry-dialog.png'});
  await page.click('button[onclick="retryPendingAccountSave()"]');
  await page.waitForFunction(()=>!document.getElementById('accountSaveConflict').classList.contains('active'));
  assert.equal(store.get(uid).playerState.credits,4500);assert.equal(Object.values(store.get(uid).playerState.collection).reduce((a,b)=>a+b,0),11);
  store.get(uid).playerState.credits=4400;const foreign=clone(store.get(uid));
  await page.evaluate(()=>checkAccountProgressOnResume());
  await page.click('button[onclick="retryPendingAccountSave()"]');
  await page.waitForFunction(()=>document.getElementById('accountSaveConflictMessage').textContent.includes('autre progression'));
  assert.deepEqual(store.get(uid),foreign,'Real other-device changes remain protected');assert.deepEqual(errors,[]);
  console.log('Shop browser: real foreground event plus actual pack purchase, late read without false conflict; safe retry retains both bought packs, foreign write still blocks, no page errors. Fake account only.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
