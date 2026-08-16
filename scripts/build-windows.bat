@echo off
chcp 65001 >nul
echo ============================================
echo   SoulMate Windows 构建脚本
echo ============================================
echo.

REM 1. 构建前端
echo [1/3] 构建前端...
cd /d "%~dp0..\frontend"
call npm install
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ 前端构建失败！
    pause
    exit /b 1
)

REM 2. 复制前端到后端
echo [2/3] 复制前端文件...
cd /d "%~dp0.."
if exist backend\static rmdir /s /q backend\static
xcopy /e /i frontend\dist backend\static
echo ✓ 前端已复制到 backend/static/

REM 3. 用 PyInstaller 打包
echo [3/3] 打包为 EXE...
cd /d "%~dp0..\backend"
pip install pyinstaller -q
pyinstaller --onefile --name SoulMate ^
    --add-data "static;static" ^
    --add-data "portraits;portraits" ^
    --add-data "services;services" ^
    --add-data "routes;routes" ^
    --add-data "models;models" ^
    --add-data "middleware;middleware" ^
    --add-data "config.py;." ^
    --add-data "database.py;." ^
    --hidden-import=passlib.handlers.bcrypt ^
    --hidden-import=slowapi ^
    --collect-all slowapi ^
    app.py

if %ERRORLEVEL% neq 0 (
    echo ❌ PyInstaller 打包失败！
    pause
    exit /b 1
)

REM 4. 创建发布包
echo.
echo 打包完成！创建发布包...
cd /d "%~dp0.."
if exist release rmdir /s /q release
mkdir release\SoulMate
copy backend\dist\SoulMate.exe release\SoulMate\
copy .env.example release\SoulMate\

REM 创建启动脚本
(
echo @echo off
echo chcp 65001 ^>nul
echo echo 💝 SoulMate 启动中...
echo echo.
echo echo 浏览器将自动打开 http://localhost:8000
echo echo 请保持此窗口打开。
echo echo.
echo start "" "%%~dp0SoulMate.exe"
) > release\SoulMate\启动SoulMate.bat

echo.
echo ============================================
echo   ✅ 构建完成！
echo   文件位置: release\SoulMate\
echo   - SoulMate.exe      (主程序)
echo   - 启动SoulMate.bat   (双击启动)
echo   - .env.example       (配置模板)
echo ============================================
echo.
echo 直接双击 启动SoulMate.bat 即可运行！
pause
