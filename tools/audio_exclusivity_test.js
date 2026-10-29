const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const audioInstances = [];

class MockAudio {
  constructor(src) {
    this.src = src;
    this.paused = true;
    this.currentTime = 0;
    this.volume = 1;
    this.dataset = {};
    audioInstances.push(this);
  }

  addEventListener() {}

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
  localStorage: { getItem: () => null, setItem: () => {} },
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
  assert.ok(context.window.AUDIO_LIBRARY.music.halloween_2026,
    "La musique Halloween doit être déclarée dans la bibliothèque audio");
  manager.startMusic("halloween_2026");
  assert.strictEqual(manager.currentMusicId, "halloween_2026",
    "La musique Halloween doit pouvoir démarrer comme fond d'accueil");
  assert.strictEqual(manager.music.loop, true,
    "Le long fond Halloween doit boucler si le joueur reste dans l'ambiance");
  const firstNormalId = manager.playNextWrestlerMusic(0, true);
  assert.ok(context.window.AUDIO_LIBRARY.music[firstNormalId]?.wrestler,
    "Musique suivante doit quitter Halloween pour un thème de catcheur normal");
  assert.strictEqual(manager.playPreviousWrestlerMusic(0, true), "halloween_2026",
    "Musique précédente doit permettre de revenir au fond Halloween");
  audioInstances.forEach(audio => audio.resolvePlay?.());
  await flushPromises();
  assert.strictEqual(audioInstances.filter(audio => !audio.paused).length, 1,
    "Le passage Halloween / thème normal doit conserver un seul lecteur actif");
  manager.stopMusic(false);
  audioInstances.length = 0;
  manager.wrestlerHistory = [];
  manager.wrestlerQueue = [];

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
