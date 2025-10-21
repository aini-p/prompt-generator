@echo off
setlocal
title React Project Setup (v6 - Safe Echo)

echo ===================================
echo  React + TypeScript Project Setup
echo ===================================
echo.

REM --- 1. Node.js (npm) のチェック ---
echo Checking for npm (Node.js)...
echo (Running 'npm -v'...)

CALL npm -v

REM ifブロック内のechoを "" で囲む
if errorlevel 1 (
    echo.
    echo "[ERROR] 'npm -v' failed. Return code: %errorlevel%"
    echo "npm (Node.js) is not installed or not found in your system's PATH."
    echo "Please install Node.js from https://nodejs.org/ and try again."
    goto :error
)

echo.
echo Found npm version. (The line above this message)
echo.

REM --- 2. 依存関係のインストール ---
echo Installing project dependencies (npm install)...
echo This may take a few minutes...

CALL npm install

REM ifブロック内のechoを "" で囲む
if errorlevel 1 (
    echo.
    echo "[ERROR] 'npm install' failed. Please check the error messages above."
    goto :error
)
echo.
echo Dependencies installed successfully.
echo.

REM --- 3. 開発サーバーの起動 ---
echo ===================================
echo  Setup Complete!
echo ===================================
echo.
echo Starting the development server (npm run dev)...
echo.

CALL npm run dev

goto :eof

:error
echo.
echo "Setup failed. Press any key to exit."
pause
endlocal