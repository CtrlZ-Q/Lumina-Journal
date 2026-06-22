const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const DATA_FILE = path.join(app.getPath('userData'), 'data.json')
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5180'

function readDataFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return fs.readFileSync(DATA_FILE, 'utf-8')
    }
  } catch {}
  return null
}

function writeDataFile(json) {
  fs.writeFileSync(DATA_FILE, json, 'utf-8')
}

ipcMain.on('read-data-sync', (event) => {
  try {
    event.returnValue = readDataFile()
  } catch {
    event.returnValue = null
  }
})

ipcMain.on('write-data-sync', (_event, json) => {
  try {
    writeDataFile(json)
    _event.returnValue = true
  } catch {
    _event.returnValue = false
  }
})

ipcMain.on('flush-data-sync', (_event, json) => {
  try {
    writeDataFile(json)
    _event.returnValue = true
  } catch {
    _event.returnValue = false
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

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(DEV_URL)
    win.webContents.openDevTools({ mode: 'detach' })
    return
  }

  const distPath = path.join(__dirname, '../dist/index.html')
  if (!fs.existsSync(distPath)) {
    throw new Error('Missing built renderer bundle: dist/index.html')
  }
  win.loadFile(distPath)
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
