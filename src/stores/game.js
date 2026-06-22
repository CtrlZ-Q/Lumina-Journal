import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loadState, saveState, SHOP_KEY } from '../composables/useStorage'
import { catalog, gachaPool, premiumGachaPool } from '../data/catalog'
import { getActiveSeasonalEvent, moodOptions } from '../data/seasonalEvents'
import { useShopStore } from './shop'

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

  const resetVersion = ref(0)
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
    const time = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
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

  // 最低金币追踪（商店消费也会触发）
  watch(coins, (val) => {
    if (val < minCoinsEver.value) minCoinsEver.value = val
  })

  function checkIn() {
    if (checkedToday.value) return null
    const todayStr = today()
    checkins.value.push(todayStr)
    const base = 10
    const streakBonus = Math.min(Math.floor(streakDays.value / 7) * 5, 20)
    const random = Math.floor(Math.random() * (11 + streakBonus))
    let reward = base + random
    const details = { base, random, streakBonus, seasonBonus: 0, equipBonusRate: 0, equipBonus: 0 }
    // 季节活动金币加成
    const season = getActiveSeasonalEvent()
    if (season && season.coinBonus > 1) {
      const before = reward
      reward = Math.round(reward * season.coinBonus)
      details.seasonBonus = reward - before
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
          const before = reward
          reward = Math.round(reward * (100 + bonusRate) / 100)
          details.equipBonusRate = bonusRate
          details.equipBonus = reward - before
        }
      }
    } catch {}
    coins.value += reward
    logCoin(reward, '📅 签到')
    details.reward = reward

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
    if (cd.date !== todayStr) {
      comboDailyDone.value = { checkin: true, diary: false, quote: false, date: todayStr }
    } else {
      cd.checkin = true
    }

    // 最低金币追踪
    if (coins.value < minCoinsEver.value) {
      minCoinsEver.value = coins.value
    }

    const progress = notifyProgress()
    return { ...details, ...progress }
  }

  function getDialogue(shopData) {
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
    // 扩展语录包（直接从 shop store 传入，避免缓存延迟）
    if (shopData) {
      const allItems = [...catalog, ...gachaPool, ...(premiumGachaPool || [])]
      const selected = shopData.selectedQuoteCategories || []
      const explicitlySet = shopData.quoteCategoriesExplicitlySet || false
      const extra = (shopData.purchasedItems || [])
        .filter(id => {
          const item = allItems.find(i => i.id === id)
          if (!item || item.category !== 'quote') return false
          // 从未设置 → 全部显示；已设置 → 只显示选中的
          if (explicitlySet && selected.length === 0) return false
          if (selected.length > 0 && !selected.includes(id)) return false
          return true
        })
        .flatMap(id => allItems.find(i => i.id === id)?.data?.quotes || [])
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

  // 检查本周是否满勤（必须是周日且周一到周日全部打卡）
  function isPerfectWeek() {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=周日
    if (dayOfWeek !== 0) return false // 只在周日判定
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 6) // 周一
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      if (!checkins.value.includes(dateStr(d))) return false
    }
    return true
  }

  // 检查本月是否满勤（必须是月末且全月都打卡）
  function isPerfectMonth() {
    const now = new Date()
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    if (now.getDate() !== lastDay) return false // 只在月末判定
    for (let d = 1; d <= lastDay; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (!checkins.value.includes(ds)) return false
    }
    return true
  }

  function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  function checkAchievements() {
    const newlyUnlocked = []
    const tryUnlock = (id, reward) => { if (unlockAchievement(id, reward)) newlyUnlocked.push(id) }

    // 连续打卡天数
    const sd = streakDays.value
    if (sd >= 3) tryUnlock('streak_3', 20)
    if (sd >= 7) tryUnlock('streak_7', 50)
    if (sd >= 14) tryUnlock('streak_14', 100)
    if (sd >= 30) tryUnlock('streak_30', 200)
    if (sd >= 100) tryUnlock('streak_100', 500)
    if (sd >= 365) tryUnlock('streak_365', 2000)

    // 总打卡次数
    const tc = totalCheckins.value
    if (tc >= 10) tryUnlock('total_10', 30)
    if (tc >= 50) tryUnlock('total_50', 150)
    if (tc >= 100) tryUnlock('total_100', 300)
    if (tc >= 365) tryUnlock('total_365', 1000)
    if (tc >= 500) tryUnlock('total_500', 1500)
    if (tc >= 1000) tryUnlock('total_1000', 3000)

    // 金币里程碑
    const earned = coins.value + totalSpent.value
    if (earned >= 100) tryUnlock('coin_100', 30)
    if (earned >= 500) tryUnlock('coin_500', 80)
    if (earned >= 1000) tryUnlock('coin_1000', 150)
    if (earned >= 5000) tryUnlock('coin_5000', 500)
    if (earned >= 10000) tryUnlock('coin_10000', 1000)

    // 日记数量
    const jc = journal.value.length
    if (jc >= 5) tryUnlock('journal_5', 20)
    if (jc >= 20) tryUnlock('journal_20', 60)
    if (jc >= 50) tryUnlock('journal_50', 150)
    if (jc >= 100) tryUnlock('journal_100', 300)

    // 收藏语录
    const fq = favoriteQuotes.value.length
    if (fq >= 1) tryUnlock('quote_collect', 10)
    if (fq >= 5) tryUnlock('quote_5', 40)
    if (fq >= 10) tryUnlock('quote_10', 80)
    if (fq >= 20) tryUnlock('quote_20', 150)

    // 周末打卡
    if (weekendCheckins.value >= 2) tryUnlock('weekend', 25)
    if (weekendCheckins.value >= 10) tryUnlock('weekend_10', 80)

    // 满勤周（累计）
    if (isPerfectWeek()) {
      const now = new Date()
      const weekId = `${now.getFullYear()}-W${getISOWeekNumber(now)}`
      const lastWeek = repeatableCounts.value['perfect_week_last'] || ''
      if (lastWeek !== weekId) {
        repeatableCounts.value['perfect_week_count'] = (repeatableCounts.value['perfect_week_count'] || 0) + 1
        repeatableCounts.value['perfect_week_last'] = weekId
      }
      const pwc = repeatableCounts.value['perfect_week_count'] || 0
      if (pwc >= 1) tryUnlock('perfect_week_1', 50)
      if (pwc >= 4) tryUnlock('perfect_week_4', 150)
      if (pwc >= 12) tryUnlock('perfect_week_12', 500)
      if (pwc >= 52) tryUnlock('perfect_week_52', 2000)
    }

    // 满勤月（累计）
    if (isPerfectMonth()) {
      const now = new Date()
      const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const lastMonth = repeatableCounts.value['perfect_month_last'] || ''
      if (lastMonth !== monthId) {
        repeatableCounts.value['perfect_month_count'] = (repeatableCounts.value['perfect_month_count'] || 0) + 1
        repeatableCounts.value['perfect_month_last'] = monthId
      }
      const pmc = repeatableCounts.value['perfect_month_count'] || 0
      if (pmc >= 1) tryUnlock('perfect_month_1', 200)
      if (pmc >= 3) tryUnlock('perfect_month_3', 500)
      if (pmc >= 6) tryUnlock('perfect_month_6', 1000)
      if (pmc >= 12) tryUnlock('perfect_month_12', 3000)
    }

    // 心情成就
    if (usedMoods.value.length >= 1) tryUnlock('mood_first', 10)
    if (usedMoods.value.length >= 5) tryUnlock('mood_all_5', 60)
    if (moodStreakDays.value.count >= 7) tryUnlock('mood_streak_7', 80)

    // 消费里程碑
    if (totalSpent.value >= 100) tryUnlock('spend_100', 20)
    if (totalSpent.value >= 500) tryUnlock('spend_500', 60)
    if (totalSpent.value >= 2000) tryUnlock('spend_2000', 150)
    if (totalSpent.value >= 5000) tryUnlock('spend_5000', 400)

    // 日记连续天数
    if (diaryStreak.value.count >= 7) tryUnlock('diary_streak_7', 80)
    if (diaryStreak.value.count >= 30) tryUnlock('diary_streak_30', 300)

    // 语录收藏连续天数
    if (quoteCollectStreak.value.count >= 3) tryUnlock('quote_daily', 40)

    // 组合成就：签到+日记+语录同日完成
    const cd = comboDailyDone.value
    if (cd.date === today() && cd.checkin && cd.diary && cd.quote) {
      tryUnlock('combo_daily', 40)
    }

    // 金币回升
    if (!coinRecoveryTriggered.value && minCoinsEver.value <= 10 && coins.value >= 500) {
      coinRecoveryTriggered.value = true
      tryUnlock('coin_recovery', 100)
    }

    // 收集全部隐藏台词（12个）
    if (collectedDialogues.value.length >= 12) tryUnlock('dialogue_all', 100)

    // 拥有物品成就（访问 shop store）
    try {
      const shop = useShopStore()
      const purchased = shop.purchasedItems || []
      const themeCount = catalog.filter(i => i.category === 'theme' && purchased.includes(i.id)).length
      const effectCount = catalog.filter(i => i.category === 'effect' && purchased.includes(i.id)).length
      const frameCount = catalog.filter(i => i.category === 'frame' && purchased.includes(i.id)).length
      const allFrames = catalog.filter(i => i.category === 'frame')
      if (themeCount >= 3) tryUnlock('own_theme_3', 60)
      if (effectCount >= 3) tryUnlock('own_effect_3', 60)
      if (allFrames.length > 0 && allFrames.every(f => purchased.includes(f.id))) tryUnlock('own_all_frame', 100)
    } catch {}

    // 新增 toast
    for (const id of newlyUnlocked) {
      const toastMap = {
        streak_3: '🔥 连续3天！+20币', streak_7: '🔥 连续7天！+50币',
        streak_14: '🔥 连续14天！+100币', streak_30: '🔥 连续30天！+200币',
        streak_100: '🔥 连续100天！+500币', streak_365: '🔥 连续365天！+2000币',
        total_10: '📅 累计打卡10天！+30币', total_50: '📅 累计打卡50天！+150币',
        total_100: '📅 累计打卡100天！+300币', total_365: '📅 累计打卡365天！+1000币',
        total_500: '📅 累计打卡500天！+1500币', total_1000: '📅 累计打卡1000天！+3000币',
        coin_100: '💰 小有积蓄！+30币', coin_500: '💰 财源滚滚！+80币',
        coin_1000: '💰 千金之富！+150币', coin_5000: '💰 腰缠万贯！+500币', coin_10000: '💎 万金之王！+1000币',
        journal_5: '📝 初露锋芒！+20币', journal_20: '📝 笔耕不辍！+60币',
        journal_50: '📝 文思泉涌！+150币', journal_100: '📝 著作等身！+300币',
        quote_collect: '⭐ 初次收藏！+10币', quote_5: '⭐ 语录达人！+40币',
        quote_10: '⭐ 金句王！+80币', quote_20: '⭐ 语录大师！+150币',
        weekend: '🎉 周末打卡！+25币', weekend_10: '🎉 周末战士！+80币',
        perfect_week_1: '🏆 完美一周！+50币', perfect_week_4: '🏆 4次满勤周！+150币',
        perfect_week_12: '🏆 12次满勤周！+500币', perfect_week_52: '🏆 52次满勤周！+2000币',
        perfect_month_1: '🏆 完美一月！+200币', perfect_month_3: '🏆 3次满勤月！+500币',
        perfect_month_6: '🏆 6次满勤月！+1000币', perfect_month_12: '🏆 12次满勤月！+3000币',
        mood_first: '😊 初次心情！+10币', mood_all_5: '🌈 心情收集家！+60币', mood_streak_7: '📅 心情连续！+80币',
        spend_100: '🛒 初次消费！+20币', spend_500: '🛒 消费达人！+60币',
        spend_2000: '🛒 购物狂！+150币', spend_5000: '🛒 土豪！+400币',
        diary_streak_7: '📖 日记连续7天！+80币', diary_streak_30: '📖 日记连续30天！+300币',
        quote_daily: '⭐ 语录连续3天！+40币', combo_daily: '🎯 每日三连！+40币',
        coin_recovery: '💪 金币回升！+100币',
        dialogue_all: '🎭 全部台词收集！+100币',
        own_theme_3: '🎨 拥有3个主题！+60币', own_effect_3: '✨ 拥有3个特效！+60币', own_all_frame: '🖼️ 全部相框收集！+100币',
      }
      if (toastMap[id]) pendingToasts.push(toastMap[id])
    }

    return newlyUnlocked
  }

  function notifyProgress() {
    const newAchievements = checkAchievements()
    const toasts = popToasts()
    return { achievements: newAchievements, toasts }
  }

  function popToasts() {
    const t = [...pendingToasts]
    pendingToasts = []
    return t
  }

  function resetState() {
    resetVersion.value++
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
    saveState({
      checkins: checkins.value, coins: coins.value, achievements: achievements.value,
      collectedDialogues: collectedDialogues.value, journal: journal.value, favoriteQuotes: favoriteQuotes.value,
      repeatableCounts: repeatableCounts.value, totalSpent: totalSpent.value,
      hasEarlyBird: hasEarlyBird.value, hasNightOwl: hasNightOwl.value,
      timeLetters: timeLetters.value, coinLog: coinLog.value,
      usedMoods: usedMoods.value, moodStreakDays: moodStreakDays.value,
      weekendCheckins: weekendCheckins.value, letterSentCount: letterSentCount.value,
      letterOpenedCount: letterOpenedCount.value, diaryStreak: diaryStreak.value,
      quoteCollectStreak: quoteCollectStreak.value, comboDailyDone: comboDailyDone.value,
      minCoinsEver: minCoinsEver.value, coinRecoveryTriggered: coinRecoveryTriggered.value,
    })
  }

  function addJournal(text, mood = null) {
    journal.value.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, date: today(), time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), mood: mood || null })

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
    if (text.length > 200) {
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
      return popToasts()
    }
    return []
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
    const daysDiff = Math.ceil((new Date(openDate) - new Date()) / (1000 * 60 * 60 * 24))
    if (daysDiff >= 30) {
      if (unlockAchievement('letter_to_self', 40)) pendingToasts.push('⏳ 写给未来的我！+40币')
    }
    checkAchievements()
    return popToasts()
  }

  function openTimeLetter(id) {
    const letter = timeLetters.value.find(l => l.id === id)
    if (letter && letter.openDate <= today()) {
      letter.opened = true
      letterOpenedCount.value++
      if (unlockAchievement('letter_open', 15)) pendingToasts.push('💌 拆信的喜悦！+15币')
      checkAchievements()
      return popToasts()
    }
    return []
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
    resetVersion, checkins, coins, achievements,
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
    notifyProgress,
  }
})
