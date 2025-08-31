@echo off
echo Starting multiplayer server in background...
cd /d "%~dp0"
start /B node server.js
echo Server started! You can now close this window.
echo The server will continue running in the background.
pause
