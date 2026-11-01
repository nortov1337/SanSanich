'use strict';

/* =========================================================
   generator.js — процедурная генерация чанков
   ========================================================= */

const PROP_KINDS = ['stone', 'bone', 'mushroom', 'grass', 'grass', 'skull', 'crystal'];
const PLATFORM_LEVELS = [340, 395, 450, 490];

function pickFrom(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeaponId(power, rng) {
  const unlocks = (typeof DATA !== 'undefined' && DATA && DATA.spawning && DATA.spawning.weaponUnlocks);

  if (Array.isArray(unlocks) && unlocks.length) {
    const available = unlocks
      .filter((entry) => (power + 0.9 >= (entry.minPower || 0)) && WEAPONS[entry.id])
      .slice(-3);
    if (available.length) return pickFrom(rng, available).id;
  }

  const fallback = Object.keys(WEAPONS).filter((id) => id !== 'fist');
  return fallback.length ? pickFrom(rng, fallback) : 'rusty';
}

function monsterPool(power, depthMeters = 0) {
  const pools = (typeof DATA !== 'undefined' && DATA && DATA.spawning && DATA.spawning.monsterPools);

  if (Array.isArray(pools) && pools.length) {
    let types = pools[0].types || [];
    for (const entry of pools) {
      const powerOk = power >= (entry.minPower || 0);
      const depthOk = depthMeters >= (entry.minDepth || 0);
      if (powerOk && depthOk) types = entry.types || types;
    }
    const valid = types.filter((name) => MONSTER_TYPES[name]);
    if (valid.length) return valid;
  }

  return Object.keys(MONSTER_TYPES);
}

function generateChunk(index, worldSeed) {
  const rng = mulberry32((worldSeed + index * 2654435761) >>> 0);
  const startX = index * CHUNK_W;
  const endX = startX + CHUNK_W;
  const isIntro = index === 0;
  const power = index * 0.92;

  /* --- земля и ямы --- */
  const ground = [];
  const gaps = [];

  if (isIntro) {
    ground.push({ x: startX, w: CHUNK_W });
  } else {
    const pitCount = rng() < 0.7 ? (rng() < 0.32 ? 2 : 1) : 0;
    const pits = [];
    let tries = 0;
    while (pits.length < pitCount && tries < 14) {
      tries++;
      const w = 105 + rng() * 85;
      const x = startX + 210 + rng() * (CHUNK_W - 420 - w);
      if (pits.every((p) => Math.abs(p.x - x) > 380)) pits.push({ x, w });
    }
    pits.sort((a, b) => a.x - b.x);

    let cursor = startX;
    for (const pit of pits) {
      if (pit.x > cursor + 30) ground.push({ x: cursor, w: pit.x - cursor });
      gaps.push(pit);
      cursor = pit.x + pit.w;
    }
    if (endX - cursor > 30) ground.push({ x: cursor, w: endX - cursor });
    if (!ground.length) ground.push({ x: startX, w: CHUNK_W });
  }

  /* --- платформы --- */
  const platforms = [];
  if (isIntro) {
    platforms.push({ x: 480, y: 480, w: 160 });
    platforms.push({ x: 1080, y: 450, w: 160 });
  } else {
    const count = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const seg = pickFrom(rng, ground);
      if (!seg || seg.w < 230) continue;
      const w = 120 + rng() * 90;
      if (seg.w - w - 130 < 0) continue;
      const x = seg.x + 65 + rng() * (seg.w - w - 130);
      const y = pickFrom(rng, PLATFORM_LEVELS);
      if (platforms.some((p) => Math.abs(p.x - x) < 150 && Math.abs(p.y - y) < 60)) continue;
      platforms.push({ x, y, w });
    }
    if (gaps.length && rng() < 0.4) {
      const gap = pickFrom(rng, gaps);
      platforms.push({ x: gap.x + gap.w / 2 - 55, y: 415, w: 110 });
    }
  }

  /* --- хелперы размещения --- */
  const pickGroundSpot = (margin = 70) => {
    const seg = pickFrom(rng, ground);
    if (!seg || seg.w <= margin * 2) return null;
    return { x: seg.x + margin + rng() * (seg.w - margin * 2), y: GROUND_Y };
  };

  const pickSpot = (margin = 60) => {
    if (platforms.length && rng() < 0.35) {
      const p = pickFrom(rng, platforms);
      return { x: p.x + 24 + rng() * Math.max(1, p.w - 48), y: p.y };
    }
    return pickGroundSpot(margin);
  };

  const usedLoot = [];
  const pickLootSpot = () => {
    for (let attempt = 0; attempt < 16; attempt++) {
      let spot = null;
      if (platforms.length && rng() < 0.65) {
        const p = pickFrom(rng, platforms);
        spot = { x: p.x + 30 + rng() * Math.max(1, p.w - 60), y: p.y - 30 };
      } else {
        const g = pickGroundSpot(80);
        if (g) spot = { x: g.x, y: GROUND_Y - 30 };
      }
      if (!spot) continue;
      const free = usedLoot.every((u) => Math.abs(u.x - spot.x) > 115 || Math.abs(u.y - spot.y) > 45);
      if (free) {
        usedLoot.push(spot);
        return spot;
      }
    }
    const last = usedLoot[usedLoot.length - 1];
    if (last) {
      const spot = { x: last.x + 130, y: last.y };
      usedLoot.push(spot);
      return spot;
    }
    return null;
  };

  /* --- монстры --- */
  const monsters = [];
  if (isIntro) {
    monsters.push({ type: 'kiss', x: 720, y: GROUND_Y, power: 0 });
    monsters.push({ type: 'kiss', x: 1260, y: GROUND_Y, power: 0 });
  } else {
    const count = Math.min(2 + Math.floor(power * 0.75 + rng() * 2), 8);
    for (let i = 0; i < count; i++) {
      const spot = pickSpot(50);
      if (!spot) continue;
      const pool = monsterPool(power, depthMetersAt(spot.x));
      if (!pool.length) continue;
      monsters.push({ type: pickFrom(rng, pool), x: spot.x, y: spot.y, power });
    }
  }

  /* --- лут --- */
  const weapons = [];
  const runes = [];
  const hearts = [];

  const worldCfg = (typeof DATA !== 'undefined' && DATA && DATA.world) ? DATA.world : {};
  const heartBase = worldCfg.heartHealBase != null ? worldCfg.heartHealBase : 20;
  const heartPerPower = worldCfg.heartHealPerPower != null ? worldCfg.heartHealPerPower : 4;

  if (isIntro) {
    weapons.push({ id: 'rusty', level: 0, x: 900, y: GROUND_Y - 30 });
    runes.push({ type: 'red', x: 555, y: 450 });
    hearts.push({ x: 620, y: GROUND_Y - 30, heal: heartBase });
    hearts.push({ x: 1380, y: GROUND_Y - 30, heal: heartBase });
  } else {
    if (index % 2 === 1 || rng() < 0.3) {
      const spot = pickLootSpot();
      if (spot) {
        const level = Math.max(0, Math.round(power + (rng() * 2 - 1)));
        weapons.push({ id: pickWeaponId(power, rng), level, x: spot.x, y: spot.y });
      }
    }

    if (rng() < 0.55) {
      const spot = pickLootSpot();
      if (spot) {
        const roll = rng();
        const type = roll < 0.4 ? 'red' : roll < 0.8 ? 'delta' : 'zetel';
        runes.push({ type, x: spot.x, y: spot.y });
      }
    }

    const heartCount = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < heartCount; i++) {
      const spot = pickGroundSpot(80);
      if (spot) hearts.push({ x: spot.x, y: GROUND_Y - 30, heal: heartBase + Math.round(power * heartPerPower) });
    }
  }

  /* --- декор --- */
  const torches = [];
  if (isIntro) {
    torches.push({ x: 230 }, { x: 1120 }, { x: 1420 });
  } else {
    const count = 1 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const spot = pickGroundSpot(40);
      if (spot) torches.push({ x: spot.x });
    }
  }

  const props = [];
  const propCount = isIntro ? 16 : 10 + Math.floor(rng() * 12);
  for (let i = 0; i < propCount; i++) {
    const spot = pickGroundSpot(18);
    if (!spot) continue;
    props.push({
      x: spot.x,
      kind: pickFrom(rng, PROP_KINDS),
      s: 0.7 + rng() * 0.9,
      flip: rng() > 0.5 ? 1 : -1,
      tint: rng()
    });
  }

  const signs = [];
  if (isIntro) {
    signs.push({ x: 340, lines: ['A / D — ИДТИ', 'SPACE — ПРЫЖОК ×2'] });
    signs.push({ x: 1050, lines: ['F — УДАР', 'E — ПОДОБРАТЬ'] });
  }

  return {
    index, startX, endX, power, isIntro,
    ground, gaps, platforms,
    monsters, weapons, runes, hearts,
    torches, props, signs,
    spawned: false
  };
}
