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
    this.playRequests=[];
    audioInstances.push(this);
  }

  addEventListener(name,callback) { (this.listeners[name]??=[]).push(callback); }
  emit(name) { for(const callback of this.listeners[name]||[])callback(); }

  play() {
    this.paused = false;
    this.playPromise = new Promise((resolve,reject) => {
      this.resolvePlay = resolve;
      this.playRequests.push({resolve,reject});
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
  const previousEnabled=manager.playPreviousWrestlerMusic(0,true);
  assert.ok(context.window.AUDIO_LIBRARY.music[previousEnabled]?.wrestler,"Précédente ignore la playlist décochée et reste disponible");
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

  manager.stopMusic(false);
  manager.settings.playlists={wrestlers:false,halloween:true};
  manager.wrestlerHistory=[];manager.wrestlerFuture=[];manager.wrestlerQueue=[];
  const during=Date.parse("2026-10-30T12:00:00+01:00");
  context.Math=Object.create(Math);
  const starts=new Set();
  for(let i=0;i<10;i++){context.Math.random=()=>((i+.5)/10);starts.add(manager.startupMusicId(during));}
  assert.equal(starts.size,10,"All ten Halloween songs can be selected at startup");
  context.Math.random=Math.random;
  manager.playMusic("halloween_01",true);
  manager.wrestlerQueue=["halloween_01","halloween_02"];
  assert.equal(manager.playNextWrestlerMusic(0,true),"halloween_02","A queued current song cannot consume Next without switching");
  manager.stopMusic(false);manager.wrestlerHistory=[];manager.wrestlerFuture=[];manager.wrestlerQueue=[];
  manager.playMusic("halloween_01",true);
  const cycle=[manager.currentMusicId];
  for(let i=0;i<9;i++)cycle.push(manager.playNextWrestlerMusic(0,true));
  assert.equal(new Set(cycle).size,10,"Ten unique songs before the first repeat");
  const timeline=[manager.currentMusicId];
  for(let i=0;i<5;i++)timeline.push(manager.playNextWrestlerMusic(0,true));
  for(let i=4;i>=0;i--)assert.equal(manager.playPreviousWrestlerMusic(0,true),timeline[i]);
  for(let i=1;i<timeline.length;i++)assert.equal(manager.playNextWrestlerMusic(0,true),timeline[i],"Next retraces Previous exactly");
  for(let i=0;i<100;i++){const current=manager.currentMusicId;assert.notEqual(manager.playNextWrestlerMusic(0,true),current);}
  manager.wrestlerHistory=[];manager.wrestlerFuture=[];manager.wrestlerQueue=[];
  const reverse=[manager.currentMusicId];
  for(let i=0;i<9;i++)reverse.push(manager.playPreviousWrestlerMusic(0,true));
  assert.equal(new Set(reverse).size,10,"Previous remains usable without bouncing between two tracks at session start");
  manager.stopMusic(false);manager.startMusic("halloween_01");
  const currentAudio=manager.music,initialRequest=currentAudio.playRequests[0];
  manager.toggleMusicPause();manager.toggleMusicPause();
  initialRequest.resolve();await flushPromises();
  assert.equal(currentAudio.paused,false,"An old play promise cannot pause a newer resume of the same reader");
  currentAudio.resolvePlay();await flushPromises();
  currentAudio.paused=true;currentAudio.currentTime=42;
  const countBeforeUnlock=audioInstances.length;
  manager.unlockAndPlay();
  assert.equal(audioInstances.length,countBeforeUnlock,"Touch unlock retries the existing reader instead of replacing it");
  assert.equal(currentAudio.currentTime,42,"Touch unlock does not restart the song");
  currentAudio.resolvePlay();await flushPromises();
  manager.toggleMusicPause();manager.playWrestlerRadio();
  assert.equal(currentAudio.paused,true,"Automatic screen navigation keeps the user's pause");
  assert.equal(manager.playNextWrestlerMusic(0,false),null,"An automatic end/crossfade cannot override pause");
  manager.fadeMusic("halloween_02",0,false);
  assert.equal(manager.music,currentAudio,"An automatic theme change cannot override pause");
  manager.stopMusic();
  clearInterval(manager.fadeTimer);clearInterval(manager.crossfadeTimer);
  console.log("Audio navigation: random Halloween startup, complete shuffle cycle, unlimited back/forward, stale queue and play/resume promises OK.");

  console.log("Audio exclusivity: rapid previous/next changes keep exactly one music active");
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
