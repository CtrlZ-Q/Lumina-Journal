// 季节限定活动 — 按公历月份匹配
// start/end 格式: MM-DD（含当天）
// repeat: true 表示每年重复
// lunar: true 表示农历节日，使用年份映射表

// 农历节日公历日期映射（2026-2035）
// 超出范围时回退到 2026 年日期
const lunarDates = {
  laba:        { 2026:'01-15', 2027:'01-04', 2028:'01-22', 2029:'01-11', 2030:'01-01', 2031:'01-20', 2032:'01-08', 2033:'01-27', 2034:'01-16', 2035:'01-05' },
  lantern:     { 2026:'03-03', 2027:'02-20', 2028:'02-09', 2029:'02-27', 2030:'02-17', 2031:'02-06', 2032:'02-25', 2033:'02-14', 2034:'03-05', 2035:'02-22' },
  dragon_head: { 2026:'03-20', 2027:'03-09', 2028:'02-26', 2029:'03-16', 2030:'03-05', 2031:'02-22', 2032:'03-13', 2033:'03-02', 2034:'03-21', 2035:'03-11' },
  dragon_boat: { 2026:'06-19', 2027:'06-09', 2028:'05-28', 2029:'06-16', 2030:'06-05', 2031:'06-24', 2032:'06-12', 2033:'06-01', 2034:'06-20', 2035:'06-10' },
  qixi:        { 2026:'08-19', 2027:'08-08', 2028:'08-26', 2029:'08-16', 2030:'08-05', 2031:'08-24', 2032:'08-12', 2033:'08-01', 2034:'08-20', 2035:'08-10' },
  ghost:       { 2026:'08-27', 2027:'08-16', 2028:'09-03', 2029:'08-24', 2030:'08-13', 2031:'09-01', 2032:'08-20', 2033:'08-09', 2034:'08-28', 2035:'08-18' },
  mid_autumn:  { 2026:'09-25', 2027:'09-15', 2028:'10-03', 2029:'09-22', 2030:'09-12', 2031:'10-01', 2032:'09-19', 2033:'09-08', 2034:'09-27', 2035:'09-16' },
  double_ninth:{ 2026:'10-18', 2027:'10-08', 2028:'10-26', 2029:'10-16', 2030:'10-05', 2031:'10-24', 2032:'10-12', 2033:'10-01', 2034:'10-20', 2035:'10-09' },
  chuxi:       { 2026:'02-16', 2027:'02-05', 2028:'01-25', 2029:'02-12', 2030:'02-02', 2031:'01-22', 2032:'02-10', 2033:'01-30', 2034:'02-18', 2035:'02-07' },
  dongzhi:     { 2026:'12-22', 2027:'12-22', 2028:'12-21', 2029:'12-21', 2030:'12-22', 2031:'12-22', 2032:'12-21', 2033:'12-21', 2034:'12-22', 2035:'12-22' },
}

function getLunarDate(id, year) {
  const table = lunarDates[id]
  if (!table) return null
  return table[year] || table[2026] // 超出范围回退到 2026
}

export const seasonalEvents = [
  // ===== 跨年（多日）=====
  {
    id: 'new_year', name: '跨年', icon: '🎆',
    start: '12-31', end: '01-03', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #1e1b4b, #7c3aed, #ec4899)', color: '#fff' },
    greeting: '新年快乐！今年也要一起加油~',
    coinBonus: 2.0,
    easterEgg: { icon: '🎇', name: '烟花', min: 100, max: 300 },
    freeQuotes: ['新年快乐！', '去年的flag今年重新立', '新的一年，新的开始', '今年一定要...', '跨年快乐！', '时间过得真快啊', '今年也要元气满满', '去年欠下的今年还', '新年新气象！'],
  },
  // ===== 除夕（农历年末）=====
  {
    id: 'chuxi', name: '除夕', icon: '🧨',
    start: '02-16', end: '02-16', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #dc2626, #ea580c)', color: '#fff' },
    greeting: '除夕快乐！团圆饭吃了吗~',
    coinBonus: 2.0,
    easterEgg: { icon: '🧧', name: '红包', min: 100, max: 300 },
    freeQuotes: ['爆竹声中一岁除', '除夕夜，团圆时', '年夜饭，是家的味道', '守岁迎新，万事如意', '今晚的烟花为你而放', '一家人整整齐齐，就是最好的年'],
  },
  // ===== 腊八节（农历十二月初八）=====
  {
    id: 'laba', name: '腊八节', icon: '🥣',
    start: '01-07', end: '01-07', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #92400e, #d97706)', color: '#fff' },
    greeting: '腊八节快乐！喝碗腊八粥暖暖~',
    coinBonus: 1.5,
    easterEgg: { icon: '🥣', name: '腊八粥', min: 50, max: 150 },
    freeQuotes: ['过了腊八就是年', '一碗腊八粥，温暖整个冬天', '腊八粥香飘万里', '年味渐浓，归家渐近', '腊八蒜绿了，年就近了', '暖粥一碗，抵御寒冬'],
  },
  // ===== 春节（多日假期）=====
  {
    id: 'spring_festival', name: '春节', icon: '🧧',
    start: '01-28', end: '02-04', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #dc2626, #f59e0b)', color: '#fff' },
    greeting: '新年快乐！红包拿来~',
    coinBonus: 1.5,
    easterEgg: { icon: '🧨', name: '爆竹', min: 100, max: 300 },
    freeQuotes: ['新年新气象，万事如意！', '恭喜发财，红包拿来！', '爆竹声中一岁除，春风送暖入屠苏', '新年胜旧年，万事皆可期', '岁岁平安，年年有余', '心想事成，万事如意', '新年快乐，身体健康', '金榜题名，前程似锦', '阖家欢乐，幸福美满'],
  },
  // ===== 元宵节（农历正月十五）=====
  {
    id: 'lantern', name: '元宵节', icon: '🏮',
    start: '02-12', end: '02-12', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #dc2626, #f97316)', color: '#fff' },
    greeting: '元宵节快乐！吃汤圆了吗~',
    coinBonus: 1.5,
    easterEgg: { icon: '🏮', name: '灯笼', min: 50, max: 150 },
    freeQuotes: ['月上柳梢头，人约黄昏后', '众里寻他千百度', '灯火阑珊处，愿你找到归处', '一碗汤圆，团团圆圆', '元宵佳节，花好月圆', '猜灯谜，吃元宵，闹花灯'],
  },
  // ===== 情人节（单日）=====
  {
    id: 'valentines', name: '情人节', icon: '💝',
    start: '02-14', end: '02-14', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #ec4899, #f472b6)', color: '#fff' },
    greeting: '情人节快乐~愿你被爱包围',
    coinBonus: 1.5,
    easterEgg: { icon: '🌹', name: '玫瑰', min: 50, max: 150 },
    freeQuotes: ['你是我最想留住的幸运', '我想和你一起慢慢变老', '你笑起来真好看', '有你在的地方就是家', '余生请多指教', '你是我的小幸运', '今天也是喜欢你的一天', '你是我最好的遇见', '想把所有温柔都给你', '世间五味俱全，谢谢你给我的甜'],
  },
  // ===== 妇女节（单日）=====
  {
    id: 'women_day', name: '女神节', icon: '👑',
    start: '03-08', end: '03-08', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff' },
    greeting: '女神节快乐！你值得世间所有美好',
    coinBonus: 1.5,
    easterEgg: { icon: '💐', name: '花束', min: 50, max: 150 },
    freeQuotes: ['你不需要完美，你只需要真实', '做自己的女王', '你比自己想象的更强大', '愿你被世界温柔以待', '你是一道光，温暖而明亮', '自信的女孩最美丽', '你的价值不需要别人来定义', '愿你一生努力，一生被爱'],
  },
  // ===== 龙抬头（农历二月初二）=====
  {
    id: 'dragon_head', name: '龙抬头', icon: '🐲',
    start: '03-10', end: '03-10', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #059669, #0891b2)', color: '#fff' },
    greeting: '二月二，龙抬头，大吉大利！',
    coinBonus: 1.5,
    easterEgg: { icon: '✂️', name: '龙头', min: 50, max: 150 },
    freeQuotes: ['二月二，龙抬头', '剃龙头，一年都有精神头', '春风得意，龙马精神', '龙抬头，好兆头', '万物复苏，生机勃勃', '春回大地，鸿运当头'],
  },
  // ===== 清明节（单日）=====
  {
    id: 'qingming', name: '清明节', icon: '🍃',
    start: '04-05', end: '04-05', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #22c55e, #86efac)', color: '#fff' },
    greeting: '清明时节，春暖花开',
    coinBonus: 1.5,
    easterEgg: { icon: '🌸', name: '春花', min: 50, max: 100 },
    freeQuotes: ['清明时节雨纷纷', '春城无处不飞花', '燕子来时新社，梨花落后清明', '万物生长此时，皆清洁而明净', '春风又绿江南岸', '踏青好时节'],
  },
  // ===== 劳动节（多日假期）=====
  {
    id: 'labor_day', name: '劳动节', icon: '⚒️',
    start: '05-01', end: '05-05', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #f97316, #eab308)', color: '#fff' },
    greeting: '劳动节快乐！辛苦了，休息一下吧',
    coinBonus: 1.5,
    easterEgg: { icon: '☕', name: '咖啡', min: 50, max: 150 },
    freeQuotes: ['劳动最光荣', '今天也要加油鸭', '休息是为了走更远的路', '辛苦了，你很棒', '每一份努力都不会被辜负', '今天适合放松~'],
  },
  // ===== 母亲节（单日）=====
  {
    id: 'mothers_day', name: '母亲节', icon: '🌹',
    start: '05-11', end: '05-11', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #ec4899, #f472b6)', color: '#fff' },
    greeting: '母亲节快乐！妈妈辛苦了~',
    coinBonus: 1.5,
    easterEgg: { icon: '💐', name: '康乃馨', min: 50, max: 150 },
    freeQuotes: ['妈妈是世界上最温暖的存在', '谁言寸草心，报得三春晖', '世上只有妈妈好', '妈妈的唠叨是最动听的情话', '你陪我长大，我陪你变老', '今天记得给妈妈打电话哦'],
  },
  // ===== 儿童节（单日）=====
  {
    id: 'children_day', name: '儿童节', icon: '🎈',
    start: '06-01', end: '06-01', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff' },
    greeting: '六一快乐！谁还不是个宝宝呢~',
    coinBonus: 1.5,
    easterEgg: { icon: '🍭', name: '棒棒糖', min: 50, max: 150 },
    freeQuotes: ['永远年轻，永远热泪盈眶', '谁还不是个宝宝呢', '保持童心，保持快乐', '今天可以理直气壮地幼稚', '小时候盼长大，长大了想回去', '童心未泯，世界就永远新鲜'],
  },
  // ===== 端午节（农历五月初五）=====
  {
    id: 'dragon_boat', name: '端午节', icon: '🐉',
    start: '06-19', end: '06-19', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #059669, #0d9488)', color: '#fff' },
    greeting: '端午安康！吃粽子了吗~',
    coinBonus: 1.5,
    easterEgg: { icon: '🫔', name: '粽子', min: 50, max: 150 },
    freeQuotes: ['端午安康', '粽子甜的还是咸的？', '龙舟竞渡，鼓声震天', '五月五，是端午', '艾草飘香，龙舟破浪', '粽叶飘香，情意绵长'],
  },
  // ===== 父亲节（单日）=====
  {
    id: 'fathers_day', name: '父亲节', icon: '👔',
    start: '06-21', end: '06-21', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff' },
    greeting: '父亲节快乐！爸爸辛苦了~',
    coinBonus: 1.5,
    easterEgg: { icon: '🍺', name: '啤酒', min: 50, max: 150 },
    freeQuotes: ['父爱如山，沉默而深沉', '爸爸是超人，无所不能', '小时候骑在爸爸肩上看世界', '父爱是无声的守护', '今天记得跟爸爸说声谢谢', '你的背影是我最坚实的依靠'],
  },
  // ===== 七夕节（农历七月初七）=====
  {
    id: 'qixi', name: '七夕节', icon: '🌌',
    start: '08-22', end: '08-22', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff' },
    greeting: '七夕快乐！愿天下有情人终成眷属',
    coinBonus: 1.5,
    easterEgg: { icon: '💌', name: '情书', min: 50, max: 150 },
    freeQuotes: ['两情若是久长时，又岂在朝朝暮暮', '金风玉露一相逢，便胜却人间无数', '柔情似水，佳期如愿', '愿得一人心，白首不相离', '今夕何夕，见此良人', '星河璀璨，不及你眼中的光'],
  },
  // ===== 夏日祭（覆盖暑假，排在七夕后面）=====
  {
    id: 'summer', name: '夏日祭', icon: '🌻',
    start: '07-01', end: '08-31', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' },
    greeting: '夏天快乐！冰淇淋和西瓜在召唤你~',
    coinBonus: 1.2,
    easterEgg: { icon: '🍉', name: '西瓜', min: 30, max: 100 },
    freeQuotes: ['夏天的风，我永远记得', '西瓜空调WiFi，夏天三件套', '热到融化也要坚持打卡', '夏天的晚风最温柔', '阳光灿烂的日子', '冰镇快乐水，干杯！'],
  },
  // ===== 中元节（农历七月十五）=====
  {
    id: 'ghost', name: '中元节', icon: '👻',
    start: '09-02', end: '09-02', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: '#e0e7ff' },
    greeting: '中元节~今晚要小心哦',
    coinBonus: 1.5,
    easterEgg: { icon: '🕯️', name: '蜡烛', min: 50, max: 150 },
    freeQuotes: ['百鬼夜行，你是最亮的那个', '今晚月色朦胧，适合讲鬼故事', '胆小鬼也要坚持打卡', '黑暗中也有光', '怕什么，有我陪你', '中元节快乐（如果你敢快乐的话）'],
  },
  // ===== 教师节（单日）=====
  {
    id: 'teachers_day', name: '教师节', icon: '🎓',
    start: '09-10', end: '09-10', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff' },
    greeting: '教师节快乐！感谢每一位老师',
    coinBonus: 1.5,
    easterEgg: { icon: '📖', name: '好书', min: 50, max: 150 },
    freeQuotes: ['春蚕到死丝方尽，蜡炬成灰泪始干', '一日为师，终身为父', '桃李不言，下自成蹊', '师恩如山，铭记于心', '感谢你教我成为更好的人', '三尺讲台，一生耕耘'],
  },
  // ===== 中秋节（农历八月十五）=====
  {
    id: 'mid_autumn', name: '中秋节', icon: '🥮',
    start: '09-25', end: '09-25', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #d97706, #78350f)', color: '#fff' },
    greeting: '中秋快乐！月饼吃了吗~',
    coinBonus: 1.5,
    easterEgg: { icon: '🥮', name: '月饼', min: 50, max: 150 },
    freeQuotes: ['但愿人长久，千里共婵娟', '月是故乡明', '海上生明月，天涯共此时', '月饼配茶，人生赢家', '今晚的月亮真圆', '中秋快乐，阖家团圆', '举杯邀明月，对影成三人', '月到中秋偏皎洁', '今夜月明人尽望'],
  },
  // ===== 国庆节（多日假期）=====
  {
    id: 'national_day', name: '国庆节', icon: '🇨🇳',
    start: '10-01', end: '10-07', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #dc2626, #fbbf24)', color: '#fff' },
    greeting: '国庆节快乐！假期愉快~',
    coinBonus: 1.5,
    easterEgg: { icon: '🎌', name: '国旗', min: 100, max: 300 },
    freeQuotes: ['祖国生日快乐', '假期也要坚持打卡哦', '七天长假，好好休息', '为祖国庆生', '今天适合躺平', '国庆快乐，万事如意'],
  },
  // ===== 重阳节（农历九月初九）=====
  {
    id: 'double_ninth', name: '重阳节', icon: '🏔️',
    start: '10-18', end: '10-18', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #b45309, #d97706)', color: '#fff' },
    greeting: '重阳节快乐！登高望远~',
    coinBonus: 1.5,
    easterEgg: { icon: '🌺', name: '菊花', min: 50, max: 150 },
    freeQuotes: ['遥知兄弟登高处，遍插茱萸少一人', '九九重阳，岁岁安康', '登高望远，心旷神怡', '菊花酒香，重阳糕甜', '愿你安康，愿你无恙', '秋高气爽，正是登高时'],
  },
  // ===== 万圣节（单日）=====
  {
    id: 'halloween', name: '万圣节', icon: '🎃',
    start: '10-31', end: '10-31', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #ea580c, #1a1a2e)', color: '#fff' },
    greeting: '万圣节快乐！Trick or Treat~',
    coinBonus: 1.5,
    easterEgg: { icon: '🍬', name: '糖果', min: 50, max: 150 },
    freeQuotes: ['不给糖就捣蛋', '今晚适合讲鬼故事', '南瓜灯亮起来', '胆小鬼也要坚持打卡', '万圣节快乐！', '黑暗中也有光'],
  },
  // ===== 双十一（单日）=====
  {
    id: 'double_eleven', name: '双十一', icon: '🛒',
    start: '11-11', end: '11-11', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff' },
    greeting: '双十一快乐！剁手了吗~',
    coinBonus: 1.5,
    easterEgg: { icon: '📦', name: '快递', min: 50, max: 150 },
    freeQuotes: ['买买买！', '钱包在哭泣', '今天的快乐是购物给的', '理性消费，从我做起（大概）', '清空购物车的感觉真好', '双十一快乐！'],
  },
  // ===== 冬至（节气）=====
  {
    id: 'dongzhi', name: '冬至', icon: '❄️',
    start: '12-22', end: '12-22', repeat: false, lunar: true,
    banner: { bg: 'linear-gradient(135deg, #1e40af, #60a5fa)', color: '#fff' },
    greeting: '冬至快乐！吃饺子还是汤圆~',
    coinBonus: 1.5,
    easterEgg: { icon: '🥟', name: '饺子', min: 50, max: 150 },
    freeQuotes: ['冬至大如年', '吃了饺子不冻耳朵', '北方饺子南方汤圆，你是哪一派？', '冬至一阳生', '天寒地冻，注意保暖', '冬至快乐，记得吃饺子'],
  },
  // ===== 圣诞节（单日）=====
  {
    id: 'christmas', name: '圣诞节', icon: '🎄',
    start: '12-25', end: '12-25', repeat: true,
    banner: { bg: 'linear-gradient(135deg, #dc2626, #16a34a)', color: '#fff' },
    greeting: 'Merry Christmas~ 圣诞快乐！',
    coinBonus: 1.5,
    easterEgg: { icon: '🎁', name: '礼物', min: 50, max: 150 },
    freeQuotes: [
      'Merry Christmas!', '圣诞快乐，平安喜乐', '愿你的圣诞温暖如初',
      '铃儿响叮当', '最好的礼物是陪伴', '今晚记得挂袜子哦',
      '雪花飘落，温暖在心', '圣诞老人今年会来吗', '愿所有美好如约而至',
    ],
  },
]

// 获取当前生效的季节活动
export function getActiveSeasonalEvent() {
  const now = new Date()
  const year = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const today = `${mm}-${dd}`

  for (const evt of seasonalEvents) {
    // 农历节日：从年份映射表获取当年日期
    if (evt.lunar) {
      const date = getLunarDate(evt.id, year)
      if (date && today === date) return evt
      continue
    }

    const { start, end } = evt
    // 处理跨年（如 12-31 ~ 01-03）
    if (start <= end) {
      if (today >= start && today <= end) return evt
    } else {
      if (today >= start || today <= end) return evt
    }
  }
  return null
}

// 心情选项
export const moodOptions = [
  { key: 'happy', icon: '😊', label: '开心', color: '#22c55e', bg: '#f0fdf4' },
  { key: 'normal', icon: '😐', label: '一般', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'sad', icon: '😢', label: '难过', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'angry', icon: '😤', label: '生气', color: '#ef4444', bg: '#fef2f2' },
  { key: 'excited', icon: '🥳', label: '兴奋', color: '#ec4899', bg: '#fdf2f8' },
]

export function getMoodByKey(key) {
  return moodOptions.find(m => m.key === key) || null
}
