'use strict';

/* =========================================================
   effects.js — частицы и всплывающий текст
   ========================================================= */

class Particle {
  constructor(opts) {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 0.5;
    this.size = 4;
    this.color = '#fff';
    this.gravity = 900;
    this.drag = 0.98;
    this.shape = 'circle';
    Object.assign(this, opts);
    this.maxLife = this.life;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    const d = Math.pow(this.drag, dt * 60);
    this.vx *= d;
    this.vy *= d;
  }

  draw(ctx) {
    const k = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.fillStyle = this.color;
    if (this.shape === 'spark') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size * 0.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
      ctx.stroke();
    } else if (this.shape === 'square') {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * k, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

class DamageText {
  constructor(x, y, text, color, scale = 1) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.scale = scale;
    this.life = 0.8;
    this.maxLife = 0.8;
    this.vx = rand(-24, 24);
    this.vy = -95;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 130 * dt;
  }

  draw(ctx) {
    const k = clamp(this.life / this.maxLife, 0, 1);
    const pop = 1 + (1 - k) * 0.25;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(this.x, this.y);
    ctx.scale(pop * this.scale, pop * this.scale);
    ctx.textAlign = 'center';
    ctx.font = '900 20px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,6,18,0.85)';
    ctx.strokeText(this.text, 0, 0);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}
