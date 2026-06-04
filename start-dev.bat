@echo off
title AlphaBAG Dev Environment
color 0A

echo.
echo  ============================================
echo   AlphaBAG V3 - Development Server Launcher
echo  ============================================
echo.

:: --- Kill any existing instances on ports 3001 and 3003 ---
echo [1/4] Clearing ports 3001 and 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003 " ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo     Ports cleared.

:: --- Start Backend (Express on port 3003) ---
echo [2/4] Starting Backend API (port 3003)...
start "AlphaBAG Backend :3003" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul
echo     Backend launched.

:: --- Start Frontend (Vite on port 3001) ---
echo [3/4] Starting Frontend Dev Server (port 3001)...
start "AlphaBAG Frontend :3001" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 5 /nobreak >nul
echo     Frontend launched.

:: --- Open browser ---
echo [4/4] Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3001"

echo.
echo  ============================================
echo   SERVERS RUNNING
echo   Frontend : http://localhost:3001
echo   Backend  : http://localhost:3003
echo   Admin    : http://localhost:3001/#/admin
echo  ============================================
echo.
echo  Close the two server windows to stop servers.
echo  Or run stop-dev.bat to kill all instances.
echo.
pause
