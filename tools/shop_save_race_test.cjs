const assert=require('assert/strict');
const {device,store,service,clone}=require('./account_save_test.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const uid='phone-own-write-race',key='standard_catcheurs_angelo_folena';
 store.set(uid,{playerState:{credits:5000,collection:{[key]:1},careerUnlocked:0,starterGranted:true,welcomeClaimed:true},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'pc-import'}});
 const phone=device(uid,[],{mobile:true});await phone.login(uid);
 const load=service.loadPlayerData;let held=[];
 service.loadPlayerData=async id=>{const snapshot=await load(id);return new Promise(resolve=>held.push(()=>resolve(snapshot)))};
 const buy=async()=>{phone.buyBooster('classic');await phone.pushCloudSaveNow()};
 const initial=clone(store.get(uid));phone.setExportState(initial.playerState,initial.deckState);
 try{
  phone.resume();while(!held.length)await tick();
  await buy();held.shift()();await tick();await tick();
  if(held.length){await buy();held.shift()();await tick();await tick();}
  assert.equal(phone.session().conflict,false,'A delayed read of this phone’s own saves must not block a purchase as another-device conflict');
  assert.equal(store.get(uid).playerState.credits,4750);assert.equal(Object.values(store.get(uid).playerState.collection).reduce((a,b)=>a+b,0),6);
  service.loadPlayerData=load;
  // A stale conflict flag can be cleared only if the account still matches
  // this device's last accepted cloud version. Pending bought cards survive.
  phone.buyBooster('classic');phone.session().conflict=true;
  await phone.retryPendingAccountSave();assert.equal(phone.session().conflict,false);
  assert.equal(store.get(uid).playerState.credits,4500);assert.equal(Object.values(store.get(uid).playerState.collection).reduce((a,b)=>a+b,0),11);
  // Real foreign writes are still detected, and a retry must not overwrite them.
  store.get(uid).playerState.credits=4400;
  const foreign=clone(store.get(uid));await phone.resume();assert.equal(phone.session().conflict,true);
  await phone.retryPendingAccountSave();assert.equal(phone.session().conflict,true);assert.deepEqual(store.get(uid),foreign);
  const cache=phone.storage.getItem(phone.scope().player);
  phone.buyBooster('classic');phone.buyHalloweenBooster();phone.openTicketBooster('classic');
  assert.equal(phone.storage.getItem(phone.scope().player),cache,'Blocked purchases cannot spend credits/tickets or generate more pending cards');
  // A queued local purchase invalidates a foreground read even before upload.
  const pending=device('pending-shop',[],{mobile:true});store.set('pending-shop',clone(initial));await pending.login('pending-shop');pending.setExportState(initial.playerState,initial.deckState);
  service.loadPlayerData=async id=>{const snapshot=await load(id);return new Promise(resolve=>held.push(()=>resolve(snapshot)))};
  const check=pending.resume();while(!held.length)await tick();pending.buyBooster('classic');held.shift()();await check;
  assert.equal(pending.session().conflict,false);await pending.pushCloudSaveNow();assert.equal(store.get('pending-shop').playerState.credits,4750);
  console.log('Shop save race: delayed foreground reads cannot mistake this device’s own purchases for another-device writes.');
 }finally{service.loadPlayerData=load;for(const release of held)release()}
})().catch(error=>{console.error(error);process.exitCode=1});
