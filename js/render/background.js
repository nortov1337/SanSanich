'use strict';

/* =========================================================
   background.js — небо, луна, параллакс
   ========================================================= */

const STARS = (() => {
  const rng = mulberry32(777);
  return Array.from({ length: 190 }, () => ({
    x: rng(),
    y: rng() * 0.62,
    r: 0.5 + rng() * 1.5,
    phase: rng() * TAU
  }));
})();

Render.background = function (ctx, game, camX) {
  drawSky(ctx, game, camX);
  drawParallax(ctx, game, camX);
};

function drawSky(ctx, game, camX) {
  const g = ctx.createLinearGradient(0, 0, 0, GAME_H);
  g.addColorStop(0, '#07050f');
  g.addColorStop(0.4, '#180f2c');
  g.addColorStop(0.72, '#351b3f');
  g.addColorStop(1, '#5a2b46');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const t = game.time;
  for (const s of STARS) {
    let x = (s.x * 2200 - camX * 0.035) % 2200;
    if (x < 0) x += 2200;
    x -= 280;
    if (x < -10 || x > GAME_W + 10) continue;
    const y = s.y * 400 + 10;
    const alpha = 0.28 + Math.sin(t * 1.4 + s.phase) * 0.22;
    ctx.fillStyle = 'rgba(226,216,255,' + alpha.toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, TAU);
    ctx.fill();
  }

  const mx = 1040;
  const my = 132;
  const halo = ctx.createRadialGradient(mx, my, 20, mx, my, 200);
  halo.addColorStop(0, 'rgba(255,225,240,0.22)');
  halo.addColorStop(0.5, 'rgba(220,170,230,0.08)');
  halo.addColorStop(1, 'rgba(220,170,230,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(mx, my, 200, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.fillStyle = '#f4e7f2';
  ctx.beginPath();
  ctx.arc(mx, my, 56, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(200,180,210,0.55)';
  [[-16, -12, 11], [12, 8, 14], [-4, 22, 7], [24, -20, 6]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, r, 0, TAU);
    ctx.fill();
  });
  ctx.restore();
}

function drawParallax(ctx, game, camX) {
  drawHills(ctx, camX * 0.07, 500, 58, '#1c1233', 0.9);
  drawHills(ctx, camX * 0.14, 545, 42, '#140d26', 2.3);

  drawTreeLayer(ctx, camX, 0.26, 560, '#1a1130', 230, 120, 240, 11, 9);
  drawTreeLayer(ctx, camX, 0.46, 578, '#100b20', 165, 80, 170, 37, 7);

  drawBushLayer(ctx, camX * 0.7);

  const fog = ctx.createLinearGradient(0, 470, 0, 700);
  fog.addColorStop(0, 'rgba(120,70,160,0)');
  fog.addColorStop(0.55, 'rgba(120,70,160,0.14)');
  fog.addColorStop(1, 'rgba(90,50,130,0.26)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 470, GAME_W, 250);

  for (let i = 0; i < 3; i++) {
    const x = ((game.time * (6 + i * 3) + i * 420) % (GAME_W + 500)) - 250;
    const y = 520 + i * 42;
    const r = 190 + i * 60;
    const fg = ctx.createRadialGradient(x, y, 10, x, y, r);
    fg.addColorStop(0, 'rgba(190,160,255,0.05)');
    fg.addColorStop(1, 'rgba(190,160,255,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.36, 0, 0, TAU);
    ctx.fill();
  }
}

function drawHills(ctx, offset, baseY, height, color, seed) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, GAME_H);
  for (let x = 0; x <= GAME_W + 20; x += 20) {
    const wx = x + offset;
    const y = baseY - Math.sin(wx * 0.0035 + seed) * height - Math.sin(wx * 0.0012 + seed * 2.1) * height * 1.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(GAME_W, GAME_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTreeLayer(ctx, camX, parallax, baseY, color, spacing, minH, maxH, seed, width) {
  const offset = camX * parallax;
  const start = Math.floor((offset - 250) / spacing);
  const end = Math.ceil((offset + GAME_W + 250) / spacing);

  for (let i = start; i <= end; i++) {
    const rng = mulberry32(seed * 1000 + i * 7919);
    const x = i * spacing + rng() * spacing * 0.85 - offset;
    if (x < -160 || x > GAME_W + 160) continue;
    const h = lerp(minH, maxH, rng());
    drawDeadTree(ctx, x, baseY, h, rng, color, width);
  }
}

function drawDeadTree(ctx, x, baseY, h, rng, color, width) {
  const lean = (rng() - 0.5) * 46;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.25, baseY - h * 0.55, x + lean, baseY - h);
  ctx.stroke();

  const branches = 4;
  for (let b = 1; b <= branches; b++) {
    const t = 0.3 + b * 0.16;
    const bx = x + lean * t;
    const by = baseY - h * t;
    const dir = b % 2 === 0 ? 1 : -1;
    const len = h * (0.2 + rng() * 0.18);
    ctx.lineWidth = Math.max(2, width * 0.5);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + dir * len * 0.55, by - len * 0.35, bx + dir * len, by - len * 0.72);
    ctx.stroke();
    if (b > 2) {
      ctx.lineWidth = Math.max(1, width * 0.28);
      ctx.beginPath();
      ctx.moveTo(bx + dir * len * 0.5, by - len * 0.35);
      ctx.lineTo(bx + dir * len * 0.62, by - len * 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBushLayer(ctx, offset) {
  const spacing = 70;
  const start = Math.floor((offset - 120) / spacing);
  const end = Math.ceil((offset + GAME_W + 120) / spacing);
  ctx.save();
  ctx.fillStyle = '#0b0816';
  for (let i = start; i <= end; i++) {
    const rng = mulberry32(500 + i * 131);
    const x = i * spacing + rng() * 40 - offset;
    if (x < -80 || x > GAME_W + 80) continue;
    const h = 20 + rng() * 34;
    ctx.beginPath();
    ctx.ellipse(x, 608, 34 + rng() * 22, h, 0, Math.PI, TAU);
    ctx.fill();
  }
  ctx.restore();
}
