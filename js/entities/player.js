'use strict';

class Player {
  constructor(x, feetY) {
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.x = x;
    this.y = feetY - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.airJumps = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    const startHp = (DATA && DATA.player && DATA.player.maxHp) || 100;
    this.maxHp = startHp;
    this.hp = startHp;
    this.unibuffs = 0;
    this.runes = { red: 0, delta: 0, zetel: 0 };
    this.bonus = { maxHp: 0, damage: 0, speed: 0 };
    this.gifts = [];
    this.effects = {};
    this.weapon = makeWeapon('fist', 0);
    this.attackT = 0;
    this.attackDur = 0.24;
    this.attackCd = 0;
    this.attackHit = false;
    this.invuln = 0;
    this.immuneTextCd = 0;
    this.animTime = 0;
    this.stepTimer = 0;
    this.dead = false;
    this.deathRot = 0;
    this.nearPickup = null;
    this.nearFriend = null;
    this.lastSafe = { x, y: this.y };
  }

  cx() { return this.x + this.w / 2; }
  feet() { return this.y + this.h; }

  box() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  // характеристики

  runSpeed() {
    const fromBuffs = 1 + UNIBUFF.moveSpeed * this.unibuffs;
    const red = RUNE_TYPES.red && RUNE_TYPES.red.moveBonus != null ? RUNE_TYPES.red.moveBonus : 0.07;
    const fromRed = 1 + red * this.runes.red;
    const cap = DATA && DATA.player && DATA.player.maxMoveSpeedMultiplier != null
      ? DATA.player.maxMoveSpeedMultiplier
      : 2.5;
    const base = RUN_SPEED * Math.min(cap, fromBuffs * fromRed) + this.bonus.speed;
    return base * this.effectMultiplier('moveSpeedMultiplier');
  }

  attackSpeedMultiplier() {
    const fromBuffs = 1 / (1 + UNIBUFF.attackSpeed * this.unibuffs);
    const delta = RUNE_TYPES.delta && RUNE_TYPES.delta.attackSpeedBonus != null
      ? RUNE_TYPES.delta.attackSpeedBonus
      : 0.12;
    const fromDelta = 1 / (1 + delta * this.runes.delta);
    const minMult = DATA && DATA.player && DATA.player.minAttackCooldownMultiplier != null
      ? DATA.player.minAttackCooldownMultiplier
      : 0.35;
    return Math.max(minMult, fromBuffs * fromDelta);
  }

  attackInterval() {
    const spd = this.attackCooldownMultiplier();
    return Math.max(this.weapon.duration * spd + 0.02, this.weapon.cd * spd);
  }

  attackCooldownMultiplier() {
    return this.attackSpeedMultiplier() / this.effectMultiplier('attackSpeedMultiplier');
  }

  attackRate() {
    return 1 / this.attackInterval();
  }

  damageMultiplier() {
    const zetel = RUNE_TYPES.zetel && RUNE_TYPES.zetel.damageBonus != null
      ? RUNE_TYPES.zetel.damageBonus
      : 1.0;
    return (1 + UNIBUFF.damage * this.unibuffs) * (1 + this.runes.zetel * zetel);
  }

  effectiveDamage() {
    const base = this.weapon.dmg * this.damageMultiplier() + this.bonus.damage;
    return Math.max(1, Math.round(base * this.effectMultiplier('damageMultiplier')));
  }

  // временные эффекты друзей

  effectMultiplier(key) {
    let mult = 1;
    for (const id of Object.keys(this.effects)) {
      const cfg = this.effects[id].cfg;
      if (cfg && cfg[key]) mult *= cfg[key];
    }
    return mult;
  }

  isInvulnerable() {
    for (const id of Object.keys(this.effects)) {
      const cfg = this.effects[id].cfg;
      if (cfg && cfg.invulnerable) return true;
    }
    return false;
  }

  activeEffects() {
    return Object.keys(this.effects)
      .map((id) => this.effects[id])
      .sort((a, b) => a.time - b.time);
  }

  addEffect(id, cfg) {
    if (!cfg) return;
    const duration = cfg.duration != null ? cfg.duration : 10;
    this.effects[id] = { id, cfg, time: duration, total: duration };
    if (cfg.healToFull) this.hp = this.maxHp;
  }

  updateEffects(dt) {
    for (const id of Object.keys(this.effects)) {
      const effect = this.effects[id];
      effect.time -= dt;
      if (effect.time <= 0) delete this.effects[id];
    }
  }

  addMaxHp(amount) {
    const value = Math.round(amount);
    if (!value) return;
    this.bonus.maxHp += value;
    this.maxHp += value;
    this.hp = Math.min(this.maxHp, this.hp + value);
  }

  addFlatDamage(amount) {
    this.bonus.damage += Math.round(amount);
  }

  addFlatSpeed(amount) {
    this.bonus.speed += Math.round(amount);
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return Math.round(this.hp - before);
  }

  addUniBuffs(count) {
    const n = Math.max(0, Math.floor(count));
    if (!n) return;
    const hpPer = UNIBUFF.maxHp != null ? UNIBUFF.maxHp : 0;
    this.unibuffs += n;
    this.maxHp += hpPer * n;
    this.hp = Math.min(this.maxHp, this.hp + hpPer * n);
  }

  // обновление

  update(dt, game) {
    const input = game.input;
    this.animTime += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.immuneTextCd = Math.max(0, this.immuneTextCd - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.updateEffects(dt);

    if (this.dead) {
      this.deathRot += dt * 5;
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
      this.vx *= Math.max(0, 1 - dt * 2);
      this.moveAndCollide(dt);
      return;
    }

    /* атака */
    if (this.attackT > 0) {
      this.attackT -= dt;
      if (!this.attackHit && this.attackT <= this.attackDur * 0.55) {
        this.attackHit = true;
        this.doAttack(game);
      }
      if (this.attackT < 0) this.attackT = 0;
    }

    /* движение */
    const axis = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const speedMul = this.attackT > 0 ? 0.6 : 1;

    if (axis !== 0) {
      this.facing = axis;
      const accel = this.onGround ? ACCEL : AIR_ACCEL;
      this.vx = approach(this.vx, axis * this.runSpeed() * speedMul, accel * dt);
    } else {
      const decel = this.onGround ? FRICTION : AIR_ACCEL * 0.45;
      this.vx = approach(this.vx, 0, decel * dt);
    }

    /* прыжок (двойной) */
    if (this.onGround) this.airJumps = 1;
    this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt);

    if (input.pressed('jump')) this.jumpBuffer = 0.14;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    if (this.jumpBuffer > 0) {
      if (this.onGround || this.coyote > 0) {
        this.vy = JUMP_V;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        game.spawnBurst(this.cx(), this.feet(), '#9d8fc4', 7);
        Sfx.jump();
      } else if (this.airJumps > 0) {
        this.airJumps--;
        this.vy = JUMP_V * 0.92;
        this.jumpBuffer = 0;
        game.spawnBurst(this.cx(), this.feet() - 6, '#c7b6ff', 10);
        Sfx.doubleJump();
      }
    }

    if (!input.isDown('jump') && this.vy < -260) this.vy += GRAVITY * 1.9 * dt;
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

    /* удар */
    if (input.pressed('attack') && this.attackCd <= 0) {
      const spd = this.attackCooldownMultiplier();
      this.attackDur = this.weapon.duration * spd;
      this.attackT = this.attackDur;
      this.attackCd = Math.max(this.attackDur + 0.02, this.weapon.cd * spd);
      this.attackHit = false;
      Sfx.swing(this.weapon);
    }

    /* ближайший предмет: оружие или руна */
    this.nearPickup = null;
    let bestDist = Infinity;
    const lists = [game.weaponPickups, game.runePickups];
    for (const list of lists) {
      for (const pickup of list) {
        if (pickup.removed) continue;
        const dx = pickup.x - this.cx();
        const dy = pickup.y - (this.y + this.h * 0.45);
        if (Math.abs(dx) > 100 || Math.abs(dy) > 72) continue;
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          this.nearPickup = pickup;
        }
      }
    }

    /* дружелюбные персонажи: подойти и нажать E */
    this.nearFriend = null;
    let bestFriendDist = Infinity;
    const friends = game.friends || [];
    for (const friend of friends) {
      if (friend.removed || friend.dismissT > 0) continue;
      const dx = friend.x - this.cx();
      const dy = friend.y - (this.y + this.h * 0.5);
      if (Math.abs(dx) > 118 || Math.abs(dy) > 96) continue;
      const dist = Math.hypot(dx, dy);
      if (dist < bestFriendDist) {
        bestFriendDist = dist;
        this.nearFriend = friend;
      }
    }

    if (this.nearFriend) {
      this.nearPickup = null;
      if (input.pressed('interact')) game.talkToFriend(this.nearFriend);
    } else if (this.nearPickup && input.pressed('interact')) {
      game.equip(this.nearPickup);
    }

    /* сердца */
    for (const heart of game.hearts) {
      if (!heart.alive) continue;
      const hb = { x: heart.x - 20, y: heart.y - 20, w: 40, h: 40 };
      if (overlap(this.box(), hb)) heart.collect(game, this);
    }

    this.moveAndCollide(dt);

    /* пыль из-под лап */
    if (this.onGround && Math.abs(this.vx) > 220) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.16;
        game.particles.push(new Particle({
          x: this.cx() - this.facing * 12,
          y: this.feet() - 2,
          vx: -this.facing * rand(20, 70),
          vy: rand(-60, -15),
          life: rand(0.3, 0.5),
          size: rand(2, 4),
          color: 'rgba(190,170,220,0.5)',
          gravity: 260,
          drag: 0.94
        }));
      }
    }

    /* точка возрождения */
    if (this.onGround) {
      const seg = WORLD.groundAt(this.cx());
      if (seg && this.feet() >= GROUND_Y - 3 && this.feet() <= GROUND_Y + 8 &&
          this.cx() > seg.x + 45 && this.cx() < seg.x + seg.w - 45) {
        this.lastSafe = { x: this.x, y: this.y };
      }
    }

    /* падение в яму */
    if (this.y > 820) {
      this.takeDamage(16, this.cx(), game);
      if (!this.dead) {
        this.x = this.lastSafe.x;
        this.y = this.lastSafe.y;
        this.vx = 0;
        this.vy = 0;
        this.invuln = Math.max(this.invuln, 0.9);
        game.spawnBurst(this.cx(), this.feet() - 20, '#b06aff', 20);
        game.camera.shake = 16;
        game.flash = Math.max(game.flash, 0.5);
      }
    }
  }

  moveAndCollide(dt) {
    this.x += this.vx * dt;
    for (const s of SOLIDS) {
      if (s.oneWay) continue;
      if (overlap(this.box(), s)) {
        if (this.vx > 0) this.x = s.x - this.w;
        else if (this.vx < 0) this.x = s.x + s.w;
        this.vx = 0;
      }
    }
    if (this.x < 0) {
      this.x = 0;
      if (this.vx < 0) this.vx = 0;
    }

    const prevFeet = this.y + this.h;
    this.y += this.vy * dt;
    this.onGround = false;

    for (const s of SOLIDS) {
      if (!overlap(this.box(), s)) continue;
      if (s.oneWay) {
        if (this.vy > 0 && prevFeet <= s.y + 4) {
          this.y = s.y - this.h;
          this.vy = 0;
          this.onGround = true;
        }
        continue;
      }
      if (this.vy > 0) {
        this.y = s.y - this.h;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = s.y + s.h;
        this.vy = 0;
      }
    }
  }

  doAttack(game) {
    const reach = this.weapon.reach;
    const damage = this.effectiveDamage();
    const box = this.facing > 0
      ? { x: this.cx() - 8, y: this.y + 6, w: reach, h: this.h - 10 }
      : { x: this.cx() + 8 - reach, y: this.y + 6, w: reach, h: this.h - 10 };

    let hitAny = false;
    for (const m of game.monsters) {
      if (m.dying) continue;
      if (!overlap(box, m.box())) continue;
      const dir = signOf(m.x - this.cx()) || this.facing;
      m.hurt(damage, dir, this.weapon.knock, game);
      game.addDamageText(
        m.x + rand(-10, 10),
        m.y - m.visualHeight() * 0.62,
        String(damage),
        this.weapon.id === 'fist' ? '#ffe6a3' : this.weapon.color,
        1
      );
      hitAny = true;
    }

    if (hitAny) {
      Sfx.hit();
      game.camera.shake = Math.max(game.camera.shake, 9 + Math.min(10, this.weapon.tier * 1.4));
      game.hitPause = Math.max(game.hitPause, 0.05);
      const hx = this.cx() + this.facing * reach * 0.6;
      game.spawnBurst(hx, this.y + this.h * 0.45, this.weapon.color, 8 + Math.min(14, this.weapon.tier * 2));
    }
  }

  takeDamage(amount, srcX, game, ignoreInvuln = false) {
    if (this.dead) return;

    if (this.isInvulnerable()) {
      this.invuln = Math.max(this.invuln, 0.3);
      if (game && this.immuneTextCd <= 0) {
        this.immuneTextCd = 0.9;
        game.addDamageText(this.cx(), this.y - 4, tr('hud.immune'), '#ffd166', 1);
        game.spawnBurst(this.cx(), this.y + this.h * 0.45, '#ffd166', 8);
      }
      return;
    }

    if (this.invuln > 0 && !ignoreInvuln) return;

    const finalDamage = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - finalDamage);
    this.invuln = 0.95;
    const dir = signOf(this.cx() - srcX) || 1;
    this.vx = dir * 260;
    this.vy = -190;

    game.camera.shake = Math.max(game.camera.shake, 17);
    game.flash = 0.55;
    game.flashColor = '#ff3d5e';
    game.hitPause = Math.max(game.hitPause, 0.04);
    game.addDamageText(this.cx(), this.y + 8, '-' + finalDamage, '#ff6b8a', 1.2);
    game.spawnBurst(this.cx(), this.y + this.h * 0.4, '#ff5a7a', 16);
    Sfx.hurt();

    if (this.hp <= 0) {
      this.dead = true;
      this.deathRot = 0;
      game.onDeath();
    }
  }

  // отрисовка

  draw(ctx, game) {
    const cx = this.cx();
    const feet = this.feet();
    const run = Math.min(1, Math.abs(this.vx) / this.runSpeed());
    const bob = this.onGround ? Math.abs(Math.sin(this.animTime * 13)) * 2.2 * run : 0;
    const t = game.time;

    if (this.dead && this.deathRot > 2.4) {
      ctx.globalAlpha = Math.max(0, 1 - (this.deathRot - 2.4) / 1.2);
    }

    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, feet + 3, 28, 7.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha *= 0.5;
    ctx.strokeStyle = 'rgba(255,209,102,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, feet + 3, 31, 8.5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const shield = this.activeEffects().find((effect) => effect.cfg && effect.cfg.invulnerable);
    if (shield && !this.dead) {
      const shieldColor = shield.cfg.color || '#ffd166';
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.18;
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(cx, feet - 34, 36, 46, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, feet - bob);
    if (this.dead) ctx.rotate(Math.min(this.deathRot, 1.6) * this.facing);
    ctx.scale(this.facing, 1);

    if (this.invuln > 0 && !this.dead) {
      ctx.globalAlpha *= (Math.floor(this.invuln * 18) % 2 === 0) ? 0.42 : 1;
    }

    const furDark = '#6f6b7b';
    const fur = '#8f8c9b';
    const swingP = this.attackT > 0 ? 1 - this.attackT / this.attackDur : 0;
    const lean = this.attackT > 0 ? 5 : 0;

    /* хвост */
    const tailWave = Math.sin(t * 5 + this.animTime * 6) * 9;
    ctx.strokeStyle = furDark;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.bezierCurveTo(-42, -34 + tailWave * 0.4, -48, -58 - tailWave * 0.5, -30 + tailWave, -70);
    ctx.stroke();
    ctx.strokeStyle = fur;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.bezierCurveTo(-42, -34 + tailWave * 0.4, -48, -58 - tailWave * 0.5, -30 + tailWave, -70);
    ctx.stroke();

    /* лапы */
    const legSwing = Math.sin(this.animTime * 16) * 6 * run;
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(-11 - legSwing, -8, 9.5, 7, 0, 0, TAU);
    ctx.ellipse(11 + legSwing, -8, 9.5, 7, 0, 0, TAU);
    ctx.fill();

    /* тело */
    ctx.save();
    ctx.translate(lean, 0);
    const bodyGrad = ctx.createLinearGradient(0, -58, 0, -6);
    bodyGrad.addColorStop(0, '#a09dab');
    bodyGrad.addColorStop(1, '#6c6878');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -30, 27, 26, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(220,214,230,0.42)';
    ctx.beginPath();
    ctx.ellipse(0, -24, 16, 15, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    /* шарф */
    ctx.save();
    ctx.translate(lean, 0);
    const scarfWave = Math.sin(t * 8 + this.animTime * 8) * 4;
    ctx.fillStyle = '#e2445c';
    ctx.beginPath();
    ctx.ellipse(0, -48, 20, 8, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-14, -48);
    ctx.quadraticCurveTo(-34, -44 + scarfWave, -42, -30 + scarfWave);
    ctx.quadraticCurveTo(-30, -34 + scarfWave, -18, -42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-16, -51, 30, 2.5);
    ctx.restore();

    /* голова */
    ctx.save();
    ctx.translate(lean * 0.6, -58);
    ctx.rotate(this.dead ? 0 : (this.onGround ? 0 : clamp(this.vy / 4200, -0.09, 0.12)));
    const headBob = this.onGround ? Math.sin(this.animTime * 13) * 1.5 * run : 0;
    ctx.translate(0, headBob);
    drawPhoto(ctx, IMAGES.hero, 0, 0, 52, 52, 26);
    ctx.strokeStyle = '#231b32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 23.5, -2.4, -0.6);
    ctx.stroke();

    /* корона героя */
    ctx.save();
    ctx.translate(0, -24);
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#8a5a13';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-7, -2);
    ctx.lineTo(0, -11);
    ctx.lineTo(7, -2);
    ctx.lineTo(14, -8);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5f7a';
    ctx.beginPath();
    ctx.arc(0, -2, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    /* рука и оружие */
    const handX = 23;
    const handY = -39;
    let angle;
    if (this.attackT > 0) {
      angle = lerp(-2.2, 1.05, easeOutCubic(clamp(swingP * 1.15, 0, 1)));
    } else {
      angle = 0.48 + Math.sin(this.animTime * 3) * 0.06 + (this.onGround ? 0 : -0.22);
    }

    /* след удара */
    if (this.attackT > 0 && swingP > 0.04) {
      const a0 = -2.2;
      ctx.save();
      ctx.translate(handX, handY);
      ctx.globalAlpha *= (1 - swingP) * 0.8;
      ctx.strokeStyle = this.weapon.color;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.weapon.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.weapon.reach * 0.72, a0, angle);
      ctx.stroke();
      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.weapon.reach * 0.72, a0, angle);
      ctx.stroke();
      ctx.restore();
    }

    /* плечо-рука */
    ctx.strokeStyle = fur;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(11, -40);
    ctx.lineTo(handX - 2, handY + 2);
    ctx.stroke();

    drawWeapon(ctx, this.weapon, handX, handY, angle, 0.9);

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
