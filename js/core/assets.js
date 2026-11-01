'use strict';

/* =========================================================
   assets.js — загрузка изображений
   Пути заполняются из data/game-data.json (data-loader.js)
   ========================================================= */

const ASSET_PATHS = {
  hero: '',
  monsters: {},
  friends: {}
};

const IMAGES = {
  hero: null,
  monsters: {},
  friends: {},
  loaded: 0,
  total: 0
};

function loadAssets(onProgress) {
  const jobs = [];

  if (ASSET_PATHS.hero) jobs.push(['hero', ASSET_PATHS.hero]);

  Object.keys(ASSET_PATHS.monsters).forEach((key) => {
    const path = ASSET_PATHS.monsters[key];
    if (path) jobs.push(['m:' + key, path]);
  });

  Object.keys(ASSET_PATHS.friends).forEach((key) => {
    const path = ASSET_PATHS.friends[key];
    if (path) jobs.push(['f:' + key, path]);
  });

  IMAGES.total = jobs.length;

  return Promise.all(jobs.map(([key, path]) => new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    const done = () => {
      IMAGES.loaded++;
      if (onProgress) onProgress(IMAGES.total ? IMAGES.loaded / IMAGES.total : 1);
      resolve();
    };
    img.onload = done;
    img.onerror = () => {
      console.warn('Failed to load image:', path);
      done();
    };
    img.src = encodeURI(path);
    if (key === 'hero') IMAGES.hero = img;
    else if (key.indexOf('f:') === 0) IMAGES.friends[key.slice(2)] = img;
    else IMAGES.monsters[key.slice(2)] = img;
  })));
}
