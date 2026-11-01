'use strict';

let WEAPONS = {};

/* Экземпляр оружия, усиленный по глубине */
function makeWeapon(id, level = 0) {
  const base = WEAPONS[id] || WEAPONS.fist;
  if (!base) return null;

  const lv = Math.max(0, Math.floor(level));
  const world = (typeof DATA !== 'undefined' && DATA && DATA.world) ? DATA.world : {};
  const dmgPerLevel = world.weaponDamagePerLevel != null ? world.weaponDamagePerLevel : 0.5;
  const reachPerLevel = world.weaponReachPerLevel != null ? world.weaponReachPerLevel : 1.2;
  const maxReachBonus = world.maxWeaponReachBonus != null ? world.maxWeaponReachBonus : 20;

  return {
    ...base,
    level: lv,
    dmg: Math.max(1, Math.round(base.dmg * (1 + lv * dmgPerLevel))),
    reach: base.reach + Math.min(maxReachBonus, lv * reachPerLevel)
  };
}
