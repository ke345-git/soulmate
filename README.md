<div align="center">

# 💝 SoulMate

**开源 AI 情感陪伴应用 — Replika 的开源替代品**

温暖、私密、可控的 AI 伴侣，你的数据只属于你自己。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/ke345-git/soulmate?color=orange&label=最新版本)](https://github.com/ke345-git/soulmate/releases)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![GitHub Stars](https://img.shields.io/github/stars/ke345-git/soulmate?style=social)](https://github.com/ke345-git/soulmate)

<img src="frontend/public/favicon.svg" width="120" alt="SoulMate Logo" />

</div>

---

## 🌟 项目简介

SoulMate 是一款**开箱即用、完全私密**的 AI 情感陪伴应用：

- 🔒 **数据本地存储** — 聊天记录、角色、记忆全部存在你自己的设备（SQLite），不经过任何第三方服务器
- 🔌 **自带模型** — 支持 OpenAI、Anthropic、DeepSeek、Kimi、智谱、本地 Ollama 等任意 OpenAI 兼容接口，你自己掌控 API Key
- 🎭 **角色自由** — 20 个内置角色，也可以粘贴一段**聊天记录**或**小说内容**，让 AI 自动学习角色的性格与说话方式
- 🖼️ **角色立绘** — 30 张内置免费立绘，支持上传图片，或对接 gpt-image-1 一键「AI 抽卡」生成专属立绘
- 📦 **全平台** — Windows / macOS / Linux 桌面版、Android APK、Docker，全部一键发布

## ✨ 功能特性

### 💬 对话体验
| 功能 | 说明 |
|------|------|
| 流式聊天 | SSE 实时输出，打字机般的自然对话体验 |
| 记忆系统 | 自动提取关键信息，跨会话向量检索（本地实现，无需外部服务） |
| 会话管理 | 多会话、历史记录、手动添加重要记忆 |

### 🔌 模型接入
| 功能 | 说明 |
|------|------|
| 多模型配置 | 任意 OpenAI 兼容 API + Anthropic，自填 Base URL / Key / 模型名 |
| 一键切换 | 聊天页顶部下拉即时切换，选择自动持久化 |
| 公益站预设 | 内置 11 个常用服务商模板（DeepSeek / Kimi / 智谱 GLM / 硅基流动 / Groq / OpenRouter / Ollama 等），含免费额度标记，填 Key 即用 |
| 连接测试 | 每个模型可一键测试连通性，在线/离线状态一目了然 |

### 🎭 角色系统
| 功能 | 说明 |
|------|------|
| 20 个预设角色 | 温柔学姐、傲娇大小姐、病娇妹妹、精灵王子……全员配好立绘 |
| 自定义角色卡 | 名称、性格标签、背景、语言风格、开场白、示例对话，全部可编辑 |
| 聊天记录导入 | 粘贴「名字：内容」格式记录，自动识别双方、提取对方性格/口癖/风格 |
| 小说人物导入 | 粘贴小说正文/梗概，正则提取高频说话人与台词，生成完整角色草稿（无需 AI 也能用） |

### 🎨 角色立绘
| 功能 | 说明 |
|------|------|
| 内置立绘库 | 30 张 [DiceBear](https://www.dicebear.com) 开源 CC0 立绘，本地化存储、离线可用 |
| 上传图片 | 支持自定义立绘（≤5MB） |
| AI 抽卡 | 对接 gpt-image-1 自动生成符合角色性格的专属立绘 |

### 🔐 隐私与安全
- JWT 注册/登录，用户数据完全隔离
- API Key 仅保存在本地数据库，永不外传
- 支持速率限制，防止滥用

## 🚀 快速开始

### 📦 下载安装（桌面版）

从 [Releases](https://github.com/ke345-git/soulmate/releases) 页面下载对应平台的最新版本：

| 平台 | 文件 | 安装方式 |
|------|------|----------|
| 🪟 Windows | `SoulMate-Windows-Setup.exe` | 双击安装，桌面出现图标，双击启动，浏览器自动打开 |
| 🍎 macOS | `SoulMate-macOS.zip` | 解压后双击 `SoulMate.app` |
| 🐧 Linux | `SoulMate-Linux.tar.gz` | `chmod +x SoulMate && ./SoulMate` |
| 📱 Android | `SoulMate-Android.apk` | 安装后即可使用 |

> 首次启动后浏览器自动打开 `http://localhost:8000`

### 🐳 Docker 部署

```bash
docker pull ghcr.io/ke345-git/soulmate:latest
docker run -d -p 8000:8000 -v soulmate-data:/app/data ghcr.io/ke345-git/soulmate:latest
```

> 数据卷 `soulmate-data` 持久化聊天记录与角色数据；`docker-compose.yml` 提供了带 Nginx 反向代理的完整示例。

### ✨ 从源码运行（开发模式）

```bash
# 1. 克隆项目
git clone https://github.com/ke345-git/soulmate.git
cd soulmate

# 2. 配置环境
cp .env.example .env

# 3. 启动后端（终端 1）→ http://localhost:8000
cd backend
pip install -r requirements.txt
python app.py

# 4. 启动前端（终端 2）→ http://localhost:5173
cd frontend
npm install
npm run dev
```

## 📖 使用指南

### 1️⃣ 注册登录

打开应用后注册账号（或使用默认管理员 `admin@soulmate.app` / `admin123`），登录后所有数据都与账号绑定。

### 2️⃣ 配置 AI 模型

- 进入「**模型**」页面 → 展开「**公益站 / 免费接口预设**」→ 选一个服务商（如 DeepSeek、Groq、Ollama 本地）
- 填入你的 API Key → 「测试」验证连通 → 「激活使用」
- 也可以完全自定义：添加任意 OpenAI 兼容接口

> 💡 没有 API Key？可以本地跑 [Ollama](https://ollama.com)（免费），选「Ollama 本地」预设即可。

### 3️⃣ 开始对话

进入「**对话**」页 → 选择一个角色 → 顶部右侧可随时切换模型 → 开始聊天。

### 4️⃣ 创建自己的角色

- **手动创建**：进入「角色」→「创建角色」，填写名称、性格标签、背景、语言风格、示例对话
- **从聊天记录导入**：点击「导入」→ 粘贴记录 → 自动生成角色草稿 → 确认创建
- **从小说导入**：点击「导入」→ 切换「小说人物」→ 粘贴小说内容 → 选择候选角色名 → 自动生成性格与台词风格

### 5️⃣ 定制立绘

- 创建角色时从「内置立绘库」挑选（30 张免费立绘）
- 角色详情页可「上传」自定义图片
- 已配置 OpenAI Key 时，点击「**AI 立绘**」用 gpt-image-1 生成专属立绘

## 🛠️ 开发者指南

### 本地开发

见上方「从源码运行」。前端热更新（Vite），后端 Swagger 文档在 `http://localhost:8000/docs`。

### 构建桌面版

**Windows：**
```bash
scripts\build-windows.bat
```
输出在 `release/SoulMate/`，双击 `启动SoulMate.bat` 运行。

**macOS / Linux：**
```bash
chmod +x scripts/build-desktop.sh
./scripts/build-desktop.sh
```

### 构建 Android APK

```bash
# 需要安装 Android SDK
bash scripts/build-android.sh
```

### 自动发布 Release

推送 `v*` 格式的 tag 即可触发 [GitHub Actions](.github/workflows/release.yml)，自动构建 Windows / macOS / Linux / Android / Docker 全部产物并创建 Release：

```bash
git tag v1.1.0
git push origin v1.1.0
```

### 重新下载内置立绘

```bash
python scripts/download_portraits.py   # 需要联网，来源 DiceBear（CC0）
```

## 📁 项目结构

```
soulmate/
├── backend/                # FastAPI 后端
│   ├── app.py              # 入口（支持 PyInstaller 打包）
│   ├── config.py           # 配置（.env）
│   ├── database.py         # SQLAlchemy + SQLite
│   ├── models/             # User / Character / Chat / ModelConfig
│   ├── routes/             # auth / chat / characters / models
│   ├── services/           # AI 调用、记忆、角色库、文本导入、公益站预设
│   ├── portraits/          # 内置立绘（DiceBear CC0）
│   └── middleware/         # JWT 认证、速率限制
├── frontend/               # React 18 + Vite + Tailwind
│   ├── src/views/          # 7 个页面
│   ├── src/components/     # 组件（含导入向导、立绘选择器）
│   ├── src/stores/         # Zustand 状态管理
│   └── src/router/         # React Router
├── scripts/                # 构建 / 打包 / 立绘下载脚本
├── .github/workflows/      # CI + 自动发布
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## 🔧 API 一览

完整文档：启动后端后访问 `http://localhost:8000/docs`（Swagger）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/characters` | 角色列表（预设 + 我的） |
| POST | `/api/characters` | 创建角色 |
| POST | `/api/characters/import-chatlog` | 从聊天记录导入角色（返回草稿） |
| POST | `/api/characters/import-novel` | 从小说导入角色（返回草稿 + 候选角色名） |
| POST | `/api/characters/{id}/generate-portrait` | AI 生成立绘（gpt-image-1） |
| GET | `/api/models` | 模型配置列表 |
| GET | `/api/models/presets` | 公益站 / 免费接口预设 |
| POST | `/api/models` | 添加模型配置 |
| POST | `/api/models/test` | 测试连接 |
| POST | `/api/chat/send` | 发送消息（SSE 流式） |
| GET | `/api/chat/sessions` | 会话列表 |

## ❓ 常见问题

**Q：为什么聊天前必须配置模型？**
A：SoulMate 不内置任何付费 API，模型需要你自行配置。没有 Key 可以安装 Ollama 在本地跑免费模型。

**Q：「公益站 / 免费接口」是什么？**
A：社区公开的模型服务商模板，方便一键填充。免费额度、价格、稳定性以各服务官网为准，建议优先选择官方或信誉良好的服务。

**Q：我的聊天记录和 API Key 安全吗？**
A：数据全部存储在本地 SQLite 中，API Key 不回显、不离开你的设备（仅用于直接调用模型接口）。

**Q：角色导入的原理是什么？**
A：使用正则 + 关键词分析（无需调用 AI）：识别说话人 → 提取台词 → 统计性格标签与口癖 → 生成系统提示词与示例对话。

**Q：支持哪些模型接口？**
A：任意 OpenAI 兼容接口（OpenAI、DeepSeek、Kimi、智谱、Groq、OpenRouter、Ollama……）以及 Anthropic Claude。

**Q：手机 APK 连不上服务器 / 登录报错？**
A：APK 是纯客户端，需要指定运行 SoulMate 的电脑地址：
1. 在电脑上执行 `ipconfig` 查看局域网 IP（如 `192.168.1.100`），手机与电脑连同一 Wi-Fi
2. 打开 App → 登录页下方「连接不上？配置服务器地址」→ 填写 `http://192.168.1.100:8000/api` → 测试连接 → 保存并重载
3. 也可在「设置 → 服务器地址」中随时修改
> 电脑端防火墙需放行 8000 端口（入站 TCP）。

**Q：Windows 版启动闪退？**
A：请确认使用 v1.1.1 及以上版本。旧版本在中文系统（GBK 编码）下启动打印 emoji 会崩溃，已修复；若仍闪退，请把 `%APPDATA%\SoulMate` 目录删除后重试，或在 GitHub Issues 中反馈。

## 🤝 贡献

欢迎 Issue 和 PR！

1. Fork 本项目
2. `git checkout -b feature/xxx`
3. `git commit -m 'feat: xxx'`
4. `git push origin feature/xxx`
5. 开 Pull Request

## 📄 协议与致谢

- 项目代码：**MIT License**
- 内置立绘：[DiceBear](https://www.dicebear.com)（CC0 公有领域，本地化存储）
- 前端 UI：React + Tailwind CSS + [Lucide](https://lucide.dev) 图标

---

<div align="center">

Made with 💝

**Star ⭐ 这个仓库，支持 SoulMate 持续发展！**

</div>
