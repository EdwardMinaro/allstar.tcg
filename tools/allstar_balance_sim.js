const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gamePath = path.join(root, "js", "game.js");
const source = fs.readFileSync(gamePath, "utf8");

function loadGame() {
  const documentStub = {
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; }
  };
  const windowStub = {};
  return Function("document", "window", `${source}
return {
  CARD_DATA,
  CAREER_ROSTER,
  STATS,
  cardKey,
  cardByKey,
  legalDeckKeys,
  careerOpponents,
  careerDeckForOpponent
};`)(documentStub, windowStub);
}

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function shuffle(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clone(card) {
  return JSON.parse(JSON.stringify(card));
}

function cardBaseScore(card) {
  const statScore = Object.values(card.stats || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const rarityBonus = { Standard: 0, Rare: 1.5, Legende: 3.5, Ultime: 6 }[card.rarity] || 0;
  const effectBonus = card.ability ? 1 : 0;
  return statScore + rarityBonus + effectBonus;
}

function makePlayerBenchmarkDeck(game) {
  const byPower = rarity => game.CARD_DATA
    .filter(card => card.rarity === rarity)
    .sort((a, b) => cardBaseScore(b) - cardBaseScore(a));
  const legends = byPower("Legende");
  const rares = byPower("Rare");
  const standards = byPower("Standard");
  const keys = [
    ...legends.filter(card => card.type === "Catcheur").slice(0, 2),
    ...legends.filter(card => card.type !== "Catcheur").slice(0, 1),
    ...rares.filter(card => card.type === "Catcheur").slice(0, 6),
    ...rares.filter(card => card.type !== "Catcheur").slice(0, 2),
    ...standards.filter(card => card.type === "Catcheur").slice(0, 7),
    ...standards.filter(card => card.type !== "Catcheur").slice(0, 2)
  ].map(game.cardKey);
  return game.legalDeckKeys(keys);
}

function initPlayer(label, side, deckKeys, game, rng) {
  const deck = shuffle(deckKeys.map(key => game.cardByKey(key)).filter(Boolean).map(clone), rng);
  return {
    label,
    side,
    deck,
    hand: [],
    grave: [],
    cat: null,
    man: null,
    obj: null,
    objTurns: 0,
    pinShield: 0,
    koSuffered: 0,
    wins: 0,
    once: {}
  };
}

function makeState(card, owner) {
  return {
    card,
    owner,
    mods: { Force: 0, Vitesse: 0, Technique: 0, Charisme: 0 },
    pin: 0,
    rounds: 0,
    firstWinAll1Used: false,
    firstLoss: false
  };
}

function draw(player, count, rng) {
  for (let i = 0; i < count; i++) {
    if (!player.deck.length && player.grave.length) {
      player.deck = shuffle(player.grave.splice(0), rng);
    }
    const card = player.deck.shift();
    if (card) player.hand.push(card);
  }
}

function hasCat(player) {
  return player.hand.some(card => card.type === "Catcheur") || player.deck.some(card => card.type === "Catcheur");
}

function chooseBest(player, type, stat = null) {
  let bestIndex = -1;
  let bestScore = -Infinity;
  player.hand.forEach((card, index) => {
    if (card.type !== type) return;
    const score = type === "Catcheur"
      ? (stat ? Number(card.stats?.[stat] || 0) : cardBaseScore(card))
      : cardBaseScore(card);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  if (bestIndex < 0) return null;
  return player.hand.splice(bestIndex, 1)[0];
}

function addAll(state, value) {
  ["Force", "Vitesse", "Technique", "Charisme"].forEach(stat => state.mods[stat] += value);
}

function randomStat(game, rng) {
  return game.STATS[Math.floor(rng() * game.STATS.length)];
}

function applyManager(player, manager, game, rng) {
  if (!player.cat) return;
  const s = player.cat;
  switch (manager.ability) {
    case "mForce":
    case "mForce1":
      s.mods.Force += 1;
      break;
    case "mForce3":
      s.mods.Force += 3;
      break;
    case "mVitesse1":
      s.mods.Vitesse += 1;
      break;
    case "mCharisme":
    case "mCharisme1":
      s.mods.Charisme += 1;
      break;
    case "mCharisme3":
      s.mods.Charisme += 3;
      break;
    case "mAll1":
      addAll(s, 1);
      break;
    case "mAll2IfGrave3":
      if (player.grave.filter(card => card.type === "Catcheur").length >= 3) addAll(s, 2);
      break;
    case "mRandom":
      s.mods[randomStat(game, rng)] += 1;
      break;
    case "mRandom2":
      s.mods[randomStat(game, rng)] += 2;
      break;
    case "objectExtra1":
      player.objectBonus = Math.max(player.objectBonus || 0, 1);
      break;
    case "objectExtra2":
      player.objectBonus = Math.max(player.objectBonus || 0, 2);
      break;
  }
}

function playCards(player, opponent, game, rng, stat) {
  if (!player.cat) {
    const cat = chooseBest(player, "Catcheur", stat);
    if (cat) {
      player.cat = makeState(cat, player);
      if (cat.ability === "drawOnEntry1") draw(player, 1, rng);
      if (cat.ability === "drawOnEntry2") draw(player, 2, rng);
      if (cat.ability === "pinShield") player.pinShield += 10;
      if (cat.ability === "pinShield20") player.pinShield += 20;
      if (cat.ability === "pinDual20Shield10") {
        player.pinShield += 10;
        player.cat.pin += 20;
      }
    }
  }
  if (!player.man) {
    const manager = chooseBest(player, "Manager");
    if (manager) {
      player.man = manager;
      applyManager(player, manager, game, rng);
    }
  }
  if (!player.obj && player.cat) {
    const object = chooseBest(player, "Objet");
    if (object) {
      player.obj = object;
      player.objTurns = 1 + (player.objectBonus || 0);
      applyObject(player, opponent, object, game, rng);
    }
  }
}

function applyObject(player, opponent, object, game, rng) {
  const s = player.cat;
  if (!s) return;
  switch (object.ability) {
    case "mAll3":
      addAll(s, 3);
      break;
    case "pinObject20":
      if (s.card.stats.Charisme >= 6) s.mods.Charisme += 2;
      else s.pin += 20;
      break;
    case "pinObject5":
      s.pin += 5;
      break;
    case "pinShield5":
      player.pinShield += 5;
      break;
    case "drawNext1":
      draw(player, 1, rng);
      break;
    case "opponentDiscard1":
      if (opponent.hand.length) opponent.grave.push(opponent.hand.pop());
      break;
    case "recoverGrave": {
      const card = player.grave.pop();
      if (card) player.hand.push(card);
      break;
    }
  }
}

function turnRoundEffects(player, opponent, game, rng) {
  if (!player.cat) return;
  const ability = player.cat.card.ability;
  if (ability === "turnCatRandom2" || ability === "turnCatRandom3") {
    if (player.cat.randomBonusStat) player.cat.mods[player.cat.randomBonusStat] -= player.cat.randomBonusValue;
    const value = ability === "turnCatRandom3" ? 3 : 2;
    const stat = randomStat(game, rng);
    player.cat.randomBonusStat = stat;
    player.cat.randomBonusValue = value;
    player.cat.mods[stat] += value;
  }
  if ((ability === "turnEnemyForceMinus1" || ability === "turnEnemyForceMinus2") && opponent.cat) {
    opponent.cat.mods.Force -= ability === "turnEnemyForceMinus2" ? 2 : 1;
  }
  const chance = { turnRandomPermanent10: 0.1, turnRandomPermanent20: 0.2, turnRandomPermanent30: 0.3 }[player.man?.ability || ability] || 0;
  if (chance && rng() < chance) player.cat.mods[randomStat(game, rng)] += 1;
}

function score(state, stat, round, roundStarter) {
  if (!state) return 0;
  let value = Number(state.card.stats?.[stat] || 0) + Number(state.mods?.[stat] || 0);
  const firstRound = state.rounds === 0;
  const matchRoundOne = round === 1;
  const ability = state.card.ability;
  if (ability === "firstRoundSpeed2" && firstRound && stat === "Vitesse") value += 2;
  if (ability === "firstRoundSpeed3" && firstRound && stat === "Vitesse") value += 3;
  if (ability === "firstRoundSpeedTechnique1" && firstRound && (stat === "Vitesse" || stat === "Technique")) value += 1;
  if (ability === "firstRoundSpeedTechnique2" && firstRound && (stat === "Vitesse" || stat === "Technique")) value += 2;
  if (ability === "firstRoundForceTechnique" && firstRound && (stat === "Force" || stat === "Technique")) value += 1;
  if (ability === "firstRoundCharTech" && matchRoundOne && (stat === "Charisme" || stat === "Technique")) value += 1;
  if (ability === "firstRoundForceCharTech" && matchRoundOne && (stat === "Force" || stat === "Charisme" || stat === "Technique")) value += 1;
  if (ability === "firstRoundSpeedCharisma3" && matchRoundOne && (stat === "Vitesse" || stat === "Charisme")) value += 3;
  if (ability === "techniqueRound1" && matchRoundOne && stat === "Technique") value += 3;
  if (ability === "managerOwnedTechForceSpeed1" && state.owner.man && (stat === "Technique" || stat === "Force" || stat === "Vitesse")) value += 1;
  if (ability === "managerOwnedForceSpeed1" && state.owner.man && (stat === "Force" || stat === "Vitesse")) value += 1;
  if (ability === "round2ActiveStat3" && round === 2) value += 3;
  if (ability === "secondPlayerTechniqueCharisma2" && state.owner.side !== roundStarter && (stat === "Technique" || stat === "Charisme")) value += 2;
  return value;
}

function clearLoser(player, winner, rng) {
  if (!player.cat) return;
  const lost = player.cat;
  const ability = lost.card.ability;
  if (ability === "bossSecondWind" && !player.once.bossSecondWind) {
    player.once.bossSecondWind = true;
    lost.mods.Force += 3;
    lost.mods.Vitesse += 3;
    return;
  }
  if (ability === "firstLossDeck" && !player.once.firstLossDeck) {
    player.once.firstLossDeck = true;
    player.deck.unshift(lost.card);
    player.cat = null;
    return;
  }
  if ((ability === "returnChance" && rng() < 0.2) || (ability === "returnChance40" && rng() < 0.4)) {
    player.deck.unshift(lost.card);
  } else {
    player.koSuffered += 1;
    player.grave.push(lost.card);
  }
  player.cat = null;
  if (player.man) {
    player.grave.push(player.man);
    player.man = null;
  }
  if (player.obj) {
    player.grave.push(player.obj);
    player.obj = null;
  }
  if (ability === "nextEntryAll1" && !player.once.nextEntryAll1) {
    player.once.nextEntryAll1 = true;
    player.nextAll = 1;
  }
}

function applyWinEffects(winner, loser, rng) {
  const s = winner.cat;
  if (!s) return;
  const ability = s.card.ability;
  if (ability === "drawOnWin1") draw(winner, 1, rng);
  if (ability === "drawOnWin2") draw(winner, 2, rng);
  if (ability === "winSpeedCharisma1") {
    s.mods.Vitesse += 1;
    s.mods.Charisme += 1;
  }
  if (ability === "firstWinAll1" && !s.firstWinAll1Used) {
    s.firstWinAll1Used = true;
    addAll(s, 1);
  }
  if (ability === "winNextEnemyTechniqueMinus2") loser.nextTechnique = Math.min(loser.nextTechnique || 0, -2);
  if (ability === "winNextEnemyTechniqueMinus3") loser.nextTechnique = Math.min(loser.nextTechnique || 0, -3);
}

function attemptPin(attacker, target, rng) {
  if (!attacker.cat) return false;
  const koCount = target.koSuffered || 0;
  const ability = attacker.cat.card.ability;
  const abilityBonus = ability === "pinBonus" && koCount >= 2 ? 20 : ability === "pinBonus40" && koCount >= 2 ? 40 : 0;
  const chance = Math.max(0, Math.min(100, koCount * 10 + (attacker.cat.pin || 0) + abilityBonus - (target.pinShield || 0)));
  target.pinShield = 0;
  return (Math.floor(rng() * 100) + 1) <= chance;
}

function tickObjects(player) {
  if (!player.obj) return;
  player.objTurns -= 1;
  if (player.objTurns <= 0) {
    player.grave.push(player.obj);
    player.obj = null;
  }
}

function simulateMatch(game, playerDeckKeys, aiDeckKeys, seed) {
  const rng = createRng(seed);
  const player = initPlayer("Joueur", "player", playerDeckKeys, game, rng);
  const ai = initPlayer("Adversaire", "ai", aiDeckKeys, game, rng);
  draw(player, 5, rng);
  draw(ai, 5, rng);
  let guard = 0;
  while (!player.hand.some(card => card.type === "Catcheur") && hasCat(player) && guard++ < 10) {
    player.deck.push(...player.hand.splice(0));
    player.deck = shuffle(player.deck, rng);
    draw(player, 5, rng);
  }
  guard = 0;
  while (!ai.hand.some(card => card.type === "Catcheur") && hasCat(ai) && guard++ < 10) {
    ai.deck.push(...ai.hand.splice(0));
    ai.deck = shuffle(ai.deck, rng);
    draw(ai, 5, rng);
  }

  const firstStarter = rng() < 0.5 ? "player" : "ai";
  let roundStarter = firstStarter;
  for (let round = 1; round <= 50; round++) {
    draw(player, 1, rng);
    draw(ai, 1, rng);
    const stat = game.STATS[Math.floor(rng() * game.STATS.length)];
    const first = roundStarter === "player" ? player : ai;
    const second = roundStarter === "player" ? ai : player;
    playCards(first, second, game, rng, stat);
    playCards(second, first, game, rng, stat);
    if (player.cat && player.nextAll) {
      addAll(player.cat, player.nextAll);
      player.nextAll = 0;
    }
    if (ai.cat && ai.nextAll) {
      addAll(ai.cat, ai.nextAll);
      ai.nextAll = 0;
    }
    if (player.cat && player.nextTechnique) {
      player.cat.mods.Technique += player.nextTechnique;
      player.nextTechnique = 0;
    }
    if (ai.cat && ai.nextTechnique) {
      ai.cat.mods.Technique += ai.nextTechnique;
      ai.nextTechnique = 0;
    }
    turnRoundEffects(player, ai, game, rng);
    turnRoundEffects(ai, player, game, rng);
    if (!player.cat && !ai.cat) continue;
    if (!player.cat) return { winner: "ai", rounds: round, reason: "no_player_cat" };
    if (!ai.cat) return { winner: "player", rounds: round, reason: "no_ai_cat" };

    const playerScore = score(player.cat, stat, round, roundStarter);
    const aiScore = score(ai.cat, stat, round, roundStarter);
    if (playerScore !== aiScore) {
      const winner = playerScore > aiScore ? player : ai;
      const loser = playerScore > aiScore ? ai : player;
      applyWinEffects(winner, loser, rng);
      clearLoser(loser, winner, rng);
      if (attemptPin(winner, loser, rng)) {
        return { winner: winner.side, rounds: round, reason: "pin" };
      }
    }
    tickObjects(player);
    tickObjects(ai);
    if (player.hand.length > 7) player.grave.push(...player.hand.splice(7));
    if (ai.hand.length > 7) ai.grave.push(...ai.hand.splice(7));
    roundStarter = roundStarter === "player" ? "ai" : "player";
  }
  return { winner: "timeout", rounds: 50, reason: "timeout" };
}

function summarize(results) {
  const total = results.length;
  const playerWins = results.filter(result => result.winner === "player").length;
  const aiWins = results.filter(result => result.winner === "ai").length;
  const timeouts = results.filter(result => result.winner === "timeout").length;
  const avgRounds = results.reduce((sum, result) => sum + result.rounds, 0) / total;
  return {
    playerWinRate: playerWins / total,
    aiWinRate: aiWins / total,
    timeouts,
    avgRounds
  };
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function run() {
  const game = loadGame();
  const playerDeck = makePlayerBenchmarkDeck(game);
  const opponents = game.careerOpponents();
  const gamesPerOpponent = Number(process.argv[2] || 200);
  const rows = [];
  opponents.forEach((opponent, index) => {
    const aiDeck = game.careerDeckForOpponent(opponent);
    const results = [];
    for (let i = 0; i < gamesPerOpponent; i++) {
      results.push(simulateMatch(game, playerDeck, aiDeck, (index + 1) * 100000 + i));
    }
    const summary = summarize(results);
    rows.push({
      index: index + 1,
      name: opponent.name,
      season: opponent.season,
      difficulty: opponent.difficulty,
      deck: aiDeck.length,
      playerWinRate: summary.playerWinRate,
      aiWinRate: summary.aiWinRate,
      avgRounds: summary.avgRounds,
      timeouts: summary.timeouts
    });
  });

  console.log("=== ALLSTAR BALANCE SIM ===");
  console.log(`Simulation simplifiée: ${gamesPerOpponent} matchs par adversaire`);
  console.log(`Deck benchmark joueur: ${playerDeck.length} cartes`);
  console.log("");
  rows.forEach(row => {
    const flags = [];
    if (row.deck !== 20) flags.push("DECK");
    if (row.aiWinRate > 0.75) flags.push("DUR");
    if (row.aiWinRate < 0.25) flags.push("FAIBLE");
    if (row.avgRounds < 4) flags.push("COURT");
    if (row.avgRounds > 18) flags.push("LONG");
    console.log(`${String(row.index).padStart(2, "0")}. ${row.name.padEnd(24)} diff ${row.difficulty} | IA ${pct(row.aiWinRate).padStart(6)} | joueur ${pct(row.playerWinRate).padStart(6)} | ${row.avgRounds.toFixed(1).padStart(4)} rounds | ${flags.join(", ")}`);
  });
  const hard = rows.filter(row => row.aiWinRate > 0.75);
  const weak = rows.filter(row => row.aiWinRate < 0.25);
  const bySeason = new Map();
  rows.forEach(row => {
    const item = bySeason.get(row.season) || [];
    item.push(row);
    bySeason.set(row.season, item);
  });
  console.log("");
  console.log("[Moyennes par saison]");
  [...bySeason.entries()].sort((a, b) => a[0] - b[0]).forEach(([season, items]) => {
    const avg = items.reduce((sum, row) => sum + row.aiWinRate, 0) / items.length;
    console.log(`- Saison ${season + 1}: IA ${pct(avg)}`);
  });
  console.log("");
  console.log(`[Synthèse] Trop forts: ${hard.map(row => row.name).join(", ") || "aucun"}`);
  console.log(`[Synthèse] Trop faibles: ${weak.map(row => row.name).join(", ") || "aucun"}`);
  const championRows = rows.filter(row => row.season === 3);
  const softChampions = championRows.filter(row => row.aiWinRate < 0.45);
  if (softChampions.length) console.log(`[Vigilance] Champions un peu tendres dans cette simulation: ${softChampions.map(row => row.name).join(", ")}`);
  console.log("[Note] Cette simulation est un radar d'équilibrage, pas une preuve absolue: le jeu réel reste la référence.");
}

run();
