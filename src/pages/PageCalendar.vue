<script setup>
import { computed, inject, ref, watch, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { moodOptions, getMoodByKey } from '../data/seasonalEvents'
import MonthlyHistory from '../components/MonthlyHistory.vue'

const store = useGameStore()
const shop = useShopStore()
const setAppPageBg = inject('setAppPageBg', null)

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const todayDate = now.getDate()
const todayYear = now.getFullYear()
const todayMonth = now.getMonth()

const daysInMonth = computed(() => new Date(year.value, month.value + 1, 0).getDate())
const firstDayOffset = computed(() => (new Date(year.value, month.value, 1).getDay() + 6) % 7)

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
}
function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
  // 不超过当前月
  if (year.value > todayYear || (year.value === todayYear && month.value > todayMonth)) {
    month.value = todayMonth
    year.value = todayYear
  }
}
function goToday() {
  year.value = todayYear
  month.value = todayMonth
}
const isCurrentMonth = computed(() => year.value === todayYear && month.value === todayMonth)

// 时光邮箱
const showWriteModal = ref(false)
const letterTitle = ref('')
const letterText = ref('')
const letterDate = ref('')
const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
})
const showLetterModal = ref(false)
const selectedLetter = ref(null)

function submitLetter() {
  const title = letterTitle.value.trim()
  const text = letterText.value.trim()
  if (!title || !text || !letterDate.value) return
  store.addTimeLetter(title, text, letterDate.value)
  letterTitle.value = ''
  letterText.value = ''
  letterDate.value = ''
  showWriteModal.value = false
}

function openLetter(letter) {
  if (letter.openDate > today()) return
  store.openTimeLetter(letter.id)
  selectedLetter.value = letter
  showLetterModal.value = true
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0,0,0,0)
  return Math.ceil((target - today) / 86400000)
}

function dateStr(day) {
  return `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const monthPrefix = computed(() => `${year.value}-${String(month.value + 1).padStart(2, '0')}`)
const monthCheckins = computed(() => store.checkins.filter(d => d.startsWith(monthPrefix.value)).length)

// 本月心情统计
const moodStats = computed(() => store.getMoodStats(year.value, month.value))
const totalMoodEntries = computed(() => Object.values(moodStats.value).reduce((a, b) => a + b, 0))

const calStyle = computed(() => {
  const equipped = shop.equippedItems.calendar
  if (!equipped) return 'classic'
  const item = shop.getItem(equipped)
  return item?.data?.style || 'classic'
})

const calEffect = computed(() => shop.getCalendarEffect(shop.equippedItems.calendar))
const currentCalendarEffect = computed(() => calEffect.value)

const styleMap = {
  classic: {
    pageBg: 'linear-gradient(160deg, #f0ecf6 0%, #e8e4f0 50%, #e2dcea 100%)',
    cardBg: 'rgba(250,246,255,0.95)',
    headerBg: 'linear-gradient(135deg, #9a8ab8 0%, #8a7aaa 52%, #7a6a9a 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #9a8ab8 0%, #8a7aaa 100%)',
    checkedColor: '#fff',
    todayColor: '#7a6a9a',
    todayBg: '#f5f0fa',
    titleColor: '#4a3a5a',
    subtitleColor: '#8a7a9a',
    weekColor: '#7a6a8a',
    cellBg: 'rgba(248,244,254,0.82)',
    legendBorder: 'rgba(154,138,184,0.18)',
    tagBg: 'linear-gradient(135deg, #9a8ab8, #8a7aaa)',
    tagColor: '#fff',
  },
  // 秋日：暖阳斜照，枫叶色顶栏，暖黄卡片
  autumn: {
    pageBg: 'linear-gradient(160deg, #fdf6e3 0%, #f5e6c4 50%, #eddcb0 100%)',
    cardBg: 'rgba(255,248,230,0.96)',
    headerBg: 'linear-gradient(160deg, #e89040 0%, #c87020 50%, #a85818 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f0a050, #e89040)',
    checkedColor: '#fff',
    todayColor: '#c87020',
    todayBg: '#fff8e8',
    titleColor: '#5a3810',
    subtitleColor: '#8a6830',
    weekColor: '#7a5820',
    cellBg: 'rgba(255,248,232,0.8)',
    legendBorder: 'rgba(200,150,60,0.2)',
    tagBg: 'linear-gradient(135deg, #e89040, #c87020)',
    tagColor: '#fff',
  },
  // 冬日：冰晶蓝，磨砂玻璃卡片，冷色调
  winter: {
    pageBg: 'linear-gradient(160deg, #e8f2fc 0%, #d0e4f8 50%, #b8d8f4 100%)',
    cardBg: 'rgba(228,240,255,0.96)',
    headerBg: 'linear-gradient(160deg, #3888c8 0%, #2878b8 50%, #1868a8 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #4898d8, #3888c8)',
    checkedColor: '#fff',
    todayColor: '#2878b8',
    todayBg: '#eef6ff',
    titleColor: '#1a3a58',
    subtitleColor: '#3a6a88',
    weekColor: '#2a5a78',
    cellBg: 'rgba(210,230,250,0.8)',
    legendBorder: 'rgba(60,120,180,0.2)',
    tagBg: 'linear-gradient(135deg, #3888c8, #1868a8)',
    tagColor: '#e8f4ff',
  },
  // 春日：樱花粉，柔光渐变，花瓣色
  spring: {
    pageBg: 'linear-gradient(160deg, #fdf0f6 0%, #f8d8ea 50%, #f0c0da 100%)',
    cardBg: 'rgba(255,238,250,0.96)',
    headerBg: 'linear-gradient(160deg, #e85898 0%, #d04088 50%, #b83078 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f068a8, #e85898)',
    checkedColor: '#fff',
    todayColor: '#d04088',
    todayBg: '#fdf0f6',
    titleColor: '#5a1838',
    subtitleColor: '#8a3858',
    weekColor: '#7a2848',
    cellBg: 'rgba(255,232,248,0.8)',
    legendBorder: 'rgba(220,80,150,0.2)',
    tagBg: 'linear-gradient(135deg, #e85898, #b83078)',
    tagColor: '#fff',
  },
  // 星空：深紫夜空，微光顶栏，暗色卡片
  starry: {
    pageBg: 'linear-gradient(160deg, #100e1c 0%, #181630 50%, #201e3a 100%)',
    cardBg: 'rgba(22,20,42,0.97)',
    headerBg: 'linear-gradient(160deg, #3a2868 0%, #5a48a0 50%, #7a68c0 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #6a58a0, #8a78c0)',
    checkedColor: '#ece8ff',
    todayColor: '#9a88d0',
    todayBg: '#282448',
    titleColor: '#c8c0f0',
    subtitleColor: '#8078b0',
    weekColor: '#6860a0',
    cellBg: 'rgba(36,32,64,0.8)',
    legendBorder: 'rgba(90,72,150,0.3)',
    tagBg: 'linear-gradient(135deg, #4a3880, #6a58a0)',
    tagColor: '#d8d0f8',
  },
  // 夏日：阳光金黄，明亮温暖，活力感
  summer: {
    pageBg: 'linear-gradient(160deg, #fffcde 0%, #fff4a8 50%, #ffe870 100%)',
    cardBg: 'rgba(255,252,220,0.96)',
    headerBg: 'linear-gradient(160deg, #e8b010 0%, #d09808 50%, #b88000 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f0c020, #e8b010)',
    checkedColor: '#fff',
    todayColor: '#d09808',
    todayBg: '#fffde8',
    titleColor: '#4a3808',
    subtitleColor: '#7a6818',
    weekColor: '#6a5810',
    cellBg: 'rgba(255,248,200,0.8)',
    legendBorder: 'rgba(200,170,20,0.25)',
    tagBg: 'linear-gradient(135deg, #e8b010, #b88000)',
    tagColor: '#fff',
  },
  // 雨天：灰蓝阴郁，暗沉卡片，安静感
  rain: {
    pageBg: 'linear-gradient(160deg, #dce0e8 0%, #c4c8d4 50%, #acb4c4 100%)',
    cardBg: 'rgba(216,220,232,0.96)',
    headerBg: 'linear-gradient(160deg, #404858 0%, #303848 50%, #282e40 100%)',
    headerColor: '#e8ecf4',
    checkedBg: 'linear-gradient(135deg, #505868, #404858)',
    checkedColor: '#c8d0e0',
    todayColor: '#5868a0',
    todayBg: '#e4e8f0',
    titleColor: '#282e38',
    subtitleColor: '#4a5260',
    weekColor: '#3a4250',
    cellBg: 'rgba(200,208,220,0.8)',
    legendBorder: 'rgba(60,80,120,0.2)',
    tagBg: 'linear-gradient(135deg, #404858, #282e40)',
    tagColor: '#b0b8c8',
  },
  // 复古：怀旧牛皮纸，做旧感，暖棕色调
  retro: {
    pageBg: 'linear-gradient(160deg, #ece4d0 0%, #dcd0b8 50%, #ccc0a0 100%)',
    cardBg: 'rgba(240,232,216,0.96)',
    headerBg: 'linear-gradient(160deg, #6a5030 0%, #5a4028 50%, #4a3020 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #7a6040, #6a5030)',
    checkedColor: '#f0e8d8',
    todayColor: '#6a5030',
    todayBg: '#f0e8d8',
    titleColor: '#3a2810',
    subtitleColor: '#6a5838',
    weekColor: '#5a4828',
    cellBg: 'rgba(228,220,200,0.8)',
    legendBorder: 'rgba(100,80,40,0.2)',
    tagBg: 'linear-gradient(135deg, #6a5030, #4a3020)',
    tagColor: '#e8dcc8',
  },
  // 珊瑚：海洋珊瑚粉，波浪感，鲜活色彩
  coral: {
    pageBg: 'linear-gradient(160deg, #fff0f2 0%, #ffd8e0 50%, #ffc0ce 100%)',
    cardBg: 'rgba(255,238,242,0.96)',
    headerBg: 'linear-gradient(160deg, #f05070 0%, #e03860 50%, #d02050 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f86080, #f05070)',
    checkedColor: '#fff',
    todayColor: '#e03860',
    todayBg: '#fff0f2',
    titleColor: '#601028',
    subtitleColor: '#903048',
    weekColor: '#802038',
    cellBg: 'rgba(255,230,236,0.8)',
    legendBorder: 'rgba(230,60,100,0.2)',
    tagBg: 'linear-gradient(135deg, #f05070, #d02050)',
    tagColor: '#fff',
  },
  // 山川：森林绿，自然感，大地色系
  mountain: {
    pageBg: 'linear-gradient(160deg, #dff0e4 0%, #c8e4d0 50%, #b0d8bc 100%)',
    cardBg: 'rgba(228,248,236,0.96)',
    headerBg: 'linear-gradient(160deg, #287048 0%, #1a6038 50%, #105028 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #388058, #287048)',
    checkedColor: '#e8ffe8',
    todayColor: '#287048',
    todayBg: '#e8f8f0',
    titleColor: '#103818',
    subtitleColor: '#2a5838',
    weekColor: '#1a4828',
    cellBg: 'rgba(210,240,220,0.8)',
    legendBorder: 'rgba(40,100,60,0.2)',
    tagBg: 'linear-gradient(135deg, #287048, #105028)',
    tagColor: '#d8f8e8',
  },
  // 日落：晚霞渐变，橙粉交织，温暖感
  sunset: {
    pageBg: 'linear-gradient(160deg, #fff0e0 0%, #ffd8b0 50%, #ffc080 100%)',
    cardBg: 'rgba(255,242,228,0.96)',
    headerBg: 'linear-gradient(160deg, #e06820 0%, #d05018 50%, #c04010 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f07830, #e06820)',
    checkedColor: '#fff',
    todayColor: '#d05018',
    todayBg: '#fff4e8',
    titleColor: '#4a2008',
    subtitleColor: '#7a4018',
    weekColor: '#6a3010',
    cellBg: 'rgba(255,236,216,0.8)',
    legendBorder: 'rgba(210,100,30,0.2)',
    tagBg: 'linear-gradient(135deg, #e06820, #c04010)',
    tagColor: '#fff',
  },
  // 星河：深空紫黑，星云感，宇宙色调
  galaxy: {
    pageBg: 'linear-gradient(160deg, #060410 0%, #0c0820 50%, #140e30 100%)',
    cardBg: 'rgba(10,6,24,0.97)',
    headerBg: 'linear-gradient(160deg, #1e1040 0%, #3a2068 50%, #5a3898 100%)',
    headerColor: '#e0d8f8',
    checkedBg: 'linear-gradient(135deg, #3a2068, #5a3898)',
    checkedColor: '#c8c0f0',
    todayColor: '#6a50a0',
    todayBg: '#18103a',
    titleColor: '#9088c0',
    subtitleColor: '#6058a0',
    weekColor: '#7068a8',
    cellBg: 'rgba(16,12,40,0.8)',
    legendBorder: 'rgba(50,36,100,0.3)',
    tagBg: 'linear-gradient(135deg, #2e1850, #4a3078)',
    tagColor: '#a8a0d8',
  },
  // ===== 抽奖日历样式 =====
  nebula: {
    pageBg: 'linear-gradient(160deg, #e8e0f8 0%, #d8d0f0 50%, #c8c0e8 100%)',
    cardBg: 'rgba(240,236,255,0.96)',
    headerBg: 'linear-gradient(160deg, #6850a0 0%, #8870c0 50%, #a890d8 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #7860b0, #9880d0)',
    checkedColor: '#fff',
    todayColor: '#7860b0',
    todayBg: '#f0e8ff',
    titleColor: '#3a2860',
    subtitleColor: '#6a5890',
    weekColor: '#5a4880',
    cellBg: 'rgba(230,224,250,0.8)',
    legendBorder: 'rgba(100,80,160,0.2)',
    tagBg: 'linear-gradient(135deg, #6850a0, #8870c0)',
    tagColor: '#f0e8ff',
  },
  cherry_blossom: {
    pageBg: 'linear-gradient(160deg, #fff0f5 0%, #ffd8e8 50%, #ffc0d8 100%)',
    cardBg: 'rgba(255,240,248,0.96)',
    headerBg: 'linear-gradient(160deg, #e86090 0%, #d04878 50%, #b83068 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #f070a0, #e86090)',
    checkedColor: '#fff',
    todayColor: '#d04878',
    todayBg: '#fff0f5',
    titleColor: '#5a1838',
    subtitleColor: '#8a3858',
    weekColor: '#7a2848',
    cellBg: 'rgba(255,232,245,0.8)',
    legendBorder: 'rgba(220,80,140,0.2)',
    tagBg: 'linear-gradient(135deg, #e86090, #b83068)',
    tagColor: '#fff',
  },
  misty: {
    pageBg: 'linear-gradient(160deg, #e8ecf2 0%, #d4d8e0 50%, #c0c4d0 100%)',
    cardBg: 'rgba(232,236,244,0.96)',
    headerBg: 'linear-gradient(160deg, #607080 0%, #506070 50%, #405060 100%)',
    headerColor: '#e8ecf4',
    checkedBg: 'linear-gradient(135deg, #708090, #607080)',
    checkedColor: '#d8e0f0',
    todayColor: '#607898',
    todayBg: '#e8ecf4',
    titleColor: '#303848',
    subtitleColor: '#506070',
    weekColor: '#405060',
    cellBg: 'rgba(216,220,232,0.8)',
    legendBorder: 'rgba(80,100,130,0.2)',
    tagBg: 'linear-gradient(135deg, #607080, #405060)',
    tagColor: '#c0c8d8',
  },
  golden: {
    pageBg: 'linear-gradient(160deg, #fef8e0 0%, #fdf0c0 50%, #f8e898 100%)',
    cardBg: 'rgba(255,248,220,0.96)',
    headerBg: 'linear-gradient(160deg, #c89818 0%, #b08010 50%, #986808 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #d8a828, #c89818)',
    checkedColor: '#fff',
    todayColor: '#b08010',
    todayBg: '#fef8e0',
    titleColor: '#4a3808',
    subtitleColor: '#7a6818',
    weekColor: '#6a5810',
    cellBg: 'rgba(255,244,200,0.8)',
    legendBorder: 'rgba(190,160,30,0.25)',
    tagBg: 'linear-gradient(135deg, #c89818, #986808)',
    tagColor: '#fff',
  },
  galaxy_deep: {
    pageBg: 'linear-gradient(160deg, #040210 0%, #0a061c 50%, #100c28 100%)',
    cardBg: 'rgba(6,4,18,0.97)',
    headerBg: 'linear-gradient(160deg, #1a0e38 0%, #2e1858 50%, #4a2880 100%)',
    headerColor: '#d0c8f0',
    checkedBg: 'linear-gradient(135deg, #2e1858, #4a2880)',
    checkedColor: '#b8b0e0',
    todayColor: '#5a3890',
    todayBg: '#10082a',
    titleColor: '#8880b8',
    subtitleColor: '#5850a0',
    weekColor: '#4840a0',
    cellBg: 'rgba(12,8,32,0.8)',
    legendBorder: 'rgba(40,28,80,0.3)',
    tagBg: 'linear-gradient(135deg, #2a1850, #4a2880)',
    tagColor: '#9890c8',
  },
  forest: {
    pageBg: 'linear-gradient(160deg, #e0f0e4 0%, #c8e4d0 50%, #b0d8bc 100%)',
    cardBg: 'rgba(224,240,232,0.96)',
    headerBg: 'linear-gradient(160deg, #286840 0%, #1a5830 50%, #104820 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #387850, #286840)',
    checkedColor: '#e0ffe8',
    todayColor: '#286840',
    todayBg: '#e4f4ec',
    titleColor: '#103018',
    subtitleColor: '#285038',
    weekColor: '#1a4028',
    cellBg: 'rgba(208,236,220,0.8)',
    legendBorder: 'rgba(40,100,60,0.2)',
    tagBg: 'linear-gradient(135deg, #286840, #104820)',
    tagColor: '#d0f0e0',
  },
  snow: {
    pageBg: 'linear-gradient(160deg, #f0f6ff 0%, #e0ecfc 50%, #d0e2f8 100%)',
    cardBg: 'rgba(240,248,255,0.96)',
    headerBg: 'linear-gradient(160deg, #6090c0 0%, #4878b0 50%, #3060a0 100%)',
    headerColor: '#fff',
    checkedBg: 'linear-gradient(135deg, #70a0d0, #6090c0)',
    checkedColor: '#fff',
    todayColor: '#4878b0',
    todayBg: '#f0f6ff',
    titleColor: '#1a3050',
    subtitleColor: '#3a5878',
    weekColor: '#2a4868',
    cellBg: 'rgba(224,240,255,0.8)',
    legendBorder: 'rgba(60,120,180,0.2)',
    tagBg: 'linear-gradient(135deg, #6090c0, #3060a0)',
    tagColor: '#e0f0ff',
  },
}

const currentStyle = computed(() => styleMap[calStyle.value] || styleMap.classic)
const calendarEffect = computed(() => shop.getCalendarEffect(shop.equippedItems.calendar))
const calendarPageBg = computed(() => currentStyle.value.pageBg)

watch(calendarPageBg, bg => {
  if (setAppPageBg) setAppPageBg(bg)
}, { immediate: true })

const calendarPremiumStyle = computed(() => {
  const id = shop.equippedItems.calendar
  return id ? shop.calendarPremiumStyleMap?.[id] || null : null
})
const premiumCalendarAccent = computed(() => calendarPremiumStyle.value?.accent || null)
const premiumCalendarOverlay = computed(() => calendarPremiumStyle.value?.overlay || null)
const premiumCalendarTag = computed(() => calendarPremiumStyle.value?.tag || null)
const premiumCalendarGlow = computed(() => calendarPremiumStyle.value?.checkedGlow || null)
const premiumCalendarToneStyle = computed(() => {
  const tone = calendarPremiumStyle.value?.tone
  if (!tone) return null
  const toneStyles = {
    moonlit: 'linear-gradient(135deg, rgba(223,216,255,0.32), rgba(120,110,170,0.08))',
    nebula: 'linear-gradient(135deg, rgba(166,151,255,0.3), rgba(92,84,142,0.08))',
    mist: 'linear-gradient(135deg, rgba(209,224,245,0.28), rgba(92,126,168,0.08))',
    paper: 'linear-gradient(135deg, rgba(255,245,240,0.34), rgba(212,160,180,0.08))',
    sunflower: 'linear-gradient(135deg, rgba(255,244,200,0.32), rgba(226,190,102,0.08))',
    dusk: 'linear-gradient(135deg, rgba(255,220,220,0.3), rgba(198,132,170,0.08))',
    maple: 'linear-gradient(135deg, rgba(255,238,210,0.3), rgba(164,134,88,0.08))',
    blossom: 'linear-gradient(135deg, rgba(255,235,244,0.34), rgba(184,198,160,0.08))',
    coastal: 'linear-gradient(135deg, rgba(225,247,245,0.32), rgba(124,190,186,0.08))',
    frost: 'linear-gradient(135deg, rgba(235,248,255,0.34), rgba(126,172,206,0.08))',
    ridge: 'linear-gradient(135deg, rgba(232,240,236,0.3), rgba(118,140,126,0.08))',
    rain: 'linear-gradient(135deg, rgba(236,242,248,0.3), rgba(110,128,160,0.08))',
    nostalgia: 'linear-gradient(135deg, rgba(248,238,224,0.3), rgba(176,156,136,0.08))',
    amber: 'linear-gradient(135deg, rgba(255,240,204,0.34), rgba(214,160,80,0.08))',
    petal: 'linear-gradient(135deg, rgba(255,236,244,0.34), rgba(234,172,196,0.08))',
    'deep-galaxy': 'linear-gradient(135deg, rgba(194,186,255,0.18), rgba(62,56,110,0.1))',
  }
  return toneStyles[tone] || null
})
const premiumCalendarClass = computed(() => calendarPremiumStyle.value?.tone ? `tone-${calendarPremiumStyle.value.tone}` : '')
const premiumCalendarMotion = computed(() => calendarPremiumStyle.value?.motion || null)

// 为深色主题的打卡格子添加发光效果
const isDark = computed(() => calStyle.value === 'starry' || shop.darkMode)

// 模板中使用的样式快捷属性
const headerBg = computed(() => currentStyle.value.headerBg)
const headerTextColor = computed(() => currentStyle.value.headerColor)
const topBarRef = ref(null)
function applyHeaderStyle() {
  nextTick(() => {
    if (!topBarRef.value) return
    const bg = headerBg.value
    const clr = headerTextColor.value
    topBarRef.value.style.setProperty('background', bg, 'important')
    topBarRef.value.querySelectorAll('.cal-top-title, .cal-top-date, .cal-nav-btn, .cal-today-btn, .cal-streak-num, .cal-streak-label').forEach(el => {
      el.style.setProperty('color', clr, 'important')
    })
  })
}
watch([headerBg, headerTextColor], applyHeaderStyle, { immediate: true })
watch(() => shop.equippedItems.calendar, applyHeaderStyle)

const cardBg = computed(() => currentStyle.value.cardBg)
const effectCheckedBg = computed(() => currentStyle.value.checkedBg)
const effectCheckedColor = computed(() => currentStyle.value.checkedColor)
const effectTodayBg = computed(() => currentStyle.value.todayBg)
const effectTodayColor = computed(() => currentStyle.value.todayColor)
const effectLegendBorder = computed(() => currentStyle.value.legendBorder)
const effectTagBg = computed(() => currentStyle.value.tagBg)
const effectTagColor = computed(() => currentStyle.value.tagColor)
</script>

<template>
  <div class="cal-page" :class="{ 'cal-dark': shop.darkMode, 'cal-premium': !!premiumCalendarAccent, [premiumCalendarClass]: !!premiumCalendarClass, [premiumCalendarMotion]: !!premiumCalendarMotion }" :style="premiumCalendarToneStyle ? { '--premium-tone-bg': premiumCalendarToneStyle } : undefined">
    <!-- 日历标题栏 -->
    <div ref="topBarRef" class="cal-top-bar" :style="{ '--hdr-bg': headerBg, backgroundImage: premiumCalendarOverlay || undefined }">
      <div class="cal-premium-veil" v-if="premiumCalendarToneStyle"></div>
      <div class="cal-premium-badge" v-if="premiumCalendarTag">{{ premiumCalendarTag }}</div>
      <div class="cal-top-content">
        <div class="cal-top-left">
          <span class="cal-top-icon">📅</span>
          <div>
            <div class="cal-top-title" :style="{ color: headerTextColor }">打卡日历</div>
            <div class="cal-nav-row">
              <button class="cal-nav-btn" :style="{ color: headerTextColor }" @click="prevMonth">‹</button>
              <span class="cal-top-date" :style="{ color: headerTextColor }">{{ year }}年{{ month + 1 }}月</span>
              <button class="cal-nav-btn" :style="{ color: headerTextColor }" @click="nextMonth">›</button>
              <button v-if="!isCurrentMonth" class="cal-today-btn" @click="goToday" :style="{ color: headerTextColor }">今天</button>
            </div>
          </div>
        </div>
        <div class="cal-top-right">
          <div class="cal-top-streak" :style="{ color: currentStyle.headerColor, boxShadow: premiumCalendarGlow || 'none' }">
            <span class="cal-streak-num">{{ store.streakDays }}</span>
            <span class="cal-streak-label">天连续</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 日历卡片 -->
    <div class="cal-card" :style="{ background: cardBg }">
      <div class="cal-card-veil" v-if="premiumCalendarToneStyle"></div>
      <div class="cal-main">
      <div class="cal-left">
      <div class="cal-grid">
        <div v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="cal-wk" :style="{ color: currentStyle.weekColor }">{{ d }}</div>
        <div v-for="n in firstDayOffset" :key="'pad'+n" class="cal-cell pad"></div>
        <div v-for="day in daysInMonth" :key="day" class="cal-cell" :class="{ checked: store.checkins.includes(dateStr(day)), today: isCurrentMonth && day === todayDate, dark: isDark, 'has-mood': store.getDayMood(dateStr(day)) }" :style="{
          background: store.checkins.includes(dateStr(day)) ? effectCheckedBg : (isCurrentMonth && day === todayDate ? effectTodayBg : currentStyle.cellBg),
          color: store.checkins.includes(dateStr(day)) ? effectCheckedColor : (isCurrentMonth && day === todayDate ? effectTodayColor : (isDark ? '#a5b4fc' : '#5a4a3a')),
          '--today-clr': day === todayDate ? effectTodayColor : '#ff6b8a',
          '--mood-clr': store.getDayMood(dateStr(day)) ? (getMoodByKey(store.getDayMood(dateStr(day)))?.color || '#ccc') : 'transparent',
          boxShadow: store.checkins.includes(dateStr(day)) ? (premiumCalendarGlow || `0 6px 24px ${effectTodayColor}55`) : 'none'
        }">
          {{ day }}
          <span v-if="store.getDayMood(dateStr(day))" class="cell-mood">{{ getMoodByKey(store.getDayMood(dateStr(day)))?.icon }}</span>
        </div>
      </div>

      <!-- 图例 -->
      <div class="cal-legend" :style="{ borderTopColor: effectLegendBorder }">
        <span class="legend-item"><span class="legend-dot" :style="{ background: effectCheckedBg }"></span> 已打卡</span>
        <span class="legend-item"><span class="legend-dot today" :style="{ boxShadow: `inset 0 0 0 2.5px ${effectTodayColor}` }"></span> 今天</span>
        <span class="legend-item"><span class="legend-dot" :style="{ background: 'linear-gradient(135deg, #22c55e, #3b82f6, #ef4444)' }"></span> 心情</span>
      </div>

      <!-- 月度统计 -->
      <div class="cal-stats" :style="{ borderTopColor: effectLegendBorder }">
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: effectTodayColor }">{{ monthCheckins }}</div>
          <div class="cal-stat-lbl">本月打卡</div>
        </div>
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: effectTodayColor }">{{ store.streakDays }}</div>
          <div class="cal-stat-lbl">连续天数</div>
        </div>
        <div class="cal-stat-item">
          <div class="cal-stat-val" :style="{ color: effectTodayColor }">{{ Math.round(monthCheckins / (isCurrentMonth ? todayDate : daysInMonth) * 100) }}%</div>
          <div class="cal-stat-lbl">出勤率</div>
        </div>
      </div>

      <!-- 月度心情统计 -->
      <div v-if="totalMoodEntries > 0" class="mood-stats" :style="{ borderTopColor: effectLegendBorder }">
        <div class="mood-stats-title">📊 本月心情</div>
        <div class="mood-stats-bar">
          <template v-for="m in moodOptions" :key="m.key">
            <div v-if="moodStats[m.key] > 0" class="mood-bar-seg" :style="{ width: (moodStats[m.key] / totalMoodEntries * 100) + '%', background: m.color }" :title="`${m.label}: ${moodStats[m.key]}次`"></div>
          </template>
        </div>
        <div class="mood-stats-list">
          <template v-for="m in moodOptions" :key="m.key + '-num'">
            <span v-if="moodStats[m.key] > 0" class="mood-stat-item">
              {{ m.icon }} {{ moodStats[m.key] }}
            </span>
          </template>
        </div>
      </div>
      </div>

      <!-- 时光邮箱 -->
      <div class="mailbox">
        <div class="mailbox-header">
          <span class="mailbox-icon">📮</span>
          <span class="mailbox-title">时光邮箱</span>
        </div>
        <div class="mailbox-desc">写一封信给未来的自己</div>
        <button class="mailbox-write-btn" @click="showWriteModal = true">
          <span>✉️</span> 写信
        </button>
        <div class="mailbox-list">
          <div v-if="store.timeLetters.length === 0" class="mailbox-empty">
            <div class="empty-envelope">📭</div>
            <div>还没有信件~</div>
          </div>
          <div v-for="letter in store.pendingLetters" :key="letter.id" class="mail-letter-card pending">
            <div class="letter-stamp">⏳</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">{{ daysUntil(letter.openDate) }}天后可拆</div>
            </div>
            <div class="letter-seal">🔒</div>
          </div>
          <div v-for="letter in store.openableLetters" :key="letter.id" class="mail-letter-card openable" @click="openLetter(letter)">
            <div class="letter-stamp pulse">💌</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">点击拆信</div>
            </div>
            <div class="letter-seal glow">拆</div>
          </div>
          <div v-for="letter in store.openedLetters" :key="letter.id" class="mail-letter-card opened" @click="selectedLetter = letter; showLetterModal = true">
            <div class="letter-stamp read">📭</div>
            <div class="letter-body">
              <div class="letter-title">{{ letter.title || '无题' }}</div>
              <div class="letter-meta">{{ letter.openDate }} 已拆</div>
            </div>
            <button class="letter-del" @click.stop="store.removeTimeLetter(letter.id)">×</button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 月度历史 -->
      <div class="cal-history-section" :style="{ background: cardBg }">
      <MonthlyHistory />
    </div>

    <!-- 装备标签 -->
    <div class="cal-equipped-tag" :style="{ background: effectTagBg, color: effectTagColor }" v-if="shop.equippedItems.calendar">
      {{ shop.getItem(shop.equippedItems.calendar)?.icon }} {{ shop.getItem(shop.equippedItems.calendar)?.name }} 主题
    </div>

    <!-- 写信弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showWriteModal" class="mail-modal-mask" @click.self="showWriteModal = false">
          <div class="envelope write-envelope">
            <div class="envelope-flap"></div>
            <div class="envelope-body">
              <div class="letter-sheet write-sheet">
                <div class="sheet-deco">✐</div>
                <div class="sheet-title-row">
                  <span class="sheet-emoji">✉️</span>
                  <span class="sheet-title">写给未来的自己</span>
                </div>
                <input v-model="letterTitle" class="sheet-input title-input" placeholder="给这封信起个标题..." maxlength="20" />
                <div class="sheet-divider"></div>
                <div class="sheet-lines">
                  <textarea v-model="letterText" class="sheet-textarea" placeholder="亲爱的未来的我，&#10;&#10;当你看到这封信的时候..." maxlength="1500"></textarea>
                </div>
                <div class="sheet-bottom">
                  <div class="sheet-char">{{ letterText.length }} / 1500</div>
                  <div class="sheet-date-row">
                    <span>📅</span>
                    <input type="date" v-model="letterDate" :min="minDate" class="sheet-date" />
                    <span class="sheet-date-hint">拆信日期</span>
                  </div>
                </div>
                <div class="sheet-actions">
                  <button class="sheet-btn cancel" @click="showWriteModal = false">算了</button>
                  <button class="sheet-btn send" @click="submitLetter" :disabled="!letterTitle.trim() || !letterText.trim() || !letterDate">
                    <span>封好投递</span> <span class="send-icon">✈️</span>
                  </button>
                </div>
              </div>
              <div class="envelope-stamp">📮</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 拆信弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showLetterModal && selectedLetter" class="mail-modal-mask" @click.self="showLetterModal = false">
          <div class="envelope read-envelope">
            <div class="envelope-flap open"></div>
            <div class="envelope-body">
              <div class="letter-sheet read-sheet">
                <div class="read-seal">💌</div>
                <div class="read-title">{{ selectedLetter.title || '无题' }}</div>
                <div class="read-from">来自 {{ selectedLetter.createdAt }} 的自己</div>
                <div class="sheet-divider"></div>
                <div class="sheet-lines">
                  <div class="read-content">{{ selectedLetter.text }}</div>
                </div>
                <div class="read-sign">
                  <div class="sign-line"></div>
                  <div class="sign-info">
                    <span>写于 {{ selectedLetter.createdAt }}</span>
                    <span class="sign-dot">✦</span>
                    <span>{{ selectedLetter.openDate }} 拆开</span>
                  </div>
                </div>
                <button class="sheet-btn close" @click="showLetterModal = false">收好信件 💌</button>
              </div>
              <div class="envelope-stamp">📬</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.cal-page {
  min-height: 100%;
  position: relative;
}

.cal-page.cal-premium .cal-top-bar,
.cal-page.cal-premium .cal-card,
.cal-page.cal-premium .cal-premium-badge,
.cal-page.cal-premium .cal-cell.checked,
.cal-page.cal-premium .cal-cell.today:not(.checked) {
  will-change: transform, opacity, box-shadow;
}

.cal-page.cal-premium .cal-top-bar {
  animation: premiumLift 6s ease-in-out infinite;
}

.cal-page.cal-premium .cal-premium-badge {
  animation: premiumBadgePulse 3.6s ease-in-out infinite;
}

.cal-page.cal-premium .cal-card {
  animation: premiumCardFloat 7.5s ease-in-out infinite;
}

.cal-page.cal-premium .cal-cell.checked {
  animation: cal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), checkedGlow 3.4s ease-in-out infinite;
}

.cal-page.cal-premium .cal-cell.today:not(.checked) {
  animation: today-pulse 2.5s ease-in-out infinite, todayBreath 4.2s ease-in-out infinite;
}

@keyframes premiumLift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes premiumBadgePulse {
  0%, 100% { transform: scale(1); opacity: 0.92; }
  50% { transform: scale(1.03); opacity: 1; }
}

@keyframes premiumCardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(1px); }
}

.cal-page.float-stars .cal-premium-veil,
.cal-page.nebula-drift .cal-premium-veil,
.cal-page.mist-sweep .cal-premium-veil,
.cal-page.paper-breathe .cal-premium-veil,
.cal-page.sun-glow .cal-premium-veil,
.cal-page.sunset-bloom .cal-premium-veil,
.cal-page.leaf-fall .cal-premium-veil,
.cal-page.petal-float .cal-premium-veil,
.cal-page.tide-shift .cal-premium-veil,
.cal-page.frost-shimmer .cal-premium-veil,
.cal-page.mist-peak .cal-premium-veil,
.cal-page.rain-drift .cal-premium-veil,
.cal-page.film-grain .cal-premium-veil,
.cal-page.deep-galaxy .cal-premium-veil {
  animation-duration: 14s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.cal-page.float-stars .cal-premium-veil,
.cal-page.petal-float .cal-premium-veil {
  animation-name: driftUp;
}

.cal-page.nebula-drift .cal-premium-veil,
.cal-page.mist-sweep .cal-premium-veil,
.cal-page.mist-peak .cal-premium-veil,
.cal-page.rain-drift .cal-premium-veil,
.cal-page.deep-galaxy .cal-premium-veil {
  animation-name: slowDrift;
}

.cal-page.paper-breathe .cal-premium-veil,
.cal-page.sun-glow .cal-premium-veil,
.cal-page.sunset-bloom .cal-premium-veil,
.cal-page.frost-shimmer .cal-premium-veil,
.cal-page.film-grain .cal-premium-veil {
  animation-name: softPulse;
}

.cal-page.leaf-fall .cal-premium-veil {
  animation-name: leafDrift;
}

.cal-page.tide-shift .cal-premium-veil {
  animation-name: tideShift;
}

.cal-page.cal-premium .cal-cell.checked {
  animation: cal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), checkedGlow 3.4s ease-in-out infinite;
}

.cal-page.cal-premium .cal-cell.today:not(.checked) {
  animation: today-pulse 2.5s ease-in-out infinite, todayBreath 4.2s ease-in-out infinite;
}

@keyframes driftUp {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50% { transform: translateY(-4px); opacity: 0.85; }
}

@keyframes slowDrift {
  0%, 100% { transform: translateX(0); opacity: 0.5; }
  50% { transform: translateX(6px); opacity: 0.75; }
}

@keyframes softPulse {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.78; transform: scale(1.01); }
}

@keyframes leafDrift {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
  50% { transform: translateY(3px) rotate(-0.4deg); opacity: 0.78; }
}

@keyframes tideShift {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-5px); }
}

@keyframes checkedGlow {
  0%, 100% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22), 0 10px 24px rgba(120,110,170,0.18); }
  50% { box-shadow: inset 0 0 0 1px rgba(255,255,255,0.32), 0 12px 28px rgba(120,110,170,0.28); }
}

@keyframes todayBreath {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}
.cal-top-bar {
  padding: 28px 32px 22px;
  border-radius: 24px 24px 0 0;
  position: relative;
  overflow: hidden;
}
.cal-top-bar::after {
  content: '';
  position: absolute;
  bottom: 0; left: 24px; right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.cal-top-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cal-top-left { display: flex; align-items: center; gap: 14px; }
.cal-top-icon { font-size: 36px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.2)); }
.cal-top-title { font-size: 24px; font-weight: 900; letter-spacing: 1.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.cal-nav-row { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.cal-nav-btn {
  width: 32px; height: 32px; border: none; border-radius: 10px;
  background: rgba(255,255,255,0.2); font-size: 20px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.cal-nav-btn:hover { background: rgba(255,255,255,0.35); transform: scale(1.08); }
.cal-nav-btn:active { transform: scale(0.95); }
.cal-top-date { font-size: 17px; font-weight: 800; min-width: 120px; text-align: center; letter-spacing: 0.8px; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.cal-today-btn {
  border: none; border-radius: 10px; padding: 5px 16px;
  background: rgba(255,255,255,0.2); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(4px);
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.cal-today-btn:hover { background: rgba(255,255,255,0.35); transform: scale(1.04); }
.cal-top-right { text-align: right; }
.cal-top-streak {
  text-align: center;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(6px);
  border-radius: 16px;
  padding: 10px 18px;
  border: 1px solid rgba(255,255,255,0.12);
}
.cal-streak-num { font-size: 32px; font-weight: 900; display: block; line-height: 1.1; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.cal-streak-label { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }

/* 日历卡片 */
.cal-card {
  padding: 28px 32px;
  border-radius: 0 0 24px 24px;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  max-width: 520px;
}
.cal-wk {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 0;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.cal-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: default;
  border: 1px solid transparent;
}
.cal-cell:not(.pad):not(.checked):not(.today):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  border-color: rgba(0,0,0,0.04);
}
.cal-cell.checked {
  font-weight: 800;
  font-size: 16px;
  animation: cal-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255,255,255,0.2);
}
.cal-cell.checked::after {
  content: '✓';
  position: absolute;
  bottom: 3px;
  left: 3px;
  font-size: 9px;
  font-weight: 800;
  color: rgba(255,255,255,0.85);
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.cal-cell.pad { background: none; box-shadow: none; pointer-events: none; }
.cal-cell.today:not(.checked) {
  font-weight: 800;
  box-shadow: inset 0 0 0 2.5px var(--today-clr, #ff6b8a), 0 0 16px rgba(255,107,138,0.1);
  animation: today-pulse 2.5s ease-in-out infinite;
  border: 1px solid transparent;
}
@keyframes cal-pop {
  0% { transform: scale(0.7); opacity: 0; }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes today-pulse {
  0%, 100% { box-shadow: inset 0 0 0 2.5px var(--today-clr, #ff6b8a), 0 0 8px rgba(255,107,138,0.06); }
  50% { box-shadow: inset 0 0 0 2.5px var(--today-clr, #ff6b8a), 0 0 18px rgba(255,107,138,0.15); }
}

/* 图例 */
.cal-legend {
  display: flex;
  gap: 24px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6a5a4a; font-weight: 500; letter-spacing: 0.2px; }
.legend-dot { width: 12px; height: 12px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.legend-dot.today { background: #fff; }

/* 月度统计 */
.cal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
  text-align: center;
}
.cal-stat-item {
  background: rgba(255,255,255,0.35);
  border-radius: 14px;
  padding: 14px 8px;
  border: 1px solid rgba(0,0,0,0.03);
  transition: transform 0.2s, box-shadow 0.2s;
}
.cal-stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.cal-stat-val { font-size: 24px; font-weight: 900; line-height: 1.2; }
.cal-stat-lbl { font-size: 12px; color: #6a5a4a; margin-top: 6px; letter-spacing: 0.3px; }

/* 心情指示器（日历格子内） */
.cal-cell.has-mood { position: relative; }
.cal-cell.has-mood::before {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: var(--mood-clr, #ccc);
  box-shadow: 0 0 4px rgba(0,0,0,0.06);
}
.cell-mood {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 15px;
  line-height: 1;
  transform: scale(1.5);
  transform-origin: top right;
  text-shadow: 0 1px 3px rgba(0,0,0,0.1);
  pointer-events: none;
  z-index: 2;
}

/* 月度心情统计 */
.mood-stats {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.mood-stats-title { font-size: 14px; font-weight: 700; color: #5a4a3a; margin-bottom: 12px; letter-spacing: 0.3px; }
.mood-stats-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0,0,0,0.04);
  gap: 2px;
}
.mood-bar-seg {
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.mood-stats-list {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.mood-stat-item { font-size: 13px; color: #5a4a3a; font-weight: 600; letter-spacing: 0.2px; }

/* 装备标签 */
.cal-equipped-tag {
  display: inline-block;
  margin: 16px 32px 0;
  padding: 8px 22px;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid rgba(255,255,255,0.15);
}

/* ===== 日历+邮箱左右布局 ===== */
.cal-main {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}
.cal-left {
  flex: 1.2;
  min-width: 0;
}

/* ===== 时光邮箱 ===== */
.mailbox {
  flex: 1;
  min-width: 200px;
  background: linear-gradient(135deg, #f8f4fe, #f5f0fa);
  border-radius: 20px;
  padding: 22px;
  border: 1px solid rgba(154,138,184,0.12);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}
.mailbox-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.mailbox-icon { font-size: 24px; }
.mailbox-title { font-size: 16px; font-weight: 800; color: #5a4a6a; letter-spacing: 0.5px; }
.mailbox-desc { font-size: 13px; color: #8a7a9a; margin-bottom: 16px; letter-spacing: 0.2px; }
.mailbox-write-btn {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #9a8ab8, #8a7aaa);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(154,138,184,0.3);
  margin-bottom: 16px;
  letter-spacing: 0.3px;
}
.mailbox-write-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(154,138,184,0.4); }
.mailbox-write-btn:active { transform: translateY(0); }
.mailbox-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
.mailbox-empty { text-align: center; font-size: 13px; color: #9a8aaa; padding: 28px 0; }
.empty-envelope { font-size: 36px; margin-bottom: 8px; opacity: 0.35; }

/* 信件卡片 */
.mail-letter-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8f4fe;
  border: 1.5px solid rgba(154,138,184,0.2);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  /* 横线信纸效果 */
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 22px,
    rgba(154,138,184,0.06) 22px,
    rgba(154,138,184,0.06) 23px
  );
}
/* 右上角折角 */
.mail-letter-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(225deg, #efe8f8 50%, rgba(154,138,184,0.12) 50%);
  pointer-events: none;
}
.letter-stamp {
  width: 42px; height: 48px;
  border-radius: 4px;
  background: #fff;
  border: 2px solid rgba(154,138,184,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 1px 1px 4px rgba(0,0,0,0.06);
  /* 邮票锯齿边 */
  outline: 2px dashed rgba(154,138,184,0.15);
  outline-offset: 2px;
}
.letter-stamp.pulse { animation: stamp-pulse 1.5s ease-in-out infinite; }
@keyframes stamp-pulse {
  0%, 100% { transform: scale(1) rotate(-2deg); }
  50% { transform: scale(1.08) rotate(2deg); }
}
.letter-stamp.read { opacity: 0.4; filter: grayscale(0.5); }
.letter-body { flex: 1; min-width: 0; }
.letter-title {
  font-size: 14px; font-weight: 700; color: #4a3a5a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.letter-meta { font-size: 11px; color: #8a7a9a; margin-top: 3px; }
.letter-seal {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #9a8ab8, #8a7aaa);
  color: #fff;
  font-size: 12px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(154,138,184,0.4), inset 0 1px 2px rgba(255,255,255,0.3);
  border: 2px solid rgba(138,122,170,0.3);
}
.letter-seal.glow {
  background: linear-gradient(135deg, #a898c8, #9888b8);
  animation: seal-glow 1.2s ease-in-out infinite;
  font-size: 13px;
}
@keyframes seal-glow {
  0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(154,138,184,0.4), inset 0 1px 2px rgba(255,255,255,0.3); }
  50% { transform: scale(1.1); box-shadow: 0 4px 20px rgba(154,138,184,0.6), inset 0 1px 2px rgba(255,255,255,0.3); }
}

.mail-letter-card.pending {
  background-color: #f0eaf8;
  opacity: 0.75;
}
.mail-letter-card.openable {
  cursor: pointer;
  background-color: #f8f4fe;
  border-color: rgba(154,138,184,0.35);
  animation: letter-glow 2s ease-in-out infinite;
}
@keyframes letter-glow {
  0%, 100% { box-shadow: 0 2px 10px rgba(154,138,184,0.1); }
  50% { box-shadow: 0 6px 24px rgba(154,138,184,0.3); }
}
.mail-letter-card.openable:hover { transform: translateY(-3px) rotate(-0.5deg); box-shadow: 0 8px 28px rgba(154,138,184,0.3); }
.mail-letter-card.openable .letter-meta { color: #7a6a9a; font-weight: 700; }
.mail-letter-card.opened {
  cursor: pointer;
  background-color: #ece6f4;
  border-color: rgba(154,138,184,0.15);
}
.mail-letter-card.opened:hover { transform: translateY(-1px); }
.mail-letter-card.opened .letter-seal { display: none; }

/* 邮箱滚动条 */
.mailbox-list::-webkit-scrollbar { width: 4px; }
.mailbox-list::-webkit-scrollbar-track { background: transparent; }
.mailbox-list::-webkit-scrollbar-thumb { background: rgba(160,130,90,0.15); border-radius: 4px; }
.mailbox-list::-webkit-scrollbar-thumb:hover { background: rgba(160,130,90,0.25); }

.letter-del {
  position: absolute;
  top: 10px; right: 38px;
  width: 22px; height: 22px;
  border: none; border-radius: 50%;
  background: rgba(0,0,0,0.06); color: #888;
  font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s;
}
.letter-del:hover { background: #fee2e2; color: #ef4444; }

/* ===== 信封弹窗 ===== */
.mail-modal-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.envelope {
  position: relative;
  max-width: 560px; width: 100%;
  animation: mail-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes mail-in { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* 信封翻盖 */
.envelope-flap {
  height: 60px;
  background: linear-gradient(135deg, #9a8ab8, #8a7aaa);
  border-radius: 16px 16px 0 0;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.envelope-flap::after {
  content: '';
  position: absolute;
  bottom: -30px; left: 50%; transform: translateX(-50%);
  width: 0; height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-top: 30px solid #9a8ab8;
}
.envelope-flap.open {
  background: linear-gradient(135deg, #8a7aaa, #7a6a9a);
}
.envelope-flap.open::after { border-top-color: #8a7aaa; }

/* 信封主体 */
.envelope-body {
  background: linear-gradient(180deg, #d8cce8, #ccbfe0);
  border-radius: 0 0 16px 16px;
  padding: 36px 24px 24px;
  position: relative;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1);
}
/* 信封邮戳 */
.envelope-stamp {
  position: absolute;
  top: 12px; right: 20px;
  font-size: 32px;
  opacity: 0.3;
  transform: rotate(-12deg);
}

/* 信纸 */
.letter-sheet {
  background: #fffef8;
  border-radius: 8px;
  padding: 32px 36px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06), inset 0 0 40px rgba(200,180,140,0.08);
  /* 横线 */
  background-image: repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(180,160,130,0.1) 35px, rgba(180,160,130,0.1) 36px);
  background-size: 100% 36px;
  background-position: 0 0;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}
/* 左侧装饰线 - 淡化 */
.letter-sheet::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0; left: 44px;
  width: 1px;
  background: rgba(220,80,80,0.06);
  pointer-events: none;
}
/* 右上角装饰 */
.sheet-deco {
  position: absolute;
  top: 12px; right: 16px;
  font-size: 64px;
  color: rgba(200,180,140,0.07);
  font-family: 'STXingkai', cursive;
  pointer-events: none;
  transform: rotate(-8deg);
}

.sheet-title-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px;
}
.sheet-emoji { font-size: 26px; }
.sheet-title {
  font-size: 20px; font-weight: 800; color: #2a1a0a;
  letter-spacing: 2px;
}
.sheet-input {
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  outline: none;
  box-sizing: border-box;
  font-size: 16px;
  color: #2a1a0a;
  letter-spacing: 1px;
  font-weight: 600;
}
.sheet-input.title-input {
  font-weight: 700;
  border-bottom: 1.5px dashed rgba(180,150,120,0.25);
  padding-bottom: 10px;
  margin-bottom: 4px;
}
.sheet-input::placeholder { color: #c8b8a0; font-weight: 400; }
.sheet-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180,150,120,0.15), transparent);
  margin: 8px 0;
}
.sheet-lines { flex: 1; position: relative; }
.sheet-textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 16px;
  line-height: 36px;
  color: #2a1a0a;
  font-family: 'KaiTi', '楷体', 'STKaiti', 'SimSun', serif;
  letter-spacing: 1px;
  box-sizing: border-box;
  min-height: 288px;
  font-weight: 500;
}
.sheet-textarea::placeholder { color: #b0a090; font-family: inherit; line-height: 36px; }

/* 底部 */
.sheet-bottom {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8px;
}
.sheet-char { font-size: 12px; color: #c0b0a0; }
.sheet-date-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #a08870;
}
.sheet-date {
  padding: 5px 10px;
  border: 1px solid rgba(180,150,120,0.2);
  border-radius: 8px;
  font-size: 13px; color: #5a4830;
  background: rgba(255,255,255,0.6);
  outline: none;
}
.sheet-date:focus { border-color: #9a8ab8; }
.sheet-date-hint { font-size: 12px; color: #b0a090; }

/* 按钮 */
.sheet-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  margin-top: 20px;
}
.sheet-btn {
  padding: 12px 28px;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}
.sheet-btn.cancel {
  background: rgba(0,0,0,0.04);
  color: #999;
}
.sheet-btn.cancel:hover { background: rgba(0,0,0,0.07); }
.sheet-btn.send {
  background: linear-gradient(135deg, #9a8ab8, #8a7aaa);
  color: #fff;
  box-shadow: 0 4px 16px rgba(154,138,184,0.35);
  display: flex; align-items: center; gap: 8px;
}
.sheet-btn.send:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(154,138,184,0.45); }
.sheet-btn.send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.send-icon { font-size: 18px; }

/* 读信 */
.read-seal {
  text-align: center;
  font-size: 48px;
  margin-bottom: 8px;
  animation: seal-float 2s ease-in-out infinite;
}
@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.read-title {
  font-size: 22px; font-weight: 800; color: #2a1a0a;
  text-align: center;
  letter-spacing: 3px;
  margin-bottom: 6px;
}
.read-from {
  font-size: 14px; color: #a08870;
  text-align: center;
  font-style: italic;
  margin-bottom: 4px;
}
.read-content {
  font-size: 17px;
  line-height: 36px;
  color: #2a1a0a;
  font-family: 'KaiTi', '楷体', 'STKaiti', 'SimSun', serif;
  letter-spacing: 1px;
  white-space: pre-wrap;
  word-break: break-all;
  flex: 1;
  font-weight: 500;
}
.read-sign {
  margin-top: 20px;
}
.sign-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(180,150,120,0.2), transparent);
  margin-bottom: 10px;
}
.sign-info {
  display: flex; justify-content: center; align-items: center; gap: 10px;
  font-size: 13px; color: #b0a090;
}
.sign-dot { color: #9a8ab8; font-size: 10px; }
.sheet-btn.close {
  display: block;
  margin: 20px auto 0;
  background: linear-gradient(135deg, #9a8ab8, #8a7aaa);
  color: #fff;
  box-shadow: 0 4px 16px rgba(154,138,184,0.35);
}
.sheet-btn.close:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(154,138,184,0.45); }

/* ===== 日历深色模式 ===== */
.cal-dark .cal-page { background: linear-gradient(135deg, #1a1a2e, #2a2a3e); }
.cal-dark .cal-card { background: rgba(30,30,50,0.9); }
.cal-dark .cal-top-bar { background: linear-gradient(135deg, #3a3050, #4a3a60) !important; }
.cal-dark .cal-top-title { color: #e0d8f0 !important; }
.cal-dark .cal-top-date { color: #d0c8e0 !important; }
.cal-dark .cal-streak-num { color: #e0d8f0 !important; }
.cal-dark .cal-streak-label { color: #c0b8d0 !important; }
.cal-dark .cal-wk { color: #b0a8c0; }
.cal-dark .cal-cell { background: rgba(40,35,60,0.6); color: #c0b8d8; }
.cal-dark .cal-cell.checked { color: #e0d8f0; }
.cal-dark .cal-cell.today { background: rgba(60,50,80,0.8); }
.cal-dark .cal-legend { border-top-color: rgba(100,80,140,0.25); }
.cal-dark .legend-item { color: #b0a8c0; }
.cal-dark .cal-stats { border-top-color: rgba(100,80,140,0.25); }
.cal-dark .cal-stat-val { color: #d0c8e0; }
.cal-dark .cal-stat-lbl { color: #b0a8c0; }
.cal-dark .mood-stats { border-top-color: rgba(100,80,140,0.25); }
.cal-dark .mood-stats-title { color: #c0b8d0; }
.cal-dark .mood-stats-bar { background: rgba(40,35,60,0.8); }
.cal-dark .mood-stat-item { color: #b0a8c0; }
.cal-dark .cal-equipped-tag { background: rgba(100,80,140,0.2); color: #c0b8d0; }
.cal-dark .mailbox { background: linear-gradient(135deg, #2a2540, #302a48); border-color: rgba(100,80,140,0.15); }
.cal-dark .mailbox-title { color: #d0c8e0; }
.cal-dark .mailbox-desc { color: #a098b0; }
.cal-dark .mailbox-empty { color: #8070a0; }
.cal-dark .mail-letter-card { background-color: #2a2438; border-color: rgba(100,80,140,0.2); background-image: repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(100,80,140,0.06) 22px, rgba(100,80,140,0.06) 23px); }
.cal-dark .mail-letter-card::before { background: linear-gradient(225deg, #322c44 50%, rgba(100,80,140,0.1) 50%); }
.cal-dark .mail-letter-card.pending { background-color: #262030; }
.cal-dark .mail-letter-card.openable { background-color: #2e2838; border-color: rgba(154,138,184,0.2); }
.cal-dark .mail-letter-card.opened { background-color: #242030; }
.cal-dark .letter-stamp { background: #3a3450; border-color: rgba(100,80,140,0.25); }
.cal-dark .letter-title { color: #d8d0e8; }
.cal-dark .letter-meta { color: #a098b0; }
.cal-dark .letter-seal { background: linear-gradient(135deg, #6a5888, #5a4878); border-color: rgba(80,60,120,0.3); }
.cal-dark .letter-seal.glow { background: linear-gradient(135deg, #8a78a8, #7a6898); }
.cal-dark .envelope-flap { background: linear-gradient(135deg, #6a5888, #5a4878); }
.cal-dark .envelope-flap::after { border-top-color: #6a5888; }
.cal-dark .envelope-flap.open { background: linear-gradient(135deg, #5a4878, #4a3868); }
.cal-dark .envelope-flap.open::after { border-top-color: #5a4878; }
.cal-dark .envelope-body { background: linear-gradient(180deg, #3a3048, #322a40); }
.cal-dark .letter-sheet { background: #2a2540; box-shadow: 0 2px 12px rgba(0,0,0,0.2), inset 0 0 40px rgba(0,0,0,0.1); background-image: repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(100,80,140,0.05) 35px, rgba(100,80,140,0.05) 36px); }
.cal-dark .letter-sheet::before { background: rgba(154,138,184,0.04); }
.cal-dark .sheet-title { color: #d0c8e0; }
.cal-dark .sheet-input { color: #e0d8f0; }
.cal-dark .sheet-input.title-input { border-bottom-color: rgba(100,80,140,0.15); }
.cal-dark .sheet-input::placeholder { color: #6a5888; }
.cal-dark .sheet-textarea { color: #e0d8f0; }
.cal-dark .sheet-textarea::placeholder { color: #6a5888; }
.cal-dark .sheet-date { background: rgba(40,35,60,0.6); border-color: rgba(100,80,140,0.15); color: #e0d8f0; }
.cal-dark .sheet-btn.cancel { background: rgba(100,80,140,0.15); color: #888; }
.cal-dark .read-title { color: #e0d8f0; }
.cal-dark .read-from { color: #a098b0; }
.cal-dark .read-content { color: #e0d8f0; }

/* 月度历史 */
.cal-history-section {
  margin: 0 20px 20px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.03);
}
.cal-dark .cal-history-section {
  background: rgba(34,30,62,0.95) !important;
}
</style>
