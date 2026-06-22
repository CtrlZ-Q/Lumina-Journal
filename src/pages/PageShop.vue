<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { catalog, categories, gachaPool, premiumGachaPool } from '../data/catalog'
import { titleDefs } from '../stores/shop'
import ShopItemAnim from '../components/ShopItemAnim.vue'
import { getItemAnimation, shouldShowAnim } from '../data/shopAnimations'

const gameStore = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['show-toast'])

const shopCategories = categories.filter(c => c.key !== 'title' && c.key !== 'mine')
const activeCat = ref('all')
const showPurchase = ref(false)
const purchaseItem = ref(null)
const showGachaResult = ref(false)
const gachaResults = ref([])
const showGachaPreview = ref(false)
const showPremiumGachaResult = ref(false)
const premiumGachaResults = ref([])

// 赌博动画
const showGamble = ref(false)
const gambleIcon = ref('')
const gambleSpinning = ref(false)
const gambleResult = ref(null)

// 老虎机动画
const showSlot = ref(false)
const slotSpinning = ref(false)
const slotIcons = ref(['🎰', '🎰', '🎰'])
const slotResults = ref([])
const slotIsPremium = ref(false)

// 语录类别列表
const quoteCategories = computed(() => {
  const allItems = [...catalog, ...gachaPool, ...(premiumGachaPool || [])]
  return allItems.filter(i => i.category === 'quote').map(i => ({
    id: i.id,
    name: i.name,
    icon: i.icon,
    owned: shop.isOwned(i.id),
    selected: (shop.selectedQuoteCategories.length === 0 && !shop.quoteCategoriesExplicitlySet) || shop.selectedQuoteCategories.includes(i.id),
  }))
})

// 商品描述映射（每个商品独立描述）
const itemDescs = {
  // 主题
  theme_purple: '深邃紫色调，沉稳内敛，适合安静的夜晚',
  theme_pink: '浪漫樱花粉，温柔甜美，点亮每一天的好心情',
  theme_blue: '清新海洋蓝，开阔舒畅，像海风拂面',
  theme_green: '生机森林绿，自然清爽，回归宁静',
  theme_orange: '温暖日落橙，活力满满，驱散阴霾',
  theme_black: '深邃星空黑，神秘酷炫，暗夜中的星辰',
  theme_red: '炽热烈焰红，热情奔放，燃烧你的卡路里',
  theme_dream: '梦幻紫粉渐变，如梦如幻，少女心爆棚',
  theme_ice: '清透冰川白，纯净优雅，冬日里的温柔',
  theme_autumn: '秋日暖阳配色，温馨舒适，像被毛毯包裹',
  theme_mint: '清爽薄荷青，透心凉，夏日专属',
  theme_cyber: '赛博朋克风格，霓虹闪烁，未来感十足',
  theme_sunset: '晚霞渐变色，从粉到金，每天都是日落时分',
  theme_forest: '深林配色，幽静深远，森林浴的感觉',
  theme_cherry: '樱桃红，甜美可口，让人心动的颜色',
  theme_lavender: '薰衣草田紫，优雅浪漫，法式田园风',
  theme_aurora: '极光配色，蓝紫交织，来自北极的礼物',
  theme_galaxy: '银河深空配色，深邃神秘，宇宙的浪漫',
  theme_coral: '珊瑚海配色，粉嫩温柔，海底世界的色彩',
  theme_matcha: '抹茶绿配色，清新自然，日式治愈',
  // 特效
  effect_confetti: '签到时满屏撒花，庆祝每一天的坚持',
  effect_fireworks: '签到时绽放烟花，绚烂夺目',
  effect_lightning: '签到时电闪雷鸣，霸气侧漏',
  effect_rainbow: '签到时彩虹横跨屏幕，好运连连',
  effect_explosion: '签到时震撼爆炸效果，冲击力拉满',
  effect_leaves: '签到时落叶纷飞，秋意盎然',
  effect_butterfly: '签到时蝴蝶翩翩起舞，优雅浪漫',
  effect_stars: '签到时繁星闪烁，如入星空',
  effect_sakura: '签到时樱花飘落，浪漫唯美',
  effect_snow: '签到时雪花纷飞，冬日氛围感',
  effect_bubble: '签到时梦幻泡泡升起，轻盈可爱',
  effect_comet: '签到时彗星划过，许个愿吧',
  effect_galaxy: '签到时银河漩涡旋转，宇宙级震撼',
  effect_fire: '签到时烈焰燃烧，热血沸腾',
  effect_magic_circle: '签到时魔法阵浮现，神秘力量',
  effect_aurora: '签到时极光流动，梦幻至极',
  // 相框
  frame_classic: '经典紫色边框，简约大方，百搭之选',
  frame_heart: '粉色爱心虚线框，甜蜜浪漫风格',
  frame_nature: '绿色双线框，清新自然，生机勃勃',
  frame_star: '金色星光框，闪耀夺目，像星星一样发光',
  frame_crystal: '水晶质感边框，通透精致，高级感满满',
  frame_bow: '蝴蝶结风格框，可爱甜美，少女必备',
  frame_dark: '暗黑风格框，深色背景红边，酷炫神秘',
  frame_rainbow: '彩虹渐变框，七彩绚烂，活力四射',
  frame_gold: '金色奢华框，金碧辉煌，尊贵体验',
  frame_ocean: '海洋蓝框，深邃宁静，大海的感觉',
  frame_cherry: '樱花粉框，柔美细腻，春天的气息',
  frame_neon: '霓虹紫框暗黑底，赛博朋克风',
  frame_galaxy: '银河深空框，星际穿越风格',
  frame_aurora: '极光渐变框，北极光之美',
  frame_steampunk: '蒸汽朋克齿轮框，复古机械风',
  frame_sakura_rain: '樱花雨虚线框，粉色浪漫',
  // 语录
  quote_love_1: '250条情感语录·壹，关于遇见与心动',
  quote_love_2: '250条情感语录·贰，关于陪伴与温暖',
  quote_love_3: '250条情感语录·叁，关于思念与守候',
  quote_love_4: '250条情感语录·肆，关于永恒与承诺',
  quote_fight_1: '250条热血奋斗语录·壹，关于拼搏与坚持',
  quote_fight_2: '250条热血奋斗语录·贰，关于突破与超越',
  quote_fight_3: '250条热血奋斗语录·叁，关于汗水与收获',
  quote_fight_4: '250条热血奋斗语录·肆，关于信念与胜利',
  quote_heal_1: '250条温暖治愈语录·壹，关于自我与和解',
  quote_heal_2: '250条温暖治愈语录·贰，关于温柔与力量',
  quote_heal_3: '250条温暖治愈语录·叁，关于放下与前行',
  quote_heal_4: '250条温暖治愈语录·肆，关于阳光与希望',
  quote_wisdom_1: '250条人生智慧语录·壹，关于取舍与选择',
  quote_wisdom_2: '250条人生智慧语录·贰，关于修行与境界',
  quote_wisdom_3: '250条人生智慧语录·叁，关于看透与放下',
  quote_wisdom_4: '250条人生智慧语录·肆，关于通透与从容',
  quote_youth_1: '250条青春热血语录·壹，关于梦想与勇气',
  quote_youth_2: '250条青春热血语录·贰，关于无畏与热爱',
  quote_youth_3: '250条青春热血语录·叁，关于冲劲与拼搏',
  quote_youth_4: '250条青春热血语录·肆，关于可能与无限',
  quote_nature_1: '250条自然诗意语录·壹，关于春天与花开',
  quote_nature_2: '250条自然诗意语录·贰，关于夏天与星空',
  quote_nature_3: '250条自然诗意语录·叁，关于秋天与落叶',
  quote_nature_4: '250条自然诗意语录·肆，关于冬天与暖阳',
  quote_lonely_1: '250条孤独独白语录·壹，关于独处与自由',
  quote_lonely_2: '250条孤独独白语录·贰，关于思考与清醒',
  quote_lonely_3: '250条孤独独白语录·叁，关于安静与力量',
  quote_lonely_4: '250条孤独独白语录·肆，关于夜晚与星辰',
  quote_humor_1: '250条幽默搞笑语录·壹，关于自嘲与真相',
  quote_humor_2: '250条幽默搞笑语录·贰，关于生活与吐槽',
  quote_humor_3: '250条幽默搞笑语录·叁，关于摸鱼与快乐',
  quote_humor_4: '250条幽默搞笑语录·肆，关于日常与段子',
  quote_food_1: '250条美食治愈语录·壹，关于烟火与温暖',
  quote_food_2: '250条美食治愈语录·贰，关于味道与幸福',
  quote_food_3: '250条美食治愈语录·叁，关于吃货与满足',
  quote_food_4: '250条美食治愈语录·肆，关于厨房与治愈',
  quote_travel_1: '250条旅行探索语录·壹，关于远方与出发',
  quote_travel_2: '250条旅行探索语录·贰，关于风景与自由',
  quote_travel_3: '250条旅行探索语录·叁，关于冒险与发现',
  quote_travel_4: '250条旅行探索语录·肆，关于路上与归来',
  quote_growth_1: '250条成长蜕变语录·壹，关于改变与突破',
  quote_growth_2: '250条成长蜕变语录·贰，关于反思与强大',
  quote_growth_3: '250条成长蜕变语录·叁，关于挫折与成长',
  quote_growth_4: '250条成长蜕变语录·肆，关于蜕变与新生',
  quote_dream_1: '250条梦想追逐语录·壹，关于星辰与远方',
  quote_dream_2: '250条梦想追逐语录·贰，关于坚持与行动',
  quote_dream_3: '250条梦想追逐语录·叁，关于想象与创造',
  quote_dream_4: '250条梦想追逐语录·肆，关于实现与超越',
  // 音效
  sound_bell: '清脆的铃声提示，简单明快',
  sound_melody: '欢快的三音旋律，愉悦动听',
  sound_nature: '自然白噪音，放松舒缓',
  sound_piano: '钢琴和弦音，优雅动听',
  sound_pixel: '像素游戏音效，复古怀旧',
  sound_fanfare: '胜利号角四音阶，凯旋而归',
  sound_chime: '风铃般的声音，清灵悦耳',
  sound_drum: '鼓点节奏，有力坚定',
  sound_guitar: '吉他扫弦音，温暖治愈',
  sound_magic: '魔法音效，神秘空灵',
  sound_crystal: '水晶般清澈的高音序列，纯净透亮',
  sound_wind: '轻柔的风声，自然舒适',
  sound_ocean: '海浪声，仿佛置身海边',
  sound_space: '太空音效序列，深邃神秘',
  // 日历
  cal_classic: '经典粉色网格日历，默认清新风格',
  cal_autumn: '秋日暖阳配色，金黄温馨',
  cal_winter: '冬日初雪配色，冰蓝清冽',
  cal_spring: '春日樱花配色，粉嫩浪漫',
  cal_starry: '星空夜语配色，深紫神秘，适合暗色爱好者',
  cal_summer: '夏日向日葵配色，明黄活力',
  cal_rain: '雨天灰蓝配色，安静文艺',
  cal_retro: '复古棕黄配色，怀旧质感',
  cal_galaxy: '星河深空配色，与星空日历同款',
  cal_coral: '珊瑚粉色配色，温柔甜美',
  cal_mountain: '山川冰蓝配色，大气磅礴',
  cal_sunset: '日落暖橙配色，温暖治愈',
  // 道具
  item_double: '下次签到金币×2，50%概率回本',
  item_box: '随机获得0~100币，50%概率赚',
  item_crystal: '查看今日趣味运势，看看运气如何',
  item_wheel: '随机获得0~200币，50%概率赚',
  item_triple: '下次签到金币×3，50%概率回本',
  item_mystery: '随机获得0~400币，50%概率赚',
  item_lucky: '下次签到额外+0~50币，50%概率赚',
  item_refresh: '刷新今日语录，换个心情',
  item_lucky_star: '下次签到额外+0~100币，50%概率赚',
  item_golden_touch: '随机获得0~1000币，50%概率赚',
  item_magnet: '金币磁铁，下次签到金币×5，50%概率回本',
}

function getItemDesc(item) {
  if (item.type === 'consumable') return item.data.desc || itemDescs[item.id] || '消耗类道具'
  return item.desc || itemDescs[item.id] || itemDescs[item.category] || ''
}

// 筛选商品
const filteredItems = computed(() => {
  if (activeCat.value === 'all') return catalog
  if (activeCat.value === 'mine') return []
  if (activeCat.value === 'gacha') return []
  return catalog.filter(i => i.category === activeCat.value)
})

// 分组显示（全部模式）
const groupedItems = computed(() => {
  if (activeCat.value !== 'all') return null
  const groups = []
  const cats = ['theme', 'effect', 'frame', 'quote', 'sound', 'calendar', 'item']
  for (const cat of cats) {
    const items = catalog.filter(i => i.category === cat)
    if (items.length > 0) {
      const catInfo = categories.find(c => c.key === cat)
      groups.push({ key: cat, icon: catInfo.icon, label: catInfo.label, items })
    }
  }
  return groups
})

// 抽奖奖品池按品质分组
const gachaByRarity = computed(() => {
  return {
    legendary: gachaPool.filter(g => g.rarity === 'legendary'),
    epic: gachaPool.filter(g => g.rarity === 'epic'),
    rare: gachaPool.filter(g => g.rarity === 'rare'),
  }
})

const premiumGachaByRarity = computed(() => {
  return {
    legendary: (premiumGachaPool || []).filter(g => g.rarity === 'legendary'),
    epic: (premiumGachaPool || []).filter(g => g.rarity === 'epic'),
    rare: (premiumGachaPool || []).filter(g => g.rarity === 'rare'),
  }
})

const activeGachaByRarity = computed(() => {
  return activeCat.value === 'premium_gacha' ? premiumGachaByRarity.value : gachaByRarity.value
})

// 我的物品 — 按类别分组
const myEquipableByCategory = computed(() => {
  const catOrder = ['theme', 'effect', 'frame', 'sound', 'calendar']
  const groups = []
  for (const cat of catOrder) {
    const items = shop.purchasedItems
      .map(id => shop.getItem(id))
      .filter(i => i && (i.type === 'equipable' || i.type === 'collectible') && i.category === cat)
    if (items.length > 0) {
      const catInfo = categories.find(c => c.key === cat)
      groups.push({ key: cat, icon: catInfo.icon, label: catInfo.label, items })
    }
  }
  return groups
})

const myQuoteItems = computed(() => {
  return shop.purchasedItems
    .map(id => shop.getItem(id))
    .filter(i => i && i.category === 'quote')
})

const myConsumables = computed(() => {
  return Object.entries(shop.consumables)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const item = catalog.find(i => i.type === 'consumable' && i.data.propKey === key)
      return item ? { ...item, count } : null
    })
    .filter(Boolean)
})

function onItemClick(item) {
  // 弹出详情，不管是已拥有还是未拥有
  purchaseItem.value = item
  showPurchase.value = true
}

function handleBuy() {
  if (!purchaseItem.value) return
  const result = shop.buyItem(purchaseItem.value.id)
  if (result.ok) {
    if (purchaseItem.value.type !== 'consumable') {
      showPurchase.value = false
      purchaseItem.value = null
    }
    result.toasts?.forEach((msg) => emit('show-toast', msg))
  } else if (result.reason === 'insufficient') {
    emit('show-toast', '❌ 金币不足')
  } else if (result.reason === 'owned') {
    emit('show-toast', '❌ 已拥有该物品')
  }
}

function handleEquip(item) {
  if (shop.isEquipped(item.category, item.id)) {
    shop.equipItem(item.category, null)
  } else {
    shop.equipItem(item.category, item.id)
  }
  showPurchase.value = false
}

// 被动道具：签到时自动消耗，不在商店使用
const passiveItems = ['lucky', 'double_coin', 'triple_coin', 'lucky_star', 'magnet']

function handleUse(item) {
  const propKey = item.data.propKey

  // 被动道具只显示信息，不消耗
  if (passiveItems.includes(propKey)) {
    const msgs = {
      lucky: `🍀 持有 ×${shop.consumables.lucky}，签到时自动+0~50币`,
      double_coin: `✨ 持有 ×${shop.consumables.double_coin}，签到时自动金币×2`,
      triple_coin: `💎 持有 ×${shop.consumables.triple_coin}，签到时自动金币×3`,
      lucky_star: `⭐ 持有 ×${shop.consumables.lucky_star}，签到时自动+0~100币`,
      magnet: `🧲 持有 ×${shop.consumables.magnet}，签到时自动金币×5`,
    }
    purchaseItem.value = { ...item, resultDesc: msgs[propKey], isResult: true }
    return
  }

  // 主动道具：立即消耗
  if (!shop.useConsumable(propKey)) return

  if (propKey === 'random_box') {
    showGambleAnim(item, '🎁', () => {
      const amount = Math.floor(Math.random() * 101)
      gameStore.coins += amount; gameStore.logCoin(amount, '🎁 随机礼盒')
      purchaseItem.value = { ...item, resultDesc: amount >= 50 ? `🎁 恭喜获得 ${amount} 金币！` : `🎁 运气一般，获得 ${amount} 金币...`, isResult: true }
    })
  } else if (propKey === 'mystery_box') {
    showGambleAnim(item, '📦', () => {
      const amount = Math.floor(Math.random() * 401)
      gameStore.coins += amount; gameStore.logCoin(amount, '📦 神秘礼盒')
      purchaseItem.value = { ...item, resultDesc: amount >= 200 ? `🎉 神秘礼盒开出 ${amount} 金币！` : `📦 开出了 ${amount} 金币，再试试手气？`, isResult: true }
    })
  } else if (propKey === 'crystal') {
    const fortunes = ['大吉 🎉 今天运气爆棚！', '中吉 😊 一切顺利~', '小吉 🙂 平平淡淡才是真', '末吉 😅 小心行事', '凶 😱 建议今天别出门']
    purchaseItem.value = { ...item, resultDesc: fortunes[Math.floor(Math.random() * fortunes.length)], isResult: true }
  } else if (propKey === 'wheel') {
    showGambleAnim(item, '🎰', () => {
      const amount = Math.floor(Math.random() * 201)
      gameStore.coins += amount; gameStore.logCoin(amount, '🎰 每日转盘')
      purchaseItem.value = { ...item, resultDesc: amount >= 100 ? `🎰 恭喜获得 ${amount} 金币！` : `🎰 获得 ${amount} 金币，下次一定更好！`, isResult: true }
    })
  } else if (propKey === 'refresh') {
    const newQuote = gameStore.getDialogue(shop)
    purchaseItem.value = { ...item, resultDesc: `🔄 今日语录已刷新！\n「${newQuote}」`, isResult: true }
  } else if (propKey === 'golden_touch') {
    showGambleAnim(item, '👆', () => {
      const amount = Math.floor(Math.random() * 1001)
      gameStore.coins += amount; gameStore.logCoin(amount, '👆 点金术')
      purchaseItem.value = { ...item, resultDesc: amount >= 500 ? `👆 点金术大成功！获得 ${amount} 金币！` : `👆 点金术生效，获得 ${amount} 金币`, isResult: true }
    })
  }
  // 非赌博道具立即检查成就；赌博道具在动画回调中检查
  if (!['random_box', 'mystery_box', 'wheel', 'golden_touch'].includes(propKey)) {
    gameStore.checkAchievements()
    const toasts = gameStore.popToasts()
    toasts.forEach(msg => emit('show-toast', msg))
  }
}

function showGambleAnim(item, icon, callback) {
  gambleIcon.value = icon
  gambleResult.value = null
  gambleSpinning.value = true
  showGamble.value = true
  showPurchase.value = false
  setTimeout(() => {
    gambleSpinning.value = false
    callback()
    setTimeout(() => {
      showGamble.value = false
      showPurchase.value = true
      gameStore.checkAchievements()
      const toasts = gameStore.popToasts()
      toasts.forEach(msg => emit('show-toast', msg))
    }, 1200)
  }, 1500)
}

function handlePullGacha(times) {
  const result = shop.pullGacha(times)
  if (result.ok) {
    showSlotMachine(result.results, false)
    result.toasts?.forEach((msg) => emit('show-toast', msg))
  } else {
    emit('show-toast', '❌ 金币不足')
  }
}

function handlePullPremiumGacha(times) {
  const result = shop.pullPremiumGacha(times)
  if (result.ok) {
    showSlotMachine(result.results, true)
    result.toasts?.forEach((msg) => emit('show-toast', msg))
  } else {
    emit('show-toast', '❌ 金币不足')
  }
}

function showSlotMachine(results, isPremium) {
  slotResults.value = results
  slotIsPremium.value = isPremium
  slotSpinning.value = true
  showSlot.value = true
  const allIcons = ['🎰', '💎', '🌟', '💫', '✨', '🎯', '🔮', '🎪']
  let count = 0
  const interval = setInterval(() => {
    slotIcons.value = results.map(() => allIcons[Math.floor(Math.random() * allIcons.length)])
    count++
    if (count > 15) {
      clearInterval(interval)
      slotIcons.value = results.map(r => r.icon || '💰')
      slotSpinning.value = false
    }
  }, 100)
}

function closeSlot() {
  showSlot.value = false
  if (slotIsPremium.value) {
    premiumGachaResults.value = slotResults.value
    showPremiumGachaResult.value = true
  } else {
    gachaResults.value = slotResults.value
    showGachaResult.value = true
  }
}

function handleBuyLimited(limitedItem) {
  const result = shop.buyLimitedItem(limitedItem)
  if (result.ok) {
    result.toasts?.forEach((msg) => emit('show-toast', msg))
  } else if (result.reason === 'insufficient') {
    emit('show-toast', '❌ 金币不足')
  }
}

function handleBuyTitle(title) {
  const result = shop.buyTitle(title.id)
  if (result.ok) {
    result.toasts?.forEach((msg) => emit('show-toast', msg))
  } else if (result.reason === 'insufficient') {
    emit('show-toast', '❌ 金币不足')
  }
}

function getCardClass(item) {
  if (item.type === 'consumable') {
    return shop.consumables[item.data.propKey] > 0 ? 'owned' : 'buyable'
  }
  if (shop.isEquipped(item.category, item.id)) return 'equipped'
  if (shop.isOwned(item.id)) return 'owned'
  return 'buyable'
}

function getCardAction(item) {
  if (item.type === 'consumable') {
    return shop.consumables[item.data.propKey] > 0 ? `×${shop.consumables[item.data.propKey]}` : `💰 ${item.price}`
  }
  if (shop.isEquipped(item.category, item.id)) return '★ 装备中'
  if (shop.isOwned(item.id)) return '✓ 已拥有'
  return `💰 ${item.price}`
}

function getRarityColor(rarity) {
  if (rarity === 'legendary') return '#ffd700'
  if (rarity === 'epic') return '#a855f7'
  if (rarity === 'rare') return '#3b82f6'
  return '#6b7280'
}

function getRarityLabel(rarity) {
  if (rarity === 'legendary') return '✦ 传说'
  if (rarity === 'epic') return '◆ 史诗'
  if (rarity === 'rare') return '● 稀有'
  return '· 普通'
}
</script>

<template>
  <div class="shop-page">
    <!-- 顶部余额栏 -->
    <div class="shop-header">
      <div class="shop-title">🛒 金币商店</div>
      <div class="shop-header-right">
        <button class="my-items-btn" :class="{ active: activeCat === 'mine' }" @click="activeCat = 'mine'">👤 我的</button>
        <div class="shop-balance">💰 {{ gameStore.coins }}</div>
      </div>
    </div>

    <!-- 分类标签栏 -->
    <div class="shop-tabs">
      <button
        v-for="cat in shopCategories"
        :key="cat.key"
        class="tab-btn"
        :class="{ active: activeCat === cat.key }"
        @click="activeCat = cat.key"
      >
        {{ cat.icon }} {{ cat.label }}
      </button>
    </div>

    <!-- 内容区 -->
    <div class="shop-body">

      <!-- 抽奖面板 -->
      <div v-if="activeCat === 'gacha'" class="gacha-panel">
        <div class="gacha-bg">
          <div class="gacha-icon">🎰</div>
          <div class="gacha-title">幸运扭蛋</div>
          <div class="gacha-sub">试试手气，获取商店买不到的限定物品</div>

          <div class="gacha-prob">
            <span style="color:#ffd700">✦传说 0.5%</span>
            <span style="color:#a855f7">◆史诗 3%</span>
            <span style="color:#3b82f6">●稀有 12%</span>
            <span style="color:#6b7280">·普通 84.5%</span>
          </div>

          <div class="gacha-btns">
            <button class="gacha-btn single" @click="handlePullGacha(1)">
              💰 50 单抽
            </button>
            <button class="gacha-btn multi" @click="handlePullGacha(5)">
              💰 225 五连
            </button>
          </div>

          <div class="gacha-pity">🎯 距离保底还有 <b>{{ 30 - shop.gachaCount }}</b> 抽（保底至少史诗）</div>

          <button class="gacha-preview-btn" @click="showGachaPreview = true">
            🎁 查看奖品池
          </button>
        </div>
      </div>

      <!-- 限时商店 -->
      <div v-else-if="activeCat === 'limited'" class="limited-panel">
        <div class="limited-header">
          <div class="limited-title">⏰ 今日限时折扣</div>
          <div class="limited-sub">每天刷新5件折扣商品，错过不再</div>
        </div>
        <div class="limited-grid">
          <div v-for="li in shop.limitedShopItems" :key="li.id" class="limited-card" :class="{ owned: shop.isOwned(li.id) }" @click="!shop.isOwned(li.id) && handleBuyLimited(li)">
            
            <div class="limited-discount">-{{ li.discount }}%</div>
            <div class="limited-icon">{{ shop.getItem(li.id)?.icon }}</div>
            <div class="limited-name">{{ shop.getItem(li.id)?.name }}</div>
            <div class="limited-prices">
              <span class="limited-original">💰{{ shop.getItem(li.id)?.price }}</span>
              <span class="limited-now">💰{{ Math.floor(shop.getItem(li.id)?.price * (100 - li.discount) / 100) }}</span>
            </div>
            <div v-if="shop.isOwned(li.id)" class="limited-owned">已拥有</div>
          </div>
        </div>
      </div>

      <!-- 高级抽奖 -->
      <div v-else-if="activeCat === 'premium_gacha'" class="gacha-panel">
        <div class="gacha-bg premium">
          <div class="gacha-icon">💎</div>
          <div class="gacha-title">至尊扭蛋</div>
          <div class="gacha-sub">独占奖品，传说概率3%，史诗概率12%</div>

          <div class="gacha-prob">
            <span style="color:#ffd700">✦传说 3%</span>
            <span style="color:#a855f7">◆史诗 12%</span>
            <span style="color:#3b82f6">●稀有 25%</span>
            <span style="color:#6b7280">·普通 60%</span>
          </div>

          <div class="gacha-btns">
            <button class="gacha-btn single" @click="handlePullPremiumGacha(1)">
              💰 200 单抽
            </button>
            <button class="gacha-btn multi" @click="handlePullPremiumGacha(5)">
              💰 900 五连
            </button>
          </div>

          <div class="gacha-pity">🎯 距离保底还有 <b>{{ 20 - shop.premiumGachaCount }}</b> 抽（保底至少传说）</div>

          <button class="gacha-preview-btn" @click="showGachaPreview = true">
            🎁 查看奖品池
          </button>
        </div>
      </div>

      <!-- 称号系统 -->
      <div v-else-if="activeCat === 'title'" class="title-panel">
        <div class="title-header">
          <div class="title-current" v-if="shop.activeTitle">
            当前称号：{{ shop.getTitle(shop.activeTitle)?.icon }} {{ shop.getTitle(shop.activeTitle)?.name }}
          </div>
          <div class="title-current" v-else>未装备称号</div>
        </div>
        <div class="title-grid">
          <div v-for="t in titleDefs" :key="t.id" class="title-card" :class="{ owned: shop.ownedTitles.includes(t.id), equipped: shop.activeTitle === t.id }">
            <div class="title-icon">{{ t.icon }}</div>
            <div class="title-name">{{ t.name }}</div>
            <div class="title-desc">{{ t.desc }}</div>
            <div v-if="shop.ownedTitles.includes(t.id)" class="title-actions">
              <button v-if="shop.activeTitle !== t.id" class="title-equip-btn" @click="shop.equipTitle(t.id)">装备</button>
              <button v-else class="title-unequip-btn" @click="shop.equipTitle(null)">卸下</button>
            </div>
            <div v-else-if="t.cost > 0" class="title-buy">
              <button class="title-buy-btn" @click="handleBuyTitle(t)">💰 {{ t.cost }} 购买</button>
            </div>
            <div v-else class="title-locked">🔒 {{ t.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 我的物品 — 按类别分组 -->
      <div v-else-if="activeCat === 'mine'" class="mine-section">
        <template v-if="myEquipableByCategory.length > 0 || myConsumables.length > 0">
          <div v-for="group in myEquipableByCategory" :key="group.key" class="mine-group">
            <div class="mine-group-title">{{ group.icon }} {{ group.label }} <span class="mine-group-count">{{ group.items.filter(i => shop.isEquipped(i.category, i.id)).length }}/{{ group.items.length }}</span></div>
            <div class="item-grid">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="item-card"
                :class="shop.isEquipped(item.category, item.id) ? 'equipped' : 'owned'"
                @click="onItemClick(item)"
              >
                
                <div class="card-icon">{{ item.icon }}</div>
                <div class="card-name">{{ item.name }}</div>
                <div class="card-action" :class="shop.isEquipped(item.category, item.id) ? 'equipped' : 'owned'">
                  {{ shop.isEquipped(item.category, item.id) ? '★ 装备中' : '点击装备' }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="myConsumables.length > 0" class="mine-group">
            <div class="mine-group-title">🎫 持有道具</div>
            <div class="item-grid">
              <div
                v-for="item in myConsumables"
                :key="item.id"
                class="item-card owned"
                @click="onItemClick(item)"
              >
                
                <div class="card-icon">{{ item.icon }}</div>
                <div class="card-name">{{ item.name }}</div>
                <div class="card-action owned">×{{ item.count }}</div>
              </div>
            </div>
          </div>

          <!-- 语录：物品 + 显示设置 -->
          <div class="mine-group" v-if="myQuoteItems.length > 0">
            <div class="mine-group-title">
              📖 语录
              <span class="mine-group-count">{{ myQuoteItems.length }}包</span>
            </div>
            <div class="item-grid">
              <div
                v-for="item in myQuoteItems"
                :key="item.id"
                class="item-card owned"
              >
                <div class="card-icon">{{ item.icon }}</div>
                <div class="card-name">{{ item.name }}</div>
                <div class="card-action owned">{{ item.rarity ? '抽奖' : '商城' }}</div>
              </div>
            </div>
            <div class="quote-cat-hint" style="margin-top:16px">选择要在首页随机显示的语录类别（不选则全部显示）</div>
            <div class="quote-cat-grid">
              <button
                v-for="cat in quoteCategories.filter(c => c.owned)"
                :key="cat.id"
                class="quote-cat-btn"
                :class="{ active: cat.selected }"
                @click="shop.toggleQuoteCategory(cat.id)"
              >
                <span class="quote-cat-icon">{{ cat.icon }}</span>
                <span class="quote-cat-name">{{ cat.name }}</span>
              </button>
            </div>
            <div class="quote-cat-actions">
              <button class="quote-action-btn" @click="shop.setQuoteCategories([])">全选</button>
              <button class="quote-action-btn" @click="shop.setQuoteCategories(quoteCategories.filter(c => c.owned).map(c => c.id))">仅已拥有</button>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">还没有任何物品</div>
          <div class="empty-sub">去商店逛逛吧~</div>
        </div>
      </div>

      <!-- 商品列表 -->
      <template v-else>
        <template v-if="activeCat === 'all' && groupedItems">
          <div v-for="group in groupedItems" :key="group.key" class="category-section">
            <div class="category-header">
              <span class="category-title">{{ group.icon }} {{ group.label }}</span>
              <span class="category-count">{{ shop.ownedCount(group.key) }}/{{ group.items.length }}</span>
            </div>
            <div class="item-grid">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="item-card"
                :class="getCardClass(item)"
                @click="onItemClick(item)"
              >
                
                <div class="card-icon">{{ item.icon }}</div>
                <div class="card-name">{{ item.name }}</div>
                <div class="card-desc" v-if="getItemDesc(item)">{{ getItemDesc(item) }}</div>
                <div class="card-action" :class="getCardClass(item)">{{ getCardAction(item) }}</div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="filteredItems.length > 0">
          <div class="category-header">
            <span class="category-title">{{ categories.find(c => c.key === activeCat)?.icon }} {{ categories.find(c => c.key === activeCat)?.label }}</span>
            <span class="category-count">{{ shop.ownedCount(activeCat) }}/{{ filteredItems.length }}</span>
          </div>
          <div class="item-grid">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="item-card"
              :class="getCardClass(item)"
              @click="onItemClick(item)"
            >
              
              <div class="card-icon">{{ item.icon }}</div>
              <div class="card-name">{{ item.name }}</div>
              <div class="card-desc" v-if="getItemDesc(item)">{{ getItemDesc(item) }}</div>
              <div class="card-action" :class="getCardClass(item)">{{ getCardAction(item) }}</div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- 商品详情/购买弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPurchase" class="modal-mask" @click="showPurchase = false">
          <div class="modal-box purchase-modal" @click.stop>
            <!-- 道具使用结果 -->
            <template v-if="purchaseItem?.isResult">
              <div class="purchase-icon">{{ purchaseItem.icon }}</div>
              <div class="purchase-name">{{ purchaseItem.name }}</div>
              <div class="purchase-desc result-desc">{{ purchaseItem.resultDesc }}</div>
              <button class="modal-ok" @click="showPurchase = false">好的</button>
            </template>

            <!-- 正常商品详情 -->
            <template v-else>
              <div class="purchase-icon-wrap">
                
                <div class="purchase-icon">{{ purchaseItem?.icon }}</div>
              </div>
              <div class="purchase-name">{{ purchaseItem?.name }}</div>
              <div class="purchase-cat">{{ categories.find(c => c.key === purchaseItem?.category)?.icon }} {{ categories.find(c => c.key === purchaseItem?.category)?.label }}</div>

              <div class="purchase-desc">{{ getItemDesc(purchaseItem) }}</div>

              <!-- 语录包预览 -->
              <div v-if="purchaseItem?.category === 'quote' && purchaseItem?.data?.quotes" class="quote-preview">
                <div class="quote-preview-title">语录预览</div>
                <div class="quote-preview-list">
                  <div v-for="(q, i) in purchaseItem.data.quotes.slice(0, 3)" :key="i" class="quote-preview-item">
                    「{{ q }}」
                  </div>
                  <div class="quote-preview-more">...共 {{ purchaseItem.data.quotes.length }} 条</div>
                </div>
              </div>

              <!-- 已拥有状态 -->
              <template v-if="purchaseItem?.type === 'equipable' && shop.isOwned(purchaseItem?.id)">
                <div class="purchase-owned-badge">
                  ✓ 已拥有
                </div>
                <div class="purchase-btns">
                  <button class="btn-cancel" @click="showPurchase = false">关闭</button>
                  <button
                    class="btn-confirm"
                    @click="handleEquip(purchaseItem)"
                  >
                    {{ shop.isEquipped(purchaseItem?.category, purchaseItem?.id) ? '卸下' : '装备' }}
                  </button>
                </div>
              </template>

              <!-- 消耗品已有持有量 -->
              <template v-else-if="purchaseItem?.type === 'consumable' && shop.consumables[purchaseItem?.data?.propKey] > 0">
                <div class="purchase-owned-badge">持有 ×{{ shop.consumables[purchaseItem?.data?.propKey] }}</div>
                <!-- 被动道具：签到时自动生效 -->
                <template v-if="['lucky', 'double_coin', 'triple_coin', 'lucky_star', 'magnet'].includes(purchaseItem?.data?.propKey)">
                  <div class="purchase-hint">签到时自动生效</div>
                  <div class="purchase-btns">
                    <button class="btn-cancel" @click="showPurchase = false">关闭</button>
                    <button class="btn-buy-again" :disabled="gameStore.coins < (purchaseItem?.price || 0)" @click="handleBuy">再买一个 💰{{ purchaseItem?.price }}</button>
                  </div>
                </template>
                <!-- 主动道具：可使用 -->
                <template v-else>
                  <div class="purchase-btns">
                    <button class="btn-confirm" @click="handleUse(purchaseItem)">使用</button>
                    <button class="btn-buy-again" :disabled="gameStore.coins < (purchaseItem?.price || 0)" @click="handleBuy">再买一个 💰{{ purchaseItem?.price }}</button>
                  </div>
                </template>
              </template>

              <!-- 未拥有：购买 -->
              <template v-else>
                <div class="purchase-info">
                  <div class="purchase-price">
                    <div class="price-val">💰 {{ purchaseItem?.price }}</div>
                    <div class="price-label">售价</div>
                  </div>
                  <div class="purchase-divider"></div>
                  <div class="purchase-balance">
                    <div class="price-val">💰 {{ gameStore.coins }}</div>
                    <div class="price-label">当前余额</div>
                  </div>
                </div>
                <div class="purchase-btns">
                  <button class="btn-cancel" @click="showPurchase = false">取消</button>
                  <button
                    class="btn-confirm"
                    :disabled="gameStore.coins < (purchaseItem?.price || 0)"
                    @click="handleBuy"
                  >
                    确认购买
                  </button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 抽奖结果弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showGachaResult" class="modal-mask" @click="showGachaResult = false">
          <div class="modal-box gacha-result-modal" @click.stop>
            <div class="gacha-result-title">🎉 抽奖结果</div>
            <div class="gacha-result-grid">
              <div
                v-for="(result, i) in gachaResults"
                :key="i"
                class="gacha-result-item"
                :style="{ borderColor: getRarityColor(result.rarity) }"
              >
                <ShopItemAnim v-if="shouldShowAnim(result.category)" v-bind="getItemAnimation(result.id)" />
                <div class="result-icon">{{ result.icon }}</div>
                <div class="result-name">{{ result.name }}</div>
                <div class="result-rarity" :style="{ color: getRarityColor(result.rarity) }">
                  {{ getRarityLabel(result.rarity) }}
                </div>
              </div>
            </div>
            <button class="modal-ok" @click="showGachaResult = false">好的</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 高级抽奖结果弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPremiumGachaResult" class="modal-mask" @click="showPremiumGachaResult = false">
          <div class="modal-box gacha-result-modal" @click.stop>
            <div class="gacha-result-title">💎 至尊扭蛋结果</div>
            <div class="gacha-result-grid">
              <div
                v-for="(result, i) in premiumGachaResults"
                :key="i"
                class="gacha-result-item"
                :style="{ borderColor: getRarityColor(result.rarity) }"
              >
                <ShopItemAnim v-if="shouldShowAnim(result.category)" v-bind="getItemAnimation(result.id)" />
                <div class="result-icon">{{ result.icon }}</div>
                <div class="result-name">{{ result.name }}</div>
                <div class="result-rarity" :style="{ color: getRarityColor(result.rarity) }">
                  {{ getRarityLabel(result.rarity) }}
                </div>
              </div>
            </div>
            <button class="modal-ok" @click="showPremiumGachaResult = false">好的</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 抽奖奖品池预览 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showGachaPreview" class="modal-mask" @click="showGachaPreview = false">
          <div class="modal-box gacha-preview-modal" @click.stop>
            <div class="gacha-result-title">🎁 奖品池预览</div>

            <div class="preview-section">
              <div class="preview-rarity-title" style="color:#ffd700">✦ 传说品质 · 0.5%</div>
              <div class="preview-grid">
                <div v-for="item in activeGachaByRarity.legendary" :key="item.id" class="preview-item" :class="{ owned: shop.isOwned(item.id) }">
                  
                  <div class="preview-item-icon">{{ item.icon }}</div>
                  <div class="preview-item-name">{{ item.name }}</div>
                </div>
              </div>
            </div>

            <div class="preview-section">
              <div class="preview-rarity-title" style="color:#a855f7">◆ 史诗品质 · 3%</div>
              <div class="preview-grid">
                <div v-for="item in activeGachaByRarity.epic" :key="item.id" class="preview-item" :class="{ owned: shop.isOwned(item.id) }">
                  
                  <div class="preview-item-icon">{{ item.icon }}</div>
                  <div class="preview-item-name">{{ item.name }}</div>
                </div>
              </div>
            </div>

            <div class="preview-section">
              <div class="preview-rarity-title" style="color:#3b82f6">● 稀有品质 · 12%</div>
              <div class="preview-grid">
                <div v-for="item in activeGachaByRarity.rare" :key="item.id" class="preview-item" :class="{ owned: shop.isOwned(item.id) }">
                  
                  <div class="preview-item-icon">{{ item.icon }}</div>
                  <div class="preview-item-name">{{ item.name }}</div>
                </div>
              </div>
            </div>

            <div class="preview-section">
              <div class="preview-rarity-title" style="color:#6b7280">· 普通品质 · 84.5%</div>
              <div style="font-size:13px;color:#888;padding:4px 0">金币返还：30 / 50 / 100 币</div>
            </div>

            <button class="modal-ok" @click="showGachaPreview = false">关闭</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 赌博动画 -->
    <Teleport to="body">
      <Transition name="pop">
        <div v-if="showGamble" class="gamble-mask">
          <div class="gamble-box">
            <div class="gamble-icon" :class="{ spinning: gambleSpinning, bounce: !gambleSpinning }">
              {{ gambleIcon }}
            </div>
            <div v-if="gambleSpinning" class="gamble-text">正在揭晓...</div>
            <div v-else-if="purchaseItem?.isResult" class="gamble-result">
              <div class="gamble-result-text">{{ purchaseItem.resultDesc }}</div>
            </div>
          </div>
          <div v-if="!gambleSpinning" class="gamble-particles">
            <div v-for="n in 20" :key="n" class="gamble-particle"
              :style="{ left: (50 + Math.cos(n * 0.314) * 30) + '%', top: (50 + Math.sin(n * 0.314) * 30) + '%', animationDelay: (n * 0.05) + 's', background: ['#ff6b8a','#ffd700','#4ecdc4','#a066d9','#ff9f43'][n % 5] }"></div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 老虎机动画 -->
    <Teleport to="body">
      <Transition name="pop">
        <div v-if="showSlot" class="slot-mask" @click="!slotSpinning && closeSlot()">
          <div class="slot-box" :class="{ premium: slotIsPremium }" @click.stop>
            <div class="slot-title">{{ slotIsPremium ? '💎 高级抽奖' : '🎰 普通抽奖' }}</div>
            <div class="slot-machine">
              <div v-for="(icon, i) in slotIcons" :key="i" class="slot-reel" :class="{ spinning: slotSpinning }">
                <span class="slot-icon">{{ icon }}</span>
              </div>
            </div>
            <div v-if="!slotSpinning" class="slot-results">
              <div v-for="(r, i) in slotResults" :key="i" class="slot-result-item" :class="r.rarity">
                <span class="slot-result-icon">{{ r.icon }}</span>
                <span class="slot-result-name">{{ r.name }}</span>
              </div>
            </div>
            <button v-if="!slotSpinning" class="slot-close-btn" @click="closeSlot()">
              {{ slotResults.some(r => r.rarity === 'legendary') ? '🎊 太棒了！' : slotResults.some(r => r.rarity === 'epic') ? '🎉 不错！' : '确定' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.shop-page {
  display: flex;
  flex-direction: column;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px 12px;
}

.shop-title {
  font-size: 20px;
  font-weight: 800;
  color: #4a4a56;
}

.shop-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.my-items-btn {
  padding: 8px 18px;
  border: 2px solid rgba(232,93,117,0.2);
  border-radius: 20px;
  background: linear-gradient(135deg, #fff0f3, #fff5f0);
  font-size: 14px;
  font-weight: 700;
  color: #e85d75;
  cursor: pointer;
  transition: all 0.2s;
}
.my-items-btn:hover { background: linear-gradient(135deg, #ffe0e6, #fff0f0); border-color: rgba(232,93,117,0.4); }
.my-items-btn.active { background: linear-gradient(135deg, #e85d75, #d4a853); color: #fff; border-color: transparent; box-shadow: 0 4px 12px rgba(232,93,117,0.25); }
.shop-balance {
  background: linear-gradient(135deg, #fff0f3, #fff5f0);
  border: 1px solid rgba(255,107,138,0.12);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 700;
  color: #d97706;
}

.shop-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 32px 16px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #f0f0f0;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.tab-btn:hover { background: #e8e8e8; }

.tab-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 2px 8px rgba(102,126,234,0.3);
}

.shop-body {
  padding: 0 32px 32px;
}

/* ===== 分类区块 ===== */
.category-section {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-title {
  font-size: 15px;
  font-weight: 700;
  color: #4a4a56;
}

.category-count {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  padding: 4px 12px;
  border-radius: 12px;
}

/* ===== 商品网格 ===== */
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.item-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff 0%, #fffdfb 100%);
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  border: 1.5px solid #e7e7ee;
  border-radius: 18px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-height: 100px;
}

.item-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(102,126,234,0.10); border-color: #d8def8; }

.item-card.buyable { border-color: #e5e5e5; }
.item-card.owned { border-color: #9dc0aa; background: linear-gradient(180deg, #f6fbf7 0%, #f1f9f4 100%); }
.item-card.equipped { border-color: #eab308; background: linear-gradient(180deg, #fff9e8 0%, #fff4d8 100%); }

.card-icon { font-size: 28px; margin-bottom: 6px; position: relative; z-index: 1; }
.card-name { font-size: 13px; font-weight: 700; color: #5a5a66; margin-bottom: 4px; position: relative; z-index: 1; }
.card-desc { font-size: 11px; color: #d97706; margin-bottom: 6px; line-height: 1.3; min-height: 14px; position: relative; z-index: 1; }

.card-action {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  position: relative;
  z-index: 1;
  display: inline-block;
}

.card-action.buyable {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.card-action.owned {
  background: #9dc0aa;
  color: #fff;
}

.card-action.equipped {
  background: #eab308;
  color: #fff;
}

/* ===== 抽奖面板 ===== */
.gacha-panel {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}

.gacha-bg {
  background: linear-gradient(180deg, #1f2138 0%, #33255f 100%);
  box-shadow: 0 18px 40px rgba(0,0,0,0.12);
  border-radius: 24px;
  padding: 40px 48px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.gacha-icon { font-size: 64px; margin-bottom: 12px; }
.gacha-title { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }
.gacha-sub { font-size: 14px; color: #a78bfa; margin-bottom: 20px; }

.gacha-prob {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  margin-bottom: 24px;
}

.gacha-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.gacha-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  color: #fff;
}

.gacha-btn.single {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  box-shadow: 0 4px 16px rgba(124,58,237,0.4);
}

.gacha-btn.multi {
  background: linear-gradient(135deg, #eab308, #f59e0b);
  box-shadow: 0 4px 16px rgba(245,158,11,0.4);
}

.gacha-btn:hover { transform: translateY(-2px); }

.gacha-pity {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.gacha-pity b { color: #a855f7; }

.gacha-preview-btn {
  padding: 10px 24px;
  border: 1px solid rgba(168,133,247,0.3);
  border-radius: 12px;
  background: rgba(168,133,247,0.1);
  color: #a78bfa;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.gacha-preview-btn:hover {
  background: rgba(168,133,247,0.2);
}

/* ===== 限时商店 ===== */
.limited-panel { padding: 20px 0; }
.limited-header { margin-bottom: 20px; }
.limited-title { font-size: 18px; font-weight: 800; color: #4a4a56; }
.limited-sub { font-size: 14px; color: #888; margin-top: 4px; }
.limited-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.limited-card {
  background: #fff;
  border: 1.5px solid #fde2e2;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
  position: relative;
  overflow: hidden;
}
.limited-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(239,68,68,0.15); }
.limited-card.owned { opacity: 0.5; cursor: default; border-color: #e5e5e5; }
.limited-discount {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 8px;
}
.limited-icon { font-size: 32px; margin-bottom: 8px; position: relative; z-index: 1; }
.limited-name { font-size: 14px; font-weight: 700; color: #5a5a66; margin-bottom: 8px; position: relative; z-index: 1; }
.limited-prices { display: flex; align-items: center; justify-content: center; gap: 8px; position: relative; z-index: 1; }
.limited-original { font-size: 13px; color: #999; text-decoration: line-through; }
.limited-now { font-size: 15px; font-weight: 800; color: #ef4444; }
.limited-owned { font-size: 13px; color: #8fae9a; font-weight: 700; margin-top: 6px; position: relative; z-index: 1; }

/* ===== 高级抽奖 ===== */
.gacha-bg.premium {
  background: linear-gradient(180deg, #211437 0%, #33255f 50%, #482447 100%);
}

/* ===== 称号系统 ===== */
.title-panel { padding: 20px 0; }
.title-header { margin-bottom: 20px; }
.title-current { font-size: 16px; font-weight: 700; color: #4a4a56; padding: 12px 16px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px; border: 1px solid #fde68a; }
.title-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.title-card {
  background: #fff;
  border: 1.5px solid #e7e7ee;
  border-radius: 16px;
  padding: 14px 10px;
  text-align: center;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.title-card.owned { border-color: #fbbf24; background: #fffbeb; }
.title-card.equipped { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); }
.title-icon { font-size: 28px; margin-bottom: 6px; }
.title-name { font-size: 14px; font-weight: 800; color: #5a5a66; margin-bottom: 4px; }
.title-desc { font-size: 13px; color: #888; margin-bottom: 8px; }
.title-actions { display: flex; gap: 6px; justify-content: center; }
.title-equip-btn, .title-unequip-btn, .title-buy-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}
.title-equip-btn { background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; }
.title-unequip-btn { background: #e5e5e5; color: #666; }
.title-buy-btn { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.title-locked { font-size: 13px; color: #999; }

/* ===== 我的物品 ===== */
.mine-section { display: flex; flex-direction: column; gap: 24px; }
.mine-group-title { font-size: 15px; font-weight: 700; color: #4a4a56; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.mine-group-count { font-size: 13px; font-weight: 600; color: #667eea; background: linear-gradient(135deg, #eef2ff, #f5f3ff); padding: 2px 10px; border-radius: 10px; }

/* 语录类别选择 */
.quote-cat-hint { font-size: 13px; color: #999; margin-bottom: 12px; }
.quote-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-bottom: 12px; }
.quote-cat-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  font-size: 14px;
}
.quote-cat-btn:hover { border-color: #ccc; }
.quote-cat-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
}
.quote-cat-icon { font-size: 18px; }
.quote-cat-name { font-weight: 600; color: #5a5a66; }
.quote-cat-btn.active .quote-cat-name { color: #667eea; }
.quote-cat-actions { display: flex; gap: 8px; }
.quote-action-btn {
  padding: 6px 14px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.quote-action-btn:hover { background: #f0f0f0; border-color: #ddd; }

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }
.empty-text { font-size: 16px; font-weight: 600; color: #999; }
.empty-sub { font-size: 13px; color: #ccc; margin-top: 4px; }

/* ===== 弹窗 ===== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 32px 64px rgba(0,0,0,0.15);
}

.modal-enter-active { animation: m-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { animation: m-in 0.25s ease reverse; }
@keyframes m-in { from { opacity: 0; transform: scale(0.9) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.purchase-modal {
  padding: 36px 40px;
  min-width: 320px;
  max-width: 400px;
}

.purchase-icon-wrap {
  position: relative;
  width: 80px; height: 80px;
  margin: 0 auto 8px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.purchase-icon { font-size: 48px; margin-bottom: 8px; position: relative; z-index: 1; }
.purchase-name { font-size: 18px; font-weight: 800; color: #4a4a56; margin-bottom: 4px; }
.purchase-cat { font-size: 13px; color: #888; margin-bottom: 12px; }

.purchase-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
  padding: 10px 14px;
  background: #f8f8f8;
  border-radius: 10px;
  text-align: left;
}

.result-desc {
  font-size: 16px;
  font-weight: 700;
  color: #4a4a56;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  text-align: center;
}

.quote-preview {
  margin-bottom: 16px;
  text-align: left;
}

.quote-preview-title {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  margin-bottom: 6px;
}

.quote-preview-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quote-preview-item {
  font-size: 13px;
  color: #555;
  font-style: italic;
  padding: 6px 10px;
  background: #f8f8f8;
  border-radius: 8px;
}

.quote-preview-more {
  font-size: 13px;
  color: #aaa;
  text-align: center;
  margin-top: 4px;
}

.purchase-owned-badge {
  display: inline-block;
  padding: 6px 20px;
  background: linear-gradient(135deg, #eef8f1, #e5f6eb);
  border: 1px solid #a8d9b4;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  color: #16a34a;
  margin-bottom: 12px;
}
.purchase-level {
  margin-left: 8px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 13px;
}

.purchase-hint {
  font-size: 13px;
  color: #888;
  margin: 8px 0 12px;
  font-style: italic;
}

.purchase-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.purchase-divider {
  width: 1px;
  background: #eee;
}

.price-val { font-size: 22px; font-weight: 800; color: #d97706; }
.price-label { font-size: 13px; color: #aaa; margin-top: 2px; }
.purchase-balance .price-val { color: #4a4a56; }

.purchase-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel {
  padding: 12px 28px;
  border: 1.5px solid #e5e5e5;
  border-radius: 14px;
  background: #fff;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.btn-cancel:hover { background: #f9f9f9; border-color: #ddd; }

.btn-confirm {
  padding: 12px 28px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(102,126,234,0.3);
}

.btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(102,126,234,0.4); }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.btn-buy-again {
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(245,158,11,0.3);
}

.btn-buy-again:hover { transform: translateY(-2px); }

.modal-ok {
  padding: 12px 36px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(102,126,234,0.3);
  margin-top: 20px;
}

/* ===== 抽奖结果 ===== */
.gacha-result-modal {
  padding: 32px 36px;
  min-width: 340px;
  max-width: 440px;
}

.gacha-result-title {
  font-size: 20px;
  font-weight: 800;
  color: #4a4a56;
  margin-bottom: 20px;
}

.gacha-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  margin-bottom: 8px;
}

.gacha-result-item {
  position: relative;
  overflow: hidden;
  padding: 12px 6px;
  border: 1.5px solid #e7e7ee;
  border-radius: 14px;
  text-align: center;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.result-icon { font-size: 24px; margin-bottom: 4px; position: relative; z-index: 1; }
.result-name { font-size: 13px; font-weight: 600; color: #5a5a66; position: relative; z-index: 1; }
.result-rarity { font-size: 12px; font-weight: 700; margin-top: 2px; position: relative; z-index: 1; }

/* ===== 抽奖奖品池预览 ===== */
.gacha-preview-modal {
  padding: 32px 36px;
  min-width: 360px;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  text-align: left;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-rarity-title {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.preview-item {
  position: relative;
  overflow: hidden;
  padding: 10px 6px;
  border: 1.5px solid #e7e7ee;
  border-radius: 14px;
  text-align: center;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.preview-item.owned {
  border-color: #9dc0aa;
  background: #f3faf5;
}

.preview-item-icon { font-size: 22px; margin-bottom: 4px; position: relative; z-index: 1; }
.preview-item-name { font-size: 12px; font-weight: 600; color: #555; position: relative; z-index: 1; }
.preview-item.owned .preview-item-name { color: #8fae9a; }

/* ===== 赌博动画 ===== */
.gamble-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
}
.gamble-box {
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}
.gamble-icon {
  font-size: 80px;
  filter: drop-shadow(0 4px 16px rgba(0,0,0,0.3));
}
.gamble-icon.spinning {
  animation: gamble-spin 0.3s linear infinite;
}
.gamble-icon.bounce {
  animation: gamble-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gamble-text {
  font-size: 18px; font-weight: 700; color: #fff;
  animation: gamble-pulse 0.8s ease-in-out infinite alternate;
}
.gamble-result {
  animation: gamble-reveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gamble-result-text {
  font-size: 20px; font-weight: 800; color: #ffd700;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  background: rgba(0,0,0,0.3);
  padding: 16px 32px; border-radius: 16px;
  border: 2px solid rgba(255,215,0,0.3);
}
.gamble-particles {
  position: fixed; inset: 0; pointer-events: none;
}
.gamble-particle {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  animation: gamble-explode 1s ease-out forwards;
}
@keyframes gamble-spin {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.1); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes gamble-bounce {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes gamble-pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}
@keyframes gamble-reveal {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes gamble-explode {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx, 50px), var(--ty, -80px)) scale(0); opacity: 0; }
}
.gamble-particle:nth-child(odd) { --tx: -60px; --ty: -90px; }
.gamble-particle:nth-child(even) { --tx: 70px; --ty: -70px; }
.gamble-particle:nth-child(3n) { --tx: -40px; --ty: 80px; }
.gamble-particle:nth-child(4n) { --tx: 50px; --ty: 60px; }
.gamble-particle:nth-child(5n) { --tx: -80px; --ty: -30px; }

/* ===== 老虎机动画 ===== */
.slot-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.slot-box {
  background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
  border-radius: 24px;
  padding: 32px 40px;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  border: 2px solid rgba(255,215,0,0.2);
  min-width: 320px;
}
.slot-box.premium {
  background: linear-gradient(135deg, #1a0a2e, #2a1040);
  border-color: rgba(168,85,247,0.3);
}
.slot-title {
  font-size: 20px; font-weight: 800; color: #ffd700;
  margin-bottom: 24px;
  text-shadow: 0 2px 8px rgba(255,215,0,0.3);
}
.slot-machine {
  display: flex; gap: 12px; justify-content: center;
  margin-bottom: 24px;
}
.slot-reel {
  width: 72px; height: 80px;
  background: rgba(0,0,0,0.4);
  border-radius: 12px;
  border: 2px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.slot-reel.spinning {
  animation: slot-shake 0.1s linear infinite;
}
.slot-icon {
  font-size: 40px;
  transition: transform 0.3s;
}
.slot-reel.spinning .slot-icon {
  animation: slot-scroll 0.1s linear infinite;
}
.slot-results {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  margin-bottom: 20px;
}
.slot-result-item {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.08);
  border: 1.5px solid rgba(255,255,255,0.12);
  animation: slot-result-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slot-result-item.legendary {
  background: linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1));
  border-color: rgba(255,215,0,0.3);
}
.slot-result-item.epic {
  background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1));
  border-color: rgba(168,85,247,0.3);
}
.slot-result-item.rare {
  background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(96,165,250,0.1));
  border-color: rgba(59,130,246,0.3);
}
.slot-result-icon { font-size: 20px; }
.slot-result-name { font-size: 13px; font-weight: 600; color: #e0e0f0; }
.slot-close-btn {
  padding: 12px 32px;
  border: none; border-radius: 14px;
  background: linear-gradient(135deg, #e85d75, #d4a853);
  color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(232,93,117,0.3);
  transition: transform 0.2s;
}
.slot-close-btn:hover { transform: translateY(-2px); }
@keyframes slot-shake {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes slot-scroll {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
@keyframes slot-result-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
