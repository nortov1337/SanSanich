@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :try_python

echo Запускаю локальный сервер...
node server.js
echo.
echo Сервер остановлен.
pause
goto :eof

:try_python
where python >nul 2>nul
if errorlevel 1 goto :no_runtime

start "SanSanich server" cmd /c "python -m http.server 8123"
timeout /t 2 /nobreak >nul
start "" "http://localhost:8123/"
goto :eof

:no_runtime
echo.
echo Не найден Node.js или Python.
echo Установи Node.js и запусти start-game.bat снова.
echo.
pause