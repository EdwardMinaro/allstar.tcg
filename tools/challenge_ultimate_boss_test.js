const assert=require("assert/strict");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const documentStub={
  addEventListener(){},
  querySelectorAll(){return[]},
  querySelector(){return null},
  getElementById(){return null}
};
const game=Function("document","window",`${source}
return {CARD_DATA,cardKey,cardByKey,challengeDeckForBoss,needsStartingWrestler};
`)(documentStub,{});

const ultimateBosses=game.CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Ultime");
assert.ok(ultimateBosses.length,"at least one Ultimate boss is required");

for(const boss of ultimateBosses){
  const deck=game.challengeDeckForBoss(boss);
  assert.equal(deck.length,20,`${boss.name}: challenge deck must contain 20 cards`);
  assert.equal(deck.filter(key=>key===game.cardKey(boss)).length,1,`${boss.name}: boss must appear once`);

  // Le boss du défi est installé directement sur le ring avant le mulligan.
  // Une main composée uniquement de soutiens est donc valide et ne doit pas
  // relancer indéfiniment le tirage de départ.
  const startingHand=deck.slice(1,6).map(game.cardByKey);
  assert.equal(
    game.needsStartingWrestler({cat:{card:boss},hand:startingHand}),
    false,
    `${boss.name}: an Ultimate already on the ring must bypass the opening mulligan`
  );
}

assert.equal(game.needsStartingWrestler({cat:null,hand:[]}),true,"a normal empty board still needs a wrestler");
console.log(`Ultimate challenge bosses: ${ultimateBosses.length} decks bypass the opening mulligan once the boss is on the ring`);
