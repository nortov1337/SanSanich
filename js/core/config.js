'use strict';

const GAME_W = 1280;
const GAME_H = 720;
const TAU = Math.PI * 2;

/* версия сборки, чтобы браузер не подхватывал старые файлы из кэша */
const BUILD_VERSION = '20261104-1';

/* мир */
let CHUNK_W = 1500;
let GROUND_Y = 600;

/* физика игрока (значения по умолчанию, переопределяются из game-data.json) */
const PLAYER_W = 48;
const PLAYER_H = 76;
let GRAVITY = 2500;
let JUMP_V = -950;
const MAX_FALL = 1250;
let RUN_SPEED = 400;
const ACCEL = 3400;
const AIR_ACCEL = 2400;
const FRICTION = 3200;

/* пространство имён для рендер-модулей */
const Render = {};
