const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const {store,service,clone}=require('./account_save_test.js');
const base=process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268',out=path.resolve(__dirname,'../../../outputs/protected-local-sync-qa');fs.mkdirSync(out,{recursive:true});
const key='standard_catcheurs_angelo_folena',ult='ultime_catcheurs_marc_sebire';
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  async function setup(name,missing=false){
   const uid='browser-protected-'+name,remote={uid,level:1,playerState:{credits:5000,collection:{[key]:1,[ult]:1},careerUnlocked:0,starterGranted:true,welcomeClaimed:true},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'pc-import'}};
   const local={...clone(remote.playerState),credits:4750,collection:missing?{[key]:100}:{[key]:6,[ult]:1},profileProgress:{uid}};store.set(uid,clone(remote));
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
   await page.setViewport({width:1360,height:768,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
   await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
   for(const name of ['loadPlayerData','commitProtectedLocalProgression','commitProgression'])await page.exposeFunction('__protected_'+name,async(id,...args)=>{assert.equal(id,uid);return service[name](id,...args)});
   await page.goto(base+'/index.html?mobile=1');await page.waitForFunction(()=>typeof hydrateCloudSaveForUser==='function');
   await page.evaluate(async({uid,local,decks})=>{
    audioManager.stopMusic();document.getElementById('mobileEntryPlay')?.click();window.AllstarAuthService={getCurrentUser:async()=>({uid})};
    for(const name of ['loadPlayerData','commitProtectedLocalProgression','commitProgression'])window.AllstarSaveService[name]=(...args)=>window['__protected_'+name](...args);
    window.AllstarSaveService.claimMobileLaunchGift=async()=>null;
    localStorage.setItem('allstarsPlayerV1:account:'+uid,JSON.stringify(local));localStorage.setItem('allstarsDecks:account:'+uid,JSON.stringify(decks));
    try{await hydrateCloudSaveForUser({uid});throw Error('Expected protected local gate')}catch(e){if(e.code!=='allstar/save-protection')throw e}
   },{uid,local,decks:remote.deckState});
   await page.waitForSelector('#accountSaveProtection.active');return {uid,remote,local,context,page,errors};
  }
  const good=await setup('good');await good.page.click('#reviewProtectedLocalSyncButton');await good.page.waitForFunction(()=>!document.getElementById('confirmProtectedLocalSyncButton').hidden);
  assert.deepEqual(store.get(good.uid),good.remote);assert.match(await good.page.$eval('#protectedCopyStatus',e=>e.textContent),/4750/);
  await good.page.screenshot({path:out+'/comparison-before-sync.png'});
  await good.page.click('#confirmProtectedLocalSyncButton');await good.page.waitForFunction(()=>!document.getElementById('accountSaveProtection').classList.contains('active'));
  assert.equal(store.get(good.uid).playerState.credits,4750);assert.equal(store.get(good.uid).collection[key],6);assert.equal(store.get(good.uid).collection[ult],1);
  assert.equal(store.get(good.uid).cloudSaveHistory.baseline.playerState.credits,5000);assert.equal(store.get(good.uid).cloudSaveHistory.verifiedSource.playerState.credits,4750);
  assert.equal(await good.page.evaluate(()=>Boolean(accountSaveSession?.blocked)),false);assert.deepEqual(good.errors,[]);await good.context.close();
  const missing=await setup('missing',true);await missing.page.click('#reviewProtectedLocalSyncButton');await missing.page.waitForFunction(()=>document.getElementById('protectedCopyStatus').textContent.includes('Synchronisation refusée'));
  assert.equal(await missing.page.$eval('#confirmProtectedLocalSyncButton',e=>e.hidden),true);assert.deepEqual(store.get(missing.uid),missing.remote);assert.deepEqual(missing.errors,[]);await missing.context.close();
  const race=await setup('race');await race.page.click('#reviewProtectedLocalSyncButton');await race.page.waitForFunction(()=>!document.getElementById('confirmProtectedLocalSyncButton').hidden);
  store.get(race.uid).playerState.credits=4900;const concurrent=clone(store.get(race.uid));await race.page.click('#confirmProtectedLocalSyncButton');await race.page.waitForFunction(()=>document.getElementById('protectedCopyStatus').textContent.includes('compte a changé'));
  assert.deepEqual(store.get(race.uid),concurrent);assert.equal(await race.page.evaluate(()=>accountSaveSession.blocked),true);assert.deepEqual(race.errors,[]);await race.context.close();
  console.log('Protected sync browser: phone-mode protection screen, read-only comparison, explicit confirmation restores the bought pack, both backups, more total cards with missing Ultimate refused, concurrent server write refused, zero page errors. Fake accounts only.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
