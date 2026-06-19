<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const achievementNames = {
  streak_3: '初露锋芒', streak_7: '一周坚持', streak_14: '两周不辍', streak_30: '月度达人',
  streak_100: '百日王者', streak_365: '年度传说', total_10: '起步', total_50: '半百',
  total_100: '百日纪念', total_365: '年度传奇', total_500: '五百天', total_1000: '千日征程',
  coin_100: '小富即安', coin_500: '财源广进', coin_1000: '日进斗金', coin_5000: '金币大亨',
  coin_10000: '金币帝王', journal_5: '心声记录者', journal_20: '日记达人', journal_50: '日记大师',
  journal_100: '百篇心声', quote_collect: '语录猎人', quote_5: '名言收藏家', quote_10: '语录百晓生',
  quote_20: '语录图书馆', early_bird: '早起打卡', night_owl: '夜猫子', weekend: '周末不松懈',
  dialogue_all: '知心好友', early_bird_7: '晨光行者', early_bird_30: '日出之王', night_owl_7: '暗夜行者',
  perfect_week_1: '首次周满勤', perfect_week_4: '四周满勤', perfect_week_12: '季度全勤',
  perfect_week_52: '年度全勤', perfect_month_1: '首次月满勤', perfect_month_3: '三月连勤',
  perfect_month_6: '半年全勤', perfect_month_12: '年度月月满勤',
}

const events = computed(() => {
  const list = []

  // checkins
  store.checkins.forEach(date => {
    list.push({ type: 'checkin', date, label: date + ' 打卡成功', color: '#ff6b8a' })
  })

  // achievements
  store.achievements.forEach(a => {
    var name = achievementNames[a.id] || a.id
    list.push({ type: 'achievement', date: a.unlockedAt, label: '解锁成就「' + name + '」', color: '#f5c842' })
  })

  // dialogues
  if (store.collectedDialogues.length > 0) {
    var lastDate = store.checkins.length > 0 ? store.checkins[store.checkins.length - 1] : ''
    list.push({ type: 'dialogue', date: lastDate, label: '收集隐藏台词', color: '#9d4edd' })
  }

  list.sort((a, b) => b.date.localeCompare(a.date))
  return list.slice(0, 10)
})
</script>

<template>
  <div class="timeline-wrap" v-if="events.length > 0">
    <div class="tl-header">
      <span class="tl-icon">🕐</span>
      <span>最近动态</span>
    </div>
    <div class="tl-list">
      <div v-for="(ev, i) in events" :key="i" class="tl-item">
        <div class="tl-line-wrap">
          <div class="tl-dot" :style="{ background: ev.color }"></div>
          <div v-if="i < events.length - 1" class="tl-line"></div>
        </div>
        <div class="tl-content">
          <span class="tl-type-icon">{{ ev.type === 'checkin' ? '📅' : ev.type === 'achievement' ? '🏆' : '🎭' }}</span>
          <span class="tl-label">{{ ev.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-wrap {
  background: rgba(255,255,255,0.92);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
}
.tl-header {
  display: flex; align-items: center; gap: 10px;
  font-size: 16px; font-weight: 700; color: #1a1a1a;
  margin-bottom: 18px;
  letter-spacing: 0.3px;
}
.tl-icon { font-size: 18px; }

.tl-list { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 14px; }
.tl-line-wrap {
  display: flex; flex-direction: column; align-items: center;
  width: 18px; flex-shrink: 0;
}
.tl-dot {
  width: 12px; height: 12px; border-radius: 50%;
  flex-shrink: 0; margin-top: 5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.tl-line {
  width: 2px; flex: 1;
  background: linear-gradient(180deg, #f0f0f0, #f8f8f8); margin: 4px 0;
}
.tl-content {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 0 16px;
  font-size: 13px; color: #555;
  font-weight: 500;
}
.tl-type-icon { font-size: 16px; }
.tl-label { line-height: 1.5; }
</style>
