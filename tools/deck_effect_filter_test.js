const assert=require("assert/strict");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const api=Function("document","window",source+`
return {CARD_DATA,DECK_EFFECT_FAMILIES,deckEffectFamilies};
`)({addEventListener(){},querySelectorAll(){return []},querySelector(){return null},getElementById(){return null}},{});

const cards=JSON.parse(fs.readFileSync(path.join(root,"data/cards.json"),"utf8")).cards;
assert.deepEqual(api.CARD_DATA,cards,"deck filters must use the cards loaded by the game");
const ids=api.DECK_EFFECT_FAMILIES.map(family=>family.id);
assert.equal(new Set(ids).size,ids.length,"family identifiers must be unique");

function card(ability){
  const found=cards.find(item=>item.ability===ability);
  assert.ok(found,`missing test card for ${ability}`);
  return found;
}
function has(ability,...families){
  const actual=api.deckEffectFamilies(card(ability));
  for(const family of families)assert.ok(actual.includes(family),`${ability} should match ${family}; got ${actual}`);
}

has("mAll3","stats");
has("cancelObjects","cancel");
has("cancelAllObjects","cancel");
has("drawOnEntry2","draw");
has("opponentDiscard1","discard");
has("recoverGrave","recover");
has("megaphoneRound1","draw","discard");
has("entryDiscardUpTo3RandomStat2","stats","discard");
has("pinDual20Shield10","pin","defense");
has("roundRpsAll1","stats","wheel");
has("roundDieChooseStat","wheel");
has("objectDieBonusOrDraw","draw","support");
has("entryCopyOpponentAbility","copy");
has("entryInvertOpponentSupports","copy");

for(const item of cards){
  const families=api.deckEffectFamilies(item);
  assert.ok(families.length,"every card needs a family");
  if(item.ability)assert.ok(!families.includes("other"),`unclassified ability: ${item.ability}`);
  else assert.deepEqual(families,["none"],`card without ability: ${item.name}`);
}
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert.match(html,/id="deckEffectFilter"[^>]*onchange="setDeckInventoryFilter\('effect',this.value\)"/);
console.log(`Deck effect filters: ${cards.length} cards, ${ids.length} families, no unclassified abilities`);
