@echo off
cd /d "%~dp0"

echo ========================================
echo   myFin - Git Push Script
echo ========================================
echo.

:: Check if Git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
    git remote add origin https://github.com/xushiexpresso15/myFin.git
    echo Git initialized!
    echo.
)

:: Show current status
echo Current changes:
git status --short
echo.

:: Input commit message
set /p commit_msg="Enter commit message: "

:: Use default if empty
if "%commit_msg%"=="" set commit_msg=Update

:: Execute git commands
echo.
echo Adding all files...
git add .

echo Committing changes...
git commit -m "%commit_msg%"

echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo   Push completed!
echo   https://github.com/xushiexpresso15/myFin
echo ========================================
echo.
pause
