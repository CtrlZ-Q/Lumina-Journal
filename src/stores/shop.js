import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './game'
import { catalog, gachaPool, gachaNormalRewards, premiumGachaPool } from '../data/catalog'
import { loadState, saveState, SHOP_KEY } from '../composables/useStorage'

function loadShopState() {
  return loadState(SHOP_KEY)
}

function defaultShopState() {
  return {
    purchasedItems: [],
    equippedItems: { theme: null, effect: null, frame: null, sound: null, calendar: null },
    consumables: { double_coin: 0, triple_coin: 0, random_box: 0, mystery_box: 0, crystal: 0, wheel: 0, lucky: 0, refresh: 0, lucky_star: 0, golden_touch: 0, magnet: 0 },
    gachaCount: 0,
    gachaHistory: [],
    totalGachaPulls: 0,
    premiumGachaCount: 0,
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
  { id: 'title_early', name: '早起鸟', icon: '🐦', desc: '早上8点前打卡', cost: 0, condition: (game) => game.hasEarlyBird },
  { id: 'title_night', name: '夜猫子', icon: '🦉', desc: '晚上10点后打卡', cost: 0, condition: (game) => game.hasNightOwl },
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
    premiumGachaCount: saved.premiumGachaCount || 0,
  } : def

  const purchasedItems = ref(initial.purchasedItems)
  const equippedItems = ref(initial.equippedItems)
  const consumables = ref(initial.consumables)
  const gachaCount = ref(initial.gachaCount)
  const gachaHistory = ref(initial.gachaHistory)
  const totalGachaPulls = ref(initial.totalGachaPulls)
  const premiumGachaCount = ref(initial.premiumGachaCount || 0)
  const selectedQuoteCategories = ref(initial.selectedQuoteCategories || [])
  const quoteCategoriesExplicitlySet = ref(initial.quoteCategoriesExplicitlySet || false)
  const ownedTitles = ref(initial.ownedTitles)
  const activeTitle = ref(initial.activeTitle)
  const lastLimitedRefresh = ref(initial.lastLimitedRefresh)
  const limitedShopItems = ref(initial.limitedShopItems)
  const useOriginalStyle = ref(initial.useOriginalStyle || false)
  const darkMode = ref(saved?.darkMode ?? false) // 默认浅色，用户切换后才保存深色
  const unlockedHiddenDialogues = ref(initial.unlockedHiddenDialogues || [])

  // 每日自动刷新限时商店
  const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  if (lastLimitedRefresh.value !== today) {
    limitedShopItems.value = getLimitedItems(today)
    lastLimitedRefresh.value = today
  }

  // 持久化
  watch([purchasedItems, equippedItems, consumables, gachaCount, gachaHistory, totalGachaPulls, premiumGachaCount, selectedQuoteCategories, quoteCategoriesExplicitlySet, ownedTitles, activeTitle, lastLimitedRefresh, limitedShopItems, useOriginalStyle, darkMode, unlockedHiddenDialogues], () => {
    try {
      saveState({
        purchasedItems: purchasedItems.value,
        equippedItems: equippedItems.value,
        consumables: consumables.value,
        gachaCount: gachaCount.value,
        gachaHistory: gachaHistory.value,
        totalGachaPulls: totalGachaPulls.value,
        premiumGachaCount: premiumGachaCount.value,
        selectedQuoteCategories: selectedQuoteCategories.value,
        quoteCategoriesExplicitlySet: quoteCategoriesExplicitlySet.value,
        ownedTitles: ownedTitles.value,
        activeTitle: activeTitle.value,
        lastLimitedRefresh: lastLimitedRefresh.value,
        limitedShopItems: limitedShopItems.value,
        useOriginalStyle: useOriginalStyle.value,
        darkMode: darkMode.value,
        unlockedHiddenDialogues: unlockedHiddenDialogues.value,
      }, SHOP_KEY)
    } catch {}
  }, { deep: true })

  // ===== 计算属性 =====
  const allCatalogItems = computed(() => [...catalog, ...gachaPool, ...(premiumGachaPool || [])])

  const calendarEffectMap = {
    classic: { kind: 'base', target: 'topBar', premium: false, tier: 'basic', intensity: 1 },
    summer: { kind: 'accent', target: 'topBar', premium: false, tier: 'basic', intensity: 1 },
    sunset: { kind: 'accent', target: 'topBar', premium: false, tier: 'basic', intensity: 1 },
    autumn: { kind: 'accent', target: 'dayCellChecked', premium: false, tier: 'basic', intensity: 1 },
    spring: { kind: 'overlay', target: 'dayCellToday', premium: false, tier: 'basic', intensity: 1 },
    coral: { kind: 'overlay', target: 'legend', premium: false, tier: 'basic', intensity: 1 },
    winter: { kind: 'micro-anim', target: 'dayCellToday', premium: false, tier: 'basic', intensity: 1 },
    mountain: { kind: 'overlay', target: 'stats', premium: false, tier: 'basic', intensity: 1 },
    rain: { kind: 'micro-anim', target: 'topBar', premium: false, tier: 'basic', intensity: 1 },
    retro: { kind: 'accent', target: 'legend', premium: false, tier: 'basic', intensity: 1 },
    starry: { kind: 'premium-overlay', target: 'topBar', premium: true, tier: 'premium', intensity: 2 },
    galaxy: { kind: 'premium-overlay', target: 'dayCellChecked', premium: true, tier: 'premium', intensity: 3 },
    nebula: { kind: 'premium-overlay', target: 'dayCellToday', premium: true, tier: 'premium', intensity: 3 },
    galaxy_deep: { kind: 'premium-overlay', target: 'topBar', premium: true, tier: 'premium', intensity: 3 },
    forest: { kind: 'premium-overlay', target: 'stats', premium: true, tier: 'premium', intensity: 3 },
    snow: { kind: 'premium-overlay', target: 'legend', premium: true, tier: 'premium', intensity: 2 },
    cherry_blossom: { kind: 'overlay', target: 'dayCellToday', premium: false, tier: 'basic', intensity: 1 },
    misty: { kind: 'overlay', target: 'topBar', premium: false, tier: 'basic', intensity: 1 },
    golden: { kind: 'accent', target: 'dayCellChecked', premium: false, tier: 'basic', intensity: 1 },
  }

  const calendarPremiumStyleMap = {
    cal_starry: {
      tone: 'moonlit',
      accent: 'linear-gradient(135deg, rgba(181,171,255,0.92), rgba(133,120,214,0.92))',
      overlay: 'radial-gradient(circle at top left, rgba(223,216,255,0.28), transparent 45%)',
      tag: '月光星辉',
      checkedGlow: '0 0 0 1px rgba(220,214,255,0.35), 0 10px 24px rgba(120,110,170,0.18)',
      motion: 'float-stars',
    },
    cal_galaxy: {
      tone: 'nebula',
      accent: 'linear-gradient(135deg, rgba(132,121,214,0.96), rgba(86,76,150,0.96))',
      overlay: 'radial-gradient(circle at top right, rgba(166,151,255,0.24), transparent 42%)',
      tag: '星河深境',
      checkedGlow: '0 0 0 1px rgba(188,180,255,0.3), 0 12px 28px rgba(92,84,142,0.22)',
      motion: 'nebula-drift',
    },
    gacha_cal_nebula: {
      tone: 'mist',
      accent: 'linear-gradient(135deg, rgba(143,177,212,0.96), rgba(92,126,168,0.96))',
      overlay: 'radial-gradient(circle at top center, rgba(209,224,245,0.28), transparent 48%)',
      tag: '云雾星云',
      checkedGlow: '0 0 0 1px rgba(205,225,244,0.26), 0 10px 24px rgba(92,126,168,0.2)',
      motion: 'mist-sweep',
    },
    cal_classic: {
      tone: 'paper',
      accent: 'linear-gradient(135deg, rgba(214,160,180,0.9), rgba(200,176,160,0.9))',
      overlay: 'radial-gradient(circle at top left, rgba(255,245,240,0.18), transparent 48%)',
      tag: '纸感初版',
      checkedGlow: '0 6px 18px rgba(212,160,180,0.14)',
      motion: 'paper-breathe',
    },
    cal_summer: {
      tone: 'sunflower',
      accent: 'linear-gradient(135deg, rgba(226,190,102,0.92), rgba(174,204,102,0.92))',
      overlay: 'radial-gradient(circle at top right, rgba(255,244,200,0.24), transparent 44%)',
      tag: '向日暖季',
      checkedGlow: '0 8px 22px rgba(226,190,102,0.18)',
      motion: 'sun-glow',
    },
    cal_sunset: {
      tone: 'dusk',
      accent: 'linear-gradient(135deg, rgba(228,148,128,0.92), rgba(198,132,170,0.92))',
      overlay: 'radial-gradient(circle at top center, rgba(255,220,220,0.2), transparent 46%)',
      tag: '暮色余晖',
      checkedGlow: '0 8px 22px rgba(228,148,128,0.18)',
      motion: 'sunset-bloom',
    },
    cal_autumn: {
      tone: 'maple',
      accent: 'linear-gradient(135deg, rgba(198,160,108,0.94), rgba(164,134,88,0.94))',
      overlay: 'radial-gradient(circle at top left, rgba(255,238,210,0.2), transparent 46%)',
      tag: '金叶秋章',
      checkedGlow: '0 8px 22px rgba(198,160,108,0.18)',
      motion: 'leaf-fall',
    },
    cal_spring: {
      tone: 'blossom',
      accent: 'linear-gradient(135deg, rgba(220,162,188,0.94), rgba(184,198,160,0.94))',
      overlay: 'radial-gradient(circle at top right, rgba(255,235,244,0.24), transparent 44%)',
      tag: '春樱新页',
      checkedGlow: '0 8px 22px rgba(220,162,188,0.18)',
      motion: 'petal-float',
    },
    cal_coral: {
      tone: 'coastal',
      accent: 'linear-gradient(135deg, rgba(232,152,170,0.92), rgba(124,190,186,0.92))',
      overlay: 'radial-gradient(circle at top center, rgba(225,247,245,0.22), transparent 45%)',
      tag: '珊瑚浅湾',
      checkedGlow: '0 8px 22px rgba(124,190,186,0.2)',
      motion: 'tide-shift',
    },
    cal_winter: {
      tone: 'frost',
      accent: 'linear-gradient(135deg, rgba(126,172,206,0.94), rgba(198,224,238,0.94))',
      overlay: 'radial-gradient(circle at top left, rgba(235,248,255,0.28), transparent 48%)',
      tag: '初雪薄霜',
      checkedGlow: '0 8px 24px rgba(126,172,206,0.2)',
      motion: 'frost-shimmer',
    },
    cal_mountain: {
      tone: 'ridge',
      accent: 'linear-gradient(135deg, rgba(148,170,160,0.94), rgba(118,140,126,0.94))',
      overlay: 'radial-gradient(circle at top right, rgba(232,240,236,0.22), transparent 46%)',
      tag: '山岭晨岚',
      checkedGlow: '0 8px 22px rgba(118,140,126,0.18)',
      motion: 'mist-peak',
    },
    cal_rain: {
      tone: 'rain',
      accent: 'linear-gradient(135deg, rgba(144,164,190,0.94), rgba(110,128,160,0.94))',
      overlay: 'radial-gradient(circle at top center, rgba(236,242,248,0.22), transparent 44%)',
      tag: '雨幕轻声',
      checkedGlow: '0 8px 22px rgba(110,128,160,0.2)',
      motion: 'rain-drift',
    },
    cal_retro: {
      tone: 'nostalgia',
      accent: 'linear-gradient(135deg, rgba(176,156,136,0.94), rgba(150,136,120,0.94))',
      overlay: 'radial-gradient(circle at top left, rgba(248,238,224,0.22), transparent 44%)',
      tag: '旧时光页',
      checkedGlow: '0 8px 22px rgba(176,156,136,0.18)',
      motion: 'film-grain',
    },
    gacha_cal_cherry_blossom: {
      tone: 'petal',
      accent: 'linear-gradient(135deg, rgba(234,172,196,0.95), rgba(208,160,184,0.95))',
      overlay: 'radial-gradient(circle at top right, rgba(255,236,244,0.28), transparent 46%)',
      tag: '花见轻粉',
      checkedGlow: '0 8px 22px rgba(234,172,196,0.2)',
      motion: 'petal-float',
    },
    gacha_cal_misty: {
      tone: 'mist',
      accent: 'linear-gradient(135deg, rgba(176,190,196,0.95), rgba(146,160,170,0.95))',
      overlay: 'radial-gradient(circle at top center, rgba(244,248,250,0.24), transparent 48%)',
      tag: '雾雨微岚',
      checkedGlow: '0 8px 22px rgba(146,160,170,0.2)',
      motion: 'mist-sweep',
    },
    gacha_cal_golden: {
      tone: 'amber',
      accent: 'linear-gradient(135deg, rgba(222,188,120,0.96), rgba(198,154,86,0.96))',
      overlay: 'radial-gradient(circle at top left, rgba(255,246,220,0.24), transparent 45%)',
      tag: '金秋微光',
      checkedGlow: '0 8px 22px rgba(222,188,120,0.2)',
      motion: 'sun-glow',
    },
    pgacha_cal_galaxy: {
      tone: 'deep-galaxy',
      accent: 'linear-gradient(135deg, rgba(106,96,176,0.98), rgba(62,56,110,0.98))',
      overlay: 'radial-gradient(circle at top right, rgba(194,186,255,0.18), transparent 40%)',
      tag: '深空银河',
      checkedGlow: '0 0 0 1px rgba(202,196,255,0.28), 0 14px 30px rgba(62,56,110,0.26)',
      motion: 'nebula-drift',
    },
    pgacha_cal_forest: {
      tone: 'forest',
      accent: 'linear-gradient(135deg, rgba(92,132,108,0.98), rgba(62,98,76,0.98))',
      overlay: 'radial-gradient(circle at top left, rgba(198,226,210,0.18), transparent 42%)',
      tag: '森境深呼吸',
      checkedGlow: '0 0 0 1px rgba(198,226,210,0.24), 0 14px 30px rgba(62,98,76,0.24)',
      motion: 'mist-peak',
    },
    pgacha_cal_snow: {
      tone: 'snow',
      accent: 'linear-gradient(135deg, rgba(168,200,224,0.98), rgba(120,154,186,0.98))',
      overlay: 'radial-gradient(circle at top center, rgba(236,246,255,0.2), transparent 44%)',
      tag: '雪国静白',
      checkedGlow: '0 0 0 1px rgba(236,246,255,0.22), 0 14px 30px rgba(120,154,186,0.22)',
      motion: 'frost-shimmer',
    },
  }

  function getItem(id) {
    return allCatalogItems.value.find(i => i.id === id)
  }

  function getCalendarEffect(itemOrId) {
    const item = typeof itemOrId === 'string' ? getItem(itemOrId) : itemOrId
    if (!item || item.category !== 'calendar') return null
    return {
      id: item.id,
      name: item.name,
      icon: item.icon,
      source: item.source || 'shop',
      isPremium: !!item.isPremium,
      style: item.data?.style || 'default',
      ...calendarEffectMap[item.data?.style || 'default'],
    }
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
    const gameStore = useGameStore()
    for (const hd of hiddenDialogues) {
      if (unlockedHiddenDialogues.value.includes(hd.id)) continue
      if (purchasedItems.value.includes(hd.itemId)) {
        unlockedHiddenDialogues.value.push(hd.id)
        newDialogues.push(hd)
        // 同步到游戏存档的收集列表
        if (!gameStore.collectedDialogues.includes(hd.id)) {
          gameStore.collectedDialogues.push(hd.id)
        }
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
    const allItems = [...catalog, ...gachaPool, ...(premiumGachaPool || [])]
    return allItems.filter(i => i.category === 'quote').map(i => ({ id: i.id, name: i.name, icon: i.icon }))
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

  function buyTitle(titleId) {
    const t = getTitle(titleId)
    if (!t || ownedTitles.value.includes(titleId)) return { ok: false }
    const gameStore = useGameStore()
    if (gameStore.coins < t.cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= t.cost
    gameStore.totalSpent += t.cost
    if (t.cost > 0) gameStore.logCoin(-t.cost, `🏅 ${t.name}`)
    ownedTitles.value.push(titleId)
    gameStore.checkAchievements()
    const achievementToasts = gameStore.popToasts()
    checkTitles()
    return { ok: true, toasts: [`🏅 获得称号「${t.name}」！`, ...achievementToasts] }
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
    gameStore.logCoin(-item.price, `🛒 ${item.name}`)
    if (item.type === 'consumable') {
      consumables.value[item.data.propKey] = (consumables.value[item.data.propKey] || 0) + 1
    } else {
      purchasedItems.value.push(itemId)
    }
    gameStore.checkAchievements()
    const achievementToasts = gameStore.popToasts()
    const newTitles = checkTitles()
    const toasts = []
    if (item.type !== 'consumable') toasts.push(`🎉 购买成功：${item.name}`)
    newTitles.forEach(t => toasts.push(`🏅 解锁称号「${t.name}」！`))
    toasts.push(...achievementToasts)
    return { ok: true, toasts }
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
    gameStore.logCoin(-discountedPrice, `⏰ ${item.name}(-${limitedItem.discount}%)`)
    if (item.type === 'consumable') {
      consumables.value[item.data.propKey] = (consumables.value[item.data.propKey] || 0) + 1
    } else {
      purchasedItems.value.push(limitedItem.id)
    }
    gameStore.checkAchievements()
    const achievementToasts = gameStore.popToasts()
    const newTitles = checkTitles()
    const toasts = [`🎉 限时折扣购买成功！`]
    newTitles.forEach(t => toasts.push(`🏅 解锁称号「${t.name}」！`))
    toasts.push(...achievementToasts)
    return { ok: true, toasts }
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
    const cost = times === 5 ? 225 : 50
    if (gameStore.coins < cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= cost
    gameStore.logCoin(-cost, `🎰 普通抽奖×${times}`)
    totalGachaPulls.value += times

    const results = []
    let gotItemInFive = false

    for (let i = 0; i < times; i++) {
      let rarity
      let pityTriggered = false
      if (gachaCount.value >= 30) {
        rarity = Math.random() < 0.1 ? 'legendary' : 'epic'
        pityTriggered = true
      } else if (times === 5 && i === times - 1 && !gotItemInFive) {
        const roll = Math.random() * 100
        rarity = roll < 0.5 ? 'legendary' : roll < 3.5 ? 'epic' : 'rare'
      } else {
        const roll = Math.random() * 100
        if (roll < 0.5) rarity = 'legendary'
        else if (roll < 3.5) rarity = 'epic'
        else if (roll < 15.5) rarity = 'rare'
        else rarity = 'normal'
      }

      if (rarity === 'normal') {
        gachaCount.value++
        const reward = gachaNormalRewards[Math.floor(Math.random() * gachaNormalRewards.length)]
        gameStore.coins += reward.amount
        results.push({ ...reward, rarity: 'normal' })
      } else {
        const pool = gachaPool.filter(g => g.rarity === rarity)
        const unowned = pool.filter(g => !isOwned(g.id))
        if (unowned.length > 0) {
          const item = unowned[Math.floor(Math.random() * unowned.length)]
          purchasedItems.value.push(item.id)
          results.push({ ...item, rarity })
          gachaCount.value = 0
          gotItemInFive = true
        } else {
          const bonus = rarity === 'legendary' ? 200 : rarity === 'epic' ? 100 : 50
          gameStore.coins += bonus
          results.push({ type: 'coins', amount: bonus, name: `${bonus} 金币`, icon: '💰', rarity })
          if (pityTriggered) { gachaCount.value = 0 } else { gachaCount.value++ }
        }
      }
    }

    gachaHistory.value = results
    gameStore.checkAchievements()
    const achievementToasts = gameStore.popToasts()
    const newTitles = checkTitles()
    const toasts = []
    results.forEach(r => {
      if (r.rarity === 'legendary' || r.rarity === 'epic' || r.rarity === 'rare') {
        if (r.type !== 'coins') toasts.push(`🎁 获得${r.rarity === 'legendary' ? '传说' : r.rarity === 'epic' ? '史诗' : '稀有'}物品「${r.name}」`)
      }
    })
    newTitles.forEach(t => toasts.push(`🏅 解锁称号「${t.name}」！`))
    toasts.push(...achievementToasts)
    return { ok: true, results, toasts }
  }

  // ===== 高级抽奖 =====
  function pullPremiumGacha(times = 1) {
    const gameStore = useGameStore()
    const cost = times === 5 ? 900 : 200
    if (gameStore.coins < cost) return { ok: false, reason: 'insufficient' }
    gameStore.coins -= cost
    gameStore.logCoin(-cost, `💎 高级抽奖×${times}`)
    totalGachaPulls.value += times

    const results = []
    let gotItemInFive = false

    for (let i = 0; i < times; i++) {
      let rarity
      let pityTriggered = false
      if (premiumGachaCount.value >= 20) {
        rarity = 'legendary'
        pityTriggered = true
      } else if (times === 5 && i === times - 1 && !gotItemInFive) {
        rarity = Math.random() < 0.15 ? 'legendary' : 'epic'
      } else {
        const roll = Math.random() * 100
        if (roll < 3) rarity = 'legendary'
        else if (roll < 15) rarity = 'epic'
        else if (roll < 40) rarity = 'rare'
        else rarity = 'normal'
      }

      if (rarity === 'normal') {
        premiumGachaCount.value++
        const reward = { type: 'coins', amount: 80, name: '80 金币', icon: '💰' }
        gameStore.coins += 80
        results.push({ ...reward, rarity: 'normal' })
      } else {
        const pool = (premiumGachaPool || []).filter(g => g.rarity === rarity)
        const unowned = pool.filter(g => !isOwned(g.id))
        if (unowned.length > 0) {
          const item = unowned[Math.floor(Math.random() * unowned.length)]
          purchasedItems.value.push(item.id)
          results.push({ ...item, rarity })
          premiumGachaCount.value = 0
          gotItemInFive = true
        } else {
          const fallbackPool = gachaPool.filter(g => g.rarity === rarity)
          const fallbackUnowned = fallbackPool.filter(g => !isOwned(g.id))
          if (fallbackUnowned.length > 0) {
            const item = fallbackUnowned[Math.floor(Math.random() * fallbackUnowned.length)]
            purchasedItems.value.push(item.id)
            results.push({ ...item, rarity })
            premiumGachaCount.value = 0
            gotItemInFive = true
          } else {
            const bonus = rarity === 'legendary' ? 500 : rarity === 'epic' ? 250 : 100
            gameStore.coins += bonus
            results.push({ type: 'coins', amount: bonus, name: `${bonus} 金币`, icon: '💰', rarity })
            if (pityTriggered) { premiumGachaCount.value = 0 } else { premiumGachaCount.value++ }
          }
        }
      }
    }

    gachaHistory.value = results
    gameStore.checkAchievements()
    const achievementToasts = gameStore.popToasts()
    const newTitles = checkTitles()
    const toasts = []
    results.forEach(r => {
      if (r.type !== 'coins') toasts.push(`🎁 获得${r.rarity === 'legendary' ? '传说' : r.rarity === 'epic' ? '史诗' : '稀有'}物品「${r.name}」`)
    })
    newTitles.forEach(t => toasts.push(`🏅 解锁称号「${t.name}」！`))
    toasts.push(...achievementToasts)
    return { ok: true, results, toasts }
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
    premiumGachaCount.value = 0
    selectedQuoteCategories.value = def.selectedQuoteCategories
    quoteCategoriesExplicitlySet.value = def.quoteCategoriesExplicitlySet
    ownedTitles.value = def.ownedTitles
    activeTitle.value = def.activeTitle
    lastLimitedRefresh.value = def.lastLimitedRefresh
    limitedShopItems.value = def.limitedShopItems
    unlockedHiddenDialogues.value = def.unlockedHiddenDialogues
    useOriginalStyle.value = false
    darkMode.value = false
    saveState({
      purchasedItems: purchasedItems.value, equippedItems: equippedItems.value,
      consumables: consumables.value, gachaCount: gachaCount.value, gachaHistory: gachaHistory.value,
      totalGachaPulls: totalGachaPulls.value, premiumGachaCount: premiumGachaCount.value, selectedQuoteCategories: selectedQuoteCategories.value,
      quoteCategoriesExplicitlySet: quoteCategoriesExplicitlySet.value,
      ownedTitles: ownedTitles.value, activeTitle: activeTitle.value,
      lastLimitedRefresh: lastLimitedRefresh.value, limitedShopItems: limitedShopItems.value,
      useOriginalStyle: useOriginalStyle.value, darkMode: darkMode.value,
      unlockedHiddenDialogues: unlockedHiddenDialogues.value,
    }, SHOP_KEY)
  }

  function toggleOriginalStyle() { useOriginalStyle.value = !useOriginalStyle.value }
  function toggleDarkMode() { darkMode.value = !darkMode.value }

  return {
    purchasedItems, equippedItems, consumables, gachaCount, gachaHistory, totalGachaPulls, premiumGachaCount, selectedQuoteCategories, quoteCategoriesExplicitlySet,
    ownedTitles, activeTitle, lastLimitedRefresh, limitedShopItems, useOriginalStyle, darkMode,
    allCatalogItems, activeTheme, activeEffect, activeFrame, extraQuotes, allQuoteCategories,
    coinBonusRate, unlockedHiddenDialogues, allUnlockedDialogues,
    getItem, isOwned, isEquipped, ownedCount, categoryTotal, getTitle,
    getCalendarEffect,
    buyItem, equipItem, useConsumable, pullGacha, pullPremiumGacha, resetShop,
    toggleQuoteCategory, setQuoteCategories, toggleOriginalStyle, toggleDarkMode,
    buyTitle, equipTitle, checkTitles, buyLimitedItem, checkHiddenDialogues,
  }
})
