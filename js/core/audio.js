'use strict';

/* =========================================================
   audio.js — синтезированные звуки (без файлов)
   ========================================================= */

const Sfx = {
  ctx: null,
  master: null,
  noiseBuf: null,
  muted: false,
  volume: 0.5,

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);

    const len = Math.floor(this.ctx.sampleRate * 0.4);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },

  ensure() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
    return this.muted;
  },

  tone(freq, dur, opts = {}) {
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (opts.delay || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = opts.type || 'square';
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t0 + dur);
    const vol = (opts.vol == null ? 0.14 : opts.vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  },

  noise(dur, opts = {}) {
    this.ensure();
    if (!this.ctx || !this.noiseBuf) return;
    const t0 = this.ctx.currentTime + (opts.delay || 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = opts.filter || 'lowpass';
    filter.frequency.setValueAtTime(opts.freq || 1400, t0);
    if (opts.freqTo) filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqTo), t0 + dur);
    const gain = this.ctx.createGain();
    const vol = (opts.vol == null ? 0.1 : opts.vol);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur);
  },

  jump() {
    this.tone(320, 0.17, { to: 640, type: 'square', vol: 0.07 });
  },
  doubleJump() {
    this.tone(520, 0.18, { to: 900, type: 'triangle', vol: 0.08 });
  },
  swing(weapon) {
    this.noise(0.12, { vol: 0.09, freq: 2600, freqTo: 900, filter: 'bandpass' });
    this.tone(weapon && weapon.id === 'fist' ? 180 : 260, 0.08, { to: 90, type: 'sawtooth', vol: 0.05 });
  },
  hit() {
    this.noise(0.14, { vol: 0.22, freq: 1600, freqTo: 220 });
    this.tone(150, 0.14, { to: 60, type: 'square', vol: 0.13 });
  },
  hurt() {
    this.tone(240, 0.26, { to: 80, type: 'sawtooth', vol: 0.16 });
    this.noise(0.18, { vol: 0.14, freq: 900, freqTo: 160 });
  },
  pickup() {
    this.tone(520, 0.09, { type: 'triangle', vol: 0.1 });
    this.tone(780, 0.12, { type: 'triangle', vol: 0.1, delay: 0.07 });
    this.tone(1040, 0.18, { type: 'triangle', vol: 0.08, delay: 0.14 });
  },
  heal() {
    this.tone(440, 0.12, { type: 'sine', vol: 0.1 });
    this.tone(660, 0.16, { type: 'sine', vol: 0.09, delay: 0.08 });
    this.tone(880, 0.22, { type: 'sine', vol: 0.07, delay: 0.16 });
  },
  hello() {
    this.tone(520, 0.13, { type: 'sine', vol: 0.08 });
    this.tone(700, 0.18, { type: 'sine', vol: 0.07, delay: 0.1 });
    this.tone(880, 0.2, { type: 'sine', vol: 0.05, delay: 0.2 });
  },
  buff() {
    this.tone(380, 0.18, { to: 820, type: 'triangle', vol: 0.1 });
    this.tone(760, 0.26, { to: 1180, type: 'sine', vol: 0.08, delay: 0.1 });
  },
  death() {
    this.tone(300, 0.45, { to: 55, type: 'sawtooth', vol: 0.14 });
    this.noise(0.4, { vol: 0.12, freq: 800, freqTo: 90 });
  },
  monsterWindup() {
    this.tone(160, 0.12, { to: 220, type: 'triangle', vol: 0.04 });
  },
  monsterSwing() {
    this.noise(0.1, { vol: 0.07, freq: 900, freqTo: 300 });
  },
  click() {
    this.tone(660, 0.06, { type: 'square', vol: 0.06 });
  },
  start() {
    this.tone(330, 0.14, { type: 'triangle', vol: 0.09 });
    this.tone(440, 0.14, { type: 'triangle', vol: 0.09, delay: 0.1 });
    this.tone(660, 0.24, { type: 'triangle', vol: 0.1, delay: 0.2 });
  }
};
