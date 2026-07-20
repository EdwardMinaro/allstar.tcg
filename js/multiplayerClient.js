const multiplayer = {
  service: null,
  room: null,
  playerSlot: null,
  unsubscribe: null,
  adapter: null,
  launchedRoomCode: null
};

function useLocalMultiplayerAdapter() {
  const params = new URLSearchParams(window.location.search);
  return params.get("multi") === "local" || localStorage.getItem("allstarsMultiplayerMode") === "local";
}

function createMultiplayerAdapter() {
  if (useLocalMultiplayerAdapter()) return new LocalRoomAdapter();
  return new NetworkRoomAdapter();
}

function multiplayerService() {
  if (!multiplayer.service) {
    multiplayer.adapter = createMultiplayerAdapter();
    multiplayer.service = new RoomService(multiplayer.adapter);
    console.info(`[MULTI] ${multiplayer.adapter.debugLabel}`);
  }
  return multiplayer.service;
}

function forceNetworkMultiplayerService() {
  if (multiplayer.adapter instanceof NetworkRoomAdapter) return multiplayer.service || multiplayerService();
  multiplayer.unsubscribe?.();
  multiplayer.unsubscribe = null;
  multiplayer.adapter = new NetworkRoomAdapter();
  multiplayer.service = new RoomService(multiplayer.adapter);
  console.info(`[MULTI] ${multiplayer.adapter.debugLabel}`);
  return multiplayer.service;
}

function setMultiStatus(message) {
  const el = document.getElementById("multiStatus");
  if (el) el.textContent = message;
}

function setMultiDeckReadyAvailable(available) {
  const button = document.getElementById("multiDeckReadyButton");
  if (!button) return;
  button.hidden = !available;
  button.disabled = !available;
}

let matchmakingTimerId = null;
let matchmakingStartedAt = 0;

function stopMatchmakingTimer() {
  clearInterval(matchmakingTimerId);
  matchmakingTimerId = null;
}

function renderMatchmakingTimer() {
  const timer = document.getElementById("matchSearchTimer");
  if (!timer) return;
  const seconds = Math.max(0, Math.floor((Date.now() - matchmakingStartedAt) / 1000));
  timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function showMatchmakingSearch(found = false) {
  const codePanel = document.getElementById("roomCodePanel");
  const search = document.getElementById("matchSearchDisplay");
  const state = document.getElementById("matchSearchState");
  codePanel?.setAttribute("hidden", "");
  search?.removeAttribute("hidden");
  if (found) {
    stopMatchmakingTimer();
    if (state) state.textContent = "Adversaire trouvé !";
    document.getElementById("matchSearchActions")?.setAttribute("hidden", "");
    return;
  }
  document.getElementById("matchSearchActions")?.removeAttribute("hidden");
  if (!matchmakingStartedAt) matchmakingStartedAt = Date.now();
  renderMatchmakingTimer();
  if (state) state.textContent = "Recherche d'adversaire en cours";
  if (!matchmakingTimerId) matchmakingTimerId = setInterval(renderMatchmakingTimer, 1000);
}

function showCustomRoomCode(room) {
  stopMatchmakingTimer();
  matchmakingStartedAt = 0;
  document.getElementById("roomCodePanel")?.removeAttribute("hidden");
  document.getElementById("matchSearchDisplay")?.setAttribute("hidden", "");
  const code = document.getElementById("roomCodeDisplay");
  if (code) code.textContent = room?.roomCode || "----";
}

function isMatchmakingRoom(room) {
  return Boolean(room?.matchmaking?.mode === "quick" || room?.matchmaking?.mode === "ranked");
}

function showCustomMatchOptions() {
  document.getElementById("multiMainActions")?.setAttribute("hidden", "");
  document.getElementById("multiCustomActions")?.removeAttribute("hidden");
  document.getElementById("multiExitButton")?.setAttribute("hidden", "");
  setMultiStatus("Cr\u00e9e une partie ou rejoins-en une avec un code.");
}

function showOnlineModes() {
  document.getElementById("multiMainActions")?.removeAttribute("hidden");
  document.getElementById("multiCustomActions")?.setAttribute("hidden", "");
  document.getElementById("multiExitButton")?.removeAttribute("hidden");
  document.getElementById("multiJoinPanel")?.classList.remove("active");
  document.getElementById("multiLeaderboardPanel")?.classList.remove("active");
  if (!multiplayer.room) document.getElementById("multiRoomPanel")?.classList.remove("active");
  setMultiStatus("");
}

function resetMultiplayerScreen() {
  stopMatchmakingTimer();
  matchmakingStartedAt = 0;
  document.getElementById("multiMainActions")?.removeAttribute("hidden");
  document.getElementById("multiCustomActions")?.setAttribute("hidden", "");
  document.getElementById("multiExitButton")?.removeAttribute("hidden");
  document.getElementById("multiRoomPanel")?.classList.remove("active");
  document.getElementById("multiJoinPanel")?.classList.remove("active");
  document.getElementById("multiLeaderboardPanel")?.classList.remove("active");
  const code = document.getElementById("roomCodeDisplay");
  const state = document.getElementById("roomStateDisplay");
  const log = document.getElementById("multiLog");
  const input = document.getElementById("roomCodeInput");
  if (code) code.textContent = "----";
  if (state) state.textContent = "En attente...";
  if (log) log.innerHTML = "";
  if (input) input.value = "";
  setMultiStatus("");
}

function localRankedProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("allstarsPlayerV1") || "null");
    return window.AllstarRankingService?.normalizeProgress?.(saved?.profileProgress || {}) || {};
  } catch {
    return {};
  }
}

function escapeMultiHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
}

async function localOnlineIdentity() {
  const user = window.AllstarAuthService?.getCurrentUser
    ? await window.AllstarAuthService.getCurrentUser().catch(() => null)
    : null;
  const profile = user && window.AllstarProfileService?.getCachedUserProfile
    ? window.AllstarProfileService.getCachedUserProfile(user.uid)
    : null;
  if(user&&window.AllstarProfileService?.ensureUserProfile){
    void window.AllstarProfileService.ensureUserProfile(user).catch(() => {});
  }
  const progress = window.AllstarRankingService.normalizeProgress(profile || localRankedProgress());
  const rank = window.AllstarRankingService.rankForProgress(progress);
  return { uid:user?.uid || "", name:profile?.pseudo || user?.displayName || "Joueur classé", title:progress.title, elo:progress.elo, rankedMatches:progress.rankedMatches, currentRankId:progress.currentRankId, rankProtection:progress.rankProtection, wins:progress.wins, losses:progress.losses, hallOfFame:Boolean(progress.hallOfFame), rank:rank.label };
}

let multiLeaderboardEntries = [];
let multiLeaderboardSort = "elo";

function leaderboardTotalMatches(profile){
  const progress = window.AllstarRankingService.normalizeProgress(profile);
  return progress.wins + progress.losses;
}

function leaderboardCreatedAt(profile){
  const value=profile?.createdAt;
  if(typeof value === "number")return value;
  if(typeof value?.toMillis === "function")return value.toMillis();
  if(Number.isFinite(Number(value?.seconds)))return Number(value.seconds)*1000+Math.floor(Number(value.nanoseconds||0)/1e6);
  return Number.MAX_SAFE_INTEGER;
}

function sortMultiLeaderboard(entries=[]){
  return [...entries].sort((a,b)=>{
    const progressA = window.AllstarRankingService.normalizeProgress(a);
    const progressB = window.AllstarRankingService.normalizeProgress(b);
    const tryoutsA=progressA.rankedMatches<window.AllstarRankingService.TRYOUT_MATCHES;
    const tryoutsB=progressB.rankedMatches<window.AllstarRankingService.TRYOUT_MATCHES;
    if(tryoutsA||tryoutsB){
      if(tryoutsA!==tryoutsB)return tryoutsA ? 1 : -1;
      return leaderboardCreatedAt(a)-leaderboardCreatedAt(b)||String(a.pseudo||"").localeCompare(String(b.pseudo||""),"fr");
    }
    const totalA = leaderboardTotalMatches(a);
    const totalB = leaderboardTotalMatches(b);
    const rateA = totalA ? progressA.wins / totalA : 0;
    const rateB = totalB ? progressB.wins / totalB : 0;
    if(multiLeaderboardSort === "matches")return totalB-totalA || progressB.elo-progressA.elo;
    if(multiLeaderboardSort === "winrate")return rateB-rateA || totalB-totalA || progressB.elo-progressA.elo;
    if(multiLeaderboardSort === "record")return progressB.bestElo-progressA.bestElo || progressB.elo-progressA.elo;
    return progressB.elo-progressA.elo || totalB-totalA;
  });
}

function setOnlineLeaderboardSort(sort){
  if(!["elo","matches","winrate","record"].includes(sort))return;
  multiLeaderboardSort = sort;
  const titles = {elo:"Classement ELO",matches:"Classement par matchs",winrate:"Classement par win rate",record:"Record ELO"};
  const title = document.getElementById("leaderboardTitle");
  if(title)title.textContent = titles[sort];
  document.querySelectorAll("[data-leaderboard-sort]").forEach(button => button.classList.toggle("active", button.dataset.leaderboardSort === sort));
  renderCachedLeaderboard(multiLeaderboardEntries);
}
function renderCachedLeaderboard(entries, detail="") {
  const list = document.getElementById("leaderboardList");
  const count = document.getElementById("leaderboardPlayerCount");
  if (!list || !count) return;
  multiLeaderboardEntries = sortMultiLeaderboard(entries);
  count.textContent = `${entries.length} joueur${entries.length > 1 ? "s" : ""}${detail}`;
  list.innerHTML = multiLeaderboardEntries.map((profile, index) => {
    const progress = window.AllstarRankingService.normalizeProgress(profile);
    const rank = window.AllstarRankingService.rankForProgress(progress);
    const total = progress.wins + progress.losses;
    const inTryouts=progress.rankedMatches<window.AllstarRankingService.TRYOUT_MATCHES;
    const shownElo=inTryouts ? "?" : (multiLeaderboardSort==="record" ? progress.bestElo : progress.elo);
    const shownLabel=inTryouts ? `${progress.rankedMatches}/10 try-outs` : (multiLeaderboardSort==="record" ? "record" : `${total} match${total > 1 ? "s" : ""}`);
    const shownWinrate=inTryouts ? "?" : window.AllstarRankingService.winrate(progress.wins, progress.losses);
    return `<button class="leaderboard-row" type="button" data-leaderboard-index="${index}"><span class="leaderboard-place">${index + 1}</span><span><span class="leaderboard-name">${escapeMultiHtml(profile.pseudo || "Joueur")}${progress.hallOfFame ? '<span class="hof-badge" title="Hall of Fame">&#9733;</span>' : ""}</span><span class="leaderboard-meta">${escapeMultiHtml(rank.label)} &middot; ${progress.rankedMatches} classée${progress.rankedMatches > 1 ? "s" : ""} &middot; ${shownWinrate}</span></span><span class="leaderboard-elo">${shownElo}${inTryouts ? "" : " ELO"}<br><small>${shownLabel}</small></span></button>`;
  }).join("") || "<p>Aucun joueur inscrit pour le moment.</p>";
  list.querySelectorAll("[data-leaderboard-index]").forEach(button => button.addEventListener("click", () => window.openOnlineProfile?.(multiLeaderboardEntries[Number(button.dataset.leaderboardIndex)])));
}

async function showOnlineLeaderboard() {
  const panel = document.getElementById("multiLeaderboardPanel");
  const list = document.getElementById("leaderboardList");
  const count = document.getElementById("leaderboardPlayerCount");
  if (!panel || !list || !count) return;
  document.getElementById("multiMainActions")?.setAttribute("hidden", "");
  document.getElementById("multiCustomActions")?.setAttribute("hidden", "");
  document.getElementById("multiRoomPanel")?.classList.remove("active");
  document.getElementById("multiJoinPanel")?.classList.remove("active");
  document.getElementById("multiExitButton")?.setAttribute("hidden", "");
  panel.classList.add("active");
  const cached = window.AllstarRankingService.getCachedLeaderboard?.() || [];
  if(cached.length)renderCachedLeaderboard(cached, " · actualisation...");
  else list.innerHTML = "<p>Chargement des joueurs...</p>";
  try {
    multiLeaderboardEntries = await window.AllstarRankingService.getLeaderboard();
    renderCachedLeaderboard(multiLeaderboardEntries);
    return;
    count.textContent = `${multiLeaderboardEntries.length} joueur${multiLeaderboardEntries.length > 1 ? "s" : ""}`;
    list.innerHTML = multiLeaderboardEntries.map((profile, index) => {
      const progress = window.AllstarRankingService.normalizeProgress(profile);
      const rank = window.AllstarRankingService.rankForProgress(progress);
      const total = progress.wins + progress.losses;
      return `<button class="leaderboard-row" type="button" data-leaderboard-index="${index}"><span class="leaderboard-place">${index + 1}</span><span><span class="leaderboard-name">${escapeMultiHtml(profile.pseudo || "Joueur")}${progress.hallOfFame ? '<span class="hof-badge" title="Hall of Fame">★</span>' : ""}</span><span class="leaderboard-meta">${escapeMultiHtml(rank.label)} · ${progress.rankedMatches} classée${progress.rankedMatches > 1 ? "s" : ""} · ${window.AllstarRankingService.winrate(progress.wins, progress.losses)}</span></span><span class="leaderboard-elo">${progress.elo} ELO<br><small>${total} match${total > 1 ? "s" : ""}</small></span></button>`;
    }).join("") || "<p>Aucun joueur inscrit pour le moment.</p>";
    list.querySelectorAll("[data-leaderboard-index]").forEach(button => button.addEventListener("click", () => window.openOnlineProfile?.(multiLeaderboardEntries[Number(button.dataset.leaderboardIndex)])));
  } catch (error) {
    console.error("[LEADERBOARD] Chargement impossible", error);
    if(cached.length){
      renderCachedLeaderboard(cached, " · hors ligne");
      return;
    }
    list.innerHTML = "<p>Classement indisponible : vérifie les droits de lecture Firestore sur la collection users.</p>";
    list.innerHTML = "<p>Classement indisponible : vérifie les droits de lecture Firestore sur la collection leaderboard.</p>";
    count.textContent = "indisponible";
  }
}

function openMultiRoomPanel(message = "Cr\u00e9ation de la room...", options = {}) {
  document.getElementById("multiRoomPanel")?.classList.add("active");
  document.getElementById("multiJoinPanel")?.classList.remove("active");
  const state = document.getElementById("roomStateDisplay");
  const log = document.getElementById("multiLog");
  if (options.matchmaking) showMatchmakingSearch();
  else showCustomRoomCode(multiplayer.room);
  if (state) state.textContent = message;
  if (log) log.innerHTML = `<p>${message}</p>`;
  setMultiDeckReadyAvailable(Boolean(options.canChooseDeck));
}

function onRoomSnapshot(room, error) {
  if (error) {
    displayMultiplayerError(error, "Connexion multijoueur interrompue.");
    return;
  }
  if (room?.matchState && (room.status === "playing" || room.status === "finished") && typeof window.applyOnlineRoomSnapshot === "function") {
    window.applyOnlineRoomSnapshot(room, multiplayer.playerSlot);
  }
  renderMultiRoom(room);
}

function renderMultiRoom(room) {
  multiplayer.room = room;
  const code = document.getElementById("roomCodeDisplay");
  const state = document.getElementById("roomStateDisplay");
  const log = document.getElementById("multiLog");
  if (!room) return;
  const automatic = isMatchmakingRoom(room);
  setMultiDeckReadyAvailable(!automatic);
  if (automatic) showMatchmakingSearch(Boolean(room.players?.p2));
  else if (code) showCustomRoomCode(room);
  if (state) {
    const p1Ready = Boolean(room.players?.p1?.ready);
    const p2Ready = Boolean(room.players?.p2?.ready);
    if (room.status === "waiting") {
      state.textContent = room.players?.p2
        ? `Adversaire connect\u00e9 : ${p1Ready && p2Ready ? "Pr\u00eats" : "En attente des decks"}`
        : "En attente d'un adversaire...";
    }
    if (room.status === "playing") {
      state.textContent = room.currentTurn === multiplayer.playerSlot ? "\u00c0 vous de jouer" : "Tour adverse";
    }
    if (room.status === "finished") state.textContent = "Partie termin\u00e9e";
  }
  if (log) log.innerHTML = (room.log || []).slice(-8).map(line => `<p>${line}</p>`).join("");
  if (automatic && room.status === "playing" && room.players?.p2 && !room.matchState) {
    window.announceOnlineMatchFound?.(room);
  }
  maybeLaunchOnlineMatch(room);
}

function maybeLaunchOnlineMatch(room) {
  if (!room || room.status !== "playing") return;
  if (!multiplayer.playerSlot) return;
  const p1Ready = Boolean(room.players?.p1?.ready);
  const p2Ready = Boolean(room.players?.p2?.ready);
  if (!p1Ready || !p2Ready) return;
  if (multiplayer.playerSlot === "p2" && !room.matchState) {
    setMultiStatus("Les deux joueurs sont prêts. En attente du lancement par le Joueur 1...");
    setMultiDeckReadyAvailable(false);
    return;
  }
  if (multiplayer.launchedRoomCode === room.roomCode && !room.matchState) return;
  if (typeof window.startOnlineMatchFromRoom !== "function") {
    setMultiStatus("Match prêt, mais le lancement de partie est indisponible.");
    return;
  }
  multiplayer.launchedRoomCode = room.roomCode;
  setMultiDeckReadyAvailable(false);
  setMultiStatus("Lancement du match...");
  try {
    window.startOnlineMatchFromRoom(room, multiplayer.playerSlot);
  } catch (error) {
    console.error("[MULTI] Lancement du match impossible", error);
    multiplayer.launchedRoomCode = null;
    setMultiDeckReadyAvailable(true);
    setMultiStatus(error?.message || "Lancement du match impossible.");
  }
}

async function publishOnlineMatchState(matchState) {
  if (!multiplayer.room?.roomCode || !multiplayer.playerSlot) return null;
  const room = await multiplayerService().updateMatchState(multiplayer.room.roomCode, multiplayer.playerSlot, matchState);
  multiplayer.room = room;
  return room;
}

async function readyCurrentOnlineDeck(deck) {
  const room = await multiplayerService().setReady(multiplayer.room.roomCode, multiplayer.playerSlot, deck.cards);
  renderMultiRoom(room);
  if (room.status !== "playing") {
    showMulti();
    setMultiStatus(room.ranked ? "Deck validé. Recherche d'un adversaire classé..." : "Deck validé. En attente de l'autre joueur.");
  }
  return room;
}

function displayMultiplayerError(error, fallback) {
  const message = error?.message || fallback;
  if (error instanceof MultiplayerConfigurationError || /non configur/i.test(message)) {
    setMultiStatus("Multijoueur en ligne non configur\u00e9.");
    openMultiRoomPanel("Multijoueur en ligne non configur\u00e9.");
    return;
  }
  if (/permission|PERMISSION_DENIED|Missing or insufficient permissions|rules/i.test(message)) {
    setMultiStatus("Firebase bloque la room : v\u00e9rifie les r\u00e8gles Realtime Database sur /rooms.");
    openMultiRoomPanel("Firebase bloque la room : v\u00e9rifie les r\u00e8gles Realtime Database sur /rooms.");
    return;
  }
  if (/network|fetch|offline|unavailable/i.test(message)) {
    setMultiStatus("Connexion Firebase impossible pour le moment.");
    openMultiRoomPanel("Connexion Firebase impossible pour le moment.");
    return;
  }
  setMultiStatus(message || fallback);
  openMultiRoomPanel(message || fallback);
}

function initMultiplayerStatus() {
  multiplayerService();
  const debug = multiplayer.adapter?.debugLabel || "NetworkRoomAdapter = vrai multijoueur (non configur\u00e9)";
  console.info(`[MULTI] ${debug}`);
  if (multiplayer.adapter instanceof NetworkRoomAdapter && !multiplayer.adapter.isConfigured()) {
    setMultiStatus("Multijoueur en ligne non configur\u00e9.");
  }
}

function showJoinRoom() {
  try {
    initMultiplayerStatus();
    document.getElementById("multiJoinPanel")?.classList.add("active");
    document.getElementById("multiRoomPanel")?.classList.remove("active");
    if (!(multiplayer.adapter instanceof NetworkRoomAdapter) || multiplayer.adapter.isConfigured()) {
      setMultiStatus("Entre le code donn\u00e9 par l'autre joueur.");
    }
  } catch (error) {
    console.error("[MULTI] Formulaire de room indisponible", error);
    displayMultiplayerError(error, "Multijoueur indisponible.");
  }
}

async function createOnlineRoom() {
  try {
    multiplayer.launchedRoomCode = null;
    setMultiStatus("Cr\u00e9ation de la partie en ligne...");
    openMultiRoomPanel("Cr\u00e9ation de la partie en ligne...");
    initMultiplayerStatus();
    const identity = await localOnlineIdentity();
    let room = await multiplayerService().createRoom(identity.name);
    multiplayer.playerSlot = "p1";
    room.players.p1.profile = identity;
    room.players.p1.elo = identity.elo;
    room.players.p1.profileId = identity.uid || room.players.p1.id;
    room = await multiplayerService().adapter.writeRoom(room);
    renderMultiRoom(room);
    setMultiStatus("Partie créée. Donne ce code à ton adversaire.");
    multiplayer.unsubscribe?.();
    multiplayer.unsubscribe = multiplayerService().subscribe(room.roomCode, onRoomSnapshot);
  } catch (error) {
    console.error("[MULTI] Cr\u00e9ation de room impossible", error);
    displayMultiplayerError(error, "Cr\u00e9ation impossible.");
  }
}

async function enterQuickQueue(deck, mode = "ranked") {
  try {
    multiplayer.launchedRoomCode = null;
    forceNetworkMultiplayerService();
    setMultiStatus("Recherche d'un match classé...");
    openMultiRoomPanel("Recherche d'un adversaire classé...", { canChooseDeck: false });
    const identity = await localOnlineIdentity();
    const label = mode === "ranked" ? "class\u00e9" : "rapide";
    setMultiStatus(`Recherche d'un match ${label}...`);
    openMultiRoomPanel(`Recherche d'un adversaire ${label}...`, { canChooseDeck: false });
    showMatchmakingSearch();
    const result = await window.AllstarMatchmakingService.findMatch({
      name: "Joueur classé",
      deck: deck.cards,
      elo: identity.elo || 1000,
      profile: identity,
      mode
    });
    multiplayer.room = result.room;
    multiplayer.playerSlot = result.playerSlot;
    multiplayer.unsubscribe?.();
    multiplayer.unsubscribe = forceNetworkMultiplayerService().subscribe(result.room.roomCode, onRoomSnapshot);
    renderMultiRoom(result.room);
    setMultiStatus(result.matched ? "Adversaire trouvé. Préparation du match..." : "En file classée. En attente d'un adversaire...");
    if (!result.matched) setMultiStatus(`En file ${label}. En attente d'un adversaire...`);
    await readyCurrentOnlineDeck(deck);
  } catch (error) {
    console.error("[MATCHMAKING] Match rapide impossible", error);
    displayMultiplayerError(error, "Match rapide indisponible.");
  }
}

function leaveMatchmakingScreen() {
  if (!multiplayer.room || !isMatchmakingRoom(multiplayer.room)) {
    showMenu?.();
    return;
  }
  showMenu?.();
  showSystemToast?.("Recherche maintenue en arrière-plan.");
}

async function cancelOnlineMatchmaking() {
  if (!multiplayer.room || !isMatchmakingRoom(multiplayer.room)) return;
  try {
    await window.AllstarMatchmakingService?.cancelMatchmaking?.();
    closeOnlineSession();
    showMulti?.();
    setMultiStatus("Recherche annulée.");
  } catch (error) {
    console.error("[MATCHMAKING] Annulation impossible", error);
    displayMultiplayerError(error, "Impossible d'annuler la recherche.");
  }
}

function quickMatch() {
  try {
    forceNetworkMultiplayerService();
    if (typeof showDeckSelect !== "function") {
      setMultiStatus("S\u00e9lection de deck indisponible.");
      return;
    }
    showDeckSelect({
      mode: "multi",
      returnScreen: "multi",
      onReady: deck => {
        showMulti();
        void enterQuickQueue(deck, "quick");
      }
    });
  } catch (error) {
    console.error("[MATCHMAKING] Ouverture impossible", error);
    displayMultiplayerError(error, "Match rapide indisponible.");
  }
}

function quickRankedMatch() {
  try {
    forceNetworkMultiplayerService();
    if (typeof showDeckSelect !== "function") {
      setMultiStatus("Sélection de deck indisponible.");
      return;
    }
    showDeckSelect({
      mode: "ranked",
      returnScreen: "multi",
      onReady: deck => {
        showMulti();
        void enterQuickQueue(deck, "ranked");
      }
    });
  } catch (error) {
    console.error("[MATCHMAKING] Ouverture impossible", error);
    displayMultiplayerError(error, "Match rapide indisponible.");
  }
}

async function joinOnlineRoom() {
  try {
    multiplayer.launchedRoomCode = null;
    initMultiplayerStatus();
    const input = document.getElementById("roomCodeInput");
    const identity = await localOnlineIdentity();
    let room = await multiplayerService().joinRoom(input?.value, identity.name);
    multiplayer.playerSlot = "p2";
    room.players.p2.profile = identity;
    room.players.p2.elo = identity.elo;
    room.players.p2.profileId = identity.uid || room.players.p2.id;
    room = await multiplayerService().adapter.writeRoom(room);
    document.getElementById("multiRoomPanel")?.classList.add("active");
    document.getElementById("multiJoinPanel")?.classList.remove("active");
    multiplayer.unsubscribe?.();
    multiplayer.unsubscribe = multiplayerService().subscribe(room.roomCode, onRoomSnapshot);
    renderMultiRoom(room);
    setMultiStatus("Adversaire connect\u00e9. Choisis ton deck puis clique sur Pr\u00eat.");
  } catch (error) {
    console.error("[MULTI] Connexion \u00e0 la room impossible", error);
    displayMultiplayerError(error, "Impossible de rejoindre cette room.");
  }
}

function showOnlineDeckReady() {
  if (!multiplayer.room || !multiplayer.playerSlot) {
    setMultiStatus("Cr\u00e9e ou rejoins une room avant de choisir ton deck.");
    return;
  }
  if (typeof showDeckSelect !== "function") {
    setMultiStatus("S\u00e9lection de deck indisponible.");
    return;
  }
  showDeckSelect({
    mode: "multi",
    returnScreen: "multi",
    onReady: async deck => {
      try {
        await readyCurrentOnlineDeck(deck);
      } catch (error) {
        showMulti();
        displayMultiplayerError(error, "Impossible de valider le deck.");
      }
    }
  });
}

function closeOnlineSession() {
  multiplayer.unsubscribe?.();
  multiplayer.unsubscribe = null;
  multiplayer.room = null;
  multiplayer.playerSlot = null;
  multiplayer.launchedRoomCode = null;
  setMultiDeckReadyAvailable(false);
  resetMultiplayerScreen();
}

window.createOnlineRoom = createOnlineRoom;
window.joinOnlineRoom = joinOnlineRoom;
window.quickMatch = quickMatch;
window.quickRankedMatch = quickRankedMatch;
window.leaveMatchmakingScreen = leaveMatchmakingScreen;
window.cancelOnlineMatchmaking = cancelOnlineMatchmaking;
window.showCustomMatchOptions = showCustomMatchOptions;
window.showOnlineModes = showOnlineModes;
window.showJoinRoom = showJoinRoom;
window.showOnlineLeaderboard = showOnlineLeaderboard;
window.setOnlineLeaderboardSort = setOnlineLeaderboardSort;
document.addEventListener("click", event => {
  const button = event.target.closest("[data-leaderboard-sort]");
  if(button)setOnlineLeaderboardSort(button.dataset.leaderboardSort);
});
window.showOnlineDeckReady = showOnlineDeckReady;
window.closeOnlineSession = closeOnlineSession;
window.initMultiplayerStatus = initMultiplayerStatus;
window.displayMultiplayerError = displayMultiplayerError;
window.publishOnlineMatchState = publishOnlineMatchState;
window.getOnlineMultiplayerContext = () => ({
  room: multiplayer.room,
  playerSlot: multiplayer.playerSlot,
  adapterLabel: multiplayer.adapter?.debugLabel || ""
});
