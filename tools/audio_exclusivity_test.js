const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const audioInstances = [];
const audioStorage=new Map();

class MockAudio {
  constructor(src) {
    this.src = src;
    this.paused = true;
    this.currentTime = 0;
    this.volume = 1;
    this.dataset = {};
    this.listeners={};
    audioInstances.push(this);
  }

  addEventListener(name,callback) { (this.listeners[name]??=[]).push(callback); }
  emit(name) { for(const callback of this.listeners[name]||[])callback(); }

  play() {
    this.paused = false;
    this.playPromise = new Promise(resolve => {
      this.resolvePlay = resolve;
    });
    return this.playPromise;
  }

  pause() {
    this.paused = true;
  }
}

const context = {
  Audio: MockAudio,
  console,
  localStorage: { getItem: key => audioStorage.get(key)||null, setItem: (key,value) => audioStorage.set(key,value) },
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  },
  performance: { now: () => Date.now() },
  setInterval,
  clearInterval,
  setTimeout,
  clearTimeout,
  window: {}
};

const sourcePath = path.join(__dirname, "..", "js", "audio.js");
const source = `${fs.readFileSync(sourcePath, "utf8")}\nwindow.__audioManager = audioManager;`;
vm.runInNewContext(source, context, { filename: sourcePath });

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

async function run() {
  const manager = context.window.__audioManager;
  assert.strictEqual(context.window.isHalloweenAudioSeasonActive(Date.parse("2026-10-29T00:00:00+01:00")), true,
    "Le fond Halloween doit être actif dès le 29 octobre");
  assert.strictEqual(context.window.isHalloweenAudioSeasonActive(Date.parse("2026-11-19T23:59:59+01:00")), true,
    "Le fond Halloween doit rester actif jusqu'au 19 novembre inclus");
  assert.strictEqual(context.window.isHalloweenAudioSeasonActive(Date.parse("2026-11-20T00:00:00+01:00")), false,
    "Le fond Halloween doit s'arrêter le 20 novembre");
  const halloweenIds=Object.keys(context.window.AUDIO_LIBRARY.music).filter(id=>context.window.AUDIO_LIBRARY.music[id].playlist==="halloween");
  assert.equal(halloweenIds.length,10);
  manager.settings.playlists={wrestlers:true,halloween:false};
  manager.startMusic("halloween_01");
  assert.strictEqual(manager.music.loop, false,"Les morceaux Halloween doivent s'enchaîner sans boucler individuellement");
  const firstNormalId = manager.playNextWrestlerMusic(0, true);
  assert.ok(context.window.AUDIO_LIBRARY.music[firstNormalId]?.wrestler,
    "Musique suivante doit quitter Halloween pour un thème de catcheur normal");
  assert.equal(manager.playPreviousWrestlerMusic(0,true),null,"Précédente doit ignorer l'historique d'une playlist décochée");
  audioInstances.forEach(audio => audio.resolvePlay?.());
  await flushPromises();
  assert.strictEqual(audioInstances.filter(audio => !audio.paused).length, 1,
    "Le passage Halloween / thème normal doit conserver un seul lecteur actif");
  manager.stopMusic(false);
  audioInstances.length = 0;
  manager.wrestlerHistory = [];
  manager.wrestlerQueue = [];

  manager.setPlaylistEnabled("halloween",true);
  manager.setPlaylistEnabled("wrestlers",false);
  assert.equal(manager.playlistMusicIds().length,10);
  manager.playMusic("halloween_01",true);
  assert.equal(manager.currentMusicId,"halloween_01");
  manager.music.emit("ended");
  assert.ok(manager.currentMusicId.startsWith("halloween_"),"Fin de morceau : rester dans la playlist Halloween seule");
  const beforePrevious=manager.currentMusicId;
  manager.playPreviousWrestlerMusic(0,true);
  assert.equal(manager.currentMusicId,"halloween_01");
  assert.notEqual(beforePrevious,manager.currentMusicId);
  assert.equal(manager.setPlaylistEnabled("halloween",false),false,"Au moins une playlist doit rester cochée");
  assert.equal(manager.loadSettings().playlists.wrestlers,false,"Playlist sauvegardée après redémarrage");
  manager.toggleMusicPause();
  manager.setPlaylistEnabled("wrestlers",true);
  manager.setPlaylistEnabled("halloween",false);
  assert.equal(manager.music,null,"Un changement de playlist ne doit pas relancer une musique mise en pause");
  assert.equal(context.window.AUDIO_LIBRARY.music[manager.pendingMusicId].wrestler!==undefined,true);
  manager.stopMusic();
  manager.setPlaylistEnabled("halloween",true);
  assert.equal(manager.music,null,"Un changement de playlist ne doit pas relancer après Stop");
  const enabled=manager.playlistMusicIds();
  assert.ok(enabled.some(id=>id.startsWith("halloween_"))&&enabled.some(id=>context.window.AUDIO_LIBRARY.music[id].wrestler),"Les deux playlists doivent pouvoir se mélanger");
  audioInstances.forEach(audio=>audio.resolvePlay?.());
  await flushPromises();
  audioInstances.length=0;
  manager.wrestlerHistory=[];
  manager.wrestlerQueue=[];

  const ids = manager.wrestlerMusicIds().slice(0, 3);
  assert.strictEqual(ids.length, 3, "Trois thèmes sont nécessaires pour le test");

  manager.startMusic(ids[0]);
  manager.fadeMusic(ids[1], 0, true);
  manager.fadeMusic(ids[2], 0, true);

  assert.strictEqual(audioInstances.filter(audio => !audio.paused).length, 1,
    "Un seul lecteur doit rester actif pendant des clics rapides");

  audioInstances[1].resolvePlay();
  audioInstances[0].resolvePlay();
  audioInstances[2].resolvePlay();
  await flushPromises();

  assert.strictEqual(audioInstances.filter(audio => !audio.paused).length, 1,
    "Les promesses play() obsolètes ne doivent pas relancer leurs pistes");
  assert.strictEqual(manager.music, audioInstances[2]);
  assert.strictEqual(manager.currentMusicId, ids[2]);

  console.log("Audio exclusivity: rapid previous/next changes keep exactly one music active");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
