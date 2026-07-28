import * as THREE from 'three';

const ASSETS = {
  carGreen: '/assets/3d/racing-kit/raceCarGreen.glb',
  carOrange: '/assets/3d/racing-kit/raceCarOrange.glb',
  barrier: '/assets/3d/racing-kit/barrierWhite.glb',
  checkers: '/assets/3d/racing-kit/flagCheckersSmall.glb',
  character: '/assets/3d/platformer-kit/character-oopi.glb',
  block: '/assets/3d/platformer-kit/block-grass.glb',
  coin: '/assets/3d/platformer-kit/coin-gold.glb',
  crate: '/assets/3d/platformer-kit/crate.glb',
  flag: '/assets/3d/platformer-kit/flag.glb',
  spikes: '/assets/3d/platformer-kit/trap-spikes.glb',
  tree: '/assets/3d/nature-kit/tree_default.glb',
  pine: '/assets/3d/nature-kit/tree_pineRoundA.glb',
  rock: '/assets/3d/nature-kit/rock_largeA.glb',
  mushroom: '/assets/3d/nature-kit/mushroom_red.glb',
  flower: '/assets/3d/nature-kit/flower_yellowA.glb',
  log: '/assets/3d/nature-kit/log.glb',
  bush: '/assets/3d/nature-kit/plant_bushDetailed.glb',
  racer: '/assets/3d/space-kit/craft_racer.glb',
  speeder: '/assets/3d/space-kit/craft_speederA.glb',
  meteor: '/assets/3d/space-kit/meteor_detailed.glb',
  alien: '/assets/3d/space-kit/alien.glb',
  spaceTurret: '/assets/3d/space-kit/turret_double.glb',
  towerBase: '/assets/3d/tower-defense-kit/tower-round-base.glb',
  towerTop: '/assets/3d/tower-defense-kit/tower-round-top-a.glb',
  ufo: '/assets/3d/tower-defense-kit/enemy-ufo-a.glb',
  tile: '/assets/3d/tower-defense-kit/tile.glb',
  crystal: '/assets/3d/tower-defense-kit/detail-crystal.glb',
};

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const E = (x = 0, y = 0, z = 0) => new THREE.Euler(x, y, z);

function followCamera(api, target, offset, dt, lookOffset = V3(0, 1, 0)) {
  const desired = target.clone().add(offset);
  api.camera.position.lerp(desired, 1 - Math.exp(-dt * 4.8));
  api.camera.lookAt(target.clone().add(lookOffset));
}

function cameraWithPointer(api, base, target, strength = 1.4) {
  api.camera.position.set(
    base.x + api.input.pointer.x * strength,
    base.y + api.input.pointer.y * strength * 0.55,
    base.z,
  );
  api.camera.lookAt(target);
}

function pulse(object, elapsed, phase = 0, amount = 0.08) {
  const scale = 1 + Math.sin(elapsed * 2.4 + phase) * amount;
  object.scale.setScalar(scale);
  object.rotation.y += 0.008;
}

function markTarget(root, payload) {
  root.traverse((node) => {
    node.userData.targetPayload = payload;
  });
}

function findTarget(object) {
  let current = object;
  while (current) {
    if (current.userData?.targetPayload) return current.userData.targetPayload;
    current = current.parent;
  }
  return null;
}

function distanceXZ(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function addSkyRings(api, count = 5) {
  const rings = [];
  for (let index = 0; index < count; index += 1) {
    const ring = api.torus(
      5 + index * 2.8,
      0.035,
      index % 2 ? '#8b7cff' : api.accent,
      V3(0, 10 + index * 1.6, -14 - index * 8),
      E(Math.PI / 2.7, 0, index * 0.5),
    );
    ring.material.transparent = true;
    ring.material.opacity = 0.2;
    rings.push(ring);
  }
  return rings;
}

function addArena(api, { size = 70, groundColor = '#14293a', divisions = 28 } = {}) {
  api.ground(size, groundColor);
  api.grid(size, divisions, api.accent);
  const rim = api.torus(size * 0.42, 0.07, api.accent, V3(0, 0.08, 0), E(Math.PI / 2, 0, 0));
  rim.material.opacity = 0.28;
  rim.material.transparent = true;
}

async function createRacing(api) {
  addArena(api, { size: 82, groundColor: '#152333', divisions: 32 });
  addSkyRings(api, 4);
  const car = await api.model(ASSETS.carGreen, { size: 4.2, position: V3(0, 0.05, 21), rotationY: Math.PI });
  const rival = await api.model(ASSETS.carOrange, { size: 3.8, position: V3(-8, 0.05, -2), rotationY: Math.PI / 2 });
  rival.userData.phase = 0;

  const route = [
    V3(0, 0.2, 12), V3(13, 0.2, 8), V3(18, 0.2, -5), V3(11, 0.2, -17),
    V3(-4, 0.2, -21), V3(-17, 0.2, -12), V3(-18, 0.2, 5), V3(-7, 0.2, 17),
  ];
  const gates = route.map((point) => api.torus(2.7, 0.22, api.accent, point, E(Math.PI / 2, 0, 0)));
  const barriers = [];
  const barrierPoints = [V3(7, 0, 2), V3(6, 0, -14), V3(-10, 0, -8), V3(-9, 0, 10)];
  for (const point of barrierPoints) barriers.push(await api.model(ASSETS.barrier, { size: 3.2, position: point }));
  await api.model(ASSETS.checkers, { size: 3.3, position: V3(2.5, 0, 18) });

  let speed = 0;
  let heading = Math.PI;
  let nextGate = 0;
  let boost = 0;

  function reset() {
    car.position.set(0, 0.05, 21);
    heading = Math.PI;
    speed = 0;
    boost = 0;
    nextGate = 0;
    gates.forEach((gate, index) => {
      gate.visible = true;
      gate.material.opacity = index === 0 ? 1 : 0.28;
      gate.material.transparent = true;
    });
    api.setScore(0);
    api.setTimeLimit(80);
    api.setObjective('Gate 1 of 8');
  }

  function action() {
    if (boost <= 0) {
      boost = 0.9;
      api.toast('Mint boost engaged');
    }
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    speed += axis.y * 19 * dt;
    speed *= Math.pow(0.985, dt * 60);
    speed = api.clamp(speed, -7, boost > 0 ? 24 : 17);
    boost = Math.max(0, boost - dt);
    if (boost > 0) speed += 16 * dt;
    const turnFactor = 0.55 + Math.min(1, Math.abs(speed) / 8);
    heading -= axis.x * 2.05 * turnFactor * dt * Math.sign(speed || 1);
    car.position.x += Math.sin(heading) * speed * dt;
    car.position.z += Math.cos(heading) * speed * dt;
    car.position.x = api.clamp(car.position.x, -27, 27);
    car.position.z = api.clamp(car.position.z, -27, 27);
    car.rotation.y = heading;
    car.rotation.z = -axis.x * 0.1;

    rival.position.x = Math.cos(elapsed * 0.34) * 15;
    rival.position.z = Math.sin(elapsed * 0.34) * 15;
    rival.rotation.y = -elapsed * 0.34 + Math.PI / 2;

    for (const barrier of barriers) {
      if (distanceXZ(car.position, barrier.position) < 2.4) {
        speed *= -0.25;
        car.position.x -= Math.sin(heading) * 1.2;
        car.position.z -= Math.cos(heading) * 1.2;
      }
    }

    const active = gates[nextGate];
    if (active && distanceXZ(car.position, active.position) < 3.4) {
      active.visible = false;
      nextGate += 1;
      api.addScore(150);
      if (nextGate >= gates.length) api.finish(true, 'Every checkpoint lit up. Prism Ridge is yours.');
      else {
        gates[nextGate].material.opacity = 1;
        api.setObjective(`Gate ${nextGate + 1} of ${gates.length}`);
      }
    }

    gates.forEach((gate, index) => {
      if (gate.visible) {
        gate.rotation.z += dt * (index === nextGate ? 1.8 : 0.45);
        gate.position.y = 0.35 + Math.sin(elapsed * 2 + index) * 0.12;
      }
    });

    const behind = V3(-Math.sin(heading) * 10, 6.2, -Math.cos(heading) * 10);
    behind.x += api.input.pointer.x * 0.9;
    followCamera(api, car.position, behind, dt, V3(0, 1, 0));
  }

  reset();
  return {
    reset, update, action,
    actionLabel: 'BOOST',
    controlHint: 'WASD / arrows drive · Space boosts · pass gates in order',
    status: () => `${Math.min(nextGate + 1, gates.length)}/${gates.length} gates`,
    timeUp: () => api.finish(false, 'The ridge closed before the final checkpoint.'),
  };
}

async function createExploration(api) {
  addArena(api, { size: 64, groundColor: '#17392f', divisions: 20 });
  const character = await api.model(ASSETS.character, { size: 2.5, position: V3(0, 0, 13) });
  const scenery = [
    [ASSETS.tree, -12, -8, 5], [ASSETS.pine, 11, -12, 5], [ASSETS.tree, 15, 8, 4.5],
    [ASSETS.pine, -16, 10, 4.8], [ASSETS.rock, -7, 4, 2.8], [ASSETS.log, 7, 9, 3.2],
    [ASSETS.bush, 2, -11, 2.3], [ASSETS.tree, -2, -18, 5.4], [ASSETS.rock, 16, -2, 2.4],
  ];
  for (const [path, x, z, size] of scenery) await api.model(path, { size, position: V3(x, 0, z), rotationY: Math.random() * Math.PI * 2 });

  const itemSpecs = [
    [ASSETS.flower, -10, 11], [ASSETS.mushroom, 10, 12], [ASSETS.flower, 15, -5],
    [ASSETS.mushroom, -15, -7], [ASSETS.flower, 4, -16], [ASSETS.mushroom, -3, 1], [ASSETS.flower, 11, 2],
  ];
  const items = [];
  for (const [path, x, z] of itemSpecs) {
    const root = await api.model(path, { size: 1.8, position: V3(x, 0.2, z) });
    items.push({ root, collected: false });
  }
  let collected = 0;
  let facing = 0;

  function reset() {
    character.position.set(0, 0, 13);
    collected = 0;
    items.forEach((item) => {
      item.collected = false;
      item.root.visible = true;
    });
    api.setScore(0);
    api.setTimeLimit(95);
    api.setObjective('Find 7 forest lights');
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    const length = Math.hypot(axis.x, axis.y) || 1;
    const dx = axis.x / length;
    const dz = -axis.y / length;
    if (axis.x || axis.y) {
      character.position.x += dx * 8 * dt;
      character.position.z += dz * 8 * dt;
      facing = Math.atan2(dx, dz);
      character.rotation.y = facing;
    }
    character.position.x = api.clamp(character.position.x, -23, 23);
    character.position.z = api.clamp(character.position.z, -23, 23);

    items.forEach((item, index) => {
      if (item.collected) return;
      item.root.rotation.y += dt * 1.2;
      item.root.position.y = 0.25 + Math.sin(elapsed * 2.5 + index) * 0.18;
      if (distanceXZ(character.position, item.root.position) < 1.8) {
        item.collected = true;
        item.root.visible = false;
        collected += 1;
        api.addScore(125);
        api.toast(`Forest light ${collected} found`);
        api.setObjective(`${collected}/7 lights`);
        if (collected === items.length) api.finish(true, 'The whole fernlight trail is glowing.');
      }
    });

    followCamera(api, character.position, V3(api.input.pointer.x * 1.5, 8.5, 11), dt, V3(0, 1.2, 0));
  }

  reset();
  return {
    reset, update,
    hideAction: true,
    controlHint: 'WASD / arrows explore · walk into every glowing forest object',
    status: () => `${collected}/7 lights`,
    timeUp: () => api.finish(false, 'The forest lights dimmed before the route was complete.'),
  };
}

async function createPlatformer(api) {
  sceneFog(api, '#0b2139', 0.02);
  addSkyRings(api, 7);
  const platformSpecs = [
    [0, 0, 12, 7, 5], [0, 1.1, 5, 5, 4.5], [3, 2.2, -1.5, 5, 4.5],
    [-2.2, 3.4, -8, 5, 4.5], [2.4, 4.6, -14.5, 5, 4.5], [0, 5.8, -21, 7, 5],
  ];
  const platforms = platformSpecs.map(([x, y, z, w, d]) => {
    const mesh = api.box([w, 0.8, d], '#214c4b', V3(x, y, z));
    return { mesh, x, z, w, d, top: y + 0.4 };
  });
  for (const [index, platform] of platforms.entries()) {
    await api.model(ASSETS.block, { size: Math.min(platform.w, 4.8), position: V3(platform.x, platform.top, platform.z), rotationY: index * 0.45 });
  }
  const character = await api.model(ASSETS.character, { size: 2.1, position: V3(0, platforms[0].top, 12) });
  const coins = [];
  for (let index = 1; index < platforms.length; index += 1) {
    const platform = platforms[index];
    const root = await api.model(ASSETS.coin, { size: 1.3, position: V3(platform.x, platform.top + 1.5, platform.z) });
    coins.push({ root, taken: false });
  }
  const flag = await api.model(ASSETS.flag, { size: 3.2, position: V3(1.6, platforms.at(-1).top, -22) });
  const velocity = V3();
  let grounded = true;
  let collected = 0;

  function reset() {
    character.position.set(0, platforms[0].top, 12);
    velocity.set(0, 0, 0);
    grounded = true;
    collected = 0;
    coins.forEach((coin) => {
      coin.taken = false;
      coin.root.visible = true;
    });
    api.setScore(0);
    api.setTimeLimit(105);
    api.setObjective('Collect 5 coins, then reach the flag');
  }

  function jump() {
    if (grounded) {
      velocity.y = 10.5;
      grounded = false;
    }
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    const oldY = character.position.y;
    velocity.x = THREE.MathUtils.damp(velocity.x, axis.x * 7.2, 9, dt);
    velocity.z = THREE.MathUtils.damp(velocity.z, -axis.y * 7.2, 9, dt);
    velocity.y -= 21 * dt;
    character.position.addScaledVector(velocity, dt);
    if (axis.x || axis.y) character.rotation.y = Math.atan2(axis.x, -axis.y);
    if (api.keyTapped('Space')) jump();

    grounded = false;
    if (velocity.y <= 0) {
      for (const platform of platforms) {
        const inside = Math.abs(character.position.x - platform.x) < platform.w / 2 - 0.25
          && Math.abs(character.position.z - platform.z) < platform.d / 2 - 0.25;
        if (inside && oldY >= platform.top - 0.05 && character.position.y <= platform.top) {
          character.position.y = platform.top;
          velocity.y = 0;
          grounded = true;
          break;
        }
      }
    }

    if (character.position.y < -7) {
      character.position.set(0, platforms[0].top, 12);
      velocity.set(0, 0, 0);
      api.setScore(Math.max(0, api.score - 75));
      api.toast('Cloud rescue returned you to the start');
    }

    coins.forEach((coin, index) => {
      if (coin.taken) return;
      coin.root.rotation.y += dt * 2;
      coin.root.position.y += Math.sin(elapsed * 3 + index) * dt * 0.1;
      if (character.position.distanceTo(coin.root.position) < 1.8) {
        coin.taken = true;
        coin.root.visible = false;
        collected += 1;
        api.addScore(180);
        api.setObjective(`${collected}/5 coins · reach the flag`);
      }
    });

    if (collected === coins.length && character.position.distanceTo(flag.position) < 2.4) {
      api.finish(true, 'Delivery complete across every cloudstep island.');
    }
    followCamera(api, character.position, V3(api.input.pointer.x * 1.2, 5.5, 10), dt, V3(0, 1.1, -1.5));
  }

  reset();
  return {
    reset, update, action: jump,
    actionLabel: 'JUMP',
    controlHint: 'WASD / arrows move · Space jumps · collect coins before the flag',
    status: () => `${collected}/5 coins`,
    timeUp: () => api.finish(false, 'The courier window closed before the flag.'),
  };
}

function sceneFog(api, color, density) {
  api.camera.far = 420;
  api.camera.updateProjectionMatrix();
  api.renderer.setClearColor(color);
}

async function createFlight(api) {
  sceneFog(api, '#070b1d', 0.009);
  addSkyRings(api, 8);
  const craft = await api.model(ASSETS.racer, { size: 4, position: V3(0, 4, 7), ground: false, rotationY: Math.PI });
  const rings = [];
  for (let index = 0; index < 10; index += 1) {
    rings.push(api.torus(2.2, 0.18, index % 2 ? '#8b7cff' : api.accent, V3(0, 4, -20 - index * 15)));
  }
  const meteors = [];
  for (let index = 0; index < 9; index += 1) {
    const root = await api.model(ASSETS.meteor, { size: 2.8 + (index % 3), position: V3(0, 4, -30), ground: false });
    meteors.push(root);
  }
  let collected = 0;
  let hits = 0;
  let boost = 0;

  function respawnObject(object, index, far = 80) {
    object.position.set((Math.random() - 0.5) * 18, 2 + Math.random() * 9, -far - index * 14 - Math.random() * 20);
  }

  function reset() {
    craft.position.set(0, 4, 7);
    collected = 0;
    hits = 0;
    boost = 0;
    rings.forEach((ring, index) => respawnObject(ring, index, 25));
    meteors.forEach((meteor, index) => respawnObject(meteor, index, 35));
    api.setScore(0);
    api.setTimeLimit(72);
    api.setObjective('Fly through 10 energy rings');
  }

  function action() {
    boost = 0.65;
    api.toast('Slipstream pulse');
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    craft.position.x = THREE.MathUtils.damp(craft.position.x, axis.x * 9, 5, dt);
    craft.position.y = THREE.MathUtils.damp(craft.position.y, 5 + axis.y * 4.5, 5, dt);
    craft.rotation.z = THREE.MathUtils.damp(craft.rotation.z, -axis.x * 0.42, 6, dt);
    craft.rotation.x = THREE.MathUtils.damp(craft.rotation.x, axis.y * 0.18, 6, dt);
    boost = Math.max(0, boost - dt);
    const flow = boost > 0 ? 31 : 21;

    rings.forEach((ring, index) => {
      ring.position.z += flow * dt;
      ring.rotation.z += dt * 1.1;
      if (ring.position.z > 14) respawnObject(ring, index, 75);
      if (ring.visible && ring.position.distanceTo(craft.position) < 2.7) {
        collected += 1;
        api.addScore(140);
        respawnObject(ring, index, 85);
        api.setObjective(`${collected}/10 rings`);
        if (collected >= 10) api.finish(true, 'Orbit Needle threaded every energy ring.');
      }
    });

    meteors.forEach((meteor, index) => {
      meteor.position.z += (flow + index % 3) * dt;
      meteor.rotation.x += dt * (0.4 + index * 0.03);
      meteor.rotation.y += dt * 0.55;
      if (meteor.position.z > 14) respawnObject(meteor, index, 90);
      if (meteor.position.distanceTo(craft.position) < 2.2) {
        hits += 1;
        respawnObject(meteor, index, 100);
        api.setScore(Math.max(0, api.score - 100));
        api.toast(`Hull warning ${hits}/3`);
        if (hits >= 3) api.finish(false, 'Three meteor strikes ended this orbit.');
      }
    });

    cameraWithPointer(api, V3(0, 8, 17), V3(craft.position.x * 0.25, craft.position.y, -8), 1.2);
  }

  reset();
  return {
    reset, update, action,
    actionLabel: 'PULSE',
    controlHint: 'WASD / arrows steer · Space pulses forward · avoid meteors',
    status: () => `${collected}/10 · hull ${3 - hits}`,
    timeUp: () => api.finish(false, 'The orbit window closed before all ten rings.'),
  };
}

async function createRange(api) {
  addArena(api, { size: 52, groundColor: '#1c2138', divisions: 18 });
  await api.model(ASSETS.spaceTurret, { size: 4.4, position: V3(0, 0, 8), rotationY: Math.PI });
  const targets = [];
  for (let index = 0; index < 9; index += 1) {
    const root = await api.model(index % 2 ? ASSETS.alien : ASSETS.meteor, { size: index % 2 ? 2.5 : 2, ground: false });
    const target = { root, phase: index * 0.8, alive: true };
    markTarget(root, target);
    targets.push(target);
  }
  const raycaster = new THREE.Raycaster();
  let hits = 0;

  function place(target, index) {
    target.root.visible = true;
    target.alive = true;
    target.root.position.set((Math.random() - 0.5) * 19, 2.5 + Math.random() * 6, -11 - Math.random() * 17);
    target.phase = index + Math.random() * 5;
  }

  function reset() {
    hits = 0;
    targets.forEach(place);
    api.setScore(0);
    api.setTimeLimit(65);
    api.setObjective('Tag 12 moving targets');
  }

  function shoot(pointer = V3(0, 0, 0)) {
    raycaster.setFromCamera(pointer, api.camera);
    const intersections = raycaster.intersectObjects(targets.filter((target) => target.alive).map((target) => target.root), true);
    let target = intersections.length ? findTarget(intersections[0].object) : null;
    if (!target) {
      let nearestDistance = 0.15;
      for (const candidate of targets.filter((entry) => entry.alive)) {
        const projected = candidate.root.position.clone().project(api.camera);
        const screenDistance = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
        if (screenDistance < nearestDistance) {
          nearestDistance = screenDistance;
          target = candidate;
        }
      }
    }
    if (!target || !target.alive) {
      api.toast('Shot missed');
      return;
    }
    target.alive = false;
    target.root.visible = false;
    hits += 1;
    const hitDistance = intersections[0]?.distance ?? 22;
    api.addScore(100 + Math.round(Math.max(0, 40 - hitDistance)));
    api.toast('Target tagged');
    if (hits >= 12) api.finish(true, 'Starforge calibration is complete.');
    else setTimeout(() => place(target, targets.indexOf(target)), 420);
  }

  function update(dt, elapsed) {
    targets.forEach((target, index) => {
      if (!target.alive) return;
      target.root.position.x += Math.sin(elapsed * (0.75 + index * 0.035) + target.phase) * dt * 2.1;
      target.root.position.y += Math.cos(elapsed * 0.9 + target.phase) * dt * 0.55;
      target.root.rotation.y += dt * (0.5 + index * 0.04);
    });
    cameraWithPointer(api, V3(0, 7.5, 16), V3(0, 4, -17), 1.15);
  }

  reset();
  return {
    reset, update,
    pointerDown: (pointer) => shoot(pointer),
    action: () => shoot(new THREE.Vector2(0, 0)),
    usesReticle: true,
    actionLabel: 'FIRE',
    controlHint: 'Move the mouse and click targets · Space fires at center',
    status: () => `${hits}/12 targets`,
    timeUp: () => api.finish(false, 'Range time expired before calibration finished.'),
  };
}

async function createMaze(api) {
  addArena(api, { size: 40, groundColor: '#17352f', divisions: 20 });
  const character = await api.model(ASSETS.character, { size: 2.3, position: V3(0, 0, 14) });
  const crystal = await api.model(ASSETS.crystal, { size: 2.6, position: V3(11, 0, 4) });
  const flag = await api.model(ASSETS.flag, { size: 3.2, position: V3(11, 0, -13) });
  const walls = [];
  const wall = (size, position) => {
    const mesh = api.box(size, '#244b46', position, { roughness: 0.9 });
    walls.push({ mesh, halfX: size[0] / 2, halfZ: size[2] / 2 });
  };
  wall([32, 2.8, 1], V3(0, 1.4, 16));
  wall([32, 2.8, 1], V3(0, 1.4, -16));
  wall([1, 2.8, 32], V3(16, 1.4, 0));
  wall([1, 2.8, 32], V3(-16, 1.4, 0));
  wall([23, 2.5, 1], V3(-4.5, 1.25, 8));
  wall([23, 2.5, 1], V3(4.5, 1.25, 0));
  wall([23, 2.5, 1], V3(-4.5, 1.25, -8));
  await api.model(ASSETS.tree, { size: 4.5, position: V3(-12, 0, 12) });
  await api.model(ASSETS.pine, { size: 4.5, position: V3(12, 0, 12) });
  await api.model(ASSETS.rock, { size: 2.5, position: V3(-12, 0, -12) });

  let hasCrystal = false;

  function blocked(position) {
    return walls.some((entry) => Math.abs(position.x - entry.mesh.position.x) < entry.halfX + 0.7
      && Math.abs(position.z - entry.mesh.position.z) < entry.halfZ + 0.7);
  }

  function reset() {
    character.position.set(0, 0, 13.5);
    hasCrystal = false;
    crystal.visible = true;
    api.setScore(0);
    api.setTimeLimit(125);
    api.setObjective('Find the crystal, then reach the south flag');
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    const speed = 8;
    const old = character.position.clone();
    character.position.x += axis.x * speed * dt;
    if (blocked(character.position)) character.position.x = old.x;
    character.position.z -= axis.y * speed * dt;
    if (blocked(character.position)) character.position.z = old.z;
    if (axis.x || axis.y) character.rotation.y = Math.atan2(axis.x, -axis.y);

    if (!hasCrystal) {
      pulse(crystal, elapsed, 0, 0.06);
      if (distanceXZ(character.position, crystal.position) < 1.8) {
        hasCrystal = true;
        crystal.visible = false;
        api.addScore(500);
        api.setObjective('Crystal found · reach the south flag');
        api.toast('Mossvault crystal secured');
      }
    }
    if (hasCrystal && distanceXZ(character.position, flag.position) < 2) {
      api.finish(true, 'The crystal unlocked the Mossvault exit.');
    }
    followCamera(api, character.position, V3(api.input.pointer.x * 1.2, 13, 9), dt, V3(0, 0, -2));
  }

  reset();
  return {
    reset, update,
    hideAction: true,
    controlHint: 'WASD / arrows navigate · crystal first, then the far flag',
    status: () => hasCrystal ? 'Exit unlocked' : 'Crystal hidden',
    timeUp: () => api.finish(false, 'The vault resealed before you found the exit.'),
  };
}

async function createSports(api) {
  addArena(api, { size: 48, groundColor: '#174a3b', divisions: 24 });
  const player = await api.model(ASSETS.character, { size: 2.5, position: V3(0, 0, 10) });
  const ball = api.sphere(0.75, '#f7faff', V3(0, 0.76, 4), { roughness: 0.58 });
  const ballVelocity = V3();
  const goalColor = api.accent;
  api.box([10, 0.35, 0.35], goalColor, V3(0, 4.6, -20));
  api.box([0.35, 4.8, 0.35], goalColor, V3(-5, 2.4, -20));
  api.box([0.35, 4.8, 0.35], goalColor, V3(5, 2.4, -20));
  await api.model(ASSETS.flag, { size: 2.8, position: V3(-6, 0, -20) });
  await api.model(ASSETS.flag, { size: 2.8, position: V3(6, 0, -20) });
  let facing = V3(0, 0, -1);
  let goals = 0;

  function resetBall() {
    ball.position.set(0, 0.76, 4);
    ballVelocity.set(0, 0, 0);
    player.position.set(0, 0, 10);
  }

  function reset() {
    goals = 0;
    resetBall();
    api.setScore(0);
    api.setTimeLimit(95);
    api.setObjective('Score 3 comet goals');
  }

  function kick() {
    if (distanceXZ(player.position, ball.position) < 3.1) {
      ballVelocity.copy(facing).multiplyScalar(15);
      api.toast('Comet kick');
    }
  }

  function update(dt) {
    const axis = api.axes();
    const direction = V3(axis.x, 0, -axis.y);
    if (direction.lengthSq()) {
      direction.normalize();
      player.position.addScaledVector(direction, 8 * dt);
      facing.lerp(direction, 0.25).normalize();
      player.rotation.y = Math.atan2(facing.x, facing.z);
    }
    player.position.x = api.clamp(player.position.x, -18, 18);
    player.position.z = api.clamp(player.position.z, -18, 18);
    if (api.keyTapped('Space')) kick();

    if (distanceXZ(player.position, ball.position) < 1.45) ballVelocity.addScaledVector(facing, 4.5 * dt);
    ball.position.addScaledVector(ballVelocity, dt);
    ballVelocity.multiplyScalar(Math.pow(0.976, dt * 60));
    ball.rotation.x += ballVelocity.z * dt;
    ball.rotation.z -= ballVelocity.x * dt;
    if (Math.abs(ball.position.x) > 20) {
      ball.position.x = api.clamp(ball.position.x, -20, 20);
      ballVelocity.x *= -0.7;
    }
    if (ball.position.z > 20) {
      ball.position.z = 20;
      ballVelocity.z *= -0.7;
    }
    if (ball.position.z < -20) {
      if (Math.abs(ball.position.x) < 5) {
        goals += 1;
        api.addScore(400);
        api.toast(`Goal ${goals}/3`);
        if (goals >= 3) api.finish(true, 'Three comet goals lit the stadium.');
        else resetBall();
      } else {
        ball.position.z = -19.5;
        ballVelocity.z *= -0.8;
      }
    }
    cameraWithPointer(api, V3(0, 20, 18), V3(0, 0, -4), 1.1);
  }

  reset();
  return {
    reset, update, action: kick,
    actionLabel: 'KICK',
    controlHint: 'WASD / arrows move · Space or A kicks · score three goals',
    status: () => `${goals}/3 goals`,
    timeUp: () => api.finish(false, 'The final whistle arrived before goal three.'),
  };
}

async function createDefense(api) {
  addArena(api, { size: 58, groundColor: '#25253d', divisions: 24 });
  const base = await api.model(ASSETS.towerBase, { size: 5, position: V3(0, 0, 0) });
  const top = await api.model(ASSETS.towerTop, { size: 3.6, position: V3(0, 2.4, 0), ground: false });
  const crystal = await api.model(ASSETS.crystal, { size: 2.8, position: V3(0, 4.4, 0), ground: false });
  const enemies = [];
  for (let index = 0; index < 10; index += 1) {
    const root = await api.model(ASSETS.ufo, { size: 3, ground: false });
    const enemy = { root, active: false, delay: index * 0.7 };
    markTarget(root, enemy);
    enemies.push(enemy);
  }
  const raycaster = new THREE.Raycaster();
  let health = 5;
  let defeated = 0;
  let elapsedGame = 0;

  function spawn(enemy) {
    const angle = Math.random() * Math.PI * 2;
    enemy.root.position.set(Math.cos(angle) * 24, 2.8 + Math.random() * 2, Math.sin(angle) * 24);
    enemy.active = true;
    enemy.root.visible = true;
  }

  function destroy(enemy) {
    if (!enemy?.active) return;
    enemy.active = false;
    enemy.root.visible = false;
    enemy.delay = 0.8 + Math.random() * 1.5;
    defeated += 1;
    api.addScore(110);
    top.rotation.y += 0.4;
    if (defeated >= 15) api.finish(true, 'Bastion Bloom survived the full wave.');
  }

  function shoot(pointer = new THREE.Vector2(0, 0)) {
    raycaster.setFromCamera(pointer, api.camera);
    const hits = raycaster.intersectObjects(enemies.filter((enemy) => enemy.active).map((enemy) => enemy.root), true);
    let enemy = hits.length ? findTarget(hits[0].object) : null;
    if (!enemy) {
      let nearestDistance = 0.13;
      for (const candidate of enemies.filter((entry) => entry.active)) {
        const projected = candidate.root.position.clone().project(api.camera);
        const screenDistance = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
        if (screenDistance < nearestDistance) {
          nearestDistance = screenDistance;
          enemy = candidate;
        }
      }
    }
    if (enemy) destroy(enemy);
    else api.toast('Pulse missed the swarm');
  }

  function reset() {
    health = 5;
    defeated = 0;
    elapsedGame = 0;
    enemies.forEach((enemy, index) => {
      enemy.active = false;
      enemy.root.visible = false;
      enemy.delay = index * 0.45;
    });
    api.setScore(0);
    api.setTimeLimit(82);
    api.setObjective('Stop 15 UFOs · protect the crystal');
  }

  function update(dt, elapsed) {
    elapsedGame += dt;
    top.rotation.y += dt * 0.45;
    pulse(crystal, elapsed, 0, 0.04);
    enemies.forEach((enemy) => {
      if (!enemy.active) {
        enemy.delay -= dt;
        if (enemy.delay <= 0 && defeated < 15) spawn(enemy);
        return;
      }
      const direction = base.position.clone().sub(enemy.root.position).normalize();
      enemy.root.position.addScaledVector(direction, dt * (2.2 + defeated * 0.035));
      enemy.root.rotation.y += dt * 1.4;
      if (distanceXZ(enemy.root.position, base.position) < 2.7) {
        enemy.active = false;
        enemy.root.visible = false;
        enemy.delay = 1.5;
        health -= 1;
        api.toast(`Crystal shield ${health}/5`);
        if (health <= 0) api.finish(false, 'The UFO wave reached the Bastion crystal.');
      }
    });
    cameraWithPointer(api, V3(0, 25, 19), V3(0, 0, 0), 1.5);
  }

  reset();
  return {
    reset, update,
    pointerDown: (pointer) => shoot(pointer),
    action: () => {
      const nearest = enemies.filter((enemy) => enemy.active).sort((a, b) => distanceXZ(a.root.position, base.position) - distanceXZ(b.root.position, base.position))[0];
      if (nearest) destroy(nearest);
    },
    usesReticle: true,
    actionLabel: 'PULSE',
    controlHint: 'Click UFOs to pulse them · Space auto-targets the nearest threat',
    status: () => `${defeated}/15 · shield ${health}`,
    timeUp: () => defeated >= 15 ? api.finish(true) : api.finish(false, 'The wave timer ended before all threats were cleared.'),
  };
}

async function createStacker(api) {
  sceneFog(api, '#11132b', 0.015);
  addSkyRings(api, 6);
  api.box([8, 1, 8], '#273756', V3(0, 0, 0));
  const crates = [];
  for (let index = 0; index < 11; index += 1) crates.push(await api.model(ASSETS.crate, { size: 2.7, position: V3(0, 1, 0) }));
  let placed = 0;
  let misses = 0;
  let current = 0;
  let dropping = false;
  let direction = 1;
  let lastX = 0;
  const crateHeight = 2.25;

  function prepare(index) {
    current = index;
    if (!crates[current]) return;
    crates[current].visible = true;
    crates[current].position.set(-7, 8 + placed * crateHeight, 0);
    dropping = false;
    direction = 1;
  }

  function reset() {
    placed = 0;
    misses = 0;
    lastX = 0;
    crates.forEach((crate) => {
      crate.visible = false;
      crate.rotation.set(0, 0, 0);
    });
    prepare(0);
    api.setScore(0);
    api.setTimeLimit(95);
    api.setObjective('Balance 8 skycrates');
  }

  function drop() {
    if (!dropping && crates[current]?.visible) dropping = true;
  }

  function update(dt, elapsed) {
    const crate = crates[current];
    if (crate) {
      if (!dropping) {
        crate.position.x += direction * (6 + placed * 0.25) * dt;
        if (Math.abs(crate.position.x) > 7) {
          crate.position.x = api.clamp(crate.position.x, -7, 7);
          direction *= -1;
        }
        crate.rotation.y += dt * 0.7;
      } else {
        crate.position.y -= (10 + placed * 0.35) * dt;
        const targetY = 1 + placed * crateHeight;
        if (crate.position.y <= targetY) {
          crate.position.y = targetY;
          if (Math.abs(crate.position.x - lastX) <= 1.65) {
            const alignment = Math.abs(crate.position.x - lastX);
            lastX = crate.position.x;
            placed += 1;
            api.addScore(175 + Math.round((1.65 - alignment) * 50));
            api.toast(`Crate ${placed}/8 balanced`);
            if (placed >= 8) {
              api.finish(true, 'Eight skycrates are balanced above the circuit.');
              return;
            }
          } else {
            crate.visible = false;
            misses += 1;
            api.toast(`Miss ${misses}/3`);
            if (misses >= 3) {
              api.finish(false, 'Three crates slipped past the stack.');
              return;
            }
          }
          prepare(current + 1);
        }
      }
    }
    const height = Math.max(3, placed * crateHeight);
    cameraWithPointer(api, V3(12, 9 + height * 0.55, 16), V3(0, height * 0.5, 0), 1.3);
  }

  reset();
  return {
    reset, update, action: drop, pointerDown: drop,
    actionLabel: 'DROP',
    controlHint: 'Click, tap, or press Space to drop each moving crate',
    status: () => `${placed}/8 · ${misses}/3 misses`,
    timeUp: () => api.finish(false, 'The stacking window closed before crate eight.'),
  };
}

async function createDelivery(api) {
  addArena(api, { size: 76, groundColor: '#1f2b34', divisions: 38 });
  const car = await api.model(ASSETS.carOrange, { size: 4, position: V3(0, 0.05, 20), rotationY: Math.PI });
  const destinations = [V3(-14, 0.2, 11), V3(13, 0.2, 8), V3(14, 0.2, -13), V3(-12, 0.2, -14), V3(0, 0.2, 0)];
  const markers = destinations.map((point, index) => api.torus(2.5, 0.2, index % 2 ? '#ffd166' : api.accent, point, E(Math.PI / 2, 0, 0)));
  const flags = [];
  for (const point of destinations) flags.push(await api.model(ASSETS.flag, { size: 2.6, position: point.clone().add(V3(2.8, 0, 0)) }));
  const obstacles = [];
  for (const point of [V3(-3, 0, 8), V3(7, 0, -4), V3(-8, 0, -8), V3(4, 0, 15)]) obstacles.push(await api.model(ASSETS.crate, { size: 3, position: point }));
  let speed = 0;
  let heading = Math.PI;
  let delivered = 0;
  let boost = 0;

  function reset() {
    car.position.set(0, 0.05, 20);
    speed = 0;
    heading = Math.PI;
    delivered = 0;
    boost = 0;
    markers.forEach((marker, index) => {
      marker.visible = true;
      marker.material.transparent = true;
      marker.material.opacity = index === 0 ? 1 : 0.2;
    });
    flags.forEach((flag, index) => { flag.visible = index === 0; });
    api.setScore(0);
    api.setTimeLimit(100);
    api.setObjective('Deliver 5 circuit parcels');
  }

  function action() {
    boost = 0.55;
    api.toast('Courier boost');
  }

  function update(dt, elapsed) {
    const axis = api.axes();
    speed += axis.y * 17 * dt;
    speed *= Math.pow(0.983, dt * 60);
    boost = Math.max(0, boost - dt);
    if (boost > 0) speed += 12 * dt;
    speed = api.clamp(speed, -6, boost > 0 ? 20 : 14);
    heading -= axis.x * 1.9 * dt * (0.4 + Math.min(1, Math.abs(speed) / 8)) * Math.sign(speed || 1);
    car.position.x += Math.sin(heading) * speed * dt;
    car.position.z += Math.cos(heading) * speed * dt;
    car.rotation.y = heading;
    car.rotation.z = -axis.x * 0.08;
    car.position.x = api.clamp(car.position.x, -27, 27);
    car.position.z = api.clamp(car.position.z, -27, 27);

    obstacles.forEach((obstacle) => {
      if (distanceXZ(car.position, obstacle.position) < 2.3) {
        speed *= -0.22;
        car.position.x -= Math.sin(heading);
        car.position.z -= Math.cos(heading);
      }
    });

    const marker = markers[delivered];
    if (marker) {
      marker.rotation.z += dt * 1.5;
      marker.position.y = 0.35 + Math.sin(elapsed * 2.4) * 0.12;
      if (distanceXZ(car.position, marker.position) < 3.2) {
        marker.visible = false;
        flags[delivered].visible = false;
        delivered += 1;
        api.addScore(250);
        api.toast(`Parcel ${delivered}/5 delivered`);
        if (delivered >= destinations.length) api.finish(true, 'Every harbor parcel arrived on time.');
        else {
          markers[delivered].material.opacity = 1;
          flags[delivered].visible = true;
        }
      }
    }
    const behind = V3(-Math.sin(heading) * 10, 6.5, -Math.cos(heading) * 10);
    behind.x += api.input.pointer.x;
    followCamera(api, car.position, behind, dt, V3(0, 1, 0));
  }

  reset();
  return {
    reset, update, action,
    actionLabel: 'BOOST',
    controlHint: 'WASD / arrows drive · Space boosts · follow the active beacon',
    status: () => `${delivered}/5 parcels`,
    timeUp: () => api.finish(false, 'The harbor deadline passed before all five parcels.'),
  };
}

const FACTORIES = {
  racing: createRacing,
  exploration: createExploration,
  platformer: createPlatformer,
  flight: createFlight,
  range: createRange,
  maze: createMaze,
  sports: createSports,
  defense: createDefense,
  stacker: createStacker,
  delivery: createDelivery,
};

export async function createWorld(mode, api) {
  const factory = FACTORIES[mode];
  if (!factory) throw new Error(`Unsupported JoyCircuit 3D mode: ${mode}`);
  return factory(api);
}

export const worldModes = Object.freeze(Object.keys(FACTORIES));
