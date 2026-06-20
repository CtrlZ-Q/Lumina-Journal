const { contextBridge, ipcRenderer } = require('electron')

// 同步获取初始数据（preload 阶段，确保渲染进程启动前数据就绪）
const initialData = ipcRenderer.sendSync('read-data-sync')

contextBridge.exposeInMainWorld('electronAPI', {
  // 预加载的初始数据（同步可用）
  initialData,
  // 异步写入数据
  writeData: (json) => ipcRenderer.invoke('write-data', json),
})
