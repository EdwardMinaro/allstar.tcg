const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const {store,service,clone}=require('./account_save_test.js');
const base=(process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268').replace(/\/$/,'');
const out=process.env.ALLSTAR_TEST_OUTPUT||path.resolve(__dirname,'../../../outputs/save-setup-qa');fs.mkdirSync(out,{recursive:true});
const uid='browser-fixture-owner',a='standard_catcheurs_angelo_folena',b='rare_catcheurs_rayen_gurzil';
const cloud={uid,level:23,careerXpWins:{career_24_Final:true},playerState:{credits:350,collection:{[a]:1,[b]:1},careerUnlocked:3,starterGranted:true,welcomeClaimed:true},deckState:{decks:[{id:'same',name:'Mobile',cards:[b]}]}};
const pcPlayer={credits:50,collection:{[a]:8},careerUnlocked:24,starterGranted:true,welcomeClaimed:true,profileProgress:{uid,level:23}};
const pcDecks={decks:[{id:'same',name:'PC',cards:[a]}],selectedId:'same'};
(async()=>{
 store.set(uid,clone(cloud));
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  async function newPage(mobile){
   const context=await browser.createBrowserContext(),page=await context.newPage();
   await page.setViewport(mobile?{width:844,height:390,isMobile:true,hasTouch:true}:{width:1360,height:768});
   await page.setRequestInterception(true);
   page.on('request',req=>req.url().startsWith(base+'/')||req.url().startsWith('data:')?req.continue():req.abort());
   for(const name of ['loadPlayerData','commitProgression','registerPcSaveExport','verifyCurrentSaveSource'])await page.exposeFunction('__setup_'+name,async(...args)=>{assert.equal(args[0],uid);return service[name](...args)});
   return {page,context};
  }
  const phone=await newPage(true);await phone.page.goto(base+'/');
  const f=await(await phone.page.$('iframe')).contentFrame();await f.waitForSelector('#mobileCardViewer');
  if(await f.$('#mobileEntryPlay'))await f.$eval('#mobileEntryPlay',el=>el.click());
  const gameUrl=f.url().split('?')[0];
  async function bind(frame,desktop){
   await frame.evaluate(({uid,desktop})=>{
    audioManager.stopMusic();window.AllstarAuthService={getCurrentUser:async()=>({uid})};
    for(const name of ['loadPlayerData','commitProgression','registerPcSaveExport','verifyCurrentSaveSource'])window.AllstarSaveService[name]=(...args)=>window.parent['__setup_'+name](...args);
    if(desktop)window.AllstarDesktop={isElectron:true,exportSave:async()=>({canceled:true})};
   },{uid,desktop});
  }
  async function tap(selector){
   const point=await f.$eval(selector,el=>{el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
   const rect=await phone.page.$eval('iframe',el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,scale:r.width/el.clientWidth}});
   await phone.page.touchscreen.tap(rect.x+point.x*rect.scale,rect.y+point.y*rect.scale);
  }
  await bind(f,false);
  const openGuide=()=>f.evaluate(async uid=>{try{await hydrateCloudSaveForUser({uid});throw Error('Expected setup gate')}catch(error){if(error.code!=='allstar/save-setup-required')throw error}},uid);
  await openGuide();await phone.page.screenshot({path:out+'/mobile-first-connection.png'});
  await tap('#accountSaveSetup button[onclick="setupSaveLater()"]');
  assert.deepEqual(store.get(uid),cloud);
  assert.equal(await f.$eval('#accountSaveSetup',el=>el.classList.contains('active')),false);
  await openGuide();
  const pc=await newPage(false);await pc.page.goto(gameUrl);await bind(pc.page,true);
  await pc.page.evaluate(async({uid,pcPlayer,pcDecks})=>{
   localStorage.setItem('allstarsPlayerV1',JSON.stringify(pcPlayer));localStorage.setItem('allstarsDecks',JSON.stringify(pcDecks));
   try{await hydrateCloudSaveForUser({uid});throw Error('Expected PC protection')}catch(error){if(error.code!=='allstar/save-protection')throw error}
  },{uid,pcPlayer,pcDecks});
  await pc.page.screenshot({path:out+'/pc-protected-source.png'});
  await pc.page.click('#pcProtectedExport button[onclick="preparePcAccountLink()"]');
  await pc.page.waitForFunction(()=>document.getElementById('pcProtectedExportStatus').textContent.includes('préparée'));
  assert.deepEqual(store.get(uid).playerState,cloud.playerState);
  assert.equal(store.get(uid).pendingPcTransfer.bundle.playerState.credits,50);
  await tap('#accountSaveSetup button[onclick="receivePreparedPcSave()"]');
  await f.waitForFunction(()=>!document.getElementById('accountTransferConfirm').hidden);
  assert.match(await f.$eval('#accountTransferReview',el=>el.textContent),/Copie PC vérifiée/);
  assert.equal(await f.$eval('#accountTransferFile',el=>el.hidden),true,'Fileless flow does not show a misleading empty file picker');
  assert.match(await f.$eval('#accountTransferTitle',el=>el.textContent),/liaison/);
  await phone.page.screenshot({path:out+'/mobile-pc-comparison.png'});
  assert.deepEqual(store.get(uid).playerState,cloud.playerState);
  await tap('#accountTransferConfirm');
  await f.waitForFunction(()=>!document.getElementById('accountTransferOverlay').classList.contains('active'));
  assert.equal(store.get(uid).playerState.credits,50);assert.equal(store.get(uid).playerState.careerUnlocked,24);
  assert.equal(store.get(uid).collection[a],8);assert.equal(store.get(uid).collection[b],1);
  assert.equal(store.get(uid).saveLinkVerified.source,'pc-import');assert.equal(store.get(uid).pendingPcTransfer,null);
  await pc.page.evaluate(async uid=>hydrateCloudSaveForUser({uid}),uid);
  const loaded=await pc.page.evaluate(uid=>JSON.parse(localStorage.getItem(`allstarsPlayerV1:account:${uid}`)),uid);
  assert.equal(loaded.credits,50);assert.equal(loaded.collection[b],1);
  console.log('Browser guided link: real mobile touch, Later unchanged, native-PC source protected/prepared, fileless receipt, read-only comparison, explicit confirmation and PC reload OK. Firebase/auth simulated; external traffic blocked.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
