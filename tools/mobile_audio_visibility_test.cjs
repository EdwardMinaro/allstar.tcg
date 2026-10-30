const assert = require('assert/strict');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8');
function setup(mobile = true) {
  const events = {}, instances = [];
  const document = { hidden: false, addEventListener: (key, fn) => events[key] = fn,
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
  class Audio {
    constructor() { this.paused = true; this.currentTime = 0; this.dataset = {}; this.events = {}; instances.push(this); }
    addEventListener(key, fn) { (this.events[key] ??= []).push(fn); }
    play() { this.paused = false; return new Promise(resolve => this.resolve = resolve); }
    pause() { this.paused = true; }
  }
  const window = { location: { search: mobile ? '?mobile=1' : '' },
    addEventListener: (key, fn) => events[key] = fn };
  vm.runInNewContext(source, { window, document, Audio, console, setTimeout, clearTimeout,
    setInterval, clearInterval, performance, localStorage: { getItem: () => null, setItem: () => {} } });
  return { manager: window.audioManager, document, events, instances };
}
async function run() {
  const { manager: m, document: d, events, instances } = setup();
  m.startMusic('halloween_01');
  const reader = m.music;
  reader.currentTime = 42;
  d.hidden = true; events.visibilitychange(); events.pagehide();
  assert.equal(reader.paused, true);
  reader.resolve(); await Promise.resolve();
  assert.equal(reader.paused, true, 'A delayed play result cannot restart hidden audio');
  const count = instances.length;
  m.fadeMusic('halloween_02', 0, true); m.playNextWrestlerMusic(0, true);
  m.playPreviousWrestlerMusic(); m.toggleMusicPause(); m.unlockAndPlay(); m.playSfx('clic');
  assert.equal(instances.length, count, 'Hidden events cannot create new playback');
  assert.equal(m.currentMusicId, 'halloween_01');
  d.hidden = false; events.visibilitychange(); events.pageshow();
  assert.equal(reader.paused, false);
  assert.equal(reader.currentTime, 42, 'Resume preserves playback position');
  assert.equal(reader.volume, m.effectiveVolume('music'));
  reader.resolve(); await Promise.resolve();
  m.toggleMusicPause();
  d.hidden = true; events.visibilitychange(); d.hidden = false; events.visibilitychange();
  assert.equal(reader.paused, true, 'Manual pause survives background and foreground');
  m.toggleMusicPause(); m.playSfx('clic');
  const sound = instances.at(-1);
  d.hidden = true; events.visibilitychange();
  assert.equal(sound.paused, true, 'Existing sound effects stop in background');
  m.stopMusic(); d.hidden = false; events.visibilitychange();
  assert.equal(m.music, null, 'Manual stop cancels automatic resume');
  const desktop = setup(false);
  desktop.manager.startMusic('halloween_01'); desktop.document.hidden = true;
  assert.equal(desktop.manager.isPageAudioSuspended(), false, 'Desktop behavior stays unchanged');
  desktop.manager.stopMusic();
  console.log('Mobile background audio: pause, position, resume, manual pause, late promises, hidden events and desktop isolation OK.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
