export const STORAGE_KEY = 'dino-app-data'
export const SHOP_KEY = 'dino-app-shop'

let _cache = null
let _pendingWrite = null
let _flushHandler = null

function getCache() {
  if (_cache) return _cache
  const api = window.electronAPI
  if (api && api.initialData && typeof api.initialData === 'object') {
    _cache = JSON.parse(JSON.stringify(api.initialData))
  } else {
    _cache = {}
  }
  return _cache
}

/**
 * 加载指定 key 的状态（从内存缓存读取，预加载阶段已从文件同步读取）
 */
export function loadState(key = STORAGE_KEY) {
  try {
    const all = getCache()
    return (all && typeof all === 'object' && key in all) ? all[key] : null
  } catch (e) {
    console.error('[useStorage] loadState 异常:', e)
    return null
  }
}

/**
 * 保存指定 key 的状态（更新内存缓存 → 同步写回文件）
 */
export function saveState(state, key = STORAGE_KEY) {
  try {
    const api = window.electronAPI
    const all = getCache()
    if (state === null) {
      delete all[key]
    } else {
      all[key] = state
    }
    _cache = all
    if (api && api.writeData) {
      _pendingWrite = Promise.resolve(api.writeData(JSON.stringify(all)))
      return _pendingWrite
    }
  } catch (e) {
    console.error('[useStorage] saveState 异常:', e)
  }
}

export function flushState() {
  try {
    const api = window.electronAPI
    if (api && api.writeData) {
      return Promise.resolve(api.writeData(JSON.stringify(getCache())))
    }
  } catch (e) {
    console.error('[useStorage] flushState 异常:', e)
  }
}

export function registerFlushHandler(handler) {
  _flushHandler = handler
}

export function flushBeforeExit() {
  if (typeof _flushHandler === 'function') {
    return _flushHandler()
  }
  return flushState()
}
