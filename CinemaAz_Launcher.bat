@echo off
title Cinema Az Launcher
color 0C

echo ===================================================
echo               CINEMA AZ LAUNCHER
echo ===================================================
echo.
echo Welcome! This will start the Cinema Az movie platform.
echo.
echo Options:
echo 1. Start locally (Only you can access it)
echo 2. Start remotely (Share a public link with a friend)
echo.

set /p choice="Select an option (1 or 2): "

if "%choice%"=="2" (
    echo.
    echo [1/2] Starting the local server in the background...
    start "Cinema Az Server" cmd /c "npm run dev"
    
    echo Waiting a few seconds for the server to be ready...
    timeout /t 5 /nobreak >nul
    
    echo.
    echo [2/2] Generating a secure public link...
    echo ===================================================
    echo IMPORTANT: Look for the link ending in ".lhr.life" below.
    echo Send that link to your friend!
    echo ===================================================
    echo.
    
    :: Use localhost.run SSH tunnel (built into Windows 10/11, ultra reliable)
    ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run
) else (
    echo.
    echo Starting the local server...
    echo A browser window will open automatically.
    echo.
    call npm run dev
)

pause
