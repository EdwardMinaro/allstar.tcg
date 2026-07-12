class RoomService {
  constructor(adapter) {
    this.adapter = adapter;
  }

  playerId() {
    const firebaseUid = window.AllstarFirebaseService?.currentUser?.()?.uid;
    if (firebaseUid) return firebaseUid;
    let id = localStorage.getItem("allstarsPlayerId");
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("allstarsPlayerId", id);
    }
    return id;
  }

  generateCode() {
    const prefixes = ["RING", "KAYF", "BELL", "STAR", "HEEL", "FACE"];
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  emptyPlayer(id, name) {
    return {
      id,
      name,
      ready: false,
      deck: [],
      hand: [],
      board: { wrestler: null, bonus: null, object: null },
      lockerRoom: [],
      pinBonus: 0
    };
  }

  async createRoom(name = "Joueur 1") {
    let code = this.generateCode();
    let attempts = 0;
    while (this.adapter instanceof LocalRoomAdapter && await this.adapter.getRoom(code)) {
      code = this.generateCode();
      attempts += 1;
      if (attempts > 20) throw new Error("Impossible de générer un code de room.");
    }
    const playerId = this.playerId();
    const room = {
      roomCode: code,
      ownerId: playerId,
      createdBy: playerId,
      createdAt: Date.now(),
      status: "waiting",
      players: {
        p1: this.emptyPlayer(playerId, name),
        p2: null
      },
      currentTurn: "p1",
      currentRound: 1,
      activeStat: null,
      log: ["Room créée. En attente d'un adversaire."],
      winner: null
    };
    return this.adapter.writeRoom(room);
  }

  async joinRoom(code, name = "Joueur 2") {
    const normalized = String(code || "").trim().toUpperCase();
    const room = await this.adapter.getRoom(normalized);
    if (!room) throw new Error("Code invalide.");
    const playerId = this.playerId();
    if (room.players.p2 && room.players.p2.id !== playerId) throw new Error("Room pleine.");
    room.players.p2 = this.emptyPlayer(playerId, name);
    room.status = "waiting";
    room.log = room.log || [];
    room.log.push("Adversaire connecté. En attente des decks.");
    return this.adapter.writeRoom(room);
  }

  async setReady(code, playerSlot, deck = []) {
    const room = await this.adapter.getRoom(String(code || "").trim().toUpperCase());
    if (!room) throw new Error("Room introuvable.");
    const player = room.players?.[playerSlot];
    if (!player) throw new Error("Joueur introuvable.");
    const cards = Array.isArray(deck) ? deck.slice() : [];
    if (cards.length !== 20) throw new Error("Deck invalide : 20 cartes requises.");
    player.deck = cards;
    player.ready = true;
    room.log = room.log || [];
    room.log.push(`${player.name} est prêt.`);
    if (room.players.p1?.ready && room.players.p2?.ready) {
      room.status = "playing";
      room.currentTurn = "p1";
      room.log.push("Les deux joueurs sont prêts. Le match peut commencer.");
    }
    return this.adapter.writeRoom(room);
  }

  async sendIntent(code, playerSlot, intent) {
    const room = await this.adapter.getRoom(code);
    if (!room) throw new Error("Room introuvable.");
    if (room.status !== "playing") throw new Error("La partie n'est pas active.");
    if (room.currentTurn !== playerSlot) throw new Error("Ce n'est pas votre tour.");
    room.log = room.log || [];
    room.log.push(`${playerSlot}: ${intent.type}`);
    room.lastIntent = { playerSlot, intent, at: Date.now() };
    if (intent.type === "endTurn") room.currentTurn = playerSlot === "p1" ? "p2" : "p1";
    return this.adapter.writeRoom(room);
  }

  async updateMatchState(code, playerSlot, matchState) {
    const room = await this.adapter.getRoom(String(code || "").trim().toUpperCase());
    if (!room) throw new Error("Room introuvable.");
    if (room.status !== "playing" && !(room.status === "finished" && matchState?.over)) {
      throw new Error("La partie n'est pas active.");
    }
    if (!room.players?.[playerSlot]) throw new Error("Joueur introuvable.");
    room.matchState = {
      ...matchState,
      sourceSlot: playerSlot,
      updatedAt: Date.now()
    };
    room.currentTurn = matchState?.currentTurn || room.currentTurn;
    room.currentRound = Number(matchState?.round || room.currentRound || 1);
    room.activeStat = matchState?.stat || null;
    room.winner = matchState?.winner || null;
    if (matchState?.over) room.status = "finished";
    return this.adapter.writeRoom(room);
  }

  subscribe(code, callback) {
    return this.adapter.subscribe(code, callback);
  }
}

window.RoomService = RoomService;
