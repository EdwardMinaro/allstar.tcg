const assert=require("assert/strict"),fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const clone=value=>JSON.parse(JSON.stringify(value));
const store=new Map();let offline=false,serverReads=0;
const firestore={
  doc:(_db,_collection,uid)=>uid,
  getDocFromServer:async uid=>{serverReads++;if(offline)throw Error("offline");return snapshot(uid)},
  serverTimestamp:()=>"server-time",
  runTransaction:async(_db,fn)=>{if(offline)throw Error("offline");return fn({get:async uid=>snapshot(uid),update:(uid,data)=>store.set(uid,{...store.get(uid),...clone(data)}),set:(uid,data)=>store.set(uid,clone(data))})}
};
function snapshot(uid){const data=clone(store.get(uid)||null);return{exists:()=>Boolean(data),data:()=>data};}
const serviceWindow={AllstarFirebaseService:{firebaseServices:async()=>({firestore:{},modules:{firestore}})}};
Function("window",fs.readFileSync(path.join(root,"js/saveService.js"),"utf8"))(serviceWindow);
const service=serviceWindow.AllstarSaveService;
const source=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
function device(uid){
  let user={uid};const values=new Map();
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const window={AllstarSaveService:service,AllstarAuthService:{getCurrentUser:async()=>user},AllstarRankingService:{normalizeProgress:value=>value||{}}};
  Function("window",fs.readFileSync(path.join(root,"js/rankingService.js"),"utf8"))(window);
  const status={textContent:'',hidden:true};const timers=new Map();let timerId=0;
  const document={addEventListener(){},getElementById(id){return id==='accountSaveStatus'?status:null},querySelector(){return null},querySelectorAll(){return[]}};
  const game=Function("window","document","localStorage","setTimeout","clearTimeout",source+`
return {hydrateCloudSaveForUser,pushCloudSaveNow,queueCloudSave,notifyAccountProgressSaved,validateAccountTransfer,buildAccountTransferData,
firstKey(){return cardKey(CARD_DATA[0])},normalize:window.AllstarRankingService.normalizeProgress,
setState(credits,tickets={}){playerState={loaded:true,credits,collection:{one:2},boosterTickets:tickets,savedAt:1};deckState={loaded:true,decks:[],savedAt:1};},
scope(){return {player:PLAYER_STORAGE_KEY,decks:DECK_STORAGE_KEY}},session(){return accountSaveSession}};`)(window,document,storage,(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},id=>timers.delete(id));
  return{...game,storage,status,expireToast(){for(const [id,timer] of timers)if(timer.ms===2000){timers.delete(id);timer.fn()}},login:async next=>{user={uid:next};return game.hydrateCloudSaveForUser(user)}};
}
(async()=>{
  store.set("alice",{pseudo:"Alice",playerState:{credits:100,collection:{one:2},boosterTickets:{premium:1},savedAt:1},deckState:{decks:[],savedAt:1}});
  const pc=device("alice"),phone=device("alice");
  phone.storage.setItem("allstarsPlayerV1",JSON.stringify({credits:99999,collection:{intruder:99},savedAt:999999}));
  await phone.login("alice");
  assert.equal(JSON.parse(phone.storage.getItem(phone.scope().player)).credits,100,"Cloud wins over newer guest state");
  assert.equal(JSON.parse(phone.storage.getItem("allstarsPlayerV1")).credits,99999,"Legacy save remains intact");
  await pc.login("alice");
  phone.setState(90);phone.queueCloudSave();await phone.pushCloudSaveNow();
  assert.equal(store.get("alice").playerState.credits,90);
  assert.deepEqual(store.get("alice").playerState.boosterTickets,{},"Spent tickets must not resurrect through map merging");
  assert.equal(store.get("alice").pseudo,"Alice","Other profile fields survive progression writes");
  pc.setState(120);pc.queueCloudSave();await assert.rejects(pc.pushCloudSaveNow(),error=>error.code==="allstar/save-conflict");
  assert.equal(store.get("alice").playerState.credits,90,"Stale device cannot overwrite phone");
  await pc.login("alice");assert.equal(JSON.parse(pc.storage.getItem(pc.scope().player)).credits,90);
  pc.setState(80);pc.queueCloudSave();await pc.pushCloudSaveNow();
  await phone.login("alice");assert.equal(JSON.parse(phone.storage.getItem(phone.scope().player)).credits,80,"Round trip PC to phone");
  // An old client updates maps without advancing cloudSaveRevision.
  store.get("alice").playerState.credits=75;
  phone.setState(60);await assert.rejects(phone.pushCloudSaveNow(),error=>error.code==="allstar/save-conflict");
  store.set("bob",{playerState:{credits:3},deckState:{decks:[]}});
  await phone.login("bob");assert.equal(JSON.parse(phone.storage.getItem(phone.scope().player)).credits,3);
  assert.match(phone.scope().player,/:account:bob$/);
  assert.equal(JSON.parse(phone.storage.getItem("allstarsPlayerV1:account:alice")).credits,80);
  assert.equal(phone.status.hidden,true,'No permanent success status after hydration or routine saves');
  phone.setState(2);phone.queueCloudSave();offline=true;
  await phone.notifyAccountProgressSaved();
  assert.match(phone.status.textContent,/en attente/,'Offline milestone cannot report success');
  phone.expireToast();assert.equal(phone.status.hidden,false,'Save error stays visible');
  await assert.rejects(phone.pushCloudSaveNow(),/offline/);assert.equal(phone.session().dirty,true);
  offline=false;await phone.pushCloudSaveNow();assert.equal(store.get("bob").playerState.credits,2);
  assert.equal(phone.status.textContent,'Progression sauvegardée ✓','Retry confirms server persistence');
  assert.equal(phone.status.hidden,false);
  phone.expireToast();assert.equal(phone.status.hidden,true,'Success disappears after two seconds');
  await phone.notifyAccountProgressSaved();assert.equal(phone.status.hidden,false,'Returning to menu confirms a fresh save');
  phone.setState(1);phone.queueCloudSave();assert.equal(phone.status.hidden,true,'New unsaved changes clear an earlier success');
  await phone.pushCloudSaveNow();assert.equal(phone.status.hidden,true,'Routine save stays discreet');
  assert.ok(serverReads>=5);
  const key=phone.firstKey();
  const bundle={format:"allstar-account-transfer-v1",accountUid:"bob",playerState:{credits:42,collection:{[key]:8},careerUnlocked:24,profileProgress:{level:24,xp:1200,titles:["Rookie","Champion"],elo:3000,playerState:{collection:{old:999}}}},deckState:{decks:[{id:"pc",cards:[key]}]}};
  assert.throws(()=>phone.validateAccountTransfer(bundle,"alice"),/compte/);
  phone.validateAccountTransfer(bundle,"bob");
  const remote=await service.loadPlayerData("bob");remote.level=3;remote.xp=20;remote.elo=1100;store.set("bob",clone(remote));
  const migrated=phone.buildAccountTransferData(bundle,remote);
  assert.equal(migrated.level,24);assert.equal(migrated.playerState.profileProgress.elo,1100,"Online ranking remains authoritative");
  assert.equal(migrated.playerState.profileProgress.playerState,undefined,"No recursive cached user documents");
  await service.commitProgression("bob",migrated,service.progressionToken(remote),service.migrationProfileToken(remote));
  assert.equal(store.get("bob").elo,1100);assert.equal(store.get("bob").collection[key],8);assert.equal(store.get("bob").mobileMigrationBackup.playerState.credits,1);
  const beforeRace=clone(store.get("bob"));store.get("bob").level=25;
  await assert.rejects(service.commitProgression("bob",migrated,service.progressionToken(beforeRace),service.migrationProfileToken(beforeRace)),error=>error.code==="allstar/save-conflict");
  assert.equal(store.get("bob").level,25,"Concurrent earned progress cannot be overwritten by migration");
  console.log("Account saves: server authority, account isolation, PC/phone round trip, spent items, conflict with old/new clients and offline retry OK (Firebase mocked).");
  console.log("PC migration: matching account required; complete inventory/decks, earned level, previous cloud backup, preserved online rank and concurrent-change rejection OK.");
})().catch(error=>{console.error(error);process.exitCode=1});
