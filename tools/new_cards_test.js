const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const api=Function('document','window','setTimeout',source+`
log=()=>{};showEffectFeedback=()=>{};markOnlineDirty=()=>{};render=()=>{};playSound=()=>{};attemptPin=()=>{};
return {CARD_DATA,state,score,win,rerollLostDuelWithObject,applyYacineTransfer,applyWrestlerEntryEffect,wrestlerAbility,applyEffect,applyTrackedObjectEffect,invertOpponentSupports,applyInvertedSupportRound,applyInvertedObject,clearWrestler,captureDefeatedWrestler,revertActiveObject,resetSupportForPlay,drawStartOfRound,applyRoundManagerEffects,restoreOnlineSide,game(value){G=value;},round(value){G.round=value;}};
`)({addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;},getElementById(){return null;}},{},()=>{});
const data=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).cards;
assert.deepEqual(api.CARD_DATA,data,'embedded and external card databases differ');
let serial=0;
function card(key){const c=structuredClone(data.find(c=>c.key===key));assert.ok(c,key);c.id='test'+(++serial);return c;}
function networkClone(value){return JSON.parse(JSON.stringify(value,(key,item)=>key==='owner'?undefined:item));}
function setup(playerKey='legende_catcheurs_g_king',aiKey='standard_catcheurs_g_king',round=1){
 const side=(name,key)=>({side:name,label:name,hand:[],deck:[],grave:[],pinShield:0,objectDurationBonus:0,koSuffered:0,oncePerMatch:{},played:{},cat:null});
 const player=side('player'),ai=side('ai');api.game({player,ai,round,roundStarter:'player',mode:'test'});
 player.cat=api.state(card(playerKey));player.cat.owner=player;ai.cat=api.state(card(aiKey));ai.cat.owner=ai;
 return {player,ai};
}
const stats={legende_catcheurs_yacine_osmani:[8,6,8,6],legende_catcheurs_agathe_aries:[5,7,7,9],legende_catcheurs_g_king:[9,7,4,8]};
for(const [key,values] of Object.entries(stats))assert.deepEqual(['Force','Technique','Vitesse','Charisme'].map(s=>card(key).stats[s]),values);
for(const key of ['standard_catcheurs_agathe_aries','standard_catcheurs_g_king']){assert.equal(card(key).effect,'');assert.equal(card(key).ability,undefined);}
{
 const {player}=setup('legende_catcheurs_yacine_osmani');
 assert.equal(api.score(player.cat,'Force'),10);api.round(2);
 assert.equal(api.score(player.cat,'Force'),8);
 for(let round=2;round<20;round++){
  api.round(round);const before={...player.cat.mods};api.applyYacineTransfer(player);
  const changes=Object.keys(before).map(k=>player.cat.mods[k]-before[k]).sort();assert.deepEqual(changes,[-1,0,0,1]);
  const after={...player.cat.mods};api.applyYacineTransfer(player);assert.deepEqual(player.cat.mods,after,'transfer repeats in same round');
 }
}
{
 const {player,ai}=setup('legende_catcheurs_agathe_aries','rare_catcheurs_the_iconic_charlie');
 api.applyWrestlerEntryEffect(player,player.cat.card);assert.equal(api.wrestlerAbility(player.cat),'firstRoundCharTech2');
 assert.equal(api.score(player.cat,'Technique'),9);assert.equal(player.cat.card.ability,'entryCopyOpponentAbility');
 assert.equal(ai.cat.card.ability,'firstRoundCharTech2');
 const copied=JSON.parse(JSON.stringify({...player.cat,owner:null}));assert.equal(api.wrestlerAbility(copied),'firstRoundCharTech2');
}
{
 const {player,ai}=setup('legende_catcheurs_agathe_aries');
 ai.cat.card.ability='turnEnemyForceMinus1';
 api.applyWrestlerEntryEffect(player,player.cat.card);
 api.applyRoundManagerEffects();
 assert.equal(ai.cat.mods.Force,-1,'Agathe did not run the copied per-round ability');
}
{
 const {player}=setup('legende_catcheurs_agathe_aries','legende_catcheurs_agathe_aries');api.applyWrestlerEntryEffect(player,player.cat.card);assert.equal(api.wrestlerAbility(player.cat),null);
}
{
 const {player,ai}=setup('rare_catcheurs_maxxy');const target=ai.cat.card;
 api.clearWrestler(ai);assert.equal(api.captureDefeatedWrestler(player,ai,target),true);assert.equal(ai.grave.includes(target),false);assert.equal(player.grave.filter(c=>c.id===target.id).length,1);
 assert.equal(api.captureDefeatedWrestler(player,ai,target),false);
 const actual=setup('rare_catcheurs_maxxy');const defeated=actual.ai.cat.card;api.win(actual.player,actual.ai,'test');assert.ok(actual.player.grave.includes(defeated));assert.ok(!actual.ai.grave.includes(defeated));
 const saved=setup('rare_catcheurs_maxxy');saved.ai.cat.save=true;const saveCard=saved.ai.cat.card;api.clearWrestler(saved.ai);assert.equal(api.captureDefeatedWrestler(saved.player,saved.ai,saveCard),false);assert.ok(saved.ai.hand.includes(saveCard));
}
{
 const {player,ai}=setup();ai.man={id:'bonus',ability:'mForce',name:'Test',type:'Manager',rarity:'Standard'};
 api.applyEffect(ai,player,ai.man);assert.equal(ai.cat.mods.Force,2);api.invertOpponentSupports(player);assert.equal(ai.cat.mods.Force,-2);api.invertOpponentSupports(player);assert.equal(ai.cat.mods.Force,2);
 ai.obj={id:'obj',ability:'pinShield5',name:'Test',type:'Objet',rarity:'Standard'};api.applyTrackedObjectEffect(ai,player,ai.obj);api.invertOpponentSupports(player);assert.equal(ai.pinShield,-5);api.revertActiveObject(ai);assert.equal(ai.pinShield,0);
}
{
 const {player,ai}=setup();
 ai.man={id:'recurring',ability:'turnEnemyPinMinus10',name:'Protection',type:'Manager',rarity:'Rare'};
 api.applyEffect(ai,player,ai.man);
 api.invertOpponentSupports(player);
 api.applyRoundManagerEffects();
 assert.equal(player.pinShield,-10,'inverted recurring protection did not strengthen the opposing pin');
 api.invertOpponentSupports(player);
 assert.equal(player.pinShield,10,'restoring the manager did not reverse its accumulated active value');
}
{
 const {player,ai}=setup();
 ai.man={id:'duration',ability:'objectExtra2',name:'Durée',type:'Manager',rarity:'Rare'};
 api.applyEffect(ai,player,ai.man);assert.equal(ai.objectDurationBonus,2);
 api.invertOpponentSupports(player);assert.equal(ai.objectDurationBonus,-2);
 api.invertOpponentSupports(player);assert.equal(ai.objectDurationBonus,2);
}
{
 const {player,ai}=setup('legende_catcheurs_g_king');
 ai.cat.card.ability='immuneOtherCardEffects';
 ai.man={id:'immune-bonus',ability:'mAll1',name:'Immunisé',type:'Manager',rarity:'Standard'};
 api.applyEffect(ai,player,ai.man);
 const before={...ai.cat.mods};api.invertOpponentSupports(player);
 assert.equal(ai.man.ability,'mAll1');assert.deepEqual(ai.cat.mods,before,'G KING bypassed wrestler immunity');
}
{
 const {player,ai}=setup();
 ai.man={id:'network-bonus',ability:'mForce',name:'Test réseau',type:'Manager',rarity:'Standard'};
 api.applyEffect(ai,player,ai.man);
 const remoteAi=api.restoreOnlineSide(networkClone(ai),'player');
 const remotePlayer=api.restoreOnlineSide(networkClone(player),'ai');
 assert.equal(remoteAi.man.supportDeltas[0].side,'player','tracked support target was not remapped for player 2');
 api.game({player:remoteAi,ai:remotePlayer,round:1,roundStarter:'player',mode:'online'});
 api.invertOpponentSupports(remotePlayer);
 assert.equal(remoteAi.cat.mods.Force,-2,'remote inversion changed the wrong wrestler');
 assert.equal(remotePlayer.cat.mods.Force,0,'remote inversion leaked onto the caster');
 const returnedAi=api.restoreOnlineSide(networkClone(remoteAi),'ai');
 assert.equal(returnedAi.man.supportDeltas[0].side,'ai','tracked support target did not survive a round trip');
}
{
 const {player,ai}=setup();ai.obj={id:'draw',ability:'drawNext1',type:'Objet',name:'Caddie'};api.applyTrackedObjectEffect(ai,player,ai.obj);assert.equal(ai.nextDrawBonus,1);
 api.invertOpponentSupports(player);assert.equal(ai.nextDrawBonus,0);assert.equal(ai.nextDiscardBonus,1);
 ai.hand=[card('standard_catcheurs_g_king')];ai.deck=[card('standard_catcheurs_agathe_aries')];api.drawStartOfRound();assert.equal(ai.hand.length,1);assert.equal(ai.grave.length,1);
 ai.obj.originalAbility='recoverGrave';api.applyInvertedObject(ai,player,ai.obj);assert.equal(ai.hand.length,0);
 ai.obj.originalAbility='opponentDiscard1';ai.deck=[card('standard_catcheurs_g_king')];api.applyInvertedObject(ai,player,ai.obj);assert.equal(ai.hand.length,1);
}
{
 const {player,ai}=setup();ai.man={id:'cancel',name:'Test',ability:'cancelOpponentWrestlerEffects',type:'Manager'};api.applyEffect(ai,player,ai.man);assert.equal(player.wrestlerEffectsBlocked,true);api.applyWrestlerEntryEffect(player,player.cat.card);assert.equal(player.wrestlerEffectsBlocked,false);assert.equal(ai.man.ability,'invertedSupport');
 const serialized=JSON.parse(JSON.stringify(ai.man));api.resetSupportForPlay(serialized);assert.equal(serialized.ability,'cancelOpponentWrestlerEffects');assert.equal(serialized.supportDeltas,undefined);
}
{
 const {player,ai}=setup();ai.man={id:'cancel-supports',name:'Annulation',ability:'cancelObjectsManagers',type:'Manager'};
 api.applyEffect(ai,player,ai.man);assert.equal(player.objectsBlocked,true);assert.equal(player.managersBlocked,true);
 api.invertOpponentSupports(player);assert.equal(player.objectsBlocked,false);assert.equal(player.managersBlocked,false);
 api.invertOpponentSupports(player);assert.equal(player.objectsBlocked,true);assert.equal(player.managersBlocked,true);
}
{
 const {player,ai}=setup();ai.obj={id:'camera',name:'Caméra',ability:'rerollOnLoss',type:'Objet'};
 api.invertOpponentSupports(player);assert.equal(api.rerollLostDuelWithObject(ai),false);assert.equal(api.rerollLostDuelWithObject(ai,true),true);assert.equal(api.rerollLostDuelWithObject(ai,true),false);
}
console.log('New cards: stats, standards, transfer, copying, capture, inversion and replay state OK.');
