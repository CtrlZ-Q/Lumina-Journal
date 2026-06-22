<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { moodOptions, getActiveSeasonalEvent } from '../data/seasonalEvents'
import { isEasterClaimed, markEasterClaimed } from '../composables/easterEgg'
import { themes } from '../data/themes'
import CheckinTimeline from '../components/CheckinTimeline.vue'
import CheckinEffect from '../components/CheckinEffect.vue'
import ThemeDecor from '../components/ThemeDecor.vue'
import PageCalendar from './PageCalendar.vue'
import PageQuote from './PageQuote.vue'
import PageAchieve from './PageAchieve.vue'
import PageShop from './PageShop.vue'
import PageMore from './PageMore.vue'

const store = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['show-toast'])

const activeTab = ref('home')
const newJournal = ref('')
const selectedMood = ref(null)
const showJournalDetail = ref(false)
const journalDetail = ref(null)

function openJournalDetail(item) {
  journalDetail.value = item
  showJournalDetail.value = true
}

function submitJournal() {
  const text = newJournal.value.trim()
  if (!text) return
  const toasts = store.addJournal(text, selectedMood.value)
  newJournal.value = ''
  selectedMood.value = null
  emit('show-toast', '📝 记录已保存')
  // 检查称号解锁
  const newTitles = shop.checkTitles()
  newTitles.forEach(t => toasts.push(`🏅 获得称号「${t.name}」！`))
  // 显示日记触发的成就 toast
  if (toasts && toasts.length > 0) {
    toasts.forEach((t, i) => setTimeout(() => emit('show-toast', t), (i + 1) * 1500))
  }
}

const seasonEvent = computed(() => getActiveSeasonalEvent())

// 每日随机语录颜色 - 清晰明亮
const quoteColors = [
  '#e74c3c', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
  '#ff9800', '#ff5722', '#795548', '#607d8b', '#f44336',
  '#d32f2f', '#c2185b', '#7b1fa2', '#512da8', '#303f9f',
  '#1976d2', '#0288d1', '#00838f', '#00695c', '#388e3c',
  '#689f38', '#ef6c00', '#e64a19', '#bf360c', '#d84315',
]
const quoteColor = computed(() => {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return quoteColors[seed % quoteColors.length]
})

// 节日彩蛋
const easterEggClaimed = ref(false)
const easterEggResult = ref(null)
const easterEggShow = ref(false)
const easterEggJustClaimed = ref(false)

watch([seasonEvent, () => store.resetVersion], ([evt]) => {
  const today = new Date()
  easterEggClaimed.value = !!evt?.easterEgg && isEasterClaimed(evt.id, today.getFullYear(), today.getMonth(), today.getDate())
}, { immediate: true })

const encourageLines = [
  '今天也要元气满满哦！', '坚持打卡的你最棒了！', '每一天都值得被珍惜~',
  '你已经很棒了，继续加油！', '小小的惊喜送给特别的你~', '生活需要一点仪式感~',
  '愿你每天都像今天一样幸运！', '今天的你闪闪发光✨', '好运正在路上~',
  '保持热爱，奔赴山海！', '你值得世间所有美好~', '今天也是美好的一天！',
]

function claimEasterEgg() {
  const evt = seasonEvent.value
  const today = new Date()
  const claimed = evt?.easterEgg && isEasterClaimed(evt.id, today.getFullYear(), today.getMonth(), today.getDate())
  if (!evt?.easterEgg || easterEggClaimed.value || claimed) return
  markEasterClaimed(evt.id, today.getFullYear(), today.getMonth(), today.getDate())
  easterEggClaimed.value = true
  easterEggJustClaimed.value = true
  const reward = evt.easterEgg.min + Math.floor(Math.random() * (evt.easterEgg.max - evt.easterEgg.min + 1))
  store.coins += reward
  store.logCoin(reward, `🥚 ${evt.name}彩蛋`)
  const blessing = evt.freeQuotes[Math.floor(Math.random() * evt.freeQuotes.length)]
  const encourage = encourageLines[Math.floor(Math.random() * encourageLines.length)]
  easterEggResult.value = {
    icon: evt.easterEgg.icon,
    name: evt.easterEgg.name,
    reward,
    eventName: evt.name,
    eventIcon: evt.icon,
    blessing,
    encourage,
    date: `${today.getMonth() + 1}月${today.getDate()}日`,
  }
  easterEggShow.value = true
}

function getMoodStyle(key) {
  return moodOptions.find(m => m.key === key) || { icon: '😐', bg: '#f5f5f5', color: '#999' }
}


const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dailyTheme = computed(() => themes[new Date().getDay()])
const currentTheme = computed(() => {
  const equipped = shop.activeTheme
  if (equipped) {
    return { name: equipped.name, icon: equipped.icon, gradient: equipped.data.gradient, lightBg: equipped.data.lightBg, accent: equipped.data.accent, level: 0 }
  }
  return { ...dailyTheme.value, level: 0 }
})
const pageTitle = computed(() => {
  const equipped = shop.activeTheme
  if (equipped) return `${equipped.icon} ${equipped.name}`
  return `${dailyTheme.value.icon} ${weekDayNames[new Date().getDay()]}·${dailyTheme.value.name}`
})

const currentAnimation = computed(() => {
  if (shop.darkMode) return null
  if (activeTab.value === 'calendar') return null
  // 特效优先，其次主题
  const effect = shop.activeEffect
  if (effect?.data?.animation) return effect.data.animation
  const theme = shop.activeTheme
  if (theme?.data?.animation) return theme.data.animation
  return null
})

const calendarPageBgs = {
  default: 'linear-gradient(135deg, #f0ecf6 0%, #e8e4f0 50%, #e2dcea 100%)',
  classic: 'linear-gradient(135deg, #e5ded4 0%, #e0d9ce 50%, #e5e0d8 100%)',
  autumn: 'linear-gradient(135deg, #faf6ee 0%, #f8f2e4 50%, #f5ecd8 100%)',
  winter: 'linear-gradient(135deg, #f0f4fa 0%, #e8f0f8 50%, #dde8f4 100%)',
  spring: 'linear-gradient(135deg, #faf0f4 0%, #f8eef2 50%, #f5eaf0 100%)',
  starry: 'linear-gradient(135deg, #1a1630 0%, #221e3e 50%, #2a2648 100%)',
  summer: 'linear-gradient(135deg, #faf8ee 0%, #f6f2e0 50%, #f0eeda 100%)',
  rain: 'linear-gradient(135deg, #eceef2 0%, #e4e6ec 50%, #dcdfe6 100%)',
  retro: 'linear-gradient(135deg, #f8f2e8 0%, #f4ece0 50%, #f0e8d8 100%)',
  sunset: 'linear-gradient(135deg, #fdf0e6 0%, #fbe4d0 50%, #f8d8ba 100%)',
  coral: 'linear-gradient(135deg, #fdf2f4 0%, #fbe8ec 50%, #f8dce2 100%)',
  mountain: 'linear-gradient(135deg, #eef4f0 0%, #e4ece6 50%, #dae4dc 100%)',
  galaxy: 'linear-gradient(135deg, #0e0a20 0%, #161230 50%, #1e1a3a 100%)',
  galaxy_deep: 'linear-gradient(135deg, #080418 0%, #10082a 50%, #180e36 100%)',
  nebula: 'linear-gradient(135deg, #1a0a2e 0%, #2a1040 50%, #1e1838 100%)',
  golden: 'linear-gradient(135deg, #faf6e8 0%, #f6f0d4 50%, #f0e8c0 100%)',
  misty: 'linear-gradient(135deg, #f0f2f6 0%, #e8eaef 50%, #dfe2e8 100%)',
  forest: 'linear-gradient(135deg, #eaf0e6 0%, #e0e8da 50%, #d6e0d0 100%)',
  snow: 'linear-gradient(135deg, #f8faff 0%, #f0f4fc 50%, #e8eef8 100%)',
  cherry_blossom: 'linear-gradient(135deg, #fdf0f4 0%, #f8e4ec 50%, #f4d8e4 100%)',
}
const pageBodyBg = computed(() => {
  if (shop.darkMode) return 'linear-gradient(135deg, #13131f, #1a1a2e)'
  if (activeTab.value === 'calendar' && shop.equippedItems.calendar) {
    const calItem = shop.getItem(shop.equippedItems.calendar)
    const style = calItem?.data?.style
    if (style && calendarPageBgs[style]) return calendarPageBgs[style]
  }
  return currentTheme.value.lightBg
})


// 同步背景到 App.vue
const setPageBg = inject('setAppPageBg', () => {})
watch(pageBodyBg, (bg) => setPageBg(bg), { immediate: true })

const currentQuote = ref(store.getDialogue(shop))

// 切回首页或语录库变化时刷新语录
watch(activeTab, (tab) => {
  if (tab === 'home') currentQuote.value = store.getDialogue(shop)
})
watch(() => shop.extraQuotes.length, () => {
  if (activeTab.value === 'home') currentQuote.value = store.getDialogue(shop)
})

const showEffect = ref(false)
const effectAnimation = ref('')
const checkinDetails = ref(null)
const effectLevel = computed(() => {
  if (shop.useOriginalStyle) return 0
  return shop.activeEffect ? 1 : 0
})
const effectParticleCount = computed(() => 6 + effectLevel.value * 2)
const checkinEffects = {
  confetti: '🎊', fireworks: '🎆', lightning: '⚡', rainbow: '🌈',
  explosion: '💥', leaves: '🍃', butterfly: '🦋', stars: '⭐',
  unicorn: '🦄', stardust: '💫', firefly: '🪲', sakura: '🌸',
  snow: '❄️', bubble: '🫧', comet: '☄️', galaxy: '🌀',
  fire: '🔥', magic_circle: '🔯', aurora: '🌈',
}

function playCheckinEffect(details) {
  const effect = shop.activeEffect
  checkinDetails.value = details
  if (effect) {
    effectAnimation.value = effect.data.animation
    showEffect.value = true
  } else {
    effectAnimation.value = ''
    showEffect.value = true
  }
}

function handleCheckin() {
  const result = store.checkIn()
  if (result) {
    let finalReward = result.reward
    // 签到增幅道具（50%概率回本）
    if (shop.consumables.magnet > 0) {
      shop.consumables.magnet--; const extra = result.reward * 4; store.coins += extra; finalReward += extra; store.logCoin(extra, '🧲 磁铁×5加成')
    } else if (shop.consumables.triple_coin > 0) {
      shop.consumables.triple_coin--; const extra = result.reward * 2; store.coins += extra; finalReward += extra; store.logCoin(extra, '💎 三倍币加成')
    } else if (shop.consumables.double_coin > 0) {
      shop.consumables.double_coin--; const extra = result.reward; store.coins += extra; finalReward += extra; store.logCoin(extra, '✨ 双倍币加成')
    }
    // 幸运道具（50%概率赚）
    if (shop.consumables.lucky_star > 0) {
      shop.consumables.lucky_star--; const bonus = Math.floor(Math.random() * 101); store.coins += bonus; finalReward += bonus; store.logCoin(bonus, '⭐ 幸运星')
    } else if (shop.consumables.lucky > 0) {
      shop.consumables.lucky--; const bonus = Math.floor(Math.random() * 51); store.coins += bonus; finalReward += bonus; store.logCoin(bonus, '🍀 幸运草')
    }
    result.reward = finalReward
    const sound = shop.equippedItems.sound
    if (sound) playSound(sound)
    playCheckinEffect(result)
    const toasts = result.toasts || []
    // 检查称号解锁
    const newTitles = shop.checkTitles()
    newTitles.forEach(t => toasts.push(`🏅 获得称号「${t.name}」！`))
    toasts.forEach((t, i) => setTimeout(() => emit('show-toast', t), (i + 1) * 1500))
  } else {
    emit('show-toast', '✅ 今天已经打卡过啦~')
  }
}

let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playSound(soundId) {
  try {
    const ctx = getAudioCtx()
    const configs = {
      bell: { freq: 880, type: 'sine', dur: 0.6 },
      melody: { type: 'triangle', dur: 0.8, notes: [523, 659, 784] },
      nature: { freq: 180, type: 'sine', dur: 1.0 },
      piano: { type: 'triangle', dur: 0.7, notes: [440, 554, 659] },
      pixel: { type: 'square', dur: 0.3, notes: [660, 880, 1100] },
      fanfare: { type: 'sawtooth', dur: 0.5, notes: [523, 659, 784, 1047] },
      chime: { freq: 1200, type: 'sine', dur: 0.8 },
      drum: { freq: 100, type: 'sawtooth', dur: 0.2 },
      guitar: { type: 'triangle', dur: 0.6, notes: [330, 440, 550] },
      magic: { type: 'sine', dur: 0.5, notes: [800, 1000, 1200, 1600] },
      crystal: { type: 'sine', dur: 0.8, notes: [1047, 1319, 1568, 2093] },
      wind: { freq: 200, type: 'sine', dur: 1.2 },
      ocean: { freq: 120, type: 'sine', dur: 1.5 },
      space: { type: 'sine', dur: 1.0, notes: [220, 330, 440, 660, 880] },
    }
    const cfg = configs[soundId] || configs.bell
    if (cfg.notes) {
      cfg.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = cfg.type; osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.12; osc.start(t)
        gain.gain.setValueAtTime(0.08, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur)
        osc.stop(t + cfg.dur)
      })
    } else {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = cfg.type; osc.frequency.value = cfg.freq; osc.start()
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + cfg.dur)
      osc.stop(ctx.currentTime + cfg.dur)
    }
  } catch {}
}

const tabs = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'calendar', icon: '📅', label: '日历' },
  { id: 'quote', icon: '💬', label: '语录' },
  { id: 'achieve', icon: '🏆', label: '成就' },
  { id: 'shop', icon: '🛒', label: '商店' },
  { id: 'more', icon: '⚙️', label: '更多' },
]
</script>

<template>
  <div class="page" :class="{ 'dark-mode': shop.darkMode }" :style="{ '--theme-accent': currentTheme.accent, '--theme-gradient': currentTheme.gradient, '--theme-bg': currentTheme.lightBg }">
    <ThemeDecor :key="currentAnimation || 'none'" :animation="currentAnimation" />
    <div class="page-body" :style="{ background: pageBodyBg }">
      <!-- 首页 -->
      <div v-if="activeTab === 'home'" class="tab-content">
        <!-- Hero 横幅 -->
        <div class="hero" :style="{ background: currentTheme.gradient }">
          <div class="hero-glow"></div>
          <div class="hero-content">
            <div class="hero-top">
              <div class="hero-date-area">
                <div class="hero-day">{{ new Date().getDate() }}</div>
                <div class="hero-meta">
                  <div class="hero-month">{{ new Date().toLocaleDateString('zh-CN', { month: 'long', year: 'numeric' }) }}</div>
                  <div class="hero-week">{{ new Date().toLocaleDateString('zh-CN', { weekday: 'long' }) }} · {{ pageTitle }}</div>
                </div>
              </div>
              <div class="hero-streak">
                <div class="streak-num">{{ store.streakDays }}</div>
                <div class="streak-label">天连续</div>
              </div>
            </div>
            <div v-if="shop.activeTitle" class="hero-title-tag">
              <span class="hero-title-icon">{{ shop.getTitle(shop.activeTitle)?.icon }}</span>
              <span class="hero-title-name">{{ shop.getTitle(shop.activeTitle)?.name }}</span>
            </div>
            <div class="hero-quote" :style="{ '--quote-color': quoteColor }">「{{ currentQuote }}」</div>
          </div>
        </div>

        <!-- 季节活动 -->
        <div v-if="seasonEvent" class="season-card" :style="{ background: seasonEvent.banner.bg }">
          <div class="season-glow"></div>
          <span class="season-icon">{{ seasonEvent.icon }}</span>
          <div class="season-info">
            <span class="season-name">{{ seasonEvent.name }}限定</span>
            <span class="season-desc">{{ seasonEvent.greeting }}</span>
          </div>
          <div class="season-right">
            <span v-if="seasonEvent.coinBonus > 1" class="season-badge">×{{ seasonEvent.coinBonus }} 金币加成</span>
            <button
              v-if="seasonEvent.easterEgg"
              class="egg-btn"
              :class="{ claimed: easterEggClaimed, 'just-claimed': easterEggJustClaimed }"
              :disabled="easterEggClaimed"
              @click="claimEasterEgg"
            >
              {{ easterEggClaimed ? '🔒' : seasonEvent.easterEgg.icon }}
            </button>
          </div>
        </div>

        <!-- 彩蛋弹窗 -->
        <Teleport to="body">
          <Transition name="pop">
            <div v-if="easterEggShow && easterEggResult" class="modal-mask" @click="easterEggShow = false">
              <div class="modal-box egg-modal" @click.stop>
                <div class="egg-top"><span>{{ easterEggResult.eventIcon }}</span><span class="egg-event-name">{{ easterEggResult.eventName }}·{{ easterEggResult.date }}</span></div>
                <div class="egg-icon">{{ easterEggResult.icon }}</div>
                <div class="egg-title">🎊 获得「{{ easterEggResult.name }}」彩蛋！</div>
                <div class="egg-blessing">「{{ easterEggResult.blessing }}」</div>
                <div class="egg-reward"><span>💰</span><span class="egg-num">+{{ easterEggResult.reward }}</span></div>
                <div class="egg-encourage">{{ easterEggResult.encourage }}</div>
                <button class="btn-primary" @click="easterEggShow = false">开心收下~</button>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- 日记详情弹窗 -->
        <Teleport to="body">
          <Transition name="pop">
            <div v-if="showJournalDetail && journalDetail" class="modal-mask" @click="showJournalDetail = false">
              <div class="modal-box journal-detail-modal" @click.stop>
                <div class="jd-header">
                  <span v-if="journalDetail.mood" class="jd-mood" :style="{ background: getMoodStyle(journalDetail.mood).bg }">{{ getMoodStyle(journalDetail.mood).icon }}</span>
                  <span class="jd-time">{{ journalDetail.date }} {{ journalDetail.time }}</span>
                </div>
                <div class="jd-body">{{ journalDetail.text }}</div>
                <button class="btn-primary" @click="showJournalDetail = false">关闭</button>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- 打卡按钮 -->
        <button class="checkin-btn" :class="{ done: store.checkedToday }" :style="!store.checkedToday ? { background: currentTheme.gradient } : {}" @click="handleCheckin">
          <span class="btn-inner">
            <span v-if="store.checkedToday" class="btn-text">✨ 今天打卡完成啦</span>
            <span v-else class="btn-text">📅 立即打卡</span>
          </span>
          <span v-if="!store.checkedToday" class="btn-shine"></span>
        </button>

        <!-- 数据卡片 -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-val fire-val">{{ store.streakDays }}</div>
            <div class="stat-lbl">连续打卡</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-val">{{ store.totalCheckins }}</div>
            <div class="stat-lbl">累计打卡</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-val gold-val">{{ store.coins.toLocaleString() }}</div>
            <div class="stat-lbl">金币余额</div>
          </div>
        </div>

        <CheckinTimeline />

        <!-- 日记 -->
        <div class="card journal-card">
          <div class="card-head">
            <span class="card-title">📝 今日记录</span>
            <span class="card-count">{{ store.journal.length }}</span>
          </div>
          <div class="mood-row">
            <span class="mood-lbl">心情</span>
            <button v-for="m in moodOptions" :key="m.key" class="mood-btn" :class="{ active: selectedMood === m.key }" :style="selectedMood === m.key ? { background: m.bg, borderColor: m.color } : {}" @click="selectedMood = selectedMood === m.key ? null : m.key">
              {{ m.icon }}
            </button>
          </div>
          <div class="input-row">
            <input v-model="newJournal" class="journal-input" maxlength="500" placeholder="写下此刻的心情..." @keyup.enter="submitJournal" />
            <button class="add-btn" @click="submitJournal">
              <span>+</span>
            </button>
          </div>
          <div class="char-count" :class="{ warn: newJournal.length >= 450 }">{{ newJournal.length }}/500</div>
          <div class="journal-list">
            <div v-for="(item, i) in store.journal" :key="item.id || i" class="journal-item" @click="openJournalDetail(item)">
              <span v-if="item.mood" class="item-mood" :style="{ background: getMoodStyle(item.mood).bg }">{{ getMoodStyle(item.mood).icon }}</span>
              <div class="item-body">
                <span class="item-text">{{ item.text }}</span>
                <span class="item-time">{{ item.date }} {{ item.time }}</span>
              </div>
              <button class="item-del" @click.stop="store.removeJournal(i)">×</button>
            </div>
            <div v-if="store.journal.length === 0" class="empty-hint">还没有记录，写点什么吧~</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'calendar'" class="tab-content calendar-tab" :key="shop.equippedItems.calendar || 'calendar-default'"><PageCalendar /></div>
      <div v-if="activeTab === 'quote'" class="tab-content"><PageQuote @show-toast="emit('show-toast', $event)" /></div>
      <div v-if="activeTab === 'achieve'" class="tab-content"><PageAchieve /></div>
      <div v-if="activeTab === 'shop'" class="tab-content shop-tab"><PageShop @show-toast="emit('show-toast', $event)" /></div>
      <div v-if="activeTab === 'more'" class="tab-content"><PageMore @show-toast="emit('show-toast', $event)" /></div>
    </div>

    <!-- 签到特效 -->
    <CheckinEffect
      :show="showEffect"
      :effect="effectAnimation"
      :details="checkinDetails"
      @close="showEffect = false"
    />

    <!-- 底部导航 -->
    <nav class="bottom-nav glass" :class="{ 'nav-dark': shop.darkMode }">
      <button v-for="tab in tabs" :key="tab.id" class="nav-item" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <span class="nav-icon">{{ tab.icon }}</span>
        <span class="nav-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.page { flex: 1; min-height: 0; display: flex; flex-direction: column; position: relative; }
.dark-mode { background: linear-gradient(135deg, #13131f, #1a1a2e); }

.page-body {
  position: relative;
  flex: 1; min-height: 0;
  overflow-y: auto; overflow-x: hidden;
  padding-bottom: 88px;
  z-index: 0;
}

.tab-content {
  padding: 28px 36px 40px;
  display: flex; flex-direction: column; gap: 20px;
  max-width: 880px; margin: 0 auto; width: 100%;
  position: relative; z-index: 3;
}

/* ===== Hero 横幅 ===== */
.hero {
  border-radius: var(--radius-lg);
  padding: 32px 32px 28px;
  color: #fff; position: relative; overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.hero-glow {
  position: absolute; top: -60%; right: -25%;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.hero-content { position: relative; z-index: 1; }
.hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
.hero-date-area { display: flex; align-items: center; gap: 20px; }
.hero-day { font-size: 68px; font-weight: 900; line-height: 1; letter-spacing: -1px; text-shadow: 0 3px 16px rgba(0,0,0,0.2); }
.hero-meta { display: flex; flex-direction: column; gap: 6px; }
.hero-month { font-size: 18px; font-weight: 800; text-shadow: 0 1px 6px rgba(0,0,0,0.12); }
.hero-week { font-size: 14px; font-weight: 600; opacity: 0.9; text-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.hero-streak { text-align: right; }
.streak-num { font-size: 48px; font-weight: 900; line-height: 1; text-shadow: 0 3px 16px rgba(0,0,0,0.2); }
.streak-label { font-size: 14px; font-weight: 700; opacity: 0.9; margin-top: 3px; text-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.hero-quote {
  font-size: 20px; line-height: 1.9;
  padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.2);
  font-family: 'STXingkai', '华文行楷', 'XingKai', '行楷', 'STKaiti', 'KaiTi', '楷体', 'SimSun', cursive, serif;
  letter-spacing: 4px; font-weight: 400;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
  color: var(--quote-color, #e74c3c);
}
.hero-title-tag {
  display: inline-flex; align-items: center; gap: 8px;
  margin-bottom: 14px; padding: 8px 18px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border-radius: 24px; border: 1px solid rgba(255,255,255,0.25);
  font-size: 16px; font-weight: 700; color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.15);
  letter-spacing: 1px;
}
.hero-title-icon { font-size: 20px; }
.hero-title-name { font-size: 16px; }

/* ===== 季节活动 ===== */
.season-card {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 24px; border-radius: var(--radius-md);
  font-weight: 600; position: relative; overflow: hidden;
  color: #fff;
}
.season-glow {
  position: absolute; top: -50%; right: -20%;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}
.season-icon { font-size: 36px; z-index: 1; }
.season-info { flex: 1; z-index: 1; display: flex; flex-direction: column; gap: 2px; }
.season-name { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
.season-desc { font-size: 13px; opacity: 0.85; }
.season-right { display: flex; align-items: center; gap: 10px; z-index: 1; }
.season-badge {
  font-size: 13px; font-weight: 800;
  background: rgba(255,255,255,0.22); padding: 4px 12px;
  border-radius: 20px; white-space: nowrap;
}
.egg-btn {
  width: 40px; height: 40px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.4); font-size: 22px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s; animation: bounce 2s ease-in-out infinite;
}
.egg-btn:hover { transform: scale(1.2); }
.egg-btn.claimed { animation: none; opacity: 0.4; cursor: default; filter: grayscale(0.5); }
.egg-btn.claimed:hover { transform: none; }
.egg-btn:disabled { pointer-events: none; }
.egg-btn.just-claimed { animation: none; }
@keyframes bounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }

/* 彩蛋弹窗 */
.modal-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #e8e2d8; border-radius: var(--radius-xl);
  text-align: center; box-shadow: 0 32px 80px rgba(0,0,0,0.2);
}
.egg-modal { padding: 40px 44px 32px; max-width: 360px; width: 90%; }
.egg-top { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 14px; }
.egg-event-name { font-size: 14px; color: var(--c-text-muted); font-weight: 600; }
.egg-icon { font-size: 60px; margin-bottom: 10px; animation: float 1.5s ease-in-out infinite; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.egg-title { font-size: 18px; font-weight: 800; color: var(--c-text); margin-bottom: 14px; }
.egg-blessing {
  font-size: 14px; color: var(--c-text-secondary); font-style: italic; line-height: 1.6;
  padding: 12px 18px; background: #f8f8f8; border-radius: var(--radius-sm); margin-bottom: 18px;
}
.egg-reward { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 14px; }
.egg-num { font-size: 30px; font-weight: 900; color: var(--c-gold); }
.egg-encourage { font-size: 13px; color: var(--c-text-muted); margin-bottom: 18px; }
.journal-detail-modal { padding: 32px 36px 28px; max-width: 480px; width: 90%; text-align: left; }
.jd-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.jd-mood {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.jd-time { font-size: 13px; color: var(--c-text-muted); }
.jd-body {
  font-size: 14px; line-height: 1.8; color: var(--c-text);
  white-space: pre-wrap; word-break: break-word;
  max-height: 50vh; overflow-y: auto;
  padding: 16px; background: rgba(238,232,222,0.5);
  border-radius: var(--radius-sm); margin-bottom: 20px;
}
.btn-primary {
  padding: 14px 40px; border: none; border-radius: var(--radius-md);
  background: linear-gradient(135deg, #e85d75, #d4a853);
  color: #fff; font-size: 15px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 20px rgba(232,93,117,0.25);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,93,117,0.35); }

/* ===== 打卡按钮 ===== */
.checkin-btn {
  width: 100%; padding: 22px; border: none;
  border-radius: var(--radius-lg); cursor: pointer;
  background: linear-gradient(135deg, #e85d75, #d4a853);
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 8px 28px rgba(232,93,117,0.25);
  position: relative; overflow: hidden;
}
.checkin-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 50%);
  pointer-events: none;
}
.checkin-btn:hover:not(.done) { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(232,93,117,0.35); }
.checkin-btn:active:not(.done) { transform: translateY(0) scale(0.99); }
.checkin-btn.done {
  background: linear-gradient(135deg, #8fae9a, #a5c0ae);
  box-shadow: 0 8px 28px rgba(143,174,154,0.15); cursor: default;
}
.btn-inner { display: flex; align-items: center; justify-content: center; gap: 10px; position: relative; z-index: 1; }
.btn-text { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
.btn-shine {
  position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: shine 3s ease-in-out infinite;
}
@keyframes shine { 0% { left: -100%; } 100% { left: 100%; } }

/* ===== 数据卡片 ===== */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.stat-card {
  background: var(--c-surface); border-radius: var(--radius-md);
  padding: 20px 16px; text-align: center;
  border: 1px solid var(--c-border);
  backdrop-filter: blur(16px);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.stat-icon { font-size: 24px; margin-bottom: 8px; }
.stat-val {
  font-size: 30px; font-weight: 900; color: var(--c-text);
  line-height: 1.1; letter-spacing: -1px;
}
.fire-val { background: linear-gradient(135deg, #e85d75, #d4a853); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.gold-val { color: var(--c-gold); }
.stat-lbl { font-size: 13px; color: var(--c-text-muted); margin-top: 6px; font-weight: 500; }

/* ===== 日记卡片 ===== */
.journal-card { padding: 0; overflow: hidden; }
.card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 28px 14px;
}
.card-title { font-size: 16px; font-weight: 700; color: var(--c-text); letter-spacing: 0.3px; }
.card-count {
  font-size: 13px; font-weight: 700; color: var(--c-accent);
  background: rgba(232,93,117,0.06); padding: 4px 14px;
  border-radius: 20px; border: 1px solid rgba(232,93,117,0.1);
}
.mood-row { display: flex; align-items: center; gap: 8px; padding: 0 28px; }
.mood-lbl { font-size: 13px; color: var(--c-text-muted); font-weight: 500; margin-right: 4px; }
.mood-btn {
  width: 38px; height: 38px; border: 2px solid transparent;
  border-radius: var(--radius-sm); background: rgba(0,0,0,0.025);
  font-size: 18px; cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast);
  display: flex; align-items: center; justify-content: center;
}
.mood-btn:hover { background: rgba(0,0,0,0.05); transform: scale(1.1); }
.mood-btn.active { transform: scale(1.1); }
.input-row { display: flex; gap: 10px; padding: 12px 28px 0; }
.char-count {
  text-align: right; font-size: 13px; color: #999;
  padding: 4px 30px 0; font-weight: 600;
}
.char-count.warn { color: #ef4444; font-weight: 700; }
.journal-input {
  flex: 1; padding: 13px 18px;
  border: 1.5px solid rgba(0,0,0,0.06);
  border-radius: var(--radius-sm);
  font-size: 14px; color: var(--c-text);
  background: rgba(238,232,222,0.8);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.journal-input:focus {
  border-color: var(--c-accent); background: rgba(238,232,222,0.95);
  box-shadow: 0 0 0 4px rgba(232,93,117,0.06);
}
.journal-input::placeholder { color: var(--c-text-muted); }
.add-btn {
  width: 44px; height: 44px; flex-shrink: 0;
  border: none; border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #e85d75, #d4a853);
  color: #fff; font-size: 22px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  box-shadow: 0 4px 16px rgba(232,93,117,0.2);
}
.add-btn:hover { transform: scale(1.06); box-shadow: 0 6px 20px rgba(232,93,117,0.3); }
.journal-list { padding: 4px 28px 20px; display: flex; flex-direction: column; gap: 6px; }
.journal-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; background: rgba(238,232,222,0.6);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  cursor: pointer;
}
.journal-item:hover { background: rgba(238,232,222,0.85); }
.item-mood {
  width: 34px; height: 34px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.item-body { flex: 1; min-width: 0; }
.item-text {
  font-size: 14px; color: #5a5a66; display: -webkit-box; font-weight: 500;
  -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; text-overflow: ellipsis; word-break: break-word;
}
.item-time { font-size: 13px; color: var(--c-text-muted); margin-top: 3px; display: block; }
.item-del {
  width: 30px; height: 30px; border: none; border-radius: 8px;
  background: none; color: var(--c-text-muted); font-size: 18px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}
.item-del:hover { background: #fee2e2; color: #ef4444; }
.empty-hint { text-align: center; font-size: 14px; color: var(--c-text-muted); padding: 20px 0; }

/* ===== 底部导航 ===== */
.bottom-nav {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.4);
  backdrop-filter: blur(30px) saturate(1.4);
  -webkit-backdrop-filter: blur(30px) saturate(1.4);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  border: 1px solid rgba(255,255,255,0.5);
  z-index: 100;
}
.nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 10px 16px; border: none; background: none;
  cursor: pointer; border-radius: 16px;
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.nav-item:hover { background: rgba(0,0,0,0.04); }
.nav-item.active {
  background: linear-gradient(135deg, #e85d75, #d4a853);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(232,93,117,0.25);
}
.nav-icon { font-size: 20px; line-height: 1; }
.nav-label { font-size: 12px; font-weight: 600; color: var(--c-text-secondary); letter-spacing: 0.3px; }
.nav-item.active .nav-label { color: #fff; font-weight: 700; }

.nav-dark { background: rgba(19,19,31,0.92) !important; border-color: rgba(100,100,140,0.12) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important; }
.nav-dark .nav-item:hover { background: rgba(100,100,140,0.12) !important; }
.nav-dark .nav-label { color: #999 !important; }
.nav-dark .nav-item.active .nav-label { color: #fff !important; }

.shop-tab { padding: 0 !important; max-width: none !important; }
.calendar-tab { padding: 0 !important; max-width: none !important; }

</style>

<!-- 深色模式 — 全局覆盖 -->
<style>
/* 基础 */
.dark-mode { color-scheme: dark; background: linear-gradient(135deg, #13131f, #1a1a2e) !important; }
.dark-mode .page-body { background: linear-gradient(135deg, #13131f, #1a1a2e) !important; }
.dark-mode .page-body * { color: #e0e0f0 !important; }

/* 顶栏 */
.dark-mode .topbar { background: rgba(19,19,31,0.92) !important; border-bottom-color: rgba(100,100,140,0.1) !important; }

/* 导航 */
.dark-mode .bottom-nav { background: rgba(19,19,31,0.92) !important; border-color: rgba(100,100,140,0.1) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
.dark-mode .nav-item:hover { background: rgba(100,100,140,0.12) !important; }
.dark-mode .nav-label { color: #999 !important; }
.dark-mode .nav-item.active { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; box-shadow: 0 4px 16px rgba(100,100,140,0.25) !important; }
.dark-mode .nav-item.active .nav-label { color: #fff !important; }

/* Hero */
.dark-mode .hero { box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important; }
.dark-mode .hero-quote { opacity: 0.95 !important; text-shadow: 0 2px 12px rgba(0,0,0,0.5) !important; }
.dark-mode .hero .hero-quote { color: var(--quote-color) !important; }

/* 打卡按钮 */
.dark-mode .checkin-btn { box-shadow: 0 8px 28px rgba(0,0,0,0.3) !important; }

/* 数据卡片 */
.dark-mode .stat-card { background: rgba(22,22,38,0.88) !important; border-color: rgba(100,100,140,0.1) !important; }
.dark-mode .stat-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important; }
.dark-mode .stat-lbl { color: #777 !important; }

/* 日记 */
.dark-mode .journal-card { background: rgba(22,22,38,0.88) !important; border-color: rgba(100,100,140,0.1) !important; }
.dark-mode .card-count { color: #f9a8d4 !important; background: rgba(232,93,117,0.1) !important; border-color: rgba(232,93,117,0.1) !important; }
.dark-mode .mood-btn { background: rgba(30,30,50,0.6) !important; }
.dark-mode .journal-item { background: rgba(30,30,50,0.45) !important; }
.dark-mode .journal-item:hover { background: rgba(40,40,60,0.55) !important; }
.dark-mode .journal-input { background: rgba(30,30,50,0.6) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .journal-input:focus { background: rgba(30,30,50,0.8) !important; }
.dark-mode .item-text { color: #d0d0e0 !important; }
.dark-mode .item-time { color: #c8c8dc !important; }
.dark-mode .empty-hint { color: #555 !important; }
.dark-mode .item-del:hover { background: rgba(239,68,68,0.15) !important; }
.dark-mode .jd-body { background: rgba(30,30,50,0.5) !important; }

/* 输入框通用 */
.dark-mode input, .dark-mode textarea { background: rgba(30,30,50,0.6) !important; color: #e0e0f0 !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode input::placeholder, .dark-mode textarea::placeholder { color: #555 !important; }
.dark-mode input:focus, .dark-mode textarea:focus { background: rgba(30,30,50,0.8) !important; }

/* 弹窗 */
.dark-mode .modal-mask { background: rgba(0,0,0,0.6) !important; }
.dark-mode .modal-box { background: rgba(22,22,38,0.97) !important; }
.dark-mode .egg-blessing { background: rgba(40,40,60,0.5) !important; color: #999 !important; }

/* 通用卡片 */
.dark-mode .card { background: rgba(22,22,38,0.88) !important; border-color: rgba(100,100,140,0.1) !important; box-shadow: 0 2px 16px rgba(0,0,0,0.2) !important; }
.dark-mode .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important; }

/* 日历 */
.dark-mode .cal-page { background: linear-gradient(135deg, #13131f, #1a1a2e) !important; }
.dark-mode .cal-card { background: rgba(22,22,38,0.9) !important; }
.dark-mode .cal-top-bar { background: linear-gradient(135deg, #2a2a40, #3a3a52) !important; }
.dark-mode .cal-top-title { color: #d0d0e0 !important; }
.dark-mode .cal-top-date { color: #a0a0b8 !important; }
.dark-mode .cal-streak-num { color: #d0d0e0 !important; }
.dark-mode .cal-streak-label { color: #a0a0b8 !important; }
.dark-mode .cal-wk { color: #a0a0b8 !important; }
.dark-mode .cal-cell { background: rgba(30,30,50,0.5) !important; color: #a0a0b8 !important; }
.dark-mode .cal-cell.checked { color: #e0e0f0 !important; }
.dark-mode .cal-cell.today { background: rgba(50,50,75,0.7) !important; }
.dark-mode .cal-legend { border-top-color: rgba(100,100,140,0.2) !important; }
.dark-mode .legend-item { color: #a0a0b8 !important; }
.dark-mode .cal-stats { border-top-color: rgba(100,100,140,0.2) !important; }
.dark-mode .cal-stat-val { color: #d0d0e0 !important; }
.dark-mode .cal-stat-lbl { color: #a0a0b8 !important; }
.dark-mode .mood-stats { border-top-color: rgba(100,100,140,0.2) !important; }
.dark-mode .mood-stats-title { color: #a0a0b8 !important; }
.dark-mode .mood-stats-bar { background: rgba(30,30,50,0.6) !important; }
.dark-mode .mood-stat-item { color: #a0a0b8 !important; }
.dark-mode .cal-equipped-tag { background: rgba(100,100,140,0.15) !important; color: #a0a0b8 !important; }

/* 成就页 */
.dark-mode .ach-hero { background: rgba(22,22,38,0.88) !important; }
.dark-mode .ach-bar { background: rgba(50,50,70,0.5) !important; }
.dark-mode .ach-fill { opacity: 0.8; }
.dark-mode .ach-tag { background: rgba(30,30,50,0.7) !important; color: #999 !important; }
.dark-mode .ach-tag.active { background: rgba(100,100,180,0.18) !important; color: #fff !important; }
.dark-mode .ach-row { background: rgba(22,22,38,0.88) !important; border-bottom-color: rgba(100,100,140,0.08) !important; }
.dark-mode .ach-row.unlocked { background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02)) !important; }
.dark-mode .ach-emoji { background: rgba(30,30,50,0.7) !important; }
.dark-mode .ach-row.unlocked .ach-emoji { background: linear-gradient(135deg, #e85d75, #d4a853) !important; }
.dark-mode .ach-name { color: #d0d0e0 !important; }
.dark-mode .ach-desc { color: #777 !important; }
.dark-mode .ach-pts { color: #555 !important; }
.dark-mode .ach-ok { color: #34d399 !important; }
.dark-mode .ach-big-label { color: #777 !important; }
.dark-mode .ach-tag-label { color: #fff !important; }
.dark-mode .ach-tag-label.基础 { background: rgba(100,100,140,0.25) !important; color: #aaa !important; }
.dark-mode .ach-tag-label.进阶 { background: rgba(37,99,235,0.2) !important; color: #60a5fa !important; }
.dark-mode .ach-tag-label.挑战 { background: rgba(217,119,6,0.2) !important; color: #fbbf24 !important; }
.dark-mode .ach-tag-label.循环 { background: rgba(5,150,105,0.2) !important; color: #34d399 !important; }
.dark-mode .ach-tag-label.传说 { background: rgba(180,83,9,0.2) !important; color: #fbbf24 !important; }
.dark-mode .ach-tag-label.心情 { background: rgba(219,39,119,0.15) !important; color: #f472b6 !important; }
.dark-mode .ach-tag-label.消费 { background: rgba(124,58,237,0.15) !important; color: #a78bfa !important; }
.dark-mode .ach-tag-label.时光 { background: rgba(2,132,199,0.15) !important; color: #38bdf8 !important; }
.dark-mode .ach-tag-label.收集 { background: rgba(234,88,12,0.15) !important; color: #fb923c !important; }
.dark-mode .ach-tag-label.彩蛋 { background: rgba(202,138,4,0.15) !important; color: #fbbf24 !important; }

/* 语录页 */
.dark-mode .quote-showcase { background: rgba(22,22,38,0.88) !important; }
.dark-mode .quote-section { background: rgba(22,22,38,0.88) !important; }
.dark-mode .quote-action-btn { background: rgba(30,30,50,0.7) !important; color: #bbb !important; }
.dark-mode .quote-action-btn:hover { background: rgba(40,40,60,0.8) !important; }
.dark-mode .quote-input { background: rgba(30,30,50,0.6) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .quote-input:focus { background: rgba(30,30,50,0.8) !important; }
.dark-mode .quote-card { background: rgba(30,30,50,0.5) !important; }
.dark-mode .quote-card:hover { background: rgba(40,40,60,0.6) !important; }
.dark-mode .quote-card-text { color: #aaa !important; }
.dark-mode .pref-btn { background: rgba(30,30,50,0.7) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .pref-btn.active { background: rgba(100,100,180,0.1) !important; border-color: rgba(100,100,180,0.3) !important; }
.dark-mode .pref-name { color: #d0d0e0 !important; }
.dark-mode .pref-btn.active .pref-name { color: #818cf8 !important; }
.dark-mode .pref-action-btn { background: rgba(30,30,50,0.7) !important; border-color: rgba(100,100,140,0.12) !important; color: #aaa !important; }
.dark-mode .pref-hint { color: #666 !important; }
.dark-mode .quote-marks, .dark-mode .quote-marks-end { color: rgba(255,255,255,0.06) !important; }
.dark-mode .quote-text { color: #c8c8e0 !important; text-shadow: 0 1px 4px rgba(0,0,0,0.3) !important; }
.dark-mode .quote-card-text { color: #b0b0c8 !important; }
.dark-mode .quote-divider { opacity: 0.4; }
.dark-mode .section-title { color: #d0d0e0 !important; }
.dark-mode .section-count { background: rgba(232,93,117,0.1) !important; color: #f9a8d4 !important; border-color: rgba(232,93,117,0.1) !important; }
.dark-mode .dialogue-item { background: rgba(30,30,50,0.45) !important; }
.dark-mode .dialogue-item.unlocked { background: linear-gradient(135deg, rgba(232,93,117,0.06), rgba(212,168,83,0.04)) !important; }
.dark-mode .dialogue-text { color: #555 !important; }
.dark-mode .dialogue-item.unlocked .dialogue-text { color: #aaa !important; }

/* 商店页 */
.dark-mode .shop-page { background: transparent !important; }
.dark-mode .shop-header { background: transparent !important; }
.dark-mode .shop-title { color: #d0d0e0 !important; }
.dark-mode .shop-balance { background: rgba(212,168,83,0.08) !important; border-color: rgba(212,168,83,0.15) !important; color: #c8b870 !important; }
.dark-mode .shop-tabs { background: transparent !important; }
.dark-mode .tab-btn { background: rgba(30,30,50,0.6) !important; color: #888 !important; }
.dark-mode .tab-btn:hover { background: rgba(40,40,60,0.7) !important; }
.dark-mode .tab-btn.active { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; color: #e0e0f0 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important; }
.dark-mode .category-section { background: transparent !important; }
.dark-mode .category-header { background: transparent !important; }
.dark-mode .category-count { background: rgba(100,100,180,0.12) !important; color: #818cf8 !important; }
.dark-mode .item-card { background: rgba(22,22,38,0.85) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .item-card.owned { background: rgba(16,185,129,0.08) !important; border-color: rgba(16,185,129,0.25) !important; }
.dark-mode .item-card.equipped { background: rgba(212,168,83,0.08) !important; border-color: rgba(212,168,83,0.25) !important; }
.dark-mode .card-name { color: #d0d0e0 !important; }
.dark-mode .card-desc { color: #f0a050 !important; }
.dark-mode .card-action.buyable { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; }
.dark-mode .card-action.owned { background: rgba(16,185,129,0.25) !important; color: #6ee7b7 !important; }
.dark-mode .card-action.equipped { background: rgba(212,168,83,0.25) !important; color: #f0d48a !important; }
.dark-mode .gacha-bg { background: linear-gradient(180deg, #1a1a2e, #2d1b69) !important; }
.dark-mode .gacha-bg.premium { background: linear-gradient(180deg, #1a0a2e, #2d1b69 50%, #4a1942) !important; }
.dark-mode .limited-card { background: rgba(22,22,38,0.85) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .limited-card.owned { opacity: 0.5 !important; background: rgba(30,30,50,0.5) !important; }
.dark-mode .limited-name { color: #d0d0e0 !important; }
.dark-mode .limited-original { color: #555 !important; }
.dark-mode .limited-now { color: #f87171 !important; }
.dark-mode .limited-owned { color: #6ee7b7 !important; }
.dark-mode .title-current { background: rgba(212,168,83,0.06) !important; border-color: rgba(212,168,83,0.15) !important; color: #d0d0e0 !important; }
.dark-mode .title-card { background: rgba(22,22,38,0.85) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .title-card.owned { background: rgba(212,168,83,0.06) !important; border-color: rgba(212,168,83,0.2) !important; }
.dark-mode .title-card.equipped { border-color: rgba(212,168,83,0.35) !important; box-shadow: 0 0 0 2px rgba(212,168,83,0.1) !important; }
.dark-mode .title-name { color: #d0d0e0 !important; }
.dark-mode .title-desc { color: #777 !important; }
.dark-mode .title-locked { color: #555 !important; }
.dark-mode .title-equip-btn { background: linear-gradient(135deg, #92400e, #b45309) !important; }
.dark-mode .title-unequip-btn { background: rgba(100,100,140,0.2) !important; color: #999 !important; }
.dark-mode .title-buy-btn { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; }
.dark-mode .quote-cat-btn { background: rgba(22,22,38,0.85) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .quote-cat-btn.active { background: rgba(100,100,180,0.08) !important; border-color: rgba(100,100,180,0.3) !important; }
.dark-mode .quote-cat-name { color: #d0d0e0 !important; }
.dark-mode .quote-cat-btn.active .quote-cat-name { color: #818cf8 !important; }
.dark-mode .quote-cat-hint { color: #666 !important; }
.dark-mode .mine-group-title { color: #d0d0e0 !important; }
.dark-mode .mine-group-count { background: rgba(100,100,180,0.12) !important; color: #818cf8 !important; }
.dark-mode .empty-text { color: #777 !important; }
.dark-mode .empty-sub { color: #555 !important; }

/* 商店弹窗 */
.dark-mode .purchase-modal { background: rgba(22,22,38,0.97) !important; }
.dark-mode .purchase-name { color: #d0d0e0 !important; }
.dark-mode .purchase-cat { color: #777 !important; }
.dark-mode .purchase-desc { background: rgba(30,30,50,0.5) !important; color: #aaa !important; }
.dark-mode .result-desc { background: rgba(212,168,83,0.08) !important; color: #f0d48a !important; }
.dark-mode .purchase-owned-badge { background: rgba(16,185,129,0.1) !important; border-color: rgba(16,185,129,0.2) !important; color: #6ee7b7 !important; }
.dark-mode .purchase-hint { color: #666 !important; }
.dark-mode .price-val { color: #f0d48a !important; }
.dark-mode .price-label { color: #666 !important; }
.dark-mode .purchase-balance .price-val { color: #d0d0e0 !important; }
.dark-mode .purchase-divider { background: rgba(100,100,140,0.15) !important; }
.dark-mode .purchase-info { background: rgba(30,30,50,0.4) !important; }
.dark-mode .quote-preview-item { background: rgba(30,30,50,0.5) !important; color: #aaa !important; }
.dark-mode .quote-preview-title { color: #777 !important; }
.dark-mode .btn-cancel { background: rgba(30,30,50,0.5) !important; border-color: rgba(100,100,140,0.15) !important; color: #bbb !important; }
.dark-mode .btn-confirm { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; }
.dark-mode .btn-buy-again { background: linear-gradient(135deg, #92400e, #b45309) !important; }
.dark-mode .gacha-result-modal { background: rgba(22,22,38,0.97) !important; }
.dark-mode .gacha-result-item { background: rgba(30,30,50,0.5) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .result-name { color: #d0d0e0 !important; }
.dark-mode .gacha-preview-modal { background: rgba(22,22,38,0.97) !important; }
.dark-mode .preview-rarity-title { color: #d0d0e0 !important; }
.dark-mode .preview-item { border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .preview-item.owned { background: rgba(16,185,129,0.08) !important; border-color: rgba(16,185,129,0.2) !important; }
.dark-mode .preview-item-name { color: #aaa !important; }
.dark-mode .preview-item.owned .preview-item-name { color: #6ee7b7 !important; }
.dark-mode .purchase-level { background: linear-gradient(135deg, #92400e, #b45309) !important; }
.dark-mode .modal-ok { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; }

/* 更多页 */
.dark-mode .setting-row { border-bottom-color: rgba(100,100,140,0.08) !important; }
.dark-mode .setting-row:hover { background: rgba(100,100,140,0.06) !important; }
.dark-mode .setting-label { color: #d0d0e0 !important; }
.dark-mode .setting-val { color: #777 !important; }
.dark-mode .setting-arrow { color: #555 !important; }
.dark-mode .setting-row.danger .setting-label { color: #f87171 !important; }
.dark-mode .btn-next { background: linear-gradient(135deg, #e85d75, #d4a853) !important; }
.dark-mode .btn-next.warn { background: linear-gradient(135deg, #f97316, #fb923c) !important; }
.dark-mode .btn-next.danger { background: linear-gradient(135deg, #dc2626, #ef4444) !important; }

/* 时间线 */
.dark-mode .timeline-wrap { background: rgba(22,22,38,0.88) !important; }
.dark-mode .tl-header { color: #d0d0e0 !important; }
.dark-mode .tl-content { color: #aaa !important; }
.dark-mode .tl-line { background: linear-gradient(180deg, rgba(100,100,140,0.2), rgba(100,100,140,0.05)) !important; }

/* 按钮通用 */
.dark-mode button { background: inherit; }
.dark-mode .gacha-btn { color: #fff !important; }
.dark-mode .gacha-btn.single { background: linear-gradient(135deg, #3a3a50, #4a4a60) !important; }
.dark-mode .gacha-btn.multi { background: linear-gradient(135deg, #4a3a60, #5a4a70) !important; }
</style>
