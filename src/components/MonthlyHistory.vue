<template>
  <div class="monthly-history">
    <!-- 文艺风标题 -->
    <div class="art-header">
      <span class="art-line"></span>
      <span class="art-title">时光记录</span>
      <span class="art-line"></span>
    </div>

    <!-- 年份选择 -->
    <div class="year-nav">
      <button class="year-btn" @click="prevYear" :disabled="!canPrev">‹</button>
      <span class="year-text">{{ currentYear }}</span>
      <button class="year-btn" @click="nextYear" :disabled="!canNext">›</button>
    </div>

    <!-- 有打卡记录的月份 -->
    <div v-if="activeMonths.length === 0" class="empty-text">
      这一年还没有记录~
    </div>

    <div v-else class="months-list">
      <div v-for="month in activeMonths" :key="month.key" class="month-item">
        <div class="month-top">
          <span class="month-label">{{ month.name }}</span>
          <span class="month-count">{{ month.total }}天</span>
        </div>

        <!-- 紧凑日历 -->
        <div class="mini-cal">
          <div class="mini-row">
            <span v-for="day in month.days" :key="day.idx"
                  class="mini-day"
                  :class="{ 'on': day.checked, 'now': day.isToday, 'off': day.isFuture || !day.date }">
              {{ day.day || '' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="art-stats">
      <span class="stat">{{ totalDays }}天打卡</span>
      <span class="dot">·</span>
      <span class="stat">连续{{ currentStreak }}天</span>
      <span class="dot">·</span>
      <span class="stat">最长{{ maxStreak }}天</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const currentYear = ref(new Date().getFullYear())

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const canPrev = computed(() => {
  const first = store.checkins.length > 0 ? [...store.checkins].sort()[0] : null
  if (!first) return false
  return currentYear.value > parseInt(first.split('-')[0])
})

const canNext = computed(() => currentYear.value < new Date().getFullYear())

function prevYear() { if (canPrev.value) currentYear.value-- }
function nextYear() { if (canNext.value) currentYear.value++ }

const activeMonths = computed(() => {
  const result = []
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  for (let month = 0; month < 12; month++) {
    const prefix = `${currentYear.value}-${String(month + 1).padStart(2, '0')}`
    const monthCheckins = store.checkins.filter(d => d.startsWith(prefix))
    if (monthCheckins.length === 0) continue

    const daysInMonth = new Date(currentYear.value, month + 1, 0).getDate()
    const days = []
    let idx = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${prefix}-${String(day).padStart(2, '0')}`
      days.push({
        date: dateStr,
        day,
        checked: store.checkins.includes(dateStr),
        isToday: dateStr === todayStr,
        isFuture: new Date(dateStr) > today,
        idx: idx++
      })
    }

    // 最长连续
    const sorted = monthCheckins.sort()
    let max = 1, cur = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
      if (diff === 1) { cur++; max = Math.max(max, cur) } else cur = 1
    }

    result.push({ key: `${prefix}`, month, name: monthNames[month], days, total: monthCheckins.length, maxStreak: max })
  }

  return result.reverse()
})

const totalDays = computed(() => store.totalCheckins)
const currentStreak = computed(() => store.streakDays)
const maxStreak = computed(() => {
  if (store.checkins.length === 0) return 0
  const sorted = [...store.checkins].sort()
  let max = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
    if (diff === 1) { cur++; max = Math.max(max, cur) } else cur = 1
  }
  return max
})
</script>

<style scoped>
.monthly-history {
  padding: 16px 20px;
  font-family: 'STKaiti', 'KaiTi', '楷体', serif;
}

/* 文艺标题 */
.art-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.art-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c8b0a0, transparent);
}

.art-title {
  font-size: 18px;
  color: #8a7a70;
  letter-spacing: 6px;
  font-weight: 600;
}

/* 年份 */
.year-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.year-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #d8c8c0;
  border-radius: 50%;
  background: transparent;
  color: #8a7a70;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.year-btn:hover:not(:disabled) {
  background: rgba(200, 176, 160, 0.15);
}

.year-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.year-text {
  font-size: 18px;
  color: #6a5a50;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

/* 空状态 */
.empty-text {
  text-align: center;
  color: #b0a098;
  font-size: 13px;
  padding: 20px 0;
}

/* 月份列表 */
.months-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.month-item {
  padding: 10px 12px;
  background: rgba(255, 250, 248, 0.5);
  border-radius: 10px;
  border: 1px solid rgba(200, 176, 160, 0.2);
}

.month-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.month-label {
  font-size: 15px;
  color: #6a5a50;
  font-weight: 600;
}

.month-count {
  font-size: 13px;
  color: #a09088;
  background: rgba(200, 176, 160, 0.15);
  padding: 3px 10px;
  border-radius: 8px;
}

/* 迷你日历 */
.mini-cal {
  overflow: hidden;
}

.mini-row {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.mini-day {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #a09088;
  border-radius: 6px;
  background: rgba(200, 176, 160, 0.08);
}

.mini-day.on {
  background: linear-gradient(135deg, #d4a0b4, #c8a0a0);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(212, 160, 180, 0.4);
}

.mini-day.now {
  border: 1px dashed #c8a090;
}

.mini-day.off {
  opacity: 0.3;
}

/* 底部统计 */
.art-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(200, 176, 160, 0.2);
}

.stat {
  font-size: 14px;
  color: #a09088;
}

.dot {
  color: #c8b0a0;
  font-size: 10px;
}

/* 深色模式 */
:deep(.dark-mode) .art-title,
:deep(.dark-mode) .year-text,
:deep(.dark-mode) .month-label {
  color: #d0c0c8 !important;
}

:deep(.dark-mode) .month-item {
  background: rgba(40, 30, 45, 0.5) !important;
  border-color: rgba(180, 140, 160, 0.15) !important;
}

:deep(.dark-mode) .mini-day {
  background: rgba(180, 140, 160, 0.1) !important;
  color: #b0a0a8 !important;
}

:deep(.dark-mode) .mini-day.on {
  background: linear-gradient(135deg, #a07088, #907078) !important;
  color: #fff !important;
  box-shadow: 0 2px 6px rgba(160, 112, 136, 0.4) !important;
}

:deep(.dark-mode) .year-btn {
  border-color: rgba(180, 140, 160, 0.3) !important;
  color: #b0a0a8 !important;
}

:deep(.dark-mode) .art-stats {
  border-top-color: rgba(180, 140, 160, 0.15) !important;
}

:deep(.dark-mode) .stat {
  color: #b0a0a8 !important;
}
</style>
