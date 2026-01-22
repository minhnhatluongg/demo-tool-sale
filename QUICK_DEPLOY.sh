#!/bin/bash

# ========================================
# 🚀 QUICK DEPLOY SCRIPT - React App
# ========================================

echo "🔧 Bắt đầu deploy React app..."

# Step 1: Clean
echo "🧹 Cleaning old build..."
rm -rf build

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build
echo "🏗️  Building production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build thành công!"
    
    # Ask user which platform
    echo ""
    echo "📤 Chọn nền tảng deploy:"
    echo "1) Vercel (Khuyên dùng)"
    echo "2) Netlify"
    echo "3) Chỉ build (không deploy)"
    read -p "Chọn (1-3): " choice
    
    case $choice in
        1)
            echo "🚀 Deploying to Vercel..."
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                echo "⚠️  Chưa cài Vercel CLI. Installing..."
                npm install -g vercel
                vercel --prod
            fi
            ;;
        2)
            echo "🚀 Deploying to Netlify..."
            if command -v netlify &> /dev/null; then
                netlify deploy --prod
            else
                echo "⚠️  Chưa cài Netlify CLI. Installing..."
                npm install -g netlify-cli
                netlify deploy --prod
            fi
            ;;
        3)
            echo "✅ Build completed! Folder: ./build"
            echo "💡 Test local: npx serve -s build"
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ DONE!"

