#!/bin/bash
# ============================================
# SoulMate 桌面版构建脚本 (macOS/Linux)
# ============================================
set -e

echo "============================================"
echo "  SoulMate Desktop Build"
echo "============================================"

# 1. 构建前端
echo "[1/3] Building frontend..."
cd "$(dirname "$0")/../frontend"
npm install
npm run build

# 2. 复制前端到后端
echo "[2/3] Copying frontend to backend..."
cd "$(dirname "$0")/.."
rm -rf backend/static
cp -r frontend/dist backend/static

# 3. PyInstaller 打包
echo "[3/3] Building with PyInstaller..."
cd backend
pip install pyinstaller -q
pyinstaller --onefile --name SoulMate \
    --add-data "static:static" \
    --add-data "portraits:portraits" \
    --add-data "services:services" \
    --add-data "routes:routes" \
    --add-data "models:models" \
    --add-data "middleware:middleware" \
    --add-data "config.py:." \
    --add-data "database.py:." \
    --hidden-import=passlib.handlers.bcrypt \
    --hidden-import=slowapi \
    --collect-all slowapi \
    app.py

# 4. 创建发布包
echo "Creating release package..."
cd "$(dirname "$0")/.."
mkdir -p release/SoulMate
cp backend/dist/SoulMate release/SoulMate/
cp .env.example release/SoulMate/

echo ""
echo "✅ Build complete!"
echo "   Output: release/SoulMate/"
echo "   Run: ./release/SoulMate/SoulMate"
echo ""
echo "Then open http://localhost:8000 in your browser."
