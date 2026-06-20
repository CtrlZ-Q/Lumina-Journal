const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const DATA_FILE = path.join(app.getPath('userData'), 'data.json')

// 同步读取数据文件，供 preload 初始化时调用
ipcMain.on('read-data-sync', (event) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      event.returnValue = fs.readFileSync(DATA_FILE, 'utf-8')
    } else {
      event.returnValue = null
    }
  } catch {
    event.returnValue = null
  }
})

// 异步写入数据文件
ipcMain.handle('write-data', async (_event, json) => {
  try {
    fs.writeFileSync(DATA_FILE, json, 'utf-8')
    return true
  } catch {
    return false
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 680,
    minWidth: 900,
    minHeight: 580,
    title: '🌅 逐光手帐',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#f5f5f2',
    autoHideMenuBar: true,
  })

  const distPath = path.join(__dirname, '../dist/index.html')
  if (fs.existsSync(distPath)) {
    win.loadFile(distPath)
  } else {
    win.loadURL('http://localhost:5180')
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
