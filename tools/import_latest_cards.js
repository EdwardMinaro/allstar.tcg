const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cardsPath = path.join(root, "data", "cards.json");
const data = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

const imports = [
  {
    json: "C:/Users/LENOVO/Downloads/L'Odyssée/L_Odyssee.json",
    png: "C:/Users/LENOVO/Downloads/L'Odyssée/L_Odyssee.png",
    ability: "bonusOdysseeTechForceTeam",
  },
  {
    json: "C:/Users/LENOVO/Downloads/L'Odyssée/Charlie_Bergson.json",
    png: "C:/Users/LENOVO/Downloads/L'Odyssée/Charlie_Bergson.png",
    ability: "entryIfTrevorInGraveFTV1",
  },
  {
    json: "C:/Users/LENOVO/Downloads/L'Odyssée/Trevor_Mayden.json",
    png: "C:/Users/LENOVO/Downloads/L'Odyssée/Trevor_Mayden.png",
    ability: "revealCharlieEachRoundForcePin",
  },
  {
    json: "C:/Users/LENOVO/Downloads/Perfect_Fighters_Industry.json",
    png: "C:/Users/LENOVO/Downloads/Perfect_Fighters_Industry.png",
    ability: "bonusPfiCharSpeedTeam",
  },
  {
    json: "C:/Users/LENOVO/Downloads/Passion_Baston.json",
    png: "C:/Users/LENOVO/Downloads/Passion_Baston.png",
    ability: "bonusPassionForceCharTeam",
  },
];

const audioImports = [
  {
    src: "C:/Users/LENOVO/Downloads/L'Odyssée/Charlie Bergson.mp3",
    dest: "charlie_bergson.mp3",
  },
  {
    src: "C:/Users/LENOVO/Downloads/L'Odyssée/Trevor Mayden.mp3",
    dest: "trevor_mayden.mp3",
  },
];

function slug(value) {
  return String(value || "carte")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeType(type) {
  const value = String(type || "").toLowerCase();
  if (value === "wrestler" || value === "catcheur") return "Catcheur";
  if (value === "manager" || value === "bonus") return "Manager";
  if (value === "object" || value === "objet") return "Objet";
  return value ? value[0].toUpperCase() + value.slice(1) : "Carte";
}

function normalizeRarity(rarity) {
  const value = String(rarity || "standard").toLowerCase();
  if (value.includes("ultime")) return "Ultime";
  if (value.includes("legend") || value.includes("légend") || value.includes("legende")) return "Legende";
  if (value.includes("rare")) return "Rare";
  return "Standard";
}

function makeStats(card, type) {
  if (type !== "Catcheur") return {};
  return {
    Force: Number(card.stats?.FORCE || card.stats?.Force || 0),
    Vitesse: Number(card.stats?.VITESSE || card.stats?.Vitesse || 0),
    Technique: Number(card.stats?.TECHNIQUE || card.stats?.Technique || 0),
    Charisme: Number(card.stats?.CHARISME || card.stats?.Charisme || 0),
  };
}

for (const item of imports) {
  const source = JSON.parse(fs.readFileSync(item.json, "utf8"));
  const type = normalizeType(source.type);
  const rarity = normalizeRarity(source.rarity);
  const group = type === "Catcheur" ? "catcheurs" : type === "Manager" ? "managers" : type === "Objet" ? "objets" : slug(type);
  const key = `${slug(rarity)}_${group}_${slug(source.name)}`;
  const renderName = `${key}.png`;
  const renderArt = `assets/card_renders/${renderName}`;
  fs.copyFileSync(item.png, path.join(root, "assets", "card_renders", renderName));

  const card = {
    key,
    type,
    rarity,
    name: source.name,
    stats: makeStats(source, type),
    effect: String(source.effect || "Aucun effet.").trim(),
    ability: item.ability,
    renderArt,
  };

  const index = data.cards.findIndex(
    existing => existing.key === key || (existing.name === card.name && existing.type === card.type && existing.rarity === card.rarity)
  );
  if (index >= 0) {
    data.cards[index] = card;
    console.log(`updated ${key}`);
  } else {
    data.cards.push(card);
    console.log(`added ${key}`);
  }
}

data.cards.sort((a, b) =>
  String(a.rarity).localeCompare(String(b.rarity)) ||
  String(a.type).localeCompare(String(b.type)) ||
  String(a.name).localeCompare(String(b.name))
);
fs.writeFileSync(cardsPath, JSON.stringify(data, null, 2));

for (const audio of audioImports) {
  fs.copyFileSync(audio.src, path.join(root, "assets", "audio", "music", audio.dest));
  console.log(`audio ${audio.dest}`);
}

const gamePath = path.join(root, "js", "game.js");
let game = fs.readFileSync(gamePath, "utf8");
const literal = `const CARD_DATA = ${JSON.stringify(data.cards, null, 2)};`;
game = game.replace(/const CARD_DATA = \[[\s\S]*?\];\r?\n\r?\nfunction cardKey/, `${literal}\n\nfunction cardKey`);
fs.writeFileSync(gamePath, game);
