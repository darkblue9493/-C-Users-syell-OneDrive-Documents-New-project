@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo South Diamond needs Node.js to run the backend chat server.
  echo.
  echo Windows could not find Node.js on this computer.
  echo Install Node.js LTS from:
  echo https://nodejs.org/
  echo.
  echo After installing Node.js, close this window and double-click this file again.
  echo.
  pause
  exit /b 1
)

echo Starting South Diamond...
echo.
echo Player site: http://localhost:3000
echo Admin desk:  http://localhost:3000/admin.html
echo.
echo Keep this window open while using the website.
echo.
node server.js
pause
