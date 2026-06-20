import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loadState, saveState, SHOP_KEY } from '../composables/useStorage'
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
    journal: [],
    favoriteQuotes: [],
    repeatableCounts: {},
    totalSpent: 0,
    hasEarlyBird: false,
    hasNightOwl: false,
    timeLetters: [],
    coinLog: [],
    usedMoods: [],
    moodStreakDays: { count: 0, lastDate: '' },
    weekendCheckins: 0,
    letterSentCount: 0,
    letterOpenedCount: 0,
    diaryStreak: { count: 0, lastDate: '' },
    quoteCollectStreak: { count: 0, lastDate: '' },
    comboDailyDone: { checkin: false, diary: false, quote: false, date: '' },
    minCoinsEver: 999999,
    coinRecoveryTriggered: false,
  }
}

export const useGameStore = defineStore('game', () => {
  const saved = loadState()
  const state = saved ? { ...defaultState(), ...saved } : defaultState()

  const checkins = ref(state.checkins)
  const coins = ref(state.coins)
  const achievements = ref(state.achievements)
  const collectedDialogues = ref(state.collectedDialogues)
  const journal = ref(state.journal)
  const favoriteQuotes = ref(state.favoriteQuotes)
  const repeatableCounts = ref(state.repeatableCounts || {})
  const totalSpent = ref(state.totalSpent || 0)
  const hasEarlyBird = ref(state.hasEarlyBird || false)
  const hasNightOwl = ref(state.hasNightOwl || false)
  const timeLetters = ref(state.timeLetters || [])
  const coinLog = ref(state.coinLog || [])
  const usedMoods = ref(state.usedMoods || [])
  const moodStreakDays = ref(state.moodStreakDays || { count: 0, lastDate: '' })
  const weekendCheckins = ref(state.weekendCheckins || 0)
  const letterSentCount = ref(state.letterSentCount || 0)
  const letterOpenedCount = ref(state.letterOpenedCount || 0)
  const diaryStreak = ref(state.diaryStreak || { count: 0, lastDate: '' })
  const quoteCollectStreak = ref(state.quoteCollectStreak || { count: 0, lastDate: '' })
  const comboDailyDone = ref(state.comboDailyDone || { checkin: false, diary: false, quote: false, date: '' })
  const minCoinsEver = ref(state.minCoinsEver ?? 999999)
  const coinRecoveryTriggered = ref(state.coinRecoveryTriggered || false)

  function logCoin(amount, reason) {
    const now = new Date()
    const time = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    coinLog.value.unshift({ time, amount, reason, balance: coins.value })
    if (coinLog.value.length > 200) coinLog.value.length = 200
  }

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

  watch([checkins, coins, achievements, collectedDialogues, journal, favoriteQuotes, repeatableCounts, totalSpent, hasEarlyBird, hasNightOwl, timeLetters, coinLog, usedMoods, moodStreakDays, weekendCheckins, letterSentCount, letterOpenedCount, diaryStreak, quoteCollectStreak, comboDailyDone, minCoinsEver, coinRecoveryTriggered], () => {
    saveState({
      checkins: checkins.value,
      coins: coins.value,
      achievements: achievements.value,
      collectedDialogues: collectedDialogues.value,
      journal: journal.value,
      favoriteQuotes: favoriteQuotes.value,
      repeatableCounts: repeatableCounts.value,
      totalSpent: totalSpent.value,
      hasEarlyBird: hasEarlyBird.value,
      hasNightOwl: hasNightOwl.value,
      timeLetters: timeLetters.value,
      coinLog: coinLog.value,
      usedMoods: usedMoods.value,
      moodStreakDays: moodStreakDays.value,
      weekendCheckins: weekendCheckins.value,
      letterSentCount: letterSentCount.value,
      letterOpenedCount: letterOpenedCount.value,
      diaryStreak: diaryStreak.value,
      quoteCollectStreak: quoteCollectStreak.value,
      comboDailyDone: comboDailyDone.value,
      minCoinsEver: minCoinsEver.value,
      coinRecoveryTriggered: coinRecoveryTriggered.value,
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
      const shopData = loadState(SHOP_KEY)
      if (shopData) {
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
    logCoin(reward, '📅 签到')

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

    // 连续早起打卡（仅在签到时检测，防止日记写入刷次数）
    const todayStr = today()
    const yesterdayOfToday = new Date()
    yesterdayOfToday.setDate(yesterdayOfToday.getDate() - 1)
    const yesterdayStr = dateStr(yesterdayOfToday)

    const lastEarlyDate = repeatableCounts.value['early_streak_date'] || ''
    if (lastEarlyDate !== '' && lastEarlyDate !== todayStr && lastEarlyDate !== yesterdayStr) {
      repeatableCounts.value['early_streak'] = 0
    }
    if (hour < 8 && lastEarlyDate !== todayStr) {
      const earlyStreak = getRepeatCount('early_streak') + 1
      repeatableCounts.value['early_streak'] = earlyStreak
      repeatableCounts.value['early_streak_date'] = todayStr
      if (earlyStreak >= 7 && unlockAchievement('early_bird_7', 100)) pendingToasts.push('🏆 晨光行者！连续7天早起+100币')
      if (earlyStreak >= 30 && unlockAchievement('early_bird_30', 500)) pendingToasts.push('🏆 日出之王！连续30天早起+500币')
    } else if (lastEarlyDate !== todayStr && lastEarlyDate !== '') {
      repeatableCounts.value['early_streak'] = 0
    }

    // 连续深夜打卡（仅在签到时检测）
    const lastNightDate = repeatableCounts.value['night_streak_date'] || ''
    if (lastNightDate !== '' && lastNightDate !== todayStr && lastNightDate !== yesterdayStr) {
      repeatableCounts.value['night_streak'] = 0
    }
    if (hour >= 22 && lastNightDate !== todayStr) {
      const nightStreak = getRepeatCount('night_streak') + 1
      repeatableCounts.value['night_streak'] = nightStreak
      repeatableCounts.value['night_streak_date'] = todayStr
      if (nightStreak >= 7 && unlockAchievement('night_owl_7', 100)) pendingToasts.push('🏆 暗夜行者！连续7天深夜+100币')
      if (nightStreak >= 30 && unlockAchievement('night_owl_30', 500)) pendingToasts.push('🌑 月夜之王！连续30天深夜+500币')
    } else if (lastNightDate !== todayStr && lastNightDate !== '') {
      repeatableCounts.value['night_streak'] = 0
    }

    // 周末打卡计数
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCheckins.value++
    }

    // 组合成就：签到部分
    const cd = comboDailyDone.value
    if (cd.date !== today()) {
      comboDailyDone.value = { checkin: true, diary: false, quote: false, date: today() }
    } else {
      cd.checkin = true
    }

    // 最低金币追踪
    if (coins.value < minCoinsEver.value) {
      minCoinsEver.value = coins.value
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
      const shopData = loadState(SHOP_KEY)
      if (shopData) {
        const selected = shopData.selectedQuoteCategories || []
        const explicitlySet = shopData.quoteCategoriesExplicitlySet || false
        const extra = (shopData.purchasedItems || [])
          .filter(id => {
            const item = catalog.find(i => i.id === id)
            if (!item || item.category !== 'quote') return false
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
          .filter(hd => unlocked.includes(hd.id) || (shopData.purchasedItems || []).includes(hd.itemId))
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
    if (reward > 0) { coins.value += reward; logCoin(reward, '🏆 成就') }
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
    const todayStr = today()

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
    if (collectedDialogues.value.length >= 12 && unlockAchievement('dialogue_all', 100)) newToasts.push('🏆 知心好友！+100币')

    // ===== 一次性成就：特殊时间 =====
    if ((day === 0 || day === 6) && streak >= 2 && unlockAchievement('weekend', 25)) newToasts.push('🏆 周末不松懈！+25币')

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

    // ===== 心情成就 =====
    if (usedMoods.value.length >= 1 && unlockAchievement('mood_first', 10)) newToasts.push('😊 情绪初探！+10币')
    if (usedMoods.value.length >= 5 && unlockAchievement('mood_all_5', 60)) newToasts.push('🎨 五味杂陈！+60币')
    if (moodStreakDays.value.count >= 7 && unlockAchievement('mood_streak_7', 80)) newToasts.push('📖 情绪日记家！+80币')

    // ===== 消费成就 =====
    if (totalSpent.value >= 100 && unlockAchievement('spend_100', 20)) newToasts.push('💸 初次破费！+20币')
    if (totalSpent.value >= 500 && unlockAchievement('spend_500', 60)) newToasts.push('🛍️ 购物达人！+60币')
    if (totalSpent.value >= 2000 && unlockAchievement('spend_2000', 150)) newToasts.push('💳 剁手党！+150币')
    if (totalSpent.value >= 5000 && unlockAchievement('spend_5000', 400)) newToasts.push('💎 土豪降临！+400币')

    // ===== 日记深度成就 =====
    if (diaryStreak.value.count >= 7 && unlockAchievement('diary_streak_7', 80)) newToasts.push('✍️ 笔耕不辍！+80币')
    if (diaryStreak.value.count >= 30 && unlockAchievement('diary_streak_30', 300)) newToasts.push('📕 日记人生！+300币')

    // ===== 收集成就 =====
    try {
      const shopData = loadState(SHOP_KEY)
      if (shopData) {
        const owned = shopData.purchasedItems || []
        const themeCount = owned.filter(id => { const item = catalog.find(i => i.id === id); return item && item.category === 'theme' }).length
        const effectCount = owned.filter(id => { const item = catalog.find(i => i.id === id); return item && item.category === 'effect' }).length
        const frameCount = owned.filter(id => { const item = catalog.find(i => i.id === id); return item && item.category === 'frame' }).length
        if (themeCount >= 3 && unlockAchievement('own_theme_3', 60)) newToasts.push('🎨 主题收藏家！+60币')
        if (effectCount >= 3 && unlockAchievement('own_effect_3', 60)) newToasts.push('✨ 特效大师！+60币')
        if (frameCount >= 5 && unlockAchievement('own_all_frame', 100)) newToasts.push('🖼️ 相框全集！+100币')
      }
    } catch {}

    // ===== 组合成就 =====
    if (weekendCheckins.value >= 10 && unlockAchievement('weekend_10', 80)) newToasts.push('⚔️ 周末战士！+80币')
    if (quoteCollectStreak.value.count >= 3 && unlockAchievement('quote_daily', 40)) newToasts.push('📰 语录鉴赏家！+40币')

    // 完美一天
    const cd = comboDailyDone.value
    if (cd.date === today() && cd.checkin && cd.diary && cd.quote) {
      if (unlockAchievement('combo_daily', 40)) newToasts.push('🌟 完美一天！+40币')
    }

    // 触底反弹
    if (!coinRecoveryTriggered.value) {
      if (coins.value < minCoinsEver.value) minCoinsEver.value = coins.value
      if (minCoinsEver.value <= 10 && coins.value >= 500) {
        coinRecoveryTriggered.value = true
        if (unlockAchievement('coin_recovery', 100)) newToasts.push('📈 触底反弹！+100币')
      }
    }

    pendingToasts = [...pendingToasts, ...newToasts]
    return newToasts
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
    journal.value = []
    favoriteQuotes.value = []
    repeatableCounts.value = {}
    totalSpent.value = 0
    hasEarlyBird.value = false
    hasNightOwl.value = false
    timeLetters.value = []
    coinLog.value = []
    usedMoods.value = []
    moodStreakDays.value = { count: 0, lastDate: '' }
    weekendCheckins.value = 0
    letterSentCount.value = 0
    letterOpenedCount.value = 0
    diaryStreak.value = { count: 0, lastDate: '' }
    quoteCollectStreak.value = { count: 0, lastDate: '' }
    comboDailyDone.value = { checkin: false, diary: false, quote: false, date: '' }
    minCoinsEver.value = 999999
    coinRecoveryTriggered.value = false
    pendingToasts = []
  }

  function addJournal(text, mood = null) {
    journal.value.unshift({ text, date: today(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), mood: mood || null })

    // 心情追踪
    if (mood && !usedMoods.value.includes(mood)) {
      usedMoods.value.push(mood)
    }
    // 心情连续天数
    if (mood) {
      const msd = moodStreakDays.value
      if (msd.lastDate !== today()) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
        if (msd.lastDate === yStr || msd.lastDate === '') {
          moodStreakDays.value = { count: msd.count + 1, lastDate: today() }
        } else {
          moodStreakDays.value = { count: 1, lastDate: today() }
        }
      }
    }

    // 日记连续天数
    const ds = diaryStreak.value
    if (ds.lastDate !== today()) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
      if (ds.lastDate === yStr || ds.lastDate === '') {
        diaryStreak.value = { count: ds.count + 1, lastDate: today() }
      } else {
        diaryStreak.value = { count: 1, lastDate: today() }
      }
    }

    // 心情过山车：同一天写2条不同心情
    if (mood) {
      const todayJournals = journal.value.filter(j => j.date === today() && j.mood)
      const uniqueMoods = new Set(todayJournals.map(j => j.mood))
      if (uniqueMoods.size >= 2) {
        if (unlockAchievement('mood_swing', 30)) pendingToasts.push('🎢 心情过山车！+30币')
      }
    }

    // 深夜独白
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 5) {
      if (unlockAchievement('diary_night', 25)) pendingToasts.push('🌃 深夜独白！+25币')
    }

    // 千字文
    if (text.length >= 200) {
      if (unlockAchievement('diary_long', 30)) pendingToasts.push('📜 千字文！+30币')
    }

    // 组合成就：日记部分
    const cd = comboDailyDone.value
    if (cd.date !== today()) {
      comboDailyDone.value = { checkin: false, diary: true, quote: false, date: today() }
    } else {
      cd.diary = true
    }

    checkAchievements()
    return popToasts()
  }

  function removeJournal(index) {
    journal.value.splice(index, 1)
  }

  function addFavoriteQuote(text) {
    if (!favoriteQuotes.value.includes(text)) {
      favoriteQuotes.value.unshift(text)

      // 语录收藏连续天数
      const qs = quoteCollectStreak.value
      if (qs.lastDate !== today()) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
        if (qs.lastDate === yStr || qs.lastDate === '') {
          quoteCollectStreak.value = { count: qs.count + 1, lastDate: today() }
        } else {
          quoteCollectStreak.value = { count: 1, lastDate: today() }
        }
      }

      // 组合成就：语录部分
      const cd = comboDailyDone.value
      if (cd.date !== today()) {
        comboDailyDone.value = { checkin: false, diary: false, quote: true, date: today() }
      } else {
        cd.quote = true
      }

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
  function getDayMood(d) {
    const entry = journal.value.find(j => j.date === d && j.mood)
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
    letterSentCount.value++
    if (unlockAchievement('letter_first', 15)) pendingToasts.push('✉️ 时光信使！+15币')
    if (letterSentCount.value >= 5) {
      if (unlockAchievement('letter_5', 50)) pendingToasts.push('📬 书信往来！+50币')
    }
    // 写给未来的我：30天后开启
    const daysDiff = Math.ceil((new Date(openDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysDiff >= 30) {
      if (unlockAchievement('letter_to_self', 40)) pendingToasts.push('⏳ 写给未来的我！+40币')
    }
  }

  function openTimeLetter(id) {
    const letter = timeLetters.value.find(l => l.id === id)
    if (letter && letter.openDate <= today()) {
      letter.opened = true
      letterOpenedCount.value++
      if (unlockAchievement('letter_open', 15)) pendingToasts.push('💌 拆信的喜悦！+15币')
    }
  }

  function removeTimeLetter(id) {
    const idx = timeLetters.value.findIndex(l => l.id === id)
    if (idx !== -1) timeLetters.value.splice(idx, 1)
  }

  const pendingLetters = computed(() => timeLetters.value.filter(l => !l.opened && l.openDate > today()))
  const openableLetters = computed(() => timeLetters.value.filter(l => !l.opened && l.openDate <= today()))
  const openedLetters = computed(() => timeLetters.value.filter(l => l.opened))

  // 成就奖励总额
  const ACH_REWARDS = {
    streak_3: 20, streak_7: 50, streak_14: 100, streak_30: 200, streak_100: 500, streak_365: 2000,
    total_10: 30, total_50: 150, total_100: 300, total_365: 1000, total_500: 1500, total_1000: 3000,
    coin_100: 30, coin_500: 80, coin_1000: 150, coin_5000: 500, coin_10000: 1000,
    journal_5: 20, journal_20: 60, journal_50: 150, journal_100: 300,
    quote_collect: 10, quote_5: 40, quote_10: 80, quote_20: 150,
    early_bird: 15, night_owl: 15, weekend: 25, dialogue_all: 100,
    early_bird_7: 100, early_bird_30: 500, night_owl_7: 100, night_owl_30: 500,
    perfect_week_1: 50, perfect_week_4: 150, perfect_week_12: 500, perfect_week_52: 2000,
    perfect_month_1: 200, perfect_month_3: 500, perfect_month_6: 1000, perfect_month_12: 3000,
    mood_first: 10, mood_all_5: 60, mood_streak_7: 80, mood_swing: 30,
    spend_100: 20, spend_500: 60, spend_2000: 150, spend_5000: 400,
    letter_first: 15, letter_open: 15, letter_5: 50, letter_to_self: 40,
    diary_streak_7: 80, diary_streak_30: 300, diary_night: 25, diary_long: 30,
    own_theme_3: 60, own_effect_3: 60, own_all_frame: 100,
    combo_daily: 40, weekend_10: 80, coin_recovery: 100, quote_daily: 40,
  }
  const achievementRewardTotal = computed(() =>
    achievements.value.reduce((sum, a) => sum + (ACH_REWARDS[a.id] || 0), 0)
  )
  const totalEarned = computed(() => coins.value + totalSpent.value)

  return {
    checkins, coins, achievements,
    collectedDialogues,
    journal, favoriteQuotes,
    checkedToday, streakDays, totalCheckins,
    totalSpent, hasEarlyBird, hasNightOwl,
    checkIn, getDialogue, hasAchievement, unlockAchievement,
    checkAchievements, popToasts, resetState,
    addJournal, removeJournal, addFavoriteQuote, removeFavoriteQuote,
    getMoodStats, getDayMood, activeSeasonalEvent,
    timeLetters, addTimeLetter, openTimeLetter, removeTimeLetter,
    pendingLetters, openableLetters, openedLetters,
    achievementRewardTotal, totalEarned,
    coinLog, logCoin,
  }
})
