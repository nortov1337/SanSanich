'use strict';

/* =========================================================
   i18n.js — English by default, Russian localization
   ========================================================= */

const I18N = {
  en: {
    'page.title': 'Syn Sanych — Path of Sani',

    'menu.title': 'SYN SANYCH',
    'menu.subtitle': 'PATH OF SANI',
    'menu.tagline': 'An endless run. The further you go, the worse it gets.',
    'menu.key.move': 'move',
    'menu.key.jump': 'jump ×2',
    'menu.key.attack': 'attack',
    'menu.key.pickup': 'weapons / runes',
    'menu.start': 'START RUN',
    'menu.loadingData': 'LOADING DATA…',
    'menu.loading': 'LOADING {p}%',
    'menu.bestLabel': 'BEST RUN:',
    'menu.heroAlt': 'Main hero',

    'pause.title': 'PAUSED',
    'pause.sub': 'The forest can wait. So can the cat.',
    'pause.key.jump': 'jump',
    'pause.key.pickup': 'pick up',
    'pause.resume': 'RESUME',
    'pause.restart': 'RESTART',
    'pause.hint': 'ESC — resume · M — sound · R — restart',

    'death.title': 'THE CAT HAS FALLEN',
    'death.sub': 'But he still has eight lives. Probably.',
    'death.kills': 'Monsters killed',
    'death.distance': 'Distance',
    'death.best': 'Best',
    'death.time': 'Time',
    'death.restart': 'TRY AGAIN',
    'death.hint': 'R — try again',

    'talent.title': 'CHOOSE A TALENT',
    'talent.subtitle': 'Reward for {n} kills. One choice per run — the other talent will not appear again.',
    'talent.pick': 'CHOOSE',
    'talent.note': 'The talent lasts until the end of the run',
    'talent.chosen': 'TALENT CHOSEN',

    'hud.health': 'HEALTH',
    'hud.hero': 'SYN SANYCH',
    'hud.damage': 'DAMAGE',
    'hud.attackSpeed': 'ATTACK SPEED',
    'hud.speed': 'SPEED',
    'hud.unibuff': 'UNIBUFF',
    'hud.kills': 'MONSTERS KILLED',
    'hud.depth': 'FOREST DEPTH',
    'hud.zoneDanger': 'ZONE {zone} · DANGER {danger}',
    'hud.dmg': 'DMG',
    'hud.reach': 'REACH',
    'hud.attack': 'F — ATTACK',
    'hud.findSword': 'find a sword on E',
    'hud.attackRateSuffix': '/s',
    'hud.unibuffGain': '+{n} UNIBUFFS',
    'hud.runeGain': 'RUNE “{name}”',

    'unit.m': 'm',

    'prompt.pickup': 'PICK UP',
    'prompt.take': 'TAKE',
    'pickup.runeTitle': 'RUNE “{name}”',
    'pickup.unibuffGain': '+ UNIBUFF',

    'sign.move': 'A / D — MOVE',
    'sign.jump': 'SPACE — JUMP ×2',
    'sign.hit': 'F — ATTACK',
    'sign.pickup': 'E — PICK UP',

    'hint.mute': 'M — SOUND',
    'hint.muted': 'M — MUTED',
    'hint.pause': 'ESC — PAUSE',

    'gate.mobileTitle': 'PC REQUIRED',
    'gate.mobileLine': 'This game is designed for a keyboard and mouse.',
    'gate.mobileHint': 'Open it on a desktop or laptop',

    'gate.dataTitle': 'DATA UNAVAILABLE',
    'gate.dataLine': 'Could not read data/game-data.json.',
    'gate.dataHint': 'Run start-game.bat or a local server'
  },

  ru: {
    'page.title': 'Сын Саныч — Путь Сани',

    'menu.title': 'СЫН САНЫЧ',
    'menu.subtitle': 'ПУТЬ САНИ',
    'menu.tagline': 'Бесконечный забег. Чем дальше — тем страшнее.',
    'menu.key.move': 'идти',
    'menu.key.jump': 'прыжок ×2',
    'menu.key.attack': 'удар',
    'menu.key.pickup': 'оружие / руны',
    'menu.start': 'НАЧАТЬ ЗАБЕГ',
    'menu.loadingData': 'ЗАГРУЗКА ДАННЫХ…',
    'menu.loading': 'ЗАГРУЗКА {p}%',
    'menu.bestLabel': 'ЛУЧШИЙ ЗАБЕГ:',
    'menu.heroAlt': 'Главный герой',

    'pause.title': 'ПАУЗА',
    'pause.sub': 'Лес подождёт. Кот тоже.',
    'pause.key.jump': 'прыжок',
    'pause.key.pickup': 'подобрать',
    'pause.resume': 'ПРОДОЛЖИТЬ',
    'pause.restart': 'ЗАНОВО',
    'pause.hint': 'ESC — продолжить · M — звук · R — заново',

    'death.title': 'КОТ ПАЛ',
    'death.sub': 'Но у него ещё есть восемь жизней. Наверное.',
    'death.kills': 'Убито монстров',
    'death.distance': 'Дистанция',
    'death.best': 'Рекорд',
    'death.time': 'Время в пути',
    'death.restart': 'ЕЩЁ РАЗ',
    'death.hint': 'R — попробовать снова',

    'talent.title': 'ВЫБЕРИ ТАЛАНТ',
    'talent.subtitle': 'Награда за {n} убийств. Выбор один раз за забег — второй талант больше не появится.',
    'talent.pick': 'ВЫБРАТЬ',
    'talent.note': 'Талант действует до конца забега',
    'talent.chosen': 'ТАЛАНТ ВЫБРАН',

    'hud.health': 'ЗДОРОВЬЕ',
    'hud.hero': 'СЫН САНЫЧ',
    'hud.damage': 'УРОН',
    'hud.attackSpeed': 'СКОР. АТАКИ',
    'hud.speed': 'СКОРОСТЬ',
    'hud.unibuff': 'УНИБАФ',
    'hud.kills': 'УБИТО МОНСТРОВ',
    'hud.depth': 'ГЛУБИНА ЛЕСА',
    'hud.zoneDanger': 'ЗОНА {zone} · ОПАСНОСТЬ {danger}',
    'hud.dmg': 'УРОН',
    'hud.reach': 'РАЗМАХ',
    'hud.attack': 'F — УДАР',
    'hud.findSword': 'ищи меч на E',
    'hud.attackRateSuffix': '/с',
    'hud.unibuffGain': '+{n} УНИБАФОВ',
    'hud.runeGain': 'РУНА «{name}»',

    'unit.m': 'м',

    'prompt.pickup': 'ПОДОБРАТЬ',
    'prompt.take': 'ВЗЯТЬ',
    'pickup.runeTitle': 'РУНА «{name}»',
    'pickup.unibuffGain': '+ УНИБАФ',

    'sign.move': 'A / D — ИДТИ',
    'sign.jump': 'SPACE — ПРЫЖОК ×2',
    'sign.hit': 'F — УДАР',
    'sign.pickup': 'E — ПОДОБРАТЬ',

    'hint.mute': 'M — ЗВУК',
    'hint.muted': 'M — ЗВУК ВЫКЛ',
    'hint.pause': 'ESC — ПАУЗА',

    'gate.mobileTitle': 'НУЖНО ЗАЙТИ С ПК',
    'gate.mobileLine': 'Игра рассчитана на клавиатуру и мышь.',
    'gate.mobileHint': 'Открой её на компьютере или ноутбуке',

    'gate.dataTitle': 'НЕТ ДОСТУПА К ДАННЫМ',
    'gate.dataLine': 'Не удалось прочитать data/game-data.json.',
    'gate.dataHint': 'Запусти start-game.bat или локальный сервер'
  }
};

let currentLang = 'en';

try {
  const saved = localStorage.getItem('synSanychLang');
  if (saved === 'en' || saved === 'ru') currentLang = saved;
} catch (err) { /* localStorage may be unavailable */ }

function tr(key, params) {
  const locale = I18N[currentLang] || I18N.en;
  let text = locale[key];
  if (text == null) text = I18N.en[key];
  if (text == null) text = key;
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (match, name) => (
      params[name] != null ? String(params[name]) : match
    ));
  }
  return text;
}

function pickLocalized(en, ru) {
  if (currentLang === 'ru') return ru != null ? ru : en;
  return en != null ? en : ru;
}

function monsterName(type) {
  return type ? pickLocalized(type.name, type.nameRu) : '';
}

function weaponName(wpn) {
  return wpn ? pickLocalized(wpn.name, wpn.nameRu) : '';
}

function weaponLabel(wpn) {
  if (!wpn) return '';
  const name = weaponName(wpn);
  return wpn.level > 0 ? name + ' +' + wpn.level : name;
}

function runeName(rune) {
  return rune ? pickLocalized(rune.name, rune.nameRu) : '';
}

function runeLetter(rune) {
  return rune ? pickLocalized(rune.letter, rune.letterRu) : '';
}

function runeHint(rune) {
  return rune ? pickLocalized(rune.hint, rune.hintRu) : '';
}

function talentName(talent) {
  return talent ? pickLocalized(talent.name, talent.nameRu) : '';
}

function talentDescription(talent) {
  return talent ? pickLocalized(talent.description, talent.descriptionRu) : '';
}

function unibuffName() {
  if (typeof UNIBUFF === 'undefined' || !UNIBUFF) {
    return currentLang === 'ru' ? 'УниБаф' : 'UniBuff';
  }
  return pickLocalized(UNIBUFF.name, UNIBUFF.nameRu);
}

function formatMeters(value) {
  return value + ' ' + tr('unit.m');
}

function updateLangButtons() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === currentLang);
  });
}

function applyI18nDom() {
  document.documentElement.lang = currentLang;
  document.title = tr('page.title');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n);
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    el.alt = tr(el.dataset.i18nAlt);
  });

  updateLangButtons();
}

function setLanguage(lang, persist = true) {
  if (lang !== 'en' && lang !== 'ru') return;
  currentLang = lang;

  if (persist) {
    try { localStorage.setItem('synSanychLang', lang); } catch (err) { /* ignore */ }
  }

  applyI18nDom();
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}

document.querySelectorAll('[data-lang]').forEach((button) => {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
});

applyI18nDom();
