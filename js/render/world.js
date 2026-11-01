'use strict';

/* =========================================================
   world-render.js — отрисовка земли, платформ и декора
   ========================================================= */

Render.world = function (ctx, game, camX) {
  drawPits(ctx, camX);
  drawGround(ctx, camX);
  drawPlatforms(ctx, camX);
  drawProps(ctx, game, camX);
  drawTorches(ctx, game, camX);
  drawSigns(ctx, camX);
};

function drawPits(ctx, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 80 || chunk.startX > camX + GAME_W + 80) continue;
    for (const gap of chunk.gaps) {
      if (gap.x > camX + GAME_W + 60 || gap.x + gap.w < camX - 60) continue;

      const g = ctx.createLinearGradient(0, GROUND_Y - 20, 0, GAME_H);
      g.addColorStop(0, 'rgba(24,9,36,0)');
      g.addColorStop(0.3, 'rgba(18,6,28,0.88)');
      g.addColorStop(1, '#08040e');
      ctx.fillStyle = g;
      ctx.fillRect(gap.x, GROUND_Y - 20, gap.w, GAME_H - GROUND_Y + 20);

      const glow = ctx.createRadialGradient(
        gap.x + gap.w / 2, GAME_H + 10, 4,
        gap.x + gap.w / 2, GAME_H + 10, 190
      );
      glow.addColorStop(0, 'rgba(255,70,90,0.3)');
      glow.addColorStop(1, 'rgba(255,70,90,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(gap.x + gap.w / 2, GAME_H - 6, gap.w * 0.85, 90, 0, 0, TAU);
      ctx.fill();
    }
  }
}

function drawGround(ctx, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 80 || chunk.startX > camX + GAME_W + 80) continue;
    for (const seg of chunk.ground) drawGroundSeg(ctx, seg, camX);
  }
}

function drawGroundSeg(ctx, seg, camX) {
  if (seg.x > camX + GAME_W + 40 || seg.x + seg.w < camX - 40) return;

  const g = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_H);
  g.addColorStop(0, '#352545');
  g.addColorStop(0.16, '#281c36');
  g.addColorStop(1, '#130d1d');
  ctx.fillStyle = g;
  ctx.fillRect(seg.x, GROUND_Y, seg.w, GAME_H - GROUND_Y);

  ctx.fillStyle = '#47644f';
  ctx.fillRect(seg.x, GROUND_Y, seg.w, 9);
  ctx.fillStyle = '#618764';
  ctx.fillRect(seg.x, GROUND_Y, seg.w, 3);

  const rng = mulberry32(Math.floor(seg.x) + 31);
  const tufts = Math.floor(seg.w / 24);
  ctx.strokeStyle = 'rgba(122,170,126,0.55)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < tufts; i++) {
    const x = seg.x + rng() * seg.w;
    if (x < camX - 30 || x > camX + GAME_W + 30) continue;
    const h = 4 + rng() * 9;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 2);
    ctx.quadraticCurveTo(x + (rng() - 0.5) * 4, GROUND_Y - h * 0.6, x + (rng() - 0.5) * 6, GROUND_Y - h);
    ctx.stroke();
  }

  for (let i = 0; i < Math.floor(seg.w / 90); i++) {
    const x = seg.x + rng() * seg.w;
    if (x < camX - 30 || x > camX + GAME_W + 30) continue;
    const y = GROUND_Y + 26 + rng() * 70;
    const w = 10 + rng() * 26;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y, w, w * 0.3, rng() * 0.6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,120,170,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * 0.4, y + 14 + rng() * 26);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(6,3,12,0.55)';
  ctx.fillRect(seg.x, GROUND_Y, 10, 120);
  ctx.fillRect(seg.x + seg.w - 10, GROUND_Y, 10, 120);
}

function drawPlatforms(ctx, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 100 || chunk.startX > camX + GAME_W + 100) continue;
    for (const p of chunk.platforms) {
      if (p.x > camX + GAME_W + 60 || p.x + p.w < camX - 60) continue;

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      roundRectPath(ctx, p.x + 4, p.y + 8, p.w, 14, 7);
      ctx.fill();

      const g = ctx.createLinearGradient(0, p.y, 0, p.y + 18);
      g.addColorStop(0, '#5b4a70');
      g.addColorStop(0.35, '#3d3150');
      g.addColorStop(1, '#241c32');
      ctx.fillStyle = g;
      roundRectPath(ctx, p.x, p.y, p.w, 18, 8);
      ctx.fill();

      ctx.fillStyle = '#4f7058';
      roundRectPath(ctx, p.x + 2, p.y, p.w - 4, 5, 2.5);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + 6, p.y + 6);
      ctx.lineTo(p.x + p.w - 8, p.y + 6);
      ctx.stroke();

      const rng = mulberry32(p.x * 3 + p.y);
      for (let i = 0; i < 3; i++) {
        const x = p.x + 8 + rng() * (p.w - 16);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.moveTo(x, p.y + 7);
        ctx.lineTo(x + 3, p.y + 16);
        ctx.stroke();
      }
    }
  }
}

function drawProps(ctx, game, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 100 || chunk.startX > camX + GAME_W + 100) continue;
    for (const prop of chunk.props) {
      if (prop.x < camX - 40 || prop.x > camX + GAME_W + 40) continue;
      const x = prop.x;
      const y = GROUND_Y;
      const s = prop.s;

      switch (prop.kind) {
        case 'stone':
          ctx.fillStyle = '#392e4a';
          ctx.beginPath();
          ctx.ellipse(x, y + 2, 8 * s, 5 * s, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(160,140,190,0.15)';
          ctx.beginPath();
          ctx.ellipse(x - s, y, 4 * s, 2.4 * s, 0, 0, TAU);
          ctx.fill();
          break;

        case 'bone':
          ctx.strokeStyle = 'rgba(220,210,200,0.55)';
          ctx.lineWidth = 2.2 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - 9 * s, y - 2);
          ctx.quadraticCurveTo(x, y - 6 * s, x + 9 * s, y - 1);
          ctx.stroke();
          ctx.fillStyle = 'rgba(220,210,200,0.6)';
          ctx.beginPath();
          ctx.arc(x - 9 * s, y - 2, 2.4 * s, 0, TAU);
          ctx.arc(x + 9 * s, y - 1, 2.4 * s, 0, TAU);
          ctx.fill();
          break;

        case 'mushroom': {
          const glow = ctx.createRadialGradient(x, y - 4, 1, x, y - 4, 26);
          glow.addColorStop(0, 'rgba(120,240,220,0.25)');
          glow.addColorStop(1, 'rgba(120,240,220,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y - 4, 26, 0, TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(200,230,220,0.75)';
          ctx.fillRect(x - 1.4 * s, y - 10 * s, 2.8 * s, 10 * s);
          ctx.fillStyle = '#63d8c4';
          ctx.beginPath();
          ctx.ellipse(x, y - 10 * s, 6.5 * s, 4 * s, 0, Math.PI, TAU);
          ctx.fill();
          break;
        }

        case 'grass':
          ctx.strokeStyle = 'rgba(110,150,120,0.5)';
          ctx.lineWidth = 1.6;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 3 * s, y + 1);
            ctx.quadraticCurveTo(x + i * 5 * s, y - 7 * s, x + i * 7 * s + 2, y - 12 * s);
            ctx.stroke();
          }
          break;

        case 'skull':
          ctx.fillStyle = 'rgba(226,218,205,0.7)';
          ctx.beginPath();
          ctx.arc(x, y - 5 * s, 5.4 * s, 0, TAU);
          ctx.fill();
          ctx.fillRect(x - 4 * s, y - 5 * s, 8 * s, 5 * s);
          ctx.fillStyle = '#1a1226';
          ctx.beginPath();
          ctx.arc(x - 1.9 * s, y - 6 * s, 1.3 * s, 0, TAU);
          ctx.arc(x + 1.9 * s, y - 6 * s, 1.3 * s, 0, TAU);
          ctx.fill();
          break;

        case 'crystal': {
          ctx.save();
          ctx.translate(x, y);
          const h = 16 * s;
          ctx.fillStyle = 'rgba(150,110,255,0.7)';
          ctx.shadowColor = 'rgba(150,110,255,0.8)';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(-5 * s, 0);
          ctx.lineTo(-2 * s, -h);
          ctx.lineTo(2 * s, -h * 0.75);
          ctx.lineTo(5 * s, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        default: break;
      }
    }
  }
}

function drawTorches(ctx, game, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 200 || chunk.startX > camX + GAME_W + 200) continue;
    for (const torch of chunk.torches) {
      const x = torch.x;
      if (x < camX - 160 || x > camX + GAME_W + 160) continue;
      const y = GROUND_Y;
      const flick = 1 + Math.sin(game.time * 11 + x * 0.7) * 0.16 + Math.sin(game.time * 23 + x) * 0.06;

      ctx.fillStyle = '#3b2a22';
      ctx.fillRect(x - 3, y - 62, 6, 62);
      ctx.fillStyle = '#4d382c';
      ctx.fillRect(x - 2, y - 62, 2, 62);

      ctx.fillStyle = '#2a1d18';
      ctx.beginPath();
      ctx.ellipse(x, y - 63, 9, 5, 0, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(x, y - 74, 4, x, y - 74, 150 * flick);
      glow.addColorStop(0, 'rgba(255,190,110,0.34)');
      glow.addColorStop(0.45, 'rgba(255,120,60,0.12)');
      glow.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 74, 150 * flick, 0, TAU);
      ctx.fill();

      const flame = ctx.createRadialGradient(x, y - 74, 1, x, y - 74, 17 * flick);
      flame.addColorStop(0, 'rgba(255,245,200,0.95)');
      flame.addColorStop(0.5, 'rgba(255,160,60,0.8)');
      flame.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.ellipse(x, y - 74, 13 * flick, 20 * flick, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawSigns(ctx, camX) {
  for (const chunk of WORLD.chunks) {
    if (chunk.endX < camX - 160 || chunk.startX > camX + GAME_W + 160) continue;
    for (const sign of chunk.signs) {
      const x = sign.x;
      if (x < camX - 120 || x > camX + GAME_W + 120) continue;
      const y = GROUND_Y;
      const w = 148;
      const h = 52;

      ctx.fillStyle = '#33241c';
      ctx.fillRect(x - 3, y - 66, 6, 66);

      ctx.fillStyle = '#4d3627';
      roundRectPath(ctx, x - w / 2, y - 128, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = '#6b4d36';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,236,200,0.85)';
      ctx.textAlign = 'center';
      ctx.font = '700 11px "Trebuchet MS", sans-serif';
      sign.lines.forEach((line, i) => {
        ctx.fillText(line, x, y - 108 + i * 16);
      });

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(x - w / 2 + 9, y - 128 + 9, 2, 0, TAU);
      ctx.arc(x + w / 2 - 9, y - 128 + 9, 2, 0, TAU);
      ctx.fill();
    }
  }
}
