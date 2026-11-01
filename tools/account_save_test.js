const assert=require("assert/strict"),fs=require("fs"),path=require("path"),crypto=require('node:crypto');
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
function device(uid,approvedHashes=[],options={}){
  let user={uid};const values=new Map();
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const desktopFiles=[];
  const window={location:{search:options.mobile?'?mobile=1':''},crypto:crypto.webcrypto,AllstarSaveService:service,AllstarAuthService:{getCurrentUser:async()=>user},AllstarRankingService:{normalizeProgress:value=>value||{}}};
  if(options.desktop)window.AllstarDesktop={isElectron:true,exportSave:async text=>{desktopFiles.push(JSON.parse(text));return {canceled:false}}};
  Function("window",fs.readFileSync(path.join(root,"js/rankingService.js"),"utf8"))(window);
  const status={textContent:'',hidden:true};const timers=new Map();let timerId=0;
  const transferUi=Object.fromEntries(['accountTransferReview','accountTransferConfirm','accountTransferFile','accountTransferOverlay','accountSaveConflict','accountSaveSetup','accountSaveSetupSummary','accountSaveSetupUseCurrent','accountSaveSetupAcknowledged','accountSaveSetupConfirmCurrent','accountSaveSetupStatus','accountSaveSetupConfirmButton','pcProtectedExport','pcProtectedExportStatus','protectedCopyStatus','protectedCopyExport','reviewProtectedLocalSyncButton','confirmProtectedLocalSyncButton'].map(id=>[id,{textContent:'',hidden:false,disabled:false,checked:false,classList:{add(){},remove(){}}}]));
  const document={addEventListener(){},getElementById(id){return id==='accountSaveStatus'?status:transferUi[id]||null},querySelector(){return null},querySelectorAll(){return[]}};
  // Test-only hash fixtures in this in-memory copy; no override exists in game UI.
  const testSource=approvedHashes.length?source.replace(/const APPROVED_ACCOUNT_RECOVERY_HASHES=\[[^\n]+;/,'const APPROVED_ACCOUNT_RECOVERY_HASHES='+JSON.stringify(approvedHashes)+';'):source;
  const game=Function("window","document","localStorage","setTimeout","clearTimeout",testSource+`
enterSavedGame=()=>{playerState={credits:0,collection:{},careerUnlocked:0,...JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)||"{}"),loaded:true};deckState={decks:[],...JSON.parse(localStorage.getItem(DECK_STORAGE_KEY)||"{}"),loaded:true}};
show=()=>{};renderSaveScreen=()=>{};showSystemToast=()=>{};
return {hydrateCloudSaveForUser,pushCloudSaveNow,queueCloudSave,notifyAccountProgressSaved,resume:checkAccountProgressOnResume,retryPendingAccountSave,buyBooster,buyHalloweenBooster,openTicketBooster,validateAccountTransfer,buildAccountTransferData,buildAccountTransferExport,openAccountTransfer,reviewAccountTransfer,confirmAccountTransfer,approvedAccountRecoveryHash,
preparePcAccountLink,receivePreparedPcSave,confirmCurrentSaveSource,showCurrentSourceConfirmation,setupSaveLater,exportAccountSave,reviewProtectedLocalSync,confirmProtectedLocalSync,closeAccountTransfer,
setPendingTransfer(value){pendingAccountTransfer={...value,session:accountSaveSession}},pendingTransfer(){return pendingAccountTransfer},
setExportState(player,decks){playerState={...JSON.parse(JSON.stringify(player)),loaded:true};deckState={...JSON.parse(JSON.stringify(decks)),loaded:true}},
firstKey(){return cardKey(CARD_DATA[0])},normalize:window.AllstarRankingService.normalizeProgress,
setState(credits,tickets={}){playerState={loaded:true,credits,collection:{one:2},boosterTickets:tickets,savedAt:1};deckState={loaded:true,decks:[],savedAt:1};},
scope(){return {player:PLAYER_STORAGE_KEY,decks:DECK_STORAGE_KEY}},session(){return accountSaveSession}};`)(window,document,storage,(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId},id=>timers.delete(id));
  return{...game,storage,status,transferUi,desktopFiles,recoveries(){return [...values].filter(([key])=>key.startsWith('allstarsRecovery:')).map(([,value])=>JSON.parse(value))},expireToast(){for(const [id,timer] of timers)if(timer.ms===2000){timers.delete(id);timer.fn()}},login:async(next,hydrateOptions)=>{user={uid:next};return game.hydrateCloudSaveForUser(user,hydrateOptions)}};
}
if(require.main===module)(async()=>{
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
  store.set("bob",{playerState:{credits:3,collection:{one:2}},deckState:{decks:[]}});
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
  const exporter=device('export-account');
  assert.throws(()=>exporter.buildAccountTransferExport(),/Connectez-vous/,'Guests cannot create an account-bound import file');
  store.set('export-account',{playerState:{credits:0,collection:{}},deckState:{decks:[]}});
  await exporter.login('export-account');
  exporter.setExportState({credits:666,collection:{[key]:3},boosterTickets:{premium:2},careerUnlocked:12,sleeveId:'halloween',cosmeticInventory:{sleeves:{halloween:true}},profileProgress:{level:24,xp:1200,titles:['Champion']}},{decks:[{id:'desktop',name:'Mon deck',cards:[key]}],selectedId:'desktop'});
  exporter.storage.setItem('rememberedCredentials',JSON.stringify({password:'NOT_IN_THE_EXPORT'}));
  const beforeExport=clone(store.get('export-account'));
  const exported=exporter.buildAccountTransferExport();
  exporter.validateAccountTransfer(JSON.parse(JSON.stringify(exported)),'export-account');
  assert.throws(()=>exporter.validateAccountTransfer(exported,'other-account'),/compte/);
  assert.equal(exported.playerState.credits,666);assert.equal(exported.playerState.collection[key],3);
  assert.equal(exported.playerState.boosterTickets.premium,2);assert.equal(exported.playerState.careerUnlocked,12);
  assert.equal(exported.playerState.profileProgress.level,24);assert.equal(exported.deckState.selectedId,'desktop');
  assert.deepEqual(exported.deckState.decks[0].cards,[key]);
  assert.equal(JSON.stringify(exported).includes('NOT_IN_THE_EXPORT'),false);
  assert.deepEqual(store.get('export-account'),beforeExport,'Export does not write cloud progress');
  const restored=exporter.buildAccountTransferData(exported,beforeExport);
  assert.equal(restored.collection[key],3);assert.equal(restored.playerState.credits,666);assert.equal(restored.decks.selectedId,'desktop');
  // Incident containment: every UI/handler path refuses an import, including
  // a preview prepared before the suspension or direct calls from stale UI.
  const importBefore=clone(store.get('export-account'));
  const readsBefore=serverReads;
  exporter.openAccountTransfer();
  assert.equal(exporter.transferUi.accountTransferFile.disabled,false,'Recovery file chooser available; ordinary files still refused');
  assert.equal(exporter.transferUi.accountTransferConfirm.hidden,true);
  assert.match(exporter.transferUi.accountTransferReview.textContent,/temporairement suspendu/);
  await exporter.reviewAccountTransfer({size:100,text:async()=>JSON.stringify(exported)});
  assert.match(exporter.transferUi.accountTransferReview.textContent,/temporairement suspendu/);
  exporter.setPendingTransfer({uid:'export-account',bundle:exported,remote:beforeExport,token:service.progressionToken(beforeExport)});
  await exporter.confirmAccountTransfer();
  assert.equal(serverReads,readsBefore+1,'Unapproved import may read PC authorization metadata but never writes progression');
  assert.deepEqual(store.get('export-account'),importBefore);
  // Preserve a CLEAN complete PC cache before a partial authoritative copy
  // replaces it. No merging (spent resources must not be resurrected).
  const recovery=device('recovery');
  const full={credits:9876,collection:{[key]:10},careerUnlocked:24,savedAt:1};
  const fullRaw=JSON.stringify(full),decksRaw=JSON.stringify({decks:[{id:'old',cards:[key]}]});
  recovery.storage.setItem('allstarsPlayerV1:account:recovery',fullRaw);
  recovery.storage.setItem('allstarsDecks:account:recovery',decksRaw);
  recovery.storage.setItem('allstarsPlayerV1',fullRaw);
  store.set('recovery',{playerState:{credits:350,collection:{[key]:1},careerUnlocked:3},deckState:{decks:[]}});
  await assert.rejects(recovery.login('recovery'),error=>error.code==='allstar/save-protection');
  const copies=recovery.recoveries();
  assert.equal(copies.length,1);
  assert.equal(JSON.parse(copies[0].payload).playerRaw,fullRaw);
  assert.equal(JSON.parse(copies[0].payload).decksRaw,decksRaw);
  assert.equal(recovery.storage.getItem('allstarsPlayerV1'),fullRaw,'Legacy original remains untouched');
  recovery.storage.setItem('allstarsPlayerV1:account:recovery',JSON.stringify(store.get('recovery').playerState));
  recovery.storage.setItem('allstarsDecks:account:recovery',JSON.stringify(store.get('recovery').deckState));
  await recovery.login('recovery');
  const secondCount=recovery.recoveries().length;
  await recovery.login('recovery');
  assert.equal(recovery.recoveries().length,secondCount,'Identical snapshots are deduplicated');
  assert.equal(JSON.parse(recovery.recoveries()[0].payload).playerRaw,fullRaw,'Original recovery is immutable');
  const localBefore=recovery.storage.getItem(recovery.scope().player);
  const originalSet=recovery.storage.setItem;
  recovery.storage.setItem=(key,value)=>{if(key.startsWith('allstarsRecovery:'))throw Error('Storage full');originalSet(key,value)};
  recovery.storage.setItem(recovery.scope().player,fullRaw);
  await assert.rejects(recovery.login('recovery'),/Storage full/);
  assert.equal(recovery.storage.getItem(recovery.scope().player),fullRaw,'Backup failure aborts replacement');
  assert.notEqual(localBefore,fullRaw);
  recovery.storage.setItem=(key,value)=>{if(!key.startsWith('allstarsRecovery:'))originalSet(key,value)};
  await assert.rejects(recovery.login('recovery'),/copie de secours locale/);
  assert.equal(recovery.storage.getItem(recovery.scope().player),fullRaw,'Unverifiable backup aborts replacement too');
  recovery.storage.setItem=originalSet;
  const pendingDevice=device('recovery');
  await pendingDevice.login('recovery');
  pendingDevice.setState(777);pendingDevice.queueCloudSave();
  await pendingDevice.login('other-account');
  const pendingCopy=pendingDevice.recoveries().find(copy=>copy.reason==='pending-before-hydration');
  assert.equal(pendingCopy.accountUid,'recovery','Pending runtime stays associated with its original account');
  assert.equal(JSON.parse(pendingCopy.payload).runtime.playerState.credits,777);
  assert.equal(store.get('recovery').playerState.credits,350,'Recovery copies never write or merge into cloud');
  function stable(value){return Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value}
  const approved={format:'allstar-account-transfer-v1',accountUid:'verified-recovery',createdAt:1,
    playerState:{credits:5050,collection:{[key]:5},careerUnlocked:24,starterGranted:true,welcomeClaimed:true,profileProgress:{level:23},limitedRewards:{recovery_apology_2026_10_30:{credits:5000}}},
    deckState:{decks:[{id:'restored',cards:[key]}]},recovery:{compensationCredits:5000}};
  const approvedHash=crypto.createHash('sha256').update(JSON.stringify(stable(approved))).digest('hex');
  const restoredDevice=device('verified-recovery',[approvedHash]);
  store.set('verified-recovery',{playerState:{credits:350,collection:{[key]:1},careerUnlocked:3},deckState:{decks:[]},level:23,elo:1500,mobileMigrationBackup:{firstBackup:true}});
  await restoredDevice.login('verified-recovery');
  const recoveryFile={size:1000,text:async()=>JSON.stringify(approved)};
  const beforeApproved=clone(store.get('verified-recovery'));
  await restoredDevice.reviewAccountTransfer(recoveryFile);
  assert.equal(restoredDevice.transferUi.accountTransferConfirm.hidden,false);
  assert.deepEqual(store.get('verified-recovery'),beforeApproved,'Preview is read-only');
  restoredDevice.pendingTransfer().bundle.playerState.credits++;
  await restoredDevice.confirmAccountTransfer();
  assert.match(restoredDevice.transferUi.accountTransferReview.textContent,/temporairement suspendu/);
  assert.deepEqual(store.get('verified-recovery'),beforeApproved,'Changed file fails recheck before write');
  await restoredDevice.reviewAccountTransfer(recoveryFile);
  store.get('verified-recovery').level++;
  await restoredDevice.confirmAccountTransfer();
  assert.equal(store.get('verified-recovery').playerState.credits,350,'Concurrent earned progress blocks replacement');
  await restoredDevice.reviewAccountTransfer(recoveryFile);
  await Promise.all([restoredDevice.confirmAccountTransfer(),restoredDevice.confirmAccountTransfer()]);
  const restoredRemote=store.get('verified-recovery');
  assert.equal(restoredRemote.playerState.credits,5050);
  assert.equal(restoredRemote.playerState.careerUnlocked,24);
  assert.equal(restoredRemote.collection[key],5);
  assert.equal(restoredRemote.level,24,'Higher live level survives recovery');
  assert.equal(restoredRemote.elo,1500);
  assert.deepEqual(restoredRemote.mobileMigrationBackup,{firstBackup:true},'First backup is never replaced');
  assert.equal(restoredRemote.accountRecoveryReceipts[approvedHash],true);
  await restoredDevice.reviewAccountTransfer(recoveryFile);
  assert.equal(restoredDevice.transferUi.accountTransferConfirm.hidden,true);
  assert.match(restoredDevice.transferUi.accountTransferReview.textContent,/déjà été appliqué/);
  restoredDevice.setExportState(restoredRemote.playerState,restoredRemote.deckState);
  await restoredDevice.pushCloudSaveNow();
  assert.equal(store.get('verified-recovery').accountRecoveryReceipts[approvedHash],true,'Normal saves keep recovery receipt');
  assert.equal(restoredDevice.normalize(restoredRemote).accountRecoveryReceipts,undefined,'Receipt is not recursively mirrored into profile');
  await restoredDevice.login('other-recovery-account');
  await restoredDevice.reviewAccountTransfer(recoveryFile);
  assert.match(restoredDevice.transferUi.accountTransferReview.textContent,/compte connecté/,'Same file cannot cross accounts');
  // A commit can succeed even if the subsequent display reload fails offline.
  const failedDisplayBundle={...clone(approved),accountUid:'post-commit-offline'};
  const failedDisplayHash=crypto.createHash('sha256').update(JSON.stringify(stable(failedDisplayBundle))).digest('hex');
  const failedDisplay=device('post-commit-offline',[failedDisplayHash]);
  store.set('post-commit-offline',{playerState:{credits:1,collection:{}},deckState:{decks:[]}});
  await failedDisplay.login('post-commit-offline');
  await failedDisplay.reviewAccountTransfer({size:1000,text:async()=>JSON.stringify(failedDisplayBundle)});
  const originalCommit=service.commitProgression;
  service.commitProgression=async(...args)=>{const result=await originalCommit(...args);offline=true;return result};
  try{await failedDisplay.confirmAccountTransfer()}finally{offline=false;service.commitProgression=originalCommit}
  assert.equal(store.get('post-commit-offline').playerState.credits,5050);
  assert.equal(store.get('post-commit-offline').accountRecoveryReceipts[failedDisplayHash],true);
  assert.match(failedDisplay.transferUi.accountTransferReview.textContent,/bien été enregistrée/);
  assert.equal(failedDisplay.session(),null,'Failed reload cannot save stale runtime over committed recovery');
  const guarded={playerState:{credits:100,collection:{[key]:3},careerUnlocked:4,savedAt:1},deckState:{decks:[{id:'only',cards:[key]}]}};
  store.set('guarded',clone(guarded));
  function payload(player){return {playerState:player,deckState:clone(guarded.deckState),collection:clone(player.collection),decks:clone(guarded.deckState)}}
  for(const change of [p=>p.collection[key]--,p=>p.careerUnlocked--,p=>p.credits=-1]){
    const player=clone(guarded.playerState);change(player);
    await assert.rejects(service.commitProgression('guarded',payload(player),service.progressionToken(store.get('guarded'))),error=>error.code==='allstar/save-protection');
    assert.deepEqual(store.get('guarded'),guarded,'Invalid/regressing writes cannot alter the account');
  }
  await assert.rejects(service.saveCollection('guarded',{}),error=>error.code==='allstar/unsafe-save');
  const purchase=clone(guarded.playerState);purchase.credits=20;purchase.collection[key]=4;
  await service.commitProgression('guarded',payload(purchase),service.progressionToken(store.get('guarded')));
  const baseline=clone(store.get('guarded').cloudSaveHistory.baseline);
  assert.equal(baseline.playerState.credits,100);assert.equal(baseline.playerState.collection[key],3);
  for(let i=0;i<12;i++){
    const player=clone(store.get('guarded').playerState);player.credits++;
    await service.commitProgression('guarded',payload(player),service.progressionToken(store.get('guarded')));
  }
  assert.deepEqual(store.get('guarded').cloudSaveHistory.baseline,baseline,'First cloud recovery point is immutable');
  assert.equal(store.get('guarded').cloudSaveHistory.recent.length,5);
  const recentBefore=clone(store.get('guarded').cloudSaveHistory.recent);
  const timestampOnly=clone(store.get('guarded').playerState);timestampOnly.savedAt=10000;
  await service.commitProgression('guarded',payload(timestampOnly),service.progressionToken(store.get('guarded')));
  assert.deepEqual(store.get('guarded').cloudSaveHistory.recent,recentBefore,'Reload timestamps do not evict meaningful recovery points');
  const tooLarge=clone(timestampOnly);tooLarge.limitedRewards={padding:'x'.repeat(800000)};
  const beforeLarge=clone(store.get('guarded'));
  await assert.rejects(service.commitProgression('guarded',payload(tooLarge),service.progressionToken(beforeLarge)),error=>error.code==='allstar/save-protection');
  assert.deepEqual(store.get('guarded'),beforeLarge,'Oversized saves fail before the atomic update');
  assert.equal(phone.normalize(store.get('guarded')).cloudSaveHistory,undefined,'History never recurses into profile mirrors');
  const oldPc=device('legacy-owner');
  const oldPcPlayer={credits:50,collection:{[key]:8},careerUnlocked:24,profileProgress:{uid:'legacy-owner',level:23}};
  oldPc.storage.setItem('allstarsPlayerV1',JSON.stringify(oldPcPlayer));
  oldPc.storage.setItem('allstarsDecks',JSON.stringify({decks:[{id:'pc',cards:[key]}]}));
  store.set('legacy-owner',{playerState:{credits:350,collection:{[key]:1},careerUnlocked:3},deckState:{decks:[]},level:23});
  const oldPcRemote=clone(store.get('legacy-owner'));
  await assert.rejects(oldPc.login('legacy-owner'),error=>error.code==='allstar/save-protection');
  assert.equal(oldPc.session().blocked,true);
  assert.deepEqual(store.get('legacy-owner'),oldPcRemote);
  assert.equal(oldPc.storage.getItem('allstarsPlayerV1'),JSON.stringify(oldPcPlayer));
  assert(oldPc.recoveries().some(copy=>copy.source==='legacy'),'Same-account old PC copy is preserved explicitly');
  await assert.rejects(oldPc.pushCloudSaveNow(),error=>error.code==='allstar/save-protection');
  const brokenBundle={...clone(approved),accountUid:'broken-cloud'};
  const brokenHash=crypto.createHash('sha256').update(JSON.stringify(stable(brokenBundle))).digest('hex');
  const broken=device('broken-cloud',[brokenHash]);
  store.set('broken-cloud',{playerState:{credits:350,collection:{[key]:1},careerUnlocked:3},deckState:{decks:[]},level:23,careerXpWins:{career_24_Final:true}});
  await assert.rejects(broken.login('broken-cloud'),error=>error.code==='allstar/save-protection');
  assert.equal(broken.session().blocked,true);
  await broken.reviewAccountTransfer({size:1000,text:async()=>JSON.stringify(brokenBundle)});
  await broken.confirmAccountTransfer();
  assert.equal(store.get('broken-cloud').playerState.careerUnlocked,24,'Reviewed recovery remains available from blocked login');
  assert.notEqual(broken.session()?.blocked,true);
  const missing=device('missing-progress');store.set('missing-progress',{level:23,totalXp:9000,collection:{}});
  await assert.rejects(missing.login('missing-progress'),error=>error.code==='allstar/save-protection');
  assert.equal(store.get('missing-progress').playerState,undefined,'A known profile never receives an automatic replacement starter');
  const silent=device('silent-write');store.set('silent-write',clone(guarded));
  const silentSet=silent.storage.setItem;
  silent.storage.setItem=(k,v)=>{if(k!=='allstarsPlayerV1:account:silent-write')silentSet(k,v)};
  await assert.rejects(silent.login('silent-write'),error=>error.code==='allstar/save-protection');
  assert.equal(silent.session(),null,'A failed local cache readback cannot become an active saving session');
  const racing=device('slow-A');store.set('slow-A',clone(guarded));store.set('fast-B',clone(guarded));
  const originalLoad=service.loadPlayerData;let releaseSlow;
  service.loadPlayerData=async uid=>uid==='slow-A'?new Promise(resolve=>{releaseSlow=()=>resolve(clone(store.get(uid)))}):originalLoad(uid);
  const slow=racing.login('slow-A');const staleRejected=assert.rejects(slow,error=>error.code==='allstar/save-superseded');
  while(!releaseSlow)await Promise.resolve();
  await racing.login('fast-B');releaseSlow();await staleRejected;service.loadPlayerData=originalLoad;
  assert.equal(racing.session().uid,'fast-B');assert.match(racing.scope().player,/:fast-B$/);
  assert.equal(racing.storage.getItem('allstarsPlayerV1:account:slow-A'),null,'Late responses cannot write the wrong account cache');
  console.log('Save protection: ordinary card/career regression refused, spending allowed, bounded atomic cloud history, legacy/known-profile checks, cache readback and concurrent logins verified.');
  console.log('Verified recovery: exact file hashes, account binding, read-only preview, tamper/conflict rejection, preserved backup/rank, double confirm, one-time receipt and post-commit offline behavior OK.');
  console.log('Incident protection: import handlers suspended without cloud writes; clean local caches preserved byte-for-byte; immutable recovery, deduplication and storage failure verified.');
  console.log('Desktop export: complete account-bound JSON accepted by mobile import, no credential leakage or cloud writes.');
  console.log("Account saves: server authority, account isolation, PC/phone round trip, spent items, conflict with old/new clients and offline retry OK (Firebase mocked).");
  console.log("PC migration: matching account required; complete inventory/decks, earned level, previous cloud backup, preserved online rank and concurrent-change rejection OK.");
})().catch(error=>{console.error(error);process.exitCode=1});
module.exports={device,store,service,clone};
