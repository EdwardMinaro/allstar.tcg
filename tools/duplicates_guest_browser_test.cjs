const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const puppeteer=require(process.env.ALLSTAR_TEST_PUPPETEER||'puppeteer-core');
const {service,store,clone}=require('./account_save_test.js');
const base=process.env.ALLSTAR_TEST_URL||'http://127.0.0.1:8268',out=path.resolve(__dirname,'../../../outputs/duplicates-guest-qa');fs.mkdirSync(out,{recursive:true});
const standard='standard_catcheurs_angelo_folena',marc='ultime_catcheurs_marc_sebire';
const names=['loadPlayerData','commitProgression','commitGuestTransfer','claimMobileLaunchGift','acknowledgeMobileLaunchGift','claimPersonalRewards','acknowledgePersonalReward'];
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.ALLSTAR_TEST_BROWSER,headless:true,pipe:true,args:['--no-sandbox']});
 try{
  async function client(mobile){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport(mobile?{width:844,height:390,isMobile:true,hasTouch:true}:{width:1360,height:768});
   await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base+'/')||r.url().startsWith('data:')?r.continue():r.abort());
   for(const name of names)await page.exposeFunction('__qa_'+name,(...args)=>service[name](...args));
   await page.exposeFunction('__qa_register',async()=>{const uid='new-guest-browser';store.set(uid,{uid,level:1,totalXp:0,pseudo:'Invité devenu joueur'});return {user:{uid,displayName:'Invité devenu joueur'},profile:{level:1}}});
   await page.goto(base+(mobile?'/':'/index.html'));
   const frame=mobile?await(await page.waitForSelector('iframe')).contentFrame():page.mainFrame();await frame.waitForFunction(()=>typeof startGuestMode==='function');
   await frame.evaluate(names=>{
    window.qaUser=null;audioManager.stopMusic();
    for(const name of names)AllstarSaveService[name]=(...args)=>window.parent['__qa_'+name](...args);
    AllstarAuthService={getCurrentUser:async()=>window.qaUser,logoutUser:async()=>{window.qaUser=null},registerUser:async()=>{const r=await window.parent.__qa_register();window.qaUser=r.user;return r}};
    AllstarFirebaseService.currentUser=()=>window.qaUser;
    showHalloweenAnnouncement=()=>{};
    if(document.getElementById('mobileEntryPlay'))document.getElementById('mobileEntryPlay').click();
   },names);
   return {context,page,frame,errors};
  }
  const guest=await client(true),f=guest.frame;
  await f.evaluate(async()=>{await startGuestMode();await new Promise(r=>setTimeout(r,700));});
  const initial=await f.evaluate(()=>serializedPlayerState());assert.equal(initial.credits,0);assert.equal(initial.welcomeClaimed,true);assert(!initial.cosmeticInventory.sleeves.halloween);assert(initial.guestOrigin.id);assert.equal(Object.values(initial.collection).reduce((a,n)=>a+n,0),20);
  assert.equal(await f.evaluate(()=>deckLaunchMessage(selectedDeck())),'');
  await f.waitForFunction(()=>document.getElementById('boosterActions').classList.contains('active'));
  assert.equal(await f.$eval('#boosterTitle',e=>e.textContent),'Pack Champion offert');
  assert.equal(await f.$$eval('#boosterCards .booster-reveal',cards=>cards.length),5);
  await guest.page.screenshot({path:path.join(out,'guest-champion-mobile.png')});
  await f.evaluate(()=>closeBooster());await f.waitForFunction(()=>!startupRewardsPending);
  await f.evaluate(key=>{G=null;awardMatchCredits(true);addCardsToCollection([cloneCard(cardByKey(key)),cloneCard(cardByKey(key)),cloneCard(cardByKey(key))]);savePlayerState();},standard);
  assert.equal(await f.evaluate(key=>ownedCount(key),standard),2);
  await f.evaluate(async()=>{await beginGuestTransfer();showAccountCreate();await createAccountFromStart();});
  await f.waitForSelector('#guestTransferOverlay.active');
  assert.match(await f.$eval('#guestTransferWarning',e=>e.textContent),/cadeaux invités sont conservés/);
  await guest.page.screenshot({path:path.join(out,'new-account-review-mobile.png')});
  const before=clone(store.get('new-guest-browser'));assert(!before.playerState,'Preview creates no game progression');
  await f.$eval('#guestTransferConfirm',e=>e.click());
  await f.waitForFunction(()=>!document.getElementById('guestTransferOverlay').classList.contains('active'));
  await f.waitForFunction(()=>Boolean(accountSaveSession)&&!accountSaveSession.dirty);
  assert(store.get('new-guest-browser').guestTransferReceipt);
  assert.equal(store.get('new-guest-browser').guestTransferBackup.playerState.credits,await f.evaluate(()=>JSON.parse(localStorage.getItem('allstarsPlayerV1:guest')).credits));
  assert(await f.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('allstarsPlayerV1:guest')).guestOrigin.consumedBy)));
  await f.waitForFunction(()=>Boolean(playerState.welcomeClaimed));assert.equal(guest.errors.length,0);
  await guest.context.close();
  const existing=await client(false),e=existing.frame,uid='existing-guest-browser';
  const original={uid,level:1,elo:1555,playerState:{credits:400,collection:{[standard]:2},careerUnlocked:0,starterGranted:true,welcomeClaimed:true},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'pc-import'},campaignRewards:{mobile_launch_2026_11:{cardKey:marc,presentedAt:1}}};store.set(uid,clone(original));
  await e.evaluate(async({uid,standard,marc})=>{
   window.qaUser={uid};await hydrateCloudSaveForUser(window.qaUser);loadPlayerState();loadDeckState();
   localStorage.setItem('allstarsPlayerV1:guest',JSON.stringify({credits:9999,collection:{[standard]:2,[marc]:1},careerUnlocked:3,starterGranted:true,welcomeClaimed:true,guestOrigin:{schema:1,id:'legacy-guest-browser-00000001',legacy:true},limitedRewards:{milestone_50_players_2026:1}}));localStorage.setItem('allstarsDecks:guest',JSON.stringify({decks:[]}));
   G=null;await beginGuestTransfer();
  },{uid,standard,marc});
  assert.match(await e.$eval('#guestTransferWarning',el=>el.textContent),/Attention : les cadeaux uniques ne seront pas transférés/);
  assert.match(await e.$eval('#guestTransferLegacy',el=>el.textContent),/crédits et paquets/);
  await existing.page.screenshot({path:path.join(out,'existing-account-warning.png')});
  assert.equal(store.get(uid).playerState.credits,400);assert(!store.get(uid).playerState.collection[marc]);
  await e.click('#guestTransferConfirm');await e.waitForFunction(()=>!document.getElementById('guestTransferOverlay').classList.contains('active'));
  assert.equal(store.get(uid).playerState.credits,400);assert.equal(store.get(uid).elo,1555);assert(!store.get(uid).playerState.collection[marc]);
  await existing.context.close();
  const personal=await client(false),p=personal.frame,pid='personal-gift-browser';
  store.set(pid,{...clone(original),uid:pid,personalRewards:{support:{status:'pending',credits:25000,cardKey:marc,message:'Bon rétablissement et courage pour ton épaule !'}}});
  await p.evaluate(async uid=>{window.qaUser={uid};await hydrateCloudSaveForUser(window.qaUser);enterSavedGame()},pid);
  await p.waitForFunction(()=>document.getElementById('levelRewardOverlay').classList.contains('active'));
  assert.equal(await p.$eval('#levelRewardSubtitle',el=>el.textContent),'Bon rétablissement et courage pour ton épaule !');
  assert.equal(store.get(pid).playerState.credits,25400);assert.equal(store.get(pid).playerState.collection[marc],1);
  await personal.page.screenshot({path:path.join(out,'personal-official-communique.png')});
  assert.deepEqual(personal.errors,[]);await personal.context.close();
  console.log('Browser PC/mobile: real guest Champion reveal and playable 20-card deck, no promotional credits/gifts, duplicate conversion, new-account registration/review/confirmation and consumed source, existing-account warning and gift exclusion, unchanged rank, and personal official communiqué. Firebase mocked, all external traffic blocked.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
