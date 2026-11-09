const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {service}=require('./account_save_test.js');
const source=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
function device(random=Math.random){
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const window={crypto:crypto.webcrypto,AllstarSaveService:service};
 Function('window',fs.readFileSync(path.join(__dirname,'../js/rankingService.js'),'utf8'))(window);
 const document={addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return[]}};
 const math=Object.create(Math);math.random=random;
 const api=Function('window','document','localStorage','setTimeout','clearTimeout','Math',source+`
applyCardSleeves=()=>{};queueCloudSave=()=>{};
return {load(){activateSaveScope();loadPlayerState();loadDeckState();return {player:serializedPlayerState(),decks:serializedDeckState()}},
reset(){localStorage.removeItem('allstarsPlayerV1:guest');localStorage.removeItem('allstarsDecks:guest')},
starter(){return starterStandardCards().map(cardKey)},known(){return CARD_DATA.map(cardKey)},
playable(){return deckLaunchMessage(selectedDeck())},rewards(){return startupWelcomeRewards.length}};
`)(window,document,storage,()=>0,()=>{},math);
 return {...api,storage,values};
}
// Even adversarial random draws (five identical cards / multiple Ultimates)
// must produce five keepable cards and a legal 20-card starting deck.
for(const random of [()=>0,()=>.999999,Math.random]){
 const d=device(random),first=d.load();
 assert.equal(first.player.credits,0);assert.equal(first.player.welcomeClaimed,true);assert.equal(first.player.guestOrigin.legacy,false);
 assert.equal(Object.values(first.player.collection).reduce((a,n)=>a+n,0),20);
 assert.equal(first.decks.decks[0].cards.length,20);assert.equal(d.playable(),'');assert.equal(d.rewards(),1);
 assert(!first.player.cosmeticInventory.sleeves.halloween);assert.deepEqual(first.player.limitedRewards,{});
 const receipt=d.storage.getItem('allstarsGuestWelcomeV1'),again=d.load();
 assert.deepEqual(again.player.collection,first.player.collection);assert.equal(again.player.credits,0);assert.equal(d.rewards(),0);
 d.reset();const reset=d.load();assert.equal(d.storage.getItem('allstarsGuestWelcomeV1'),receipt);
 assert.deepEqual(reset.player.collection,first.player.collection);assert.equal(reset.player.guestOrigin.id,first.player.guestOrigin.id);assert.equal(d.playable(),'');
 const source={playerState:reset.player,deckState:reset.decks};
 const fresh=service.buildGuestTransfer({uid:'new'},source,{newAccount:true,knownKeys:d.known()});
 assert.equal(fresh.playerState.welcomeClaimed,true,'No second Champion on account creation');assert.equal(fresh.playerState.credits,1000);
 const current={uid:'old',playerState:{credits:10,collection:{},careerUnlocked:0},deckState:{decks:[]},saveLinkVerified:{schema:1,source:'player-confirmed'}};
 const existing=service.buildGuestTransfer(current,source,{knownKeys:d.known()});
 for(const key of reset.player.guestOrigin.welcomeCards)assert.equal(existing.playerState.collection[key]||0,0,'Starter gift not stacked onto an existing account');
}
// Repair a guest save made by 0.2.43, including its persisted 15-card deck.
const old=device(),keys=old.starter();
old.storage.setItem('allstarsPlayerV1:guest',JSON.stringify({credits:0,collection:Object.fromEntries(keys.map(k=>[k,1])),starterGranted:true,welcomeClaimed:false,careerUnlocked:0,guestOrigin:{schema:1,id:'existing-guest-source-00000001',legacy:false}}));
old.storage.setItem('allstarsDecks:guest',JSON.stringify({decks:[{id:'starter',name:'Deck de départ',cards:keys}],selectedId:'starter'}));
const repaired=old.load();assert.equal(repaired.decks.decks[0].cards.length,20);assert.equal(old.playable(),'');assert.equal(repaired.player.credits,0);
// Guest receipts never participate in normal account pack creation.
console.log('Guest Champion: 20 owned/playable cards, duplicate/Ultimate-heavy draws, no credits/event gifts, no repeat on reload, same pack/source after reset, repair of existing 15-card starter, and account transfer gift rules verified.');
