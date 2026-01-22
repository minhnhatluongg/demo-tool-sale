@echo off
REM ========================================
REM 🚀 QUICK DEPLOY SCRIPT - React App (Windows)
REM ========================================

echo 🔧 Bắt đầu deploy React app...

REM Step 1: Clean
echo 🧹 Cleaning old build...
if exist build rmdir /s /q build

REM Step 2: Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Step 3: Build
echo 🏗️  Building production...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build thành công!
    
    echo.
    echo 📤 Chọn nền tảng deploy:
    echo 1^) Vercel ^(Khuyên dùng^)
    echo 2^) Netlify
    echo 3^) Chỉ build ^(không deploy^)
    set /p choice="Chọn (1-3): "
    
    if "%choice%"=="1" (
        echo 🚀 Deploying to Vercel...
        where vercel >nul 2>nul
        if %errorlevel% equ 0 (
            call vercel --prod
        ) else (
            echo ⚠️  Chưa cài Vercel CLI. Installing...
            call npm install -g vercel
            call vercel --prod
        )
    ) else if "%choice%"=="2" (
        echo 🚀 Deploying to Netlify...
        where netlify >nul 2>nul
        if %errorlevel% equ 0 (
            call netlify deploy --prod
        ) else (
            echo ⚠️  Chưa cài Netlify CLI. Installing...
            call npm install -g netlify-cli
            call netlify deploy --prod
        )
    ) else if "%choice%"=="3" (
        echo ✅ Build completed! Folder: .\build
        echo 💡 Test local: npx serve -s build
    ) else (
        echo ❌ Invalid choice
    )
) else (
    echo ❌ Build failed!
    exit /b 1
)

echo.
echo ✅ DONE!
pause

