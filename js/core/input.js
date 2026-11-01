'use strict';

const KEY_ACTIONS = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyW: 'jump',
  KeyF: 'attack',
  KeyE: 'interact',
  Escape: 'pause',
  KeyP: 'pause',
  KeyM: 'mute',
  KeyR: 'restart',
  Enter: 'confirm'
};

class Input {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    this.justReleased = new Set();

    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      e.preventDefault();
      if (!e.repeat) this.justPressed.add(action);
      this.down.add(action);
    });

    window.addEventListener('keyup', (e) => {
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      this.down.delete(action);
      this.justReleased.add(action);
    });

    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(action) { return this.down.has(action); }
  pressed(action) { return this.justPressed.has(action); }

  endFrame() {
    this.justPressed.clear();
    this.justReleased.clear();
  }
}
