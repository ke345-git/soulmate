# 💝 SoulMate — 开源 AI 情感陪伴应用

> Replika 的开源替代品。温暖、私密、可控的 AI 伴侣。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

<p align="center">
  <img src="frontend/public/favicon.svg" width="120" alt="SoulMate Logo" />
</p>

## 🎯 下载使用

### Windows 用户
从 [Releases](https://github.com/ke345-git/soulmate/releases) 下载 `SoulMate-Windows.zip`，解压后双击 `启动SoulMate.bat` 即可使用。浏览器会自动打开。

### macOS 用户
从 [Releases](https://github.com/ke345-git/soulmate/releases) 下载 `SoulMate-macOS.zip`，解压后运行 `SoulMate`，浏览器打开 `http://localhost:8000`。

### Linux 用户
从 [Releases](https://github.com/ke345-git/soulmate/releases) 下载 `SoulMate-Linux.tar.gz`，解压后运行：
```bash
chmod +x SoulMate && ./SoulMate
```

### Docker 部署
```bash
docker run -d -p 8000:8000 -v soulmate-data:/app/data ke345git/soulmate:latest
```

## ✨ 功能特性

- 🎭 **20 个预设角色** — 温柔学姐、傲娇大小姐、病娇妹妹、精灵王子……
- 💬 **流式聊天** — SSE 实时输出，打字机般的自然对话体验
- 🧠 **记忆系统** — 自动提取关键信息，跨会话记忆检索
- 🔌 **多模型支持** — OpenAI、Anthropic、Azure、自定义 API
- 🎨 **温暖治愈 UI** — 暖色调、毛玻璃、圆角，适配 PC 和移动端
- 🔐 **自带认证** — JWT 注册/登录，用户数据完全隔离

## 🚀 开发者指南

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/ke345-git/soulmate.git
cd soulmate

# 2. 配置环境
cp .env.example .env

# 3. 启动后端 (终端 1)
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:8000

# 4. 启动前端 (终端 2)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 构建桌面版

**Windows:**
```bash
scripts\build-windows.bat
```
输出在 `release/SoulMate/`，双击 `启动SoulMate.bat` 运行。

**macOS / Linux:**
```bash
chmod +x scripts/build-desktop.sh
./scripts/build-desktop.sh
```

### 构建 Android APK
```bash
# 需要安装 Android SDK
bash scripts/build-android.sh
```

## 📁 项目结构

```
soulmate/
├── backend/                # FastAPI 后端
│   ├── app.py              # 入口 (支持 PyInstaller)
│   ├── config.py           # 配置
│   ├── database.py         # SQLAlchemy + SQLite
│   ├── models/             # User, Character, Chat, ModelConfig
│   ├── routes/             # auth, chat, characters, models
│   ├── services/           # AI调用, 记忆, 角色库
│   └── middleware/         # JWT, 速率限制
├── frontend/               # React 前端
│   ├── src/views/          # 7 个页面
│   ├── src/components/     # 7 个组件
│   ├── src/stores/         # Zustand 状态管理
│   └── src/router/         # Vue Router
├── scripts/                # 构建脚本
├── .github/workflows/      # CI/CD 自动构建
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## 🔧 API 文档

启动后端后访问 http://localhost:8000/docs 查看 Swagger 文档。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/characters` | 角色列表 |
| POST | `/api/characters` | 创建角色 |
| GET/POST/PUT/DELETE | `/api/models` | 模型管理 |
| POST | `/api/models/test` | 测试连接 |
| POST | `/api/chat/send` | 发送消息 (SSE) |
| GET | `/api/chat/sessions` | 会话列表 |

## 🤝 贡献

欢迎 Issue 和 PR！

1. Fork 本项目
2. `git checkout -b feature/xxx`
3. `git commit -m 'feat: xxx'`
4. `git push origin feature/xxx`
5. 开 Pull Request

## 📄 协议

MIT License

---

<p align="center">Made with 💝</p>
