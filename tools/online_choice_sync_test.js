const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
global.window = {};
global.localStorage = {
  getItem() { return null; },
  setItem() {}
};

eval(fs.readFileSync(path.join(root, "js/roomService.js"), "utf8"));

class TransactionAdapter {
  constructor(room) {
    this.room = structuredClone(room);
    this.queue = Promise.resolve();
  }

  updateRoom(code, updater) {
    const operation = this.queue.then(() => {
      this.room = updater(this.room);
      return structuredClone(this.room);
    });
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }
}

function baseRoom(matchState) {
  return {
    roomCode: "RING-1234",
    status: "playing",
    players: { p1: { id: "one" }, p2: { id: "two" } },
    matchState
  };
}

async function verifyOpeningRpsMerge() {
  for (let index = 0; index < 50; index += 1) {
    const adapter = new TransactionAdapter(baseRoom({
      version: 1,
      openingRps: {
        id: "match:opening:1",
        attempt: 1,
        status: "pending",
        choices: {}
      }
    }));
    const service = new window.RoomService(adapter);
    const submissions = index % 2
      ? [
          service.submitOpeningRpsChoice("RING-1234", "p1", "match:opening:1", "Pierre"),
          service.submitOpeningRpsChoice("RING-1234", "p2", "match:opening:1", "Ciseaux")
        ]
      : [
          service.submitOpeningRpsChoice("RING-1234", "p2", "match:opening:1", "Ciseaux"),
          service.submitOpeningRpsChoice("RING-1234", "p1", "match:opening:1", "Pierre")
        ];
    await Promise.all(submissions);
    const event = adapter.room.matchState.openingRps;
    if (event.status !== "ready" || event.choices.p1 !== "Pierre" || event.choices.p2 !== "Ciseaux") {
      throw new Error(`Opening RPS merge failed at iteration ${index}.`);
    }
  }
}

async function verifyRemoteWheelReroll() {
  for (const choice of ["reroll", "keep"]) {
    const pendingState = {
      version: 10,
      round: 1,
      stat: "Force",
      resolving: true,
      wheelRerollEvent: {
        id: "match:1:reroll",
        status: "pending",
        ownerSlot: "p2",
        resolverSlot: "p1",
        currentStat: "Force"
      }
    };
    const adapter = new TransactionAdapter(baseRoom(pendingState));
    const service = new window.RoomService(adapter);
    const room = await service.submitWheelRerollChoice("RING-1234", "p2", "match:1:reroll", choice);
    const event = room.matchState.wheelRerollEvent;
    if (event.status !== "resolved" || event.choice !== choice || event.resolverSlot !== "p1") {
      throw new Error(`Remote wheel ${choice} resolution failed.`);
    }

    let rejected = false;
    try {
      const invalidAdapter = new TransactionAdapter(baseRoom(pendingState));
      const invalidService = new window.RoomService(invalidAdapter);
      await invalidService.submitWheelRerollChoice("RING-1234", "p1", "match:1:reroll", choice);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("A non-owner submitted the remote wheel choice.");
  }
}

async function verifyDieStatChoice() {
  for (const owner of ["p1", "p2"]) {
    const resolver = owner === "p1" ? "p2" : "p1";
    const pending = {version:10,round:3,resolving:true,stat:null,matchPhase:"die-choice",wheelRerollEvent:{id:"fixture:3:die",kind:"die-stat",round:3,status:"pending",ownerSlot:owner,resolverSlot:resolver,result:7}};
    for (const stat of ["Force", "Vitesse", "Technique", "Charisme"]) {
      const adapter = new TransactionAdapter(baseRoom(pending));
      const service = new window.RoomService(adapter);
      for (const [slot,choice] of [[resolver,stat],[owner,"reroll"],[owner,"keep"]]) {
        let rejected=false;
        try { await service.submitWheelRerollChoice("RING-1234",slot,pending.wheelRerollEvent.id,choice); } catch { rejected=true; }
        if(!rejected)throw Error("Invalid die selection accepted");
      }
      const room=await service.submitWheelRerollChoice("RING-1234",owner,pending.wheelRerollEvent.id,stat);
      if(room.matchState.wheelRerollEvent.choice!==stat)throw Error("Wrong remote die statistic");
      await service.updateMatchState("RING-1234",resolver,pending);
      await service.updateMatchState("RING-1234",owner,{...pending,wheelRerollEvent:null});
      if(adapter.room.matchState.wheelRerollEvent.choice!==stat||adapter.room.matchState.wheelRerollEvent.status!=="resolved")throw Error("Late snapshot erased the die choice");
      let duplicateRejected=false;
      try { await service.submitWheelRerollChoice("RING-1234",owner,pending.wheelRerollEvent.id,stat); } catch { duplicateRejected=true; }
      if(!duplicateRejected)throw Error("Die selection submitted twice");
      await service.updateMatchState("RING-1234",resolver,{...room.matchState,stat,matchPhase:"roulette"});
      if(adapter.room.matchState.stat!==stat)throw Error("Resolver could not resume the duel");
      await service.updateMatchState("RING-1234",owner,{round:4,currentTurn:owner,wheelRerollEvent:null});
      if(adapter.room.matchState.round!==4)throw Error("Handoff guard leaked into next round");
    }
  }
}

Promise.resolve()
  .then(verifyOpeningRpsMerge)
  .then(verifyRemoteWheelReroll)
  .then(verifyDieStatChoice)
  .then(() => console.log("Online choice sync: opening RPS, remote wheel reroll and die-stat ownership/stale-state handoff passed"))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
