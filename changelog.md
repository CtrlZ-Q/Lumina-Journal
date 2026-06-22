# 更新日志

## v3.1.0 — 称号系统修复 & 成就系统全面校准 & 隐藏台词修复

### 🐛 Bug 修复

#### 称号系统（核心修复）
| 问题 | 文件 | 修复 |
|------|------|------|
| 签到后称号不解锁 | `PageHome.vue` | 签到/日记后补 `checkTitles()` 调用 |
| 收藏语录后称号不解锁 | `PageQuote.vue` | 收藏后补 `checkTitles()` 调用 |
| 寄信/开信后称号不解锁 | `PageCalendar.vue` | 寄信/开信后补 `checkTitles()` 调用 |
| App 启动时已有条件的称号不解锁 | `App.vue` | `onMounted` 补检 `checkTitles()` |
| `buyTitle()` 级联称号 toast 丢失 | `shop.js` | 捕获 `checkTitles()` 返回值 |
| 抽奖消费不计入 `totalSpent` | `shop.js` | `pullGacha`/`pullPremiumGacha` 补 `totalSpent += cost` |

#### 成就系统
| 问题 | 文件 | 修复 |
|------|------|------|
| `weekend` 成就 1 次就触发（描述说 2 天） | `game.js` | `>= 1` → `>= 2` |
| `quote_daily` 成就 7 天才触发（描述说 3 天） | `game.js` | `>= 7` → `>= 3` |
| `coin_recovery` 成就条件与描述不符 | `game.js` | `<= 0 && > 0` → `<= 10 && >= 500` |
| `diary_long` 成就 200 字就触发（描述说超过 200） | `game.js` | `>= 200` → `> 200` |
| 道具使用后成就 toast 丢失 | `PageShop.vue` | 补 `popToasts()` + emit |
| 寄信/开信成就不检测 | `game.js` | `addTimeLetter`/`openTimeLetter` 补 `checkAchievements()` |
| `quote_daily` toast 文案写的"7天" | `game.js` | 改为"3天" |

#### 隐藏台词系统
| 问题 | 文件 | 修复 |
|------|------|------|
| `checkHiddenDialogues()` 从未被调用 | `shop.js` | 在 `buyItem`/`buyLimitedItem`/`pullGacha`/`pullPremiumGacha` 中补调用 |
| `dialogue_all` 成就永远解不了 | `shop.js` | 隐藏台词解锁后自动触发 `checkAchievements()` |

#### 其他
| 问题 | 文件 | 修复 |
|------|------|------|
| `buyLimitedItem` 消耗品重复购买被拒 | `shop.js` | 补 `item.type !== 'consumable'` 检查 |
| `extraQuotes` 空数据可能崩溃 | `shop.js` | 补 `?.data?.quotes \|\| []` 空值保护 |

### 🎨 描述修正

| 成就 | 原描述 | 新描述 | 原因 |
|------|--------|--------|------|
| `coin_100/500/1000/5000/10000` | 持有 X 金币 | 累计获得 X 金币 | 代码检查的是 `coins + totalSpent` |
| `weekend` | 周末连续打卡 2 天 | 累计周末打卡 2 天 | 计数器不区分连续与否 |
| `own_all_frame` | 拥有 5 个以上周报相框 | 拥有全部周报相框 | 代码要求全部拥有 |

---

## v3.0.0 — 视觉效果系统 & 日历重设计 & 全面 Bug 修复

### ✨ 功能新增

#### 1. 装备动画效果系统
- 新增 `ShopItemAnim.vue` 组件，支持 30+ 种 CSS 动画类型
- 新增 `shopAnimations.js`，为 166 个商品配置独立动画
- 主题装备后在首页显示全屏背景动画（花瓣、萤火虫、极光、银河等）
- 特效装备后在签到时显示对应动画
- 抽奖结果弹窗显示对应物品动画
- 动画集中在左右两侧，不遮挡中间内容

#### 2. 日历样式重设计（19 个）
- 每个日历风格有独特的视觉语言，不再只是换色
- 秋日：枫叶橙暖阳 | 冬日：冰晶蓝 | 春日：樱花粉 | 星空：深紫夜空
- 夏日：阳光金黄 | 雨天：灰蓝阴郁 | 复古：牛皮纸 | 珊瑚：海洋粉
- 山川：森林绿 | 日落：晚霞橙 | 星河：深空紫黑
- 抽奖独占：星云、樱花、薄雾、金秋、深银河、森林、雪国
- 日历顶栏文字颜色和背景通过 JS 直接设置，确保所有样式正确显示

#### 3. 流星动画
- 星空黑/暗夜主题显示弧线流星效果
- 从左上划到右下，尾部渐消
- GPU 加速，不卡顿

#### 4. 语录自动刷新
- 购买语录包后首页语录自动更新，无需切换页面

---

### 🐛 Bug 修复

| Bug | 文件 | 修复 |
|-----|------|------|
| `isPerfectWeek()` 周一就判定满勤 | `game.js` | 改为仅周日判定 |
| `isPerfectMonth()` 1 号就判定满勤 | `game.js` | 改为仅月末判定 |
| `buyLimitedItem` 不处理消耗品 | `shop.js` | 添加 type 检查 |
| `addFavoriteQuote` 重复收藏返回 undefined | `game.js` | 返回空数组 |
| `getDialogue` 中 `.data.quotes` 可能 undefined | `game.js` | 添加可选链 |
| `minCoinsEver` 商店消费不更新 | `game.js` | 添加 watch 监听 |
| `checkIn` 中 `today()` 午夜边界 | `game.js` | 缓存到 todayStr |
| 签到特效弹窗不含道具倍率加成 | `PageHome.vue` | finalReward += extra |
| 日记删除无确认 | `PageHome.vue` | 添加 confirm 弹窗 |
| 语录收藏删除无确认 | `PageQuote.vue` | 添加 confirm 弹窗 |
| 高级扭蛋奖品池预览显示错误 | `PageShop.vue` | 添加 activeGachaByRarity |
| 购买/抽奖失败无提示 | `PageShop.vue` | 添加失败 toast |
| 语录类物品显示装备按钮 | `PageShop.vue` | 限制为 equipable 类型 |
| "再买一个"按钮无禁用状态 | `PageShop.vue` | 添加 :disabled 检查 |
| 道具使用过早调用 checkAchievements | `PageShop.vue` | 赌博道具延迟检查 |
| 手册扭蛋价格与代码不一致 | `PageMore.vue` | 修正为 50/225, 200/900 |
| 手册签到奖励上限错误 | `PageMore.vue` | 50 → 40 |
| 日历 styleMap 缺少样式 | `PageCalendar.vue` | 补全 19 个样式 |
| 日历顶栏 CSS 覆盖内联样式 | `PageCalendar.vue` | JS 直接设置 |
| `logCoin` 时间戳缺少年份 | `game.js` | 添加年份 |
| 深色模式成就标签样式缺失 | `PageHome.vue` | 补全 5 个标签 |

---

### 🎨 视觉优化

- 珊瑚海气泡改为柔和粉色光晕
- 深林萤火虫改为暖金色（不与绿色背景融合）
- 商店预览动画仅主题/相框/日历/道具显示
- 成就页深色模式标签样式补全

---

### 📦 新增文件

| 文件 | 说明 |
|------|------|
| `src/components/ShopItemAnim.vue` | 商品动画渲染组件（商店/抽奖结果） |
| `src/components/ThemeDecor.vue` | 首页全屏背景动画组件（装备主题/特效） |
| `src/data/shopAnimations.js` | 166 个商品的动画配置 |

---

## v2.0.0 — 存储架构升级 & 功能扩展 & Bug 修复

### 🔄 重大变更
- **存储方式从浏览器 localStorage 迁移至本地文件存储**
  - 数据保存在 `%AppData%/逐光手帐/data.json`，覆盖安装不会丢失
  - 首次启动自动迁移旧的 localStorage 数据
  - 浏览器开发模式仍兼容 localStorage fallback

---

### ✨ 功能新增

#### 1. 称号系统整合
- `PageMore.vue`：新增「称号管理」可展开区域，显示所有称号、已解锁状态、穿戴/卸下按钮
- `PageHome.vue`：首页英雄区显示当前穿戴的称号标签（图标+名称）
- `PageShop.vue`：移除称号分类标签页（从商店分离到"更多"页）
- `shop.js`：`buyTitle()` 增加 `totalSpent` 追踪

#### 2. 使用手册
- `PageMore.vue`：新增「使用手册」按钮，弹出全屏模态框，包含 15 个可折叠章节：
  打卡、金币、成就、商店、道具、抽奖、称号、语录、时光邮箱、日记、周报、季节活动、数据管理、常见问题

#### 3. 金币明细优化
- `PageMore.vue`：金币明细移到备份数据上方，深色主题卡片设计，含余额徽章、统计行、滚动列表
- 点击后自动滚动到展示位置（使用 `@after-enter` 回调）

#### 4. 成就系统扩展（38 → 64 个）

新增 6 个类别共 26 个成就：

| 类别 | 成就 | 条件 |
|------|------|------|
| 心情 | 情绪初探、五味杂陈、情绪日记家、心情过山车 | 使用心情、用全5种、连续7天记录、同天2种心情 |
| 消费 | 初次破费、购物达人、剁手党、土豪降临 | 累计消费100/500/2000/5000币 |
| 时光 | 时光信使、拆信的喜悦、书信往来、写给未来的我 | 寄出/打开信件、寄5封、30天后开启的信 |
| 日记 | 笔耕不辍、日记人生、深夜独白、千字文 | 连续7/30天写日记、凌晨写、超200字 |
| 收集 | 主题收藏家、特效大师、相框达人 | 拥有3主题、3特效、5相框 |
| 彩蛋 | 完美一天、周末战士、触底反弹、语录鉴赏家 | 签到+日记+收藏、周末10次、金币触底反弹、连续3天收藏 |
| 挑战 | 月夜之王 | 连续30天深夜打卡（与早起30天对称） |

- `game.js`：新增 11 个状态追踪变量（`usedMoods`、`moodStreakDays`、`weekendCheckins`、`letterSentCount`、`letterOpenedCount`、`diaryStreak`、`quoteCollectStreak`、`comboDailyDone`、`minCoinsEver`、`coinRecoveryTriggered`）
- `ACH_REWARDS`：新增 26 个奖励映射
- `PageAchieve.vue`：新增 5 个标签 CSS（心情/消费/时光/收集/彩蛋）

#### 5. 信纸红线柔化
- `PageCalendar.vue`：信纸左侧红线 opacity 0.18 → 0.06，宽度 1.5px → 1px

---

### 🎨 颜色调整（浅色模式柔和化）

#### 全局样式（pixel.css）

| 属性 | 原值 | 新值 |
|------|------|------|
| `--c-surface` | `rgba(255,255,255,0.82)` | `rgba(235,228,218,0.92)` |
| `--c-surface-hover` | `rgba(255,255,255,0.90)` | `rgba(235,228,218,0.97)` |
| `--c-text` | `#1a1a1a` | `#5a5a66` |
| `--c-text-secondary` | `#666` | `#8a8a98` |
| `--c-text-muted` | `#999` | `#b8b8c4` |
| `--c-border` | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.03)` |
| `--c-shadow` | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.03)` |
| body 背景 | 纯白渐变 | 暖米色渐变 `#e5ded4` |
| 玻璃效果 | `rgba(255,255,255,0.88)` | `rgba(235,228,218,0.78)` |

#### 绿色柔化（全项目）
- 按钮绿色：`#10b981` → `#8fae9a`（柔和灰绿）
- 绿色背景：`#f0fdf4` → `#e8ece8`

#### 文字颜色统一

| 位置 | 原值 | 新值 |
|------|------|------|
| 深色标题 | `#1a1a1a` | `#4a4a56` |
| 正文文字 | `#333` / `#444` | `#5a5a66` |
| 次要文字 | `#7a7a8e` | `#8a8a98` |
| 浅灰文字 | `#aaa` | `#888` |
| 更浅灰 | `#ccc` | `#999` |
| 极浅灰 | `#bbb` | `#888` |

#### 各页面背景
- `PageHome.vue`：打卡按钮、日记项、模态框、导航栏、经典日历 → 暖色调
- `PageCalendar.vue`：经典日历卡片 → `rgba(235,228,218,0.9)`
- `PageShop.vue`：已拥有背景 `#f0fdf4` → `#e8ece8`
- `PageAchieve.vue`：标签背景 `#f0f0f0` → `#e8e4de`
- `PageMore.vue`：称号空状态 `#f9fafb` → `#f0ece6`

---

### 🐛 Bug 修复

| Bug | 文件 | 修复 |
|-----|------|------|
| `getDialogue()` 中 `purchasedItems` 无空值保护 | `game.js` | 加 `\|\| []` |
| 早起/夜猫连续天数跳天不重置 | `game.js` | 加跳天检测，自动归零 |
| 夜猫连续天数被日记写入刷高 | `game.js` | 检测逻辑从 `checkAchievements()` 移到 `checkIn()` |
| `getDayMood` 参数名遮蔽 `dateStr` 函数 | `game.js` | 参数改名为 `d` |
| `todayStr` 作用域丢失（移代码时带走声明） | `game.js` | `checkAchievements()` 中重新声明 |
| 5 个新成就标签无 CSS | `PageAchieve.vue` | 补齐心情/消费/时光/收集/彩蛋样式 |
| 手册成就数量过时 | `PageMore.vue` | 更新为 64 |
| 抽奖按钮显示价格与实际扣费不一致 | `PageShop.vue` | 普通 50/220 → 150/650，高级 500/2200 → 1500/6500 |
| 重置数据时多个状态字段未清空 | `game.js` | `resetState()` 补全 `totalSpent`、`hasEarlyBird`、`hasNightOwl`、`timeLetters`、`coinLog` |
| 购买隐藏台词后 `collectedDialogues` 未同步 | `shop.js` | `checkHiddenDialogues()` 解锁时同步写入 `gameStore.collectedDialogues` |
| 早起/夜猫连续打卡逻辑 else-if 条件错误 | `game.js` | 条件改为 `checkedToday && lastEarlyDate !== todayStr` |
| 语录分类"全部显示"失效 | `game.js` | 移除 `explicitlySet && selected.length === 0` 条件 |
| 日历出勤率在查看非当月时计算错误 | `PageCalendar.vue` | 当月用 `todayDate`，非当月用 `daysInMonth` |
| 限时商店每日刷新使用 UTC 时间 | `shop.js` | `toISOString()` → 本地时间格式化 |
| 消耗品加成金币未记入金币流水 | `PageHome.vue` | 磁铁/三倍/双倍/幸运星/幸运草全部记入 `logCoin` |
| 彩蛋奖励金币未记入金币流水 | `PageHome.vue` | 领取金币记入 `logCoin` |
| 被动道具提示描述数值范围不符 | `PageShop.vue` | 幸运草 30\~80 → 0\~50，幸运星 50\~150 → 0\~100 |
| 称号描述与实际触发阈值不一致 | `shop.js` | 早起鸟"6点前" → "8点前"，夜猫子"12点后" → "10点后" |
| 导入数据可能在异步写入完成前刷新 | `PageMore.vue` | `await saveState()` 确保写入完成再刷新 |
| 成就阈值与实际台词数量不匹配 | `game.js` + `PageAchieve.vue` + `PageQuote.vue` | 8 → 12 |

---

### 🧹 死代码清理
- `game.js`：移除 `triggerEvent()` 函数（\~40行）、`hiddenDialoguePool` 数组（8条）、`dailyEvent` ref 及相关 state/watch/save/reset/export、`collectedFragments` ref 及相关代码

---

### 📦 改动文件汇总

| 文件 | 改动类型 |
|------|----------|
| `electron/main.cjs` | 新增文件存储 IPC |
| `electron/preload.cjs` | 暴露 electronAPI |
| `src/composables/useStorage.js` | 新增存储封装 |
| `src/composables/easterEgg.js` | 新增彩蛋状态存取 |
| `src/styles/pixel.css` | 颜色变量、背景、玻璃效果 |
| `src/stores/game.js` | 新增成就检测、状态变量、bug修复、死代码清理 |
| `src/stores/shop.js` | buyTitle 增加 totalSpent、UTC 修复、称号描述修复 |
| `src/pages/PageHome.vue` | 称号标签、颜色调整、流水记录 |
| `src/pages/PageMore.vue` | 称号管理、使用手册、金币明细、导入修复 |
| `src/pages/PageAchieve.vue` | 26个新成就、5个标签CSS、阈值修正 |
| `src/pages/PageShop.vue` | 移除称号分类、价格修复、道具描述修复 |
| `src/pages/PageCalendar.vue` | 月份导航、出勤率修复、颜色调整 |
| `src/pages/PageQuote.vue` | 隐藏台词12条、颜色调整 |
