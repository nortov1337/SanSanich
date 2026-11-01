'use strict';

/* =========================================================
   weapon-art.js — векторная отрисовка оружия
   ========================================================= */

/* Оружие рисуется от рукояти (0,0), клинок смотрит в +X */
function drawWeapon(ctx, wpn, x, y, angle, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (wpn.id) {
    case 'fist': drawPaw(ctx); break;
    case 'rusty': drawRusty(ctx); break;
    case 'blade': drawBlade(ctx); break;
    case 'katana': drawKatana(ctx); break;
    case 'axe': drawAxe(ctx); break;
    case 'hero': drawHeroSword(ctx); break;
    default: drawPaw(ctx);
  }

  ctx.restore();
}

function drawPaw(ctx) {
  ctx.fillStyle = '#b8b2c2';
  ctx.beginPath();
  ctx.ellipse(7, 0, 11, 10, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,32,54,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#e9d7d3';
  ctx.beginPath();
  ctx.ellipse(9, 2, 5.5, 4.5, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(12 + i * 3.4, -5 + i * 2.4, 2.6, 2.2, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ff9fc0';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(12 + i * 3.4, -5 + i * 2.4, 1.2, 1, 0, 0, TAU);
    ctx.fill();
  }
}

function drawRusty(ctx) {
  ctx.fillStyle = '#5a3a28';
  roundRectPath(ctx, -13, -3.5, 16, 7, 3);
  ctx.fill();
  ctx.strokeStyle = '#7d5537';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-11 + i * 4, -3);
    ctx.lineTo(-9 + i * 4, 3);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a6a3f';
  roundRectPath(ctx, 2, -8, 5, 16, 2);
  ctx.fill();

  const g = ctx.createLinearGradient(0, -7, 0, 7);
  g.addColorStop(0, '#b9b2a4');
  g.addColorStop(0.5, '#8e877a');
  g.addColorStop(1, '#6d665c');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(7, -5.5);
  ctx.lineTo(34, -7.5);
  ctx.lineTo(44, 0);
  ctx.lineTo(34, 7.5);
  ctx.lineTo(7, 5.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#d6cfc0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(9, 3);
  ctx.lineTo(34, 5.5);
  ctx.lineTo(42, 0.5);
  ctx.stroke();

  ctx.fillStyle = 'rgba(158,82,38,0.85)';
  [[16, -2, 3.4], [23, 1.4, 2.6], [30, -1.6, 3], [37, 1.8, 2.2]].forEach(([px, py, r]) => {
    ctx.beginPath();
    ctx.arc(px, py, r, 0, TAU);
    ctx.fill();
  });

  ctx.fillStyle = '#5b544a';
  ctx.beginPath();
  ctx.moveTo(30, -6.6);
  ctx.lineTo(35, -2);
  ctx.lineTo(31, -2.5);
  ctx.closePath();
  ctx.fill();
}

function drawBlade(ctx) {
  ctx.shadowColor = 'rgba(143,216,255,0.65)';
  ctx.shadowBlur = 8;

  const g = ctx.createLinearGradient(0, -6, 0, 6);
  g.addColorStop(0, '#e8fbff');
  g.addColorStop(0.45, '#9fd8ff');
  g.addColorStop(1, '#5f9dd8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(6, -5);
  ctx.lineTo(36, -6.5);
  ctx.lineTo(50, 0);
  ctx.lineTo(36, 6.5);
  ctx.lineTo(6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(10, -2.6);
  ctx.lineTo(35, -4);
  ctx.lineTo(44, -0.6);
  ctx.stroke();

  ctx.fillStyle = '#d7e7f5';
  roundRectPath(ctx, 1, -10, 5, 20, 2.5);
  ctx.fill();
  ctx.fillStyle = '#8fd8ff';
  ctx.beginPath();
  ctx.arc(6, 0, 3.2, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#2c3a55';
  roundRectPath(ctx, -14, -3.4, 15, 6.8, 3);
  ctx.fill();
  ctx.strokeStyle = '#5b7aa5';
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-12 + i * 4, -3);
    ctx.lineTo(-10 + i * 4, 3);
    ctx.stroke();
  }
}

function drawKatana(ctx) {
  ctx.shadowColor = 'rgba(255,127,176,0.7)';
  ctx.shadowBlur = 9;

  ctx.fillStyle = '#ffd6e6';
  ctx.beginPath();
  ctx.moveTo(4, -3.5);
  ctx.quadraticCurveTo(28, -12, 52, -13);
  ctx.quadraticCurveTo(40, -3, 30, 4.5);
  ctx.quadraticCurveTo(16, 7, 4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(8, 1.6);
  ctx.quadraticCurveTo(26, 2.4, 47, -9.6);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,79,139,0.8)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.quadraticCurveTo(30, -7, 44, -11);
  ctx.stroke();

  ctx.fillStyle = '#31182a';
  ctx.beginPath();
  ctx.arc(5, 0, 5.2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ff7fb0';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = '#251522';
  roundRectPath(ctx, -20, -3.2, 20, 6.4, 3);
  ctx.fill();
  ctx.strokeStyle = '#ff7fb0';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-17 + i * 4.6, -2.6);
    ctx.lineTo(-14.5 + i * 4.6, 2.6);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ff7fb0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-27, 2, -26, 8);
  ctx.stroke();
}

function drawAxe(ctx) {
  ctx.fillStyle = '#4c3524';
  roundRectPath(ctx, -16, -3, 46, 6, 3);
  ctx.fill();
  ctx.strokeStyle = '#6d4d33';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-14 + i * 8, -2.4);
    ctx.lineTo(-14 + i * 8, 2.4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7e5a3a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-15 + i * 3, -3);
    ctx.lineTo(-13 + i * 3, 3);
    ctx.stroke();
  }

  ctx.shadowColor = 'rgba(166,232,122,0.6)';
  ctx.shadowBlur = 10;
  const g = ctx.createLinearGradient(20, -20, 42, 18);
  g.addColorStop(0, '#d9f5c2');
  g.addColorStop(0.5, '#8dbb63');
  g.addColorStop(1, '#4d7038');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(22, -4);
  ctx.quadraticCurveTo(30, -22, 44, -19);
  ctx.quadraticCurveTo(42, -2, 40, 12);
  ctx.quadraticCurveTo(30, 14, 22, 4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#e8ffd6';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(30, -17);
  ctx.quadraticCurveTo(40, -14, 39, 9);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(60,90,40,0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(30, -8);
  ctx.lineTo(35, -2);
  ctx.lineTo(32, 4);
  ctx.stroke();
}

function drawHeroSword(ctx) {
  ctx.shadowColor = 'rgba(255,215,106,0.85)';
  ctx.shadowBlur = 14;

  const g = ctx.createLinearGradient(0, -7, 0, 7);
  g.addColorStop(0, '#fff6d0');
  g.addColorStop(0.45, '#ffd76a');
  g.addColorStop(1, '#d99a2b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(6, -5.5);
  ctx.lineTo(40, -7);
  ctx.lineTo(56, 0);
  ctx.lineTo(40, 7);
  ctx.lineTo(6, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(40, 0);
  ctx.stroke();

  ctx.fillStyle = '#7a4a12';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(16 + i * 7, 0, 1.3, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = '#ffe6a3';
  roundRectPath(ctx, 1, -12, 6, 24, 3);
  ctx.fill();
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.arc(8, -9, 3, 0, TAU);
  ctx.arc(8, 9, 3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#5d2d1c';
  roundRectPath(ctx, -16, -3.6, 17, 7.2, 3.4);
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-13 + i * 4, -3);
    ctx.lineTo(-10.5 + i * 4, 3);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(-17, 0, 3.4, 0, TAU);
  ctx.fill();
}

function drawWeaponIcon(ctx, wpn, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.55);
  drawWeapon(ctx, wpn, 0, 0, 0, scale);
  ctx.restore();
}
