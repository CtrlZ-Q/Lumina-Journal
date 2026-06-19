<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { themes } from '../data/themes'

const store = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['show-toast'])

const newQuote = ref('')
const showQuoteModal = ref(false)
const selectedQuote = ref('')

function submitQuote() {
  const text = newQuote.value.trim()
  if (!text) return
  store.addFavoriteQuote(text)
  newQuote.value = ''
  emit('show-toast', '⭐ 语录已收藏')
}

const currentQuote = ref(store.getDialogue())
const quoteChanging = ref(false)

function changeQuote() {
  quoteChanging.value = true
  setTimeout(() => {
    currentQuote.value = store.getDialogue()
    quoteChanging.value = false
  }, 200)
}

const dailyTheme = computed(() => themes[new Date().getDay()])
const currentTheme = computed(() => {
  const equipped = shop.activeTheme
  if (equipped) {
    return { lightBg: equipped.data.lightBg, accent: equipped.data.accent }
  }
  return dailyTheme.value
})

// 根据字数动态计算字号，布满展示区
const quoteFontSize = computed(() => {
  const len = currentQuote.value.length
  if (len <= 8) return '52px'
  if (len <= 12) return '46px'
  if (len <= 16) return '40px'
  if (len <= 20) return '36px'
  if (len <= 25) return '32px'
  if (len <= 30) return '28px'
  if (len <= 40) return '24px'
  return '20px'
})

const hiddenDialogues = [
  '你知道吗？我其实是从白垩纪来的~',
  '嘘...我藏了一颗星星给你',
  '每次你来打卡，我尾巴就会摇一下',
  '听说今天有流星雨，一起看？',
  '你是不是偷偷变厉害了？我感觉到了！',
  '如果我是人类，一定也天天打卡',
  '别走！再陪我聊五毛钱的~',
  '我觉得...你比昨天更好看了（恐龙直觉）',
]

// 语录类别选择
const quoteCategories = computed(() => {
  return shop.allQuoteCategories.map(cat => ({
    ...cat,
    owned: shop.isOwned(cat.id),
    selected: (shop.selectedQuoteCategories.length === 0 && !shop.quoteCategoriesExplicitlySet) || shop.selectedQuoteCategories.includes(cat.id),
  }))
})
</script>

<template>
  <!-- 语录展示卡片 -->
  <div class="quote-showcase" :style="{ background: currentTheme.lightBg }">
    <div class="quote-showcase-inner">
      <div class="quote-marks">"</div>
      <div class="quote-text" :class="{ changing: quoteChanging }" :style="{ fontSize: quoteFontSize }">{{ currentQuote }}</div>
      <div class="quote-marks-end">"</div>
      <div class="quote-divider" :style="{ background: currentTheme.accent }"></div>
      <div class="quote-actions">
        <button class="quote-action-btn" @click="changeQuote">
          <span class="action-icon">🔄</span>
          <span>换一条</span>
        </button>
        <button class="quote-action-btn fav" @click="store.addFavoriteQuote(currentQuote); emit('show-toast', '⭐ 语录已收藏')">
          <span class="action-icon">⭐</span>
          <span>收藏</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 语录类别选择 -->
  <div class="quote-section" v-if="quoteCategories.some(c => c.owned)">
    <div class="section-header">
      <div class="section-title">
        <span class="section-icon">📖</span>
        <span>语录偏好</span>
      </div>
      <span class="section-count">{{ shop.selectedQuoteCategories.length === 0 && !shop.quoteCategoriesExplicitlySet ? '全部' : shop.selectedQuoteCategories.length + '类' }}</span>
    </div>
    <div class="pref-hint">选择想看到的语录类别（不选则全部随机）</div>
    <div class="pref-grid">
      <button
        v-for="cat in quoteCategories.filter(c => c.owned)"
        :key="cat.id"
        class="pref-btn"
        :class="{ active: cat.selected }"
        @click="shop.toggleQuoteCategory(cat.id)"
      >
        <span class="pref-icon">{{ cat.icon }}</span>
        <span class="pref-name">{{ cat.name }}</span>
      </button>
    </div>
    <div class="pref-actions">
      <button class="pref-action-btn" @click="shop.setQuoteCategories([])">全部显示</button>
      <button class="pref-action-btn" @click="shop.setQuoteCategories(quoteCategories.filter(c => c.owned).map(c => c.id))">仅已拥有</button>
    </div>
  </div>

  <!-- 我的收藏 -->
  <div class="quote-section">
    <div class="section-header">
      <div class="section-title">
        <span class="section-icon">⭐</span>
        <span>我的收藏</span>
      </div>
      <span class="section-count">{{ store.favoriteQuotes.length }}</span>
    </div>

    <div class="quote-input-row">
      <input v-model="newQuote" class="quote-input" placeholder="输入收藏语录..." @keyup.enter="submitQuote" />
      <button class="quote-input-btn" @click="submitQuote">收藏</button>
    </div>

    <div v-if="store.favoriteQuotes.length > 0" class="quote-list">
      <div v-for="(text, i) in store.favoriteQuotes" :key="i" class="quote-card" @click="selectedQuote = text; showQuoteModal = true">
        <div class="quote-card-text">「{{ text }}」</div>
        <button class="quote-card-del" @click.stop="store.removeFavoriteQuote(i)">×</button>
      </div>
    </div>
    <div v-else class="quote-empty">
      <div class="empty-icon">📝</div>
      <div class="empty-text">收藏喜欢的语录吧~</div>
    </div>
  </div>

  <!-- 隐藏台词收集 -->
  <div class="quote-section">
    <div class="section-header">
      <div class="section-title">
        <span class="section-icon">🎭</span>
        <span>隐藏台词</span>
      </div>
      <span class="section-count">{{ store.collectedDialogues.length }}/8</span>
    </div>

    <div class="dialogue-grid">
      <div v-for="i in 8" :key="i" class="dialogue-item" :class="{ unlocked: store.collectedDialogues.includes(`dlg_${i}`) }">
        <div class="dialogue-icon">{{ store.collectedDialogues.includes(`dlg_${i}`) ? '🎭' : '❓' }}</div>
        <div class="dialogue-text">{{ store.collectedDialogues.includes(`dlg_${i}`) ? hiddenDialogues[i-1] : '未解锁' }}</div>
      </div>
    </div>
  </div>

  <!-- 语录弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showQuoteModal" class="quote-modal-mask" @click.self="showQuoteModal = false">
        <div class="quote-modal-box">
          <div class="quote-modal-marks">"</div>
          <div class="quote-modal-text">{{ selectedQuote }}</div>
          <div class="quote-modal-marks-end">"</div>
          <button class="quote-modal-close" @click="showQuoteModal = false">关闭</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 语录展示卡片 */
.quote-showcase {
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}
.quote-showcase::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(0,0,0,0.025) 0%, transparent 70%);
  pointer-events: none;
}
.quote-showcase-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 52px 48px 48px;
}
.quote-marks {
  font-size: 72px;
  line-height: 1;
  color: rgba(0,0,0,0.06);
  font-family: 'STXingkai', '华文行楷', 'XingKai', Georgia, serif;
  margin-bottom: -8px;
  user-select: none;
}
.quote-marks-end {
  font-size: 72px;
  line-height: 1;
  color: rgba(0,0,0,0.06);
  font-family: 'STXingkai', '华文行楷', 'XingKai', Georgia, serif;
  margin-top: -8px;
  user-select: none;
}
.quote-text {
  font-size: 38px;
  line-height: 1.7;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 0;
  font-weight: 400;
  font-family: 'STXingkai', '华文行楷', 'XingKai', '行楷', 'STKaiti', 'KaiTi', '楷体', 'SimSun', cursive, serif;
  letter-spacing: 3px;
  transition: opacity 0.25s;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #1a1a1a;
  text-shadow: 0 1px 0 rgba(0,0,0,0.05);
  word-break: break-all;
}
.quote-text.changing { opacity: 0; }
.quote-divider {
  width: 40px;
  height: 3px;
  border-radius: 2px;
  margin: 16px auto;
  opacity: 0.4;
}
.quote-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.quote-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.92);
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.25s, color 0.25s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.quote-action-btn:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.quote-action-btn.fav { color: #d97706; }
.action-icon { font-size: 15px; }

/* 段落区块 */
.quote-section {
  background: rgba(255,255,255,0.92);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
  padding: 20px 24px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}
.section-icon { font-size: 18px; }
.section-count {
  font-size: 13px;
  font-weight: 700;
  color: #ff6b8a;
  background: linear-gradient(135deg, #fff0f3, #fff5f0);
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,107,138,0.12);
}

/* 输入行 */
.quote-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.quote-input {
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid #eee;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
  background: #fafafa;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.quote-input:focus { border-color: var(--theme-accent, #ff6b8a); background: #fff; box-shadow: 0 0 0 4px rgba(255,107,138,0.08); }
.quote-input::placeholder { color: #ccc; }
.quote-input-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: var(--theme-gradient, linear-gradient(135deg, #ff6b8a, #ff8e53));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 12px rgba(255,107,138,0.25);
  white-space: nowrap;
}
.quote-input-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(255,107,138,0.35); }

/* 语录偏好设置 */
.pref-hint { font-size: 13px; color: #999; margin-bottom: 12px; }
.pref-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; margin-bottom: 12px; }
.pref-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  font-size: 14px;
}
.pref-btn:hover { border-color: #ccc; }
.pref-btn.active { border-color: var(--theme-accent, #667eea); background: rgba(102,126,234,0.06); }
.pref-icon { font-size: 16px; }
.pref-name { font-weight: 600; color: #333; }
.pref-btn.active .pref-name { color: var(--theme-accent, #667eea); }
.pref-actions { display: flex; gap: 8px; }
.pref-action-btn {
  padding: 6px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.pref-action-btn:hover { background: #f0f0f0; border-color: #ddd; }

/* 语录卡片列表 */
.quote-list { display: flex; flex-direction: column; gap: 8px; }
.quote-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #f8f8f8;
  border-radius: 12px;
  transition: background 0.25s;
}
.quote-card:hover { background: #f0f0f0; }
.quote-card-text {
  flex: 1;
  font-size: 20px;
  color: #444;
  font-family: 'STXingkai', '华文行楷', 'XingKai', '行楷', 'STKaiti', 'KaiTi', '楷体', 'SimSun', cursive, serif;
  line-height: 1.7;
  word-break: break-all;
  letter-spacing: 2px;
}
.quote-card-del {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: none;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
  flex-shrink: 0;
}
.quote-card-del:hover { background: #fee2e2; color: #ef4444; }

.quote-empty {
  text-align: center;
  padding: 24px 0;
}
.empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #ccc; }

/* 隐藏台词网格 */
.dialogue-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.dialogue-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8f8f8;
  transition: background 0.3s, border-color 0.3s;
}
.dialogue-item.unlocked {
  background: linear-gradient(135deg, #fdf2f8, #fff7ed);
  box-shadow: 0 2px 8px rgba(255,107,138,0.06);
}
.dialogue-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.dialogue-text {
  font-size: 13px;
  color: #ccc;
  line-height: 1.5;
}
.dialogue-item.unlocked .dialogue-text { color: #444; font-style: italic; }

/* 语录弹窗 */
.quote-modal-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
}
.quote-modal-box {
  background: #fff; border-radius: 24px;
  padding: 48px 44px 36px; max-width: 420px; width: 90%;
  text-align: center; box-shadow: 0 32px 80px rgba(0,0,0,0.2);
}
.quote-modal-marks {
  font-size: 64px; line-height: 1; color: rgba(0,0,0,0.08);
  font-family: 'STXingkai', '华文行楷', 'XingKai', Georgia, serif;
  user-select: none; margin-bottom: -8px;
}
.quote-modal-marks-end {
  font-size: 64px; line-height: 1; color: rgba(0,0,0,0.08);
  font-family: 'STXingkai', '华文行楷', 'XingKai', Georgia, serif;
  user-select: none; margin-top: -8px;
}
.quote-modal-text {
  font-size: 24px; line-height: 1.8; color: #1a1a1a;
  font-family: 'STXingkai', '华文行楷', 'XingKai', '行楷', 'STKaiti', 'KaiTi', '楷体', 'SimSun', cursive, serif;
  letter-spacing: 2px; padding: 12px 0;
  word-break: break-all;
}
.quote-modal-close {
  margin-top: 24px; padding: 12px 40px;
  border: none; border-radius: 14px;
  background: linear-gradient(135deg, #e85d75, #d4a853);
  color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; box-shadow: 0 4px 20px rgba(232,93,117,0.25);
  transition: transform 0.3s, box-shadow 0.3s;
}
.quote-modal-close:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,93,117,0.35); }

.modal-enter-active { animation: qm-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { animation: qm-in 0.25s ease reverse; }
@keyframes qm-in { from { opacity: 0; transform: scale(0.9) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>
