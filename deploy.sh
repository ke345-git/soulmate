#!/bin/bash
# ============================================
# SoulMate 一键部署脚本
# 适用于 Ubuntu 20.04+ / Debian 11+
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔═══════════════════════════╗"
echo "  ║   SoulMate 部署脚本       ║"
echo "  ║   AI 情感陪伴应用         ║"
echo "  ╚═══════════════════════════╝"
echo -e "${NC}"

# 检查是否为 root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠ 不建议以 root 运行，请使用普通用户。${NC}"
    exit 1
fi

# 配置
APP_DIR="$HOME/soulmate"
VENV_DIR="$APP_DIR/venv"

# 1. 安装系统依赖
echo -e "${YELLOW}[1/6] 安装系统依赖...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq \
    python3 python3-pip python3-venv \
    nginx curl git \
    build-essential

# 2. 克隆项目（或从当前目录复制）
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}[2/6] 克隆项目...${NC}"
    git clone https://github.com/YOUR_USERNAME/soulmate.git "$APP_DIR"
else
    echo -e "${YELLOW}[2/6] 项目目录已存在，更新代码...${NC}"
    cd "$APP_DIR"
    git pull
fi

cd "$APP_DIR"

# 3. 创建虚拟环境
echo -e "${YELLOW}[3/6] 配置 Python 环境...${NC}"
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip -q
pip install -r backend/requirements.txt -q

# 4. 配置环境变量
echo -e "${YELLOW}[4/6] 配置环境...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    # 生成随机密钥
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i "s/your-secret-key-change-in-production/$SECRET/" .env
    echo -e "${RED}⚠ 请编辑 .env 文件修改管理员密码！${NC}"
fi

# 5. 配置 Nginx
echo -e "${YELLOW}[5/6] 配置 Nginx...${NC}"
if [ -f "nginx.conf" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/soulmate
    sudo ln -sf /etc/nginx/sites-available/soulmate /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx 配置完成${NC}"
fi

# 6. 配置 Systemd 服务
echo -e "${YELLOW}[6/6] 配置系统服务...${NC}"
SERVICE_FILE="/etc/systemd/system/soulmate.service"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=SoulMate AI Companion
After=network.target

[Service]
Type=exec
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$VENV_DIR/bin
Environment=APP_ENV=production
ExecStart=$VENV_DIR/bin/gunicorn app:app \\
    --workers 4 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 127.0.0.1:8000 \\
    --timeout 120 \\
    --access-logfile /var/log/soulmate/access.log \\
    --error-logfile /var/log/soulmate/error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo mkdir -p /var/log/soulmate
sudo chown "$USER:$USER" /var/log/soulmate
sudo systemctl daemon-reload
sudo systemctl enable soulmate
sudo systemctl start soulmate

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ SoulMate 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  后端 API:  http://localhost:8000"
echo -e "  API 文档:  http://localhost:8000/docs"
echo -e "  健康检查:  http://localhost:8000/api/health"
echo ""
echo -e "  常用命令:"
echo -e "  sudo systemctl status soulmate   # 查看服务状态"
echo -e "  sudo systemctl restart soulmate  # 重启服务"
echo -e "  sudo journalctl -u soulmate -f   # 查看日志"
echo ""
echo -e "${RED}  ⚠ 请立即编辑 $APP_DIR/.env 修改管理员密码！${NC}"
