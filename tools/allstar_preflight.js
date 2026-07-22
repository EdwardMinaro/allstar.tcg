const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const checks = [];

function assert(condition, label) {
  if (!condition) failures.push(label);
  else checks.push(label);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadRanking() {
  const source = read("js/rankingService.js");
  const windowStub = {};
  Function("window", `${source}\nreturn window.AllstarRankingService;`)(windowStub);
  return windowStub.AllstarRankingService;
}

function verifyRanking() {
  const ranking = loadRanking();
  assert(ranking.xpForNextLevel(1) === 100, "XP niveau 1");
  assert(ranking.xpForNextLevel(10) === 550, "XP niveau 10");
  const progressed = ranking.addXp({ level: 1, xp: 0, totalXp: 0 }, 250);
  assert(progressed.level === 3 && progressed.xp === 0 && progressed.totalXp === 250, "Passage de niveau XP");
  assert(ranking.rankForElo(2400, 10).label === "Champion I", "Rang Champion I");
  assert(ranking.rankForElo(2400, 9).id === "tryouts", "Try-outs avant 10 matchs");
  const win = ranking.eloDelta(1000, 1000, true, 10, 0);
  const loss = ranking.eloDelta(1000, 1000, false, 10, 0);
  const streakLoss = ranking.eloDelta(1000, 1000, false, 10, 6);
  assert(win > 0 && loss < 0 && win > Math.abs(loss), "ELO progressif à score égal");
  assert(Math.abs(streakLoss) >= Math.abs(loss), "ELO durci après série de défaites");
}

function verifyPersistence() {
  const profile = read("js/profileService.js");
  assert(profile.includes("runTransaction"), "Sauvegarde profil transactionnelle");
  assert(profile.includes("matchSettlements"), "Déduplication des résultats de match");
  const firebase = read("js/firebaseService.js");
  assert(firebase.includes("persistentLocalCache"), "Cache Firestore persistant");
  assert(profile.includes("syncLeaderboardProfile"), "Synchronisation profil vers classement");
  assert(fs.existsSync(path.join(root, "docs/firestore.rules")), "Règles Firestore présentes");
  const realtimeRules = JSON.parse(read("docs/firebase-realtime-database-rules.json"));
  assert(Boolean(realtimeRules.rules.rooms), "Règles Realtime des rooms");
  assert(Boolean(realtimeRules.rules.matchmaking), "Règles Realtime du matchmaking");
}

function verifyDesktopBuild() {
  const pkg = JSON.parse(read("package.json"));
  const workflow = read(".github/workflows/publish-release.yml");
  const requiredFiles = ["index.html", "update.html", "electron-main.js", "electron-preload.js", "assets/**/*", "css/**/*", "data/**/*", "js/**/*"];
  assert(pkg.version && /^0\.\d+\.\d+$/.test(pkg.version), "Version de bêta valide");
  assert(requiredFiles.every(file => pkg.build.files.includes(file)), "Fichiers du jeu inclus dans le build");
  assert(workflow.includes("npm run dist"), "Workflow de build Windows");
  assert(workflow.includes("dist/latest.yml"), "Manifest auto-update publié");
}

function verifyInterfaceFiles() {
  const html = read("index.html");
  const css = read("css/style.css");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match => match[1]);
  assert(scripts.every(file => fs.existsSync(path.join(root, file))), "Scripts interface présents");
  assert(scripts.indexOf("js/firebaseService.js") < scripts.indexOf("js/profileService.js"), "Ordre Firebase puis profil");
  assert(scripts.indexOf("js/rankingService.js") < scripts.indexOf("js/game.js"), "Ordre classement puis jeu");
  assert(css.includes("@media (max-width: 900px)") && css.includes("@media (max-height: 760px)"), "Adaptation petite largeur et petite hauteur");
}

function verifyRecentEffects() {
  const game = read("js/game.js");
  assert(game.includes('winnerAbility==="charismaWinRandom3"&&G.stat==="Charisme"'), "Effet Bernardot execute sur Charisme gagne");
  assert(game.includes('forceWheel50:{stat:"Force",chance:.5}'), "Effet Tony Trivaldo force Force au premier round");
}

verifyRanking();
verifyPersistence();
verifyDesktopBuild();
verifyInterfaceFiles();
verifyRecentEffects();

console.log("=== ALLSTAR PRE-BETA PREFLIGHT ===");
console.log(`Contrôles réussis : ${checks.length}`);
if (failures.length) {
  console.log(`Échecs : ${failures.length}`);
  failures.forEach(item => console.log(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log("Échecs : 0");
}
