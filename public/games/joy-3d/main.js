import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWorld } from './worlds.js';

const $ = (id) => document.getElementById(id);
const ui = {
  host: $('webgl-host'),
  title: $('game-title'),
  tagline: $('game-tagline'),
  scoreLabel: $('score-label'),
  score: $('score'),
  objective: $('objective'),
  time: $('time'),
  pause: $('pause'),
  restart: $('restart'),
  mute: $('mute'),
  soundWave: $('sound-wave'),
  loading: $('loading'),
  loadingDetail: $('loading-detail'),
  modal: $('modal'),
  modalIcon: $('modal-icon'),
  modalTitle: $('modal-title'),
  modalCopy: $('modal-copy'),
  result: $('result'),
  finalScore: $('final-score'),
  finalResult: $('final-result'),
  primary: $('primary-action'),
  controlHint: $('control-hint'),
  toast: $('toast'),
  reticle: $('reticle'),
  touchControls: $('touch-controls'),
  touchAction: $('touch-action'),
};

const state = {
  config: null,
  world: null,
  phase: 'loading',
  score: 0,
  objective: 'Preparing',
  timeLeft: 0,
  timeLimit: 0,
  muted: true,
  last: performance.now(),
  toastTimer: 0,
  assetFailures: 0,
};

const input = {
  keys: new Set(),
  just: new Set(),
  pointer: new THREE.Vector2(),
  pointerPixels: new THREE.Vector2(),
  pointerDown: false,
};

const AUDIO_PROFILES = Object.freeze({
  racing: {
    bpm: 132, root: 38, scale: [0, 3, 5, 7, 10], pattern: [0, 2, 1, 3, 0, 4, 2, 3],
    lead: 'sawtooth', bass: 'square', filter: 1850, seed: 11,
    motion: 'engine', motionWave: 'sawtooth', motionBase: 42, motionRange: 96, stepPitch: 0.82, sfxPitch: 0.94,
  },
  exploration: {
    bpm: 82, root: 48, scale: [0, 2, 4, 7, 9], pattern: [0, 2, 4, 2, 1, 3, 4, 2],
    lead: 'sine', bass: 'triangle', filter: 1350, seed: 23,
    motion: 'walk', motionWave: 'sine', motionBase: 55, motionRange: 42, stepPitch: 0.72, sfxPitch: 1.08,
  },
  platformer: {
    bpm: 116, root: 53, scale: [0, 2, 4, 6, 9], pattern: [0, 1, 3, 4, 2, 4, 3, 1],
    lead: 'triangle', bass: 'sine', filter: 2300, seed: 37,
    motion: 'walk', motionWave: 'triangle', motionBase: 64, motionRange: 48, stepPitch: 1.12, sfxPitch: 1.16,
  },
  flight: {
    bpm: 104, root: 34, scale: [0, 2, 3, 7, 10], pattern: [0, 3, 1, 4, 2, 3, 1, 4],
    lead: 'sine', bass: 'sawtooth', filter: 1600, seed: 41,
    motion: 'flight', motionWave: 'triangle', motionBase: 58, motionRange: 150, stepPitch: 1, sfxPitch: 1.24,
  },
  range: {
    bpm: 128, root: 45, scale: [0, 1, 3, 7, 8], pattern: [0, 3, 2, 4, 1, 3, 4, 2],
    lead: 'square', bass: 'triangle', filter: 2650, seed: 53,
    motion: 'none', motionWave: 'sine', motionBase: 62, motionRange: 40, stepPitch: 1, sfxPitch: 1.3,
  },
  maze: {
    bpm: 76, root: 43, scale: [0, 2, 3, 7, 9], pattern: [0, 1, 3, 2, 4, 2, 1, 3],
    lead: 'sine', bass: 'triangle', filter: 1120, seed: 67,
    motion: 'walk', motionWave: 'sine', motionBase: 50, motionRange: 38, stepPitch: 0.66, sfxPitch: 0.9,
  },
  sports: {
    bpm: 124, root: 50, scale: [0, 2, 4, 7, 9, 10], pattern: [0, 2, 4, 3, 1, 5, 4, 2],
    lead: 'triangle', bass: 'square', filter: 2100, seed: 71,
    motion: 'walk', motionWave: 'triangle', motionBase: 60, motionRange: 44, stepPitch: 0.9, sfxPitch: 1,
  },
  defense: {
    bpm: 112, root: 36, scale: [0, 3, 5, 6, 10], pattern: [0, 2, 1, 3, 0, 4, 3, 1],
    lead: 'sawtooth', bass: 'square', filter: 1450, seed: 83,
    motion: 'none', motionWave: 'square', motionBase: 48, motionRange: 65, stepPitch: 0.84, sfxPitch: 0.86,
  },
  stacker: {
    bpm: 98, root: 46, scale: [0, 2, 4, 6, 8, 10], pattern: [0, 2, 4, 1, 3, 5, 2, 4],
    lead: 'triangle', bass: 'sine', filter: 1750, seed: 97,
    motion: 'none', motionWave: 'sine', motionBase: 56, motionRange: 46, stepPitch: 0.75, sfxPitch: 0.96,
  },
  delivery: {
    bpm: 120, root: 41, scale: [0, 2, 4, 7, 9], pattern: [0, 3, 2, 4, 1, 3, 4, 2],
    lead: 'sawtooth', bass: 'triangle', filter: 1950, seed: 109,
    motion: 'engine', motionWave: 'sawtooth', motionBase: 39, motionRange: 82, stepPitch: 0.8, sfxPitch: 1.02,
  },
});

function createSoundscape() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const fallbackProfile = AUDIO_PROFILES.exploration;
  const cooldownDefaults = {
    impact: 0.24, wall: 0.2, step: 0.18, land: 0.12, dribble: 0.16,
    fire: 0.09, miss: 0.12, warning: 0.28, boost: 0.22, drop: 0.12,
  };
  let context = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let motionBus = null;
  let noiseBuffer = null;
  let motionOscillator = null;
  let motionSubOscillator = null;
  let motionFilter = null;
  let motionToneGain = null;
  let motionNoiseFilter = null;
  let motionNoiseGain = null;
  let muted = true;
  let profile = fallbackProfile;
  let mode = 'exploration';
  let accentDetune = 0;
  let sequenceStep = 0;
  let nextMusicAt = 0;
  let nextFootstepAt = 0;
  let motionKind = 'none';
  let motionAmount = 0;
  let motionAccent = 0;
  let lastMotionAt = 0;
  let lastMasterLevel = -1;
  const cooldowns = new Map();

  const midiFrequency = (note) => 440 * (2 ** ((note - 69) / 12));
  const safeParam = (param, value, time, glide = 0.025) => {
    param.cancelScheduledValues(time);
    param.setTargetAtTime(Math.max(0.0001, value), time, glide);
  };

  function buildNoiseBuffer() {
    noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    let seed = 0x51f15e;
    for (let index = 0; index < samples.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[index] = ((seed / 0xffffffff) * 2 - 1) * 0.88;
    }
  }

  function createMotionLayer() {
    motionOscillator = context.createOscillator();
    motionSubOscillator = context.createOscillator();
    motionFilter = context.createBiquadFilter();
    motionToneGain = context.createGain();
    motionOscillator.type = profile.motionWave;
    motionSubOscillator.type = mode === 'flight' ? 'sine' : 'square';
    motionFilter.type = 'lowpass';
    motionFilter.frequency.value = 520;
    motionFilter.Q.value = 1.2;
    motionToneGain.gain.value = 0.0001;
    motionOscillator.connect(motionFilter);
    motionSubOscillator.connect(motionFilter);
    motionFilter.connect(motionToneGain);
    motionToneGain.connect(motionBus);

    const noiseSource = context.createBufferSource();
    motionNoiseFilter = context.createBiquadFilter();
    motionNoiseGain = context.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    motionNoiseFilter.type = 'bandpass';
    motionNoiseFilter.frequency.value = 330;
    motionNoiseFilter.Q.value = 0.75;
    motionNoiseGain.gain.value = 0.0001;
    noiseSource.connect(motionNoiseFilter);
    motionNoiseFilter.connect(motionNoiseGain);
    motionNoiseGain.connect(motionBus);
    motionOscillator.start();
    motionSubOscillator.start();
    noiseSource.start();
  }

  function ensureContext() {
    if (context || !AudioContextClass) return context;
    context = new AudioContextClass({ latencyHint: 'interactive' });
    const compressor = context.createDynamicsCompressor();
    master = context.createGain();
    musicBus = context.createGain();
    sfxBus = context.createGain();
    motionBus = context.createGain();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 7;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.24;
    master.gain.value = 0.0001;
    musicBus.gain.value = 0.24;
    sfxBus.gain.value = 0.62;
    motionBus.gain.value = 0.34;
    musicBus.connect(compressor);
    sfxBus.connect(compressor);
    motionBus.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);
    buildNoiseBuffer();
    createMotionLayer();
    nextMusicAt = context.currentTime + 0.05;
    return context;
  }

  function setMaster(level, quick = false) {
    if (!context || !master || level === lastMasterLevel) return;
    lastMasterLevel = level;
    safeParam(master.gain, Math.max(0.0001, level), context.currentTime, quick ? 0.012 : 0.055);
  }

  function unlock() {
    const audioContext = ensureContext();
    if (!audioContext) return Promise.resolve(false);
    const resumed = audioContext.state === 'suspended' ? audioContext.resume() : Promise.resolve();
    return resumed.then(() => {
      lastMasterLevel = -1;
      setMaster(muted ? 0 : 0.52, true);
      return true;
    }).catch(() => false);
  }

  function tone({
    from, to = from, duration = 0.18, volume = 0.08, type = profile.lead,
    when = context?.currentTime ?? 0, attack = 0.008, destination = sfxBus,
    filter = profile.filter, pan = 0,
  }) {
    if (!context || !destination) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const color = context.createBiquadFilter();
    const stereo = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
    const end = when + Math.max(0.035, duration);
    oscillator.type = type;
    oscillator.detune.setValueAtTime(accentDetune, when);
    oscillator.frequency.setValueAtTime(Math.max(20, from), when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), end);
    color.type = 'lowpass';
    color.frequency.setValueAtTime(Math.max(180, filter), when);
    color.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), when + Math.min(attack, duration * 0.35));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(color);
    color.connect(gain);
    if (stereo) {
      stereo.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(stereo);
      stereo.connect(destination);
    } else gain.connect(destination);
    oscillator.start(when);
    oscillator.stop(end + 0.025);
  }

  function noise({
    duration = 0.12, volume = 0.07, when = context?.currentTime ?? 0,
    frequency = 900, type = 'bandpass', q = 0.8, destination = sfxBus,
  } = {}) {
    if (!context || !noiseBuffer || !destination) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const end = when + Math.max(0.035, duration);
    source.buffer = noiseBuffer;
    source.loop = true;
    filter.type = type;
    filter.frequency.setValueAtTime(Math.max(80, frequency), when);
    filter.Q.value = q;
    gain.gain.setValueAtTime(Math.max(0.0001, volume), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(when, (profile.seed % 11) * 0.071);
    source.stop(end + 0.02);
  }

  function play(name, options = {}) {
    if (!context || muted || context.state !== 'running') return false;
    const now = context.currentTime;
    const cooldown = options.cooldown ?? cooldownDefaults[name] ?? 0.045;
    const last = cooldowns.get(name) ?? -Infinity;
    if (now - last < cooldown) return false;
    cooldowns.set(name, now);
    const identity = profile.sfxPitch ?? 1;
    const pitch = identity * (options.pitch ?? 1);
    const intensity = Math.max(0.3, Math.min(1.25, options.intensity ?? 1));
    const root = midiFrequency(profile.root + 24) * pitch;

    switch (name) {
      case 'start':
        [0, 4, 7].forEach((offset, index) => tone({ from: root * (2 ** (offset / 12)), duration: 0.2, volume: 0.052, when: now + index * 0.07 }));
        break;
      case 'pause':
        tone({ from: root * 1.2, to: root * 0.8, duration: 0.16, volume: 0.045, type: 'sine' });
        break;
      case 'resume':
      case 'unmute':
        tone({ from: root * 0.8, to: root * 1.35, duration: 0.18, volume: 0.045, type: 'sine' });
        break;
      case 'boost':
        noise({ duration: 0.36, volume: 0.07 * intensity, frequency: mode === 'flight' ? 1750 : 720, q: 0.5 });
        tone({ from: root * 0.38, to: root * 1.8, duration: 0.32, volume: 0.075 * intensity, type: profile.motionWave, filter: profile.filter * 1.25 });
        break;
      case 'impact':
      case 'wall':
        noise({ duration: name === 'wall' ? 0.08 : 0.16, volume: 0.1 * intensity, frequency: name === 'wall' ? 260 : 430, q: 0.65 });
        tone({ from: root * 0.42, to: root * 0.2, duration: 0.18, volume: 0.1 * intensity, type: 'sine', filter: 620 });
        break;
      case 'pickup':
      case 'checkpoint':
      case 'delivery': {
        const lift = name === 'delivery' ? 1.12 : name === 'checkpoint' ? 0.94 : 1;
        tone({ from: root * lift, to: root * lift * 1.5, duration: 0.15, volume: 0.065, type: 'sine', filter: 3200 });
        tone({ from: root * lift * 1.5, to: root * lift * 2, duration: 0.2, volume: 0.045, type: 'triangle', when: now + 0.085, filter: 3800 });
        break;
      }
      case 'jump':
        tone({ from: root * 0.62, to: root * 1.25, duration: 0.2, volume: 0.07, type: 'triangle' });
        noise({ duration: 0.075, volume: 0.026, frequency: 1250, type: 'highpass' });
        break;
      case 'land':
        noise({ duration: 0.075, volume: 0.045 * intensity, frequency: 330, q: 0.55 });
        tone({ from: root * 0.34, to: root * 0.25, duration: 0.09, volume: 0.048 * intensity, type: 'sine', filter: 500 });
        break;
      case 'fall':
        tone({ from: root * 1.1, to: root * 0.28, duration: 0.45, volume: 0.065, type: 'triangle' });
        break;
      case 'fire':
        tone({ from: root * (mode === 'defense' ? 1.25 : 2.2), to: root * 0.55, duration: mode === 'defense' ? 0.18 : 0.11, volume: 0.075, type: mode === 'range' ? 'square' : 'sawtooth', filter: 3100 });
        noise({ duration: 0.055, volume: 0.04, frequency: 2400, type: 'highpass' });
        break;
      case 'hit':
        tone({ from: root * 1.1, to: root * 2.05, duration: 0.13, volume: 0.075, type: 'square', filter: 2800 });
        noise({ duration: 0.08, volume: 0.052, frequency: 1800 });
        break;
      case 'miss':
        tone({ from: root * 0.55, to: root * 0.42, duration: 0.12, volume: 0.035, type: 'triangle', filter: 700 });
        break;
      case 'kick':
        noise({ duration: 0.09, volume: 0.085, frequency: 240, q: 0.5 });
        tone({ from: root * 0.38, to: root * 0.28, duration: 0.11, volume: 0.09, type: 'sine', filter: 520 });
        break;
      case 'dribble':
        tone({ from: root * 0.32, to: root * 0.22, duration: 0.065, volume: 0.035, type: 'sine', filter: 440 });
        break;
      case 'goal':
        [0, 4, 7, 12].forEach((offset, index) => tone({ from: root * (2 ** (offset / 12)), duration: 0.32, volume: 0.062, when: now + index * 0.075, type: index % 2 ? 'triangle' : profile.lead }));
        noise({ duration: 0.42, volume: 0.035, frequency: 2200, type: 'highpass' });
        break;
      case 'drop':
        noise({ duration: 0.24, volume: 0.055, frequency: 760, q: 0.45 });
        tone({ from: root * 1.05, to: root * 0.38, duration: 0.22, volume: 0.045, type: 'triangle' });
        break;
      case 'place':
        noise({ duration: 0.1, volume: 0.08 * intensity, frequency: 310, q: 0.55 });
        tone({ from: root * 0.48, to: root * 0.4, duration: 0.12, volume: 0.075 * intensity, type: 'sine', filter: 600 });
        tone({ from: root, to: root * 1.26, duration: 0.16, volume: 0.035, type: 'triangle', when: now + 0.045 });
        break;
      case 'warning':
        tone({ from: root * 0.42, to: root * 0.36, duration: 0.23, volume: 0.075, type: 'square', filter: 680 });
        break;
      case 'success':
        [0, 4, 7, 12].forEach((offset, index) => tone({ from: root * (2 ** (offset / 12)), duration: 0.55 - index * 0.04, volume: 0.07, when: now + index * 0.095, type: index === 3 ? 'sine' : profile.lead, filter: 3200 }));
        break;
      case 'failure':
        [0, -2, -5].forEach((offset, index) => tone({ from: root * (2 ** (offset / 12)), to: root * (2 ** ((offset - 1) / 12)), duration: 0.32, volume: 0.055, when: now + index * 0.12, type: 'triangle', filter: 1050 }));
        break;
      case 'step':
        noise({ duration: 0.055, volume: 0.022 * intensity, frequency: 210 * profile.stepPitch, q: 0.65 });
        tone({ from: root * 0.2 * profile.stepPitch, to: root * 0.16 * profile.stepPitch, duration: 0.055, volume: 0.025 * intensity, type: 'sine', filter: 390 });
        break;
      default:
        tone({ from: root, to: root * 1.08, duration: 0.12, volume: 0.04, type: 'sine' });
    }
    return true;
  }

  function scheduleMusicStep(when) {
    const beat = 60 / profile.bpm;
    const scaleIndex = profile.pattern[sequenceStep % profile.pattern.length];
    const note = profile.root + 12 + profile.scale[scaleIndex];
    const frequency = midiFrequency(note);
    const pan = ((sequenceStep + profile.seed) % 5 - 2) * 0.11;
    tone({
      from: frequency, to: frequency * 1.004, duration: beat * 0.42,
      volume: 0.042, type: profile.lead, when, destination: musicBus,
      filter: profile.filter, pan,
    });
    if (sequenceStep % 2 === 0) {
      const bassNote = profile.root + profile.scale[profile.pattern[(sequenceStep / 2) % profile.pattern.length] % Math.min(3, profile.scale.length)];
      tone({
        from: midiFrequency(bassNote), to: midiFrequency(bassNote) * 0.997,
        duration: beat * 0.72, volume: 0.047, type: profile.bass,
        when, destination: musicBus, filter: Math.min(900, profile.filter * 0.55),
      });
    }
    if (sequenceStep % 4 === profile.seed % 4) {
      noise({ duration: 0.055, volume: 0.012, when, frequency: 2100, type: 'highpass', destination: musicBus });
    }
    if (sequenceStep % 8 === 0) {
      const fifth = midiFrequency(profile.root + 7);
      tone({ from: midiFrequency(profile.root), to: midiFrequency(profile.root) * 1.002, duration: beat * 3.4, volume: 0.018, type: 'sine', when, destination: musicBus, filter: 760, pan: -0.18 });
      tone({ from: fifth, to: fifth * 0.998, duration: beat * 3.4, volume: 0.013, type: 'sine', when, destination: musicBus, filter: 920, pan: 0.18 });
    }
    sequenceStep += 1;
  }

  function setMode(nextMode, accent = '#59f0b2') {
    mode = AUDIO_PROFILES[nextMode] ? nextMode : 'exploration';
    profile = AUDIO_PROFILES[mode];
    const accentValue = Number.parseInt(String(accent).replace('#', ''), 16) || 0;
    accentDetune = ((accentValue + profile.seed * 13) % 17) - 8;
    sequenceStep = profile.seed % profile.pattern.length;
    if (motionOscillator) motionOscillator.type = profile.motionWave;
    if (motionSubOscillator) motionSubOscillator.type = mode === 'flight' ? 'sine' : 'square';
    if (context) nextMusicAt = context.currentTime + 0.05;
  }

  function setMuted(value) {
    muted = Boolean(value);
    lastMasterLevel = -1;
    if (context) setMaster(muted ? 0 : 0.52, true);
  }

  function setMotion(kind, amount = 0, accent = 0) {
    motionKind = kind || profile.motion;
    motionAmount = Math.max(0, Math.min(1, amount));
    motionAccent = Math.max(0, Math.min(1, accent));
    lastMotionAt = performance.now();
  }

  function silenceMotion() {
    motionAmount = 0;
    motionAccent = 0;
    lastMotionAt = 0;
  }

  function startRound() {
    cooldowns.clear();
    silenceMotion();
    sequenceStep = profile.seed % profile.pattern.length;
    nextFootstepAt = 0;
    if (context) nextMusicAt = context.currentTime + 0.04;
  }

  function tick(phase, hidden = false) {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    const quietLevel = hidden ? 0 : phase === 'paused' ? 0.075 : 1;
    setMaster(muted ? 0 : 0.52 * quietLevel);
    const playing = phase === 'playing' && !hidden;
    if (playing && !muted) {
      const stepDuration = (60 / profile.bpm) * 0.5;
      if (nextMusicAt < now - stepDuration) nextMusicAt = now + 0.025;
      while (nextMusicAt < now + 0.1) {
        scheduleMusicStep(nextMusicAt);
        nextMusicAt += stepDuration;
      }
    } else if (!playing) {
      nextMusicAt = now + 0.08;
    }

    const stale = performance.now() - lastMotionAt > 120;
    const amount = playing && !stale ? motionAmount : 0;
    const continuous = motionKind === 'engine' || motionKind === 'flight';
    const base = profile.motionBase;
    const frequency = base + amount * profile.motionRange + motionAccent * (mode === 'flight' ? 58 : 24);
    if (motionOscillator) {
      motionOscillator.frequency.setTargetAtTime(Math.max(24, frequency), now, 0.035);
      motionSubOscillator.frequency.setTargetAtTime(Math.max(20, frequency * (mode === 'flight' ? 0.5 : 0.48)), now, 0.045);
      motionFilter.frequency.setTargetAtTime(280 + amount * profile.filter * 0.58 + motionAccent * 720, now, 0.055);
      safeParam(motionToneGain.gain, continuous ? 0.012 + amount * 0.085 : 0.0001, now, 0.045);
      motionNoiseFilter.frequency.setTargetAtTime(mode === 'flight' ? 980 + amount * 1600 : 240 + amount * 620, now, 0.06);
      safeParam(motionNoiseGain.gain, continuous ? amount * (mode === 'flight' ? 0.036 : 0.052) : 0.0001, now, 0.055);
    }
    if (motionKind === 'walk' && amount > 0.2 && playing && !muted && now >= nextFootstepAt) {
      play('step', { intensity: 0.45 + amount * 0.55, cooldown: 0.08 });
      nextFootstepAt = now + 0.48 - amount * 0.2;
    }
  }

  return {
    unlock,
    setMode,
    setMuted,
    play,
    motion: setMotion,
    silenceMotion,
    startRound,
    tick,
    get supported() { return Boolean(AudioContextClass); },
  };
}

const soundscape = createSoundscape();

let renderer;
let camera;
let scene;
let worldRoot;
let clockParticles;
let accentColor = new THREE.Color('#59f0b2');

const loader = new GLTFLoader();
const assetCache = new Map();

function escapeCssColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#59f0b2';
}

function setTheme(config) {
  const accent = escapeCssColor(config.accent);
  accentColor = new THREE.Color(accent);
  const rgb = {
    r: Number.parseInt(accent.slice(1, 3), 16),
    g: Number.parseInt(accent.slice(3, 5), 16),
    b: Number.parseInt(accent.slice(5, 7), 16),
  };
  document.documentElement.style.setProperty('--accent', accent);
  document.documentElement.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  ui.title.textContent = config.title;
  ui.tagline.textContent = config.tagline;
  document.title = `${config.title} — JoyCircuit`;
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D game canvas');
  ui.host.append(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#07101e');
  scene.fog = new THREE.FogExp2('#07101e', 0.018);
  camera = new THREE.PerspectiveCamera(56, 16 / 9, 0.1, 420);
  camera.position.set(0, 10, 17);
  camera.lookAt(0, 0, 0);

  worldRoot = new THREE.Group();
  worldRoot.name = 'game-world';
  scene.add(worldRoot);

  const hemisphere = new THREE.HemisphereLight('#bcd9ff', '#101829', 1.7);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight('#ffffff', 2.35);
  key.position.set(12, 22, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -35;
  key.shadow.camera.right = 35;
  key.shadow.camera.top = 35;
  key.shadow.camera.bottom = -35;
  scene.add(key);

  const rim = new THREE.PointLight(accentColor, 55, 70, 2);
  rim.position.set(-14, 10, -12);
  rim.name = 'accent-rim';
  scene.add(rim);

  createAmbientParticles();
  resize();
  new ResizeObserver(resize).observe(ui.host);
}

function createAmbientParticles() {
  const count = 460;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color('#6b79d8');
  for (let index = 0; index < count; index += 1) {
    const radius = 45 + Math.random() * 110;
    const theta = Math.random() * Math.PI * 2;
    const y = -8 + Math.random() * 80;
    positions[index * 3] = Math.cos(theta) * radius;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = Math.sin(theta) * radius;
    const color = index % 4 === 0 ? accentColor : base;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.42, vertexColors: true, transparent: true, opacity: 0.66, sizeAttenuation: true });
  clockParticles = new THREE.Points(geometry, material);
  clockParticles.name = 'ambient-particles';
  scene.add(clockParticles);
}

function resize() {
  if (!renderer || !camera) return;
  const bounds = ui.host.getBoundingClientRect();
  const width = Math.max(320, bounds.width);
  const height = Math.max(260, bounds.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function makeFallbackModel(path) {
  const group = new THREE.Group();
  const geometry = path.includes('car') || path.includes('craft')
    ? new THREE.BoxGeometry(2.4, 0.8, 4)
    : path.includes('tree')
      ? new THREE.ConeGeometry(1.4, 4, 8)
      : new THREE.DodecahedronGeometry(1.2, 0);
  const material = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.52, metalness: 0.14 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  group.userData.fallback = true;
  return group;
}

async function loadTemplate(path) {
  if (!assetCache.has(path)) {
    const promise = loader.loadAsync(path).then((gltf) => {
      gltf.scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      return gltf.scene;
    }).catch((error) => {
      state.assetFailures += 1;
      console.warn(`JoyCircuit model fallback for ${path}`, error);
      return makeFallbackModel(path);
    });
    assetCache.set(path, promise);
  }
  return assetCache.get(path);
}

async function model(path, options = {}) {
  ui.loadingDetail.textContent = `Loading ${path.split('/').at(-1)?.replace('.glb', '') ?? 'model'}…`;
  const template = await loadTemplate(path);
  const root = template.clone(true);
  const targetSize = options.size ?? 2.4;
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z, 0.001);
  root.scale.multiplyScalar(targetSize / largest);
  const normalizedBounds = new THREE.Box3().setFromObject(root);
  const center = normalizedBounds.getCenter(new THREE.Vector3());
  const normalizedSize = normalizedBounds.getSize(new THREE.Vector3());
  root.position.sub(center);
  if (options.ground !== false) root.position.y += normalizedSize.y / 2;
  if (options.position) root.position.add(options.position);
  if (typeof options.rotationY === 'number') root.rotation.y = options.rotationY;
  if (options.parent !== false) worldRoot.add(root);
  return root;
}

function material(color = state.config?.accent ?? '#59f0b2', options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.08,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? '#000000',
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function box(size, color, position = new THREE.Vector3(), options = {}) {
  const dimensions = Array.isArray(size) ? size : [size, size, size];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material(color, options));
  mesh.position.copy(position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  worldRoot.add(mesh);
  return mesh;
}

function sphere(radius, color, position = new THREE.Vector3(), options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material(color, options));
  mesh.position.copy(position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  worldRoot.add(mesh);
  return mesh;
}

function cylinder(radius, height, color, position = new THREE.Vector3(), options = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), material(color, options));
  mesh.position.copy(position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  worldRoot.add(mesh);
  return mesh;
}

function torus(radius, tube, color, position = new THREE.Vector3(), rotation = new THREE.Euler()) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 40),
    material(color, { roughness: 0.3, metalness: 0.24, emissive: color, emissiveIntensity: 0.25 }),
  );
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  mesh.castShadow = true;
  worldRoot.add(mesh);
  return mesh;
}

function ground(size = 80, color = '#17283b') {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material(color, { roughness: 0.92 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  worldRoot.add(mesh);
  return mesh;
}

function grid(size = 80, divisions = 32, color = state.config?.accent ?? '#59f0b2') {
  const helper = new THREE.GridHelper(size, divisions, color, '#253754');
  helper.material.transparent = true;
  helper.material.opacity = 0.32;
  helper.position.y = 0.015;
  worldRoot.add(helper);
  return helper;
}

function clearWorld() {
  while (worldRoot.children.length) {
    const child = worldRoot.children.pop();
    child.traverse?.((node) => {
      if (node.userData?.sharedAsset) return;
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((entry) => entry.dispose?.());
      else node.material?.dispose?.();
    });
  }
}

function setScore(value) {
  state.score = Math.max(0, Math.round(value));
  ui.score.textContent = String(state.score);
}

function addScore(value) {
  setScore(state.score + value);
  if (state.phase === 'playing') {
    soundscape.play(value > 0 ? 'score' : 'damage', {
      intensity: Math.min(1, Math.max(0.35, Math.abs(value) / 150)),
    });
  }
}

function setObjective(value) {
  state.objective = String(value);
  ui.objective.textContent = state.objective;
}

function setTimeLimit(seconds) {
  state.timeLimit = Math.max(0, seconds);
  state.timeLeft = state.timeLimit;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1500);
}

function setReticle(visible) {
  ui.reticle.classList.toggle('visible', Boolean(visible));
}

function finish(won, message = '') {
  if (state.phase !== 'playing') return;
  state.phase = 'ended';
  soundscape.silenceMotion();
  soundscape.play(won ? 'success' : 'failure', { cooldown: 0 });
  ui.modalIcon.textContent = won ? '✦' : '↻';
  ui.modalTitle.textContent = won ? 'World cleared!' : 'Run complete';
  ui.modalCopy.textContent = message || (won ? 'Objective complete. Your route through this world is now on the board.' : 'The world reset the challenge. Take another run when you are ready.');
  ui.finalScore.textContent = String(state.score);
  ui.finalResult.textContent = won ? 'Cleared' : 'Try again';
  ui.result.classList.remove('hidden');
  ui.primary.textContent = 'Play again';
  ui.modal.classList.remove('hidden');
}

function showReady() {
  state.phase = 'ready';
  ui.modalIcon.textContent = '◆';
  ui.modalTitle.textContent = state.config.title;
  ui.modalCopy.textContent = `${state.config.tagline} ${state.config.instructions}`;
  ui.result.classList.add('hidden');
  ui.primary.textContent = 'Start game';
  ui.controlHint.textContent = state.world?.controlHint ?? state.config.instructions;
  ui.modal.classList.remove('hidden');
  window.parent.postMessage({ type: 'joycircuit:ready' }, '*');
}

function startGame() {
  if (!state.world) return;
  soundscape.unlock();
  soundscape.startRound();
  setScore(0);
  state.phase = 'playing';
  state.last = performance.now();
  ui.result.classList.add('hidden');
  ui.modal.classList.add('hidden');
  state.world.reset();
  soundscape.play('start', { cooldown: 0 });
  renderer.domElement.focus({ preventScroll: true });
}

function togglePause(force) {
  if (!['playing', 'paused'].includes(state.phase)) return;
  const pause = typeof force === 'boolean' ? force : state.phase === 'playing';
  if (pause) {
    soundscape.play('pause');
    soundscape.silenceMotion();
    state.phase = 'paused';
    ui.modalIcon.textContent = 'Ⅱ';
    ui.modalTitle.textContent = 'World paused';
    ui.modalCopy.textContent = 'Everything is holding position until you return.';
    ui.result.classList.add('hidden');
    ui.primary.textContent = 'Resume';
    ui.modal.classList.remove('hidden');
  } else {
    state.phase = 'playing';
    state.last = performance.now();
    ui.modal.classList.add('hidden');
    soundscape.play('resume');
  }
}

function updateMute(value, { notifyParent = false, userGesture = false } = {}) {
  const changed = state.muted !== Boolean(value);
  if (userGesture) soundscape.unlock();
  state.muted = Boolean(value);
  soundscape.setMuted(state.muted);
  ui.soundWave.style.display = state.muted ? 'none' : '';
  ui.mute.setAttribute('aria-label', state.muted ? 'Sound muted' : 'Sound on');
  ui.mute.style.color = state.muted ? 'var(--accent)' : '';
  if (userGesture && !state.muted) soundscape.play('unmute', { cooldown: 0 });
  if (notifyParent && changed) {
    window.parent.postMessage({ type: 'joycircuit:mute-change', muted: state.muted }, '*');
  }
}

function keyActive(...codes) {
  return codes.some((code) => input.keys.has(code));
}

function keyTapped(...codes) {
  return codes.some((code) => input.just.has(code));
}

function axes() {
  return {
    x: Number(keyActive('ArrowRight', 'KeyD')) - Number(keyActive('ArrowLeft', 'KeyA')),
    y: Number(keyActive('ArrowUp', 'KeyW')) - Number(keyActive('ArrowDown', 'KeyS')),
  };
}

function createApi() {
  const sound = Object.freeze({
    play(name, options) { return soundscape.play(name, options); },
    motion(kind, amount, accent = 0) { soundscape.motion(kind, amount, accent); },
    silence() { soundscape.silenceMotion(); },
  });
  return {
    THREE,
    scene: worldRoot,
    camera,
    renderer,
    input,
    get config() { return state.config; },
    get score() { return state.score; },
    get timeLeft() { return state.timeLeft; },
    get accent() { return state.config.accent; },
    model,
    box,
    sphere,
    cylinder,
    torus,
    ground,
    grid,
    material,
    axes,
    keyActive,
    keyTapped,
    setScore,
    addScore,
    setObjective,
    setTimeLimit,
    finish,
    toast,
    setReticle,
    sound,
    clamp: THREE.MathUtils.clamp,
    lerp: THREE.MathUtils.lerp,
    distance2D(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); },
  };
}

async function loadSelectedGame() {
  try {
    ui.loading.classList.remove('hidden');
    ui.loadingDetail.textContent = 'Reading the JoyCircuit 3D manifest…';
    const response = await fetch('./manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Manifest request failed (${response.status})`);
    const manifest = await response.json();
    const requested = new URLSearchParams(location.search).get('game');
    const config = manifest.games.find((entry) => entry.slug === requested) ?? manifest.games[0];
    if (!config) throw new Error('No 3D games are configured.');
    state.config = config;
    setTheme(config);
    soundscape.setMode(config.mode, config.accent);
    clearWorld();
    ui.loadingDetail.textContent = 'Building the interactive world…';
    state.world = await createWorld(config.mode, createApi());
    ui.scoreLabel.textContent = state.world.scoreLabel ?? 'Score';
    ui.touchAction.textContent = state.world.actionLabel ?? 'A';
    ui.touchAction.hidden = state.world.hideAction === true;
    setReticle(state.world.usesReticle === true);
    if (state.assetFailures) toast(`${state.assetFailures} model fallback${state.assetFailures === 1 ? '' : 's'} active`);
    ui.loading.classList.add('hidden');
    showReady();
  } catch (error) {
    console.error('JoyCircuit 3D failed to initialize', error);
    ui.loadingDetail.textContent = `Could not build this world: ${error instanceof Error ? error.message : 'unknown error'}`;
    window.parent.postMessage({ type: 'joycircuit:error', message: 'This 3D world could not finish loading.' }, '*');
  }
}

function pointerPosition(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  input.pointerPixels.set(event.clientX - bounds.left, event.clientY - bounds.top);
  input.pointer.set(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  if (state.world?.usesReticle) {
    ui.reticle.style.left = `${event.clientX - bounds.left}px`;
    ui.reticle.style.top = `${event.clientY - bounds.top}px`;
  }
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(event.code)) event.preventDefault();
    if (!event.repeat) input.just.add(event.code);
    input.keys.add(event.code);
    if (event.code === 'KeyP' || event.code === 'Escape') togglePause();
    if (event.code === 'KeyR') startGame();
    if (event.code === 'KeyM') updateMute(!state.muted, { notifyParent: true, userGesture: true });
    if ((event.code === 'Space' || event.code === 'Enter') && ['ready', 'ended'].includes(state.phase)) startGame();
    else if ((event.code === 'Space' || event.code === 'Enter') && state.phase === 'playing') {
      soundscape.play('action');
      state.world?.action?.();
    }
  }, { passive: false });

  window.addEventListener('keyup', (event) => input.keys.delete(event.code));

  renderer.domElement.addEventListener('pointermove', pointerPosition);
  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerPosition(event);
    input.pointerDown = true;
    renderer.domElement.setPointerCapture?.(event.pointerId);
    if (state.phase === 'playing') {
      soundscape.play('action');
      state.world?.pointerDown?.(input.pointer, event);
    }
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    input.pointerDown = false;
    renderer.domElement.releasePointerCapture?.(event.pointerId);
  });

  document.querySelectorAll('[data-key]').forEach((button) => {
    const code = button.dataset.key;
    const press = (event) => {
      event.preventDefault();
      input.keys.add(code);
      input.just.add(code);
    };
    const release = (event) => {
      event.preventDefault();
      input.keys.delete(code);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  ui.touchAction.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    input.keys.add('Space');
    input.just.add('Space');
    if (state.phase === 'playing') {
      soundscape.play('action');
      state.world?.action?.();
    }
  });
  const releaseAction = () => input.keys.delete('Space');
  ui.touchAction.addEventListener('pointerup', releaseAction);
  ui.touchAction.addEventListener('pointercancel', releaseAction);

  ui.primary.addEventListener('click', () => {
    if (state.phase === 'paused') togglePause(false);
    else startGame();
  });
  ui.pause.addEventListener('click', () => togglePause());
  ui.restart.addEventListener('click', startGame);
  ui.mute.addEventListener('click', () => updateMute(!state.muted, { notifyParent: true, userGesture: true }));

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'joycircuit:mute') updateMute(event.data.muted);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.phase === 'playing') togglePause(true);
  });
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (timestamp - state.last) / 1000));
  state.last = timestamp;

  if (clockParticles) {
    clockParticles.rotation.y += dt * 0.018;
    clockParticles.rotation.x = Math.sin(timestamp * 0.00008) * 0.05;
  }

  soundscape.tick(state.phase, document.hidden);

  if (state.phase === 'playing' && state.world) {
    if (state.timeLimit > 0) {
      state.timeLeft = Math.max(0, state.timeLeft - dt);
      if (state.timeLeft === 0) state.world.timeUp?.() ?? finish(false, 'Time expired before the objective was complete.');
    }
    state.world.update(dt, timestamp / 1000);
    const movement = axes();
    soundscape.motion(
      AUDIO_PROFILES[state.config.mode]?.motion,
      Math.min(1, Math.hypot(movement.x, movement.y)),
      keyActive('Space') ? 0.8 : 0,
    );
  } else {
    state.world?.idle?.(dt, timestamp / 1000);
  }

  ui.score.textContent = String(state.score);
  ui.objective.textContent = state.world?.status?.() ?? state.objective;
  ui.time.textContent = formatTime(state.timeLeft);
  input.just.clear();
  renderer.render(scene, camera);
}

try {
  initRenderer();
  bindInput();
  updateMute(true);
  requestAnimationFrame(frame);
  await loadSelectedGame();
} catch (error) {
  console.error('WebGL initialization failed', error);
  ui.loadingDetail.textContent = 'WebGL is unavailable in this browser. Try enabling hardware acceleration.';
  window.parent.postMessage({ type: 'joycircuit:error', message: 'WebGL could not start this 3D world.' }, '*');
}
