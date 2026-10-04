import { FLOOR_FEATURES, PROJECTION } from './room-layout.mjs?v=40';

// Floor keys lie flat in the room's 2:1 projection: one tile is 25 scene units
// along each floor axis, and matrix(1,.5,-1,.5) maps the plane onto the floor.
const TILE = PROJECTION.tileWidth / 2;
const KEY = 1.45 * TILE;
const GAP = 0.3 * TILE;
// C major pentatonic, low to high, so any run of taps sounds pleasant. The spacebar is a low C.
const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
const TUNE = [3, 4, 5, 7, 6, 4, 5, 3, 0, 1, 2, 9];
const SOUND_KEY = 'todsophon.keyboard-sound.v1';

export function createFloorKeyboard({ stage, guide }) {
  const area = FLOOR_FEATURES.find(feature => feature.id === 'keyboard');
  const keys = [
    ...NOTES.map((freq, i) => ({ id: i, freq, x: (i % 3) * (KEY + GAP), y: Math.floor(i / 3) * (KEY + GAP), w: KEY, h: KEY })),
    { id: 9, freq: 130.81, space: true, x: 0, y: 3 * (KEY + GAP), w: 3 * KEY + 2 * GAP, h: KEY },
  ];
  const offset = { x: area.x * TILE + (area.width * TILE - (3 * KEY + 2 * GAP)) / 2, y: area.y * TILE + (area.depth * TILE - (4 * KEY + 3 * GAP)) / 2 };

  const scene = document.createElement('div');
  scene.className = 'floor-keys-scene';
  const plane = document.createElement('div');
  plane.className = 'floor-keys';
  plane.setAttribute('role', 'group');
  plane.setAttribute('aria-label', 'Floor keyboard. Each key plays a soft click and a note.');
  plane.style.left = `${PROJECTION.originX}px`;
  plane.style.top = `${PROJECTION.originY}px`;
  for (const key of keys) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `floor-key${key.space ? ' is-space' : ''}`;
    button.style.left = `${offset.x + key.x}px`;
    button.style.top = `${offset.y + key.y}px`;
    button.style.width = `${key.w}px`;
    button.style.height = `${key.h}px`;
    button.setAttribute('aria-label', key.space ? 'Spacebar' : `Key ${key.id + 1}`);
    button.addEventListener('click', () => press(key, true));
    key.button = button;
    plane.append(button);
  }
  scene.append(plane);
  stage.querySelector('#furniture-layer').before(scene);

  // The keys live in scene units; scale them with the room.
  const resize = () => stage.style.setProperty('--scene-scale', String(stage.clientWidth / 1000));
  new ResizeObserver(resize).observe(stage);
  resize();

  let soundOn = true;
  try { soundOn = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* Sound stays on. */ }
  let context = null;
  let stepKey = null;
  let playing = false;

  function audio(create) {
    if (!context && create) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) context = new AudioContext();
    }
    if (context?.state === 'suspended' && create) context.resume();
    return context?.state === 'running' || create ? context : null;
  }
  function sound(key, volume = 1) {
    const ctx = soundOn && audio(volume === 1);
    if (!ctx) return;
    const t = ctx.currentTime, out = ctx.createGain();
    out.gain.value = .5 * volume; out.connect(ctx.destination);
    // Click: a short band-passed noise burst.
    const length = Math.floor(ctx.sampleRate * .03), buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const noise = ctx.createBufferSource(); noise.buffer = buffer;
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = key.space ? 900 : 1700; band.Q.value = .9;
    const noiseGain = ctx.createGain(); noiseGain.gain.setValueAtTime(.7, t); noiseGain.gain.exponentialRampToValueAtTime(.001, t + .05);
    noise.connect(band).connect(noiseGain).connect(out); noise.start(t);
    // Thock: a quick, falling low body.
    const body = ctx.createOscillator(); body.type = 'sine';
    body.frequency.setValueAtTime(key.space ? 110 : 170, t); body.frequency.exponentialRampToValueAtTime(70, t + .08);
    const bodyGain = ctx.createGain(); bodyGain.gain.setValueAtTime(.55, t); bodyGain.gain.exponentialRampToValueAtTime(.001, t + .1);
    body.connect(bodyGain).connect(out); body.start(t); body.stop(t + .12);
    // Note: a soft triangle tone.
    const tone = ctx.createOscillator(); tone.type = 'triangle'; tone.frequency.value = key.freq;
    const toneGain = ctx.createGain(); toneGain.gain.setValueAtTime(.0001, t);
    toneGain.gain.exponentialRampToValueAtTime(.22, t + .01); toneGain.gain.exponentialRampToValueAtTime(.001, t + .7);
    tone.connect(toneGain).connect(out); tone.start(t); tone.stop(t + .75);
  }
  function press(key, byVisitor = false) {
    sound(key, byVisitor ? 1 : .45);
    key.button.classList.remove('is-down');
    void key.button.offsetWidth;
    key.button.classList.add('is-down');
    clearTimeout(key.timer);
    key.timer = setTimeout(() => key.button.classList.remove('is-down'), 140);
    if (byVisitor) stage.classList.add('keys-discovered');
  }
  // Fibi's footsteps press whatever key she walks onto. Her steps only make sound
  // after a visitor has played a key, so the room never starts making noise by itself.
  document.addEventListener('fibi:moved', event => {
    const { x, y } = event.detail;
    const px = x * TILE - offset.x, py = y * TILE - offset.y;
    const key = keys.find(k => px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) || null;
    if (key && key !== stepKey && (event.detail.walking || playing)) press(key);
    stepKey = key;
  });

  function centerOf(key) {
    return { x: (offset.x + key.x + key.w / 2) / TILE, y: (offset.y + key.y + key.h / 2) / TILE };
  }
  function playTune() {
    if (playing || !guide) return;
    audio(true);
    playing = true;
    guide.setTourMode(true);
    const hop = index => {
      if (index >= TUNE.length) {
        playing = false;
        guide.walkTo(guide.home(), { reaction: 'happy', reactionTime: 2.2, onComplete: () => guide.setTourMode(false) });
        return;
      }
      guide.walkTo(centerOf(keys[TUNE[index]]), { reaction: 'jumping', reactionTime: .18, onComplete: () => hop(index + 1) });
    };
    hop(0);
  }
  function setSound(value) {
    soundOn = value;
    try { localStorage.setItem(SOUND_KEY, value ? 'on' : 'off'); } catch { /* The choice lasts for this visit. */ }
    if (value) audio(true);
  }
  return { playTune, setSound, isSoundOn: () => soundOn };
}
