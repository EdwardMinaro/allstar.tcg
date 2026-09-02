const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.resolve(process.argv[2] || "");
const cardsPath = path.join(projectRoot, "data", "cards.json");
const gamePath = path.join(projectRoot, "js", "game.js");
const renderDir = path.join(projectRoot, "assets", "card_renders");
const musicDir = path.join(projectRoot, "assets", "audio", "music");
const reportPath = path.join(projectRoot, "tools", "last_import_report.json");

if (!sourceRoot || !fs.existsSync(sourceRoot)) {
  console.error("Usage: node tools/import_folder_cards.js <dossier-source>");
  process.exit(1);
}

const TYPE_MAP = {
  wrestler: "Catcheur",
  catcheur: "Catcheur",
  catcher: "Catcheur",
  manager: "Manager",
  bonus: "Manager",
  object: "Objet",
  objet: "Objet",
};

const MUSIC_TARGETS = {
  "History Untold (Entrance Edit).mp3": "adam_frost.mp3",
  "copy_AA475EE8-BCB0-4AEA-9360-29AE91889027.mp3": "coda_reznov.mp3",
  "Melusine.mp3": "melusine.mp3",
  "Melusine Aconit.mp3": "melusine_aconit.mp3",
  "Kev Lagadec titantron theme song.mov (2).mp3": "kev_lagadec.mp3",
  "El Amnesico.mp3": "el_amnesico.mp3",
  "1-LOVE IN THE FIELD.mp3": "alex_kiss.mp3",
  "Thème Officiel Eddy Marston.mp3": "eddy_marston.mp3",
  "Jafar Jordan Street.mp3": "jafar_jordan.mp3",
  "Koro new thème song.mp3": "koro.mp3",
  "maffa.mp3": "maffa.mp3",
  "TPW Thème Officiel Mareck.mp3": "mareck.mp3",
  "Lestrange Theme.mp3": "romain_lestrange.mp3",
  "Heddi Karaoui.mp3": "heddi_karaoui.mp3",
  "Ben Damage Songg.wav": "ben_damage.wav",
  "Julius Trajan HCP Titantron.mp3": "julius_trajan.mp3",
  "Musique Marcus JAW (I ain't got time).mp3": "marcus_jaw.mp3",
  "Slow Royale.mp3": "peter_fischer.mp3",
  "12 - ROCKY J.mp3": "rocky_j.mp3",
  "Thème Officiel Marc Sebire.mp3": "marc_sebire.mp3",
  "Thème Officiel Rafael Belmont.mp3": "rafael_belmont.mp3",
  "Thème Officiel John Gage.mp3": "john_gage.mp3",
};

const MUSIC_BY_FOLDER = {
  "adam_frost": "adam_frost.mp3",
  "coda_reznov": "coda_reznov.mp3",
  "alex_kiss": "alex_kiss.mp3",
  "eddy_marston": "eddy_marston.mp3",
  "jafar_jordan": "jafar_jordan.mp3",
  "koro": "koro.mp3",
  "lior_divine": "lior_divine.mp3",
  "maffa": "maffa.mp3",
  "mareck": "mareck.mp3",
  "romain_lestrange": "romain_lestrange.mp3",
  "saitovic": "saitovic.mp3",
  "shawn_olsen": "shawn_olsen.mp3",
  "ben_damage": "ben_damage.wav",
  "julius_trajan": "julius_trajan.mp3",
  "marcus_jaw": "marcus_jaw.mp3",
  "peter_fischer": "peter_fischer.mp3",
  "rocky_j": "rocky_j.mp3",
};

const BLOCKED_MUSIC_FOLDERS = new Set([
  "ryu_kaizaru",
]);

const ABILITY_BY_KEY = {
  "Rare|Catcheur|Adam Frost": "turnEnemyRandomPermanent1Max5",
  "Legende|Catcheur|Adam Frost": "turnEnemyRandomPermanent2Max3",
  "Rare|Catcheur|Melusine": "entryMelusineGraveSpeedTechnique1Each",
  "Rare|Catcheur|Kev Lagadec": "doubleEquippedSupportUpToRare",
  "Rare|Catcheur|Coda Reznov": "entryRandomStat3",
  "Legende|Catcheur|Coda Reznov": "entryStatChoice3",
  "Rare|Catcheur|Alex Kiss": "graveElAmnesicoAll1",
  "Legende|Catcheur|NILS'N": "firstRoundRandomStats5",
  "Rare|Catcheur|Yann Skoric": "drawOnEntry1",
  "Legende|Catcheur|Yann Skoric": "drawOnEntry3",
  "Rare|Catcheur|Queen Phoenixia": "recoverBonusDeck",
  "Rare|Catcheur|Eddy Marston": "objectExtra1",
  "Rare|Catcheur|Fenrir Strom": "round4All1",
  "Rare|Catcheur|Jafar Jordan": "firstRoundCharTech2",
  "Rare|Catcheur|Koro": "drawOnEntry1",
  "Rare|Catcheur|Mareck": "recoverGraveDiscard1",
  "Legende|Catcheur|Mareck": "recoverOrPlayObjectGrave",
  "Legende|Catcheur|Saitovic": "recoverGraveDiscard1",
  "Rare|Catcheur|Saitovic": "recoverGrave",
  "Rare|Catcheur|Romain Lestrange": "secondPlayerForceCharisma1",
  "Rare|Catcheur|TLB": "winNextEnemySpeedMinus2",
  "Legende|Catcheur|TLB": "winNextEnemySpeedMinus3",
  "Rare|Catcheur|Maffa": "entryPinBonus20",
  "Rare|Catcheur|Bernardot": "charismaWinRandom3",
  "Legende|Catcheur|Tony Trivaldo": "forceWheel50",
  "Rare|Catcheur|Joe Cobra": "entryEnemyStatChoiceMinus1",
  "Rare|Catcheur|Lior Divine": "entryPlaySupportFromGrave",
  "Rare|Catcheur|Ryu Kaizaru": "firstRoundSpeed1Technique2",
  "Rare|Manager|PURE TRADITION": "bonusPureTraditionDrawTeam",
  "Rare|Objet|Batte de baseball": "opponentDiscardRandom1",
  "Rare|Objet|Caméra": "rerollOnLoss",
  "Rare|Objet|Guitare electrique": "objectChoiceForceCharisma2",
  "Standard|Objet|Livre": "mTechnique1",
  "Legende|Objet|Mégaphone": "megaphoneRound1",
  "Standard|Objet|Perche à selfie": "mCharisme1",
  "Rare|Objet|Poing Américain": "objectChoiceStat1",
  "Rare|Objet|Sachet de punaises": "pinObject10",
  "Legende|Objet|Sledgehammer": "pinObject30",
  "Rare|Catcheur|Adrian Maccio": "lossReturnEnemyWrestlerToHand",
  "Rare|Catcheur|Ben Damage": "entryResetEnemyStatMods",
  "Standard|Manager|Lord Gidéon Salvini": "turnDrawChance20",
  "Rare|Manager|Lord Gidéon Salvini": "turnDrawChance40",
  "Rare|Catcheur|Julius Trajan": "entryRecoverFactionDeck",
  "Rare|Catcheur|Lucas Thoumazet": "firstRoundForceSpeedCharisma1",
  "Rare|Catcheur|Marcus Jaw": "winTag1Max2",
  "Ultime|Catcheur|MBM": "entryDiscardUpTo3RandomStat2",
  "Legende|Catcheur|Peter Fischer": "forceWheel50",
  "Rare|Catcheur|Rocky J": "round2ForceSpeedCharisma1",
  "Rare|Catcheur|Pauline": "objectOwnedStatChoice2",
  "Ultime|Catcheur|Marc Sebire": "lossDiscardReroll",
  "Rare|Catcheur|Rafael BELMONT": "lossDiscardReroll",
  "Rare|Catcheur|John Gage": "entryRandomStats5IfMoreWrestlersGrave",
  "Standard|Manager|MR catch": "mWeakest1Choice",
  "Rare|Manager|MR catch": "mWeakest2Choice",
};

const CARD_OVERRIDES_BY_KEY = {
  rare_catcheurs_joe_cobra: {
    effect: "Apparition : choisissez une statistique adverse. Le catcheur adverse perd 1 point dans cette statistique.",
  },
  rare_catcheurs_lior_divine: {
    effect: "Apparition : choisissez une carte Bonus ou Objet dans votre vestiaire et posez-la directement sur le terrain.",
  },
  rare_catcheurs_ryu_kaizaru: {
    effect: "Round 1 : +2 Technique et +1 Vitesse.",
  },
  rare_objets_batte_de_baseball: {
    effect: "Votre adversaire défausse une carte aléatoire.",
  },
  rare_objets_camera: {
    name: "Caméra",
    effect: "Si votre catcheur perd, relancez la roulette.",
  },
  rare_objets_guitare_electrique: {
    name: "Guitare électrique",
    effect: "Choisissez : +2 Force ou +2 Charisme.",
  },
  standard_objets_livre: {
    effect: "+1 Technique.",
  },
  legende_objets_megaphone: {
    name: "Mégaphone",
    effect: "Round 1 : si vous jouez en deuxième, votre adversaire défausse 3 cartes. Sinon, piochez 2 cartes.",
  },
  standard_objets_perche_a_selfie: {
    name: "Perche à selfie",
    effect: "+1 Charisme.",
  },
  rare_objets_poing_americain: {
    name: "Poing Américain",
    effect: "Choisissez une statistique : +1 à la statistique choisie.",
  },
  rare_objets_sachet_de_punaises: {
    effect: "+10 Tombé.",
  },
  legende_objets_sledgehammer: {
    effect: "+30 Tombé.",
  },
  standard_managers_lord_gideon_salvini: {
    name: "Lord Gidéon Salvini",
    effect: "Une fois par tour, 20 % de chance de piocher une carte.",
  },
  rare_managers_lord_gideon_salvini: {
    name: "Lord Gidéon Salvini",
    effect: "Une fois par tour, 40 % de chance de piocher une carte.",
  },
  rare_catcheurs_julius_trajan: {
    effect: "Apparition : choisissez The World, Drix, Kyle Hoxton ou Saitovic dans votre deck et ajoutez cette carte à votre main.",
  },
  ultime_catcheurs_marc_sebire: {
    stats: { Force: 5, Vitesse: 8, Technique: 7, Charisme: 8 },
  },
};

const STATS_BY_KEY = {
  "Legende|Catcheur|Adam Frost": { Force: 6, Vitesse: 8, Technique: 6, Charisme: 8 },
  "Legende|Catcheur|Coda Reznov": { Force: 8, Vitesse: 6, Technique: 7, Charisme: 7 },
  "Legende|Catcheur|NILS'N": { Force: 5, Vitesse: 9, Technique: 6, Charisme: 8 },
  "Legende|Catcheur|Yann Skoric": { Force: 6, Vitesse: 7, Technique: 6, Charisme: 9 },
  "Legende|Catcheur|Tony Trivaldo": { Force: 10, Vitesse: 4, Technique: 6, Charisme: 8 },
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function slug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
}

function cleanText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(raw) {
  return TYPE_MAP[slug(raw)] || titleCase(raw);
}

function normalizeRarity(raw) {
  const value = slug(raw);
  if (value.includes("ultime") || value.includes("ultimate")) return "Ultime";
  if (value.includes("legend") || value.includes("legende")) return "Legende";
  if (value.includes("rare")) return "Rare";
  return "Standard";
}

function normalizeCardName(raw) {
  const name = cleanText(raw);
  if (/^Lord Gid.on Salvini$/i.test(name)) return "Lord Gidéon Salvini";
  return name;
}

function normalizeStats(raw) {
  const stats = raw || {};
  const pick = (...names) => {
    for (const name of names) {
      if (stats[name] != null) return Number(stats[name]) || 0;
    }
    return 0;
  };
  return {
    Force: pick("Force", "force", "FORCE"),
    Vitesse: pick("Vitesse", "vitesse", "VITESSE", "Speed", "speed", "SPEED"),
    Technique: pick("Technique", "technique", "TECHNIQUE"),
    Charisme: pick("Charisme", "charisme", "CHARISME", "Charisma", "charisma", "CHARISMA"),
  };
}

function statsTotal(stats) {
  return Object.values(stats || {}).reduce((total, value) => total + (Number(value) || 0), 0);
}

function findSiblingPng(jsonPath) {
  const dir = path.dirname(jsonPath);
  const base = path.basename(jsonPath, ".json").toLowerCase();
  return fs.readdirSync(dir)
    .map((name) => path.join(dir, name))
    .find((file) => path.extname(file).toLowerCase() === ".png" && path.basename(file, ".png").toLowerCase() === base);
}

function readCard(jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const type = normalizeType(data.type || data.cardType || data.role);
  const rarity = normalizeRarity(data.rarity || data.rarete || data.rarityLabel);
  const name = normalizeCardName(data.name || data.nom || data.title || path.basename(jsonPath, ".json"));
  const stats = type === "Catcheur" ? normalizeStats(data.stats || data.Stats) : {};
  const group = type === "Catcheur" ? "catcheurs" : type === "Manager" ? "managers" : "objets";
  const nameKey = slug(name).replace(/^nils_n$/, "nilsn");
  const key = `${slug(rarity)}_${group}_${nameKey}`;
  const pngPath = findSiblingPng(jsonPath);
  const card = {
    key,
    type,
    rarity,
    name,
    stats,
    effect: cleanText(data.effect || data.effet || data.description),
    renderArt: `assets/card_renders/${key}.png`,
  };
  if (type === "Catcheur") {
    const musicId = slug(name).replace(/^nils_n$/, "nilsn");
    card.musicId = musicId;
  }
  const ability = ABILITY_BY_KEY[`${rarity}|${type}|${name}`];
  const statsOverride = STATS_BY_KEY[`${rarity}|${type}|${name}`];
  if (statsOverride) card.stats = statsOverride;
  if (ability && !(type === "Catcheur" && rarity === "Standard")) {
    card.ability = ability;
  }
  Object.assign(card, CARD_OVERRIDES_BY_KEY[key] || {});
  return { card, jsonPath, pngPath };
}

function updateEmbeddedCards(cards) {
  const game = fs.readFileSync(gamePath, "utf8");
  const start = game.indexOf("const CARD_DATA = ");
  if (start < 0) throw new Error("CARD_DATA introuvable dans game.js");
  const arrayStart = game.indexOf("[", start);
  if (arrayStart < 0) throw new Error("Début de CARD_DATA introuvable dans game.js");
  let depth = 0;
  let inString = false;
  let escaped = false;
  let arrayEnd = -1;
  for (let i = arrayStart; i < game.length; i += 1) {
    const ch = game[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === "\"") inString = false;
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }
  if (arrayEnd < 0) throw new Error("Fin de CARD_DATA introuvable dans game.js");
  const replacement = JSON.stringify(cards, null, 2);
  fs.writeFileSync(gamePath, game.slice(0, arrayStart) + replacement + game.slice(arrayEnd + 1), "utf8");
}

fs.mkdirSync(renderDir, { recursive: true });
fs.mkdirSync(musicDir, { recursive: true });

const db = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
const byKey = new Map(db.cards.map((card) => [card.key, card]));
const report = { imported: [], updated: [], skipped: [], music: [] };

for (const jsonPath of walk(sourceRoot).filter((file) => path.extname(file).toLowerCase() === ".json")) {
  const item = readCard(jsonPath);
  const { card, pngPath } = item;
  if (!pngPath) {
    report.skipped.push({ file: jsonPath, reason: "PNG correspondant introuvable" });
    continue;
  }
  const total = statsTotal(card.stats);
  if (card.type === "Catcheur" && (card.rarity === "Standard" || card.rarity === "Rare") && total !== 24) {
    report.skipped.push({ file: jsonPath, name: card.name, rarity: card.rarity, statsTotal: total, reason: "Catcheur Standard/Rare != 24 stats" });
    continue;
  }
  fs.copyFileSync(pngPath, path.join(projectRoot, card.renderArt));
  // Clean up the incorrect Standard entry produced before "ultimate" was normalized.
  if (card.name === "MBM" && card.rarity === "Ultime") {
    byKey.delete("standard_catcheurs_mbm");
  }
  const existed = byKey.has(card.key);
  byKey.set(card.key, card);
  report[existed ? "updated" : "imported"].push({ key: card.key, name: card.name, rarity: card.rarity, type: card.type, ability: card.ability || null });
}

for (const audioPath of walk(sourceRoot).filter((file) => [".mp3", ".wav"].includes(path.extname(file).toLowerCase()))) {
  const name = path.basename(audioPath);
  const folders = path.relative(sourceRoot, path.dirname(audioPath)).split(path.sep).map(slug);
  if (folders.some(folder => BLOCKED_MUSIC_FOLDERS.has(folder))) continue;
  let target = MUSIC_TARGETS[name];
  if (!target) {
    target = folders.map(folder => MUSIC_BY_FOLDER[folder]).find(Boolean);
  }
  if (!target) {
    const fileSlug = slug(path.basename(audioPath, path.extname(audioPath)));
    const nameMatch = Object.keys(MUSIC_BY_FOLDER).find(key => fileSlug.includes(key) || key.includes(fileSlug));
    if (nameMatch) target = MUSIC_BY_FOLDER[nameMatch];
  }
  if (!target && /Saitovic/i.test(audioPath)) target = "saitovic.mp3";
  if (!target) continue;
  fs.copyFileSync(audioPath, path.join(musicDir, target));
  report.music.push({ source: audioPath, target });
}

db.cards = [...byKey.values()];
for (const card of db.cards) {
  if (card.type === "Catcheur" && card.rarity === "Standard") {
    delete card.ability;
    card.effect = "Aucun effet.";
  }
}
db.cards.sort((a, b) => {
  const type = String(a.type).localeCompare(String(b.type));
  if (type) return type;
  const rarity = String(a.rarity).localeCompare(String(b.rarity));
  if (rarity) return rarity;
  return String(a.name).localeCompare(String(b.name));
});
fs.writeFileSync(cardsPath, JSON.stringify(db, null, 2), "utf8");
updateEmbeddedCards(db.cards);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log(`Importées: ${report.imported.length}`);
console.log(`Mises à jour: ${report.updated.length}`);
console.log(`Ignorées: ${report.skipped.length}`);
console.log(`Musiques: ${report.music.length}`);
console.log(reportPath);
