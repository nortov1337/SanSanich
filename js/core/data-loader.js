'use strict';

let DATA = null;

async function loadGameData() {
  const version = typeof BUILD_VERSION !== 'undefined' ? BUILD_VERSION : '1';
  const response = await fetch('data/game-data.json?v=' + version, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(tr('gate.dataHttp', { status: response.status }));
  }
  return response.json();
}

function applyGameData(data) {
  if (!data || !data.weapons || !data.monsters || !data.runes || !data.unibuff || !data.talents) {
    throw new Error(tr('gate.dataSections', {
      list: 'weapons, monsters, runes, unibuff, talents'
    }));
  }

  DATA = data;
  WEAPONS = data.weapons;
  MONSTER_TYPES = data.monsters;
  RUNE_TYPES = data.runes;
  UNIBUFF = data.unibuff;
  TALENTS = data.talents;

  for (const key of Object.keys(MONSTER_TYPES)) {
    MONSTER_TYPES[key].key = key;
    MONSTER_TYPES[key].img = key;
  }

  if (typeof ASSET_PATHS !== 'undefined') {
    ASSET_PATHS.hero = data.heroImage || '';
    ASSET_PATHS.monsters = {};
    for (const key of Object.keys(MONSTER_TYPES)) {
      const monster = MONSTER_TYPES[key];
      if (monster.image) ASSET_PATHS.monsters[key] = monster.image;
    }

    ASSET_PATHS.friends = {};
    const friendTypes = (data.friends && data.friends.types) || {};
    for (const key of Object.keys(friendTypes)) {
      const friend = friendTypes[key];
      if (friend.image) ASSET_PATHS.friends[key] = friend.image;
    }
  }

  const player = data.player || {};
  if (player.runSpeed != null) RUN_SPEED = player.runSpeed;
  if (player.gravity != null) GRAVITY = player.gravity;
  if (player.jumpVelocity != null) JUMP_V = player.jumpVelocity;

  const world = data.world || {};
  if (world.chunkWidth != null) CHUNK_W = world.chunkWidth;
  if (world.groundY != null) GROUND_Y = world.groundY;

  if (typeof WORLD !== 'undefined') WORLD.groundY = GROUND_Y;
}
