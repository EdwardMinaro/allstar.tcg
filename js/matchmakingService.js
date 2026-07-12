(function(){
  const QUEUE_ROOT = "matchmaking";
  const ENTRY_TTL_MS = 2 * 60 * 1000;
  let currentQueueKey = null;

  function playerId(){
    const firebaseUid = window.AllstarFirebaseService?.currentUser?.()?.uid;
    if (firebaseUid) return firebaseUid;
    let id = localStorage.getItem("allstarsPlayerId");
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("allstarsPlayerId", id);
    }
    return id;
  }

  async function databaseTools(){
    const services = await window.AllstarFirebaseService.firebaseServices();
    await services.auth?.authStateReady?.();
    if (!services.auth?.currentUser) throw new Error("Connecte-toi avant de lancer un match classé.");
    return {
      database: services.database,
      ref: services.modules.database.ref,
      get: services.modules.database.get,
      set: services.modules.database.set,
      remove: services.modules.database.remove
    };
  }

  function queuePath(mode, key = ""){
    const root = `${QUEUE_ROOT}/${mode}`;
    return key ? `${root}/${key}` : root;
  }

  function freshEntries(entries){
    const now = Date.now();
    return Object.entries(entries || {}).filter(([, entry]) => {
      return entry?.roomCode && entry?.playerId && now - Number(entry.createdAt || 0) < ENTRY_TTL_MS;
    });
  }

  async function cleanupExpired(tools, mode, entries){
    const now = Date.now();
    await Promise.all(Object.entries(entries || {}).map(([key, entry]) => {
      if (now - Number(entry?.createdAt || 0) < ENTRY_TTL_MS) return null;
      return tools.remove(tools.ref(tools.database, queuePath(mode, key))).catch(() => {});
    }).filter(Boolean));
  }

  async function findMatch(options = {}){
    const tools = await databaseTools();
    const id = playerId();
    const mode = options.mode === "quick" ? "quick" : "ranked";
    const ranked = mode === "ranked";
    const name = options.name || "Joueur classé";
    const elo = Math.round(Number(options.elo) || 1000);
    const service = new RoomService(new NetworkRoomAdapter());
    const snap = await tools.get(tools.ref(tools.database, queuePath(mode)));
    const entries = snap.exists() ? snap.val() : {};
    await cleanupExpired(tools, mode, entries);

    const opponent = freshEntries(entries)
      .filter(([, entry]) => entry.playerId !== id)
      .sort(([, a], [, b]) => Math.abs(Number(a.elo || 1000) - elo) - Math.abs(Number(b.elo || 1000) - elo))[0];

    if (opponent) {
      const [queueKey, entry] = opponent;
      let room = await service.joinRoom(entry.roomCode, name);
      room.ranked = ranked;
      room.matchmaking = { mode, queue: "quick", matchedAt: Date.now() };
      room.players.p1.elo = Number(entry.elo || 1000);
      room.players.p2.elo = elo;
      room.players.p1.profileId = entry.playerId;
      room.players.p2.profileId = id;
      room = await service.adapter.writeRoom(room);
      await tools.remove(tools.ref(tools.database, queuePath(mode, queueKey))).catch(() => {});
      currentQueueKey = null;
      return { room, playerSlot: "p2", matched: true };
    }

    let room = await service.createRoom(name);
    room.ranked = ranked;
    room.matchmaking = { mode, queue: "quick", createdAt: Date.now() };
    room.players.p1.elo = elo;
    room.players.p1.profileId = id;
    room = await service.adapter.writeRoom(room);
    currentQueueKey = `${mode}:${id}`;
    await tools.set(tools.ref(tools.database, queuePath(mode, id)), {
      playerId: id,
      name,
      elo,
      roomCode: room.roomCode,
      createdAt: Date.now(),
      mode
    });
    return { room, playerSlot: "p1", matched: false };
  }

  async function cancelMatchmaking(){
    if (!currentQueueKey) return false;
    const tools = await databaseTools();
    const [mode, key] = currentQueueKey.split(":");
    await tools.remove(tools.ref(tools.database, queuePath(mode, key)));
    currentQueueKey = null;
    return true;
  }

  window.AllstarMatchmakingService = {
    findMatch,
    cancelMatchmaking
  };
})();
