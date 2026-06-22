<script setup>
import { ref, onMounted, computed, provide } from 'vue'
import { useGameStore } from './stores/game'
import { useShopStore } from './stores/shop'
import PageHome from './pages/PageHome.vue'
import AchievementToast from './components/AchievementToast.vue'

const store = useGameStore()
const shop = useShopStore()

const loaded = ref(false)
const pageBg = ref(null)
provide('setAppPageBg', (bg) => { pageBg.value = bg })
const toastQueue = ref([])
let toastId = 0

onMounted(() => {
  setTimeout(() => loaded.value = true, 50)
})

const pendingToasts = []
let processing = false

function processToastQueue() {
  if (processing) return
  if (pendingToasts.length === 0) { processing = false; return }
  processing = true
  const text = pendingToasts.shift()
  const id = ++toastId
  toastQueue.value.push({ id, text })
  setTimeout(() => {
    const idx = toastQueue.value.findIndex(t => t.id === id)
    if (idx !== -1) toastQueue.value.splice(idx, 1)
  }, 3800)
  setTimeout(() => {
    processing = false
    processToastQueue()
  }, 1500)
}

function showToast(text) {
  pendingToasts.push(text)
  processToastQueue()
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息'
  if (h < 12) return '早上好，新的一天'
  if (h < 18) return '下午好，继续加油'
  return '晚上好，今天辛苦了'
})

const greetingIcon = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '🌙'
  if (h < 12) return '☀️'
  if (h < 18) return '🌤️'
  return '🌙'
})
</script>

<template>
  <div class="app" :class="{ loaded, 'app-dark': shop.darkMode }" :style="pageBg && !shop.darkMode ? { background: pageBg } : {}">
    <header class="topbar glass">
      <div class="brand">
        <div class="logo-wrap">
          <span class="logo">🌅</span>
        </div>
        <div class="brand-text">
          <span class="name">逐光手帐</span>
          <span class="tagline">让坚持可见</span>
        </div>
      </div>
      <div class="right">
        <div class="greet">
          <span class="greet-icon">{{ greetingIcon }}</span>
          <span class="greet-text">{{ greeting }}</span>
        </div>
        <div class="coins">
          <span class="coin-icon">💰</span>
          <span class="coin-num">{{ store.coins.toLocaleString() }}</span>
        </div>
      </div>
    </header>

    <main class="main">
      <PageHome @show-toast="showToast" />
    </main>

    <TransitionGroup name="toast" tag="div" class="toasts">
      <AchievementToast v-for="t in toastQueue" :key="t.id" :text="t.text" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(160deg, #f8f6f3 0%, #f3efe9 40%, #ede8e2 100%);
  opacity: 0;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.app.loaded { opacity: 1; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 68px;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(30px) saturate(1.4);
  -webkit-backdrop-filter: blur(30px) saturate(1.4);
  border-bottom: 1px solid rgba(255,255,255,0.3);
  flex-shrink: 0;
  z-index: 10;
  position: relative;
}
.topbar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 5%;
  right: 5%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06), transparent);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.logo-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff5f5, #fff0ee);
  border-radius: 12px;
  border: 1px solid rgba(232,93,117,0.1);
}
.logo { font-size: 22px; }
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.name {
  font-size: 17px;
  font-weight: 800;
  background: linear-gradient(135deg, #e85d75, #d4a853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
  line-height: 1.2;
}
.tagline {
  font-size: 10px;
  color: var(--c-text-muted);
  font-weight: 500;
  letter-spacing: 1px;
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.greet {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(0,0,0,0.02);
}
.greet-icon { font-size: 14px; }
.greet-text {
  font-size: 12px;
  color: var(--c-text-secondary);
  font-weight: 500;
}
.coins {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #b8860b;
  background: linear-gradient(135deg, #fdf8ed, #faf0d4);
  padding: 8px 20px;
  border-radius: 24px;
  border: 1px solid rgba(212,168,83,0.15);
  box-shadow: 0 2px 12px rgba(212,168,83,0.08);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.coins:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(212,168,83,0.15);
}
.coin-icon { font-size: 16px; }
.coin-num { letter-spacing: 0.5px; }

.main { flex: 1; display: flex; flex-direction: column; }

.toasts {
  position: fixed;
  top: 84px;
  right: 32px;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}
.toast-enter-active { animation: t-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: t-out 0.3s ease forwards; }
@keyframes t-in { from { opacity: 0; transform: translateX(32px) scale(0.92); } }
@keyframes t-out { to { opacity: 0; transform: translateY(-8px) scale(0.95); } }
</style>

<!-- 深色模式 -->
<style>
.app-dark { background: linear-gradient(160deg, #13131f 0%, #1a1a2e 40%, #1e1e32 100%) !important; }
.app-dark .topbar { background: rgba(19,19,31,0.9) !important; border-bottom-color: rgba(100,100,140,0.1) !important; }
.app-dark .topbar::after { background: linear-gradient(90deg, transparent, rgba(100,100,140,0.1), transparent) !important; }
.app-dark .logo-wrap { background: linear-gradient(135deg, #2a2a40, #252538) !important; border-color: rgba(100,100,140,0.15) !important; }
.app-dark .name { background: linear-gradient(135deg, #a0a0c0, #c0b890) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; }
.app-dark .tagline { color: #666680 !important; }
.app-dark .greet { background: rgba(100,100,140,0.08) !important; }
.app-dark .greet-text { color: #8888a8 !important; }
.app-dark .coins { background: linear-gradient(135deg, #2a2a3e, #33334a) !important; color: #c8b870 !important; border-color: rgba(200,184,112,0.15) !important; box-shadow: 0 2px 12px rgba(0,0,0,0.2) !important; }
</style>
