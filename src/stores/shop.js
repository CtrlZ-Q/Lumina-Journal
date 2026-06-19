import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './game'
import { catalog, gachaPool, gachaNormalRewards, premiumGachaPool } from '../data/catalog'

const SHOP_KEY = 'dino-app-shop'

function loadShopState() {
  try {
    const raw = localStorage.getItem(SHOP_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function defaultShopState() {
  return {
    purchasedItems: [],
    equippedItems: { theme: null, effect: null, frame: null, sound: null, calendar: null },
    consumables: { double_coin: 0, triple_coin: 0, random_box: 0, mystery_box: 0, crystal: 0, wheel: 0, lucky: 0, refresh: 0, lucky_star: 0, golden_touch: 0, magnet: 0 },
    gachaCount: 0,
    gachaHistory: [],
    totalGachaPulls: 0,
    selectedQuoteCategories: [],
    quoteCategoriesExplicitlySet: false, // 区分"从未设置"和"已卸下全部"
    // 新系统
    ownedTitles: [],       // 已拥有的称号 id 列表
    activeTitle: null,     // 当前装备的称号 id
    lastLimitedRefresh: '', // 上次限时商店刷新日期
    limitedShopItems: [],  // 今天的限时商品 [{id, discount}]
    unlockedHiddenDialogues: [], // 已解锁的隐藏台词
  }
}

// ===== 称号定义 =====
export const titleDefs = [
  { id: 'title_newbie', name: '初来乍到', icon: '🐣', desc: '首次打卡', cost: 0, condition: (game) => game.totalCheckins >= 1 },
  { id: 'title_week', name: '坚持一周', icon: '📗', desc: '累计打卡7天', cost: 0, condition: (game) => game.totalCheckins >= 7 },
  { id: 'title_month', name: '月度达人', icon: '📘', desc: '累计打卡30天', cost: 0, condition: (game) => game.totalCheckins >= 30 },
  { id: 'title_quarter', name: '百日坚持', icon: '📕', desc: '累计打卡100天', cost: 0, condition: (game) => game.totalCheckins >= 100 },
  { id: 'title_year', name: '年度冠军', icon: '🏆', desc: '累计打卡365天', cost: 0, condition: (game) => game.totalCheckins >= 365 },
  { id: 'title_streak7', name: '连续七天', icon: '🔥', desc: '连续打卡7天', cost: 0, condition: (game) => game.streakDays >= 7 },
  { id: 'title_streak30', name: '连续达人', icon: '💪', desc: '连续打卡30天', cost: 0, condition: (game) => game.streakDays >= 30 },
  { id: 'title_streak100', name: '百日不辍', icon: '⭐', desc: '连续打卡100天', cost: 0, condition: (game) => game.streakDays >= 100 },
  { id: 'title_rich100', name: '小有积蓄', icon: '💰', desc: '金币达到100', cost: 0, condition: (game) => game.coins >= 100 },
  { id: 'title_rich1000', name: '富甲一方', icon: '💎', desc: '金币达到1000', cost: 0, condition: (game) => game.coins >= 1000 },
  { id: 'title_rich5000', name: '金币大亨', icon: '👑', desc: '金币达到5000', cost: 0, condition: (game) => game.coins >= 5000 },
  { id: 'title_rich10000', name: '金币帝王', icon: '🫅', desc: '金币达到10000', cost: 0, condition: (game) => game.coins >= 10000 },
  { id: 'title_collector', name: '收藏家', icon: '🎒', desc: '拥有10件装备', cost: 0, condition: (_, shop) => shop.purchasedItems.length >= 10 },
  { id: 'title_hoarder', name: '仓鼠', icon: '🐹', desc: '拥有30件装备', cost: 0, condition: (_, shop) => shop.purchasedItems.length >= 30 },
  { id: 'title_gacha10', name: '抽奖新手', icon: '🎰', desc: '抽奖10次', cost: 0, condition: (_, shop) => shop.totalGachaPulls >= 10 },
  { id: 'title_gambler', name: '赌徒', icon: '🎲', desc: '抽奖50次', cost: 0, condition: (_, shop) => shop.totalGachaPulls >= 50 },
  { id: 'title_dreamer', name: '梦想家', icon: '💫', desc: '解锁10个成就', cost: 0, condition: (game) => game.achievements.length >= 10 },
  { id: 'title_legend', name: '传说', icon: '🌟', desc: '解锁30个成就', cost: 0, condition: (game) => game.achievements.length >= 30 },
  { id: 'title_vip', name: 'VIP', icon: '💜', desc: '累计消费2000币', cost: 0, condition: (game) => game.totalSpent >= 2000 },
  { id: 'title_early', name: '早起鸟', icon: '🐦', desc: '早上6点前打卡', cost: 0, condition: (game) => game.hasEarlyBird },
  { id: 'title_night', name: '夜猫子', icon: '🦉', desc: '凌晨12点后打卡', cost: 0, condition: (game) => game.hasNightOwl },
  { id: 'title_perfectionist', name: '完美主义', icon: '✨', desc: '拥有15件装扮', cost: 0, condition: (_, shop) => {
    const equipable = shop.purchasedItems.filter(id => { const i = shop.getItem(id); return i && i.type === 'equipable' })
    return equipable.length >= 15
  }},
  // ===== 分类专属称号 =====
  { id: 'title_theme_master', name: '调色大师', icon: '🎨', desc: '拥有全部主题', cost: 0, condition: (_, shop) => {
    const themes = catalog.filter(i => i.category === 'theme')
    return themes.every(t => shop.purchasedItems.includes(t.id))
  }},
  { id: 'title_effect_master', name: '特效之王', icon: '✨', desc: '拥有全部特效', cost: 0, condition: (_, shop) => {
    const effects = catalog.filter(i => i.category === 'effect')
    return effects.every(e => shop.purchasedItems.includes(e.id))
  }},
  { id: 'title_frame_master', name: '相框收藏家', icon: '🖼️', desc: '拥有全部相框', cost: 0, condition: (_, shop) => {
    const frames = catalog.filter(i => i.category === 'frame')
    return frames.every(f => shop.purchasedItems.includes(f.id))
  }},
  { id: 'title_sound_master', name: '音律大师', icon: '🎵', desc: '拥有全部音效', cost: 0, condition: (_, shop) => {
    const sounds = catalog.filter(i => i.category === 'sound')
    return sounds.every(s => shop.purchasedItems.includes(s.id))
  }},
  { id: 'title_theme_5', name: '色彩新手', icon: '🖌️', desc: '拥有5个主题', cost: 0, condition: (_, shop) => {
    return catalog.filter(i => i.category === 'theme' && shop.purchasedItems.includes(i.id)).length >= 5
  }},
  { id: 'title_effect_5', name: '特效学徒', icon: '💫', desc: '拥有5个特效', cost: 0, condition: (_, shop) => {
    return catalog.filter(i => i.category === 'effect' && shop.purchasedItems.includes(i.id)).length >= 5
  }},
  { id: 'title_frame_5', name: '相框新手', icon: '📷', desc: '拥有5个相框', cost: 0, condition: (_, shop) => {
    return catalog.filter(i => i.category === 'frame' && shop.purchasedItems.includes(i.id)).length >= 5
  }},
]

// ===== 限时商店折扣商品池 =====
const limitedPool = [
  { id: 'effect_confetti', discount: 30 },
  { id: 'effect_fireworks', discount: 25 },
  { id: 'effect_bubble', discount: 35 },
  { id: 'effect_leaves', discount: 30 },
  { id: 'effect_sakura', discount: 20 },
  { id: 'effect_snow', discount: 20 },
  { id: 'effect_lightning', discount: 15 },
  { id: 'frame_classic', discount: 40 },
  { id: 'frame_heart', discount: 35 },
  { id: 'frame_nature', discount: 35 },
  { id: 'frame_bow', discount: 30 },
  { id: 'frame_ocean', discount: 25 },
  { id: 'frame_cherry', discount: 20 },
  { id: 'sound_bell', discount: 40 },
  { id: 'sound_drum', discount: 40 },
  { id: 'sound_chime', discount: 35 },
  { id: 'sound_melody', discount: 30 },
  { id: 'cal_classic', discount: 35 },
  { id: 'cal_summer', discount: 30 },
  { id: 'cal_spring', discount: 25 },
  { id: 'theme_green', discount: 20 },
  { id: 'theme_orange', discount: 15 },
  { id: 'theme_autumn', discount: 15 },
  { id: 'theme_matcha', discount: 10 },
  { id: 'theme_blue', discount: 10 },
  { id: 'item_crystal', discount: 50 },
  { id: 'item_refresh', discount: 40 },
  { id: 'item_double', discount: 30 },
  { id: 'item_box', discount: 20 },
  { id: 'item_lucky', discount: 25 },
]

// 基于日期的伪随机
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getLimitedItems(dateStr) {
  const seed = dateStr.split('-').reduce((a, b) => a * 31 + parseInt(b), 0)
  const shuffled = [...limitedPool].sort((a, b) => seededRandom(seed + a.id.length) - seededRandom(seed + b.id.length))
  return shuffled.slice(0, 5).map(item => ({ ...item }))
}

export const useShopStore = defineStore('shop', () => {
  const saved = loadShopState()
  const def = defaultShopState()
  const initial = saved ? {
    ...def,
    ...saved,
    consumables: { ...def.consumables, ...(saved.consumables || {}) },
    equippedItems: { ...def.equippedItems, ...(saved.equippedItems || {}) },
    ownedTitles: saved.ownedTitles || [],
    activeTitle: saved.activeTitle || null,
    lastLimitedRefresh: saved.lastLimitedRefresh || '',
    limitedShopItems: saved.limitedShopItems || [],
    unlockedHiddenDialogues: saved.unlockedHiddenDialogues || [],
    totalGachaPulls: saved.totalGachaPulls || 0,
  } : def

  const purchasedItems = ref(initial.purchasedItems)
  const equippedItems = ref(initial.equippedItems)
  const consumables = ref(initial.consumables)
  const gachaCount = ref(initial.gachaCount)
  const gachaHistory = ref(initial.gachaHistory)
  const totalGachaPulls = ref(initial.totalGachaPulls)
  const selectedQuoteCategories = ref(initial.selectedQuoteCategories || [])
  const quoteCategoriesExplicitlySet = ref(initial.quoteCategoriesExplicitlySet || false)
  const ownedTitles = ref(initial.ownedTitles)
  const activeTitle = ref(initial.activeTitle)
  const lastLimitedRefresh = ref(initial.lastLimitedRefresh)
  const limitedShopItems = ref(initial.limitedShopItems)
  const useOriginalStyle = ref(initial.useOriginalStyle || false)
  const darkMode = ref(initial.darkMode !== undefined ? initial.darkMode : true)
  const unlockedHiddenDialogues = ref(initial.unlockedHiddenDialogues || [])

  // 每日自动刷新限时商店
  const today = new Date().toISOString().slice(0, 10)
  if (lastLimitedRefresh.value !== today) {
    limitedShopItems.value = getLimitedItems(today)
    lastLimitedRefresh.value = today
  }

  // 持久化
  watch([purchasedItems, equippedItems, consumables, gachaCount, gachaHistory, totalGachaPulls, selectedQuoteCategories, quoteCategoriesExplicitlySet, ownedTitles, activeTitle, lastLimitedRefresh, limitedShopItems, useOriginalStyle, darkMode, unlockedHiddenDialogues], () => {
    try {
      localStorage.setItem(SHOP_KEY, JSON.stringify({
        purchasedItems: purchasedItems.value,
        equippedItems: equippedItems.value,
        consumables: consumables.value,
        gachaCount: gachaCount.value,
        gachaHistory: gachaHistory.value,
        totalGachaPulls: totalGachaPulls.value,
        selectedQuoteCategories: selectedQuoteCategories.value,
        quoteCategoriesExplicitlySet: quoteCategoriesExplicitlySet.value,
        ownedTitles: ownedTitles.value,
        activeTitle: activeTitle.value,
        lastLimitedRefresh: lastLimitedRefresh.value,
        limitedShopItems: limitedShopItems.value,
        useOriginalStyle: useOriginalStyle.value,
        darkMode: darkMode.value,
        unlockedHiddenDialogues: unlockedHiddenDialogues.value,
      }))
    } catch {}
  }, { deep: true })

  // ===== 计算属性 =====
  const allCatalogItems = computed(() => [...catalog, ...gachaPool, ...(premiumGachaPool || [])])

  function getItem(id) {
    return allCatalogItems.value.find(i => i.id === id)
  }

  function isOwned(id) {
    return purchasedItems.value.includes(id)
  }

  function isEquipped(category, id) {
    return equippedItems.value[category] === id
  }

  function ownedCount(category) {
    return catalog.filter(i => i.category === category && isOwned(i.id)).length
  }

  function categoryTotal(category) {
    return catalog.filter(i => i.category === category).length
  }

  const activeTheme = computed(() => {
    const equipped = equippedItems.value.theme
    if (equipped) return getItem(equipped)
    return null
  })

  const activeEffect = computed(() => {
    const equipped = equippedItems.value.effect
    return equipped ? getItem(equipped) : null
  })

  const activeFrame = computed(() => {
    const equipped = equippedItems.value.frame
    return equipped ? getItem(equipped) : null
  })

  // ===== 金币加成计算 =====
  const coinBonusRate = computed(() => {
    let totalBonus = 0
    // 已装备的主题加成
    const equippedTheme = equippedItems.value.theme
    if (equippedTheme) {
      const theme = getItem(equippedTheme)
      if (theme?.data?.bonus) totalBonus += theme.data.bonus
    }
    // 已装备的相框加成
    const equippedFrame = equippedItems.value.frame
    if (equippedFrame) {
      const frame = getItem(equippedFrame)
      if (frame?.data?.bonus) totalBonus += frame.data.bonus
    }
    // 拥有数量加成（每拥有5件装备+1%，上限10%）
    const ownedEquipable = purchasedItems.value.filter(id => {
      const item = getItem(id)
      return item && item.type === 'equipable'
    }).length
    totalBonus += Math.min(Math.floor(ownedEquipable / 5), 10)
    // 上限30%
    return Math.min(totalBonus, 30)
  })

  // ===== 隐藏台词解锁 =====
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

  // 检查并解锁隐藏台词
  function checkHiddenDialogues() {
    const newDialogues = []
    for (const hd of hiddenDialogues) {
      if (unlockedHiddenDialogues.value.includes(hd.id)) continue
      if (purchasedItems.value.includes(hd.itemId)) {
        unlockedHiddenDialogues.value.push(hd.id)
        newDialogues.push(hd)
      }
    }
    return newDialogues
  }

  // 获取所有已解锁的隐藏台词
  const allUnlockedDialogues = computed(() => {
    return hiddenDialogues
      .filter(hd => unlockedHiddenDialogues.value.includes(hd.id))
      .map(hd => hd.text)
  })

  const allQuoteCategories = computed(() => {
    return catalog.filter(i => i.category === 'quote').map(i => ({ id: i.id, name: i.name, icon: i.icon }))
  })

  const extraQuotes = computed(() => {
    const selected = selectedQuoteCategories.value
    return purchasedItems.value
      .filter(id => {
        const item = getItem(id)
        if (!item || item.category !== 'quote') return false
        if (selected.length > 0 && !selected.includes(id)) return false
        return true
      })
      .flatMap(id => getItem(id).data.quotes)
  })

  // 获取称号信息
  function getTitle(id) {
    return titleDefs.find(t => t.id === id)
  }

  // 检查并解锁新称号
  function checkTitles() {
    const gameStore = useGameStore()
    const shopCtx = { purchasedItems: purchasedItems.value, gachaHistory: gachaHistory.value, totalGachaPulls: totalGachaPulls.value, getItem }
    const newTitles = []
    for (const t of titleDefs) {
      if (ownedTitles.value.includes(t.id)) continue
      if (t.cost === 0 && t.condition(gameStore, shopCtx)) {
        ownedTitles.value.push(t.id)
        newTitles.push(t)
      }
    }
    return newTitles
  }

  // 购买称号
  function buyTitle(titleId) {
    const t = getTitle(titleId)
    if (!t || ownedTitles.value.includes(titleId)) return { ok: false }
    const gameStore = useGameStore()
    if (gameStore.coins < t.cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= t.cost
    ownedTitles.value.push(titleId)
    return { ok: true }
  }

  // 装备称号
  function equipTitle(titleId) {
    if (titleId === null) { activeTitle.value = null; return }
    if (!ownedTitles.value.includes(titleId)) return
    activeTitle.value = titleId
  }

  // ===== 语录类别选择 =====
  function toggleQuoteCategory(categoryId) {
    quoteCategoriesExplicitlySet.value = true
    const idx = selectedQuoteCategories.value.indexOf(categoryId)
    if (idx >= 0) {
      selectedQuoteCategories.value.splice(idx, 1)
    } else {
      selectedQuoteCategories.value.push(categoryId)
    }
  }
  function setQuoteCategories(categories) {
    quoteCategoriesExplicitlySet.value = true
    selectedQuoteCategories.value = categories
  }

  // ===== 购买 =====
  function buyItem(itemId) {
    const item = getItem(itemId)
    if (!item) return { ok: false, reason: 'not_found' }
    if (item.type !== 'consumable' && isOwned(itemId)) return { ok: false, reason: 'owned' }
    const gameStore = useGameStore()
    if (gameStore.coins < item.price) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= item.price
    gameStore.totalSpent += item.price
    if (item.type === 'consumable') {
      consumables.value[item.data.propKey] = (consumables.value[item.data.propKey] || 0) + 1
    } else {
      purchasedItems.value.push(itemId)
    }
    return { ok: true }
  }

  // 购买限时商品（折扣价）
  function buyLimitedItem(limitedItem) {
    const item = getItem(limitedItem.id)
    if (!item) return { ok: false, reason: 'not_found' }
    if (isOwned(limitedItem.id)) return { ok: false, reason: 'owned' }
    const discountedPrice = Math.floor(item.price * (100 - limitedItem.discount) / 100)
    const gameStore = useGameStore()
    if (gameStore.coins < discountedPrice) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= discountedPrice
    gameStore.totalSpent += discountedPrice
    purchasedItems.value.push(limitedItem.id)
    return { ok: true }
  }

  // ===== 装备 =====
  function equipItem(category, itemId) {
    if (itemId === null) { equippedItems.value[category] = null; return }
    if (!isOwned(itemId)) return
    equippedItems.value[category] = itemId
  }

  // ===== 使用道具 =====
  function useConsumable(propKey) {
    if (consumables.value[propKey] <= 0) return false
    consumables.value[propKey]--
    return true
  }

  // ===== 抽奖 =====
  function pullGacha(times = 1) {
    const gameStore = useGameStore()
    const cost = times === 5 ? 650 : 150
    if (gameStore.coins < cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= cost
    totalGachaPulls.value += times

    const results = []
    let gotRareInFive = false

    for (let i = 0; i < times; i++) {
      let rarity
      if (gachaCount.value >= 50) {
        rarity = Math.random() < 0.05 ? 'legendary' : 'epic'
        gachaCount.value = 0
      } else if (times === 5 && i === times - 1 && !gotRareInFive) {
        const roll = Math.random() * 100
        rarity = roll < 0.5 ? 'legendary' : roll < 3.5 ? 'epic' : 'rare'
        gachaCount.value = 0
      } else {
        const roll = Math.random() * 100
        if (roll < 0.5) { rarity = 'legendary'; gachaCount.value = 0 }
        else if (roll < 3.5) { rarity = 'epic'; gachaCount.value = 0 }
        else if (roll < 15.5) { rarity = 'rare'; gachaCount.value = 0 }
        else { rarity = 'normal'; gachaCount.value++ }
      }

      if (rarity !== 'normal' && times === 5) gotRareInFive = true

      if (rarity === 'normal') {
        const reward = gachaNormalRewards[Math.floor(Math.random() * gachaNormalRewards.length)]
        gameStore.coins += reward.amount
        results.push({ ...reward, rarity: 'normal' })
      } else {
        const pool = gachaPool.filter(g => g.rarity === rarity)
        const unowned = pool.filter(g => !isOwned(g.id))
        let item
        if (unowned.length > 0) {
          item = unowned[Math.floor(Math.random() * unowned.length)]
          purchasedItems.value.push(item.id)
          results.push({ ...item, rarity })
        } else {
          const bonus = rarity === 'legendary' ? 200 : rarity === 'epic' ? 100 : 50
          gameStore.coins += bonus
          results.push({ type: 'coins', amount: bonus, name: `${bonus} 金币`, icon: '💰', rarity })
        }
      }
    }

    gachaHistory.value = results
    return { ok: true, results }
  }

  // ===== 高级抽奖 =====
  function pullPremiumGacha(times = 1) {
    const gameStore = useGameStore()
    const cost = times === 5 ? 6500 : 1500
    if (gameStore.coins < cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= cost
    totalGachaPulls.value += times

    const results = []
    let gotRareInFive = false

    for (let i = 0; i < times; i++) {
      let rarity
      if (times === 5 && i === times - 1 && !gotRareInFive) {
        rarity = Math.random() < 0.15 ? 'legendary' : 'epic'
      } else {
        const roll = Math.random() * 100
        if (roll < 3) { rarity = 'legendary' }
        else if (roll < 15) { rarity = 'epic' }
        else if (roll < 40) { rarity = 'rare' }
        else { rarity = 'normal' }
      }

      if (rarity !== 'normal' && times === 5) gotRareInFive = true

      if (rarity === 'normal') {
        const reward = { type: 'coins', amount: 100, name: '100 金币', icon: '💰' }
        gameStore.coins += 100
        results.push({ ...reward, rarity: 'normal' })
      } else {
        const pool = (premiumGachaPool || []).filter(g => g.rarity === rarity)
        const unowned = pool.filter(g => !isOwned(g.id))
        let item
        if (unowned.length > 0) {
          item = unowned[Math.floor(Math.random() * unowned.length)]
          purchasedItems.value.push(item.id)
          results.push({ ...item, rarity })
        } else {
          const fallbackPool = gachaPool.filter(g => g.rarity === rarity)
          const fallbackUnowned = fallbackPool.filter(g => !isOwned(g.id))
          if (fallbackUnowned.length > 0) {
            item = fallbackUnowned[Math.floor(Math.random() * fallbackUnowned.length)]
            purchasedItems.value.push(item.id)
            results.push({ ...item, rarity })
          } else {
            const bonus = rarity === 'legendary' ? 500 : rarity === 'epic' ? 250 : 100
            gameStore.coins += bonus
            results.push({ type: 'coins', amount: bonus, name: `${bonus} 金币`, icon: '💰', rarity })
          }
        }
      }
    }

    gachaHistory.value = results
    return { ok: true, results }
  }

  // ===== 重置 =====
  function resetShop() {
    const def = defaultShopState()
    purchasedItems.value = def.purchasedItems
    equippedItems.value = def.equippedItems
    consumables.value = def.consumables
    gachaCount.value = def.gachaCount
    gachaHistory.value = def.gachaHistory
    totalGachaPulls.value = def.totalGachaPulls
    selectedQuoteCategories.value = def.selectedQuoteCategories
    ownedTitles.value = def.ownedTitles
    activeTitle.value = def.activeTitle
    lastLimitedRefresh.value = def.lastLimitedRefresh
    limitedShopItems.value = def.limitedShopItems
  }

  function toggleOriginalStyle() { useOriginalStyle.value = !useOriginalStyle.value }
  function toggleDarkMode() { darkMode.value = !darkMode.value }

  return {
    purchasedItems, equippedItems, consumables, gachaCount, gachaHistory, totalGachaPulls, selectedQuoteCategories, quoteCategoriesExplicitlySet,
    ownedTitles, activeTitle, lastLimitedRefresh, limitedShopItems, useOriginalStyle, darkMode,
    allCatalogItems, activeTheme, activeEffect, activeFrame, extraQuotes, allQuoteCategories,
    coinBonusRate, unlockedHiddenDialogues, allUnlockedDialogues,
    getItem, isOwned, isEquipped, ownedCount, categoryTotal, getTitle,
    buyItem, equipItem, useConsumable, pullGacha, pullPremiumGacha, resetShop,
    toggleQuoteCategory, setQuoteCategories, toggleOriginalStyle, toggleDarkMode,
    buyTitle, equipTitle, checkTitles, buyLimitedItem, checkHiddenDialogues,
  }
})
