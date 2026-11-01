'use strict';

/* =========================================================
   pickups.js — оружие, руны, УниБаф, сердца
   ========================================================= */

class WeaponPickup {
  constructor(wpn, x, y) {
    this.kind = 'weapon';
    this.wpn = wpn;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.t = rand(TAU);
    this.removed = false;
  }

  update(dt) {
    this.t += dt;
    this.y = this.baseY + Math.sin(this.t * 2.2) * 5;
  }

  draw(ctx, game) {
    const bob = this.y;
    const pulse = 0.5 + Math.sin(this.t * 3) * 0.5;

    const glow = ctx.createRadialGradient(this.x, bob, 2, this.x, bob, 62);
    glow.addColorStop(0, this.wpn.color + '55');
    glow.addColorStop(0.5, this.wpn.color + '18');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, bob, 62, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.18 + pulse * 0.12;
    ctx.fillStyle = this.wpn.color;
    ctx.beginPath();
    ctx.moveTo(this.x - 16, this.baseY + 20);
    ctx.lineTo(this.x - 5, bob - 10);
    ctx.lineTo(this.x + 5, bob - 10);
    ctx.lineTo(this.x + 16, this.baseY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < 3; i++) {
      const a = this.t * 1.6 + i * 2.1;
      const r = 26 + Math.sin(this.t * 2 + i) * 8;
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(this.t * 4 + i) * 0.25;
      ctx.fillStyle = this.wpn.color;
      ctx.beginPath();
      ctx.arc(this.x + Math.cos(a) * r, bob + Math.sin(a) * r * 0.55, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, bob);
    ctx.rotate(-0.5 + Math.sin(this.t) * 0.06);
    drawWeapon(ctx, this.wpn, -10, 0, 0, this.wpn.reach > 80 ? 0.98 : 1.25);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(8,5,14,0.85)';
    const wpnLabel = weaponLabel(this.wpn);
    ctx.strokeText(wpnLabel, this.x, this.baseY + 34);
    ctx.fillStyle = 'rgba(240,232,255,0.85)';
    ctx.fillText(wpnLabel, this.x, this.baseY + 34);
    ctx.restore();

    if (game.player.nearPickup === this) {
      drawPickupPrompt(ctx, this.x, bob - 40, tr('prompt.pickup'));
    }
  }
}

class RunePickup {
  constructor(type, x, y) {
    this.kind = 'rune';
    this.type = type;
    this.rune = RUNE_TYPES[type] || RUNE_TYPES.red;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.t = rand(TAU);
    this.removed = false;
  }

  update(dt) {
    this.t += dt;
    this.y = this.baseY + Math.sin(this.t * 2.4) * 5;
  }

  draw(ctx, game) {
    const bob = this.y;
    const pulse = 0.5 + Math.sin(this.t * 3) * 0.5;
    const color = this.rune.color;

    const glow = ctx.createRadialGradient(this.x, bob, 2, this.x, bob, 64);
    glow.addColorStop(0, color + '55');
    glow.addColorStop(0.55, color + '18');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, bob, 64, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.16 + pulse * 0.12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.x - 14, this.baseY + 22);
    ctx.lineTo(this.x - 4, bob - 16);
    ctx.lineTo(this.x + 4, bob - 16);
    ctx.lineTo(this.x + 14, this.baseY + 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, bob);
    ctx.rotate(Math.sin(this.t * 1.3) * 0.1);
    hexPath(ctx, 0, 0, 20);
    ctx.fillStyle = 'rgba(12,8,22,0.9)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.font = '900 20px "Trebuchet MS", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(runeLetter(this.rune), 0, 7);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(8,5,14,0.85)';
    const runeTitle = tr('pickup.runeTitle', { name: runeName(this.rune) });
    ctx.strokeText(runeTitle, this.x, this.baseY + 34);
    ctx.fillStyle = color;
    ctx.fillText(runeTitle, this.x, this.baseY + 34);
    ctx.font = '600 9px "Trebuchet MS", sans-serif';
    const hint = runeHint(this.rune);
    ctx.strokeText(hint, this.x, this.baseY + 47);
    ctx.fillStyle = 'rgba(230,220,250,0.72)';
    ctx.fillText(hint, this.x, this.baseY + 47);
    ctx.restore();

    if (game.player.nearPickup === this) {
      drawPickupPrompt(ctx, this.x, bob - 42, tr('prompt.take'));
    }
  }
}

/* УниБаф — падает с каждого монстра, подбирается автоматически */
class UniBuffPickup {
  constructor(x, y) {
    this.kind = 'unibuff';
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.t = rand(TAU);
    this.age = 0;
    this.alive = true;
  }

  update(dt, game) {
    this.t += dt;
    this.age += dt;

    const p = game.player;
    const tx = p.cx();
    const ty = p.y + p.h * 0.5;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.age > 0.12 && dist < 230) {
      const speed = 420 + (230 - dist) * 2.2;
      this.x += (dx / dist) * speed * dt;
      this.y += (dy / dist) * speed * dt;
    } else {
      this.x += Math.sin(this.t * 2.1) * 6 * dt;
      this.y = this.baseY + Math.sin(this.t * 3) * 4;
    }

    if (dist < 26) this.collect(game, p);
  }

  collect(game, player) {
    if (!this.alive) return;
    this.alive = false;

    player.addUniBuffs(1);

    game.addDamageText(this.x, this.y - 18, tr('pickup.unibuffGain'), UNIBUFF.color, 1.05);
    game.spawnBurst(this.x, this.y, UNIBUFF.color, 20);
    Sfx.pickup();
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.t * 5) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
    glow.addColorStop(0, 'rgba(201,167,255,0.55)');
    glow.addColorStop(0.5, 'rgba(255,127,176,0.22)');
    glow.addColorStop(1, 'rgba(201,167,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(this.t * 1.6);
    const g = ctx.createLinearGradient(-10, -10, 10, 10);
    g.addColorStop(0, '#ff7fb0');
    g.addColorStop(0.33, '#ffd166');
    g.addColorStop(0.66, '#7dffb0');
    g.addColorStop(1, '#8fd8ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const r = i % 2 === 0 ? 12 : 5.5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

class HeartPickup {
  constructor(x, y, heal = 24) {
    this.kind = 'heart';
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.t = rand(TAU);
    this.alive = true;
    this.heal = heal;
  }

  update(dt) {
    this.t += dt;
    this.y = this.baseY + Math.sin(this.t * 2.6) * 4;
  }

  collect(game, player) {
    if (!this.alive) return;
    this.alive = false;
    player.hp = Math.min(player.maxHp, player.hp + this.heal);
    game.addDamageText(this.x, this.y - 10, '+' + this.heal, '#7dffb0', 1.1);
    game.spawnBurst(this.x, this.y, '#ff7fa5', 14);
    Sfx.heal();
  }

  draw(ctx) {
    const pulse = 1 + Math.sin(this.t * 4) * 0.08;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
    glow.addColorStop(0, 'rgba(255,90,140,0.35)');
    glow.addColorStop(1, 'rgba(255,90,140,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#ff5f8a';
    ctx.strokeStyle = '#ffd0de';
    ctx.lineWidth = 1.5;
    heartPath(ctx, 0, 0, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-5, -5, 3, 2, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
