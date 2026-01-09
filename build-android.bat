@echo off
cd /d "%~dp0"

echo ========================================
echo   myFin - Build Android APK
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 goto error

echo.
echo Step 2: Building web app...
call npm run build
if errorlevel 1 goto error

echo.
echo Step 3: Adding Android platform...
call npx cap add android
if errorlevel 1 (
    echo Android platform may already exist, continuing...
)

echo.
echo Step 4: Syncing with Android...
call npx cap sync android
if errorlevel 1 goto error

echo.
echo ========================================
echo   Build completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npx cap open android
echo 2. In Android Studio, go to Build - Build Bundle(s) / APK(s) - Build APK(s)
echo 3. The APK will be in: android/app/build/outputs/apk/debug/
echo.
echo Or install Android Studio from:
echo https://developer.android.com/studio
echo.
pause
goto end

:error
echo.
echo ========================================
echo   Error occurred! Please check above.
echo ========================================
pause

:end
