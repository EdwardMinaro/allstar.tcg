const fs = require("fs");

const targets = [
  "Luke Kane",
  "Maxime Cuadrado",
  "Nils'N",
  "Nocif",
  "Paul Meunier",
  "Black Sam",
  "Drix",
  "Ethan Riley",
  "Angelo Folena",
  "Jey Kill",
];

const root = JSON.parse(fs.readFileSync("data/cards.json", "utf8"));
const results = [];
const visited = new Set();

function walk(value) {
  if (!value || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);

  if (typeof value.name === "string" && targets.includes(value.name)) {
    results.push({
      id: value.id,
      name: value.name,
      rarity: value.rarity,
      type: value.type,
      image: value.image || value.imagePath || value.render || value.asset,
    });
  }

  for (const child of Object.values(value)) walk(child);
}

walk(root);
results.sort((a, b) => `${a.name}|${a.rarity}`.localeCompare(`${b.name}|${b.rarity}`));
fs.writeFileSync(
  "tmp-card-paths.txt",
  results.map((card) => [card.id, card.name, card.rarity, card.type, card.image].join("|")).join("\n"),
);
