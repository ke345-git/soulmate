/**
 * SoulMate Desktop — Electron 主进程
 *
 * 职责：
 * 1. 启动 Python FastAPI 后端（作为子进程）
 * 2. 等待后端就绪
 * 3. 打开 Electron 窗口加载前端
 * 4. 应用关闭时清理后端进程
 */

const { app, BrowserWindow, dialog, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const net = require('net')

// 配置
const BACKEND_PORT = 18000
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
const isDev = process.argv.includes('--dev')

let mainWindow = null
let backendProcess = null

// ─── 后端管理 ───────────────────────────────────────────

function getPythonCommand() {
  if (process.platform === 'win32') {
    // Windows: 优先使用嵌入的 Python，否则使用系统 Python
    const embedded = path.join(process.resourcesPath, 'backend', 'python', 'python.exe')
    if (require('fs').existsSync(embedded)) return embedded
    return 'python'
  }
  return 'python3'
}

function getBackendPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'backend')
  }
  return path.join(process.resourcesPath, 'backend')
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = getBackendPath()
    const pythonCmd = getPythonCommand()
    const appPy = path.join(backendPath, 'app.py')

    console.log(`[SoulMate] 启动后端: ${pythonCmd} ${appPy}`)
    console.log(`[SoulMate] 后端路径: ${backendPath}`)

    // 设置环境变量
    const env = {
      ...process.env,
      PORT: String(BACKEND_PORT),
      APP_ENV: 'production',
      DATABASE_URL: `sqlite:///${path.join(backendPath, 'soulmate.db')}`,
    }

    try {
      backendProcess = spawn(pythonCmd, ['-u', appPy], {
        cwd: backendPath,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      backendProcess.stdout.on('data', (data) => {
        const msg = data.toString()
        console.log(`[Backend] ${msg.trim()}`)
        // FastAPI 启动成功的标志
        if (msg.includes('Uvicorn running on') || msg.includes('Application startup complete')) {
          // 给后端一点时间完全就绪
          setTimeout(resolve, 1500)
        }
      })

      backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`)
      })

      backendProcess.on('error', (err) => {
        console.error(`[SoulMate] 后端启动失败:`, err)
        reject(err)
      })

      backendProcess.on('exit', (code) => {
        console.log(`[SoulMate] 后端进程退出，退出码: ${code}`)
        backendProcess = null
      })

      // 超时回退：10 秒后无论如何 resolve
      setTimeout(resolve, 10000)
    } catch (err) {
      reject(err)
    }
  })
}

function stopBackend() {
  if (backendProcess) {
    console.log('[SoulMate] 正在关闭后端...')
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t'])
    } else {
      backendProcess.kill('SIGTERM')
    }
    backendProcess = null
  }
}

function waitForBackend(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      http.get(`${BACKEND_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[SoulMate] 后端就绪')
          resolve()
        } else if (remaining > 0) {
          setTimeout(() => check(remaining - 1), 1000)
        } else {
          reject(new Error('后端启动超时'))
        }
      }).on('error', () => {
        if (remaining > 0) {
          setTimeout(() => check(remaining - 1), 1000)
        } else {
          reject(new Error('后端启动超时'))
        }
      })
    }
    check(retries)
  })
}

// ─── 窗口管理 ───────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    title: 'SoulMate — AI 情感陪伴',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#fef7f2',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  // 窗口准备好后再显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 在默认浏览器打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 加载前端
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadURL(BACKEND_URL)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── 应用生命周期 ───────────────────────────────────────

app.whenReady().then(async () => {
  try {
    if (!isDev) {
      await startBackend()
      await waitForBackend()
    }
    createWindow()
  } catch (err) {
    console.error('[SoulMate] 启动失败:', err)
    dialog.showErrorBox('启动失败', `无法启动 SoulMate 后端服务:\n${err.message}\n\n请确保已安装 Python 3.11+`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  stopBackend()
})
