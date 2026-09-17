const assert=require("assert/strict");
const fs=require("fs");
const path=require("path");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"js/game.js"),"utf8");
const game=Function("document","window",source+`
return {
  CARD_DATA,legalDeckKeys,deckRuleMessage,deckLaunchMessage,deckLegendSlotCount,
  deckRarityCount,sanitizeDeck,autoDeckFromCollection,
  ownAll(){playerState.collection=Object.fromEntries(CARD_DATA.map(card=>[cardKey(card),1]));playerState.loaded=true;}
};
`)({addEventListener(){},querySelectorAll(){return []},querySelector(){return null},getElementById(){return null}},{});

game.ownAll();
const keys=rarity=>game.CARD_DATA.filter(card=>card.rarity===rarity).map(card=>card.key);
const [ultimateA,ultimateB]=keys("Ultime");
const [legendA,legendB,legendC]=keys("Legende");
const standards=keys("Standard");
const deck=cards=>({name:"Test",cards});

const threeLegends=deck([legendA,legendB,legendC,...standards.slice(0,17)]);
assert.equal(game.deckRuleMessage(threeLegends),"","three Legendaries should still be legal");
assert.equal(game.deckLaunchMessage(threeLegends),"","three Legendaries should launch");

const twoLegendsAndUltimate=deck([ultimateA,legendA,legendB,...standards.slice(0,17)]);
assert.equal(game.deckLegendSlotCount(twoLegendsAndUltimate),3);
assert.equal(game.deckRarityCount(twoLegendsAndUltimate,"Ultime"),1);
assert.equal(game.deckRuleMessage(twoLegendsAndUltimate),"","Ultimate should occupy one of three slots");
assert.equal(game.deckLaunchMessage(twoLegendsAndUltimate),"","legal Ultimate deck should launch");

const overLimit=deck([ultimateA,legendA,legendB,legendC,...standards.slice(0,16)]);
assert.match(game.deckRuleMessage(overLimit),/Maximum 3 cartes Légendaires et Ultimes/);
assert.match(game.deckLaunchMessage(overLimit),/Maximum 3 cartes Légendaires et Ultimes/);
assert.equal(game.sanitizeDeck(overLimit).cards.length,20,"saved decks remain intact so players can edit them");
assert.deepEqual(game.legalDeckKeys([ultimateA,legendA,legendB,legendC]),[ultimateA,legendA,legendB]);

const twoUltimates=deck([ultimateA,ultimateB,legendA,legendB,...standards.slice(0,16)]);
assert.match(game.deckRuleMessage(twoUltimates),/Maximum 1 carte Ultime/);
assert.match(game.deckLaunchMessage(twoUltimates),/Maximum 1 carte Ultime/);
assert.deepEqual(game.legalDeckKeys([ultimateA,ultimateB,legendA,legendB]),[ultimateA,legendA,legendB]);
assert.match(game.deckRuleMessage(deck([ultimateA,ultimateA])),/Maximum 1 carte Ultime/);
const roomForOne=deck(twoLegendsAndUltimate.cards.slice(0,19));
assert.match(game.deckRuleMessage(roomForOne,ultimateB),/Maximum 1 carte Ultime/);
assert.match(game.deckRuleMessage(roomForOne,legendC),/Maximum 3 cartes Légendaires et Ultimes/);

const automatic=deck(game.autoDeckFromCollection());
assert.equal(game.deckRuleMessage(automatic),"","automatic decks must respect rarity limits");
console.log("Deck rarity: three shared Legend/Ultimate slots and one Ultimate maximum, including saved and automatic decks");
