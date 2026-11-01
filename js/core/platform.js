'use strict';

function isMobileOrTablet() {
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle|PlayBook|BlackBerry|Opera Mini|IEMobile/i.test(ua);

  const touchPoints = navigator.maxTouchPoints || 0;
  const coarse = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 720;

  if (mobileUA) return true;
  if (touchPoints > 1 && (coarse || smallScreen)) return true;
  return false;
}

function applyDeviceGate() {
  if (!isMobileOrTablet()) return false;
  document.body.classList.add('is-mobile');
  return true;
}
