const assert=require("assert/strict");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const logElement={innerHTML:"",scrollTop:0,scrollHeight:0};
const documentStub={
  body:{classList:{toggle(){}}},
  addEventListener(){},
  querySelectorAll(){return[]},
  querySelector(){return null},
  getElementById(id){return id==="log"?logElement:null}
};
const game=Function("document","window","setTimeout","clearTimeout",`${source}
return {
  CARD_DATA,HALLOWEEN_EVENT,EFFECT_REGISTRY,STATS,cardByKey,cardKey,state,score,
  isHalloweenEventActive,rarityPool,pickHalloweenExclusive,generateHalloweenBooster,
  applyWrestlerEntryEffect,applyYacineTransfer,lowerRarityPinBonus,acceptUltimateForceBonus,
  game(value){G=value;}
};
`)(documentStub,{},()=>0,()=>{});

assert.equal(game.HALLOWEEN_EVENT.price,666);
assert.equal(game.isHalloweenEventActive(Date.parse("2026-10-29T00:00:00+01:00")),true);
assert.equal(game.isHalloweenEventActive(Date.parse("2026-11-19T23:59:59+01:00")),true);
assert.equal(game.isHalloweenEventActive(Date.parse("2026-11-20T00:00:00+01:00")),false);
assert.equal(game.HALLOWEEN_EVENT.exclusives.length,5);
game.HALLOWEEN_EVENT.exclusives.forEach(entry=>assert.ok(game.cardByKey(entry.key),`missing Halloween card ${entry.key}`));

const expectedRolls=[
  [0,"rare_catcheurs_ben_damage_halloween"],
  [.199999,"rare_catcheurs_ben_damage_halloween"],
  [.2,"rare_catcheurs_melusine_halloween"],
  [.399999,"rare_catcheurs_melusine_halloween"],
  [.4,"legende_catcheurs_black_sam_halloween"],
  [.499999,"legende_catcheurs_black_sam_halloween"],
  [.5,"legende_catcheurs_hades_halloween"],
  [.599999,"legende_catcheurs_hades_halloween"],
  [.6,"ultime_catcheurs_ultima_sombra_halloween"],
  [.609999,"ultime_catcheurs_ultima_sombra_halloween"],
  [.61,null]
];
expectedRolls.forEach(([roll,key])=>assert.equal(game.pickHalloweenExclusive(roll)?.key||null,key,`wrong Halloween roll boundary ${roll}`));
for(const rarity of ["Rare","Legende","Ultime"]){
  assert.equal(game.rarityPool(rarity).some(card=>card.exclusiveEvent),false,`${rarity}: event card leaked into normal boosters`);
}
const halloweenPack=game.generateHalloweenBooster(.605);
assert.equal(halloweenPack.length,5);
assert.equal(halloweenPack.filter(card=>card.exclusiveEvent).length,1);
assert.equal(halloweenPack.find(card=>card.exclusiveEvent)?.key,"ultime_catcheurs_ultima_sombra_halloween");
assert.equal(game.generateHalloweenBooster(.9).some(card=>card.exclusiveEvent),false);

const makeSide=(side,label)=>({side,label,cat:null,man:null,obj:null,hand:[],deck:[],grave:[],effectMarks:{},rerollUsed:false});
const player=makeSide("player","Joueur"),ai=makeSide("ai","Adversaire");
const runtime={round:2,player,ai,effectMarks:{},stat:"Force"};
game.game(runtime);

const ben=game.cardByKey("rare_catcheurs_ben_damage_halloween");
const opponentCard=game.CARD_DATA.find(card=>card.type==="Catcheur"&&card.rarity==="Rare"&&card.key!==ben.key);
player.cat=game.state({...ben,id:"ben-test"});player.cat.owner=player;
ai.cat=game.state({...opponentCard,id:"enemy-test"});ai.cat.owner=ai;
ai.cat.mods={Force:2,Vitesse:-1,Technique:0,Charisme:3};
game.applyWrestlerEntryEffect(player,player.cat.card);
assert.deepEqual(player.cat.mods,{Force:2,Vitesse:-1,Technique:0,Charisme:3},"Ben Damage must copy opposing bonuses and penalties");
assert.deepEqual(ai.cat.mods,{Force:2,Vitesse:-1,Technique:0,Charisme:3},"Ben Damage must not remove the original opposing changes");

const hades=game.cardByKey("legende_catcheurs_hades_halloween");
player.cat=game.state({...hades,id:"hades-test"});player.cat.owner=player;
ai.cat=game.state({...opponentCard,id:"hades-enemy"});ai.cat.owner=ai;
const originalRandom=Math.random;
let rolls=[.999,0];Math.random=()=>rolls.shift()??0;
game.applyWrestlerEntryEffect(player,player.cat.card);
Math.random=originalRandom;
assert.equal(ai.cat.mods.Force,-6,"Hades must apply the d6 result to one random opposing stat");

const melusine=game.cardByKey("rare_catcheurs_melusine_halloween");
player.cat=game.state({...melusine,id:"melusine-test"});player.cat.owner=player;player.cat.enteredRound=1;
const beforeTotal=game.STATS.reduce((sum,stat)=>sum+player.cat.mods[stat],0);
Math.random=()=>0;
game.applyYacineTransfer(player);
Math.random=originalRandom;
const changed=game.STATS.filter(stat=>player.cat.mods[stat]!==0);
assert.equal(changed.length,2,"Melusine must affect two different stats");
assert.equal(game.STATS.reduce((sum,stat)=>sum+player.cat.mods[stat],0)-beforeTotal,1,"Melusine transfer must net +1");

const blackSam=game.cardByKey("legende_catcheurs_black_sam_halloween");
player.cat=game.state({...blackSam,id:"black-test"});player.cat.owner=player;
ai.cat=game.state({...opponentCard,id:"black-enemy"});ai.cat.owner=ai;
assert.equal(game.lowerRarityPinBonus(player,ai),30);
ai.cat.card={...ai.cat.card,rarity:"Ultime"};
assert.equal(game.lowerRarityPinBonus(player,ai),0);

const ultima=game.cardByKey("ultime_catcheurs_ultima_sombra_halloween");
player.cat=game.state({...ultima,id:"ultima-test"});player.cat.owner=player;player.rerollUsed=false;
assert.equal(game.acceptUltimateForceBonus(player,"Force"),true);
assert.equal(game.score(player.cat,"Force"),ultima.stats.Force+2);
assert.equal(game.acceptUltimateForceBonus(player,"Force"),false,"Ultima Sombra may only use the choice once per match");

console.log("Halloween 2026: dates, 666-credit pack odds, exclusivity and five card effects OK");
