export const STORAGE_KEY = 'dino-app-data'
export const SHOP_KEY = 'dino-app-shop'

const isElectron = typeof window !== 'undefined' && window.electronAPI

/**
 * 加载指定 key 的状态
 * Electron 模式：从本地文件读取（文件为 { "dino-app-data": {...}, "dino-app-shop": {...} } 结构）
 * 浏览器模式：从 localStorage 读取
 * 首次运行自动迁移旧的 localStorage 数据
 */
export function loadState(key = STORAGE_KEY) {
  try {
    if (isElectron) {
      const all = window.electronAPI.initialData
      if (all && all[key]) return all[key]
      // 文件中没有该 key，尝试从旧 localStorage 迁移
      const legacy = localStorage.getItem(key)
      if (legacy) {
        const parsed = JSON.parse(legacy)
        saveState(parsed, key)
        localStorage.removeItem(key)
        return parsed
      }
      return null
    }
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * 保存指定 key 的状态
 * Electron 模式：读取完整文件 → 合并该 key → 写回（防止并发覆盖）
 * 浏览器模式：写入 localStorage
 */
export function saveState(state, key = STORAGE_KEY) {
  try {
    if (isElectron) {
      const all = window.electronAPI.initialData || {}
      all[key] = state
      window.electronAPI.initialData = all
      window.electronAPI.writeData(JSON.stringify(all))
    } else {
      localStorage.setItem(key, JSON.stringify(state))
    }
  } catch {}
}
