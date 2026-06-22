const { contextBridge, ipcRenderer } = require('electron')

// 同步获取初始数据（preload 阶段，确保渲染进程启动前数据就绪）
const rawData = ipcRenderer.sendSync('read-data-sync')
// sendSync 返回字符串，必须解析为对象，否则 useStorage.js 的 all[key] 会失败
let initialData = {}
try {
  if (rawData) initialData = JSON.parse(rawData)
} catch {}

contextBridge.exposeInMainWorld('electronAPI', {
  // 预加载的初始数据（已解析为对象，同步可用）
  initialData,
  // 同步写入数据（确保每次保存立即完成，关闭窗口不丢数据）
  writeData: (json) => ipcRenderer.sendSync('write-data-sync', json),
})
