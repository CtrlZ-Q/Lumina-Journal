import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loadState, saveState } from '../composables/useStorage'
import { catalog } from '../data/catalog'
import { getActiveSeasonalEvent, moodOptions } from '../data/seasonalEvents'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function defaultState() {
  return {
    checkins: [],
    coins: 0,
    achievements: [],
    collectedDialogues: [],
    collectedFragments: [],
    dailyEvent: null,
    journal: [],
    favoriteQuotes: [],
    repeatableCounts: {},
    totalSpent: 0,
    hasEarlyBird: false,
    hasNightOwl: false,
    timeLetters: [],
  }
}

export const useGameStore = defineStore('game', () => {
  const saved = loadState()
  const state = saved ? { ...defaultState(), ...saved } : defaultState()

  const checkins = ref(state.checkins)
  const coins = ref(state.coins)
  const achievements = ref(state.achievements)
  const collectedDialogues = ref(state.collectedDialogues)
  const collectedFragments = ref(state.collectedFragments)
  const dailyEvent = ref(state.dailyEvent)
  const journal = ref(state.journal)
  const favoriteQuotes = ref(state.favoriteQuotes)
  const repeatableCounts = ref(state.repeatableCounts || {})
  const totalSpent = ref(state.totalSpent || 0)
  const hasEarlyBird = ref(state.hasEarlyBird || false)
  const hasNightOwl = ref(state.hasNightOwl || false)
  const timeLetters = ref(state.timeLetters || [])

  const checkedToday = computed(() => checkins.value.includes(today()))

  function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const streakDays = computed(() => {
    const sorted = [...checkins.value].sort().reverse()
    if (sorted.length === 0 || sorted[0] !== today()) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (sorted.length === 0 || sorted[0] !== dateStr(yesterday)) return 0
    }
    let streak = 0
    const d = new Date()
    if (sorted[0] !== today()) d.setDate(d.getDate() - 1)
    while (true) {
      if (sorted.includes(dateStr(d))) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  })

  const totalCheckins = computed(() => checkins.value.length)

  watch([checkins, coins, achievements, collectedDialogues, collectedFragments, dailyEvent, journal, favoriteQuotes, repeatableCounts, totalSpent, hasEarlyBird, hasNightOwl, timeLetters], () => {
    saveState({
      checkins: checkins.value,
      coins: coins.value,
      achievements: achievements.value,
      collectedDialogues: collectedDialogues.value,
      collectedFragments: collectedFragments.value,
      dailyEvent: dailyEvent.value,
      journal: journal.value,
      favoriteQuotes: favoriteQuotes.value,
      repeatableCounts: repeatableCounts.value,
      totalSpent: totalSpent.value,
      hasEarlyBird: hasEarlyBird.value,
      hasNightOwl: hasNightOwl.value,
      timeLetters: timeLetters.value,
    })
  }, { deep: true })

  function checkIn() {
    if (checkedToday.value) return null
    checkins.value.push(today())
    const base = 10
    const streakBonus = Math.min(Math.floor(streakDays.value / 7) * 5, 20)
    const random = Math.floor(Math.random() * (11 + streakBonus))
    let reward = base + random
    // 季节活动金币加成
    const season = getActiveSeasonalEvent()
    if (season && season.coinBonus > 1) {
      reward = Math.round(reward * season.coinBonus)
    }
    // 装备金币加成（主题+相框）
    try {
      const shopRaw = localStorage.getItem('dino-app-shop')
      if (shopRaw) {
        const shopData = JSON.parse(shopRaw)
        const equipped = shopData.equippedItems || {}
        let bonusRate = 0
        // 主题加成
        if (equipped.theme) {
          const theme = catalog.find(i => i.id === equipped.theme)
          if (theme?.data?.bonus) bonusRate += theme.data.bonus
        }
        // 相框加成
        if (equipped.frame) {
          const frame = catalog.find(i => i.id === equipped.frame)
          if (frame?.data?.bonus) bonusRate += frame.data.bonus
        }
        // 拥有数量加成
        const ownedCount = (shopData.purchasedItems || []).length
        bonusRate += Math.min(Math.floor(ownedCount / 5), 10)
        bonusRate = Math.min(bonusRate, 30)
        if (bonusRate > 0) {
          reward = Math.round(reward * (100 + bonusRate) / 100)
        }
      }
    } catch {}
    coins.value += reward

    // 时间成就
    const hour = new Date().getHours()
    if (hour < 8) {
      hasEarlyBird.value = true
      if (unlockAchievement('early_bird', 15)) pendingToasts.push('🐦 早起打卡！+15币')
    }
    if (hour >= 22) {
      hasNightOwl.value = true
      if (unlockAchievement('night_owl', 15)) pendingToasts.push('🦉 夜猫子打卡！+15币')
    }

    checkAchievements()
    return reward
  }

  function getDialogue() {
    const base = [
      '今天也要加油哦~',
      '打卡使我快乐！',
      '坚持就是胜利！',
      '你来啦~',
      '今天天气真好呢',
      '一起努力吧！',
      '加油加油！',
      '你是最棒的！',
    ]
    // 季节活动免费语录
    const season = getActiveSeasonalEvent()
    if (season && season.freeQuotes) {
      base.push(...season.freeQuotes)
    }
    // 扩展语录包（从 shop store 的 localStorage 读取，避免循环依赖）
    try {
      const shopRaw = localStorage.getItem('dino-app-shop')
      if (shopRaw) {
        const shopData = JSON.parse(shopRaw)
        const selected = shopData.selectedQuoteCategories || []
        const explicitlySet = shopData.quoteCategoriesExplicitlySet || false
        const extra = (shopData.purchasedItems || [])
          .filter(id => {
            const item = catalog.find(i => i.id === id)
            if (!item || item.category !== 'quote') return false
            // 主动卸下了全部类别 → 不显示任何扩展语录
            if (explicitlySet && selected.length === 0) return false
            // 有选择类别，只包含选中的；没选则全部显示
            if (selected.length > 0 && !selected.includes(id)) return false
            return true
          })
          .flatMap(id => catalog.find(i => i.id === id).data.quotes)
        if (extra.length > 0) {
          base.push(...extra)
        }
        // 隐藏台词（购买特定商品解锁）
        const hiddenDialogues = [
          { id: 'hd_theme_aurora', itemId: 'theme_aurora', text: '极光之下，万物皆可期~' },
          { id: 'hd_theme_galaxy', itemId: 'theme_galaxy', text: '银河深处，藏着你的专属星辰✨' },
          { id: 'hd_theme_black', itemId: 'theme_black', text: '星空黑的秘密：黑夜给了我黑色的眼睛~' },
          { id: 'hd_theme_cyber', itemId: 'theme_cyber', text: '赛博朋克：欢迎来到2077年！' },
          { id: 'hd_effect_galaxy', itemId: 'effect_galaxy', text: '银河漩涡启动！准备穿越时空~' },
          { id: 'hd_effect_aurora', itemId: 'effect_aurora', text: '极光绽放，好运将至！' },
          { id: 'hd_effect_magic', itemId: 'effect_magic_circle', text: '魔法阵展开！今日份的魔法已到账~' },
          { id: 'hd_frame_aurora', itemId: 'frame_aurora', text: '极光相框：每张周报都是一幅画~' },
          { id: 'hd_frame_galaxy', itemId: 'frame_galaxy', text: '银河相框：你的周报闪闪发光！' },
          { id: 'hd_frame_gold', itemId: 'frame_gold', text: '金光闪闪！土豪专属周报~' },
          { id: 'hd_sound_space', itemId: 'sound_space', text: '太空音效：3...2...1...发射！🚀' },
          { id: 'hd_sound_crystal', itemId: 'sound_crystal', text: '水晶之音，清脆悦耳~' },
        ]
        const unlocked = shopData.unlockedHiddenDialogues || []
        const hiddenTexts = hiddenDialogues
          .filter(hd => unlocked.includes(hd.id) || shopData.purchasedItems.includes(hd.itemId))
          .map(hd => hd.text)
        if (hiddenTexts.length > 0) {
          base.push(...hiddenTexts)
        }
      }
    } catch {}
    return base[Math.floor(Math.random() * base.length)]
  }

  function hasAchievement(id) {
    return achievements.value.some(a => a.id === id)
  }

  function unlockAchievement(id, reward = 0) {
    if (hasAchievement(id)) return false
    achievements.value.push({ id, unlockedAt: today() })
    if (reward > 0) coins.value += reward
    return true
  }

  let pendingToasts = []

  // 循环成就计数器

  function getRepeatCount(id) {
    return repeatableCounts.value[id] || 0
  }

  function incrementRepeat(id) {
    repeatableCounts.value[id] = (repeatableCounts.value[id] || 0) + 1
  }

  // 检查本周是否满勤（周一到周日全部打卡）
  function isPerfectWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=周日
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)) // 周一开始
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      if (d > now) break // 还没到的日子跳过
      if (!checkins.value.includes(dateStr(d))) return false
    }
    return true // 7天全部打卡
  }

  // 检查本月是否满勤
  function isPerfectMonth() {
    const now = new Date()
    const todayDate = now.getDate()
    for (let d = 1; d <= todayDate; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (!checkins.value.includes(ds)) return false
    }
    return true
  }

  function checkAchievements() {
    const newToasts = []
    const streak = streakDays.value
    const total = totalCheckins.value
    const now = new Date()
    const day = now.getDay()

    // ===== 一次性成就：连续打卡 =====
    if (streak >= 3 && unlockAchievement('streak_3', 20)) newToasts.push('🏆 初露锋芒！+20币')
    if (streak >= 7 && unlockAchievement('streak_7', 50)) newToasts.push('🏆 一周坚持！+50币')
    if (streak >= 14 && unlockAchievement('streak_14', 100)) newToasts.push('🏆 两周不辍！+100币')
    if (streak >= 30 && unlockAchievement('streak_30', 200)) newToasts.push('🏆 月度达人！+200币')
    if (streak >= 100 && unlockAchievement('streak_100', 500)) newToasts.push('🏆 百日王者！+500币')
    if (streak >= 365 && unlockAchievement('streak_365', 2000)) newToasts.push('🏆 年度传说！+2000币')

    // ===== 一次性成就：累计打卡 =====
    if (total >= 10 && unlockAchievement('total_10', 30)) newToasts.push('🏆 起步！+30币')
    if (total >= 50 && unlockAchievement('total_50', 150)) newToasts.push('🏆 半百！+150币')
    if (total >= 100 && unlockAchievement('total_100', 300)) newToasts.push('🏆 百日纪念！+300币')
    if (total >= 365 && unlockAchievement('total_365', 1000)) newToasts.push('🏆 年度传奇！+1000币')
    if (total >= 500 && unlockAchievement('total_500', 1500)) newToasts.push('🏆 五百天！+1500币')
    if (total >= 1000 && unlockAchievement('total_1000', 3000)) newToasts.push('🏆 千日征程！+3000币')

    // ===== 一次性成就：金币 =====
    if (coins.value >= 100 && unlockAchievement('coin_100', 30)) newToasts.push('🏆 小富即安！+30币')
    if (coins.value >= 500 && unlockAchievement('coin_500', 80)) newToasts.push('🏆 财源广进！+80币')
    if (coins.value >= 1000 && unlockAchievement('coin_1000', 150)) newToasts.push('🏆 日进斗金！+150币')
    if (coins.value >= 5000 && unlockAchievement('coin_5000', 500)) newToasts.push('🏆 金币大亨！+500币')
    if (coins.value >= 10000 && unlockAchievement('coin_10000', 1000)) newToasts.push('🏆 金币帝王！+1000币')

    // ===== 一次性成就：日记 =====
    if (journal.value.length >= 5 && unlockAchievement('journal_5', 20)) newToasts.push('🏆 心声记录者！+20币')
    if (journal.value.length >= 20 && unlockAchievement('journal_20', 60)) newToasts.push('🏆 日记达人！+60币')
    if (journal.value.length >= 50 && unlockAchievement('journal_50', 150)) newToasts.push('🏆 日记大师！+150币')
    if (journal.value.length >= 100 && unlockAchievement('journal_100', 300)) newToasts.push('🏆 百篇心声！+300币')

    // ===== 一次性成就：收藏 =====
    if (favoriteQuotes.value.length >= 1 && unlockAchievement('quote_collect', 10)) newToasts.push('🏆 语录猎人！+10币')
    if (favoriteQuotes.value.length >= 5 && unlockAchievement('quote_5', 40)) newToasts.push('🏆 名言收藏家！+40币')
    if (favoriteQuotes.value.length >= 10 && unlockAchievement('quote_10', 80)) newToasts.push('🏆 语录百晓生！+80币')
    if (favoriteQuotes.value.length >= 20 && unlockAchievement('quote_20', 150)) newToasts.push('🏆 语录图书馆！+150币')

    // ===== 一次性成就：隐藏台词 =====
    if (collectedDialogues.value.length >= 8 && unlockAchievement('dialogue_all', 100)) newToasts.push('🏆 知心好友！+100币')

    // ===== 一次性成就：特殊时间 =====
    if ((day === 0 || day === 6) && streak >= 2 && unlockAchievement('weekend', 25)) newToasts.push('🏆 周末不松懈！+25币')

    // ===== 长期挑战成就 =====
    // 连续早起打卡 7 天（仅在签到当天且8点前递增，防止刷新刷次数）
    const hour = new Date().getHours()
    const todayStr = today()
    const lastEarlyDate = repeatableCounts.value['early_streak_date'] || ''
    const yesterdayOfToday = new Date(now)
    yesterdayOfToday.setDate(yesterdayOfToday.getDate() - 1)
    const yesterdayStr = dateStr(yesterdayOfToday)
    if (hour < 8 && checkedToday.value && lastEarlyDate !== todayStr) {
      const earlyStreak = getRepeatCount('early_streak') + 1
      repeatableCounts.value['early_streak'] = earlyStreak
      repeatableCounts.value['early_streak_date'] = todayStr
      if (earlyStreak >= 7 && unlockAchievement('early_bird_7', 100)) newToasts.push('🏆 晨光行者！连续7天早起+100币')
      if (earlyStreak >= 30 && unlockAchievement('early_bird_30', 500)) newToasts.push('🏆 日出之王！连续30天早起+500币')
    } else if (lastEarlyDate !== todayStr && lastEarlyDate !== yesterdayStr && lastEarlyDate !== '') {
      repeatableCounts.value['early_streak'] = 0
    }

    // 连续深夜打卡 7 天（仅在签到当天且22点后递增）
    const lastNightDate = repeatableCounts.value['night_streak_date'] || ''
    const yesterdayOfToday2 = new Date(now)
    yesterdayOfToday2.setDate(yesterdayOfToday2.getDate() - 1)
    const yesterdayStr2 = dateStr(yesterdayOfToday2)
    if (hour >= 22 && checkedToday.value && lastNightDate !== todayStr) {
      const nightStreak = getRepeatCount('night_streak') + 1
      repeatableCounts.value['night_streak'] = nightStreak
      repeatableCounts.value['night_streak_date'] = todayStr
      if (nightStreak >= 7 && unlockAchievement('night_owl_7', 100)) newToasts.push('🏆 暗夜行者！连续7天深夜+100币')
    } else if (lastNightDate !== todayStr && lastNightDate !== yesterdayStr2 && lastNightDate !== '') {
      repeatableCounts.value['night_streak'] = 0
    }

    // ===== 循环成就：每周满勤 =====
    const lastPerfectWeekDate = repeatableCounts.value['perfect_week_date'] || ''
    if (day === 0 && isPerfectWeek() && lastPerfectWeekDate !== todayStr) {
      repeatableCounts.value['perfect_week_date'] = todayStr
      incrementRepeat('perfect_week')
      const count = getRepeatCount('perfect_week')
      if (count >= 1 && unlockAchievement('perfect_week_1', 50)) newToasts.push('🏆 首次周满勤！+50币')
      if (count >= 4 && unlockAchievement('perfect_week_4', 150)) newToasts.push('🏆 四周满勤！+150币')
      if (count >= 12 && unlockAchievement('perfect_week_12', 500)) newToasts.push('🏆 季度全勤！+500币')
      if (count >= 52 && unlockAchievement('perfect_week_52', 2000)) newToasts.push('🏆 年度全勤！+2000币')
    }

    // ===== 循环成就：每月满勤 =====
    const todayDate = now.getDate()
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const lastPerfectMonthDate = repeatableCounts.value['perfect_month_date'] || ''
    if (todayDate === lastDay && isPerfectMonth() && lastPerfectMonthDate !== todayStr) {
      repeatableCounts.value['perfect_month_date'] = todayStr
      incrementRepeat('perfect_month')
      const count = getRepeatCount('perfect_month')
      if (count >= 1 && unlockAchievement('perfect_month_1', 200)) newToasts.push('🏆 首次月满勤！+200币')
      if (count >= 3 && unlockAchievement('perfect_month_3', 500)) newToasts.push('🏆 三月连勤！+500币')
      if (count >= 6 && unlockAchievement('perfect_month_6', 1000)) newToasts.push('🏆 半年全勤！+1000币')
      if (count >= 12 && unlockAchievement('perfect_month_12', 3000)) newToasts.push('🏆 年度月月满勤！+3000币')
    }

    // ===== 循环成就：金币里程碑（每500币循环） =====
    const coinMilestone = Math.floor(coins.value / 500)
    const prevMilestone = getRepeatCount('coin_milestone')
    if (coinMilestone > prevMilestone) {
      repeatableCounts.value['coin_milestone'] = coinMilestone
      // 每突破一个500币里程碑给奖励
      const bonus = 20 * coinMilestone
      coins.value += bonus
      newToasts.push(`💰 金币里程碑！累计${coinMilestone * 500}币 +${bonus}币`)
    }

    // ===== 循环成就：累计打卡里程碑（每100天循环） =====
    const totalMilestone = Math.floor(total / 100)
    const prevTotalMilestone = getRepeatCount('total_milestone')
    if (totalMilestone > prevTotalMilestone) {
      repeatableCounts.value['total_milestone'] = totalMilestone
      const bonus = 50 * totalMilestone
      coins.value += bonus
      newToasts.push(`📅 打卡里程碑！累计${totalMilestone * 100}天 +${bonus}币`)
    }

    pendingToasts = [...pendingToasts, ...newToasts]
    return newToasts
  }

  const hiddenDialoguePool = [
    { id: 'dlg_1', text: '你知道吗？我其实是从白垩纪来的~' },
    { id: 'dlg_2', text: '嘘...我藏了一颗星星给你' },
    { id: 'dlg_3', text: '每次你来打卡，我尾巴就会摇一下' },
    { id: 'dlg_4', text: '听说今天有流星雨，一起看？' },
    { id: 'dlg_5', text: '你是不是偷偷变厉害了？我感觉到了！' },
    { id: 'dlg_6', text: '如果我是人类，一定也天天打卡' },
    { id: 'dlg_7', text: '别走！再陪我聊五毛钱的~' },
    { id: 'dlg_8', text: '我觉得...你比昨天更好看了（恐龙直觉）' },
  ]

  function triggerEvent() {
    const roll = Math.random() * 100
    let event
    if (roll < 5) {
      // 彩蛋事件 5%
      const bonus = 50
      coins.value += bonus
      event = { type: 'rare', icon: '🌟', title: '彩蛋事件！', desc: '发现了一颗稀有宝石！', reward: `+${bonus} 币` }
    } else if (roll < 20) {
      // 隐藏对话 15% (5~20)
      const uncollected = hiddenDialoguePool.filter(d => !collectedDialogues.value.includes(d.id))
      const dialogue = uncollected.length > 0
        ? uncollected[Math.floor(Math.random() * uncollected.length)]
        : hiddenDialoguePool[Math.floor(Math.random() * hiddenDialoguePool.length)]
      if (!collectedDialogues.value.includes(dialogue.id)) {
        collectedDialogues.value.push(dialogue.id)
      }
      event = { type: 'dialogue', icon: '🎭', title: '隐藏对话', desc: dialogue.text, reward: null }
    } else if (roll < 35) {
      // 蛋孵化 15% (20~35)
      const fragId = `frag_${collectedFragments.value.length + 1}`
      if (collectedFragments.value.length < 12) {
        collectedFragments.value.push(fragId)
      }
      event = { type: 'hatch', icon: '🥚', title: '蛋孵化事件！', desc: `获得了恐龙进化碎片！(${collectedFragments.value.length}/12)`, reward: null }
    } else if (roll < 70) {
      // 好运事件 35% (35~70)
      const bonus = 10 + Math.floor(Math.random() * 21)
      coins.value += bonus
      event = { type: 'lucky', icon: '🎁', title: '好运降临！', desc: '今天运气不错哦~', reward: `+${bonus} 币` }
    } else {
      // 普通事件 25% (70~100)
      event = { type: 'normal', icon: '⚡', title: '平稳日常', desc: '平平淡淡才是真~', reward: null }
    }
    dailyEvent.value = { date: today(), event }
    return event
  }

  function popToasts() {
    const t = [...pendingToasts]
    pendingToasts = []
    return t
  }

  function resetState() {
    checkins.value = []
    coins.value = 0
    achievements.value = []
    collectedDialogues.value = []
    collectedFragments.value = []
    dailyEvent.value = null
    journal.value = []
    favoriteQuotes.value = []
    repeatableCounts.value = {}
    pendingToasts = []
  }

  function addJournal(text, mood = null) {
    journal.value.unshift({ text, date: today(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), mood: mood || null })
    checkAchievements()
  }

  function removeJournal(index) {
    journal.value.splice(index, 1)
  }

  function addFavoriteQuote(text) {
    if (!favoriteQuotes.value.includes(text)) {
      favoriteQuotes.value.unshift(text)
      checkAchievements()
    }
  }

  function removeFavoriteQuote(index) {
    favoriteQuotes.value.splice(index, 1)
  }

  // 获取本月心情统计
  function getMoodStats(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    const stats = {}
    moodOptions.forEach(m => { stats[m.key] = 0 })
    journal.value.forEach(j => {
      if (j.date && j.date.startsWith(prefix) && j.mood) {
        stats[j.mood] = (stats[j.mood] || 0) + 1
      }
    })
    return stats
  }

  // 获取某天的心情（取最后一条有心情的日记）
  function getDayMood(dateStr) {
    const entry = journal.value.find(j => j.date === dateStr && j.mood)
    return entry ? entry.mood : null
  }

  // 当前季节活动
  const activeSeasonalEvent = computed(() => getActiveSeasonalEvent())

  // ===== 时光邮箱 =====
  function addTimeLetter(title, text, openDate) {
    timeLetters.value.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      text,
      createdAt: today(),
      openDate,
      opened: false,
    })
  }

  function openTimeLetter(id) {
    const letter = timeLetters.value.find(l => l.id === id)
    if (letter && letter.openDate <= today()) {
      letter.opened = true
    }
  }

  function removeTimeLetter(id) {
    const idx = timeLetters.value.findIndex(l => l.id === id)
    if (idx !== -1) timeLetters.value.splice(idx, 1)
  }

  const pendingLetters = computed(() => timeLetters.value.filter(l => !l.opened && l.openDate > today()))
  const openableLetters = computed(() => timeLetters.value.filter(l => !l.opened && l.openDate <= today()))
  const openedLetters = computed(() => timeLetters.value.filter(l => l.opened))

  return {
    checkins, coins, achievements,
    collectedDialogues, collectedFragments, dailyEvent,
    journal, favoriteQuotes,
    checkedToday, streakDays, totalCheckins,
    totalSpent, hasEarlyBird, hasNightOwl,
    checkIn, triggerEvent, getDialogue, hasAchievement, unlockAchievement,
    checkAchievements, popToasts, resetState,
    addJournal, removeJournal, addFavoriteQuote, removeFavoriteQuote,
    getMoodStats, getDayMood, activeSeasonalEvent,
    timeLetters, addTimeLetter, openTimeLetter, removeTimeLetter,
    pendingLetters, openableLetters, openedLetters,
  }
})
