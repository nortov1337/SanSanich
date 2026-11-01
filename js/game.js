'use strict';

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.dpr = 1;

    this.state = 'menu';
    this.time = 0;
    this.runTime = 0;
    this.kills = 0;
    this.assetsReady = false;
    this.bestDistance = this.loadBest();

    this.camera = { x: 0, shake: 0 };
    this.flash = 0;
    this.flashColor = '#ff3d5e';
    this.hitPause = 0;

    this.player = null;
    this.monsters = [];
    this.friends = [];
    this.weaponPickups = [];
    this.runePickups = [];
    this.unibuffs = [];
    this.hearts = [];
    this.particles = [];
    this.texts = [];

    this.waveTimer = 15;
    this.overTimer = 0;
    this.stepT = 0;
    this.friendTimer = null;
    this.lastFriendType = null;
    this.friendChoice = null;

    this.chosenTalent = null;
    this.talentOffered = false;
    this.talentPending = false;
    this.talentChoices = [];
    this.talentPopup = null;

    this.lastTs = 0;
    this.loop = this.loop.bind(this);

    this.resetWorld();
    this.bindUI();
    this.fit();
    this.updateBestLabel();
    window.addEventListener('resize', () => this.fit());
    window.addEventListener('languagechange', () => {
      this.updateBestLabel();
      this.updateMuteLabel();
      if (this.state === 'talent') {
        this.updateTalentSubtitle();
        this.renderTalentChoices();
      }
      if (this.state === 'friend') {
        this.updateFriendTexts();
        this.renderFriendChoices();
      }
    });
    requestAnimationFrame(this.loop);
  }

  // рекорд

  loadBest() {
    try {
      const value = parseInt(localStorage.getItem('synSanychBest') || '0', 10);
      return Number.isFinite(value) ? value : 0;
    } catch (err) {
      return 0;
    }
  }

  saveBest() {
    try {
      localStorage.setItem('synSanychBest', String(this.bestDistance));
    } catch (err) { /* localStorage может быть недоступен */ }
  }

  updateBestLabel() {
    const el = document.getElementById('menu-best');
    if (!el) return;
    el.textContent = this.bestDistance > 0 ? formatMeters(this.bestDistance) : '—';
  }

  // подготовка

  fit() {
    const scale = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.round(GAME_W * dpr);
    this.canvas.height = Math.round(GAME_H * dpr);
    this.canvas.style.width = Math.round(GAME_W * scale) + 'px';
    this.canvas.style.height = Math.round(GAME_H * scale) + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  bindUI() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    on('btn-start', () => {
      if (!this.assetsReady) return;
      this.startGame();
    });
    on('btn-resume', () => this.setPaused(false));
    on('btn-restart-pause', () => this.startGame());
    on('btn-restart-death', () => this.startGame());
  }

  resetWorld() {
    WORLD.reset(Math.floor(Math.random() * 1e9));

    this.player = new Player(140, GROUND_Y);
    this.monsters = [];
    this.friends = [];
    this.weaponPickups = [];
    this.runePickups = [];
    this.unibuffs = [];
    this.hearts = [];
    this.particles = [];
    this.texts = [];

    this.kills = 0;
    this.runTime = 0;
    this.camera.x = 0;
    this.camera.shake = 0;
    this.flash = 0;
    this.flashColor = '#ff3d5e';
    this.hitPause = 0;
    this.waveTimer = (DATA && DATA.world && DATA.world.waves && DATA.world.waves.startDelay) || 15;
    this.overTimer = 0;
    this.friendTimer = null;
    this.lastFriendType = null;
    this.friendChoice = null;

    this.chosenTalent = null;
    this.talentOffered = false;
    this.talentPending = false;
    this.talentChoices = [];
    this.talentPopup = null;

    const created = WORLD.ensure(this.player.cx() + GAME_W * 2);
    for (const chunk of created) this.spawnChunk(chunk);
  }

  spawnChunk(chunk) {
    for (const spawn of chunk.monsters) this.monsters.push(new Monster(spawn));
    for (const item of chunk.weapons) {
      this.weaponPickups.push(new WeaponPickup(makeWeapon(item.id, item.level), item.x, item.y));
    }
    for (const item of chunk.runes) {
      this.runePickups.push(new RunePickup(item.type, item.x, item.y));
    }
    for (const item of chunk.hearts) {
      this.hearts.push(new HeartPickup(item.x, item.y, item.heal));
    }
    chunk.spawned = true;
  }

  startGame() {
    if (!this.assetsReady) return;
    Sfx.ensure();
    Sfx.start();
    this.resetWorld();
    this.applyDebugParams();
    this.state = 'playing';
    this.showOverlay(null);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  applyDebugParams() {
    const params = new URLSearchParams(window.location.search);
    const startX = parseFloat(params.get('x'));
    if (!Number.isNaN(startX) && startX > 0) {
      this.player.x = startX;
      this.player.y = GROUND_Y - this.player.h;
      this.player.lastSafe = { x: this.player.x, y: this.player.y };
      this.camera.x = Math.max(0, this.player.cx() - GAME_W * 0.42);

      const created = WORLD.ensure(this.player.cx() + GAME_W * 2);
      for (const chunk of created) this.spawnChunk(chunk);
    }
  }

  setPaused(paused) {
    if (paused) {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this.showOverlay('pause');
      Sfx.click();
    } else {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      this.showOverlay(null);
      Sfx.click();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  }

  showOverlay(name) {
    document.querySelectorAll('.overlay').forEach((el) => {
      el.classList.toggle('is-active', name !== null && el.dataset.screen === name);
    });
  }

  // дистанция и сложность

  distanceMeters() {
    if (!this.player) return 0;
    return Math.floor(depthMetersAt(this.player.cx()));
  }

  danger() {
    if (!this.player) return 0;
    return Math.max(0, this.player.cx() / 1600 + this.runTime / 100);
  }

  // события

  onDeath() {
    if (this.state === 'dying' || this.state === 'dead') return;
    this.state = 'dying';
    this.overTimer = 1.45;
    this.flash = 0.7;
    this.flashColor = '#ff3d5e';
    this.camera.shake = Math.max(this.camera.shake, 22);
    Sfx.death();
    this.spawnBurst(this.player.cx(), this.player.y + this.player.h * 0.4, '#ff5a7a', 30);
  }

  fillDeathStats() {
    const dist = this.distanceMeters();
    if (dist > this.bestDistance) {
      this.bestDistance = dist;
      this.saveBest();
    }
    this.updateBestLabel();

    document.getElementById('death-kills').textContent = String(this.kills);
    document.getElementById('death-distance').textContent = formatMeters(dist);
    document.getElementById('death-best').textContent = formatMeters(this.bestDistance);
    document.getElementById('death-time').textContent = formatTime(this.runTime);
  }

  // главный цикл

  loop(ts) {
    requestAnimationFrame(this.loop);

    if (!this.lastTs) this.lastTs = ts;
    let dt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    dt = clamp(dt, 0, 1 / 30);

    this.time += dt;
    this.handleGlobalInput();

    const active = this.state === 'playing' || this.state === 'dying';
    if (active) {
      if (this.hitPause > 0) this.hitPause = Math.max(0, this.hitPause - dt);
      else this.update(dt);
      this.runTime += dt;
    } else {
      this.updateAmbient(dt * 0.5);
    }

    this.render();
    this.input.endFrame();
  }

  updateMuteLabel() {
    const label = document.getElementById('mute-label');
    if (!label) return;
    label.textContent = Sfx.muted ? tr('hint.muted') : tr('hint.mute');
  }

  handleGlobalInput() {
    if (this.input.pressed('mute')) {
      Sfx.toggleMute();
      this.updateMuteLabel();
    }

    if (this.state === 'menu') {
      if ((this.input.pressed('jump') || this.input.pressed('confirm')) && this.assetsReady) {
        this.startGame();
      }
      return;
    }

    if (this.state === 'talent') return;

    if (this.state === 'friend') {
      if (this.input.pressed('pause')) this.closeFriendChoice(false);
      return;
    }

    if (this.state === 'playing' && this.input.pressed('pause')) {
      this.setPaused(true);
      return;
    }

    if (this.state === 'paused') {
      if (this.input.pressed('pause') || this.input.pressed('confirm')) this.setPaused(false);
      else if (this.input.pressed('restart')) this.startGame();
      return;
    }

    if (this.state === 'dead' && this.input.pressed('restart')) {
      this.startGame();
    }
  }

  update(dt) {
    const created = WORLD.ensure(this.player.cx() + GAME_W * 2.4);
    for (const chunk of created) this.spawnChunk(chunk);

    this.player.update(dt, this);

    for (const monster of this.monsters) monster.update(dt, this);
    for (const friend of this.friends) friend.update(dt, this);

    this.updateCamera(dt);
    WORLD.cull(this.camera.x);
    this.separateMonsters();

    this.monsters = this.monsters.filter((m) => {
      if (m.dead) return false;
      if (m.dying && m.deathT > 0.75) return false;
      if (m.x < this.camera.x - 1700) return false;
      return true;
    });

    this.friends = this.friends.filter((f) => !f.removed && f.x > this.camera.x - 1500);

    for (const pickup of this.weaponPickups) pickup.update(dt);
    for (const pickup of this.runePickups) pickup.update(dt);
    for (const buff of this.unibuffs) buff.update(dt, this);
    for (const heart of this.hearts) heart.update(dt);

    const cullX = this.camera.x - 1100;
    this.weaponPickups = this.weaponPickups.filter((p) => !p.removed && p.x > cullX);
    this.runePickups = this.runePickups.filter((p) => !p.removed && p.x > cullX);
    this.unibuffs = this.unibuffs.filter((b) => b.alive && b.x > cullX);
    this.hearts = this.hearts.filter((h) => h.alive && h.x > cullX);

    for (const p of this.particles) p.update(dt);
    if (this.particles.length) this.particles = this.particles.filter((p) => p.life > 0);

    for (const t of this.texts) t.update(dt);
    if (this.texts.length) this.texts = this.texts.filter((t) => t.life > 0);

    this.updateAmbient(dt);
    this.updateWaves(dt);
    this.updateFriends(dt);

    this.flash = Math.max(0, this.flash - dt * 2.1);
    if (this.talentPopup) {
      this.talentPopup.time -= dt;
      if (this.talentPopup.time <= 0) this.talentPopup = null;
    }

    if (this.state === 'dying') {
      this.overTimer -= dt;
      if (this.overTimer <= 0) {
        this.state = 'dead';
        this.fillDeathStats();
        this.showOverlay('death');
      }
    }

    this.maybeOfferTalent();
  }

  // таланты

  talentThreshold() {
    const world = (DATA && DATA.world) ? DATA.world : {};
    return world.talentKillThreshold != null ? world.talentKillThreshold : 50;
  }

  onMonsterKilled(monster) {
    this.kills++;

    if (this.chosenTalent) this.applyTalentOnKill(this.chosenTalent, monster);

    if (!this.talentOffered && this.kills >= this.talentThreshold()) {
      this.talentPending = true;
    }
  }

  applyTalentOnKill(talent, monster) {
    if (talent.effect === 'healOnKill') {
      const healed = this.player.heal(talent.value != null ? talent.value : 5);
      if (healed > 0) {
        this.addDamageText(this.player.cx(), this.player.y + 4, '+' + healed, '#7dffb0', 0.95);
        this.spawnBurst(this.player.cx(), this.player.y + this.player.h * 0.35, '#7dffb0', 7);
      }
    } else if (talent.effect === 'unibuffEveryKills') {
      const every = Math.max(1, talent.kills || 10);
      if (this.kills % every === 0) {
        const amount = talent.amount || 10;
        this.player.addUniBuffs(amount);
        this.addDamageText(
          this.player.cx(),
          this.player.y - 6,
          tr('hud.unibuffGain', { n: amount }),
          UNIBUFF.color,
          1.15
        );
        this.spawnBurst(this.player.cx(), this.player.y + this.player.h * 0.4, UNIBUFF.color, 30);
        Sfx.pickup();
      }
    }
  }

  maybeOfferTalent() {
    if (!this.talentPending || this.talentOffered || this.chosenTalent) return;
    if (this.state !== 'playing') return;

    const pool = Object.values(TALENTS || {});
    if (!pool.length) {
      this.talentOffered = true;
      this.talentPending = false;
      return;
    }

    const maxChoices = (DATA && DATA.world && DATA.world.talentChoices) || 2;
    this.talentChoices = shuffle(pool.slice()).slice(0, Math.min(maxChoices, pool.length));
    this.talentPending = false;
    this.talentOffered = true;
    this.state = 'talent';

    const subtitle = document.getElementById('talent-subtitle');
    if (subtitle) {
      subtitle.textContent = tr('talent.subtitle', { n: this.talentThreshold() });
    }

    this.renderTalentChoices();
    this.showOverlay('talent');
    Sfx.click();
  }

  updateTalentSubtitle() {
    const subtitle = document.getElementById('talent-subtitle');
    if (!subtitle) return;
    subtitle.textContent = tr('talent.subtitle', { n: this.talentThreshold() });
  }

  renderTalentChoices() {
    const container = document.getElementById('talent-options');
    if (!container) return;
    container.innerHTML = '';

    for (const talent of this.talentChoices) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'talent-card';

      const icon = document.createElement('span');
      icon.className = 'talent-card__icon';
      icon.textContent = talent.icon || '★';

      const name = document.createElement('strong');
      name.textContent = talentName(talent) || tr('talent.title');

      const description = document.createElement('span');
      description.className = 'talent-card__desc';
      description.textContent = talentDescription(talent);

      const pick = document.createElement('span');
      pick.className = 'talent-card__pick';
      pick.textContent = tr('talent.pick');

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(description);
      card.appendChild(pick);
      card.addEventListener('click', () => this.chooseTalent(talent));
      container.appendChild(card);
    }
  }

  chooseTalent(talent) {
    if (this.chosenTalent) return;
    this.chosenTalent = talent;
    this.talentPending = false;
    this.talentOffered = true;
    this.state = 'playing';
    this.showOverlay(null);

    this.talentPopup = { talent, time: 3.2 };
    this.player.invuln = Math.max(this.player.invuln, 1.0);
    this.spawnBurst(this.player.cx(), this.player.y + this.player.h * 0.4, '#ffd166', 26);
    Sfx.pickup();
  }

  updateWaves(dt) {
    const cfg = (DATA && DATA.world && DATA.world.waves) ? DATA.world.waves : {};
    const minInterval = cfg.minInterval != null ? cfg.minInterval : 5;
    const baseInterval = cfg.baseInterval != null ? cfg.baseInterval : 15;
    const dangerInterval = cfg.dangerInterval != null ? cfg.dangerInterval : 0.6;

    this.waveTimer -= dt;
    if (this.waveTimer > 0) return;

    const danger = this.danger();
    this.waveTimer = Math.max(minInterval, baseInterval - danger * dangerInterval) * rand(0.85, 1.3);

    const maxMonsters = cfg.maxMonsters != null ? cfg.maxMonsters : 55;
    if (this.monsters.length >= maxMonsters) return;

    const count = 1 + Math.min(3, Math.floor(danger / 2.5));
    const pool = monsterPool(danger, this.distanceMeters());
    const fromRight = chance(0.5);
    const baseX = fromRight ? this.camera.x + GAME_W + 120 : this.camera.x - 120;

    for (let i = 0; i < count; i++) {
      const x = WORLD.findGroundNear(baseX + rand(-150, 150), 700);
      if (x == null || x < 20) continue;
      const type = pickFrom(Math.random, pool);
      this.monsters.push(new Monster({ type, x, y: GROUND_Y, power: danger }));
    }
  }

  // дружелюбные персонажи

  updateFriends(dt) {
    const cfg = (DATA && DATA.friends) ? DATA.friends : null;
    if (!cfg || !cfg.types) return;
    if (!this.friends) this.friends = [];

    this.friends = this.friends.filter((f) => !f.removed && f.x > this.camera.x - 1500);

    const minKills = cfg.minKills != null ? cfg.minKills : 15;
    if (this.kills < minKills || this.state !== 'playing') {
      if (this.kills < minKills) this.friendTimer = null;
      return;
    }

    if (this.friendTimer == null) {
      const firstMin = cfg.firstDelayMin != null ? cfg.firstDelayMin : 20;
      const firstMax = cfg.firstDelayMax != null ? cfg.firstDelayMax : 45;
      this.friendTimer = rand(firstMin, firstMax);
    }

    this.friendTimer -= dt;
    if (this.friendTimer > 0) return;

    const maxActive = cfg.maxActive != null ? cfg.maxActive : 1;
    if (this.friends.length >= maxActive) {
      this.friendTimer = 8;
      return;
    }

    this.spawnFriend();
    this.friendTimer = rand(
      cfg.delayMin != null ? cfg.delayMin : 40,
      cfg.delayMax != null ? cfg.delayMax : 95
    );
  }

  spawnFriend(typeKey) {
    const cfg = (DATA && DATA.friends) ? DATA.friends : null;
    if (!cfg || !cfg.types) return null;

    const types = cfg.types;
    let key = typeKey;
    if (!key) {
      const keys = Object.keys(types).filter((k) => k !== this.lastFriendType);
      const pool = keys.length ? keys : Object.keys(types);
      key = pickFrom(Math.random, pool);
    }
    const type = types[key];
    if (!type) return null;

    const dir = this.player.facing || 1;
    let x = null;
    for (let i = 0; i < 10 && x == null; i++) {
      const target = this.player.cx() + dir * rand(480, 720);
      x = WORLD.findGroundNear(target, 900);
    }
    if (x == null) x = WORLD.findGroundNear(this.player.cx() + 520, 1200);
    if (x == null) return null;

    const friend = new Friend(type, x, GROUND_Y);
    this.friends.push(friend);
    this.lastFriendType = key;

    this.addDamageText(x, GROUND_Y - 152, friendName(type), type.accent, 1.15);
    this.spawnBurst(x, GROUND_Y - 58, type.accent, 20);
    Sfx.hello();
    return friend;
  }

  talkToFriend(friend) {
    if (!friend || friend.removed || friend.dismissT > 0) return;
    if (this.state !== 'playing') return;

    if (friend.type.effect === 'choice') {
      this.openFriendChoice(friend);
      return;
    }

    this.applyFriendEffect(friend);
  }

  applyFriendEffect(friend) {
    const effectCfg = (DATA && DATA.effects) ? DATA.effects[friend.type.buff] : null;
    if (!effectCfg) return;

    const player = this.player;
    player.addEffect(friend.type.buff, effectCfg);

    const seconds = Math.round(effectCfg.duration != null ? effectCfg.duration : 10);
    this.addDamageText(
      friend.x,
      friend.y - friend.visualHeight() - 10,
      tr('friend.effectGain', { name: effectName(effectCfg), n: seconds }),
      effectCfg.color,
      1.1
    );
    this.spawnBurst(friend.x, friend.y - friend.visualHeight() * 0.5, effectCfg.color, 32);
    this.spawnBurst(friend.x, friend.y - friend.visualHeight() * 0.5, friend.type.accent, 14);
    this.camera.shake = Math.max(this.camera.shake, 8);
    friend.dismiss(this);
    Sfx.buff();
  }

  openFriendChoice(friend) {
    this.friendChoice = { friend };
    this.state = 'friend';
    this.updateFriendTexts();
    this.renderFriendChoices();
    this.showOverlay('friend');
    Sfx.click();
  }

  updateFriendTexts() {
    if (!this.friendChoice) return;
    const type = this.friendChoice.friend.type;
    const title = document.getElementById('friend-title');
    if (title) title.textContent = friendName(type);
    const subtitle = document.getElementById('friend-subtitle');
    if (subtitle) subtitle.textContent = friendGreeting(type) || '';
  }

  renderFriendChoices() {
    const container = document.getElementById('friend-options');
    if (!container || !this.friendChoice) return;
    container.innerHTML = '';

    const type = this.friendChoice.friend.type;
    for (const option of (type.options || [])) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'talent-card';

      const icon = document.createElement('span');
      icon.className = 'talent-card__icon';
      icon.textContent = option.icon || '★';

      const name = document.createElement('strong');
      name.textContent = friendOptionName(option);

      const description = document.createElement('span');
      description.className = 'talent-card__desc';
      description.textContent = friendOptionDescription(option);

      const pick = document.createElement('span');
      pick.className = 'talent-card__pick';
      pick.textContent = tr('talent.pick');

      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(description);
      card.appendChild(pick);
      card.addEventListener('click', () => this.chooseFriendOption(option));
      container.appendChild(card);
    }
  }

  chooseFriendOption(option) {
    if (!this.friendChoice || !option) return;
    const friend = this.friendChoice.friend;
    const player = this.player;

    if (option.stat === 'hp') player.addMaxHp(option.amount);
    else if (option.stat === 'damage') player.addFlatDamage(option.amount);
    else if (option.stat === 'speed') player.addFlatSpeed(option.amount);
    player.gifts.push(option);

    this.addDamageText(
      friend.x,
      friend.y - friend.visualHeight() - 10,
      friendOptionName(option),
      friend.type.accent,
      1.12
    );
    this.spawnBurst(friend.x, friend.y - friend.visualHeight() * 0.5, friend.type.accent, 36);
    friend.dismiss(this);
    Sfx.buff();

    this.closeFriendChoice(true);
  }

  closeFriendChoice(applied) {
    this.friendChoice = null;
    this.state = 'playing';
    this.showOverlay(null);
    if (this.player) {
      this.player.invuln = Math.max(this.player.invuln, applied ? 0.8 : 0.2);
      this.player.nearFriend = null;
    }
  }

  separateMonsters() {
    const list = this.monsters;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dying) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dying) continue;
        if (Math.abs(a.y - b.y) > 60) continue;
        const minDist = (a.w + b.w) * 0.5 * 1.4;
        const dx = b.x - a.x;
        if (Math.abs(dx) >= minDist) continue;
        const dir = dx === 0 ? (i % 2 ? 1 : -1) : signOf(dx);
        const push = (minDist - Math.abs(dx)) * 0.35;
        a.x -= dir * push;
        b.x += dir * push;
      }
    }
  }

  updateAmbient(dt) {
    this.stepT -= dt;
    if (this.stepT <= 0) {
      this.stepT = 0.06;
      if (this.particles.length < 300) {
        this.particles.push(new Particle({
          x: this.camera.x + rand(-60, GAME_W + 60),
          y: rand(120, 620),
          vx: rand(-14, 14),
          vy: rand(-22, -6),
          life: rand(2.5, 5),
          size: rand(1, 2.6),
          color: 'rgba(186,158,255,0.5)',
          gravity: 0,
          drag: 1,
          shape: 'circle'
        }));
      }
    }
  }

  updateCamera(dt) {
    const p = this.player;
    const target = Math.max(0, p.cx() - GAME_W * 0.42 + p.facing * 60);
    this.camera.x = lerp(this.camera.x, target, 1 - Math.exp(-6 * dt));
    this.camera.shake *= Math.exp(-9 * dt);
    if (this.camera.shake < 0.2) this.camera.shake = 0;
  }

  // эффекты и экономика

  spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-300, 300),
        vy: rand(-320, 110),
        life: rand(0.32, 0.8),
        size: rand(2, 6),
        color,
        gravity: 780,
        drag: 0.93,
        shape: Math.random() < 0.35 ? 'spark' : (Math.random() < 0.3 ? 'square' : 'circle')
      }));
    }
  }

  addDamageText(x, y, text, color, scale = 1) {
    this.texts.push(new DamageText(x, y, text, color, scale));
  }

  equip(pickup) {
    if (!pickup || pickup.removed) return;
    const p = this.player;
    pickup.removed = true;

    if (pickup.kind === 'weapon') {
      const oldWeapon = p.weapon;
      p.weapon = pickup.wpn;
      p.attackT = 0;
      p.attackCd = 0.18;
      this.weaponPickups = this.weaponPickups.filter((item) => item !== pickup);

      if (oldWeapon.id !== 'fist') {
        const dropX = Math.max(40, p.cx() - p.facing * 72);
        this.weaponPickups.push(new WeaponPickup(oldWeapon, dropX, p.y + p.h - 36));
      }

      this.addDamageText(pickup.x, pickup.y - 34, weaponLabel(pickup.wpn), pickup.wpn.color, 0.95);
      this.spawnBurst(pickup.x, pickup.y, pickup.wpn.color, 22);
      Sfx.pickup();
    } else if (pickup.kind === 'rune') {
      p.runes[pickup.type] = (p.runes[pickup.type] || 0) + 1;
      this.runePickups = this.runePickups.filter((item) => item !== pickup);
      this.addDamageText(
        pickup.x,
        pickup.y - 40,
        tr('hud.runeGain', { name: runeName(pickup.rune) }),
        pickup.rune.color,
        1.05
      );
      this.spawnBurst(pickup.x, pickup.y, pickup.rune.color, 26);
      Sfx.pickup();
    }

    p.nearPickup = null;
    this.camera.shake = Math.max(this.camera.shake, 6);
  }

  // рендер

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake * 0.55;
    const camX = this.camera.x + shakeX;

    Render.background(ctx, this, camX);

    ctx.save();
    ctx.translate(-camX, shakeY);

    Render.world(ctx, this, camX);

    for (const heart of this.hearts) heart.draw(ctx);
    for (const pickup of this.runePickups) pickup.draw(ctx, this);
    for (const pickup of this.weaponPickups) pickup.draw(ctx, this);
    for (const buff of this.unibuffs) buff.draw(ctx);
    for (const monster of this.monsters) monster.draw(ctx, this);
    for (const friend of this.friends) friend.draw(ctx, this);
    this.player.draw(ctx, this);

    for (const particle of this.particles) particle.draw(ctx);
    for (const text of this.texts) text.draw(ctx);

    ctx.restore();

    Render.vignette(ctx);
    if (this.state !== 'menu') Render.hud(ctx, this);
    Render.screenEffects(ctx, this);
  }
}
