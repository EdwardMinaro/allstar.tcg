const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const gamePath = path.join(root, "js", "game.js");
const audioPath = path.join(root, "js", "audio.js");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function readPngDimensions(file) {
  const data = fs.readFileSync(file);
  if (data.length < 24 || data.toString("ascii", 1, 4) !== "PNG") return null;
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

function normalizeName(name) {
  return String(name || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function loadGame() {
  const source = read(gamePath);
  const documentStub = {
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; }
  };
  const windowStub = {};
  return Function(
    "document",
    "window",
    `${source}
return {
  CARD_DATA,
  EFFECT_REGISTRY,
  CAREER_ROSTER,
  STATS,
  cardKey,
  cardByKey,
  careerOpponents,
  careerDeckForOpponent,
  deckRuleMessage
};`
  )(documentStub, windowStub);
}

function loadAudio() {
  const source = read(audioPath);
  const match = source.match(/const AUDIO_LIBRARY = (\{[\s\S]*?\n\};)/);
  return match ? Function(`return ${match[1].replace(/;$/, "")}`)() : { music: {} };
}

function rarityCounts(cards) {
  return cards.reduce((acc, card) => {
    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
    return acc;
  }, {});
}

function run() {
  const game = loadGame();
  const audio = loadAudio();
  const errors = [];
  const warnings = [];

  const keys = new Map();
  for (const card of game.CARD_DATA) {
    const key = game.cardKey(card);
    if (keys.has(key)) errors.push(`Carte dupliquée: ${key}`);
    keys.set(key, card);

    if (card.ability && !game.EFFECT_REGISTRY[card.ability]) {
      errors.push(`${card.name} ${card.rarity}: effet introuvable "${card.ability}"`);
    }

    if (card.type === "Catcheur" && card.rarity === "Standard" && card.ability) {
      errors.push(`${card.name} Standard: un catcheur standard ne doit pas avoir d'effet réel`);
    }

    if (card.type === "Catcheur" && (card.rarity === "Standard" || card.rarity === "Rare")) {
      const total = game.STATS.reduce((sum, stat) => sum + Number(card.stats?.[stat] || 0), 0);
      if (total !== 24) errors.push(`${card.name} ${card.rarity}: ${total} points de stats au lieu de 24`);
    }

    const renderPath = card.renderArt ? path.join(root, card.renderArt) : null;
    if (!renderPath || !fs.existsSync(renderPath)) {
      errors.push(`${card.name} ${card.rarity}: image introuvable (${card.renderArt || "aucun renderArt"})`);
    } else {
      const dimensions = readPngDimensions(renderPath);
      const normalizedSizes = new Set(["1102x1498", "1106x1502"]);
      const size = dimensions ? `${dimensions.width}x${dimensions.height}` : "format inconnu";
      if (!dimensions || !normalizedSizes.has(size)) {
        errors.push(`${card.name} ${card.rarity}: dimensions de rendu anormales (${size})`);
      }
    }

    const text = String(card.effect || "").toLowerCase();
    const impliesChoice = /\b(choisissez|choisis)\b/.test(text) || (/\bou\b/.test(text) && !/\bou plus\b/.test(text) && !/\bsi vous jouez\b/.test(text));
    if (card.ability && impliesChoice && !game.EFFECT_REGISTRY[card.ability]?.choice) {
      warnings.push(`${card.name} ${card.rarity}: le texte implique un choix mais l'effet n'est pas déclaré comme choix`);
    }
  }

  const opponents = game.careerOpponents();
  for (const opponent of opponents) {
    if (!opponent.card) {
      errors.push(`Carrière: carte adversaire manquante pour ${opponent.name}`);
      continue;
    }
    const deckKeys = game.careerDeckForOpponent(opponent);
    const deckCards = deckKeys.map(game.cardByKey).filter(Boolean);
    if (deckKeys.length !== 20) errors.push(`Carrière ${opponent.name}: deck IA à ${deckKeys.length}/20 cartes`);
    if (!deckCards.some(card => card.type === "Catcheur")) errors.push(`Carrière ${opponent.name}: deck sans catcheur`);
    const counts = rarityCounts(deckCards);
    if ((counts.Rare || 0) > 8) errors.push(`Carrière ${opponent.name}: ${counts.Rare} rares dans le deck`);
    if ((counts.Legende || 0) > 3) errors.push(`Carrière ${opponent.name}: ${counts.Legende} légendaires dans le deck`);
  }

  const musicByWrestler = new Set(Object.values(audio.music || {})
    .filter(item => item.wrestler)
    .map(item => normalizeName(item.wrestler)));
  Object.entries(audio.music || {}).forEach(([id, item]) => {
    if (item.wrestler && !item.teamTheme && item.label !== item.wrestler) {
      errors.push(`Thème ${id}: le libellé "${item.label}" doit être exactement le nom du catcheur "${item.wrestler}"`);
    }
  });
  game.CARD_DATA.filter(card => card.musicId).forEach(card => {
    const track = audio.music?.[card.musicId];
    if (track && normalizeName(track.wrestler) !== normalizeName(card.name)) {
      errors.push(`${card.name} ${card.rarity}: le thème "${card.musicId}" est attribué à "${track.wrestler}"`);
    }
  });
  const wrestlers = [...new Set(game.CARD_DATA
    .filter(card => card.type === "Catcheur")
    .map(card => card.name))]
    .sort((a, b) => a.localeCompare(b));
  const missingThemes = wrestlers.filter(name => !musicByWrestler.has(normalizeName(name)));
  if (missingThemes.length) warnings.push(`Thèmes manquants ou non branchés: ${missingThemes.join(", ")}`);

  const musicMissingFiles = Object.values(audio.music || {})
    .filter(item => item.src && !fs.existsSync(path.join(root, item.src)))
    .map(item => `${item.label || item.src} -> ${item.src}`);
  musicMissingFiles.forEach(item => warnings.push(`Audio placeholder/introuvable: ${item}`));

  console.log("=== ALLSTAR AUDIT ===");
  console.log(`Cartes: ${game.CARD_DATA.length}`);
  console.log(`Effets déclarés: ${Object.keys(game.EFFECT_REGISTRY).length}`);
  console.log(`Adversaires carrière: ${opponents.length}`);
  console.log(`Catcheurs distincts: ${wrestlers.length}`);
  console.log(`Erreurs: ${errors.length}`);
  console.log(`Avertissements: ${warnings.length}`);
  if (errors.length) {
    console.log("\n[ERREURS]");
    errors.forEach(item => console.log(`- ${item}`));
  }
  if (warnings.length) {
    console.log("\n[WARNINGS]");
    warnings.forEach(item => console.log(`- ${item}`));
  }
  process.exitCode = errors.length ? 1 : 0;
}

run();
