<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import WeeklyReport from '../components/WeeklyReport.vue'

const store = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['show-toast'])

const showWeeklyReport = ref(false)
const showReset = ref(false)
const resetStep = ref(0)

function startReset() { showReset.value = true; resetStep.value = 1 }
function nextResetStep() { resetStep.value++ }
function cancelReset() { showReset.value = false; resetStep.value = 0 }
function confirmReset() {
  store.resetState()
  shop.resetShop()
  showReset.value = false
  resetStep.value = 0
  emit('show-toast', '🔄 所有数据已重置')
}

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    game: localStorage.getItem('dino-app-data'),
    shop: localStorage.getItem('dino-app-shop'),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date()
  const ds = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
  a.href = url
  a.download = `逐光手帐_备份_${ds}.json`
  a.click()
  URL.revokeObjectURL(url)
  emit('show-toast', '📦 数据已导出')
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.game && !data.shop) {
          emit('show-toast', '❌ 无效的备份文件')
          return
        }
        // 验证内容是合法 JSON 字符串
        if (data.game) { JSON.parse(data.game); localStorage.setItem('dino-app-data', data.game) }
        if (data.shop) { JSON.parse(data.shop); localStorage.setItem('dino-app-shop', data.shop) }
        emit('show-toast', '✅ 数据已恢复，正在刷新...')
        setTimeout(() => location.reload(), 800)
      } catch {
        emit('show-toast', '❌ 文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}
</script>

<template>
  <div class="card">
    <div class="card-header"><span>⚙️ 设置</span></div>
    <div class="setting-list">
      <button class="setting-row" @click="shop.toggleDarkMode()">
        <span class="setting-icon">{{ shop.darkMode ? '☀️' : '🌙' }}</span>
        <span class="setting-label">{{ shop.darkMode ? '浅色模式' : '深色模式' }}</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row" @click="showWeeklyReport = true">
        <span class="setting-icon">📊</span>
        <span class="setting-label">查看周报</span>
        <span class="setting-arrow">›</span>
      </button>
      <div class="setting-row static">
        <span class="setting-icon">💰</span>
        <span class="setting-label">当前余额</span>
        <span class="setting-val">{{ store.coins }} 币</span>
      </div>
      <button class="setting-row" @click="exportData">
        <span class="setting-icon">📦</span>
        <span class="setting-label">备份数据</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row" @click="importData">
        <span class="setting-icon">📥</span>
        <span class="setting-label">恢复数据</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row danger" @click="startReset">
        <span class="setting-icon">🔄</span>
        <span class="setting-label">重置所有数据</span>
        <span class="setting-arrow">›</span>
      </button>
    </div>
  </div>

  <WeeklyReport v-if="showWeeklyReport" @close="showWeeklyReport = false" />

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showReset" class="modal-mask" @click="cancelReset">
        <div class="modal-box reset-modal" @click.stop>
          <template v-if="resetStep === 1">
            <div class="reset-emoji">⚠️</div>
            <div class="reset-h">确定要重置数据吗？</div>
            <div class="reset-p">你的所有打卡记录将被清除</div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消</button><button class="btn-next" @click="nextResetStep">下一步</button></div>
          </template>
          <template v-else-if="resetStep === 2">
            <div class="reset-emoji">🚨</div>
            <div class="reset-h">所有数据都将被清除！</div>
            <div class="reset-p">打卡记录、金币、成就，全部归零<br>此操作<b>不可恢复</b></div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消</button><button class="btn-next warn" @click="nextResetStep">我确定要清除</button></div>
          </template>
          <template v-else-if="resetStep === 3">
            <div class="reset-emoji">💀</div>
            <div class="reset-h">最后确认</div>
            <div class="reset-p">一旦重置，所有努力将化为乌有<br>你确定吗？</div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消，我后悔了</button><button class="btn-next danger" @click="confirmReset">永久删除</button></div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.card {
  background: rgba(255,255,255,0.92);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.setting-list { padding: 6px 0; }
.setting-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  border: none;
  width: 100%;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  transition: background 0.25s;
}
.setting-row:last-child { border-bottom: none; }
.setting-row:hover { background: rgba(0,0,0,0.02); }
.setting-row.static { cursor: default; }
.setting-icon { font-size: 24px; }
.setting-label { flex: 1; font-size: 15px; font-weight: 600; color: #1a1a1a; }
.setting-val { font-size: 14px; color: #aaa; font-weight: 500; }
.setting-arrow { font-size: 20px; color: #ccc; transition: transform 0.2s; }
.setting-row:hover .setting-arrow { transform: translateX(3px); }
.setting-row.danger .setting-label { color: #ef4444; }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #fff; border-radius: 28px; text-align: center; box-shadow: 0 32px 64px rgba(0,0,0,0.15); }
.modal-enter-active { animation: m-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { animation: m-in 0.25s ease reverse; }
@keyframes m-in { from { opacity: 0; transform: scale(0.9) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.reset-modal { padding: 44px 48px; min-width: 360px; max-width: 420px; }
.reset-emoji { font-size: 56px; margin-bottom: 18px; }
.reset-h { font-size: 20px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; }
.reset-p { font-size: 14px; color: #888; line-height: 1.8; margin-bottom: 28px; }
.reset-btns { display: flex; gap: 14px; justify-content: center; }
.btn-cancel {
  padding: 12px 28px;
  border: 1.5px solid #e5e5e5;
  border-radius: 14px;
  background: #fff;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-cancel:hover { background: #f9f9f9; border-color: #ddd; }
.btn-next {
  padding: 12px 28px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff6b8a, #ff8e53);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(255,107,138,0.3);
}
.btn-next:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,107,138,0.4); }
.btn-next.warn { background: linear-gradient(135deg, #f97316, #fb923c); box-shadow: 0 4px 16px rgba(249,115,22,0.3); }
.btn-next.danger { background: linear-gradient(135deg, #dc2626, #ef4444); box-shadow: 0 4px 16px rgba(239,68,68,0.3); animation: pulse-red 1.5s ease-in-out infinite; }
@keyframes pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3), 0 4px 16px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 4px 16px rgba(239,68,68,0.3); } }
</style>
