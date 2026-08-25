class LocalRoomAdapter {
  constructor(storageKey = "allstarsMockRooms") {
    this.storageKey = storageKey;
    this.listeners = new Map();
    this.debugLabel = "LocalRoomAdapter = test local uniquement";
  }

  loadRooms() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "{}");
    } catch {
      return {};
    }
  }

  saveRooms(rooms) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(rooms));
    } catch {
      // Mock networking is optional.
    }
  }

  getRoom(code) {
    return this.loadRooms()[code] || null;
  }

  writeRoom(room) {
    const rooms = this.loadRooms();
    rooms[room.roomCode] = room;
    this.saveRooms(rooms);
    this.emit(room.roomCode, room);
    return room;
  }

  updateRoom(code, updater) {
    const normalized = String(code || "").trim().toUpperCase();
    const rooms = this.loadRooms();
    const current = rooms[normalized] || null;
    const next = updater(current);
    if (typeof next === "undefined") return current;
    const savedRoom = { ...next, updatedAt: Date.now() };
    rooms[normalized] = savedRoom;
    this.saveRooms(rooms);
    this.emit(normalized, savedRoom);
    return savedRoom;
  }

  subscribe(code, callback) {
    if (!this.listeners.has(code)) this.listeners.set(code, new Set());
    this.listeners.get(code).add(callback);
    callback(this.getRoom(code));
    return () => this.listeners.get(code)?.delete(callback);
  }

  emit(code, room) {
    this.listeners.get(code)?.forEach(callback => callback(room));
  }
}

class MultiplayerConfigurationError extends Error {
  constructor(message = "Multijoueur en ligne non configuré.") {
    super(message);
    this.name = "MultiplayerConfigurationError";
  }
}

class NetworkRoomAdapter {
  constructor(options = {}) {
    this.roomRoot = options.roomRoot || "rooms";
    this.debugLabel = this.isConfigured()
      ? "NetworkRoomAdapter = vrai multijoueur Firebase"
      : "NetworkRoomAdapter = vrai multijoueur (non configuré)";
  }

  isConfigured() {
    return Boolean(window.AllstarFirebaseService?.configured?.());
  }

  ensureConfigured() {
    if (!this.isConfigured()) throw new MultiplayerConfigurationError();
  }

  async firebaseTools() {
    this.ensureConfigured();
    const services = await window.AllstarFirebaseService.firebaseServices();
    if (!services?.database) throw new MultiplayerConfigurationError("Multijoueur en ligne non configuré.");
    await services.auth?.authStateReady?.();
    if (!services.auth?.currentUser) throw new Error("Connecte-toi avant de créer une partie en ligne.");
    return services;
  }

  roomPath(code) {
    const normalized = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    return normalized ? `${this.roomRoot}/${normalized}` : "";
  }

  async getRoom(code) {
    const path = this.roomPath(code);
    if (!path) return null;
    const { database, modules } = await this.firebaseTools();
    const { ref, get } = modules.database;
    const snapshot = await get(ref(database, path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  async writeRoom(room) {
    if (!room?.roomCode) throw new Error("Room invalide.");
    const { database, modules } = await this.firebaseTools();
    const { ref, set } = modules.database;
    const savedRoom = {
      ...room,
      updatedAt: Date.now()
    };
    await set(ref(database, this.roomPath(savedRoom.roomCode)), savedRoom);
    return savedRoom;
  }

  async updateRoom(code, updater) {
    const path = this.roomPath(code);
    if (!path) throw new Error("Code invalide.");
    const { database, modules } = await this.firebaseTools();
    const { ref, runTransaction } = modules.database;
    let updateError = null;
    const result = await runTransaction(ref(database, path), current => {
      try {
        const next = updater(current);
        if (typeof next === "undefined") return;
        return { ...next, updatedAt: Date.now() };
      } catch (error) {
        updateError = error;
        return;
      }
    }, { applyLocally: false });
    if (updateError) throw updateError;
    if (!result.committed) throw new Error("La mise à jour de la partie a été interrompue.");
    return result.snapshot.val();
  }

  subscribe(code, callback) {
    const path = this.roomPath(code);
    if (!path) {
      callback(null, new Error("Code invalide."));
      return () => {};
    }
    let unsubscribe = null;
    let stopped = false;
    this.firebaseTools()
      .then(({ database, modules }) => {
        if (stopped) return;
        const { ref, onValue } = modules.database;
        unsubscribe = onValue(
          ref(database, path),
          snapshot => callback(snapshot.exists() ? snapshot.val() : null),
          error => callback(null, error)
        );
      })
      .catch(error => callback(null, error));
    return () => {
      stopped = true;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }
}

window.LocalRoomAdapter = LocalRoomAdapter;
window.NetworkRoomAdapter = NetworkRoomAdapter;
window.MultiplayerConfigurationError = MultiplayerConfigurationError;
