const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
const document={addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},getElementById(){return null}};
let choice,spins=[],published=[];
const window={publishOnlineMatchState:async value=>{published.push(value)}};
const api=Function('document','window','setTimeout',source+`
render=()=>{};showEffectFeedback=()=>{};log=()=>{};
requestEffectChoice=options=>window.capture(options);
return {state,cardByKey,score,playCard,applyTrackedObjectEffect,applyWrestlerEntryEffect,roundDieStatContender,resolveRoundDieStatChoice,revertActiveObject,wrestlerDieBonus,getRoundReroller,onlineSnapshotFromGame,restoreOnlineSide,resumeOnlineWheelReroll,requestOnlineWheelRerollChoice,requestOnlineDieStatChoice,stripOwnerForNetwork,
set(value){G=value},get(){return G},renderWheel(fn){showWheelCore=fn},submitting(){return onlineWheelRerollSubmitting},choice(){return activeOnlineChoice}};
`)(document,window,()=>0);
window.capture=value=>{choice=value};
let serial=0;
const ultima='ultime_catcheurs_ultima_sombra_halloween',hades='legende_catcheurs_hades_halloween',mask='rare_objets_masque_halloween',normal='standard_catcheurs_angelo_folena';
const card=key=>({...api.cardByKey(key),id:'fixture-'+(++serial)});
function setup(pKey=ultima,aKey=normal){
 const side=side=>({side,label:side,cat:null,man:null,obj:null,hand:[],deck:[],grave:[],played:{},oncePerMatch:{}});
 const p=side('player'),a=side('ai'),g={round:1,mode:'test',player:p,ai:a,effectMarks:{}};api.set(g);choice=null;
 p.cat=api.state(card(pKey));p.cat.owner=p;a.cat=api.state(card(aKey));a.cat.owner=a;
 return {p,a,g};
}
function equip(p,a){const c=card(mask);p.hand.push(c);api.playCard(p,a,c,p.hand.length-1);return c;}
function rng(values,fn){const prev=Math.random;Math.random=()=>values.length?values.shift():0;try{return fn()}finally{Math.random=prev}}

// Every natural face: exactly two successes unassisted, three with the mask.
for(const boosted of [false,true]){
 let success=0;
 for(let face=1;face<=6;face++){
  const {p,a,g}=setup();if(boosted)equip(p,a);
  const result=rng([(face-.5)/6],()=>api.roundDieStatContender());
  assert.equal(p.cat.effectDie.base,face);assert.equal(p.cat.effectDie.result,face+(boosted?1:0));
  if(result)success++;
  assert.equal(api.roundDieStatContender(),null,'No extra roll on a reroll of the same duel');
  assert.equal(api.getRoundReroller(),undefined,'Ultima no longer grants a once-per-match reroll');
  assert.equal(api.score(p.cat,'Force'),8,'No old +2 Force bonus');
  g.round++;
  assert(rng([.99],()=>api.roundDieStatContender()),'The effect is usable next round');
 }
 assert.equal(success,boosted?3:2);
}
{
 const {p,a}=setup();equip(p,a);p.wrestlerEffectsBlocked=true;
 assert.equal(api.roundDieStatContender(),null,'Wrestler cancellation prevents the roll');
}
{
 const {p,a}=setup();equip(p,a);p.objectsBlocked=true;
 assert.equal(api.wrestlerDieBonus(p),0,'Object cancellation removes the modifier');
}
{
 const {p,a}=setup(normal);p.deck=[card(normal),card(normal)];const c=equip(p,a);
 assert.equal(p.hand.length,1,'Non-dice wrestler draws immediately once');
 assert.equal(p.nextDrawBonus,undefined,'No delayed draw');
 api.revertActiveObject(p);assert.equal(p.grave.at(-1).id,c.id);assert.equal(p.hand.length,1);
}
{
 const {p,a}=setup();equip(p,a);assert.equal(api.wrestlerDieBonus(p),1);api.revertActiveObject(p);
 assert.equal(api.wrestlerDieBonus(p),0,'Expired mask no longer changes dice');
}
{
 const {p,a}=setup(normal);p.cat.card.ability='doubleEquippedSupportUpToRare';p.deck=[card(normal),card(normal)];equip(p,a);
 assert.equal(p.hand.length,2,'Existing double-support ability doubles the immediate draw');
}
{
 const {p,a}=setup(normal);p.cat.card.ability='immuneOtherCardEffects';p.deck=[card(normal)];equip(p,a);
 assert.equal(p.hand.length,0,'The mask respects immunity to other card effects');
}
{
 const {p,a}=setup();const c=equip(p,a);c.originalAbility=c.ability;c.ability='invertedSupport';
 assert.equal(api.wrestlerDieBonus(p),-1,'G KING inversion changes future +1 into -1');
 assert.equal(rng([.5],()=>api.roundDieStatContender()),null);
 assert.equal(p.cat.effectDie.result,3);
}
{
 const {p,a}=setup(normal);const c=card(mask);c.originalAbility=c.ability;c.ability='invertedSupport';p.obj=c;p.hand=[card(normal),card(normal)];
 api.applyTrackedObjectEffect(p,a,c);assert.equal(p.hand.length,1);assert.equal(p.grave.length,1,'Inverted immediate draw becomes discard');
}
// Hades rolls on entry before the object can be played: same-turn bonus without a reroll.
for(const beforeEntry of [false,true]){
 const {p,a,g}=setup(hades);if(beforeEntry)equip(p,a);
 rng([.999,0],()=>api.applyWrestlerEntryEffect(p,p.cat.card));
 if(!beforeEntry)equip(p,a);
 assert.equal(a.cat.mods.Force,-7);assert.equal(p.cat.effectDie.base,6);assert.equal(p.cat.effectDie.result,7);
 const snapshot=api.stripOwnerForNetwork(p);assert.equal(snapshot.cat.effectDie.result,7);
 const restored=api.restoreOnlineSide(snapshot,'player');api.set({...g,player:restored});
 api.applyTrackedObjectEffect(restored,a,restored.obj);
 assert.equal(a.cat.mods.Force,-7,'Restoring the snapshot does not apply the same mask twice');
 api.revertActiveObject(restored);assert.equal(a.cat.mods.Force,-7,'A completed die outcome is not undone on expiration');
}
{
 const {p,a,g}=setup(hades);rng([.999,0],()=>api.applyWrestlerEntryEffect(p,p.cat.card));g.round++;
 equip(p,a);assert.equal(a.cat.mods.Force,-6,'No alteration of a past-round entry die');
}
{
 const {p,a}=setup(ultima,ultima);
 assert.equal(rng([.8,.99],()=>api.roundDieStatContender()).owner,a,'Higher successful die controls the duel');
}
{
 const {p,a}=setup(ultima,ultima);
 assert.equal(rng([.99,.99],()=>api.roundDieStatContender()),null,'Successful tie uses roulette');
}
{
 const {p,a}=setup(ultima,ultima);equip(p,a);
 assert.equal(rng([.99,.99],()=>api.roundDieStatContender()).owner,p,'Modified 7 beats a natural 6');
}
{
 const {p,a}=setup();p.cat.card={...card('legende_catcheurs_agathe_aries'),ability:'entryCopyOpponentAbility'};p.cat.copiedAbility='roundDieChooseStat';
 assert.equal(rng([.99],()=>api.roundDieStatContender()).owner,p,'Copied ability uses the same die logic');
}
{
 const {p,a}=setup();rng([.99],()=>api.resolveRoundDieStatChoice(stat=>spins.push(stat)));
 assert.equal(choice.choices.length,4);choice.onChoose('Charisme');assert.equal(spins.at(-1),'Charisme');
}
// The resolver must ask the remote human; never auto-select as if it were an AI.
for(const slot of ['p1','p2']){
 const {p,a,g}=setup(normal,ultima);g.mode='online';g.matchOptions={onlineMatchId:'fixture',onlinePlayerSlot:slot,onlineRoom:{roomCode:'FIXTURE',playerSlot:slot,opponentSlot:slot==='p1'?'p2':'p1'}};
 let advanced=false;rng([.99],()=>api.resolveRoundDieStatChoice(()=>{advanced=true}));
 assert.equal(advanced,false);assert.equal(g.stat,null);assert.equal(g.wheelRerollEvent.kind,'die-stat');
 assert.equal(g.wheelRerollEvent.ownerSlot,slot==='p1'?'p2':'p1');assert.equal(g.wheelRerollEvent.resolverSlot,slot);
 const snapshot=api.onlineSnapshotFromGame();assert.equal(snapshot.wheelSpinId,null,'No fake spin before remote choice');
 const event={...g.wheelRerollEvent,status:'resolved',choice:'Vitesse'};g.wheelRerollEvent=event;
 api.renderWheel((cb,options)=>spins.push(options.forcedStat));api.resumeOnlineWheelReroll(event);
 assert.equal(spins.at(-1),'Vitesse');
}
console.log('Halloween dice: all faces, mask draw/expiration/cancellation, Hades 6+1 in either play order, snapshot replay, copied ability, opposed dice and remote-human selection on both slots OK.');
