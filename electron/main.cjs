const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

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
