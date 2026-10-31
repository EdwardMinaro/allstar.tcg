const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),store=new Map();
const copy=v=>JSON.parse(JSON.stringify(v));
let chain=Promise.resolve(),offline=false,now=Date.parse('2026-11-01T12:00:00+01:00');
class TestDate extends Date {static now(){return now}}
// Serialized atomic transactions simulate Firestore's retry/commit contract.
const firestore={doc:(_db,_c,uid)=>uid,serverTimestamp:()=> 'server-time',runTransaction:(_db,fn)=>{
 const work=chain.catch(()=>{}).then(async()=>{
  if(offline)throw Error('offline');
  const writes=[];
  const result=await fn({get:async uid=>({exists:()=>store.has(uid),data:()=>copy(store.get(uid))}),update:(uid,data)=>writes.push([uid,{...store.get(uid),...copy(data)}])});
  writes.forEach(([uid,data])=>store.set(uid,data));return result;
 });chain=work;return work;
}};
const window={AllstarFirebaseService:{firebaseServices:async()=>({firestore:{},modules:{firestore}})}};
Function('window','Date',fs.readFileSync(path.join(root,'js/saveService.js'),'utf8'))(window,TestDate);
const service=window.AllstarSaveService;
const keys=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).cards.filter(c=>c.rarity==='Ultime').map(c=>c.key);
function fixture(uid,collection={}){const data={uid,playerState:{credits:41,collection,careerUnlocked:8,starterGranted:true,welcomeClaimed:true},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'pc-import'}};store.set(uid,copy(data));return copy(data)}
const claim=uid=>service.claimMobileLaunchGift(uid,keys,service.progressionToken(store.get(uid)));
(async()=>{
 assert.equal(keys.length,6);assert(keys.includes('ultime_catcheurs_marc_sebire'));assert(keys.includes('ultime_catcheurs_ultima_sombra_halloween'));
 assert.equal(service.MOBILE_LAUNCH_GIFT.start,Date.parse('2026-11-01T19:00:00Z'),'Launch is 20:00 Paris, not midnight or UTC 20:00');
 fixture('morning');now=Date.parse('2026-11-01T12:00:00+01:00');assert.equal(await claim('morning'),null);assert.equal(store.get('morning').playerState.credits,41);
 fixture('bounds');now=service.MOBILE_LAUNCH_GIFT.start-1;assert.equal(await claim('bounds'),null);
 now++;assert((await claim('bounds')).receipt);assert.equal(store.get('bounds').playerState.credits,5041);
 fixture('end');now=service.MOBILE_LAUNCH_GIFT.end;assert.equal(await claim('end'),null);
 now--;assert((await claim('end')).receipt);
 now=service.MOBILE_LAUNCH_GIFT.start;
 for(const key of keys){fixture(key,Object.fromEntries(keys.filter(k=>k!==key).map(k=>[k,1])));const result=await claim(key);assert.equal(result.receipt.cardKey,key);assert.equal(result.receipt.newCard,true)}
 fixture('full',Object.fromEntries(keys.map(k=>[k,1])));assert.equal((await claim('full')).receipt.newCard,false);
 const before=fixture('parallel');const token=service.progressionToken(before);
 const results=await Promise.all(Array.from({length:8},()=>service.claimMobileLaunchGift('parallel',keys,token)));
 assert(results.every(r=>r.receipt.cardKey===results[0].receipt.cardKey));
 assert.equal(store.get('parallel').playerState.credits,5041);assert.equal(Object.values(store.get('parallel').collection).reduce((a,b)=>a+b,0),1);
 assert.equal(store.get('parallel').cloudSaveHistory.baseline.playerState.credits,41);
 const committed=copy(store.get('parallel'));assert.deepEqual((await claim('parallel')).receipt,results[0].receipt,'Lost response replays exact receipt');assert.deepEqual(store.get('parallel'),committed);
 await service.acknowledgeMobileLaunchGift('parallel',results[0].receipt.cardKey);assert(store.get('parallel').campaignRewards.mobile_launch_2026_11.presentedAt);
 const acked=copy(store.get('parallel'));await service.acknowledgeMobileLaunchGift('parallel',results[0].receipt.cardKey);assert.deepEqual(store.get('parallel'),acked);
 const spent=copy(acked.playerState);spent.credits=100;
 await service.commitProgression('parallel',{playerState:spent,deckState:acked.deckState,collection:spent.collection,decks:acked.deckState},service.progressionToken(acked));
 assert.deepEqual(store.get('parallel').campaignRewards,acked.campaignRewards,'Ordinary spending preserves the account receipt');
 await claim('parallel');assert.equal(store.get('parallel').playerState.credits,100,'Spending the reward does not make it claimable again');
 now=service.MOBILE_LAUNCH_GIFT.end+1;assert((await claim('parallel')).receipt.presentedAt,'Receipt survives end of campaign');
 now=service.MOBILE_LAUNCH_GIFT.start;
 fixture('prepared');store.get('prepared').pendingPcTransfer={bundle:{preserve:true}};const prepared=copy(store.get('prepared'));assert.equal(await claim('prepared'),null);assert.deepEqual(store.get('prepared'),prepared);
 fixture('offline');offline=true;await assert.rejects(claim('offline'),/offline/);offline=false;assert.equal(store.get('offline').playerState.credits,41);assert((await claim('offline')).receipt);
 fixture('stale');await assert.rejects(service.claimMobileLaunchGift('stale',keys,'stale'),e=>e.code==='allstar/save-conflict');assert.equal(store.get('stale').playerState.credits,41);
 fixture('large');store.get('large').padding='x'.repeat(750000);await assert.rejects(claim('large'),e=>e.code==='allstar/save-protection');assert.equal(store.get('large').playerState.credits,41);
 const priorProfile=service.migrationProfileToken(fixture('profile-race'));await claim('profile-race');assert.notEqual(service.migrationProfileToken(store.get('profile-race')),priorProfile);
 await assert.rejects(service.acknowledgeMobileLaunchGift('stale',keys[0]),e=>e.code==='allstar/save-protection');
 console.log('Launch gift: Paris boundaries, all six Ultimates including event cards, unowned priority, duplicate fallback, eight concurrent claims, durable receipt/replay/ack, offline retry, source priority, conflicts, backups and size protection verified (mock Firestore).');
})().catch(error=>{console.error(error);process.exitCode=1});
