import { createMode } from './modes.js';
import { createArcadeAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
const stage = $('gameStage');

const ui = {
  title: $('gameTitle'),
  tagline: $('gameTagline'),
  mark: $('gameMark'),
  score: $('scoreValue'),
  best: $('bestValue'),
  goal: $('goalValue'),
  objective: $('objectiveText'),
  modal: $('gameModal'),
  modalTitle: $('modalTitle'),
  modalCopy: $('modalCopy'),
  primary: $('primaryButton'),
  result: $('resultGrid'),
  finalScore: $('finalScore'),
  finalBest: $('finalBest'),
  pause: $('pauseButton'),
  restart: $('restartButton'),
  mute: $('muteButton'),
  soundWave: document.querySelector('.sound-wave'),
  controls: $('touchControls'),
  directions: $('directionControls'),
  action: $('actionControl'),
  actionLabel: $('actionLabel'),
  error: $('loadingError')
};

const app = {
  config: null,
  allGames: [],
  state: null,
  phase: 'loading',
  paused: false,
  muted: true,
  score: 0,
  best: 0,
  variant: 0,
  last: 0,
  elapsed: 0,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
};

const view = {
  cssW: 900,
  cssH: 600,
  w: 960,
  h: 600,
  dpr: 1,
  scale: 1,
  ox: 0,
  oy: 0,
  portrait: false
};

const input = {
  keys: new Set(),
  just: new Set(),
  controls: Object.create(null),
  pointer: { x: 0, y: 0, down: false, inside: false, id: -1 }
};

const fx = [];
const backdropBits = [];
const audio = createArcadeAudio();
let randomSeed = 1;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const distance = (a, b, c, d) => Math.hypot(c - a, d - b);
const circleHit = (a, b, extra = 0) => distance(a.x, a.y, b.x, b.y) < (a.r || 0) + (b.r || 0) + extra;
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const padScore = (value) => String(Math.max(0, Math.floor(value))).padStart(5, '0');

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom() {
  randomSeed |= 0;
  randomSeed = (randomSeed + 0x6d2b79f5) | 0;
  let value = Math.imul(randomSeed ^ (randomSeed >>> 15), 1 | randomSeed);
  value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function rand(min = 0, max = 1) {
  return min + seededRandom() * (max - min);
}

function hexToRgb(hex) {
  const normalized = String(hex || '#52f0b4').replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((v) => v + v).join('') : normalized;
  const number = Number.parseInt(full, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixColor(first, second, amount = 0.5) {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  const channel = (key) => Math.round(lerp(a[key], b[key], amount)).toString(16).padStart(2, '0');
  return `#${channel('r')}${channel('g')}${channel('b')}`;
}

function pressed(control) {
  const map = {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    action: ['Space', 'Enter']
  };
  return Boolean(input.controls[control]) || (map[control] || []).some((key) => input.keys.has(key));
}

function tapped(control) {
  const map = {
    left: ['ArrowLeft', 'KeyA', 'control:left'],
    right: ['ArrowRight', 'KeyD', 'control:right'],
    up: ['ArrowUp', 'KeyW', 'control:up'],
    down: ['ArrowDown', 'KeyS', 'control:down'],
    action: ['Space', 'Enter', 'control:action'],
    pointer: ['pointer']
  };
  return (map[control] || []).some((key) => input.just.has(key));
}

function burst(x, y, color = app.config?.accent || '#52f0b4', count = 12, power = 140) {
  const actualCount = app.reducedMotion ? Math.ceil(count * 0.45) : count;
  for (let i = 0; i < actualCount; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(power * 0.25, power);
    fx.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: rand(2, 6),
      color,
      life: rand(0.35, 0.75),
      maxLife: 0.75
    });
  }
}

function updateFx(dt) {
  for (const particle of fx) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.12, dt);
    particle.vy = particle.vy * Math.pow(0.2, dt) + 70 * dt;
  }
  for (let i = fx.length - 1; i >= 0; i -= 1) {
    if (fx[i].life <= 0) fx.splice(i, 1);
  }
}

function drawFx() {
  ctx.save();
  for (const particle of fx) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackdrop(style = 'grid') {
  const accent = app.config?.accent || '#52f0b4';
  const gradient = ctx.createLinearGradient(0, 0, view.w, view.h);
  gradient.addColorStop(0, '#111a3c');
  gradient.addColorStop(0.52, '#0b1830');
  gradient.addColorStop(1, mixColor('#061721', accent, 0.1));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.w, view.h);

  const glow = ctx.createRadialGradient(view.w * 0.7, view.h * 0.22, 0, view.w * 0.7, view.h * 0.22, Math.max(view.w, view.h) * 0.55);
  glow.addColorStop(0, rgba(accent, 0.15));
  glow.addColorStop(0.52, 'rgba(139,114,255,0.055)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, view.w, view.h);

  for (const bit of backdropBits) {
    const x = (bit.x * view.w + app.elapsed * bit.speed) % (view.w + 30) - 15;
    const y = bit.y * view.h;
    ctx.globalAlpha = bit.alpha;
    ctx.fillStyle = bit.tint ? accent : '#d8e4ff';
    ctx.fillRect(x, y, bit.size, bit.size);
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.075);
  ctx.lineWidth = 1;
  if (style === 'orbit') {
    const cx = view.w / 2;
    const cy = view.h / 2;
    for (let radius = 80; radius < Math.min(view.w, view.h) * 0.47; radius += 64) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (style === 'lanes') {
    for (let x = 0; x <= view.w; x += Math.max(44, view.w / 12)) {
      ctx.beginPath();
      ctx.moveTo(view.w / 2, view.h * 0.1);
      ctx.lineTo(x, view.h);
      ctx.stroke();
    }
    for (let y = view.h * 0.15; y < view.h; y += 52) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
      ctx.stroke();
    }
  } else {
    const size = view.portrait ? 54 : 62;
    const drift = (app.elapsed * 8) % size;
    for (let x = -size; x < view.w + size; x += size) {
      ctx.beginPath();
      ctx.moveTo(x + drift, 0);
      ctx.lineTo(x + drift, view.h);
      ctx.stroke();
    }
    for (let y = -size; y < view.h + size; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y + drift);
      ctx.lineTo(view.w, y + drift);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function setScore(value) {
  app.score = Math.max(0, Math.floor(value));
}

function addScore(value) {
  setScore(app.score + value);
}

function setGoal(text) {
  ui.objective.textContent = text;
}

function loadBest() {
  window.parent.postMessage({ type: 'joycircuit:score:get', slug: app.config.slug }, '*');
  try {
    return Number(localStorage.getItem(`joycircuit:arcade:${app.config.slug}:best`)) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  window.parent.postMessage({ type: 'joycircuit:score:set', slug: app.config.slug, value: app.best }, '*');
  try {
    localStorage.setItem(`joycircuit:arcade:${app.config.slug}:best`, String(app.best));
  } catch {
    // Private browsing can disable storage; gameplay does not depend on it.
  }
}

function showReadyModal() {
  app.phase = 'ready';
  app.paused = false;
  ui.modalTitle.textContent = app.config.title;
  ui.modalCopy.textContent = `${app.config.tagline} ${app.config.instructions}`;
  ui.primary.textContent = 'Start game';
  ui.result.hidden = true;
  ui.modal.classList.remove('is-hidden');
}

function finish(won, message = '') {
  if (app.phase !== 'playing') return;
  app.phase = won ? 'won' : 'over';
  app.paused = false;
  audio.finish(won);
  app.best = Math.max(app.best, app.score);
  saveBest();
  ui.modalTitle.textContent = won ? 'Circuit cleared!' : 'Run complete';
  ui.modalCopy.textContent = message || (won ? 'Objective complete. The next circuit is ready when you are.' : 'The circuit closed this time. Reset and take another line.');
  ui.primary.textContent = won ? 'Play again' : 'Try again';
  ui.finalScore.textContent = app.score;
  ui.finalBest.textContent = app.best;
  ui.result.hidden = false;
  ui.modal.classList.remove('is-hidden');
  updateHud();
}

function begin() {
  if (!app.state) return;
  randomSeed = (hashText(app.config.slug) ^ Date.now()) >>> 0;
  app.score = 0;
  app.elapsed = 0;
  app.phase = 'playing';
  app.paused = false;
  fx.length = 0;
  input.just.clear();
  app.state.reset();
  audio.start();
  ui.result.hidden = true;
  ui.modal.classList.add('is-hidden');
  updateHud();
}

function togglePause(force) {
  if (app.phase !== 'playing') return;
  const next = typeof force === 'boolean' ? force : !app.paused;
  if (next === app.paused) return;
  app.paused = next;
  audio.setPaused(next);
  if (next) {
    ui.modalTitle.textContent = 'Circuit paused';
    ui.modalCopy.textContent = 'Your run is held exactly where you left it.';
    ui.primary.textContent = 'Resume';
    ui.result.hidden = true;
    ui.modal.classList.remove('is-hidden');
  } else {
    ui.modal.classList.add('is-hidden');
    app.last = performance.now();
  }
  updatePauseIcon();
}

function setMuted(value, source = 'parent') {
  const next = Boolean(value);
  const changed = next !== app.muted;
  app.muted = next;
  audio.setMuted(app.muted);
  ui.soundWave.style.display = app.muted ? 'none' : '';
  ui.mute.style.color = app.muted ? 'var(--coral)' : '';
  ui.mute.setAttribute('aria-label', app.muted ? 'Unmute game' : 'Mute game');
  ui.mute.title = app.muted ? 'Unmute (M)' : 'Mute (M)';
  if (source === 'local' && changed) {
    window.parent.postMessage({ type: 'joycircuit:mute-change', muted: app.muted }, '*');
    if (!app.muted) audio.play('toggle', { force: true });
  }
}

function updatePauseIcon() {
  ui.pause.innerHTML = app.paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
  ui.pause.setAttribute('aria-label', app.paused ? 'Resume game' : 'Pause game');
}

function updateHud() {
  ui.score.textContent = padScore(app.score);
  ui.best.textContent = padScore(app.best);
  const status = app.paused ? 'Paused' : app.state?.status?.() || (app.phase === 'ready' ? 'Ready' : 'Playing');
  ui.goal.textContent = status;
}

function configureControls() {
  const profiles = {
    dodger: { directions: ['left', 'right', 'up', 'down'], action: null },
    'lane-racer': { directions: ['left', 'right'], action: null },
    snake: { directions: ['left', 'right', 'up', 'down'], action: null },
    breakout: { directions: ['left', 'right'], action: 'LAUNCH' },
    shooter: { directions: ['left', 'right'], action: 'FIRE' },
    catcher: { directions: ['left', 'right'], action: null },
    memory: { directions: ['left', 'right', 'up', 'down'], action: 'FLIP' },
    pong: { directions: ['up', 'down'], action: null },
    maze: { directions: ['left', 'right', 'up', 'down'], action: null },
    runner: { directions: [], action: 'JUMP' },
    defense: { directions: ['left', 'right'], action: 'FIRE' },
    orbit: { directions: ['left', 'right', 'up', 'down'], action: 'SHIFT' },
    stacker: { directions: [], action: 'DROP' }
  };
  const profile = profiles[app.config.mode] || profiles.dodger;
  ui.directions.querySelectorAll('button').forEach((button) => {
    button.hidden = !profile.directions.includes(button.dataset.control);
  });
  ui.directions.hidden = profile.directions.length === 0;
  ui.action.hidden = !profile.action;
  ui.actionLabel.textContent = profile.action || 'GO';
}

function createApi() {
  return {
    get w() { return view.w; },
    get h() { return view.h; },
    get ctx() { return ctx; },
    get config() { return app.config; },
    get variant() { return app.variant; },
    get phase() { return app.phase; },
    get score() { return app.score; },
    input,
    pressed,
    tapped,
    clamp,
    lerp,
    distance,
    circleHit,
    rectHit,
    rand,
    rgba,
    mixColor,
    setScore,
    addScore,
    setGoal,
    finish,
    sound: audio.play,
    burst,
    drawFx,
    drawBackdrop
  };
}

function resize() {
  const bounds = stage.getBoundingClientRect();
  const oldPortrait = view.portrait;
  view.cssW = Math.max(280, bounds.width);
  view.cssH = Math.max(320, bounds.height);
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  view.portrait = view.cssW / view.cssH < 0.82;
  view.w = view.portrait ? 600 : 960;
  view.h = view.portrait ? 900 : 600;
  view.scale = Math.min(view.cssW / view.w, view.cssH / view.h);
  view.ox = (view.cssW - view.w * view.scale) / 2;
  view.oy = (view.cssH - view.h * view.scale) / 2;
  canvas.width = Math.round(view.cssW * view.dpr);
  canvas.height = Math.round(view.cssH * view.dpr);
  canvas.style.width = `${view.cssW}px`;
  canvas.style.height = `${view.cssH}px`;
  if (app.state && oldPortrait !== view.portrait) {
    app.state.reset();
    app.score = 0;
    updateHud();
    if (app.phase === 'playing') {
      app.paused = true;
      audio.setPaused(true, false);
      ui.modalTitle.textContent = 'Playfield resized';
      ui.modalCopy.textContent = 'The game was fitted to the new screen shape. Resume when you are ready.';
      ui.primary.textContent = 'Resume';
      ui.result.hidden = true;
      ui.modal.classList.remove('is-hidden');
      updatePauseIcon();
    }
  }
}

function pointFromEvent(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - bounds.left - view.ox) / view.scale, 0, view.w),
    y: clamp((event.clientY - bounds.top - view.oy) / view.scale, 0, view.h)
  };
}

function prepareBackdrop() {
  backdropBits.length = 0;
  randomSeed = hashText(app.config.slug);
  for (let i = 0; i < 56; i += 1) {
    backdropBits.push({
      x: rand(),
      y: rand(),
      size: rand(0.6, 2.1),
      alpha: rand(0.12, 0.42),
      speed: rand(0.2, 1.7),
      tint: rand() > 0.76
    });
  }
}

function applyConfig(config, allGames) {
  app.config = config;
  app.allGames = allGames;
  app.variant = allGames.filter((game) => game.mode === config.mode).findIndex((game) => game.slug === config.slug);
  if (app.variant < 0) app.variant = hashText(config.slug) % 4;
  audio.configure(config.mode, config.slug);
  audio.setMuted(app.muted);
  app.best = loadBest();
  const color = hexToRgb(config.accent);
  document.documentElement.style.setProperty('--accent', config.accent);
  document.documentElement.style.setProperty('--accent-rgb', `${color.r}, ${color.g}, ${color.b}`);
  document.title = `${config.title} — JoyCircuit`;
  ui.title.textContent = config.title;
  ui.tagline.textContent = config.tagline;
  ui.mark.textContent = config.title.replace(/[^a-z0-9]/gi, '').slice(0, 1).toUpperCase() || 'J';
  canvas.setAttribute('aria-label', `${config.title}. ${config.instructions}`);
  configureControls();
  prepareBackdrop();
  app.state = createMode(config.mode, createApi());
  app.state.reset();
  setGoal(config.instructions);
  showReadyModal();
  updateHud();
}

function renderFrame(timestamp) {
  const dt = Math.min(0.034, Math.max(0, (timestamp - app.last) / 1000 || 0));
  app.last = timestamp;
  if (app.phase === 'playing' && !app.paused) {
    app.elapsed += dt;
    app.state?.update(dt);
    updateFx(dt);
  }
  audio.update(dt);

  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = '#06101e';
  ctx.fillRect(0, 0, view.cssW, view.cssH);
  ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.ox * view.dpr, view.oy * view.dpr);
  app.state?.draw();
  drawFx();
  updateHud();
  input.just.clear();
  requestAnimationFrame(renderFrame);
}

function bindInput() {
  const prevented = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);
  window.addEventListener('keydown', (event) => {
    if (prevented.has(event.code)) event.preventDefault();
    if (event.repeat && (event.code === 'KeyM' || event.code === 'KeyP' || event.code === 'KeyR')) return;
    if (event.code === 'KeyP') {
      void audio.unlock();
      togglePause();
      return;
    }
    if (event.code === 'KeyR') {
      void audio.unlock();
      begin();
      return;
    }
    if (event.code === 'KeyM') {
      void audio.unlock();
      setMuted(!app.muted, 'local');
      return;
    }
    if ((app.phase === 'ready' || app.phase === 'over' || app.phase === 'won') && (event.code === 'Space' || event.code === 'Enter')) {
      void audio.unlock();
      begin();
      return;
    }
    if (app.paused && (event.code === 'Space' || event.code === 'Enter')) {
      void audio.unlock();
      togglePause(false);
      return;
    }
    if (!input.keys.has(event.code)) input.just.add(event.code);
    input.keys.add(event.code);
    app.state?.keyDown?.(event.code);
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
    app.state?.keyUp?.(event.code);
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (app.phase !== 'playing' || app.paused) return;
    void audio.unlock();
    event.preventDefault();
    const point = pointFromEvent(event);
    input.pointer = { ...input.pointer, ...point, down: true, inside: true, id: event.pointerId };
    input.just.add('pointer');
    canvas.setPointerCapture?.(event.pointerId);
    app.state?.pointerDown?.(point.x, point.y);
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = pointFromEvent(event);
    input.pointer.x = point.x;
    input.pointer.y = point.y;
    input.pointer.inside = true;
    app.state?.pointerMove?.(point.x, point.y);
  });

  const releasePointer = (event) => {
    if (event && input.pointer.id !== -1 && event.pointerId !== input.pointer.id) return;
    input.pointer.down = false;
    input.pointer.id = -1;
    app.state?.pointerUp?.();
  };
  canvas.addEventListener('pointerup', releasePointer);
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('pointerleave', () => { input.pointer.inside = false; });

  ui.controls.querySelectorAll('[data-control]').forEach((button) => {
    const control = button.dataset.control;
    const press = (event) => {
      if (app.phase !== 'playing' || app.paused) return;
      void audio.unlock();
      event.preventDefault();
      event.stopPropagation();
      input.controls[control] = true;
      input.just.add(`control:${control}`);
      button.classList.add('is-pressed');
      app.state?.controlDown?.(control);
    };
    const release = (event) => {
      event?.preventDefault();
      input.controls[control] = false;
      button.classList.remove('is-pressed');
      app.state?.controlUp?.(control);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  ui.primary.addEventListener('click', () => {
    void audio.unlock();
    if (app.paused) togglePause(false);
    else begin();
  });
  ui.pause.addEventListener('click', () => {
    void audio.unlock();
    togglePause();
  });
  ui.restart.addEventListener('click', () => {
    void audio.unlock();
    begin();
  });
  ui.mute.addEventListener('click', () => {
    void audio.unlock();
    setMuted(!app.muted, 'local');
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    Object.keys(input.controls).forEach((key) => { input.controls[key] = false; });
  });
  document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'joycircuit:mute') setMuted(data.muted, 'parent');
    if (data.type === 'joycircuit:restart') begin();
    if (data.type === 'joycircuit:pause') togglePause(Boolean(data.paused));
    if (data.type === 'joycircuit:score:value' && data.slug === app.config?.slug && Number.isFinite(data.value)) {
      app.best = Math.max(app.best, Math.max(0, Math.floor(data.value)));
      updateHud();
    }
  });
}

async function initialize() {
  bindInput();
  resize();
  new ResizeObserver(resize).observe(stage);
  try {
    const response = await fetch('./manifest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
    const manifest = await response.json();
    const allGames = [...(manifest.games || []), ...(manifest.legacyGames || [])];
    const requested = new URLSearchParams(location.search).get('game');
    const config = allGames.find((game) => game.slug === requested) || allGames[0];
    if (!config) throw new Error('Manifest contains no games');
    applyConfig(config, allGames);
    window.parent.postMessage({ type: 'joycircuit:ready' }, '*');
  } catch (error) {
    console.error(error);
    ui.error.hidden = false;
    ui.modal.classList.add('is-hidden');
    window.parent.postMessage({ type: 'joycircuit:error', message: 'This game could not finish loading.' }, '*');
  }
  app.last = performance.now();
  requestAnimationFrame(renderFrame);
}

initialize();
