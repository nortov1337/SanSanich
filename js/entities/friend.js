'use strict';

/* =========================================================
   friend.js — дружелюбные персонажи: встреча, подарки, эффекты
   ========================================================= */

class Friend {
  constructor(type, x, y) {
    this.kind = 'friend';
    this.type = type;
    this.x = x;
    this.y = y != null ? y : GROUND_Y;
    this.scale = type.scale || 1;
    this.img = IMAGES.friends ? IMAGES.friends[type.img] : null;
    this.w = 58 * this.scale;
    this.h = 100 * this.scale;
    this.t = rand(TAU);
    this.removed = false;
    this.dismissT = 0;
    this.dir = 1;
  }

  visualHeight() {
    return 116 * this.scale;
  }

  update(dt, game) {
    this.t += dt;

    if (this.dismissT > 0) {
      this.dismissT -= dt;
      if (this.dismissT <= 0) this.removed = true;
      return;
    }

    if (game && game.player) {
      this.dir = game.player.cx() < this.x ? -1 : 1;
    }
  }

  dismiss(game) {
    if (this.dismissT > 0) return;
    this.dismissT = 0.45;
    if (game) {
      game.spawnBurst(this.x, this.y - this.visualHeight() * 0.5, this.type.accent, 26);
      game.spawnBurst(this.x, this.y - this.visualHeight() * 0.5, this.type.body, 14);
    }
  }

  draw(ctx, game) {
    const s = this.scale;
    const t = game.time;
    const alpha = this.dismissT > 0 ? clamp(this.dismissT / 0.45, 0, 1) : 1;
    if (alpha <= 0.02) return;

    const bob = Math.sin(this.t * 2.1) * 2.4 * s;
    const feetY = this.y;
    const headCY = -(10 * s + 54 * s * 0.5) - 54 * s * 0.42 - 35 * s * 0.58;

    ctx.save();
    ctx.globalAlpha = alpha;

    /* аура */
    const aura = ctx.createRadialGradient(
      this.x, feetY - this.visualHeight() * 0.5, 6,
      this.x, feetY - this.visualHeight() * 0.5, 104 * s
    );
    aura.addColorStop(0, this.type.accent + '3a');
    aura.addColorStop(0.55, this.type.body + '14');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(this.x, feetY - this.visualHeight() * 0.5, 104 * s, 0, TAU);
    ctx.fill();

    /* тень */
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, feetY + 3, 33 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = alpha;

    /* пульсирующее кольцо */
    ctx.save();
    ctx.globalAlpha = alpha * (0.28 + Math.sin(t * 2.4) * 0.14);
    ctx.strokeStyle = this.type.accent;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(this.x, feetY - 6, 42 * s, 13 * s, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, feetY - bob);
    ctx.scale(this.dir, 1);

    const legH = 10 * s;
    const bodyW = 68 * s;
    const bodyH = 54 * s;
    const bodyCY = -(legH + bodyH * 0.5);

    /* лапы */
    ctx.fillStyle = this.type.leg;
    ctx.beginPath();
    ctx.ellipse(-15 * s, -6 * s, 10 * s, 7.5 * s, 0, 0, TAU);
    ctx.ellipse(15 * s, -6 * s, 10 * s, 7.5 * s, 0, 0, TAU);
    ctx.fill();

    /* тело */
    const bodyGrad = ctx.createLinearGradient(0, bodyCY - bodyH / 2, 0, bodyCY + bodyH / 2);
    bodyGrad.addColorStop(0, this.type.body);
    bodyGrad.addColorStop(1, this.type.leg);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, bodyCY, bodyW / 2, bodyH / 2, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = this.type.belly;
    ctx.globalAlpha = alpha * 0.55;
    ctx.beginPath();
    ctx.ellipse(0, bodyCY + 5 * s, bodyW * 0.28, bodyH * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = alpha;

    /* машущая рука */
    const shoulderX = bodyW * 0.3;
    const shoulderY = bodyCY - bodyH * 0.12;
    const armAngle = 0.7 + Math.sin(this.t * 4.2) * 0.5;
    const armLen = 26 * s;
    const handX = shoulderX + Math.cos(armAngle) * armLen;
    const handY = shoulderY + Math.sin(armAngle) * armLen;

    ctx.strokeStyle = this.type.body;
    ctx.lineWidth = 13 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX * 0.4, shoulderY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    ctx.fillStyle = this.type.belly;
    ctx.beginPath();
    ctx.arc(handX, handY, 7.5 * s, 0, TAU);
    ctx.fill();

    /* голова */
    const headR = 35 * s;
    ctx.save();
    ctx.translate(1.5 * s, headCY);
    drawPhoto(ctx, this.img, 0, 0, headR * 2, headR * 2, headR);
    ctx.strokeStyle = '#1c1428';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = this.type.accent;
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.arc(0, 0, headR - 3 * s, -2.4, -0.5);
    ctx.stroke();

    /* значок над головой */
    const iconY = -headR - 16 * s;
    const pulse = 1 + Math.sin(t * 3) * 0.08;
    ctx.translate(0, iconY);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(12,8,22,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 13 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = this.type.accent;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.round(14 * s)}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = this.type.accent;
    ctx.fillText(this.type.icon || '★', 0, 5 * s);
    ctx.restore();

    ctx.restore();

    /* имя */
    const tagY = feetY - this.visualHeight() - 36;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.max(11, Math.round(11 * s + 1))}px "Trebuchet MS", sans-serif`;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(8,5,14,0.9)';
    const label = friendName(this.type);
    ctx.strokeText(label, this.x, tagY);
    ctx.fillStyle = this.type.accent;
    ctx.shadowColor = this.type.accent;
    ctx.shadowBlur = 10;
    ctx.fillText(label, this.x, tagY);
    ctx.shadowBlur = 0;
    ctx.restore();

    if (game.player.nearFriend === this) {
      drawPickupPrompt(ctx, this.x, tagY - 30, tr('prompt.talk'));
    }

    ctx.restore();
  }
}
