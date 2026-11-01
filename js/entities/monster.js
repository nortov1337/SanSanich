'use strict';

/* =========================================================
   monster.js — ИИ, физика и отрисовка монстров
   ========================================================= */

class Monster {
  constructor(spawn) {
    const type = MONSTER_TYPES[spawn.type];
    this.type = type;
    this.name = type.name;
    this.scale = type.scale;
    this.img = IMAGES.monsters[type.img];
    this.power = spawn.power || 0;

    const world = (typeof DATA !== 'undefined' && DATA && DATA.world) ? DATA.world : {};
    const hpPerPower = world.monsterHpPerPower != null ? world.monsterHpPerPower : 0.6;
    const dmgPerPower = world.monsterDamagePerPower != null ? world.monsterDamagePerPower : 0.22;
    const speedPerPower = world.monsterSpeedPerPower != null ? world.monsterSpeedPerPower : 0.045;
    const speedCap = world.monsterSpeedCap != null ? world.monsterSpeedCap : 0.45;

    this.maxHp = Math.round(type.hp * (1 + this.power * hpPerPower));
    this.hp = this.maxHp;
    this.hpShown = this.maxHp;
    this.dmg = type.dmg * (1 + this.power * dmgPerPower);
    this.speed = type.speed * (1 + Math.min(this.power * speedPerPower, speedCap));
    this.moveSpeed = this.speed;
    this.aggroRange = type.aggro + this.power * 26;
    this.reach = type.reach;
    this.windup = Math.max(0.18, type.windup * (1 - Math.min(this.power * 0.035, 0.5)));
    this.recover = 0.15;
    this.cooldown = Math.max(0.42, type.cooldown * (1 - Math.min(this.power * 0.03, 0.45)));
    this.knockPower = type.knock;

    this.w = 58 * this.scale;
    this.h = 100 * this.scale;
    this.x = spawn.x;
    this.y = spawn.y != null ? spawn.y : GROUND_Y;
    this.spawnX = spawn.x;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;

    const platform = WORLD.platformAt(this.x, this.y);
    if (platform) {
      this.homeMin = platform.x + 20;
      this.homeMax = platform.x + platform.w - 20;
    } else {
      const seg = WORLD.groundAt(this.x);
      this.homeMin = seg ? seg.x + 30 : this.x - 200;
      this.homeMax = seg ? seg.x + seg.w - 30 : this.x + 200;
    }
    this.patrolMin = Math.max(this.homeMin, this.x - 220);
    this.patrolMax = Math.min(this.homeMax, this.x + 220);

    this.dir = chance(0.5) ? 1 : -1;
    this.attackT = 0;
    this.attackCd = rand(0.2, 0.9);
    this.didHit = false;
    this.stun = 0;
    this.flash = 0;
    this.aggro = false;
    this.dying = false;
    this.dead = false;
    this.deathT = 0;
    this.walkPhase = rand(TAU);
    this.patrolDir = chance(0.5) ? 1 : -1;
    this.patrolT = rand(0.8, 2.2);
    this.jumpCd = 0;
    this.lastX = this.x;
    this.moving = false;
    this.id = Math.random().toString(36).slice(2);
  }

  visualHeight() {
    return 116 * this.scale;
  }

  box() {
    const w = 58 * this.scale;
    const h = 100 * this.scale;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  startAttack() {
    this.attackT = this.windup + this.recover;
    this.didHit = false;
    this.attackCd = this.cooldown;
    Sfx.monsterWindup();
  }

  tryJump(player, dist, vDiff) {
    if (!this.onGround || this.jumpCd > 0) return;

    const playerAbove = vDiff < -80;
    const playerAhead = signOf(player.cx() - this.x) === this.dir;
    const lookAhead = this.w * 0.5 + 26 + this.moveSpeed * 0.07;
    const edgeAhead = !WORLD.solidBelow(
      this.x + this.dir * lookAhead,
      this.y + 8
    );
    const wantAcross = edgeAhead && dist > 30 && playerAhead;

    if (playerAbove && dist < 320) {
      this.vy = -1180;
      this.onGround = false;
      this.jumpCd = 0.9;
      this.vx = this.dir * Math.max(this.moveSpeed * 0.95, 190);
    } else if (wantAcross) {
      this.vy = -840;
      this.onGround = false;
      this.jumpCd = 0.95;
      this.vx = this.dir * Math.max(this.moveSpeed, 230);
    }
  }

  update(dt, game) {
    const player = game.player;
    this.flash = Math.max(0, this.flash - dt);
    this.hpShown = lerp(this.hpShown, Math.max(0, this.hp), 1 - Math.exp(-10 * dt));

    if (this.dying) {
      this.deathT += dt;
      return;
    }

    const wasStunned = this.stun > 0;
    this.stun = Math.max(0, this.stun - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.jumpCd = Math.max(0, this.jumpCd - dt);

    const dx = player.cx() - this.x;
    const dist = Math.abs(dx);
    const vDiff = player.feet() - this.y;
    const vertical = Math.abs(vDiff);

    if (!player.dead && dist < this.aggroRange && vertical < 300) this.aggro = true;
    if (player.dead) this.aggro = false;

    /* Догоняющая скорость: монстр не должен отставать от разогнавшегося кота */
    const worldCfg = (typeof DATA !== 'undefined' && DATA && DATA.world) ? DATA.world : {};
    const playerSpeed = Math.abs(player.vx);
    const chaseMult = worldCfg.chaseSpeedMultiplier != null ? worldCfg.chaseSpeedMultiplier : 1.08;
    const chaseBonus = worldCfg.chaseMinBonus != null ? worldCfg.chaseMinBonus : 20;
    const gapStart = worldCfg.chaseGapStart != null ? worldCfg.chaseGapStart : 320;
    const gapRate = worldCfg.chaseGapBoost != null ? worldCfg.chaseGapBoost : 0.18;
    const gapMax = worldCfg.chaseGapMax != null ? worldCfg.chaseGapMax : 180;

    const catchupSpeed = playerSpeed * chaseMult + chaseBonus;
    const gapBoost = this.aggro ? clamp((dist - gapStart) * gapRate, 0, gapMax) : 0;
    this.moveSpeed = this.aggro ? Math.max(this.speed, catchupSpeed) + gapBoost : this.speed;

    if (this.attackT > 0) {
      this.attackT -= dt;
      this.dir = signOf(dx) || this.dir;

      if (!this.didHit && this.attackT <= this.recover) {
        this.didHit = true;
        if (!player.dead && dist < this.reach + 30 && vertical < 85) {
          player.takeDamage(this.dmg, this.x, game);
        }
        game.spawnBurst(
          this.x + this.dir * this.reach * 0.65,
          this.y - 46 * this.scale,
          this.type.body,
          7
        );
        Sfx.monsterSwing();
      }
      if (this.attackT < 0) this.attackT = 0;
      if (this.attackT > this.recover) {
        /* во время замаха монстр не тормозит, а догоняет и бьёт */
        this.vx = approach(this.vx, this.dir * this.moveSpeed * 0.92, 4200 * dt);
      } else {
        this.vx = approach(this.vx, 0, 5000 * dt);
      }
    } else if (!wasStunned) {
      if (this.aggro) {
        this.dir = signOf(dx) || this.dir;

        if (dist <= this.reach * 0.85 && vertical < 65) {
          this.vx = approach(this.vx, 0, 9000 * dt);
          if (this.attackCd <= 0) this.startAttack();
        } else {
          this.vx = approach(this.vx, this.dir * this.moveSpeed, 3200 * dt);
          this.tryJump(player, dist, vDiff);
        }
      } else {
        this.patrol(dt);
      }
    } else {
      this.vx *= Math.max(0, 1 - dt * 9);
    }

    if (!this.onGround && this.aggro && this.attackT <= 0) {
      this.vx = approach(this.vx, this.dir * this.moveSpeed, 1400 * dt);
    }

    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
    this.moveAndCollide(dt);

    const movedX = Math.abs(this.x - this.lastX);
    this.lastX = this.x;
    this.moving = movedX > 0.12;
    this.walkPhase += Math.min(movedX * 0.06, 0.5) + (this.onGround ? 0 : dt * 3.5);

    if (this.y > 900) this.dead = true;
  }

  patrol(dt) {
    this.patrolT -= dt;
    if (this.patrolT <= 0) {
      this.patrolDir = -this.patrolDir || 1;
      this.patrolT = rand(1.0, 2.6);
    }
    this.dir = this.patrolDir;

    const edgeAhead = !WORLD.solidBelow(
      this.x + this.dir * (this.w * 0.5 + 24),
      this.y + 8
    );
    if (edgeAhead || this.x <= this.patrolMin || this.x >= this.patrolMax) {
      this.patrolDir = -this.patrolDir || 1;
      this.dir = this.patrolDir;
    }

    this.vx = approach(this.vx, this.dir * this.speed * 0.42, 1800 * dt);
  }

  moveAndCollide(dt) {
    this.x += this.vx * dt;
    for (const s of SOLIDS) {
      if (s.oneWay) continue;
      if (overlap(this.box(), s)) {
        if (this.vx > 0) this.x = s.x - this.w / 2;
        else if (this.vx < 0) this.x = s.x + s.w + this.w / 2;
        this.vx = 0;
      }
    }

    const prevFeet = this.y;
    this.y += this.vy * dt;
    this.onGround = false;

    for (const s of SOLIDS) {
      if (!overlap(this.box(), s)) continue;
      if (s.oneWay) {
        if (this.vy > 0 && prevFeet <= s.y + 8) {
          this.y = s.y;
          this.vy = 0;
          this.onGround = true;
        }
        continue;
      }
      if (this.vy > 0) {
        this.y = s.y;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = s.y + s.h;
        this.vy = 0;
      }
    }
  }

  hurt(dmg, dir, knock, game) {
    if (this.dying) return;

    this.hp -= dmg;
    this.flash = 0.16;
    this.stun = Math.max(this.stun, 0.26);
    this.vx = dir * knock;
    this.aggro = true;
    this.attackT = 0;
    this.didHit = true;

    game.spawnBurst(this.x, this.y - this.visualHeight() * 0.55, this.type.body, 12);
    game.camera.shake = Math.max(game.camera.shake, 8);
    game.hitPause = Math.max(game.hitPause, 0.045);

    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    if (this.dying) return;
    this.dying = true;
    this.deathT = 0;
    this.hp = 0;
    game.camera.shake = Math.max(game.camera.shake, 11);
    game.spawnBurst(this.x, this.y - this.visualHeight() * 0.5, this.type.body, 26);
    game.spawnBurst(this.x, this.y - this.visualHeight() * 0.5, this.type.accent, 12);
    game.addDamageText(this.x, this.y - this.visualHeight() * 0.7, '×', '#ffe6a3', 1.5);
    Sfx.death();

    /* с каждого монстра — УниБаф */
    game.unibuffs.push(new UniBuffPickup(this.x, this.y - 26));

    /* убийство, таланты и прогресс */
    game.onMonsterKilled(this);
  }

  /* ---------- отрисовка ---------- */

  draw(ctx, game) {
    const s = this.scale;
    const t = game.time;
    const dying = this.dying;
    const k = dying ? clamp(this.deathT / 0.7, 0, 1) : 0;
    const alpha = dying ? 1 - k : 1;
    const scaleMul = dying ? 1 - k * 0.45 : 1;

    if (alpha <= 0.02) return;

    const feetY = this.y;
    const moving = this.moving;
    const walk = Math.sin(this.walkPhase);
    const bob = (moving && this.onGround) ? Math.abs(walk) * 2.6 * s : 0;

    const total = this.windup + this.recover;
    const attackP = this.attackT > 0 ? 1 - this.attackT / total : 0;
    const windupK = this.attackT > this.recover ? (this.attackT - this.recover) / this.windup : 0;

    ctx.save();
    ctx.globalAlpha = 0.32 * alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, feetY + 3, 33 * s * scaleMul, 9 * s * scaleMul, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (windupK > 0.04 && !dying) {
      ctx.save();
      ctx.globalAlpha = alpha * (0.2 + windupK * 0.55) * (0.65 + Math.sin(t * 28) * 0.35);
      ctx.strokeStyle = '#ff4f6d';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff2a55';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, feetY - this.visualHeight() * 0.52, 58 * s + windupK * 14, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, feetY - bob);
    ctx.scale(this.dir * scaleMul, scaleMul);
    if (dying) ctx.rotate(k * 1.1);

    const legH = 10 * s;
    const bodyW = 68 * s;
    const bodyH = 54 * s;
    const bodyCY = -(legH + bodyH * 0.5);
    const headR = 35 * s;
    const headCY = bodyCY - bodyH * 0.42 - headR * 0.58;

    const legSwing = walk * 5 * s;
    ctx.fillStyle = this.type.leg;
    ctx.beginPath();
    ctx.ellipse(-15 * s - legSwing, -6 * s, 10 * s, 7.5 * s, 0, 0, TAU);
    ctx.ellipse(15 * s + legSwing, -6 * s, 10 * s, 7.5 * s, 0, 0, TAU);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(0, bodyCY - bodyH / 2, 0, bodyCY + bodyH / 2);
    bodyGrad.addColorStop(0, this.type.body);
    bodyGrad.addColorStop(1, this.type.leg);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, bodyCY, bodyW / 2, bodyH / 2, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = this.type.belly;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.ellipse(0, bodyCY + 4 * s, bodyW * 0.28, bodyH * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = alpha;

    const shoulderX = bodyW * 0.30;
    const shoulderY = bodyCY - bodyH * 0.12;
    let armAngle;
    if (this.attackT > 0) {
      armAngle = windupK > 0
        ? lerp(0.95, -1.65, easeOutCubic(windupK))
        : lerp(-1.65, 0.18, easeOutCubic(clamp(attackP, 0, 1)));
    } else {
      armAngle = 0.75 + walk * 0.22 * (moving ? 1 : 0);
    }
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

    const flashTint = this.flash > 0 ? `rgba(255,70,80,${clamp(this.flash * 4, 0, 0.55)})` : null;
    ctx.save();
    ctx.translate(1.5 * s, headCY);
    drawPhoto(ctx, this.img, 0, 0, headR * 2, headR * 2, headR, flashTint);
    ctx.strokeStyle = '#1c1428';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(0, 0, headR, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.arc(0, 0, headR - 2.5 * s, -2.5, -0.65);
    ctx.stroke();

    /* корона Ветерана Всевеликих */
    if (this.type.crown) {
      ctx.save();
      ctx.translate(0, -headR - 4 * s);
      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#8a5a13';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo(-16 * s, 4 * s);
      ctx.lineTo(-16 * s, -8 * s);
      ctx.lineTo(-8 * s, -1 * s);
      ctx.lineTo(0, -12 * s);
      ctx.lineTo(8 * s, -1 * s);
      ctx.lineTo(16 * s, -8 * s);
      ctx.lineTo(16 * s, 4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff5f7a';
      ctx.beginPath();
      ctx.arc(0, -2 * s, 2.2 * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    ctx.restore();

    if (windupK > 0.12 && !dying) {
      ctx.save();
      ctx.globalAlpha = alpha * (0.5 + Math.sin(t * 40) * 0.3);
      ctx.fillStyle = '#ff5d7d';
      ctx.font = `900 ${Math.round(22 * s)}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff2a55';
      ctx.shadowBlur = 12;
      ctx.fillText('!', this.x + this.dir * 44 * s, this.y - this.visualHeight() * 0.66);
      ctx.restore();
    }

    if (!dying) this.drawHealthBar(ctx);
  }

  drawHealthBar(ctx) {
    const s = this.scale;
    const w = Math.max(52, 66 * s);
    const x = this.x - w / 2;
    const crownPad = this.type.crown ? 30 : 0;
    const y = this.y - this.visualHeight() - 16 - crownPad;
    const pct = clamp(this.hpShown / this.maxHp, 0, 1);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `700 ${Math.max(10, Math.round(10 * s + 1))}px "Trebuchet MS", sans-serif`;
    ctx.fillStyle = 'rgba(236,222,255,0.82)';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(monsterName(this.type), this.x, y - 5);
    ctx.shadowBlur = 0;

    roundRectPath(ctx, x, y, w, 8, 4);
    ctx.fillStyle = 'rgba(8,5,14,0.82)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (pct > 0.01) {
      ctx.save();
      roundRectPath(ctx, x + 1.5, y + 1.5, (w - 3) * pct, 5, 2.5);
      ctx.clip();
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, '#ff4f6d');
      grad.addColorStop(1, '#ffa24d');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, 8);
      ctx.restore();
    }
    ctx.restore();
  }
}
