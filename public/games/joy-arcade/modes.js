const TAU = Math.PI * 2;
const VIOLET = '#8b72ff';
const CORAL = '#ff7077';
const MINT = '#52f0b4';
const GOLD = '#ffd166';
const CYAN = '#53c8ef';

function polygon(ctx, x, y, radius, sides, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + i * TAU / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function glowCircle(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = radius * 1.25;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawShip(ctx, x, y, size, accent, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowBlur = 22;
  ctx.shadowColor = accent;
  const gradient = ctx.createLinearGradient(-size, -size, size, size);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(0.52, CYAN);
  gradient.addColorStop(0.54, VIOLET);
  gradient.addColorStop(1, '#5a4ac7');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.9, size * 0.4, size * 0.65, size * 0.9);
  ctx.quadraticCurveTo(0, size * 0.62, -size * 0.65, size * 0.9);
  ctx.quadraticCurveTo(-size * 0.9, size * 0.4, 0, -size);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a1730';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.05, size * 0.28, size * 0.38, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function makeDodger(api) {
  let player;
  let hazards;
  let time;
  let spawn;
  let lives;
  let invulnerable;
  let passed;
  const target = 28 + (api.variant % 4) * 4;

  function reset() {
    player = { x: api.w / 2, y: api.h * 0.74, r: 15, targetX: api.w / 2, targetY: api.h * 0.74 };
    hazards = [];
    time = 0;
    spawn = 0.25;
    lives = 3;
    invulnerable = 0;
    passed = 0;
    api.setScore(0);
    api.setGoal(`Survive ${target} seconds through the prism field. Three shields available.`);
  }

  function addHazard() {
    const radius = api.rand(12, 29);
    hazards.push({
      x: api.rand(radius + 10, api.w - radius - 10),
      y: -radius - 12,
      r: radius,
      vy: api.rand(145, 235) + time * 2.7,
      vx: api.rand(-45, 45),
      spin: api.rand(-2.5, 2.5),
      rotation: api.rand(0, TAU),
      sides: 3 + Math.floor(api.rand(0, 4)),
      color: api.rand() > 0.35 ? CORAL : VIOLET
    });
  }

  function update(dt) {
    time += dt;
    api.sound('motion', { level: api.clamp(0.25 + time / target * 0.65, 0, 1) });
    invulnerable = Math.max(0, invulnerable - dt);
    const dx = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    const dy = (api.pressed('down') ? 1 : 0) - (api.pressed('up') ? 1 : 0);
    if (api.input.pointer.down) {
      player.targetX = api.input.pointer.x;
      player.targetY = api.input.pointer.y;
    } else {
      player.targetX += dx * 420 * dt;
      player.targetY += dy * 420 * dt;
    }
    player.targetX = api.clamp(player.targetX, 28, api.w - 28);
    player.targetY = api.clamp(player.targetY, 68, api.h - 34);
    player.x += (player.targetX - player.x) * Math.min(1, dt * 13);
    player.y += (player.targetY - player.y) * Math.min(1, dt * 13);

    spawn -= dt;
    if (spawn <= 0) {
      addHazard();
      spawn = Math.max(0.15, api.rand(0.3, 0.58) - time * 0.003);
    }
    for (const hazard of hazards) {
      hazard.x += hazard.vx * dt;
      hazard.y += hazard.vy * dt;
      hazard.rotation += hazard.spin * dt;
      if ((hazard.x < hazard.r && hazard.vx < 0) || (hazard.x > api.w - hazard.r && hazard.vx > 0)) hazard.vx *= -1;
      if (!hazard.hit && invulnerable <= 0 && api.circleHit(player, hazard, -2)) {
        hazard.hit = true;
        lives -= 1;
        invulnerable = 1.15;
        api.burst(player.x, player.y, CORAL, 22, 180);
        api.sound('damage', { intensity: 0.9, pan: (player.x / api.w - 0.5) * 1.2 });
        if (lives <= 0) api.finish(false, 'The prism field broke through every shield.');
      }
      if (!hazard.counted && hazard.y - hazard.r > api.h) {
        hazard.counted = true;
        passed += 1;
        if (passed % 4 === 0) api.sound('score', { intensity: 0.55, pitch: Math.min(5, passed / 4) });
      }
    }
    hazards = hazards.filter((hazard) => hazard.y < api.h + 70 && !hazard.hit);
    api.setScore(time * 12 + passed * 9);
    if (time >= target) api.finish(true, 'You found a clean line through the entire prism storm.');
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    ctx.save();
    for (const hazard of hazards) {
      ctx.save();
      ctx.translate(hazard.x, hazard.y);
      ctx.rotate(hazard.rotation);
      ctx.shadowBlur = 17;
      ctx.shadowColor = hazard.color;
      ctx.fillStyle = api.rgba(hazard.color, 0.88);
      polygon(ctx, 0, 0, hazard.r, hazard.sides, -Math.PI / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.48)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 12) % 2 ? 0.28 : 1;
    ctx.shadowBlur = 25;
    ctx.shadowColor = api.config.accent;
    ctx.fillStyle = api.config.accent;
    polygon(ctx, player.x, player.y, player.r + 4, 4, Math.PI / 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#071526';
    polygon(ctx, player.x, player.y, player.r * 0.42, 4, Math.PI / 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return {
    reset,
    update,
    draw,
    pointerMove(x, y) { player.targetX = x; player.targetY = y; },
    status: () => `${Math.max(0, Math.ceil(target - time))}s · ${lives} shields`
  };
}

function makeLaneRacer(api) {
  const laneCount = 5;
  const target = 1300 + (api.variant % 4) * 160;
  let lane;
  let targetLane;
  let distanceRun;
  let rivals;
  let spawn;
  let lives;
  let invulnerable;
  let roadScroll;

  function reset() {
    lane = 2;
    targetLane = 2;
    distanceRun = 0;
    rivals = [];
    spawn = 0.55;
    lives = 3;
    invulnerable = 0;
    roadScroll = 0;
    api.setScore(0);
    api.setGoal(`Reach ${target} m. Switch lanes cleanly and preserve three shields.`);
  }

  function laneX(value, y = api.h * 0.78) {
    const topWidth = api.w * 0.28;
    const bottomWidth = api.w * 0.88;
    const perspective = api.clamp((y - api.h * 0.08) / (api.h * 0.86), 0, 1);
    const width = api.lerp(topWidth, bottomWidth, perspective);
    return api.w / 2 - width / 2 + width * ((value + 0.5) / laneCount);
  }

  function chooseLane(next) {
    const chosen = api.clamp(next, 0, laneCount - 1);
    if (chosen === targetLane) return;
    const direction = Math.sign(chosen - targetLane);
    targetLane = chosen;
    api.sound('move', { intensity: 0.8, pan: (targetLane - 2) * 0.28, pitch: direction * 2 });
  }

  function update(dt) {
    if (api.tapped('left')) chooseLane(targetLane - 1);
    if (api.tapped('right')) chooseLane(targetLane + 1);
    lane += (targetLane - lane) * Math.min(1, dt * 12);
    invulnerable = Math.max(0, invulnerable - dt);
    const speed = 310 + Math.min(120, distanceRun * 0.055);
    api.sound('motion', { level: api.clamp((speed - 260) / 190, 0, 1) });
    distanceRun += speed * dt * 0.42;
    roadScroll = (roadScroll + speed * dt) % 90;
    spawn -= dt;
    if (spawn <= 0) {
      rivals.push({ lane: Math.floor(api.rand(0, laneCount)), y: api.h * 0.08, speed: api.rand(120, 190), hit: false, color: api.rand() > 0.5 ? CORAL : VIOLET });
      spawn = api.rand(0.55, 0.95);
    }
    const playerY = api.h * 0.79;
    for (const rival of rivals) {
      const progress = api.clamp((rival.y - api.h * 0.08) / (api.h * 0.84), 0, 1);
      rival.y += (rival.speed + speed * (0.35 + progress)) * dt;
      if (!rival.hit && invulnerable <= 0 && Math.abs(rival.y - playerY) < 46 && Math.abs(rival.lane - lane) < 0.48) {
        rival.hit = true;
        lives -= 1;
        invulnerable = 1.25;
        api.burst(laneX(lane), playerY, CORAL, 26, 190);
        api.sound('damage', { intensity: 1.1, pan: (lane - 2) * 0.26 });
        if (lives <= 0) api.finish(false, 'Traffic closed every lane before the finish marker.');
      }
    }
    rivals = rivals.filter((rival) => rival.y < api.h + 80 && !rival.hit);
    api.setScore(distanceRun);
    if (distanceRun >= target) api.finish(true, 'Finish marker crossed with the circuit still glowing.');
  }

  function drawCar(x, y, scale, color, playerCar = false) {
    const ctx = api.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.shadowBlur = playerCar ? 24 : 13;
    ctx.shadowColor = color;
    const gradient = ctx.createLinearGradient(-22, -30, 22, 30);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, playerCar ? VIOLET : '#b24466');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(-22, -34, 44, 68, 13);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#081426';
    ctx.beginPath();
    ctx.roundRect(-13, -20, 26, 21, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.fillRect(-15, 19, 8, 4);
    ctx.fillRect(7, 19, 8, 4);
    ctx.restore();
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('lanes');
    const topY = api.h * 0.08;
    ctx.fillStyle = 'rgba(7,13,30,.72)';
    ctx.beginPath();
    ctx.moveTo(api.w * 0.36, topY);
    ctx.lineTo(api.w * 0.94, api.h);
    ctx.lineTo(api.w * 0.06, api.h);
    ctx.lineTo(api.w * 0.64, topY);
    ctx.closePath();
    ctx.fill();
    for (let i = 1; i < laneCount; i += 1) {
      ctx.strokeStyle = api.rgba(api.config.accent, 0.22);
      ctx.setLineDash([22, 20]);
      ctx.lineDashOffset = roadScroll;
      ctx.beginPath();
      ctx.moveTo(api.lerp(api.w * 0.36, api.w * 0.64, i / laneCount), topY);
      ctx.lineTo(api.lerp(api.w * 0.06, api.w * 0.94, i / laneCount), api.h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const rival of rivals.slice().sort((a, b) => a.y - b.y)) {
      const p = api.clamp((rival.y - topY) / (api.h - topY), 0, 1);
      drawCar(laneX(rival.lane, rival.y), rival.y, 0.35 + p * 0.72, rival.color);
    }
    ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 12) % 2 ? 0.28 : 1;
    drawCar(laneX(lane), api.h * 0.79, 1, api.config.accent, true);
    ctx.globalAlpha = 1;
  }

  return {
    reset,
    update,
    draw,
    pointerDown(x) { chooseLane(Math.floor(x / api.w * laneCount)); },
    status: () => `${Math.min(target, Math.floor(distanceRun))}/${target}m · ${lives} shields`
  };
}

function makeSnake(api) {
  let cols;
  let rows;
  let cell;
  let boardX;
  let boardY;
  let snake;
  let direction;
  let nextDirection;
  let food;
  let timer;
  let eaten;
  const target = 9 + (api.variant % 4) * 2;

  function measure() {
    cols = api.w < api.h ? 16 : 26;
    rows = api.w < api.h ? 25 : 16;
    cell = Math.floor(Math.min((api.w - 40) / cols, (api.h - 110) / rows));
    boardX = Math.round((api.w - cols * cell) / 2);
    boardY = Math.round((api.h - rows * cell) / 2 + 15);
  }

  function placeFood() {
    let candidate;
    do {
      candidate = { x: Math.floor(api.rand(0, cols)), y: Math.floor(api.rand(0, rows)) };
    } while (snake.some((part) => part.x === candidate.x && part.y === candidate.y));
    food = candidate;
  }

  function reset() {
    measure();
    const sx = Math.floor(cols / 2);
    const sy = Math.floor(rows / 2);
    snake = [{ x: sx, y: sy }, { x: sx - 1, y: sy }, { x: sx - 2, y: sy }];
    direction = { x: 1, y: 0 };
    nextDirection = { ...direction };
    timer = 0;
    eaten = 0;
    placeFood();
    api.setScore(0);
    api.setGoal(`Collect ${target} glow nodes without touching a wall or your trail.`);
  }

  function turn(x, y) {
    if (x === -direction.x && y === -direction.y) return;
    if (x === nextDirection.x && y === nextDirection.y) return;
    nextDirection = { x, y };
    api.sound('move', { pitch: x !== 0 ? x * 2 : y * -2, pan: x * 0.25 });
  }

  function control() {
    if (api.tapped('left')) turn(-1, 0);
    if (api.tapped('right')) turn(1, 0);
    if (api.tapped('up')) turn(0, -1);
    if (api.tapped('down')) turn(0, 1);
  }

  function update(dt) {
    control();
    timer += dt;
    const interval = Math.max(0.065, 0.15 - eaten * 0.004 - (api.variant % 4) * 0.008);
    if (timer < interval) return;
    timer -= interval;
    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some((part) => part.x === head.x && part.y === head.y)) {
      api.sound('damage', { intensity: 0.9 });
      api.finish(false, 'The glowtail crossed its own signal trail.');
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      eaten += 1;
      api.setScore(eaten * 100 + snake.length * 4);
      api.burst(boardX + (food.x + 0.5) * cell, boardY + (food.y + 0.5) * cell, GOLD, 14, 120);
      api.sound('pickup', { pitch: (eaten % 5) * 1.5, pan: food.x / cols * 1.2 - 0.6 });
      if (eaten >= target) {
        api.finish(true, 'The collection is complete and the glowtail is thriving.');
        return;
      }
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    ctx.fillStyle = 'rgba(3,11,25,.52)';
    ctx.strokeStyle = api.rgba(api.config.accent, 0.18);
    ctx.beginPath();
    ctx.roundRect(boardX - 9, boardY - 9, cols * cell + 18, rows * cell + 18, 17);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x += 1) {
      ctx.beginPath(); ctx.moveTo(boardX + x * cell, boardY); ctx.lineTo(boardX + x * cell, boardY + rows * cell); ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      ctx.beginPath(); ctx.moveTo(boardX, boardY + y * cell); ctx.lineTo(boardX + cols * cell, boardY + y * cell); ctx.stroke();
    }
    glowCircle(ctx, boardX + (food.x + 0.5) * cell, boardY + (food.y + 0.5) * cell, cell * 0.29, GOLD);
    snake.forEach((part, index) => {
      const x = boardX + (part.x + 0.5) * cell;
      const y = boardY + (part.y + 0.5) * cell;
      const color = index === 0 ? '#e5fff6' : api.mixColor(api.config.accent, VIOLET, Math.min(0.72, index / snake.length));
      ctx.shadowBlur = index < 3 ? 15 : 7;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - cell * 0.37, y - cell * 0.37, cell * 0.74, cell * 0.74, cell * 0.25);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  return {
    reset,
    update,
    draw,
    controlDown(controlName) {
      if (controlName === 'left') turn(-1, 0);
      if (controlName === 'right') turn(1, 0);
      if (controlName === 'up') turn(0, -1);
      if (controlName === 'down') turn(0, 1);
    },
    pointerDown(x, y) {
      const hx = boardX + (snake[0].x + 0.5) * cell;
      const hy = boardY + (snake[0].y + 0.5) * cell;
      if (Math.abs(x - hx) > Math.abs(y - hy)) turn(x < hx ? -1 : 1, 0);
      else turn(0, y < hy ? -1 : 1);
    },
    status: () => `${eaten}/${target} nodes`
  };
}

function makeBreakout(api) {
  let paddle;
  let ball;
  let bricks;
  let lives;
  let destroyed;
  let total;
  let rows;
  let cols;

  function placeBall() {
    ball = { x: paddle.x + paddle.w / 2, y: paddle.y - 15, r: 9, vx: api.rand() > 0.5 ? 235 : -235, vy: -280, stuck: true };
  }

  function reset() {
    cols = api.w < api.h ? 6 : 9;
    rows = 5 + (api.variant % 3);
    const gap = 7;
    const margin = api.w < api.h ? 24 : 58;
    const width = (api.w - margin * 2 - gap * (cols - 1)) / cols;
    const height = api.w < api.h ? 34 : 28;
    bricks = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        bricks.push({ x: margin + col * (width + gap), y: 92 + row * (height + gap), w: width, h: height, alive: true, color: [api.config.accent, VIOLET, CORAL, GOLD][(row + col) % 4] });
      }
    }
    total = bricks.length;
    destroyed = 0;
    lives = 3;
    paddle = { x: api.w / 2 - 58, y: api.h - 64, w: 116, h: 15, target: api.w / 2 };
    placeBall();
    api.setScore(0);
    api.setGoal(`Clear all ${total} light blocks. Three reserve pulses.`);
  }

  function launch() {
    if (ball.stuck) {
      ball.stuck = false;
      api.burst(ball.x, ball.y, api.config.accent, 8, 80);
      api.sound('action', { pan: ball.x / api.w * 1.2 - 0.6 });
    }
  }

  function update(dt) {
    const move = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    if (api.input.pointer.inside) paddle.target = api.input.pointer.x;
    else paddle.target += move * 480 * dt;
    paddle.x += (api.clamp(paddle.target - paddle.w / 2, 8, api.w - paddle.w - 8) - paddle.x) * Math.min(1, dt * 15);
    if (api.tapped('action') || api.tapped('pointer')) launch();
    if (ball.stuck) {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 3;
      return;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.sound('impact', { intensity: 0.42, pan: -0.65, pitch: -2 }); }
    if (ball.x > api.w - ball.r) { ball.x = api.w - ball.r; ball.vx = -Math.abs(ball.vx); api.sound('impact', { intensity: 0.42, pan: 0.65, pitch: -2 }); }
    if (ball.y < 55 + ball.r) { ball.y = 55 + ball.r; ball.vy = Math.abs(ball.vy); api.sound('impact', { intensity: 0.42, pan: ball.x / api.w * 1.2 - 0.6, pitch: -1 }); }
    if (ball.vy > 0 && ball.y + ball.r > paddle.y && ball.y - ball.r < paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
      ball.y = paddle.y - ball.r;
      const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const speed = Math.min(520, Math.hypot(ball.vx, ball.vy) + 8);
      ball.vx = speed * offset * 0.9;
      ball.vy = -Math.sqrt(Math.max(12000, speed * speed - ball.vx * ball.vx));
      api.burst(ball.x, paddle.y, api.config.accent, 6, 75);
      api.sound('impact', { intensity: 0.78, pan: offset * 0.65, pitch: 2 + Math.abs(offset) * 2 });
    }
    for (const brick of bricks) {
      if (!brick.alive) continue;
      const nearestX = api.clamp(ball.x, brick.x, brick.x + brick.w);
      const nearestY = api.clamp(ball.y, brick.y, brick.y + brick.h);
      if (Math.hypot(ball.x - nearestX, ball.y - nearestY) <= ball.r) {
        brick.alive = false;
        destroyed += 1;
        ball.vy *= -1;
        api.setScore(destroyed * 45 + lives * 25);
        api.burst(ball.x, ball.y, brick.color, 9, 105);
        api.sound('score', { pitch: destroyed % 8, pan: ball.x / api.w * 1.2 - 0.6 });
        if (destroyed >= total) api.finish(true, 'Every block returned to pure circuit light.');
        break;
      }
    }
    if (ball.y - ball.r > api.h) {
      lives -= 1;
      api.sound('miss', { intensity: 0.9 });
      if (lives <= 0) api.finish(false, 'The final reserve pulse slipped beyond the paddle.');
      else placeBall();
    }
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    for (const brick of bricks) {
      if (!brick.alive) continue;
      ctx.shadowBlur = 13;
      ctx.shadowColor = brick.color;
      const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.w, brick.y + brick.h);
      gradient.addColorStop(0, api.mixColor(brick.color, '#ffffff', 0.25));
      gradient.addColorStop(1, api.mixColor(brick.color, '#07111f', 0.28));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.stroke();
    }
    ctx.shadowBlur = 20;
    ctx.shadowColor = api.config.accent;
    ctx.fillStyle = api.config.accent;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    glowCircle(ctx, ball.x, ball.y, ball.r, '#f8fff9');
    if (ball.stuck) {
      ctx.fillStyle = 'rgba(255,255,255,.66)';
      ctx.font = '800 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('TAP OR SPACE TO LAUNCH', api.w / 2, api.h - 25);
    }
  }

  return {
    reset,
    update,
    draw,
    pointerMove(x) { paddle.target = x; },
    pointerDown() { launch(); },
    controlDown(controlName) { if (controlName === 'action') launch(); },
    status: () => `${destroyed}/${total} blocks · ${lives} pulses`
  };
}

function makeShooter(api) {
  let player;
  let bullets;
  let enemies;
  let kills;
  let target;
  let spawn;
  let cooldown;
  let lives;
  let invulnerable;

  function reset() {
    target = 18 + (api.variant % 4) * 4;
    player = { x: api.w / 2, y: api.h - 72, r: 18, targetX: api.w / 2 };
    bullets = [];
    enemies = [];
    kills = 0;
    spawn = 0.3;
    cooldown = 0;
    lives = 3;
    invulnerable = 0;
    api.setScore(0);
    api.setGoal(`Clear ${target} incoming drones before they cross the lower signal line.`);
  }

  function fire() {
    if (cooldown > 0) return;
    bullets.push({ x: player.x, y: player.y - 25, r: 4, vy: -590 });
    cooldown = 0.16;
    api.sound('action', { pan: player.x / api.w * 1.2 - 0.6, pitch: api.rand(-1.5, 1.5) });
  }

  function damage() {
    if (invulnerable > 0) return;
    lives -= 1;
    invulnerable = 1.1;
    api.burst(player.x, player.y, CORAL, 22, 175);
    api.sound('damage', { intensity: 1, pan: player.x / api.w * 1.2 - 0.6 });
    if (lives <= 0) api.finish(false, 'The descending formation reached the patrol line.');
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    invulnerable = Math.max(0, invulnerable - dt);
    const horizontal = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    if (api.input.pointer.inside) player.targetX = api.input.pointer.x;
    else player.targetX += horizontal * 480 * dt;
    player.targetX = api.clamp(player.targetX, 28, api.w - 28);
    player.x += (player.targetX - player.x) * Math.min(1, dt * 14);
    if (api.pressed('action') || api.input.pointer.down) fire();
    spawn -= dt;
    if (spawn <= 0) {
      enemies.push({ x: api.rand(35, api.w - 35), y: 60, r: api.rand(14, 24), vy: api.rand(72, 118) + kills * 1.5, phase: api.rand(0, TAU), color: api.rand() > 0.45 ? CORAL : VIOLET, dead: false });
      spawn = api.rand(0.38, 0.72);
    }
    for (const bullet of bullets) bullet.y += bullet.vy * dt;
    for (const enemy of enemies) {
      enemy.phase += dt * 2;
      enemy.x += Math.sin(enemy.phase) * 42 * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.y - enemy.r > api.h) { enemy.dead = true; damage(); }
      if (!enemy.dead && invulnerable <= 0 && api.circleHit(player, enemy, -3)) { enemy.dead = true; damage(); }
      for (const bullet of bullets) {
        if (bullet.dead || enemy.dead) continue;
        if (api.circleHit(bullet, enemy)) {
          bullet.dead = true;
          enemy.dead = true;
          kills += 1;
          api.setScore(kills * 75 + lives * 30);
          api.burst(enemy.x, enemy.y, enemy.color, 14, 145);
          api.sound('score', { intensity: 0.8, pitch: kills % 5, pan: enemy.x / api.w * 1.2 - 0.6 });
          if (kills >= target) api.finish(true, 'The patrol lane is clear and every signal is stable.');
        }
      }
    }
    bullets = bullets.filter((bullet) => bullet.y > 35 && !bullet.dead);
    enemies = enemies.filter((enemy) => !enemy.dead);
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    ctx.strokeStyle = api.rgba(api.config.accent, 0.22);
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(0, api.h - 46);
    ctx.lineTo(api.w, api.h - 46);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const bullet of bullets) {
      ctx.strokeStyle = '#e8fff7';
      ctx.shadowBlur = 14;
      ctx.shadowColor = api.config.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y + 12);
      ctx.lineTo(bullet.x, bullet.y - 7);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (const enemy of enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.phase * 0.4);
      ctx.fillStyle = enemy.color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = enemy.color;
      polygon(ctx, 0, 0, enemy.r, 6, Math.PI / 6);
      ctx.fill();
      ctx.fillStyle = '#0a1730';
      polygon(ctx, 0, 0, enemy.r * 0.42, 6, Math.PI / 6);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 12) % 2 ? 0.3 : 1;
    drawShip(ctx, player.x, player.y, 23, api.config.accent);
    ctx.globalAlpha = 1;
  }

  return {
    reset,
    update,
    draw,
    pointerMove(x) { player.targetX = x; },
    pointerDown() { fire(); },
    controlDown(controlName) { if (controlName === 'action') fire(); },
    status: () => `${kills}/${target} drones · ${lives} shields`
  };
}

function makeCatcher(api) {
  let basket;
  let drops;
  let caught;
  let target;
  let misses;
  let lives;
  let spawn;

  function reset() {
    target = 16 + (api.variant % 4) * 3;
    basket = { x: api.w / 2 - 52, y: api.h - 69, w: 104, h: 25, targetX: api.w / 2 };
    drops = [];
    caught = 0;
    misses = 0;
    lives = 3;
    spawn = 0.25;
    api.setScore(0);
    api.setGoal(`Catch ${target} bright drops. Avoid coral static and no more than five misses.`);
  }

  function update(dt) {
    const horizontal = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    if (api.input.pointer.inside) basket.targetX = api.input.pointer.x;
    else basket.targetX += horizontal * 500 * dt;
    basket.x += (api.clamp(basket.targetX - basket.w / 2, 8, api.w - basket.w - 8) - basket.x) * Math.min(1, dt * 15);
    spawn -= dt;
    if (spawn <= 0) {
      const bad = api.rand() < 0.22;
      drops.push({ x: api.rand(24, api.w - 24), y: 48, r: api.rand(10, 17), vy: api.rand(120, 205) + caught * 1.6, bad, phase: api.rand(0, TAU), dead: false });
      spawn = api.rand(0.34, 0.68);
    }
    for (const drop of drops) {
      drop.y += drop.vy * dt;
      drop.phase += dt * 3;
      const box = { x: drop.x - drop.r, y: drop.y - drop.r, w: drop.r * 2, h: drop.r * 2 };
      if (!drop.dead && api.rectHit(box, basket)) {
        drop.dead = true;
        if (drop.bad) {
          lives -= 1;
          api.burst(drop.x, drop.y, CORAL, 18, 150);
          api.sound('damage', { intensity: 0.9, pan: drop.x / api.w * 1.2 - 0.6 });
          if (lives <= 0) api.finish(false, 'Too much coral static reached the collection bowl.');
        } else {
          caught += 1;
          api.setScore(caught * 60 + lives * 25 - misses * 8);
          api.burst(drop.x, drop.y, api.config.accent, 12, 110);
          api.sound('pickup', { pitch: caught % 6, pan: drop.x / api.w * 1.2 - 0.6 });
          if (caught >= target) api.finish(true, 'The collection is full and every bright drop is secure.');
        }
      }
      if (!drop.dead && drop.y - drop.r > api.h) {
        drop.dead = true;
        if (!drop.bad) {
          misses += 1;
          api.sound('miss', { intensity: 0.55, pan: drop.x / api.w * 1.2 - 0.6 });
          if (misses >= 6) api.finish(false, 'Six bright drops slipped beyond the collection line.');
        }
      }
    }
    drops = drops.filter((drop) => !drop.dead);
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    for (const drop of drops) {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.rotate(drop.phase);
      const color = drop.bad ? CORAL : (drop.phase % 2 > 1 ? GOLD : api.config.accent);
      ctx.fillStyle = color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = color;
      if (drop.bad) polygon(ctx, 0, 0, drop.r, 4, Math.PI / 4);
      else polygon(ctx, 0, 0, drop.r, 6, Math.PI / 6);
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 24;
    ctx.shadowColor = api.config.accent;
    const gradient = ctx.createLinearGradient(basket.x, basket.y, basket.x, basket.y + basket.h);
    gradient.addColorStop(0, '#ecfff8');
    gradient.addColorStop(1, api.config.accent);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(basket.x, basket.y);
    ctx.lineTo(basket.x + basket.w, basket.y);
    ctx.lineTo(basket.x + basket.w * 0.84, basket.y + basket.h);
    ctx.lineTo(basket.x + basket.w * 0.16, basket.y + basket.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#10233d';
    ctx.fillRect(basket.x + 12, basket.y + 6, basket.w - 24, 4);
  }

  return {
    reset,
    update,
    draw,
    pointerMove(x) { basket.targetX = x; },
    status: () => `${caught}/${target} caught · ${misses}/6 missed`
  };
}

function makeMemory(api) {
  let cards;
  let columns;
  let rows;
  let cursor;
  let open;
  let pairs;
  let moves;
  let lock;
  let maxMoves;

  function layout() {
    const gap = api.w < api.h ? 11 : 13;
    const margin = api.w < api.h ? 34 : 95;
    const availableW = api.w - margin * 2 - gap * (columns - 1);
    const availableH = api.h - 145 - gap * (rows - 1);
    const size = Math.min(availableW / columns, availableH / rows, 112);
    const width = columns * size + gap * (columns - 1);
    const height = rows * size + gap * (rows - 1);
    return { gap, size, x: (api.w - width) / 2, y: (api.h - height) / 2 + 18 };
  }

  function reset() {
    columns = api.w < api.h ? 4 : 4;
    rows = 4;
    const values = Array.from({ length: 8 }, (_, index) => [index, index]).flat();
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(api.rand(0, i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    cards = values.map((value) => ({ value, face: false, matched: false }));
    cursor = 0;
    open = [];
    pairs = 0;
    moves = 0;
    lock = 0;
    maxMoves = 27 + (api.variant % 3) * 2;
    api.setScore(0);
    api.setGoal(`Match all 8 glyph pairs in ${maxMoves} moves or fewer.`);
  }

  function flip(index) {
    const card = cards[index];
    if (lock > 0 || !card || card.face || card.matched) return;
    card.face = true;
    open.push(index);
    api.sound('action', { pitch: card.value - 3, pan: index % columns / (columns - 1) * 1.1 - 0.55 });
    if (open.length === 2) {
      moves += 1;
      const [first, second] = open;
      if (cards[first].value === cards[second].value) {
        cards[first].matched = true;
        cards[second].matched = true;
        pairs += 1;
        open = [];
        api.setScore(pairs * 120 + Math.max(0, maxMoves - moves) * 6);
        const board = layout();
        const col = second % columns;
        const row = Math.floor(second / columns);
        api.burst(board.x + col * (board.size + board.gap) + board.size / 2, board.y + row * (board.size + board.gap) + board.size / 2, api.config.accent, 14, 110);
        api.sound('score', { pitch: cards[second].value, pan: col / (columns - 1) * 1.1 - 0.55 });
        if (pairs === 8) api.finish(true, `All glyphs paired in ${moves} moves.`);
      } else {
        lock = 0.78;
        api.sound('miss', { intensity: 0.7, pitch: cards[second].value - cards[first].value });
      }
    }
  }

  function update(dt) {
    if (lock > 0) {
      lock -= dt;
      if (lock <= 0) {
        for (const index of open) cards[index].face = false;
        open = [];
        if (moves >= maxMoves && pairs < 8) api.finish(false, 'The move limit closed before every pair was found.');
      }
    }
    if (api.tapped('left')) { cursor = (cursor % columns === 0) ? cursor + columns - 1 : cursor - 1; api.sound('move', { pan: -0.3, pitch: -1 }); }
    if (api.tapped('right')) { cursor = (cursor % columns === columns - 1) ? cursor - columns + 1 : cursor + 1; api.sound('move', { pan: 0.3, pitch: 1 }); }
    if (api.tapped('up')) { cursor = (cursor - columns + cards.length) % cards.length; api.sound('move', { pitch: 2 }); }
    if (api.tapped('down')) { cursor = (cursor + columns) % cards.length; api.sound('move', { pitch: -2 }); }
    if (api.tapped('action')) flip(cursor);
  }

  function drawGlyph(ctx, value, x, y, radius) {
    const colors = [MINT, VIOLET, CORAL, GOLD, CYAN, '#d7e1ff', '#f49be2', '#6ff2d4'];
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = colors[value];
    ctx.fillStyle = api.rgba(colors[value], 0.22);
    ctx.lineWidth = 4;
    ctx.shadowBlur = 16;
    ctx.shadowColor = colors[value];
    if (value % 4 === 0) {
      polygon(ctx, 0, 0, radius, 6, Math.PI / 6); ctx.fill(); ctx.stroke();
    } else if (value % 4 === 1) {
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, radius * 0.45, 0, TAU); ctx.stroke();
    } else if (value % 4 === 2) {
      polygon(ctx, 0, 0, radius, 4, Math.PI / 4); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.quadraticCurveTo(0, -radius * 1.25, radius, 0); ctx.quadraticCurveTo(0, radius * 1.25, -radius, 0); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const ctx = api.ctx;
    const board = layout();
    api.drawBackdrop('grid');
    cards.forEach((card, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = board.x + col * (board.size + board.gap);
      const y = board.y + row * (board.size + board.gap);
      const selected = index === cursor;
      ctx.shadowBlur = card.matched ? 18 : selected ? 14 : 0;
      ctx.shadowColor = card.matched ? api.config.accent : VIOLET;
      ctx.fillStyle = card.face || card.matched ? 'rgba(18,34,61,.96)' : 'rgba(34,39,84,.9)';
      ctx.strokeStyle = selected ? api.config.accent : card.matched ? api.rgba(api.config.accent, 0.55) : 'rgba(157,179,216,.19)';
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, board.size, board.size, Math.min(16, board.size * 0.18));
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (card.face || card.matched) drawGlyph(ctx, card.value, x + board.size / 2, y + board.size / 2, board.size * 0.24);
      else {
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath(); ctx.arc(x + board.size / 2, y + board.size / 2, board.size * 0.12, 0, TAU); ctx.fill();
      }
    });
  }

  return {
    reset,
    update,
    draw,
    pointerMove(x, y) {
      const board = layout();
      const col = Math.floor((x - board.x) / (board.size + board.gap));
      const row = Math.floor((y - board.y) / (board.size + board.gap));
      if (col >= 0 && col < columns && row >= 0 && row < rows) cursor = row * columns + col;
    },
    pointerDown(x, y) {
      this.pointerMove(x, y);
      flip(cursor);
    },
    controlDown(controlName) { if (controlName === 'action') flip(cursor); },
    status: () => `${pairs}/8 pairs · ${moves}/${maxMoves} moves`
  };
}

function makePong(api) {
  let player;
  let rival;
  let ball;
  let playerScore;
  let rivalScore;
  let rally;
  let target;

  function resetBall(direction = 1) {
    ball = { x: api.w / 2, y: api.h / 2, r: 9, vx: direction * api.rand(270, 330), vy: api.rand(-180, 180) };
    rally = 0;
  }

  function reset() {
    target = 5 + (api.variant % 3);
    player = { x: 42, y: api.h / 2 - 52, w: 15, h: 104, targetY: api.h / 2 };
    rival = { x: api.w - 57, y: api.h / 2 - 52, w: 15, h: 104 };
    playerScore = 0;
    rivalScore = 0;
    resetBall(api.rand() > 0.5 ? 1 : -1);
    api.setScore(0);
    api.setGoal(`First to ${target} points wins the pulse rally.`);
  }

  function update(dt) {
    const vertical = (api.pressed('down') ? 1 : 0) - (api.pressed('up') ? 1 : 0);
    if (api.input.pointer.inside) player.targetY = api.input.pointer.y;
    else player.targetY += vertical * 470 * dt;
    player.y += (api.clamp(player.targetY - player.h / 2, 55, api.h - player.h - 18) - player.y) * Math.min(1, dt * 15);
    const rivalTarget = ball.y - rival.h / 2;
    const aiSpeed = 250 + (api.variant % 4) * 22;
    rival.y += api.clamp(rivalTarget - rival.y, -aiSpeed * dt, aiSpeed * dt);
    rival.y = api.clamp(rival.y, 55, api.h - rival.h - 18);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.y < 62 + ball.r) { ball.y = 62 + ball.r; ball.vy = Math.abs(ball.vy); api.sound('impact', { intensity: 0.45, pitch: -2, pan: ball.x / api.w * 1.2 - 0.6 }); }
    if (ball.y > api.h - ball.r - 14) { ball.y = api.h - ball.r - 14; ball.vy = -Math.abs(ball.vy); api.sound('impact', { intensity: 0.45, pitch: -2, pan: ball.x / api.w * 1.2 - 0.6 }); }
    for (const paddle of [player, rival]) {
      if (ball.x + ball.r > paddle.x && ball.x - ball.r < paddle.x + paddle.w && ball.y > paddle.y && ball.y < paddle.y + paddle.h) {
        const direction = paddle === player ? 1 : -1;
        ball.x = paddle === player ? paddle.x + paddle.w + ball.r : paddle.x - ball.r;
        const offset = (ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
        ball.vx = direction * Math.min(610, Math.abs(ball.vx) * 1.055 + 7);
        ball.vy = api.clamp(ball.vy + offset * 160, -430, 430);
        rally += 1;
        api.burst(ball.x, ball.y, paddle === player ? api.config.accent : VIOLET, 6, 70);
        api.sound('impact', { intensity: 0.8, pitch: Math.min(7, rally * 0.45), pan: paddle === player ? -0.55 : 0.55 });
      }
    }
    if (ball.x < -30) {
      rivalScore += 1;
      api.sound('damage', { intensity: 0.75, pan: -0.55 });
      if (rivalScore >= target) api.finish(false, 'The mirror paddle reached the match target first.');
      else resetBall(1);
    }
    if (ball.x > api.w + 30) {
      playerScore += 1;
      api.setScore(playerScore * 120 + rally * 4);
      api.sound('score', { pitch: playerScore * 1.5, pan: 0.45 });
      if (playerScore >= target) api.finish(true, 'Match point secured with a clean final return.');
      else resetBall(-1);
    }
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    ctx.setLineDash([10, 12]);
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.beginPath(); ctx.moveTo(api.w / 2, 60); ctx.lineTo(api.w / 2, api.h - 15); ctx.stroke();
    ctx.setLineDash([]);
    for (const [paddle, color] of [[player, api.config.accent], [rival, VIOLET]]) {
      ctx.shadowBlur = 22; ctx.shadowColor = color; ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8); ctx.fill();
    }
    ctx.shadowBlur = 0;
    glowCircle(ctx, ball.x, ball.y, ball.r, '#f8ffe8');
    ctx.textAlign = 'center';
    ctx.font = '900 42px system-ui';
    ctx.fillStyle = api.rgba(api.config.accent, 0.46); ctx.fillText(playerScore, api.w * 0.43, 105);
    ctx.fillStyle = 'rgba(139,114,255,.46)'; ctx.fillText(rivalScore, api.w * 0.57, 105);
  }

  return {
    reset,
    update,
    draw,
    pointerMove(_x, y) { player.targetY = y; },
    status: () => `${playerScore}–${rivalScore} · first to ${target}`
  };
}

function makeMaze(api) {
  const N = 1, E = 2, S = 4, W = 8;
  let cols;
  let rows;
  let cells;
  let player;
  let exit;
  let trace;
  let steps;
  let remaining;
  let cellSize;
  let boardX;
  let boardY;

  function index(c, r) { return r * cols + c; }

  function generate() {
    cells = Array(cols * rows).fill(N | E | S | W);
    const visited = new Set([0]);
    const stack = [{ c: 0, r: 0 }];
    const directions = [
      { dc: 0, dr: -1, wall: N, other: S },
      { dc: 1, dr: 0, wall: E, other: W },
      { dc: 0, dr: 1, wall: S, other: N },
      { dc: -1, dr: 0, wall: W, other: E }
    ];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const options = directions.filter(({ dc, dr }) => {
        const nc = current.c + dc, nr = current.r + dr;
        return nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited.has(index(nc, nr));
      });
      if (!options.length) { stack.pop(); continue; }
      const choice = options[Math.floor(api.rand(0, options.length))];
      const nc = current.c + choice.dc, nr = current.r + choice.dr;
      cells[index(current.c, current.r)] &= ~choice.wall;
      cells[index(nc, nr)] &= ~choice.other;
      visited.add(index(nc, nr));
      stack.push({ c: nc, r: nr });
    }
  }

  function measure() {
    cols = api.w < api.h ? 11 : 17;
    rows = api.w < api.h ? 17 : 11;
    cellSize = Math.floor(Math.min((api.w - 38) / cols, (api.h - 116) / rows));
    boardX = Math.round((api.w - cols * cellSize) / 2);
    boardY = Math.round((api.h - rows * cellSize) / 2 + 17);
  }

  function reset() {
    measure();
    generate();
    player = { c: 0, r: 0 };
    exit = { c: cols - 1, r: rows - 1 };
    trace = [{ ...player }];
    steps = 0;
    remaining = 58 - (api.variant % 4) * 3;
    api.setScore(0);
    api.setGoal(`Reach the far beacon before the ${remaining}-second lumen timer fades.`);
  }

  function move(dc, dr, wall) {
    const current = cells[index(player.c, player.r)];
    if (current & wall) {
      api.sound('miss', { intensity: 0.55, pan: dc * 0.3, pitch: dr < 0 ? 2 : -1 });
      return;
    }
    player.c += dc;
    player.r += dr;
    steps += 1;
    trace.push({ ...player });
    api.sound('move', { pan: dc * 0.3, pitch: dr < 0 ? 2 : dr > 0 ? -2 : dc });
    api.setScore(Math.max(1, 1000 - steps * 4 + Math.floor(remaining * 3)));
    if (player.c === exit.c && player.r === exit.r) api.finish(true, `Beacon reached in ${steps} careful steps.`);
  }

  function moveNamed(name) {
    if (name === 'left') move(-1, 0, W);
    if (name === 'right') move(1, 0, E);
    if (name === 'up') move(0, -1, N);
    if (name === 'down') move(0, 1, S);
  }

  function update(dt) {
    remaining -= dt;
    if (remaining <= 0) { api.finish(false, 'The lumen timer faded before the exit beacon was reached.'); return; }
    for (const direction of ['left', 'right', 'up', 'down']) if (api.tapped(direction)) moveNamed(direction);
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('grid');
    ctx.fillStyle = 'rgba(3,10,24,.55)';
    ctx.beginPath();
    ctx.roundRect(boardX - 10, boardY - 10, cols * cellSize + 20, rows * cellSize + 20, 18);
    ctx.fill();
    ctx.lineWidth = Math.max(2, cellSize * 0.075);
    ctx.strokeStyle = api.rgba(api.config.accent, 0.68);
    ctx.shadowBlur = 7;
    ctx.shadowColor = api.config.accent;
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
      const walls = cells[index(c, r)];
      const x = boardX + c * cellSize, y = boardY + r * cellSize;
      ctx.beginPath();
      if (walls & N) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
      if (walls & E) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
      if (walls & S) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); }
      if (walls & W) { ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = api.rgba(VIOLET, 0.32);
    ctx.lineWidth = Math.max(2, cellSize * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    trace.forEach((point, i) => {
      const x = boardX + (point.c + 0.5) * cellSize, y = boardY + (point.r + 0.5) * cellSize;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    glowCircle(ctx, boardX + (exit.c + 0.5) * cellSize, boardY + (exit.r + 0.5) * cellSize, cellSize * 0.25, GOLD);
    const px = boardX + (player.c + 0.5) * cellSize, py = boardY + (player.r + 0.5) * cellSize;
    ctx.fillStyle = '#edfff9';
    ctx.shadowBlur = 18; ctx.shadowColor = api.config.accent;
    polygon(ctx, px, py, cellSize * 0.28, 4, Math.PI / 4); ctx.fill(); ctx.shadowBlur = 0;
  }

  return {
    reset,
    update,
    draw,
    pointerDown(x, y) {
      const px = boardX + (player.c + 0.5) * cellSize;
      const py = boardY + (player.r + 0.5) * cellSize;
      if (Math.abs(x - px) > Math.abs(y - py)) moveNamed(x < px ? 'left' : 'right');
      else moveNamed(y < py ? 'up' : 'down');
    },
    status: () => `${Math.max(0, Math.ceil(remaining))}s · ${steps} steps`
  };
}

function makeRunner(api) {
  let player;
  let obstacles;
  let coins;
  let spawn;
  let distanceRun;
  let lives;
  let invulnerable;
  let target;
  let ground;
  let scroll;

  function reset() {
    ground = api.h - 105;
    player = { x: api.w * 0.2, y: ground - 34, w: 31, h: 34, vy: 0, grounded: true };
    obstacles = [];
    coins = [];
    spawn = 0.8;
    distanceRun = 0;
    lives = 3;
    invulnerable = 0;
    target = 1200 + (api.variant % 4) * 170;
    scroll = 0;
    api.setScore(0);
    api.setGoal(`Run ${target} m. Jump coral barriers and collect floating flux.`);
  }

  function jump() {
    if (player.grounded) {
      player.vy = api.variant % 4 === 3 ? -610 : -690;
      player.grounded = false;
      api.burst(player.x + player.w / 2, ground, api.config.accent, 8, 95);
      api.sound('action', { intensity: 0.9, pan: -0.25 });
    }
  }

  function update(dt) {
    if (api.tapped('action') || api.tapped('up') || api.tapped('pointer')) jump();
    invulnerable = Math.max(0, invulnerable - dt);
    const speed = 285 + Math.min(120, distanceRun * 0.05);
    api.sound('motion', { level: api.clamp((speed - 260) / 170, 0, 1) });
    distanceRun += speed * dt * 0.32;
    scroll = (scroll + speed * dt) % 90;
    player.vy += (api.variant % 4 === 3 ? 980 : 1320) * dt;
    player.y += player.vy * dt;
    if (player.y + player.h >= ground) {
      if (!player.grounded) api.sound('impact', { intensity: 0.5, pan: -0.25 });
      player.y = ground - player.h;
      player.vy = 0;
      player.grounded = true;
    }
    spawn -= dt;
    if (spawn <= 0) {
      const height = api.rand(28, 65);
      obstacles.push({ x: api.w + 30, y: ground - height, w: api.rand(28, 48), h: height, dead: false });
      if (api.rand() > 0.38) coins.push({ x: api.w + api.rand(80, 170), y: ground - api.rand(85, 170), r: 10, dead: false, phase: api.rand(0, TAU) });
      spawn = api.rand(0.85, 1.42);
    }
    const playerBox = { x: player.x + 4, y: player.y + 3, w: player.w - 8, h: player.h - 3 };
    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
      if (!obstacle.dead && invulnerable <= 0 && api.rectHit(playerBox, obstacle)) {
        obstacle.dead = true;
        lives -= 1;
        invulnerable = 1.15;
        api.burst(player.x, player.y, CORAL, 20, 165);
        api.sound('damage', { intensity: 1, pan: -0.3 });
        if (lives <= 0) api.finish(false, 'The final shield broke against the running line.');
      }
    }
    for (const coin of coins) {
      coin.x -= speed * dt;
      coin.phase += dt * 3;
      if (!coin.dead && api.circleHit({ x: player.x + player.w / 2, y: player.y + player.h / 2, r: 18 }, coin)) {
        coin.dead = true;
        distanceRun += 40;
        api.burst(coin.x, coin.y, GOLD, 12, 105);
        api.sound('pickup', { pitch: Math.round(distanceRun / 40) % 6, pan: coin.x / api.w * 1.2 - 0.6 });
      }
    }
    obstacles = obstacles.filter((item) => !item.dead && item.x + item.w > -30);
    coins = coins.filter((item) => !item.dead && item.x + item.r > -30);
    api.setScore(distanceRun);
    if (distanceRun >= target) api.finish(true, 'The finish beacon flashed beneath a perfect final bound.');
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('lanes');
    ctx.fillStyle = 'rgba(6,16,28,.78)';
    ctx.beginPath();
    ctx.moveTo(0, api.h * 0.66);
    for (let x = 0; x <= api.w + 80; x += 78) ctx.lineTo(x - scroll * 0.25, api.h * 0.62 - ((x / 78) % 4) * 24);
    ctx.lineTo(api.w, ground); ctx.lineTo(0, ground); ctx.fill();
    ctx.fillStyle = '#dce8ef';
    ctx.fillRect(0, ground, api.w, 8);
    ctx.fillStyle = '#304a5d';
    ctx.fillRect(0, ground + 8, api.w, api.h - ground);
    for (let x = -90; x < api.w + 90; x += 90) {
      ctx.fillStyle = api.rgba(api.config.accent, 0.14);
      ctx.fillRect(x - scroll, ground + 30, 52, 4);
    }
    for (const obstacle of obstacles) {
      ctx.shadowBlur = 15; ctx.shadowColor = CORAL; ctx.fillStyle = CORAL;
      ctx.beginPath(); ctx.roundRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(7,17,31,.38)'; ctx.fillRect(obstacle.x + 7, obstacle.y + 8, obstacle.w - 14, 5);
    }
    for (const coin of coins) {
      ctx.save(); ctx.translate(coin.x, coin.y); ctx.rotate(coin.phase); ctx.fillStyle = GOLD; ctx.shadowBlur = 18; ctx.shadowColor = GOLD;
      polygon(ctx, 0, 0, coin.r, 4, Math.PI / 4); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 12) % 2 ? 0.3 : 1;
    ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h / 2); ctx.rotate(player.vy * 0.00035);
    ctx.shadowBlur = 22; ctx.shadowColor = api.config.accent; ctx.fillStyle = '#edf8ff';
    ctx.beginPath(); ctx.roundRect(-player.w / 2, -player.h / 2, player.w, player.h, 12); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#10233d'; ctx.beginPath(); ctx.arc(7, -4, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = api.config.accent; ctx.beginPath(); ctx.arc(8, -5, 1.8, 0, TAU); ctx.fill(); ctx.restore();
    ctx.globalAlpha = 1;
  }

  return {
    reset,
    update,
    draw,
    pointerDown: jump,
    controlDown(controlName) { if (controlName === 'action' || controlName === 'up') jump(); },
    status: () => `${Math.min(target, Math.floor(distanceRun))}/${target}m · ${lives} shields`
  };
}

function makeDefense(api) {
  let core;
  let angle;
  let bullets;
  let enemies;
  let kills;
  let target;
  let lives;
  let spawn;
  let cooldown;

  function reset() {
    core = { x: api.w / 2, y: api.h * 0.74, r: 29 };
    angle = -Math.PI / 2;
    bullets = [];
    enemies = [];
    kills = 0;
    target = 20 + (api.variant % 4) * 4;
    lives = 3;
    spawn = 0.35;
    cooldown = 0;
    api.setScore(0);
    api.setGoal(`Defend the core and clear ${target} incoming vectors.`);
  }

  function aimAt(x, y) {
    angle = Math.atan2(y - core.y, x - core.x);
  }

  function fire() {
    if (cooldown > 0) return;
    bullets.push({ x: core.x + Math.cos(angle) * 35, y: core.y + Math.sin(angle) * 35, vx: Math.cos(angle) * 520, vy: Math.sin(angle) * 520, r: 4 });
    cooldown = 0.15;
    api.sound('action', { pan: Math.cos(angle) * 0.55, pitch: api.rand(-1, 1) });
  }

  function addEnemy() {
    let x;
    let y;
    if (api.rand() > 0.5) { x = api.rand(25, api.w - 25); y = 55; }
    else { x = api.rand() > 0.5 ? 18 : api.w - 18; y = api.rand(80, api.h * 0.55); }
    enemies.push({ x, y, r: api.rand(13, 21), speed: api.rand(55, 90) + kills * 0.9, phase: api.rand(0, TAU), dead: false });
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    const rotate = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    angle += rotate * 2.7 * dt;
    if (api.input.pointer.inside) aimAt(api.input.pointer.x, api.input.pointer.y);
    if (api.pressed('action') || api.input.pointer.down) fire();
    spawn -= dt;
    if (spawn <= 0) { addEnemy(); spawn = Math.max(0.28, api.rand(0.55, 0.88) - kills * 0.004); }
    for (const bullet of bullets) { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; }
    for (const enemy of enemies) {
      const dx = core.x - enemy.x, dy = core.y - enemy.y, d = Math.max(1, Math.hypot(dx, dy));
      enemy.x += dx / d * enemy.speed * dt;
      enemy.y += dy / d * enemy.speed * dt;
      enemy.phase += dt * 2;
      if (!enemy.dead && d < core.r + enemy.r) {
        enemy.dead = true;
        lives -= 1;
        api.burst(core.x, core.y, CORAL, 22, 165);
        api.sound('damage', { intensity: 1.05, pan: (enemy.x / api.w - 0.5) * 1.1 });
        if (lives <= 0) api.finish(false, 'The vector wave reached the unshielded core.');
      }
      for (const bullet of bullets) {
        if (bullet.dead || enemy.dead) continue;
        if (api.circleHit(bullet, enemy)) {
          bullet.dead = true;
          enemy.dead = true;
          kills += 1;
          api.setScore(kills * 85 + lives * 35);
          api.burst(enemy.x, enemy.y, api.config.accent, 13, 135);
          api.sound('score', { intensity: 0.78, pitch: kills % 6, pan: enemy.x / api.w * 1.2 - 0.6 });
          if (kills >= target) api.finish(true, 'The full vector wave dissolved before reaching the core.');
        }
      }
    }
    bullets = bullets.filter((bullet) => !bullet.dead && bullet.x > -30 && bullet.x < api.w + 30 && bullet.y > 30 && bullet.y < api.h + 30);
    enemies = enemies.filter((enemy) => !enemy.dead);
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('orbit');
    for (const bullet of bullets) glowCircle(ctx, bullet.x, bullet.y, bullet.r, '#effff8');
    for (const enemy of enemies) {
      ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.rotate(enemy.phase); ctx.shadowBlur = 16; ctx.shadowColor = CORAL; ctx.fillStyle = CORAL;
      polygon(ctx, 0, 0, enemy.r, 3, -Math.PI / 2); ctx.fill();
      ctx.fillStyle = '#251329'; polygon(ctx, 0, 0, enemy.r * 0.38, 3, -Math.PI / 2); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.translate(core.x, core.y); ctx.strokeStyle = api.rgba(api.config.accent, 0.28); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.stroke();
    glowCircle(ctx, 0, 0, core.r, api.config.accent);
    ctx.rotate(angle); ctx.fillStyle = '#e9fff8'; ctx.shadowBlur = 16; ctx.shadowColor = api.config.accent;
    ctx.beginPath(); ctx.roundRect(10, -7, 42, 14, 7); ctx.fill(); ctx.restore();
  }

  return {
    reset,
    update,
    draw,
    pointerMove: aimAt,
    pointerDown(x, y) { aimAt(x, y); fire(); },
    controlDown(controlName) { if (controlName === 'action') fire(); },
    status: () => `${kills}/${target} cleared · ${lives} core shields`
  };
}

function makeOrbit(api) {
  let center;
  let rings;
  let ringIndex;
  let angle;
  let nodes;
  let mines;
  let collected;
  let target;
  let lives;
  let invulnerable;
  let remaining;

  function position(item) {
    return {
      x: center.x + Math.cos(item.angle) * rings[item.ring],
      y: center.y + Math.sin(item.angle) * rings[item.ring]
    };
  }

  function spawnNode() {
    nodes.push({ ring: Math.floor(api.rand(0, rings.length)), angle: api.rand(0, TAU), r: 10 });
  }

  function reset() {
    center = { x: api.w / 2, y: api.h / 2 + 14 };
    const min = Math.min(api.w, api.h);
    rings = [min * 0.18, min * 0.29, min * 0.4];
    ringIndex = 1;
    angle = -Math.PI / 2;
    nodes = [];
    mines = [];
    for (let i = 0; i < 3; i += 1) spawnNode();
    for (let i = 0; i < 5 + (api.variant % 3); i += 1) mines.push({ ring: Math.floor(api.rand(0, 3)), angle: api.rand(0, TAU), r: 11, phase: api.rand(0, TAU) });
    collected = 0;
    target = 12 + (api.variant % 4) * 2;
    lives = 3;
    invulnerable = 0;
    remaining = 52;
    api.setScore(0);
    api.setGoal(`Harvest ${target} orbital nodes in 52 seconds. Avoid coral fragments.`);
  }

  function shift(direction = 1) {
    ringIndex = (ringIndex + direction + rings.length) % rings.length;
    api.burst(...Object.values(position({ ring: ringIndex, angle })), api.config.accent, 7, 70);
    api.sound('action', { pitch: ringIndex * 2, pan: direction * 0.28 });
  }

  function update(dt) {
    remaining -= dt;
    invulnerable = Math.max(0, invulnerable - dt);
    if (remaining <= 0) { api.finish(false, 'The orbital window closed before the harvest was complete.'); return; }
    if (api.tapped('up')) shift(-1);
    if (api.tapped('down') || api.tapped('action')) shift(1);
    const adjust = (api.pressed('right') ? 1 : 0) - (api.pressed('left') ? 1 : 0);
    angle += (0.92 + adjust * 0.62) * dt;
    const playerPos = position({ ring: ringIndex, angle });
    for (const node of nodes) {
      const point = position(node);
      if (!node.dead && Math.hypot(point.x - playerPos.x, point.y - playerPos.y) < 23) {
        node.dead = true;
        collected += 1;
        api.setScore(collected * 90 + Math.floor(remaining * 2));
        api.burst(point.x, point.y, GOLD, 14, 115);
        api.sound('pickup', { pitch: collected % 7, pan: point.x / api.w * 1.2 - 0.6 });
        if (collected >= target) { api.finish(true, 'Every required halo spark is safely in orbit.'); return; }
        spawnNode();
      }
    }
    nodes = nodes.filter((node) => !node.dead);
    for (const mine of mines) {
      mine.angle -= dt * (0.18 + mine.ring * 0.05);
      mine.phase += dt * 2;
      const point = position(mine);
      if (invulnerable <= 0 && Math.hypot(point.x - playerPos.x, point.y - playerPos.y) < 23) {
        lives -= 1;
        invulnerable = 1.2;
        mine.angle += Math.PI * 0.7;
        api.burst(point.x, point.y, CORAL, 20, 155);
        api.sound('damage', { intensity: 0.95, pan: point.x / api.w * 1.2 - 0.6 });
        if (lives <= 0) api.finish(false, 'The orbit destabilized after the final shield impact.');
      }
    }
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('orbit');
    ctx.save();
    ctx.translate(center.x, center.y);
    rings.forEach((radius, index) => {
      ctx.strokeStyle = index === ringIndex ? api.rgba(api.config.accent, 0.65) : 'rgba(188,208,235,.18)';
      ctx.lineWidth = index === ringIndex ? 3 : 1.5;
      ctx.setLineDash(index === ringIndex ? [] : [8, 9]);
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
    });
    ctx.setLineDash([]);
    glowCircle(ctx, 0, 0, rings[0] * 0.34, api.mixColor(api.config.accent, VIOLET, 0.45));
    ctx.restore();
    for (const node of nodes) {
      const point = position(node);
      ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(angle * 0.7); ctx.fillStyle = GOLD; ctx.shadowBlur = 18; ctx.shadowColor = GOLD;
      polygon(ctx, 0, 0, node.r, 4, Math.PI / 4); ctx.fill(); ctx.restore();
    }
    for (const mine of mines) {
      const point = position(mine);
      ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(mine.phase); ctx.fillStyle = CORAL; ctx.shadowBlur = 15; ctx.shadowColor = CORAL;
      polygon(ctx, 0, 0, mine.r, 3, -Math.PI / 2); ctx.fill(); ctx.restore();
    }
    const playerPos = position({ ring: ringIndex, angle });
    ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 12) % 2 ? 0.3 : 1;
    glowCircle(ctx, playerPos.x, playerPos.y, 13, '#edfff7');
    ctx.fillStyle = api.config.accent; ctx.beginPath(); ctx.arc(playerPos.x, playerPos.y, 6, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  return {
    reset,
    update,
    draw,
    pointerDown(x, y) {
      const radial = Math.hypot(x - center.x, y - center.y);
      let closest = 0;
      for (let i = 1; i < rings.length; i += 1) if (Math.abs(rings[i] - radial) < Math.abs(rings[closest] - radial)) closest = i;
      if (closest !== ringIndex) {
        const direction = Math.sign(closest - ringIndex);
        ringIndex = closest;
        api.sound('action', { pitch: ringIndex * 2, pan: direction * 0.28 });
      }
    },
    status: () => `${collected}/${target} nodes · ${Math.max(0, Math.ceil(remaining))}s`
  };
}

function makeStacker(api) {
  let blocks;
  let moving;
  let placed;
  let target;
  let misses;
  let blockHeight;
  let speed;

  function newMoving(width, y) {
    moving = { x: 0, y, w: width, h: blockHeight, direction: 1, color: [api.config.accent, VIOLET, CORAL, GOLD][placed % 4] };
  }

  function reset() {
    blockHeight = api.w < api.h ? 32 : 28;
    const baseWidth = api.w < api.h ? api.w * 0.56 : api.w * 0.34;
    const base = { x: (api.w - baseWidth) / 2, y: api.h - 72, w: baseWidth, h: blockHeight, color: '#445a73' };
    blocks = [base];
    placed = 0;
    target = 10 + (api.variant % 4);
    misses = 0;
    speed = 220 + (api.variant % 4) * 22;
    newMoving(base.w, base.y - blockHeight - 3);
    api.setScore(0);
    api.setGoal(`Stack ${target} clean floors before three placement misses.`);
  }

  function drop() {
    api.sound('action', { pan: moving.x / api.w * 1.2 - 0.6 });
    const top = blocks[blocks.length - 1];
    const left = Math.max(moving.x, top.x);
    const right = Math.min(moving.x + moving.w, top.x + top.w);
    const overlap = right - left;
    if (overlap <= 0) {
      misses += 1;
      api.burst(moving.x + moving.w / 2, moving.y + blockHeight / 2, CORAL, 16, 150);
      api.sound('miss', { intensity: 0.95, pan: moving.x / api.w * 1.2 - 0.6 });
      if (misses >= 3) { api.finish(false, 'Three floors missed the tower footprint.'); return; }
      newMoving(top.w, top.y - blockHeight - 3);
      return;
    }
    const block = { x: left, y: moving.y, w: overlap, h: blockHeight, color: moving.color };
    blocks.push(block);
    placed += 1;
    api.setScore(placed * 110 + Math.floor(overlap));
    api.burst(block.x + block.w / 2, block.y + blockHeight / 2, block.color, 9, 75);
    api.sound('score', { pitch: Math.min(9, placed), pan: block.x / api.w * 1.2 - 0.6 });
    if (placed >= target) { api.finish(true, 'The final floor locked into a beautifully narrow skyline.'); return; }
    speed += 13;
    newMoving(block.w, block.y - blockHeight - 3);
  }

  function update(dt) {
    moving.x += moving.direction * speed * dt;
    if (moving.x <= 0) { moving.x = 0; moving.direction = 1; }
    if (moving.x + moving.w >= api.w) { moving.x = api.w - moving.w; moving.direction = -1; }
    if (api.tapped('action') || api.tapped('pointer')) drop();
  }

  function draw() {
    const ctx = api.ctx;
    api.drawBackdrop('lanes');
    ctx.fillStyle = 'rgba(3,10,22,.38)';
    ctx.fillRect(0, api.h - 45, api.w, 45);
    blocks.forEach((block, index) => {
      ctx.shadowBlur = index === blocks.length - 1 ? 16 : 7;
      ctx.shadowColor = block.color;
      const gradient = ctx.createLinearGradient(block.x, block.y, block.x + block.w, block.y + block.h);
      gradient.addColorStop(0, api.mixColor(block.color, '#ffffff', 0.22));
      gradient.addColorStop(1, api.mixColor(block.color, '#07111f', 0.25));
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.roundRect(block.x, block.y, block.w, block.h, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.stroke();
    });
    ctx.shadowBlur = 20; ctx.shadowColor = moving.color; ctx.fillStyle = moving.color;
    ctx.beginPath(); ctx.roundRect(moving.x, moving.y, moving.w, moving.h, 6); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = api.rgba(moving.color, 0.42); ctx.setLineDash([7, 8]);
    ctx.beginPath(); ctx.moveTo(moving.x, moving.y + moving.h + 6); ctx.lineTo(moving.x + moving.w, moving.y + moving.h + 6); ctx.stroke(); ctx.setLineDash([]);
  }

  return {
    reset,
    update,
    draw,
    status: () => `${placed}/${target} floors · ${misses}/3 misses`
  };
}

const FACTORIES = {
  dodger: makeDodger,
  'lane-racer': makeLaneRacer,
  snake: makeSnake,
  breakout: makeBreakout,
  shooter: makeShooter,
  catcher: makeCatcher,
  memory: makeMemory,
  pong: makePong,
  maze: makeMaze,
  runner: makeRunner,
  defense: makeDefense,
  orbit: makeOrbit,
  stacker: makeStacker
};

export function createMode(mode, api) {
  const factory = FACTORIES[mode];
  if (!factory) throw new Error(`Unsupported arcade mode: ${mode}`);
  return factory(api);
}

export const arcadeModes = Object.freeze(Object.keys(FACTORIES));
