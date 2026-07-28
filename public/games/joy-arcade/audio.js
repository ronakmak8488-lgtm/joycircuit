const TAU = Math.PI * 2;

const COMMON_CUES = Object.freeze({
  start: {
    kind: 'layers',
    layers: [
      { kind: 'sweep', ratio: 1.5, toRatio: 3, duration: 0.19, gain: 0.055 },
      { kind: 'tone', ratio: 4, duration: 0.12, delay: 0.13, gain: 0.04, type: 'triangle' }
    ]
  },
  pause: { kind: 'sweep', ratio: 3, toRatio: 1.25, duration: 0.15, gain: 0.045, type: 'triangle' },
  resume: { kind: 'sweep', ratio: 1.25, toRatio: 3, duration: 0.14, gain: 0.045, type: 'triangle' },
  toggle: { kind: 'sparkle', ratio: 2.2, intervals: [0, 7], duration: 0.1, spacing: 0.045, gain: 0.032 },
  win: { kind: 'chord', ratio: 2, intervals: [0, 4, 7, 12], duration: 0.68, spacing: 0.07, gain: 0.052 },
  lose: {
    kind: 'layers',
    layers: [
      { kind: 'sweep', ratio: 2.2, toRatio: 0.72, duration: 0.48, gain: 0.07, type: 'sawtooth' },
      { kind: 'noise', duration: 0.25, delay: 0.05, gain: 0.035, filter: 560, filterType: 'lowpass' }
    ]
  },
  move: { kind: 'click', ratio: 3, duration: 0.045, gain: 0.026 },
  action: { kind: 'sweep', ratio: 2, toRatio: 4, duration: 0.12, gain: 0.045 },
  impact: { kind: 'thump', ratio: 1.5, toRatio: 0.65, duration: 0.11, gain: 0.06 },
  score: { kind: 'sparkle', ratio: 3, intervals: [0, 7, 12], duration: 0.12, spacing: 0.035, gain: 0.04 },
  pickup: { kind: 'sparkle', ratio: 3.5, intervals: [0, 5, 12], duration: 0.12, spacing: 0.03, gain: 0.04 },
  damage: { kind: 'crash', ratio: 1.3, duration: 0.29, gain: 0.08 },
  miss: { kind: 'sweep', ratio: 2, toRatio: 0.8, duration: 0.2, gain: 0.045, type: 'square' }
});

// Every title in the manifest maps to one of these mechanics. Profiles keep the
// gameplay API semantic while giving each mechanic its own instrument and bed.
const MODE_PROFILES = Object.freeze({
  dodger: {
    root: 110,
    bpm: 78,
    ambience: 'drift',
    wave: 'sine',
    bedLevel: 0.024,
    noteGain: 0.012,
    sequence: [1, null, 1.5, null, 1.25, null, 2, null],
    cues: {
      score: { kind: 'tone', ratio: 3.1, duration: 0.1, gain: 0.024, type: 'sine' },
      damage: { kind: 'crash', ratio: 1.1, duration: 0.32, gain: 0.085, filter: 780 }
    }
  },
  'lane-racer': {
    root: 55,
    bpm: 132,
    ambience: 'engine',
    wave: 'sawtooth',
    bedLevel: 0.037,
    noteGain: 0.008,
    sequence: [1, null, null, null, 1.5, null, null, null],
    cues: {
      move: { kind: 'noise', duration: 0.1, gain: 0.032, filter: 1650, filterType: 'bandpass' },
      damage: { kind: 'crash', ratio: 1.35, duration: 0.4, gain: 0.105, filter: 620 }
    }
  },
  snake: {
    root: 164.81,
    bpm: 108,
    ambience: 'pulse',
    wave: 'square',
    bedLevel: 0.012,
    noteGain: 0.012,
    sequence: [1, 1.25, null, 1.5, 1, null, 2, 1.5],
    cues: {
      move: { kind: 'click', ratio: 2, duration: 0.035, gain: 0.023, type: 'square' },
      pickup: { kind: 'sparkle', ratio: 2.4, intervals: [0, 4, 7, 12], duration: 0.1, spacing: 0.025, gain: 0.036 },
      damage: { kind: 'crash', ratio: 0.8, duration: 0.27, gain: 0.072, filter: 920 }
    }
  },
  breakout: {
    root: 130.81,
    bpm: 104,
    ambience: 'pulse',
    wave: 'triangle',
    bedLevel: 0.014,
    noteGain: 0.009,
    sequence: [1, null, 1.5, 1.25, null, 2, null, 1.5],
    cues: {
      action: { kind: 'sweep', ratio: 1.4, toRatio: 4.4, duration: 0.15, gain: 0.048 },
      impact: { kind: 'click', ratio: 4.2, duration: 0.045, gain: 0.035, type: 'triangle' },
      score: { kind: 'layers', layers: [
        { kind: 'click', ratio: 3.2, duration: 0.055, gain: 0.04, type: 'square' },
        { kind: 'noise', duration: 0.07, gain: 0.018, filter: 2400, filterType: 'highpass' }
      ] },
      miss: { kind: 'sweep', ratio: 2.1, toRatio: 0.7, duration: 0.25, gain: 0.052, type: 'triangle' }
    }
  },
  shooter: {
    root: 82.41,
    bpm: 118,
    ambience: 'drone',
    wave: 'sawtooth',
    bedLevel: 0.018,
    noteGain: 0.009,
    sequence: [1, null, 1.5, null, 1.189, null, 2, null],
    cues: {
      action: { kind: 'laser', ratio: 7.2, toRatio: 2.2, duration: 0.105, gain: 0.045 },
      score: { kind: 'crash', ratio: 2.4, duration: 0.16, gain: 0.052, filter: 1450 },
      damage: { kind: 'crash', ratio: 0.9, duration: 0.35, gain: 0.09, filter: 720 }
    }
  },
  catcher: {
    root: 196,
    bpm: 82,
    ambience: 'chime',
    wave: 'sine',
    bedLevel: 0.012,
    noteGain: 0.012,
    sequence: [1, null, 1.5, null, 1.25, null, 1.875, null],
    cues: {
      pickup: { kind: 'sparkle', ratio: 1.7, intervals: [0, 7, 12], duration: 0.15, spacing: 0.035, gain: 0.038 },
      damage: { kind: 'crash', ratio: 0.65, duration: 0.28, gain: 0.073, filter: 760 },
      miss: { kind: 'sweep', ratio: 1.6, toRatio: 0.75, duration: 0.16, gain: 0.031, type: 'sine' }
    }
  },
  memory: {
    root: 220,
    bpm: 64,
    ambience: 'chime',
    wave: 'sine',
    bedLevel: 0.01,
    noteGain: 0.011,
    sequence: [1, null, null, 1.5, null, null, 1.25, null],
    cues: {
      move: { kind: 'click', ratio: 1.8, duration: 0.035, gain: 0.018, type: 'sine' },
      action: { kind: 'sweep', ratio: 1.4, toRatio: 2.15, duration: 0.09, gain: 0.029, type: 'triangle' },
      score: { kind: 'chord', ratio: 1.25, intervals: [0, 4, 7, 12], duration: 0.34, spacing: 0.035, gain: 0.035 },
      miss: { kind: 'chord', ratio: 1.1, intervals: [0, -2], duration: 0.2, spacing: 0.055, gain: 0.027 }
    }
  },
  pong: {
    root: 146.83,
    bpm: 124,
    ambience: 'pulse',
    wave: 'square',
    bedLevel: 0.01,
    noteGain: 0.007,
    sequence: [1, null, 1.5, null, 2, null, 1.5, null],
    cues: {
      impact: { kind: 'click', ratio: 2.7, duration: 0.055, gain: 0.037, type: 'square' },
      score: { kind: 'sparkle', ratio: 2.2, intervals: [0, 7, 12], duration: 0.13, spacing: 0.035, gain: 0.04 },
      damage: { kind: 'sweep', ratio: 2, toRatio: 0.7, duration: 0.22, gain: 0.052, type: 'square' }
    }
  },
  maze: {
    root: 174.61,
    bpm: 70,
    ambience: 'drift',
    wave: 'triangle',
    bedLevel: 0.014,
    noteGain: 0.009,
    sequence: [1, null, null, 1.5, null, 1.25, null, null],
    cues: {
      move: { kind: 'click', ratio: 1.65, duration: 0.045, gain: 0.022, type: 'triangle' },
      miss: { kind: 'thump', ratio: 0.9, toRatio: 0.6, duration: 0.075, gain: 0.032 }
    }
  },
  runner: {
    root: 73.42,
    bpm: 126,
    ambience: 'rhythm',
    wave: 'triangle',
    bedLevel: 0.019,
    noteGain: 0.011,
    sequence: [1, null, 1, 1.5, 1, null, 2, 1.5],
    cues: {
      action: { kind: 'sweep', ratio: 2, toRatio: 6.2, duration: 0.18, gain: 0.05, type: 'triangle' },
      impact: { kind: 'thump', ratio: 1.2, toRatio: 0.55, duration: 0.1, gain: 0.047 },
      pickup: { kind: 'sparkle', ratio: 4, intervals: [0, 7, 12], duration: 0.1, spacing: 0.025, gain: 0.038 },
      damage: { kind: 'crash', ratio: 0.9, duration: 0.34, gain: 0.086, filter: 680 }
    }
  },
  defense: {
    root: 98,
    bpm: 116,
    ambience: 'drone',
    wave: 'sawtooth',
    bedLevel: 0.019,
    noteGain: 0.009,
    sequence: [1, null, 1.5, null, 1.25, null, 1.75, null],
    cues: {
      action: { kind: 'laser', ratio: 5.7, toRatio: 1.8, duration: 0.09, gain: 0.04 },
      score: { kind: 'crash', ratio: 2, duration: 0.14, gain: 0.047, filter: 1300 },
      damage: { kind: 'crash', ratio: 0.75, duration: 0.36, gain: 0.093, filter: 610 }
    }
  },
  orbit: {
    root: 123.47,
    bpm: 76,
    ambience: 'orbit',
    wave: 'sine',
    bedLevel: 0.023,
    noteGain: 0.011,
    sequence: [1, null, 1.5, null, 1.259, null, 2, null],
    cues: {
      action: { kind: 'sweep', ratio: 1.2, toRatio: 4.8, duration: 0.2, gain: 0.043, type: 'sine' },
      pickup: { kind: 'sparkle', ratio: 2.4, intervals: [0, 7, 12, 19], duration: 0.13, spacing: 0.025, gain: 0.035 },
      damage: { kind: 'crash', ratio: 0.85, duration: 0.34, gain: 0.083, filter: 720 }
    }
  },
  stacker: {
    root: 130.81,
    bpm: 92,
    ambience: 'pulse',
    wave: 'triangle',
    bedLevel: 0.012,
    noteGain: 0.008,
    sequence: [1, null, null, 1.5, null, null, 1.25, null],
    cues: {
      action: { kind: 'sweep', ratio: 3.5, toRatio: 1.1, duration: 0.12, gain: 0.038, type: 'triangle' },
      score: { kind: 'layers', layers: [
        { kind: 'thump', ratio: 1, toRatio: 0.62, duration: 0.11, gain: 0.045 },
        { kind: 'tone', ratio: 3, duration: 0.14, delay: 0.05, gain: 0.026, type: 'sine' }
      ] },
      miss: { kind: 'crash', ratio: 0.8, duration: 0.27, gain: 0.072, filter: 570 }
    }
  }
});

const DEFAULT_PROFILE = MODE_PROFILES.dodger;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const semitones = (value) => 2 ** (value / 12);

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function titleProfile(base, slug) {
  const hash = hashText(slug || 'joy-arcade');
  const keyShift = [-2, -1, 0, 1, 2][hash % 5];
  const tempoScale = 1 + (((hash >>> 4) % 7) - 3) * 0.012;
  const rotation = (hash >>> 8) % base.sequence.length;
  const sequence = [...base.sequence.slice(rotation), ...base.sequence.slice(0, rotation)];
  const secondaryWaves = base.ambience === 'engine'
    ? ['square', 'sawtooth', 'triangle']
    : ['sine', 'triangle', base.wave];
  return {
    ...base,
    root: base.root * semitones(keyShift),
    bpm: base.bpm * tempoScale,
    sequence,
    secondaryWave: secondaryWaves[(hash >>> 12) % secondaryWaves.length],
    brightness: 0.9 + ((hash >>> 16) % 9) * 0.025
  };
}

export function createArcadeAudio() {
  let context = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let noiseBuffer = null;
  let bed = null;
  let mode = 'dodger';
  let profile = titleProfile(DEFAULT_PROFILE, 'joy-arcade');
  let unlocked = false;
  let muted = true;
  let hidden = document.hidden;
  let active = false;
  let paused = false;
  let motion = 0.35;
  let motionTarget = 0.35;
  let nextBeat = 0;
  let sequenceStep = 0;
  const lastCue = new Map();

  const cooldowns = {
    move: 0.045,
    action: 0.065,
    impact: 0.035,
    score: 0.055,
    pickup: 0.075,
    damage: 0.28,
    miss: 0.12,
    start: 0.2,
    pause: 0.15,
    resume: 0.15,
    toggle: 0.1,
    win: 0.5,
    lose: 0.5
  };

  function now() {
    return context?.currentTime || 0;
  }

  function safeParam(param, value, at = now(), timeConstant = 0.025) {
    param.cancelScheduledValues(at);
    param.setTargetAtTime(value, at, timeConstant);
  }

  function makeNoiseBuffer() {
    const length = Math.max(1, Math.floor(context.sampleRate * 0.75));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.72 + white * 0.28;
      data[i] = white * 0.62 + previous * 0.38;
    }
    return buffer;
  }

  function connectSpatial(node, pan = 0, output = sfxBus) {
    if (typeof context.createStereoPanner !== 'function') {
      node.connect(output);
      return output;
    }
    const panner = context.createStereoPanner();
    panner.pan.value = clamp(pan, -0.85, 0.85);
    node.connect(panner);
    panner.connect(output);
    return panner;
  }

  function buildBed() {
    if (!context || !musicBus) return;
    if (bed) {
      for (const oscillator of bed.oscillators) {
        try { oscillator.stop(); } catch { /* Already stopped. */ }
      }
      try { bed.lfo.stop(); } catch { /* Already stopped. */ }
    }

    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = profile.ambience === 'engine' ? 2.4 : 0.75;
    filter.frequency.value = profile.ambience === 'engine' ? 430 : 720;
    gain.gain.value = 0.0001;
    gain.connect(filter);
    filter.connect(musicBus);

    const frequencies = profile.ambience === 'engine'
      ? [profile.root, profile.root * 2.02]
      : [profile.root * 0.5, profile.root * 0.755];
    const oscillators = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = index === 0 ? profile.wave : profile.secondaryWave;
      oscillator.frequency.value = frequency;
      voiceGain.gain.value = index === 0 ? 0.72 : 0.28;
      oscillator.connect(voiceGain);
      voiceGain.connect(gain);
      oscillator.start();
      return oscillator;
    });

    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    const lfoAmount = profile.ambience === 'engine' ? 0.004 : 0.003;
    lfo.type = 'sine';
    lfo.frequency.value = profile.ambience === 'engine' ? 9.5 : profile.ambience === 'orbit' ? 0.11 : 0.2;
    lfoDepth.gain.value = 0;
    lfo.connect(lfoDepth);
    lfoDepth.connect(gain.gain);
    lfo.start();
    bed = { gain, filter, oscillators, lfo, lfoDepth, lfoAmount };
    syncBed();
  }

  function buildGraph() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    context = new AudioContextClass({ latencyHint: 'interactive' });
    master = context.createGain();
    sfxBus = context.createGain();
    musicBus = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 15;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.16;
    master.gain.value = 0.0001;
    sfxBus.gain.value = 0.86;
    musicBus.gain.value = 0.72;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);
    noiseBuffer = makeNoiseBuffer();
    buildBed();
    return true;
  }

  function syncMaster(immediate = false) {
    if (!master || !context) return;
    const value = muted || hidden ? 0.0001 : 0.72;
    if (immediate) master.gain.setValueAtTime(value, now());
    else safeParam(master.gain, value, now(), muted ? 0.018 : 0.045);
  }

  function syncBed() {
    if (!bed || !context) return;
    const audible = active && !paused && !muted && !hidden;
    const target = audible ? profile.bedLevel * (0.72 + motion * 0.48) : 0.0001;
    safeParam(bed.gain.gain, Math.max(0.0001, target), now(), audible ? 0.22 : 0.045);
    safeParam(bed.lfoDepth.gain, audible ? bed.lfoAmount : 0, now(), audible ? 0.16 : 0.035);
    safeParam(musicBus.gain, audible ? 0.72 : 0.0001, now(), audible ? 0.12 : 0.035);
  }

  function frequency(recipe, key = 'ratio') {
    const explicit = key === 'ratio' ? recipe.frequency : recipe.toFrequency;
    if (explicit) return explicit;
    const ratio = recipe[key] ?? (key === 'ratio' ? 2 : recipe.ratio ?? 2);
    return clamp(profile.root * ratio, 38, 4200);
  }

  function playTone(recipe, detail = {}, output = sfxBus) {
    const start = now() + (recipe.delay || 0) + (detail.delay || 0);
    const duration = Math.max(0.025, (recipe.duration || 0.12) * (detail.durationScale || 1));
    const attack = Math.min(duration * 0.35, recipe.attack || 0.008);
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const pitch = semitones(detail.pitch || 0);
    const from = frequency(recipe) * pitch;
    const to = frequency(recipe, 'toRatio') * pitch;
    oscillator.type = recipe.type || profile.wave || 'triangle';
    oscillator.frequency.setValueAtTime(Math.max(30, from), start);
    if (recipe.toRatio || recipe.toFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, to), start + duration);
    filter.type = recipe.filterType || 'lowpass';
    filter.frequency.value = recipe.filter || Math.min(9000, Math.max(900, from * 5));
    filter.Q.value = recipe.q || 0.7;
    const level = clamp((recipe.gain || 0.04) * (detail.intensity || 1), 0.003, 0.16);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    connectSpatial(gain, detail.pan || 0, output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.025);
  }

  function playNoise(recipe, detail = {}, output = sfxBus) {
    const start = now() + (recipe.delay || 0) + (detail.delay || 0);
    const duration = Math.max(0.035, (recipe.duration || 0.16) * (detail.durationScale || 1));
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    source.playbackRate.value = recipe.rate || 1;
    filter.type = recipe.filterType || 'bandpass';
    filter.frequency.value = recipe.filter || 980;
    filter.Q.value = recipe.q || 0.85;
    const level = clamp((recipe.gain || 0.045) * (detail.intensity || 1), 0.003, 0.16);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    connectSpatial(gain, detail.pan || 0, output);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function playRecipe(recipe, detail = {}, output = sfxBus) {
    if (!recipe || !context || !output) return;
    if (recipe.kind === 'layers') {
      for (const layer of recipe.layers) playRecipe(layer, detail, output);
      return;
    }
    if (recipe.kind === 'sparkle' || recipe.kind === 'chord') {
      const intervals = recipe.intervals || [0, 7, 12];
      intervals.forEach((interval, index) => {
        playTone({
          ...recipe,
          kind: 'tone',
          ratio: (recipe.ratio || 2) * semitones(interval),
          delay: (recipe.delay || 0) + index * (recipe.spacing || 0.035),
          type: recipe.type || (recipe.kind === 'sparkle' ? 'sine' : 'triangle')
        }, detail, output);
      });
      return;
    }
    if (recipe.kind === 'crash') {
      playNoise({
        duration: recipe.duration || 0.28,
        gain: (recipe.gain || 0.08) * 0.78,
        filter: recipe.filter || 760,
        filterType: 'lowpass',
        delay: recipe.delay || 0
      }, detail, output);
      playTone({
        kind: 'sweep',
        ratio: recipe.ratio || 1.2,
        toRatio: (recipe.ratio || 1.2) * 0.34,
        duration: (recipe.duration || 0.28) * 0.9,
        gain: (recipe.gain || 0.08) * 0.72,
        type: 'sawtooth',
        filter: recipe.filter || 760,
        delay: recipe.delay || 0
      }, detail, output);
      return;
    }
    if (recipe.kind === 'laser') {
      playTone({ ...recipe, kind: 'sweep', type: 'sawtooth', filter: recipe.filter || 4200 }, detail, output);
      playTone({
        kind: 'sweep',
        ratio: (recipe.ratio || 5) * 1.5,
        toRatio: (recipe.toRatio || 1.8) * 1.25,
        duration: (recipe.duration || 0.1) * 0.62,
        gain: (recipe.gain || 0.04) * 0.38,
        type: 'square',
        delay: recipe.delay || 0
      }, detail, output);
      return;
    }
    if (recipe.kind === 'thump') {
      playTone({ ...recipe, kind: 'sweep', type: 'sine', toRatio: recipe.toRatio || (recipe.ratio || 1) * 0.35, filter: recipe.filter || 720 }, detail, output);
      return;
    }
    if (recipe.kind === 'click') {
      playTone({ ...recipe, kind: 'tone', type: recipe.type || 'square', attack: 0.002 }, detail, output);
      return;
    }
    if (recipe.kind === 'noise') playNoise(recipe, detail, output);
    else playTone(recipe, detail, output);
  }

  function configure(nextMode, slug = '') {
    mode = MODE_PROFILES[nextMode] ? nextMode : 'dodger';
    profile = titleProfile(MODE_PROFILES[mode], slug);
    motion = 0.35;
    motionTarget = 0.35;
    sequenceStep = 0;
    nextBeat = 0;
    lastCue.clear();
    if (context) buildBed();
  }

  function unlock() {
    if (!context && !buildGraph()) return Promise.resolve(false);
    unlocked = true;
    syncMaster(true);
    const resumed = context.state === 'suspended' ? context.resume() : Promise.resolve();
    return Promise.resolve(resumed).then(() => {
      syncMaster();
      syncBed();
      return true;
    }).catch(() => false);
  }

  function setMuted(value) {
    muted = Boolean(value);
    syncMaster();
    syncBed();
    if (!muted && context) nextBeat = now() + 0.12;
  }

  function setHidden(value) {
    hidden = Boolean(value);
    syncMaster();
    syncBed();
    if (!hidden && context) nextBeat = now() + 0.16;
  }

  function play(cue, detail = {}) {
    if (cue === 'motion') {
      const level = typeof detail === 'number' ? detail : detail.level;
      if (Number.isFinite(level)) motionTarget = clamp(level, 0, 1);
      return;
    }
    if (!context || !unlocked || muted || hidden) return;
    const timestamp = now();
    const cooldown = detail.cooldown ?? cooldowns[cue] ?? 0.04;
    if (!detail.force && timestamp - (lastCue.get(cue) ?? -Infinity) < cooldown) return;
    lastCue.set(cue, timestamp);
    playRecipe(profile.cues?.[cue] || COMMON_CUES[cue], detail);
  }

  function start() {
    active = true;
    paused = false;
    motion = 0.35;
    motionTarget = 0.35;
    sequenceStep = 0;
    nextBeat = context ? now() + 0.18 : 0;
    syncBed();
    play('start', { force: true });
  }

  function finish(won) {
    active = false;
    paused = false;
    syncBed();
    play(won ? 'win' : 'lose', { force: true });
  }

  function setPaused(value, announce = true) {
    paused = Boolean(value);
    if (!paused && context) nextBeat = now() + 0.14;
    syncBed();
    if (announce) play(paused ? 'pause' : 'resume', { force: true });
  }

  function update(dt) {
    motion += (motionTarget - motion) * Math.min(1, dt * 4.5);
    if (bed && context) {
      const engine = profile.ambience === 'engine';
      const firstTarget = profile.root * (engine ? 0.82 + motion * 0.72 : 0.5 + motion * 0.035);
      const secondTarget = profile.root * (engine ? 1.65 + motion * 1.46 : 0.755 + motion * 0.045);
      bed.oscillators[0].frequency.setTargetAtTime(firstTarget, now(), 0.06);
      bed.oscillators[1].frequency.setTargetAtTime(secondTarget, now(), 0.06);
      const filterTarget = (engine ? 330 + motion * 920 : 620 + motion * 280) * profile.brightness;
      bed.filter.frequency.setTargetAtTime(filterTarget, now(), 0.1);
      syncBed();
    }
    motionTarget += (0.35 - motionTarget) * Math.min(1, dt * 0.45);

    if (!context || !unlocked || muted || hidden || !active || paused || context.state !== 'running') return;
    const timestamp = now();
    if (timestamp < nextBeat) return;
    const beat = 60 / profile.bpm;
    nextBeat = timestamp + beat;
    const ratio = profile.sequence[sequenceStep % profile.sequence.length];
    sequenceStep += 1;
    if (ratio == null) return;
    const rhythmAccent = profile.ambience === 'rhythm' && sequenceStep % 4 === 1;
    playTone({
      kind: rhythmAccent ? 'thump' : 'tone',
      ratio,
      toRatio: rhythmAccent ? ratio * 0.48 : ratio,
      duration: rhythmAccent ? 0.11 : Math.min(0.34, beat * 0.55),
      gain: rhythmAccent ? profile.noteGain * 1.5 : profile.noteGain,
      type: rhythmAccent ? 'sine' : profile.wave,
      filter: profile.ambience === 'chime' ? 4200 : 1300
    }, { intensity: 0.8, pan: Math.sin(sequenceStep * 1.7) * 0.22 }, musicBus);
  }

  return Object.freeze({
    configure,
    unlock,
    setMuted,
    setHidden,
    play,
    start,
    finish,
    setPaused,
    update,
    get muted() { return muted; },
    get unlocked() { return unlocked; }
  });
}
