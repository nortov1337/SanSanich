'use strict';

Render.hud = function (ctx, game) {
  const p = game.player;
  if (!p) return;

  drawHealth(ctx, game, p);
  drawStats(ctx, p);
  drawBuffs(ctx, p);
  drawEffects(ctx, p);
  drawKills(ctx, game);
  drawDepth(ctx, game);
  drawTalentPopup(ctx, game);
  drawWeaponCard(ctx, p);
};

Render.vignette = function (ctx) {
  const v = ctx.createRadialGradient(
    GAME_W / 2, GAME_H / 2, GAME_H * 0.32,
    GAME_W / 2, GAME_H / 2, GAME_H * 0.9
  );
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(4,2,10,0.7)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
};

Render.screenEffects = function (ctx, game) {
  if (game.flash > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(game.flash, 0, 1) * 0.42;
    ctx.fillStyle = game.flashColor || '#ff3d5e';
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.restore();
  }

  const p = game.player;
  if (p && !p.dead && p.hp / p.maxHp < 0.3) {
    const pulse = 0.12 + Math.sin(game.time * 6) * 0.06;
    const g = ctx.createRadialGradient(
      GAME_W / 2, GAME_H / 2, GAME_H * 0.3,
      GAME_W / 2, GAME_H / 2, GAME_H * 0.78
    );
    g.addColorStop(0, 'rgba(255,20,60,0)');
    g.addColorStop(1, 'rgba(255,20,60,' + pulse.toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
  }
};

// блоки

function drawHealth(ctx, game, p) {
  const pct = clamp(p.hp / p.maxHp, 0, 1);

  hudPanel(ctx, 22, 20, 336, 84);
  drawPhoto(ctx, IMAGES.hero, 62, 62, 58, 58, 13);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, 33, 33, 58, 58, 13);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(214,198,240,0.7)';
  ctx.fillText(tr('hud.health'), 100, 44);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(240,234,255,0.9)';
  ctx.fillText(Math.ceil(p.hp) + ' / ' + p.maxHp, 338, 44);

  const bx = 100;
  const by = 52;
  const bw = 238;
  const bh = 18;

  roundRectPath(ctx, bx, by, bw, bh, 9);
  ctx.fillStyle = 'rgba(8,4,16,0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (pct > 0.01) {
    ctx.save();
    roundRectPath(ctx, bx + 2, by + 2, (bw - 4) * pct, bh - 4, 7);
    ctx.clip();
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    if (pct > 0.55) {
      grad.addColorStop(0, '#5effa8');
      grad.addColorStop(1, '#b8ff6a');
    } else if (pct > 0.28) {
      grad.addColorStop(0, '#ffc24d');
      grad.addColorStop(1, '#ff8a3d');
    } else {
      grad.addColorStop(0, '#ff4f6d');
      grad.addColorStop(1, '#ff2a55');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(bx, by + 2, bw, 4);
    ctx.restore();
  }

  ctx.textAlign = 'left';
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255,209,102,0.8)';
  ctx.fillText(tr('hud.hero'), 100, 88);
}

function drawStats(ctx, p) {
  const y = 112;
  hudPanel(ctx, 22, y, 336, 62);

  const stats = [
    { label: tr('hud.damage'), value: String(p.effectiveDamage()), color: '#ffd166' },
    { label: tr('hud.attackSpeed'), value: p.attackRate().toFixed(1) + tr('hud.attackRateSuffix'), color: '#6fd8ff' },
    { label: tr('hud.speed'), value: String(Math.round(p.runSpeed())), color: '#7dffb0' }
  ];

  ctx.textAlign = 'center';
  stats.forEach((stat, i) => {
    const cx = 78 + i * 112;
    ctx.font = '700 9px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(206,194,230,0.6)';
    ctx.fillText(stat.label, cx, y + 22);

    ctx.font = '800 17px "Trebuchet MS", sans-serif';
    ctx.fillStyle = stat.color;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(stat.value, cx, y + 44);
    ctx.shadowBlur = 0;
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(134, y + 10);
  ctx.lineTo(134, y + 52);
  ctx.moveTo(246, y + 10);
  ctx.lineTo(246, y + 52);
  ctx.stroke();
}

function drawBuffs(ctx, p) {
  const y = 182;
  hudPanel(ctx, 22, y, 336, 44);

  drawBuffStar(ctx, 46, y + 22, 11);

  ctx.textAlign = 'left';
  ctx.font = '700 9px "Trebuchet MS", sans-serif';
  ctx.fillStyle = UNIBUFF.color;
  ctx.fillText(unibuffName().toUpperCase(), 64, y + 18);

  ctx.font = '800 13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#f4eeff';
  ctx.fillText('×' + p.unibuffs, 64, y + 33);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(160, y + 8);
  ctx.lineTo(160, y + 36);
  ctx.stroke();

  const chips = [
    { cfg: RUNE_TYPES.red, count: p.runes.red },
    { cfg: RUNE_TYPES.delta, count: p.runes.delta },
    { cfg: RUNE_TYPES.zetel, count: p.runes.zetel }
  ];

  chips.forEach((chip, i) => {
    const cx = 202 + i * 52;
    const cy = y + 21;
    const active = chip.count > 0;

    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, TAU);
    ctx.fillStyle = 'rgba(8,5,14,0.85)';
    ctx.fill();
    ctx.strokeStyle = active ? chip.cfg.color : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '900 12px "Trebuchet MS", sans-serif';
    ctx.fillStyle = active ? chip.cfg.color : 'rgba(220,210,240,0.32)';
    ctx.fillText(runeLetter(chip.cfg), cx, cy + 4);

    ctx.textAlign = 'left';
    ctx.font = '700 9px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(230,220,250,0.7)';
    ctx.fillText('×' + chip.count, cx + 17, cy + 4);
  });
}

function drawEffects(ctx, p) {
  const gifts = (p.gifts || []).map((gift) => ({
    icon: gift.icon || '★',
    name: friendOptionName(gift),
    color: '#7dffb0',
    infinite: true,
    ratio: 1
  }));

  const timed = p.activeEffects().map((effect) => ({
    icon: (effect.cfg && effect.cfg.icon) || '★',
    name: effectName(effect.cfg),
    color: (effect.cfg && effect.cfg.color) || '#7dd3ff',
    time: effect.time,
    ratio: clamp(effect.time / (effect.total || 1), 0, 1)
  }));

  const rows = gifts.concat(timed);
  if (!rows.length) return;

  const x = 22;
  const y = 234;
  const w = 336;
  const rowH = 32;
  hudPanel(ctx, x, y, w, 20 + rows.length * rowH);

  ctx.textAlign = 'left';
  ctx.font = '700 9px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(214,198,240,0.65)';
  ctx.fillText(tr('hud.effects'), x + 16, y + 15);

  rows.forEach((row, i) => {
    const color = row.color;
    const ry = y + 22 + i * rowH;

    ctx.beginPath();
    ctx.arc(x + 26, ry + 7, 9, 0, TAU);
    ctx.fillStyle = 'rgba(8,5,14,0.85)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 10px "Trebuchet MS", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(row.icon, x + 26, ry + 10.5);

    ctx.textAlign = 'left';
    ctx.font = '800 11px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#f2ecff';
    ctx.fillText(row.name, x + 44, ry + 9);

    ctx.textAlign = 'right';
    ctx.font = row.infinite ? '800 8px "Trebuchet MS", sans-serif' : '800 11px "Trebuchet MS", sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(
      row.infinite ? tr('hud.permanent') : Math.ceil(row.time) + tr('hud.secondsAbbrev'),
      x + w - 16,
      ry + 9
    );

    const bx = x + 44;
    const bw = w - 44 - 16;
    roundRectPath(ctx, bx, ry + 14, bw, 4, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();

    if (row.ratio > 0.01) {
      ctx.save();
      roundRectPath(ctx, bx, ry + 14, bw * row.ratio, 4, 2);
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillRect(bx, ry + 14, bw, 4);
      ctx.restore();
    }
  });
}

function drawBuffStar(ctx, cx, cy, r) {
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, '#ff7fb0');
  g.addColorStop(0.4, '#ffd166');
  g.addColorStop(0.7, '#7dffb0');
  g.addColorStop(1, '#8fd8ff');

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = g;
  ctx.shadowColor = UNIBUFF.color;
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  const sr = r * 0.6;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(0, -sr);
  ctx.lineTo(r * 0.16, -r * 0.16);
  ctx.lineTo(sr, 0);
  ctx.lineTo(r * 0.16, r * 0.16);
  ctx.lineTo(0, sr);
  ctx.lineTo(-r * 0.16, r * 0.16);
  ctx.lineTo(-sr, 0);
  ctx.lineTo(-r * 0.16, -r * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawKills(ctx, game) {
  hudPanel(ctx, GAME_W - 190, 20, 168, 58);
  ctx.textAlign = 'center';
  ctx.font = '700 9px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(214,198,240,0.65)';
  ctx.fillText(tr('hud.kills'), GAME_W - 106, 39);
  ctx.font = '900 22px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(String(game.kills), GAME_W - 106, 66);
}

function drawDepth(ctx, game) {
  const danger = game.danger();
  const meters = game.distanceMeters();

  ctx.textAlign = 'center';
  ctx.font = '700 9px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(214,198,240,0.6)';
  ctx.fillText(tr('hud.depth'), GAME_W / 2, 26);

  ctx.font = '900 24px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#f4eeff';
  ctx.shadowColor = 'rgba(255,79,139,0.5)';
  ctx.shadowBlur = 14;
  ctx.fillText(formatMeters(meters), GAME_W / 2, 50);
  ctx.shadowBlur = 0;

  ctx.font = '600 10px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255,209,102,0.8)';
  ctx.fillText(
    tr('hud.zoneDanger', {
      zone: Math.floor(danger) + 1,
      danger: danger.toFixed(1)
    }),
    GAME_W / 2,
    66
  );
}

function drawTalentPopup(ctx, game) {
  const popup = game.talentPopup;
  if (!popup) return;

  const alpha = Math.min(1, popup.time / 0.5);
  const w = 360;
  const h = 36;
  const x = (GAME_W - w) / 2;
  const y = 82;

  ctx.save();
  ctx.globalAlpha = alpha;

  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(18,11,28,0.88)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.65)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '700 8px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(255,209,102,0.75)';
  ctx.fillText(tr('talent.chosen'), GAME_W / 2, y + 12);

  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#ffe6a3';
  ctx.fillText(talentName(popup.talent), GAME_W / 2, y + 28);

  ctx.restore();
}

function drawWeaponCard(ctx, p) {
  const y = GAME_H - 96;
  hudPanel(ctx, 22, y, 330, 74);

  ctx.save();
  ctx.translate(72, y + 38);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
  glow.addColorStop(0, p.weapon.color + '44');
  glow.addColorStop(1, p.weapon.color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, TAU);
  ctx.fill();
  ctx.restore();

  drawWeaponIcon(ctx, p.weapon, 72, y + 38, p.weapon.reach > 80 ? 0.72 : 0.95);

  ctx.textAlign = 'left';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#f4eeff';
  ctx.fillText(weaponLabel(p.weapon).toUpperCase(), 118, y + 27);

  ctx.font = '600 10px "Trebuchet MS", sans-serif';
  ctx.fillStyle = 'rgba(197,182,225,0.72)';
  const rof = p.attackRate().toFixed(1);
  ctx.fillText(
    tr('hud.dmg') + ' ' + p.effectiveDamage() +
    ' · ' + rof + tr('hud.attackRateSuffix') +
    ' · ' + tr('hud.reach') + ' ' + Math.round(p.weapon.reach),
    118, y + 45
  );

  ctx.fillStyle = 'rgba(255,209,102,0.85)';
  ctx.font = '700 10px "Trebuchet MS", sans-serif';
  ctx.fillText(tr('hud.attack'), 118, y + 62);

  if (p.weapon.id === 'fist') {
    ctx.fillStyle = 'rgba(160,145,190,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(tr('hud.findSword'), 338, y + 62);
  }
}

function hudPanel(ctx, x, y, w, h) {
  roundRectPath(ctx, x, y, w, h, 16);
  ctx.fillStyle = 'rgba(14,9,24,0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
