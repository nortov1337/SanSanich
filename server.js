'use strict';

/* =========================================================
   server.js — крошечный локальный сервер для игры
   Запуск: node server.js  (или start-game.bat)
   ========================================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname);
const startPort = 8123;
const lastPort = 8135;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8'
};

function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.resolve(root, '.' + urlPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + urlPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

function start(port) {
  const server = http.createServer(handler);

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < lastPort) {
      console.log('Порт ' + port + ' занят, пробую ' + (port + 1) + '…');
      start(port + 1);
    } else {
      console.error('Не удалось запустить сервер:', err);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    const url = 'http://localhost:' + port + '/';
    console.log('');
    console.log('  СЫН САНЫЧ — ПУТЬ САНИ');
    console.log('  ' + url);
    console.log('  Если браузер не открылся — открой эту ссылку вручную.');
    console.log('  Ctrl+C — остановить сервер');
    console.log('');

    if (!process.env.NO_OPEN) {
      const platform = process.platform;
      try {
        if (platform === 'win32') {
          spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
        } else if (platform === 'darwin') {
          spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
        } else {
          spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
        }
      } catch (err) {
        console.log('Открой вручную: ' + url);
      }
    }
  });
}

start(startPort);
