const assert=require('assert/strict');
const {device,store,service,clone}=require('./account_save_test.js');
const key='standard_catcheurs_angelo_folena',ult='ultime_catcheurs_marc_sebire';
async function fixture(uid,change=p=>{}){
 const remote={uid,level:5,totalXp:500,elo:1234,playerState:{credits:5000,collection:{[key]:1,[ult]:1},careerUnlocked:2,starterGranted:true,welcomeClaimed:true},deckState:{decks:[{id:'same',name:'Compte',cards:[key]}]},saveLinkVerified:{schema:1,source:'pc-import'},campaignRewards:{mobile_launch_2026_11:{cardKey:ult,credits:5000,grantedAt:1,presentedAt:2}}};
 const local={...clone(remote.playerState),credits:4750,collection:{[key]:6,[ult]:1},profileProgress:{uid,level:3,totalXp:200,elo:9999}};change(local);
 store.set(uid,clone(remote));const d=device(uid,[],{mobile:true});
 d.storage.setItem('allstarsPlayerV1:account:'+uid,JSON.stringify(local));d.storage.setItem('allstarsDecks:account:'+uid,JSON.stringify({decks:[{id:'same',name:'Téléphone',cards:[key,key]}]}));
 await assert.rejects(d.login(uid),e=>e.code==='allstar/save-protection');return {d,remote,local};
}
(async()=>{
 const {d,remote,local}=await fixture('sync-good');
 await d.reviewProtectedLocalSync();assert.equal(d.transferUi.confirmProtectedLocalSyncButton.hidden,false);assert.match(d.transferUi.protectedCopyStatus.textContent,/4750/);assert.deepEqual(store.get('sync-good'),remote,'Review is read-only');
 await d.confirmProtectedLocalSync();const result=store.get('sync-good');
 assert.equal(result.playerState.credits,4750);assert.equal(result.collection[key],6);assert.equal(result.collection[ult],1);assert.equal(result.level,5);assert.equal(result.elo,1234);assert.equal(result.deckState.decks.length,2);
 assert.deepEqual(result.campaignRewards,remote.campaignRewards);assert.equal(result.cloudSaveHistory.baseline.playerState.credits,5000);assert.deepEqual(result.cloudSaveHistory.baseline.playerState.collection,remote.playerState.collection);assert.equal(result.cloudSaveHistory.verifiedSource.playerState.credits,4750);
 assert(d.recoveries().some(c=>c.reason==='before-protected-local-sync'));assert.notEqual(d.session().blocked,true);
 await d.confirmProtectedLocalSync();assert.equal(store.get('sync-good').playerState.credits,4750,'Repeat click cannot duplicate credits/cards');
 const missing=await fixture('missing-ultimate',p=>{delete p.collection[ult];p.collection[key]=100});await missing.d.reviewProtectedLocalSync();assert.equal(missing.d.transferUi.confirmProtectedLocalSyncButton.hidden,true);assert.deepEqual(store.get('missing-ultimate'),missing.remote,'Higher total never compensates for a missing Ultimate');
 const career=await fixture('missing-career',p=>p.careerUnlocked=1);await career.d.reviewProtectedLocalSync();assert.equal(career.d.transferUi.confirmProtectedLocalSyncButton.hidden,true);assert.deepEqual(store.get('missing-career'),career.remote);
 const corrupt=await fixture('bad-count',p=>{p.collection[key]=-1;p.collection.rare_catcheurs_rayen_gurzil=1});await corrupt.d.reviewProtectedLocalSync();assert.equal(corrupt.d.transferUi.confirmProtectedLocalSyncButton.hidden,true);assert.deepEqual(store.get('bad-count'),corrupt.remote);
 const stale=await fixture('sync-stale');await stale.d.reviewProtectedLocalSync();store.get('sync-stale').playerState.credits=4900;const changed=clone(store.get('sync-stale'));await stale.d.confirmProtectedLocalSync();assert.deepEqual(store.get('sync-stale'),changed,'Concurrent account change refuses replacement');
 const profileRace=await fixture('sync-profile-race');await profileRace.d.reviewProtectedLocalSync();store.get('sync-profile-race').level=6;const changedProfile=clone(store.get('sync-profile-race'));await profileRace.d.confirmProtectedLocalSync();assert.deepEqual(store.get('sync-profile-race'),changedProfile,'Concurrent earned profile change is refused even when inventory token is unchanged');
 const wrong=await fixture('sync-wrong');wrong.d.session().pcSource.playerState.profileProgress.uid='different-owner';await wrong.d.reviewProtectedLocalSync();assert.equal(wrong.d.transferUi.confirmProtectedLocalSyncButton.hidden,true);assert.deepEqual(store.get('sync-wrong'),wrong.remote);
 const tampered=await fixture('sync-tampered');await tampered.d.reviewProtectedLocalSync();tampered.d.session().pcSource.playerState.credits=99999;await tampered.d.confirmProtectedLocalSync();assert.deepEqual(store.get('sync-tampered'),tampered.remote,'Local source changed after review is refused');
 const originalCommit=service.commitProtectedLocalProgression,originalLoad=service.loadPlayerData;
 const offline=await fixture('sync-postcommit-offline');await offline.d.reviewProtectedLocalSync();
 service.commitProtectedLocalProgression=async(...args)=>{const r=await originalCommit(...args);service.loadPlayerData=async()=>{throw Error('offline')};return r};
 try{await offline.d.confirmProtectedLocalSync();assert.equal(store.get('sync-postcommit-offline').playerState.credits,4750);assert.equal(offline.d.session(),null);assert.match(offline.d.transferUi.protectedCopyStatus.textContent,/bien été enregistrée/)}finally{service.commitProtectedLocalProgression=originalCommit;service.loadPlayerData=originalLoad}
 // Service-side validation repeats the per-card check, independent of UI.
 const guarded=await fixture('sync-server');const payload={playerState:{...clone(guarded.local),collection:{[key]:100}},deckState:guarded.remote.deckState};payload.collection=payload.playerState.collection;payload.decks=payload.deckState;
 await assert.rejects(service.commitProtectedLocalProgression('sync-server',payload,service.progressionToken(guarded.remote),service.migrationProfileToken(guarded.remote)),e=>e.code==='allstar/save-protection');assert.deepEqual(store.get('sync-server'),guarded.remote);
 const allowed={playerState:clone(guarded.local),deckState:guarded.remote.deckState,campaignRewards:{},elo:9999};allowed.collection=allowed.playerState.collection;allowed.decks=allowed.deckState;
 await service.commitProtectedLocalProgression('sync-server',allowed,service.progressionToken(guarded.remote),service.migrationProfileToken(guarded.remote));assert.deepEqual(store.get('sync-server').campaignRewards,guarded.remote.campaignRewards);assert.equal(store.get('sync-server').elo,1234,'Receipt and ranking roots cannot be replaced through this recovery payload');
 console.log('Protected sync: per-card monotonicity (including missing Ultimate despite higher total), malformed data, read-only preview/confirmation, spent credits, preserved decks/rank/gift receipts, both backups, repeated click, account/local race and post-commit offline behavior verified.');
})().catch(e=>{console.error(e);process.exitCode=1});
