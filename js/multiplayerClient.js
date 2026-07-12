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
  if (!multiplayer.room) document.getElementById("multiRoomPanel")?.classList.remove("active");
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

function openMultiRoomPanel(message = "Cr\u00e9ation de la room...", options = {}) {
  document.getElementById("multiRoomPanel")?.classList.add("active");
  document.getElementById("multiJoinPanel")?.classList.remove("active");
  const code = document.getElementById("roomCodeDisplay");
  const state = document.getElementById("roomStateDisplay");
  const log = document.getElementById("multiLog");
  if (code) code.textContent = multiplayer.room?.roomCode || "----";
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
  setMultiDeckReadyAvailable(true);
  if (code) code.textContent = room.roomCode;
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
    const room = await multiplayerService().createRoom("Joueur 1");
    multiplayer.playerSlot = "p1";
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
    const progress = localRankedProgress();
    const label = mode === "ranked" ? "class\u00e9" : "rapide";
    setMultiStatus(`Recherche d'un match ${label}...`);
    openMultiRoomPanel(`Recherche d'un adversaire ${label}...`, { canChooseDeck: false });
    const result = await window.AllstarMatchmakingService.findMatch({
      name: "Joueur classé",
      deck: deck.cards,
      elo: progress.elo || 1000,
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
    const room = await multiplayerService().joinRoom(input?.value, "Joueur 2");
    multiplayer.playerSlot = "p2";
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
}

window.createOnlineRoom = createOnlineRoom;
window.joinOnlineRoom = joinOnlineRoom;
window.quickMatch = quickMatch;
window.quickRankedMatch = quickRankedMatch;
window.showCustomMatchOptions = showCustomMatchOptions;
window.showOnlineModes = showOnlineModes;
window.showJoinRoom = showJoinRoom;
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
