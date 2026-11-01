'use strict';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function approach(v, target, delta) {
  return v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);
}

function rand(a = 1, b) {
  if (b === undefined) { b = a; a = 0; }
  return a + Math.random() * (b - a);
}

function randInt(a, b) {
  return Math.floor(rand(a, b + 1));
}

function chance(p) {
  return Math.random() < p;
}

function signOf(v) {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

/* Глубина в метрах по мировой координате X */
function depthMetersAt(x) {
  return Math.max(0, (x - 140) / 25);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/* Фото-голова с cover-обрезкой и заглушкой, если картинка не загрузилась */
function drawPhoto(ctx, img, cx, cy, w, h, radius, tint) {
  ctx.save();
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, radius);
  ctx.clip();

  if (img && img.complete && img.naturalWidth > 0) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = '#332a4a';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.fillStyle = '#ff4f8b';
    ctx.beginPath();
    ctx.arc(cx - w * 0.19, cy - h * 0.08, w * 0.075, 0, TAU);
    ctx.arc(cx + w * 0.19, cy - h * 0.08, w * 0.075, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#ff4f8b';
    ctx.lineWidth = Math.max(2, w * 0.045);
    ctx.beginPath();
    ctx.arc(cx, cy + h * 0.2, w * 0.2, 0.25, Math.PI - 0.25);
    ctx.stroke();
  }

  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  }
  ctx.restore();
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + i * TAU / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function heartPath(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.72);
  ctx.bezierCurveTo(cx - r * 1.15, cy - r * 0.05, cx - r * 0.62, cy - r * 0.95, cx, cy - r * 0.36);
  ctx.bezierCurveTo(cx + r * 0.62, cy - r * 0.95, cx + r * 1.15, cy - r * 0.05, cx, cy + r * 0.72);
  ctx.closePath();
}

function drawPickupPrompt(ctx, x, y, label) {
  ctx.save();
  ctx.textAlign = 'center';

  roundRectPath(ctx, x - 11, y - 14, 22, 22, 7);
  ctx.fillStyle = 'rgba(255,209,102,0.95)';
  ctx.fill();
  ctx.fillStyle = '#241607';
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.fillText('E', x, y + 2);

  ctx.font = '700 9px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255,240,200,0.92)';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, x, y - 21);
  ctx.restore();
}
