const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},classList:{add(){}}});return nodes.get(id);};
const api=Function('document','window',source+`
log=()=>{};showEffectFeedback=()=>{};markOnlineDirty=()=>{};render=()=>{};playSound=()=>{};
let choice;requestEffectChoice=options=>{choice=options;};
return {CARD_DATA,state,applyEffect,applyTrackedObjectEffect,finishChosenHandDiscard,requestChosenHandDiscard,pendingChosenHandDiscard,passTurn,canTagPlayer,showChallengeResult,game(value){G=value},get(){return G},choice(){return choice}};
`)({addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},getElementById:node},{});
const poubelle=api.CARD_DATA.find(c=>c.key==='rare_objets_poubelle');
assert.equal(poubelle.rarity,'Standard');assert.equal(poubelle.effect,'L’adversaire choisit une carte de sa main puis la défausse.');
const side=name=>({side:name,label:name,hand:[],deck:[],grave:[],oncePerMatch:{},played:{},cat:null});
function setup(){const player=side('player'),ai=side('ai');api.game({mode:'test',round:1,currentTurn:'ai',player,ai});for(const p of[player,ai]){p.cat=api.state({...api.CARD_DATA.find(c=>c.type==='Catcheur'&&c.rarity==='Standard'),id:p.side});p.cat.owner=p;}return{player,ai};}
const cards=()=>['standard_objets_chaise','standard_objets_livre','standard_catcheurs_g_king'].map((key,i)=>({...api.CARD_DATA.find(c=>c.key===key),id:`card${i}`}));
for(const apply of[api.applyTrackedObjectEffect,api.applyEffect]){
 const {player,ai}=setup();player.hand=cards();const original=player.hand.slice();
 apply(ai,player,{...poubelle,id:'poubelle'});
 assert.equal(player.hand.length,3,'no automatic pop/random discard');assert(api.pendingChosenHandDiscard());
 assert.equal(api.canTagPlayer(),false);api.passTurn();assert.equal(api.get().currentTurn,'ai');
 assert.deepEqual(api.choice().choices.map(c=>c.value),original.map(c=>c.id));
 api.choice().onChoose('card0');assert.deepEqual(player.grave,[original[0]]);assert.equal(player.hand.length,2);assert(!api.pendingChosenHandDiscard());
 assert.equal(api.get().currentTurn,'ai','discard does not end the active turn');
}
{
 const {player}=setup();player.hand=cards();api.requestChosenHandDiscard(player,poubelle,2);
 const stale=api.get().wheelRerollEvent;api.choice().onChoose('card1');assert.equal(player.hand.length,2);assert.equal(api.get().wheelRerollEvent.remaining,1);
 api.finishChosenHandDiscard(stale,'card0');assert.equal(player.hand.length,2,'old choice cannot consume a new request');
 api.choice().onChoose('card0');assert.equal(player.hand.length,1);assert(!api.pendingChosenHandDiscard());
}
{
 const {ai}=setup();ai.hand=cards();api.requestChosenHandDiscard(ai,poubelle,2);assert.equal(ai.hand.length,1);assert.equal(ai.hand[0].type,'Catcheur','AI protects its last wrestler');assert.equal(ai.grave.length,2);
 api.requestChosenHandDiscard(ai,poubelle,5);assert.equal(ai.hand.length,0);assert(!api.pendingChosenHandDiscard());
}
api.showChallengeResult('Victoire','',true);assert.equal(node('pinReplayButton').hidden,true);assert.equal(node('pinReplayButton').disabled,true);
api.showChallengeResult('Défaite','',false);assert.equal(node('pinReplayButton').hidden,false);assert.equal(node('pinReplayButton').disabled,false);
api.showChallengeResult('Victoire','',true);assert.equal(node('pinReplayButton').style.display,'none');
const saveWindow={};Function('window',fs.readFileSync(path.join(root,'js/saveService.js'),'utf8'))(saveWindow);
const save=saveWindow.AllstarSaveService,p={collection:{rare_objets_poubelle:4},credits:100,cardConversions:{rare_objets_poubelle:3}};
assert.equal(save.duplicateValue('rare_objets_poubelle'),10);assert.equal(save.convertSurplus(p),20);assert.equal(p.credits,120);assert.equal(p.cardConversions.rare_objets_poubelle,5);assert.equal(save.convertSurplus(p),0);
assert.equal(save.duplicateValue('rare_objets_batte_de_baseball'),50);
const roomWindow={};Function('window',fs.readFileSync(path.join(root,'js/roomService.js'),'utf8'))(roomWindow);
(async()=>{
 for(const resolver of['p1','p2']){
  const owner=resolver==='p1'?'p2':'p1';let room={status:'playing',players:{p1:{},p2:{}},matchState:{round:1,player:{hand:cards()},ai:{hand:cards()},wheelRerollEvent:{kind:'hand-discard',id:'discard',round:1,status:'pending',resolverSlot:resolver,ownerSlot:owner}}};
  const adapter={async updateRoom(_code,updater){room=updater(room);return structuredClone(room)}};const service=new roomWindow.RoomService(adapter);
  const pending=structuredClone(room.matchState);
  await assert.rejects(service.submitWheelRerollChoice('room',resolver,'discard','card0'),/adversaire/);
  await assert.rejects(service.submitWheelRerollChoice('room',owner,'discard','not-in-hand'),/invalide/);
  await service.submitWheelRerollChoice('room',owner,'discard','card0');assert.equal(room.matchState.wheelRerollEvent.choice,'card0');
  await service.updateMatchState('room',resolver,pending);assert.equal(room.matchState.wheelRerollEvent.status,'resolved','stale resolver cannot erase a choice');
  await service.updateMatchState('room',owner,{round:1,player:{hand:[]},wheelRerollEvent:null});assert.equal(room.matchState.wheelRerollEvent.status,'resolved','selector cannot overwrite the full match');
  await assert.rejects(service.submitWheelRerollChoice('room',owner,'discard','card1'),/active/);
  const resolved=structuredClone(room.matchState);resolved.wheelRerollEvent=null;await service.updateMatchState('room',resolver,resolved);assert.equal(room.matchState.wheelRerollEvent,null);
 }
 console.log('Poubelle Standard: real target choice, both effect paths, doubled/stale choices, AI, preserved ID/ledger and 10-credit future surplus; online ownership/stale writes in both slots; weekly victory hides Replay and defeat resets it.');
})().catch(e=>{console.error(e);process.exitCode=1});
