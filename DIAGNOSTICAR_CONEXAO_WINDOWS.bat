@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js nao encontrado. Instale o Node.js 20 ou superior em https://nodejs.org.
 pause
 exit /b 1
)
echo Este teste nao pede API key e nao gera audio.
node scripts\elevenlabs-generate.mjs --diagnose
pause
