<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const achievementList = [
  { id: 'streak_3', name: '初露锋芒', desc: '连续打卡 3 天', icon: '🔥', reward: 20, tag: '基础' },
  { id: 'streak_7', name: '一周坚持', desc: '连续打卡 7 天', icon: '💪', reward: 50, tag: '基础' },
  { id: 'streak_14', name: '两周不辍', desc: '连续打卡 14 天', icon: '⭐', reward: 100, tag: '基础' },
  { id: 'streak_30', name: '月度达人', desc: '连续打卡 30 天', icon: '👑', reward: 200, tag: '进阶' },
  { id: 'streak_100', name: '百日王者', desc: '连续打卡 100 天', icon: '🏆', reward: 500, tag: '进阶' },
  { id: 'streak_365', name: '年度传说', desc: '连续打卡 365 天', icon: '🐉', reward: 2000, tag: '传说' },
  { id: 'total_10', name: '起步', desc: '累计打卡 10 天', icon: '🎯', reward: 30, tag: '基础' },
  { id: 'total_50', name: '半百', desc: '累计打卡 50 天', icon: '🎉', reward: 150, tag: '基础' },
  { id: 'total_100', name: '百日纪念', desc: '累计打卡 100 天', icon: '💎', reward: 300, tag: '进阶' },
  { id: 'total_365', name: '年度传奇', desc: '累计打卡 365 天', icon: '🌟', reward: 1000, tag: '进阶' },
  { id: 'total_500', name: '五百天', desc: '累计打卡 500 天', icon: '🏔️', reward: 1500, tag: '传说' },
  { id: 'total_1000', name: '千日征程', desc: '累计打卡 1000 天', icon: '🌌', reward: 3000, tag: '传说' },
  { id: 'coin_100', name: '小富即安', desc: '持有 100 金币', icon: '🪙', reward: 30, tag: '基础' },
  { id: 'coin_500', name: '财源广进', desc: '持有 500 金币', icon: '💰', reward: 80, tag: '基础' },
  { id: 'coin_1000', name: '日进斗金', desc: '持有 1000 金币', icon: '🏦', reward: 150, tag: '进阶' },
  { id: 'coin_5000', name: '金币大亨', desc: '持有 5000 金币', icon: '👑', reward: 500, tag: '传说' },
  { id: 'coin_10000', name: '金币帝王', desc: '持有 10000 金币', icon: '🏰', reward: 1000, tag: '传说' },
  { id: 'journal_5', name: '心声记录者', desc: '写下 5 条日记', icon: '📝', reward: 20, tag: '基础' },
  { id: 'journal_20', name: '日记达人', desc: '写下 20 条日记', icon: '📖', reward: 60, tag: '基础' },
  { id: 'journal_50', name: '日记大师', desc: '写下 50 条日记', icon: '📚', reward: 150, tag: '进阶' },
  { id: 'journal_100', name: '百篇心声', desc: '写下 100 条日记', icon: '🏛️', reward: 300, tag: '传说' },
  { id: 'quote_collect', name: '语录猎人', desc: '收藏 1 条语录', icon: '⭐', reward: 10, tag: '基础' },
  { id: 'quote_5', name: '名言收藏家', desc: '收藏 5 条语录', icon: '📚', reward: 40, tag: '基础' },
  { id: 'quote_10', name: '语录百晓生', desc: '收藏 10 条语录', icon: '🎓', reward: 80, tag: '进阶' },
  { id: 'quote_20', name: '语录图书馆', desc: '收藏 20 条语录', icon: '🏛️', reward: 150, tag: '传说' },
  { id: 'early_bird', name: '早起打卡', desc: '早上 8 点前打卡', icon: '🐦', reward: 15, tag: '基础' },
  { id: 'night_owl', name: '夜猫子', desc: '晚上 10 点后打卡', icon: '🦉', reward: 15, tag: '基础' },
  { id: 'weekend', name: '周末不松懈', desc: '周末连续打卡 2 天', icon: '🎊', reward: 25, tag: '基础' },
  { id: 'dialogue_all', name: '知心好友', desc: '收集全部 8 条隐藏台词', icon: '🎭', reward: 100, tag: '进阶' },
  { id: 'early_bird_7', name: '晨光行者', desc: '连续 7 天早上 8 点前打卡', icon: '🌅', reward: 100, tag: '挑战' },
  { id: 'early_bird_30', name: '日出之王', desc: '连续 30 天早上 8 点前打卡', icon: '☀️', reward: 500, tag: '传说' },
  { id: 'night_owl_7', name: '暗夜行者', desc: '连续 7 天晚上 10 点后打卡', icon: '🌙', reward: 100, tag: '挑战' },
  { id: 'perfect_week_1', name: '首次周满勤', desc: '完成 1 次周一到周日全勤', icon: '📅', reward: 50, tag: '循环' },
  { id: 'perfect_week_4', name: '四周满勤', desc: '完成 4 次周满勤', icon: '📆', reward: 150, tag: '循环' },
  { id: 'perfect_week_12', name: '季度全勤', desc: '完成 12 次周满勤', icon: '🗓️', reward: 500, tag: '循环' },
  { id: 'perfect_week_52', name: '年度全勤', desc: '完成 52 次周满勤', icon: '🏛️', reward: 2000, tag: '传说' },
  { id: 'perfect_month_1', name: '首次月满勤', desc: '完成 1 次整月全勤', icon: '🌙', reward: 200, tag: '循环' },
  { id: 'perfect_month_3', name: '三月连勤', desc: '完成 3 次月满勤', icon: '🌸', reward: 500, tag: '循环' },
  { id: 'perfect_month_6', name: '半年全勤', desc: '完成 6 次月满勤', icon: '☀️', reward: 1000, tag: '传说' },
  { id: 'perfect_month_12', name: '年度月月满勤', desc: '完成 12 次月满勤', icon: '🐉', reward: 3000, tag: '传说' },
]

const achievementTags = ['基础', '进阶', '挑战', '循环', '传说']
const activeAchTag = ref('all')

const filteredAchievements = computed(() => {
  if (activeAchTag.value === 'all') return achievementList
  return achievementList.filter(a => a.tag === activeAchTag.value)
})

function isUnlocked(id) {
  return store.achievements.some(a => a.id === id)
}
</script>

<template>
  <div class="ach-hero">
    <div class="ach-big-num">{{ store.achievements.length }}</div>
    <div class="ach-big-label">/ {{ achievementList.length }} 已解锁</div>
    <div class="ach-bar-wrap">
      <div class="ach-bar"><div class="ach-fill" :style="{ width: (store.achievements.length / achievementList.length * 100) + '%' }"></div></div>
    </div>
  </div>

  <div class="ach-tags">
    <button class="ach-tag" :class="{ active: activeAchTag === 'all' }" @click="activeAchTag = 'all'">全部</button>
    <button v-for="tag in achievementTags" :key="tag" class="ach-tag" :class="{ active: activeAchTag === tag }" @click="activeAchTag = tag">{{ tag }}</button>
  </div>

  <div class="card">
    <div class="ach-items">
      <div v-for="item in filteredAchievements" :key="item.id" class="ach-row" :class="{ unlocked: isUnlocked(item.id) }">
        <div class="ach-emoji">{{ item.icon }}</div>
        <div class="ach-detail">
          <div class="ach-name">{{ item.name }}</div>
          <div class="ach-desc">{{ item.desc }}</div>
          <div class="ach-tag-label" :class="item.tag">{{ item.tag }}</div>
        </div>
        <div class="ach-badge">
          <span v-if="isUnlocked(item.id)" class="ach-ok">✓</span>
          <span v-else class="ach-pts">+{{ item.reward }}💰</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ach-hero {
  text-align: center;
  padding: 40px 32px;
  background: rgba(255,255,255,0.95);
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
}
.ach-hero::before {
  content: '';
  position: absolute;
  top: -30%;
  left: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,107,138,0.05) 0%, transparent 70%);
  pointer-events: none;
}
.ach-big-num {
  font-size: 64px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #ff6b8a, #ffa07a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -2px;
}
.ach-big-label { font-size: 15px; color: #aaa; margin-top: 6px; margin-bottom: 20px; font-weight: 500; }
.ach-bar-wrap { padding: 0 48px; }
.ach-bar { height: 8px; background: #f0f0f0; border-radius: 8px; overflow: hidden; }
.ach-fill { height: 100%; background: linear-gradient(90deg, #ff6b8a, #ffa07a); border-radius: 8px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); }

.ach-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.ach-tag {
  padding: 6px 14px;
  border: none;
  border-radius: 16px;
  background: #f0f0f0;
  color: #888;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.ach-tag:hover { background: #e8e8e8; }
.ach-tag.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 2px 8px rgba(102,126,234,0.3);
}

.card {
  background: rgba(255,255,255,0.92);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
}

.ach-items { padding: 6px 0; }
.ach-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  transition: background 0.25s;
}
.ach-row:last-child { border-bottom: none; }
.ach-row:hover { background: rgba(255,107,138,0.02); }
.ach-row.unlocked { background: linear-gradient(135deg, #fffafb, #fff8f5); }
.ach-emoji {
  font-size: 28px;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 16px;
  flex-shrink: 0;
  transition: background 0.3s;
}
.ach-row.unlocked .ach-emoji {
  background: linear-gradient(135deg, #ff6b8a, #ff8e53);
  box-shadow: 0 4px 12px rgba(255,107,138,0.3);
}
.ach-detail { flex: 1; }
.ach-name { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.ach-desc { font-size: 13px; color: #aaa; margin-top: 3px; }
.ach-badge { font-size: 13px; }
.ach-ok { color: #10b981; font-weight: 800; font-size: 18px; }
.ach-pts { color: #ccc; font-weight: 600; }

.ach-tag-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  margin-top: 6px;
  letter-spacing: 0.5px;
}
.ach-tag-label.基础 { background: #f0f0f0; color: #666 !important; }
.ach-tag-label.进阶 { background: #dbeafe; color: #2563eb !important; }
.ach-tag-label.挑战 { background: #fef3c7; color: #d97706 !important; }
.ach-tag-label.循环 { background: #d1fae5; color: #059669 !important; }
.ach-tag-label.传说 { background: #fde68a; color: #b45309 !important; }
</style>
