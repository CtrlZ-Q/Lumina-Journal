<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { moodOptions, getMoodByKey } from '../data/seasonalEvents'
import MonthlyHistory from '../components/MonthlyHistory.vue'

const store = useGameStore()
const shop = useShopStore()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const todayDate = now.getDate()
const todayYear = now.getFullYear()
const todayMonth = now.getMonth()

const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const firstDayOffset = computed(() => (new Date(year.value, month.value, 1).getDay() + 6) % 7)

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
}
function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
  // 不超过当前月
  if (year.value > todayYear || (year.value === todayYear && month.value > todayMonth)) {
    month.value = todayMonth
    year.value = todayYear
  }
}
function goToday() {
  year.value = todayYear
  month.value = todayMonth
}
const isCurrentMonth = computed(() => year.value === todayYear && month.value === todayMonth)

// 时光邮箱
const showWriteModal = ref(false)
const letterTitle = ref('')
const letterText = ref('')
const letterDate = ref('')
const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})
const showLetterModal = ref(false)
const selectedLetter = ref(null)

function submitLetter() {
  const title = letterTitle.value.trim()
  const text = letterText.value.trim()
  if (!title || !text || !letterDate.value) return
  store.addTimeLetter(title, text, letterDate.value)
  letterTitle.value = ''
  letterText.value = ''
  letterDate.value = ''
  showWriteModal.value = false
}

function openLetter(letter) {
  if (letter.openDate > today()) return
  store.openTimeLetter(letter.id)
  selectedLetter.value = letter
  showLetterModal.value = true
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0,0,0,0)
  return Math.ceil((target - today) / 86400000)
}

function dateStr(day) {
  return `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const monthPrefix = computed(() => `${year.value}-${String(month.value + 1).padStart(2, '0')}`)
const monthCheckins = computed(() => store.checkins.filter(d => d.startsWith(monthPrefix.value)).length)

// 本月心情统计
const moodStats = computed(() => store.getMoodStats(year.value, month.value))
const totalMoodEntries = computed(() => Object.values(moodStats.value).reduce((a, b) => a + b, 0))

const calStyle = computed(() => {
  const equipped = shop.equippedItems.calendar
  if (!equipped) return 'classic'
  const item = shop.getItem(equipped)
  return item?.data?.style || 'classic'
})

const styleMap = {
  classic: {
    pageBg: 'linear-gradient(135deg, #e5ded4 0%, #e0d9ce 50%, #e5e0d8 100%)',
    cardBg: 'rgba(235,228,218,0.9)',
    headerBg: 'linear-gradient(135deg, #d4a0b4, #c8b0a0)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #d4a0b4, #c8b0a0, #c8c0a0)',
    checkedColor: '#fff',
    todayColor: '#d4a0b4',
    todayBg: '#faf4f6',
    titleColor: '#4a4044',
    subtitleColor: '#a09898',
    weekColor: '#b8b0b4',
    cellBg: 'rgba(250,244,246,0.5)',
    legendBorder: 'rgba(212,160,180,0.1)',
    tagBg: 'linear-gradient(135deg, #d4a0b4, #c8b0a0)',
    tagColor: '#fff',
  },
  autumn: {
    pageBg: 'linear-gradient(135deg, #faf6ee 0%, #f8f2e4 50%, #f5ecd8 100%)',
    cardBg: 'rgba(255,251,240,0.9)',
    headerBg: 'linear-gradient(135deg, #c8a870, #b89860)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #c8a870, #b89860)',
    checkedColor: '#fff',
    todayColor: '#b89860',
    todayBg: '#faf6ee',
    titleColor: '#6a5840',
    subtitleColor: '#8a7860',
    weekColor: '#a89870',
    cellBg: 'rgba(250,246,238,0.6)',
    legendBorder: 'rgba(184,152,96,0.15)',
    tagBg: 'linear-gradient(135deg, #c8a870, #b89860)',
    tagColor: '#fff',
  },
  winter: {
    pageBg: 'linear-gradient(135deg, #f0f4fa 0%, #e8f0f8 50%, #dde8f4 100%)',
    cardBg: 'rgba(240,246,252,0.9)',
    headerBg: 'linear-gradient(135deg, #7ab4d4, #88a0c0)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #7ab4d4, #88a0c0)',
    checkedColor: '#fff',
    todayColor: '#7ab4d4',
    todayBg: '#f0f4fa',
    titleColor: '#405868',
    subtitleColor: '#607888',
    weekColor: '#88a8c0',
    cellBg: 'rgba(224,236,248,0.6)',
    legendBorder: 'rgba(122,180,212,0.15)',
    tagBg: 'linear-gradient(135deg, #7ab4d4, #88a0c0)',
    tagColor: '#fff',
  },
  spring: {
    pageBg: 'linear-gradient(135deg, #faf0f4 0%, #f8eef2 50%, #f5eaf0 100%)',
    cardBg: 'rgba(252,244,248,0.9)',
    headerBg: 'linear-gradient(135deg, #d4a0b8, #c8a0b0)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #d4a0b8, #c8a0b0)',
    checkedColor: '#fff',
    todayColor: '#d4a0b8',
    todayBg: '#faf0f4',
    titleColor: '#684058',
    subtitleColor: '#886078',
    weekColor: '#b8a0b0',
    cellBg: 'rgba(250,240,244,0.6)',
    legendBorder: 'rgba(212,160,184,0.15)',
    tagBg: 'linear-gradient(135deg, #d4a0b8, #c8a0b0)',
    tagColor: '#fff',
  },
  starry: {
    pageBg: 'linear-gradient(135deg, #1a1630 0%, #221e3e 50%, #2a2648 100%)',
    cardBg: 'rgba(34,30,62,0.95)',
    headerBg: 'linear-gradient(135deg, #5a4880, #6a58a0)',
    headerColor: '#d0d0e0',
    checkedBg: 'linear-gradient(135deg, #6a58a0, #7a68b0)',
    checkedColor: '#e0e0f0',
    todayColor: '#8a78b0',
    todayBg: '#2a2648',
    titleColor: '#d0d0e0',
    subtitleColor: '#9090b0',
    weekColor: '#7a78a0',
    cellBg: 'rgba(42,38,72,0.6)',
    legendBorder: 'rgba(106,88,160,0.3)',
    tagBg: 'linear-gradient(135deg, #5a4880, #6a58a0)',
    tagColor: '#e0e0f0',
  },
  summer: {
    pageBg: 'linear-gradient(135deg, #faf8ee 0%, #f6f2e0 50%, #f0eeda 100%)',
    cardBg: 'rgba(252,250,238,0.9)',
    headerBg: 'linear-gradient(135deg, #c8a870, #7ab89a)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #c8a870, #7ab89a)',
    checkedColor: '#fff',
    todayColor: '#7ab89a',
    todayBg: '#f0faf4',
    titleColor: '#506040',
    subtitleColor: '#607850',
    weekColor: '#88a870',
    cellBg: 'rgba(250,248,238,0.6)',
    legendBorder: 'rgba(122,184,154,0.15)',
    tagBg: 'linear-gradient(135deg, #c8a870, #7ab89a)',
    tagColor: '#fff',
  },
  rain: {
    pageBg: 'linear-gradient(135deg, #eceef2 0%, #e4e6ec 50%, #dcdfe6 100%)',
    cardBg: 'rgba(244,246,250,0.9)',
    headerBg: 'linear-gradient(135deg, #8890a0, #7880a0)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #8890a0, #7880a0)',
    checkedColor: '#fff',
    todayColor: '#7880a0',
    todayBg: '#eceef2',
    titleColor: '#404858',
    subtitleColor: '#606878',
    weekColor: '#8890a0',
    cellBg: 'rgba(226,230,238,0.6)',
    legendBorder: 'rgba(120,128,160,0.15)',
    tagBg: 'linear-gradient(135deg, #8890a0, #7880a0)',
    tagColor: '#fff',
  },
  retro: {
    pageBg: 'linear-gradient(135deg, #f8f2e8 0%, #f4ece0 50%, #f0e8d8 100%)',
    cardBg: 'rgba(252,248,240,0.9)',
    headerBg: 'linear-gradient(135deg, #a09080, #908070)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #a09080, #908070)',
    checkedColor: '#fff',
    todayColor: '#a09080',
    todayBg: '#f8f2e8',
    titleColor: '#605040',
    subtitleColor: '#807060',
    weekColor: '#a09080',
    cellBg: 'rgba(248,242,232,0.6)',
    legendBorder: 'rgba(160,144,128,0.15)',
    tagBg: 'linear-gradient(135deg, #a09080, #908070)',
    tagColor: '#fff',
  },
}

const currentStyle = computed(() => styleMap[calStyle.value] || styleMap.classic)

// 为深色主题的打卡格子添加发光效果
const isDark = computed(() => calStyle.value === 'starry' || shop.darkMode)
</script>

<template>
  <div class="cal-page" :class="{ 'cal-dark': shop.darkMode }">
    <!-- 日历标题栏 -->
    <div class="cal-top-bar" :style="{ background: shop.darkMode ? 'linear-gradient(135deg, #3a3a50, #4a4a60)' : currentStyle.headerBg }">
      <div class="cal-top-content">
        <div class="cal-top-left">
          <span class="cal-top-icon">📅</span>
          <div>
            <div class="cal-top-title" :style="{ color: shop.darkMode ? '#d0d0e0' : currentStyle.headerColor }">打卡日历</div>
            <div class="cal-nav-row">
              <button class="cal-nav-btn" @click="prevMonth">‹</button>
              <span class="cal-top-date" :style="{ color: shop.darkMode ? '#b0b0c8' : currentStyle.headerColor, opacity: 0.8 }">{{ year }}年{{ month + 1 }}月</span>
              <button class="cal-nav-btn" @click="nextMonth">›</button>
              <button v-if="!isCurrentMonth" class="cal-today-btn" @click="goToday" :style="{ color: currentStyle.headerColor }">今天</button>
            </div>
          </div>
        </div>
        <div class="cal-top-right">
          <div class="cal-top-streak" :style="{ color: currentStyle.headerColor }">
            <span class="cal-streak-num">{{ store.streakDays }}</span>
            <span class="cal-streak-label">天连续</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 日历卡片 -->
    <div class="cal-card" :style="{ background: currentStyle.cardBg }">
      <div class="cal-main">
      <div class="cal-left">
      <div class="cal-grid">
        <div v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="cal-wk" :style="{ color: currentStyle.weekColor }">{{ d }}</div>
        <div v-for="n in firstDayOffset" :key="'pad'+n" class="cal-cell pad"></div>
        <div v-for="day in daysInMonth" :key="day" class="cal-cell" :class="{ checked: store.checkins.includes(dateStr(day)), today: isCurrentMonth && day === todayDate, dark: isDark, 'has-mood': store.getDayMood(dateStr(day)) }" :style="{
          background: store.checkins.includes(dateStr(day)) ? currentStyle.checkedBg : (isCurrentMonth && day === todayDate ? currentStyle.todayBg : currentStyle.cellBg),
          color: store.checkins.includes(dateStr(day)) ? currentStyle.checkedColor : (isCurrentMonth && day === todayDate ? currentStyle.todayColor : (isDark ? '#a5b4fc' : '#999')),
          '--today-clr': day === todayDate ? currentStyle.todayColor : '#ff6b8a',
          '--mood-clr': store.getDayMood(dateStr(day)) ? (getMoodByKey(store.getDayMood(dateStr(day)))?.color || '#ccc') : 'transparent',
          boxShadow: store.checkins.includes(dateStr(day)) ? `0 6px 24px ${currentStyle.todayColor}55` : 'none'
        }">
          {{ day }}
          <span v-if="store.getDayMood(dateStr(day))" class="cell-mood">{{ getMoodByKey(store.getDayMood(dateStr(day)))?.icon }}</span>
        </div>
      </div>

      <!-- 图例 -->
      <div class="cal-legend" :style="{ borderTopColor: currentStyle.legendBorder }">
        <span class="legend-item"><span class="legend-dot" :style="{ background: currentStyle.checkedBg }"></span> 已打卡</span>
        <span class="legend-item"><span class="legend-dot today" :style="{ boxShadow: `inset 0 0 0 2.5px ${currentStyle.todayColor}` }"></span> 今天</span>
        <span class="legend-item"><span class="legend-dot" :style="{ background: 'linear-gradient(135deg, #22c55e, #3b82f6, #ef4444)' }"></span> 心情</span>
      </div>

      <!-- 月度统计 -->
      <div class="cal-stats" :style="{ borderTopColor: currentStyle.legendBorder }">
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: currentStyle.todayColor }">{{ monthCheckins }}</div>
          <div class="cal-stat-lbl">本月打卡</div>
        </div>
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: currentStyle.todayColor }">{{ store.streakDays }}</div>
          <div class="cal-stat-lbl">连续天数</div>
        </div>
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: currentStyle.todayColor }">{{ Math.round(monthCheckins / (isCurrentMonth ? todayDate : daysInMonth) * 100) }}%</div>
          <div class="cal-stat-lbl">出勤率</div>
        </div>
      </div>

      <!-- 月度心情统计 -->
      <div v-if="totalMoodEntries > 0" class="mood-stats" :style="{ borderTopColor: currentStyle.legendBorder }">
        <div class="mood-stats-title">📊 本月心情</div>
        <div class="mood-stats-bar">
          <template v-for="m in moodOptions" :key="m.key">
            <div v-if="moodStats[m.key] > 0" class="mood-bar-seg" :style="{ width: (moodStats[m.key] / totalMoodEntries * 100) + '%', background: m.color }" :title="`${m.label}: ${moodStats[m.key]}次`"></div>
          </template>
        </div>
        <div class="mood-stats-list">
          <template v-for="m in moodOptions" :key="m.key + '-num'">
            <span v-if="moodStats[m.key] > 0" class="mood-stat-item">
              {{ m.icon }} {{ moodStats[m.key] }}
            </span>
          </template>
        </div>
      </div>
      </div>

      <!-- 时光邮箱 -->
      <div class="mailbox">
        <div class="mailbox-header">
          <span class="mailbox-icon">📮</span>
          <span class="mailbox-title">时光邮箱</span>
        </div>
        <div class="mailbox-desc">写一封信给未来的自己</div>
        <button class="mailbox-write-btn" @click="showWriteModal = true">
          <span>✉️</span> 写信
        </button>
        <div class="mailbox-list">
          <div v-if="store.timeLetters.length === 0" class="mailbox-empty">
            <div class="empty-envelope">📭</div>
            <div>还没有信件~</div>
          </div>
          <div v-for="letter in store.pendingLetters" :key="letter.id" class="mail-letter-card pending">
            <div class="letter-stamp">⏳</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">{{ daysUntil(letter.openDate) }}天后可拆</div>
            </div>
            <div class="letter-seal">🔒</div>
          </div>
          <div v-for="letter in store.openableLetters" :key="letter.id" class="mail-letter-card openable" @click="openLetter(letter)">
            <div class="letter-stamp pulse">💌</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">点击拆信</div>
            </div>
            <div class="letter-seal glow">拆</div>
          </div>
          <div v-for="letter in store.openedLetters" :key="letter.id" class="mail-letter-card opened" @click="selectedLetter = letter; showLetterModal = true">
            <div class="letter-stamp read">📭</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">{{ letter.openDate }} 已拆</div>
            </div>
            <button class="letter-del" @click.stop="store.removeTimeLetter(letter.id)">×</button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 月度历史 -->
    <div class="cal-history-section" :style="{ background: currentStyle.cardBg }">
      <MonthlyHistory />
    </div>

    <!-- 装备标签 -->
    <div class="cal-equipped-tag" :style="{ background: currentStyle.tagBg, color: currentStyle.tagColor }" v-if="shop.equippedItems.calendar">
      {{ shop.getItem(shop.equippedItems.calendar)?.icon }} {{ shop.getItem(shop.equippedItems.calendar)?.name }} 主题
    </div>

    <!-- 写信弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWriteModal" class="mail-modal-mask" @click.self="showWriteModal = false">
          <div class="envelope write-envelope">
            <div class="envelope-flap"></div>
            <div class="envelope-body">
              <div class="letter-sheet write-sheet">
                <div class="sheet-deco">✐</div>
                <div class="sheet-title-row">
                  <span class="sheet-emoji">✉️</span>
                  <span class="sheet-title">写给未来的自己</span>
                </div>
                <input v-model="letterTitle" class="sheet-input title-input" placeholder="给这封信起个标题..." maxlength="20" />
                <div class="sheet-divider"></div>
                <div class="sheet-lines">
                  <textarea v-model="letterText" class="sheet-textarea" placeholder="亲爱的未来的我，&#10;&#10;当你看到这封信的时候..." maxlength="1500"></textarea>
                </div>
                <div class="sheet-bottom">
                  <div class="sheet-char">{{ letterText.length }} / 1500</div>
                  <div class="sheet-date-row">
                    <span>📅</span>
                    <input type="date" v-model="letterDate" :min="minDate" class="sheet-date" />
                    <span class="sheet-date-hint">拆信日期</span>
                  </div>
                </div>
                <div class="sheet-actions">
                  <button class="sheet-btn cancel" @click="showWriteModal = false">算了</button>
                  <button class="sheet-btn send" @click="submitLetter" :disabled="!letterTitle.trim() || !letterText.trim() || !letterDate">
                    <span>封好投递</span> <span class="send-icon">✈️</span>
                  </button>
                </div>
              </div>
              <div class="envelope-stamp">📮</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 拆信弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLetterModal && selectedLetter" class="mail-modal-mask" @click.self="showLetterModal = false">
          <div class="envelope read-envelope">
            <div class="envelope-flap open"></div>
            <div class="envelope-body">
              <div class="letter-sheet read-sheet">
                <div class="read-seal">💌</div>
                <div class="read-title">{{ selectedLetter.title || '无题' }}</div>
                <div class="read-from">来自 {{ selectedLetter.createdAt }} 的自己</div>
                <div class="sheet-divider"></div>
                <div class="sheet-lines">
                  <div class="read-content">{{ selectedLetter.text }}</div>
                </div>
                <div class="read-sign">
                  <div class="sign-line"></div>
                  <div class="sign-info">
                    <span>写于 {{ selectedLetter.createdAt }}</span>
                    <span class="sign-dot">✦</span>
                    <span>{{ selectedLetter.openDate }} 拆开</span>
                  </div>
                </div>
                <button class="sheet-btn close" @click="showLetterModal = false">收好信件 💌</button>
              </div>
              <div class="envelope-stamp">📬</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.cal-page {
  min-height: 100%;
  position: relative;
}

/* 顶部标题栏 */
.cal-top-bar {
  padding: 24px 28px 20px;
  border-radius: 20px 20px 0 0;
}
.cal-top-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cal-top-left { display: flex; align-items: center; gap: 14px; }
.cal-top-icon { font-size: 32px; }
.cal-top-title { font-size: 20px; font-weight: 800; }
.cal-nav-row { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.cal-nav-btn {
  width: 24px; height: 24px; border: none; border-radius: 6px;
  background: rgba(255,255,255,0.2); color: inherit; font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.cal-nav-btn:hover { background: rgba(255,255,255,0.35); }
.cal-top-date { font-size: 14px; font-weight: 500; min-width: 80px; text-align: center; }
.cal-today-btn {
  border: none; border-radius: 8px; padding: 2px 10px;
  background: rgba(255,255,255,0.2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.cal-today-btn:hover { background: rgba(255,255,255,0.35); }
.cal-top-right { text-align: right; }
.cal-top-streak { text-align: center; }
.cal-streak-num { font-size: 32px; font-weight: 900; display: block; line-height: 1; }
.cal-streak-label { font-size: 13px; opacity: 0.8; font-weight: 600; }

/* 日历卡片 */
.cal-card {
  padding: 28px 32px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  max-width: 520px;
}
.cal-wk {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 0;
  letter-spacing: 1px;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: default;
}
.cal-cell.checked {
  font-weight: 800;
  font-size: 16px;
  animation: cal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cal-cell.checked::after {
  content: '✓';
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 10px;
  font-weight: 800;
  color: rgba(255,255,255,0.9);
}
.cal-cell.pad { background: none; box-shadow: none; pointer-events: none; }
.cal-cell.today:not(.checked) {
  font-weight: 800;
  box-shadow: inset 0 0 0 3px var(--today-clr, #ff6b8a), 0 0 16px rgba(255,107,138,0.12);
  animation: today-pulse 2.5s ease-in-out infinite;
}
@keyframes cal-pop {
  0% { transform: scale(0.7); opacity: 0; }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes today-pulse {
  0%, 100% { box-shadow: inset 0 0 0 3px var(--today-clr, #ff6b8a), 0 0 8px rgba(255,107,138,0.08); }
  50% { box-shadow: inset 0 0 0 3px var(--today-clr, #ff6b8a), 0 0 20px rgba(255,107,138,0.2); }
}

/* 图例 */
.cal-legend {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; font-weight: 500; }
.legend-dot { width: 14px; height: 14px; border-radius: 5px; }
.legend-dot.today { background: #fff; }

/* 月度统计 */
.cal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
  text-align: center;
}
.cal-stat-val { font-size: 24px; font-weight: 900; }
.cal-stat-lbl { font-size: 13px; color: #888; margin-top: 4px; }

/* 心情指示器（日历格子内） */
.cal-cell.has-mood { position: relative; }
.cal-cell.has-mood::before {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  border-radius: 2px;
  background: var(--mood-clr, #ccc);
}
.cell-mood {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  line-height: 1;
}

/* 月度心情统计 */
.mood-stats {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.mood-stats-title { font-size: 14px; font-weight: 700; color: #666; margin-bottom: 12px; }
.mood-stats-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: #f5f5f5;
  gap: 2px;
}
.mood-bar-seg { border-radius: 4px; transition: width 0.5s; min-width: 6px; }
.mood-stats-list {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.mood-stat-item { font-size: 14px; color: #666; font-weight: 600; }

/* 装备标签 */
.cal-equipped-tag {
  display: inline-block;
  margin: 16px 32px 0;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
}

/* ===== 日历+邮箱左右布局 ===== */
.cal-main {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}
.cal-left {
  flex: 1;
  min-width: 0;
}

/* ===== 时光邮箱 ===== */
.mailbox {
  flex: 1;
  min-width: 200px;
  background: linear-gradient(135deg, #fdf6ee, #fef9f3);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid rgba(210,170,120,0.15);
}
.mailbox-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.mailbox-icon { font-size: 24px; }
.mailbox-title { font-size: 16px; font-weight: 800; color: #6a5040; }
.mailbox-desc { font-size: 13px; color: #a08870; margin-bottom: 14px; }
.mailbox-write-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #e8a860, #d4944a);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(232,168,96,0.3);
  margin-bottom: 14px;
}
.mailbox-write-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(232,168,96,0.4); }
.mailbox-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
.mailbox-empty { text-align: center; font-size: 13px; color: #a08868; padding: 24px 0; }
.empty-envelope { font-size: 36px; margin-bottom: 8px; opacity: 0.4; }

/* 信件卡片 */
.mail-letter-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fdf6e8;
  border: 1.5px solid rgba(200,170,120,0.25);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  /* 横线信纸效果 */
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 22px,
    rgba(200,170,120,0.1) 22px,
    rgba(200,170,120,0.1) 23px
  );
}
/* 右上角折角 */
.mail-letter-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(225deg, #f0e8d4 50%, rgba(200,170,120,0.15) 50%);
  pointer-events: none;
}
.letter-stamp {
  width: 42px; height: 48px;
  border-radius: 4px;
  background: #fff;
  border: 2px solid rgba(200,170,120,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 1px 1px 4px rgba(0,0,0,0.06);
  /* 邮票锯齿边 */
  outline: 2px dashed rgba(200,170,120,0.15);
  outline-offset: 2px;
}
.letter-stamp.pulse { animation: stamp-pulse 1.5s ease-in-out infinite; }
@keyframes stamp-pulse {
  0%, 100% { transform: scale(1) rotate(-2deg); }
  50% { transform: scale(1.08) rotate(2deg); }
}
.letter-stamp.read { opacity: 0.4; filter: grayscale(0.5); }
.letter-body { flex: 1; min-width: 0; }
.letter-title {
  font-size: 14px; font-weight: 700; color: #3a2818;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.letter-meta { font-size: 11px; color: #a08870; margin-top: 3px; }
.letter-seal {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4a868, #c09050);
  color: #fff;
  font-size: 12px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(200,144,80,0.4), inset 0 1px 2px rgba(255,255,255,0.3);
  border: 2px solid rgba(180,130,60,0.3);
}
.letter-seal.glow {
  background: linear-gradient(135deg, #e8a860, #d4944a);
  animation: seal-glow 1.2s ease-in-out infinite;
  font-size: 13px;
}
@keyframes seal-glow {
  0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(232,168,96,0.4), inset 0 1px 2px rgba(255,255,255,0.3); }
  50% { transform: scale(1.1); box-shadow: 0 4px 20px rgba(232,168,96,0.6), inset 0 1px 2px rgba(255,255,255,0.3); }
}

.mail-letter-card.pending {
  background-color: #f8f0e0;
  opacity: 0.75;
}
.mail-letter-card.openable {
  cursor: pointer;
  background-color: #fef8ee;
  border-color: rgba(232,168,96,0.35);
  animation: letter-glow 2s ease-in-out infinite;
}
@keyframes letter-glow {
  0%, 100% { box-shadow: 0 2px 10px rgba(232,168,96,0.1); }
  50% { box-shadow: 0 6px 24px rgba(232,168,96,0.3); }
}
.mail-letter-card.openable:hover { transform: translateY(-2px) rotate(-0.5deg); box-shadow: 0 8px 28px rgba(232,168,96,0.35); }
.mail-letter-card.openable .letter-meta { color: #e65100; font-weight: 700; }
.mail-letter-card.opened {
  cursor: pointer;
  background-color: #f0ece4;
  border-color: rgba(180,160,130,0.2);
}
.mail-letter-card.opened:hover { transform: translateY(-1px); }
.mail-letter-card.opened .letter-seal { display: none; }

.letter-del {
  position: absolute;
  top: 10px; right: 32px;
  width: 22px; height: 22px;
  border: none; border-radius: 50%;
  background: rgba(0,0,0,0.06); color: #888;
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.letter-del:hover { background: #fee2e2; color: #ef4444; }

/* ===== 信封弹窗 ===== */
.mail-modal-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.envelope {
  position: relative;
  max-width: 560px; width: 100%;
  animation: mail-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes mail-in { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* 信封翻盖 */
.envelope-flap {
  height: 60px;
  background: linear-gradient(135deg, #d4a868, #c09050);
  border-radius: 16px 16px 0 0;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.envelope-flap::after {
  content: '';
  position: absolute;
  bottom: -30px; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-top: 30px solid #d4a868;
}
.envelope-flap.open {
  background: linear-gradient(135deg, #b88848, #a07838);
}
.envelope-flap.open::after { border-top-color: #b88848; }

/* 信封主体 */
.envelope-body {
  background: linear-gradient(180deg, #e8d4b8, #dcc8a8);
  border-radius: 0 0 16px 16px;
  padding: 36px 24px 24px;
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1);
}
/* 信封邮戳 */
.envelope-stamp {
  position: absolute;
  top: 12px; right: 20px;
  font-size: 32px;
  opacity: 0.3;
  transform: rotate(-12deg);
}

/* 信纸 */
.letter-sheet {
  background: #fffef8;
  border-radius: 8px;
  padding: 32px 36px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06), inset 0 0 40px rgba(200,180,140,0.08);
  /* 横线 */
  background-image: repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(180,160,130,0.1) 35px, rgba(180,160,130,0.1) 36px);
  background-size: 100% 36px;
  background-position: 0 0;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}
/* 左侧装饰线 - 淡化 */
.letter-sheet::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 44px;
  width: 1px;
  background: rgba(220,80,80,0.06);
  pointer-events: none;
}
/* 右上角装饰 */
.sheet-deco {
  position: absolute;
  top: 12px; right: 16px;
  font-size: 64px;
  color: rgba(200,180,140,0.07);
  font-family: 'STXingkai', cursive;
  pointer-events: none;
  transform: rotate(-8deg);
}

.sheet-title-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px;
}
.sheet-emoji { font-size: 26px; }
.sheet-title {
  font-size: 20px; font-weight: 800; color: #2a1a0a;
  letter-spacing: 2px;
}
.sheet-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  outline: none;
  box-sizing: border-box;
  font-size: 16px;
  color: #2a1a0a;
  letter-spacing: 1px;
  font-weight: 600;
}
.sheet-input.title-input {
  font-weight: 700;
  border-bottom: 1.5px dashed rgba(180,150,120,0.25);
  padding-bottom: 10px;
  margin-bottom: 4px;
}
.sheet-input::placeholder { color: #c8b8a0; font-weight: 400; }
.sheet-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180,150,120,0.15), transparent);
  margin: 8px 0;
}
.sheet-lines { flex: 1; position: relative; }
.sheet-textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 16px;
  line-height: 36px;
  color: #2a1a0a;
  font-family: 'KaiTi', '楷体', 'STKaiti', 'SimSun', serif;
  letter-spacing: 1px;
  box-sizing: border-box;
  min-height: 288px;
  font-weight: 500;
}
.sheet-textarea::placeholder { color: #b0a090; font-family: inherit; line-height: 36px; }

/* 底部 */
.sheet-bottom {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px;
}
.sheet-char { font-size: 12px; color: #c0b0a0; }
.sheet-date-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #a08870;
}
.sheet-date {
  padding: 5px 10px;
  border: 1px solid rgba(180,150,120,0.2);
  border-radius: 8px;
  font-size: 13px; color: #5a4830;
  background: rgba(255,255,255,0.6);
  outline: none;
}
.sheet-date:focus { border-color: #d4a868; }
.sheet-date-hint { font-size: 12px; color: #b0a090; }

/* 按钮 */
.sheet-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  margin-top: 20px;
}
.sheet-btn {
  padding: 12px 28px;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.sheet-btn.cancel {
  background: rgba(0,0,0,0.04);
  color: #999;
}
.sheet-btn.cancel:hover { background: rgba(0,0,0,0.07); }
.sheet-btn.send {
  background: linear-gradient(135deg, #e8a860, #d4944a);
  color: #fff;
  box-shadow: 0 4px 16px rgba(232,168,96,0.35);
  display: flex; align-items: center; gap: 8px;
}
.sheet-btn.send:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,168,96,0.45); }
.sheet-btn.send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.send-icon { font-size: 18px; }

/* 读信 */
.read-seal {
  text-align: center;
  font-size: 48px;
  margin-bottom: 8px;
  animation: seal-float 2s ease-in-out infinite;
}
@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.read-title {
  font-size: 22px; font-weight: 800; color: #2a1a0a;
  text-align: center;
  letter-spacing: 3px;
  margin-bottom: 6px;
}
.read-from {
  font-size: 14px; color: #a08870;
  text-align: center;
  font-style: italic;
  margin-bottom: 4px;
}
.read-content {
  font-size: 17px;
  line-height: 36px;
  color: #2a1a0a;
  font-family: 'KaiTi', '楷体', 'STKaiti', 'SimSun', serif;
  letter-spacing: 1px;
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
  font-weight: 500;
}
.read-sign {
  margin-top: 20px;
}
.sign-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180,150,120,0.2), transparent);
  margin-bottom: 10px;
}
.sign-info {
  display: flex; justify-content: center; align-items: center; gap: 10px;
  font-size: 13px; color: #b0a090;
}
.sign-dot { color: #d4a868; font-size: 10px; }
.sheet-btn.close {
  display: block;
  margin: 20px auto 0;
  background: linear-gradient(135deg, #e8a860, #d4944a);
  color: #fff;
  box-shadow: 0 4px 16px rgba(232,168,96,0.35);
}
.sheet-btn.close:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(232,168,96,0.45); }

/* ===== 日历深色模式 ===== */
.cal-dark .cal-page { background: linear-gradient(135deg, #1a1a2e, #2a2a3e); }
.cal-dark .cal-card { background: rgba(30,30,50,0.9); }
.cal-dark .cal-top-bar { background: linear-gradient(135deg, #3a3a50, #4a4a60); }
.cal-dark .cal-top-title { color: #d0d0e0; }
.cal-dark .cal-top-date { color: #b0b0c8; }
.cal-dark .cal-streak-num { color: #d0d0e0; }
.cal-dark .cal-streak-label { color: #b0b0c8; }
.cal-dark .cal-wk { color: #b0b0c8; }
.cal-dark .cal-cell { background: rgba(40,40,60,0.6); color: #c0c0d8; }
.cal-dark .cal-cell.checked { color: #e0e0f0; }
.cal-dark .cal-cell.today { background: rgba(60,60,90,0.8); }
.cal-dark .cal-legend { border-top-color: rgba(100,100,140,0.25); }
.cal-dark .legend-item { color: #b0b0c8; }
.cal-dark .cal-stats { border-top-color: rgba(100,100,140,0.25); }
.cal-dark .cal-stat-val { color: #d0d0e0; }
.cal-dark .cal-stat-lbl { color: #b0b0c8; }
.cal-dark .mood-stats { border-top-color: rgba(100,100,140,0.25); }
.cal-dark .mood-stats-title { color: #c0c0d8; }
.cal-dark .mood-stats-bar { background: rgba(40,40,60,0.8); }
.cal-dark .mood-stat-item { color: #b0b0c8; }
.cal-dark .cal-equipped-tag { background: rgba(100,100,140,0.2); color: #c0c0d8; }
.cal-dark .mailbox { background: linear-gradient(135deg, #2a2540, #302a48); border-color: rgba(160,140,100,0.15); }
.cal-dark .mailbox-title { color: #d0c0a0; }
.cal-dark .mailbox-desc { color: #a09880; }
.cal-dark .mailbox-empty { color: #807060; }
.cal-dark .mail-letter-card { background-color: #2a2438; border-color: rgba(100,90,70,0.2); background-image: repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(100,90,70,0.08) 22px, rgba(100,90,70,0.08) 23px); }
.cal-dark .mail-letter-card::before { background: linear-gradient(225deg, #322c44 50%, rgba(100,90,70,0.1) 50%); }
.cal-dark .mail-letter-card.pending { background-color: #262030; }
.cal-dark .mail-letter-card.openable { background-color: #2e2838; border-color: rgba(232,168,96,0.2); }
.cal-dark .mail-letter-card.opened { background-color: #242030; }
.cal-dark .letter-stamp { background: #3a3450; border-color: rgba(100,90,70,0.25); }
.cal-dark .letter-title { color: #d8c8a8; }
.cal-dark .letter-meta { color: #a09880; }
.cal-dark .letter-seal { background: linear-gradient(135deg, #6a5830, #5a4820); border-color: rgba(100,80,40,0.3); }
.cal-dark .letter-seal.glow { background: linear-gradient(135deg, #8a6830, #7a5820); }
.cal-dark .envelope-flap { background: linear-gradient(135deg, #8a6830, #7a5820); }
.cal-dark .envelope-flap::after { border-top-color: #8a6830; }
.cal-dark .envelope-flap.open { background: linear-gradient(135deg, #6a4820, #5a3818); }
.cal-dark .envelope-flap.open::after { border-top-color: #6a4820; }
.cal-dark .envelope-body { background: linear-gradient(180deg, #3a3048, #322a40); }
.cal-dark .letter-sheet { background: #2a2540; box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 0 40px rgba(0,0,0,0.1); background-image: repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(100,90,70,0.06) 35px, rgba(100,90,70,0.06) 36px); }
.cal-dark .letter-sheet::before { background: rgba(220,80,80,0.04); }
.cal-dark .sheet-title { color: #d0c0a0; }
.cal-dark .sheet-input { color: #e0d8c8; }
.cal-dark .sheet-input.title-input { border-bottom-color: rgba(100,90,70,0.15); }
.cal-dark .sheet-input::placeholder { color: #6a5a48; }
.cal-dark .sheet-textarea { color: #e0d8c8; }
.cal-dark .sheet-textarea::placeholder { color: #6a5a48; }
.cal-dark .sheet-date { background: rgba(40,35,60,0.6); border-color: rgba(100,90,70,0.15); color: #e0d8c8; }
.cal-dark .sheet-btn.cancel { background: rgba(100,100,140,0.15); color: #888; }
.cal-dark .read-title { color: #e0d8c8; }
.cal-dark .read-from { color: #a09880; }
.cal-dark .read-content { color: #e0d8c8; }

/* 月度历史 */
.cal-history-section {
  margin: 0 20px 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.cal-dark .cal-history-section {
  background: rgba(34,30,62,0.95) !important;
}
</style>
