#!/bin/bash
# ============================================
# SoulMate Android APK 构建脚本
# ============================================
set -e

echo "📱 Building SoulMate Android APK..."

# 1. 构建前端
echo "[1/4] Building frontend..."
cd frontend
npm install
npm run build

# 2. 安装 Capacitor（如果还没装）
echo "[2/4] Setting up Capacitor..."
npm install --save-dev @capacitor/cli @capacitor/core @capacitor/android

# 3. 初始化并同步 Android 项目
echo "[3/4] Syncing Android project..."
# 使用仓库提交的 capacitor.config.json（appId/权限等已在其中）
npx cap add android 2>/dev/null || true
npx cap sync android

# 4. 构建 APK
echo "[4/4] Building APK..."
cd android
./gradlew assembleDebug

echo ""
echo "✅ APK built successfully!"
echo "   Debug APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "To build a release APK, sign with your keystore and run:"
echo "  cd frontend/android && ./gradlew assembleRelease"
