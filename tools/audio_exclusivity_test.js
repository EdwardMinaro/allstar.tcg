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
