# 💝 SoulMate — 开源 AI 情感陪伴应用

> Replika 的开源替代品。温暖、私密、可控的 AI 伴侣。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

<p align="center">
  <img src="frontend/public/favicon.svg" width="120" alt="SoulMate Logo" />
</p>

## ✨ 特性

- 🎭 **20 个预设角色** — 覆盖温柔学姐、傲娇大小姐、病娇妹妹、精灵王子等多种性格
- 💬 **流式聊天** — SSE 实时流式输出，打字机般的自然对话体验
- 🧠 **记忆系统** — 自动提取关键信息，跨会话记忆检索
- 🔌 **多模型支持** — OpenAI、Anthropic、Azure、自定义 API 全兼容
- 🎨 **温暖治愈 UI** — 暖色调、毛玻璃、圆角设计，适配 PC 和移动端
- 🔐 **自带认证** — JWT 注册/登录，用户数据完全隔离
- 🐳 **一键部署** — Docker Compose / 部署脚本，2核4G 服务器即跑

## 📸 预览

| 登录页 | 角色库 | 聊天界面 |
|---------|--------|----------|
| 温暖的渐变背景 + 毛玻璃卡片 | 网格展示所有角色 | 流式对话 + 记忆侧边栏 |

## 🚀 快速开始

### 前置要求

- Python 3.11+
- Node.js 18+
- （可选）Docker & Docker Compose

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/soulmate.git
cd soulmate

# 2. 配置环境
cp .env.example .env
# 编辑 .env 修改 SECRET_KEY 和管理员密码

# 3. 启动后端
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# 后端运行在 http://localhost:8000

# 4. 启动前端（新终端）
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

### Docker 部署

```bash
# 一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 生产部署

```bash
# 在 Ubuntu/Debian 服务器上
chmod +x deploy.sh
./deploy.sh
```

## 📁 项目结构

```
soulmate/
├── backend/                # FastAPI 后端
│   ├── app.py              # 应用入口
│   ├── config.py           # 配置管理
│   ├── database.py         # SQLAlchemy + SQLite
│   ├── models/             # 数据模型
│   │   ├── user.py         # 用户
│   │   ├── character.py    # 角色
│   │   ├── chat.py         # 聊天 + 记忆
│   │   └── model_config.py # 模型配置
│   ├── routes/             # API 路由
│   │   ├── auth.py         # 认证 (注册/登录)
│   │   ├── models_config.py # 模型管理
│   │   ├── characters.py   # 角色管理
│   │   └── chat.py         # 聊天对话
│   ├── services/           # 业务服务
│   │   ├── ai_service.py   # LLM 调用
│   │   ├── memory_service.py # 记忆检索
│   │   └── character_service.py # 角色库
│   └── middleware/         # 中间件
│       └── auth.py         # JWT 验证
├── frontend/               # React 前端
│   ├── src/
│   │   ├── views/          # 页面
│   │   ├── components/     # 组件
│   │   ├── stores/         # Zustand 状态
│   │   ├── router/         # 路由
│   │   └── lib/            # 工具函数
│   └── package.json
├── Dockerfile              # 多阶段构建
├── docker-compose.yml      # 容器编排
├── nginx.conf              # Nginx 配置
├── deploy.sh               # 一键部署脚本
└── .env.example            # 环境变量模板
```

## 🔧 API 文档

启动后端后访问 http://localhost:8000/docs 查看完整的 Swagger API 文档。

### 核心接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/characters` | 获取角色列表 |
| POST | `/api/characters` | 创建自定义角色 |
| GET | `/api/models` | 获取模型配置 |
| POST | `/api/models` | 添加模型配置 |
| POST | `/api/models/test` | 测试模型连接 |
| POST | `/api/chat/send` | 发送消息（SSE流式） |
| GET | `/api/chat/sessions` | 获取会话列表 |
| GET | `/api/chat/sessions/{id}/memories` | 获取记忆 |

## 🎯 路线图

- [x] MVP：角色聊天 + 记忆系统 + 多模型
- [x] 20 个预设角色
- [x] Docker 部署
- [ ] 立绘 AI 生成（DALL-E / Midjourney）
- [ ] 小说角色导入
- [ ] 抽卡/邂逅系统
- [ ] 语音对话
- [ ] 移动端 PWA

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 协议

MIT License — 详见 [LICENSE](LICENSE) 文件。

---

<p align="center">Made with 💝 by the open-source community</p>
