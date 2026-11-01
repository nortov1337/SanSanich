'use strict';

/* =========================================================
   main.js — загрузка данных, ассетов и запуск
   ========================================================= */

function showDataError(error) {
  console.error('Не удалось загрузить данные игры:', error);
  document.body.classList.add('data-error');

  const detail = document.getElementById('data-error-detail');
  if (detail) {
    detail.textContent = error && error.message ? error.message : String(error);
  }
}

(function boot() {
  if (applyDeviceGate()) return;

  const canvas = document.getElementById('game');
  const startBtn = document.getElementById('btn-start');

  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = 'ЗАГРУЗКА ДАННЫХ…';
  }

  (async () => {
    try {
      const data = await loadGameData();
      applyGameData(data);
    } catch (error) {
      showDataError(error);
      return;
    }

    let game;
    try {
      game = new Game(canvas);
      window.game = game;
    } catch (error) {
      showDataError(error);
      return;
    }

    if (startBtn) startBtn.textContent = 'ЗАГРУЗКА 0%';

    const heroImg = document.getElementById('hero-img');
    if (heroImg && ASSET_PATHS.hero) heroImg.src = encodeURI(ASSET_PATHS.hero);

    loadAssets((progress) => {
      if (startBtn) startBtn.textContent = 'ЗАГРУЗКА ' + Math.round(progress * 100) + '%';
    }).then(() => {
      game.assetsReady = true;
      game.resetWorld();

      if (startBtn) {
        startBtn.disabled = false;
        startBtn.textContent = 'НАЧАТЬ ЗАБЕГ';
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('play') === '1') game.startGame();
    });
  })();
})();
