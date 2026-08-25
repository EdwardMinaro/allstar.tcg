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

function pngDimensions(relativePath) {
  const data = fs.readFileSync(path.join(root, relativePath));
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
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
  const verifyIndex = workflow.indexOf("npm run verify");
  const buildIndex = workflow.indexOf("npm run dist");
  const tagIndex = workflow.indexOf("Create the version tag");
  assert(verifyIndex >= 0 && buildIndex > verifyIndex && tagIndex > buildIndex, "Workflow vérifie et construit avant le tag");
  assert(workflow.includes("dist/latest.yml"), "Manifest auto-update publié");
  assert(workflow.includes("fail_on_unmatched_files: true"), "Publication refuse les fichiers manquants");
  assert(workflow.includes("dist/SHA256SUMS.txt"), "Empreinte SHA256 publiée");
  assert(fs.existsSync(path.join(root, "docs/open-beta-release-notes.md")), "Notes de bêta ouverte présentes");
}

function verifyInterfaceFiles() {
  const html = read("index.html");
  const css = read("css/style.css");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match => match[1]);
  assert(scripts.every(file => fs.existsSync(path.join(root, file))), "Scripts interface présents");
  assert(scripts.indexOf("js/firebaseService.js") < scripts.indexOf("js/profileService.js"), "Ordre Firebase puis profil");
  assert(scripts.indexOf("js/rankingService.js") < scripts.indexOf("js/game.js"), "Ordre classement puis jeu");
  assert(css.includes("@media (max-width: 900px)") && css.includes("@media (max-height: 760px)"), "Adaptation petite largeur et petite hauteur");
  assert(css.includes("Short desktop windows need a dedicated left rail"), "Rail gauche protege sur ecran 720p");
  assert(html.includes("game-options-head") && css.includes("In-match settings use a centered modal"), "Options de partie en fenetre modale");
  const audio = read("js/audio.js");
  assert(html.includes("music-pause-toggle") && audio.includes("toggleMusicPause()"), "Bouton pause/reprendre de musique");
  assert(audio.includes("musicPausedByUser") && audio.includes("music-stop-control,.music-pause-toggle"), "Pause manuelle preservee entre les clics");
  assert(read("js/game.js").includes("Bêta ouverte - Version"), "Version bêta visible dans le menu");
}

function verifyRecentEffects() {
  const game = read("js/game.js");
  const audio = read("js/audio.js");
  const importer = read("tools/import_folder_cards.js");
  const cards = JSON.parse(read("data/cards.json")).cards;
  const byKey = Object.fromEntries(cards.map(card => [card.key, card]));
  assert(game.includes('winnerAbility==="charismaWinRandom3"&&G.stat==="Charisme"'), "Effet Bernardot execute sur Charisme gagne");
  assert(game.includes('forceWheel50:{stat:"Force",chance:.5}'), "Effet Tony Trivaldo force Force au premier round");
  assert(game.includes("ISO weeks make the challenge rotate") && game.includes("challenge_boss_${G.challenge.weekKey}_"), "Boss ALLSTAR previsualisable et rotation hebdomadaire");
  assert(
    game.includes('c.ability==="entryEnemyStatChoiceMinus1"') && game.includes("enemy.cat.mods[stat]-=1"),
    "Effet Joe Cobra rare branche sur le choix de statistique adverse"
  );
  assert(
    game.includes('c.ability==="entryPlaySupportFromGrave"') && game.includes("function playSupportFromGrave"),
    "Effet Lior Divine rare branche sur le vestiaire"
  );
  assert(
    game.includes('ability==="firstRoundSpeed1Technique2"&&firstRound') && game.includes('firstRoundSpeed1Technique2:"+1 Vitesse / +2 Technique"'),
    "Effet Ryu Kaizaru rare applique au Round 1"
  );
  assert(audio.includes("lior_divine.mp3"), "Theme Lior Divine branche");
  assert(
    byKey.rare_catcheurs_adam_frost?.ability === "turnEnemyRandomPermanent1Max5"
      && byKey.legende_catcheurs_adam_frost?.ability === "turnEnemyRandomPermanent2Max3"
      && game.includes("owner.cat.enemyRandomPenaltyCount=count+1"),
    "Effets Adam Frost plafonnes et branches"
  );
  assert(
    audio.includes('label: "Adam Frost"')
      && audio.includes('wrestler: "Adam Frost"')
      && audio.includes("adam_frost.mp3")
      && fs.existsSync(path.join(root, "assets/audio/music/adam_frost.mp3")),
    "Theme Adam Frost branche"
  );
  assert(
    Object.values(byKey.rare_catcheurs_adam_frost?.stats || {}).reduce((sum, value) => sum + value, 0) === 24
      && Object.values(byKey.legende_catcheurs_adam_frost?.stats || {}).reduce((sum, value) => sum + value, 0) === 28,
    "Stats Adam Frost conformes aux raretes"
  );
  assert(
    game.includes("function preventFirstDefeat(loser)")
      && game.includes("loser.oncePerMatch.firstLossDeck=true")
      && game.includes('wrestler.card.rarity==="Legende"')
      && game.includes("Première défaite annulée"),
    "Shawn Olsen annule vraiment sa premiere defaite et applique son bonus legendaire"
  );
  const winStart = game.indexOf("function win(winner,loser,reason)");
  const winRecorded = game.indexOf("winner.wins++;", winStart);
  const shawnProtection = game.indexOf("const defeatPrevented=preventFirstDefeat(loser);", winStart);
  const loserCleared = game.indexOf("clearWrestler(loser);", shawnProtection);
  assert(
    winStart >= 0 && winRecorded > winStart && shawnProtection > winRecorded && loserCleared > shawnProtection,
    "Shawn Olsen protege apres la resolution de la victoire et avant le vestiaire"
  );
  const challengeProtection = game.indexOf("const defeatPrevented=preventFirstDefeat(G.player)");
  const challengeSaved = game.indexOf("updateSavedChallengeFromMatch();", challengeProtection);
  assert(challengeProtection >= 0 && challengeSaved > challengeProtection, "Shawn Olsen protege aussi dans le Defi ALLSTAR");
  const nilsEntryStart = game.indexOf('if(c.ability==="firstRoundRandomStats5"');
  const nilsEntryEnd = game.indexOf("if(c.ability===", nilsEntryStart + 10);
  const nilsEntryBlock = game.slice(nilsEntryStart, nilsEntryEnd);
  assert(
    nilsEntryStart >= 0
      && nilsEntryBlock.includes("owner.cat.firstRoundRandomMods[stat]+=1")
      && !nilsEntryBlock.includes("owner.cat.mods[stat]+=1")
      && game.includes('ability==="firstRoundRandomStats5"&&firstRound'),
    "Bonus NILS'N limite au premier round du catcheur"
  );
  assert(
    byKey.rare_catcheurs_coda_reznov?.ability === "entryRandomStat3"
      && byKey.legende_catcheurs_coda_reznov?.ability === "entryStatChoice3"
      && game.includes('if(c.ability==="entryRandomStat3")applyEntryStatBonus(owner,c,3,false)')
      && game.includes('if(c.ability==="entryStatChoice3")applyEntryStatBonus(owner,c,3,true)'),
    "Effets Coda Reznov branches"
  );
  assert(
    Object.values(byKey.rare_catcheurs_coda_reznov?.stats || {}).reduce((sum, value) => sum + value, 0) === 24
      && Object.values(byKey.legende_catcheurs_coda_reznov?.stats || {}).reduce((sum, value) => sum + value, 0) === 28,
    "Stats Coda Reznov conformes aux raretes"
  );
  assert(
    audio.includes('wrestler: "Coda Reznov"')
      && audio.includes("coda_reznov.mp3")
      && fs.existsSync(path.join(root, "assets/audio/music/coda_reznov.mp3")),
    "Theme Coda Reznov branche"
  );
  const normalizedCardRenders = [
    "standard_catcheurs_delacroix.png",
    "rare_catcheurs_delacroix.png",
    "rare_catcheurs_georges_chevalier.png",
    "legende_catcheurs_georges_chevalier.png",
    "standard_catcheurs_el_amnesico.png",
    "rare_catcheurs_el_amnesico.png",
    "standard_catcheurs_tom_evans.png",
    "rare_catcheurs_tom_evans.png",
    "rare_catcheurs_coda_reznov.png",
    "legende_catcheurs_coda_reznov.png"
  ];
  assert(
    normalizedCardRenders.every(file => {
      const dimensions = pngDimensions(path.join("assets", "card_renders", file));
      return dimensions.width === 1102 && dimensions.height === 1498;
    }),
    "Rendus Delacroix, Georges, Amnesico, Tom Evans et Coda sans marge blanche"
  );
  assert(
    game.includes("function resolveNextStatWinEffect(winner,currentStat,onComplete)")
      && (game.match(/resolveNextStatWinEffect\(/g) || []).length >= 3
      && game.includes("applyChallengeWinEffects(G.player,G.ai,stat,finishChallengeWin)"),
    "Ethan Riley partage son verrouillage de statistique avec le Defi ALLSTAR"
  );
  assert(
    !audio.includes("ryu_kaizaru")
      && !fs.existsSync(path.join(root, "assets/audio/music/ryu_kaizaru.mp3"))
      && importer.includes("BLOCKED_MUSIC_FOLDERS")
      && importer.includes('"ryu_kaizaru"')
      && importer.includes("folders.some(folder => BLOCKED_MUSIC_FOLDERS.has(folder))"),
    "Theme Ryu Kaizaru retire et bloque a l'import"
  );
  const roundManagerEffects=game.slice(
    game.indexOf("function applyRoundManagerEffects()"),
    game.indexOf("function addTrackedStat(")
  );
  assert(
    game.includes("function requestRingsiderRecovery(owner)")
      && game.includes("function chooseRingsiderCards(owner,source,selectedIds=[])")
      && game.includes('{label:"Utiliser l\'effet",value:"recover"}')
      && game.includes('{label:"Passer",value:"pass"}')
      && game.includes("owner.grave.splice(index,1)")
      && game.includes("owner.tagsRemaining=Math.max(0,currentTags-1)")
      && !roundManagerEffects.includes("owner.grave.pop()"),
    "Mr Ringsider propose son effet et laisse choisir les cartes du vestiaire"
  );
  const selectableGraveAbilities = new Set([
    "recoverGrave",
    "recoverGraveDiscard1",
    "recoverObjectGrave",
    "recoverOrPlayObjectGrave",
    "recoverJaydonOrFenrir",
    "entryPlaySupportFromGrave",
    "ringsiderRecover1LoseTag",
    "ringsiderRecover2LoseTag",
  ]);
  const graveRecoveryCards = cards.filter(card => /récup/i.test(card.effect || "") && /vestiaire/i.test(card.effect || ""));
  assert(
    graveRecoveryCards.every(card => {
      const randomRecovery = /récup[^.!?]*(?:aléatoire|au hasard)/i.test(card.effect || "");
      return randomRecovery || selectableGraveAbilities.has(card.ability);
    })
      && game.includes("function chooseCardFromGrave(owner,source")
      && game.includes("function recoverOrPlayObjectFromGrave(owner,source)")
      && byKey.legende_catcheurs_mareck?.ability === "recoverOrPlayObjectGrave"
      && !game.includes("owner.grave.pop()"),
    "Toute recuperation non aleatoire du vestiaire laisse choisir la carte"
  );
  assert(!byKey.standard_catcheurs_joe_cobra?.ability && !byKey.standard_catcheurs_lior_divine?.ability, "Catcheurs standards de la fournee sans effet");
  assert(
    ["rare_catcheurs_joe_cobra", "rare_catcheurs_lior_divine", "rare_catcheurs_ryu_kaizaru"]
      .every(key => Object.values(byKey[key]?.stats || {}).reduce((sum, value) => sum + value, 0) === 24),
    "Catcheurs rares de la fournee a 24 points"
  );
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
