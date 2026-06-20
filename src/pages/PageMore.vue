<script setup>
import { ref, computed, nextTick } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'
import { loadState, saveState, STORAGE_KEY, SHOP_KEY } from '../composables/useStorage'
import { titleDefs } from '../stores/shop'
import WeeklyReport from '../components/WeeklyReport.vue'

const store = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['show-toast'])

const showWeeklyReport = ref(false)
const showCoinLog = ref(false)
const coinLogRef = ref(null)
const showTitles = ref(false)
const titlesRef = ref(null)
const showReset = ref(false)
const resetStep = ref(0)
const showManual = ref(false)
const manualSections = ref({})

function startReset() { showReset.value = true; resetStep.value = 1 }
function nextResetStep() { resetStep.value++ }
function cancelReset() { showReset.value = false; resetStep.value = 0 }
function confirmReset() {
  store.resetState()
  shop.resetShop()
  showReset.value = false
  resetStep.value = 0
  emit('show-toast', '🔄 所有数据已重置')
}

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    game: JSON.stringify(loadState(STORAGE_KEY)),
    shop: JSON.stringify(loadState(SHOP_KEY)),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date()
  const ds = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`
  a.href = url
  a.download = `逐光手帐_备份_${ds}.json`
  a.click()
  URL.revokeObjectURL(url)
  emit('show-toast', '📦 数据已导出')
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.game && !data.shop) {
          emit('show-toast', '❌ 无效的备份文件')
          return
        }
        // 验证内容是合法 JSON 字符串
        if (data.game) { await saveState(JSON.parse(data.game), STORAGE_KEY) }
        if (data.shop) { await saveState(JSON.parse(data.shop), SHOP_KEY) }
        emit('show-toast', '✅ 数据已恢复，正在刷新...')
        setTimeout(() => location.reload(), 800)
      } catch {
        emit('show-toast', '❌ 文件格式错误')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function toggleManualSection(key) {
  manualSections.value[key] = !manualSections.value[key]
}

function handleBuyTitle(t) {
  const result = shop.buyTitle(t.id)
  if (result.ok) emit('show-toast', `🏅 获得称号「${t.name}」！`)
  else if (result.reason === 'insufficient') emit('show-toast', '❌ 金币不足')
}
</script>

<template>
  <div class="card">
    <div class="card-header"><span>⚙️ 设置</span></div>
    <div class="setting-list">
      <button class="setting-row" @click="shop.toggleDarkMode()">
        <span class="setting-icon">{{ shop.darkMode ? '☀️' : '🌙' }}</span>
        <span class="setting-label">{{ shop.darkMode ? '浅色模式' : '深色模式' }}</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row" @click="showWeeklyReport = true">
        <span class="setting-icon">📊</span>
        <span class="setting-label">查看周报</span>
        <span class="setting-arrow">›</span>
      </button>
      <div class="setting-row static">
        <span class="setting-icon">💰</span>
        <span class="setting-label">当前余额</span>
        <span class="setting-val">{{ store.coins }} 币</span>
      </div>
      <button class="setting-row" @click="showCoinLog=!showCoinLog">
        <span class="setting-icon">💰</span>
        <span class="setting-label">金币明细</span>
        <span class="setting-arrow" :class="{ open: showCoinLog }">›</span>
      </button>
      <button class="setting-row" @click="showTitles=!showTitles">
        <span class="setting-icon">🏅</span>
        <span class="setting-label">称号管理</span>
        <span class="setting-arrow" :class="{ open: showTitles }">›</span>
      </button>
      <button class="setting-row" @click="exportData">
        <span class="setting-icon">📦</span>
        <span class="setting-label">备份数据</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row" @click="importData">
        <span class="setting-icon">📥</span>
        <span class="setting-label">恢复数据</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row" @click="showManual = true">
        <span class="setting-icon">📖</span>
        <span class="setting-label">使用手册</span>
        <span class="setting-arrow">›</span>
      </button>
      <button class="setting-row danger" @click="startReset">
        <span class="setting-icon">🔄</span>
        <span class="setting-label">重置所有数据</span>
        <span class="setting-arrow">›</span>
      </button>
    </div>
  </div>

  <!-- 金币流水展开 -->
  <Transition name="expand" @after-enter="coinLogRef?.scrollIntoView({behavior:'smooth',block:'start'})">
    <div v-if="showCoinLog" ref="coinLogRef" class="coin-log-card">
      <div class="coin-log-header">
        <div class="coin-log-title">💰 金币流水</div>
        <div class="coin-log-balance-badge">{{ store.coins.toLocaleString() }} 币</div>
      </div>
      <div class="coin-log-stats">
        <div class="coin-stat earn-stat">
          <span class="coin-stat-label">总收入</span>
          <span class="coin-stat-value">+{{ store.totalEarned.toLocaleString() }}</span>
        </div>
        <div class="coin-stat-divider"></div>
        <div class="coin-stat spend-stat">
          <span class="coin-stat-label">总支出</span>
          <span class="coin-stat-value">-{{ store.totalSpent.toLocaleString() }}</span>
        </div>
      </div>
      <div v-if="store.coinLog.length === 0" class="coin-log-empty">暂无流水记录</div>
      <div v-else class="coin-log-list">
        <div v-for="(entry, i) in store.coinLog" :key="i" class="coin-log-item">
          <div class="log-left">
            <span class="log-reason">{{ entry.reason }}</span>
            <span class="log-time">{{ entry.time }}</span>
          </div>
          <div class="log-right">
            <span class="log-amount" :class="{ earn: entry.amount > 0, spend: entry.amount < 0 }">{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}</span>
            <span class="log-balance">{{ entry.balance }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 称号管理展开 -->
  <Transition name="expand" @after-enter="titlesRef?.scrollIntoView({behavior:'smooth',block:'start'})">
    <div v-if="showTitles" ref="titlesRef" class="titles-card">
      <div class="titles-header">
        <div class="titles-title">🏅 称号管理</div>
        <div class="titles-count">{{ shop.ownedTitles.length }}/{{ titleDefs.length }}</div>
      </div>
      <div class="title-current-banner" v-if="shop.activeTitle">
        <span class="title-current-icon">{{ shop.getTitle(shop.activeTitle)?.icon }}</span>
        <span class="title-current-name">{{ shop.getTitle(shop.activeTitle)?.name }}</span>
        <button class="title-unequip-btn" @click="shop.equipTitle(null)">卸下</button>
      </div>
      <div class="title-current-banner empty" v-else>
        <span>未装备称号</span>
      </div>
      <div class="title-grid">
        <div v-for="t in titleDefs" :key="t.id" class="title-card" :class="{ owned: shop.ownedTitles.includes(t.id), equipped: shop.activeTitle === t.id }">
          <div class="title-icon">{{ t.icon }}</div>
          <div class="title-name">{{ t.name }}</div>
          <div class="title-desc">{{ t.desc }}</div>
          <div v-if="shop.ownedTitles.includes(t.id)" class="title-actions">
            <button v-if="shop.activeTitle !== t.id" class="title-equip-btn" @click="shop.equipTitle(t.id)">装备</button>
            <span v-else class="title-equipped-badge">✅ 已装备</span>
          </div>
          <div v-else-if="t.cost > 0" class="title-buy">
            <button class="title-buy-btn" @click="handleBuyTitle(t)">💰 {{ t.cost }}</button>
          </div>
          <div v-else class="title-locked">🔒 {{ t.desc }}</div>
        </div>
      </div>
    </div>
  </Transition>

  <WeeklyReport v-if="showWeeklyReport" @close="showWeeklyReport = false" />

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showReset" class="modal-mask" @click="cancelReset">
        <div class="modal-box reset-modal" @click.stop>
          <template v-if="resetStep === 1">
            <div class="reset-emoji">⚠️</div>
            <div class="reset-h">确定要重置数据吗？</div>
            <div class="reset-p">你的所有打卡记录将被清除</div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消</button><button class="btn-next" @click="nextResetStep">下一步</button></div>
          </template>
          <template v-else-if="resetStep === 2">
            <div class="reset-emoji">🚨</div>
            <div class="reset-h">所有数据都将被清除！</div>
            <div class="reset-p">打卡记录、金币、成就，全部归零<br>此操作<b>不可恢复</b></div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消</button><button class="btn-next warn" @click="nextResetStep">我确定要清除</button></div>
          </template>
          <template v-else-if="resetStep === 3">
            <div class="reset-emoji">💀</div>
            <div class="reset-h">最后确认</div>
            <div class="reset-p">一旦重置，所有努力将化为乌有<br>你确定吗？</div>
            <div class="reset-btns"><button class="btn-cancel" @click="cancelReset">取消，我后悔了</button><button class="btn-next danger" @click="confirmReset">永久删除</button></div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 使用手册弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showManual" class="modal-mask manual-mask" @click="showManual = false">
        <div class="manual-modal" @click.stop>
          <div class="manual-header">
            <span class="manual-title">📖 使用手册</span>
            <button class="manual-close" @click="showManual = false">✕</button>
          </div>
          <div class="manual-body">

            <!-- 打卡系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('checkin')">
                <span>📅 打卡系统</span>
                <span class="manual-arrow" :class="{open: manualSections.checkin}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.checkin" class="manual-content">
                <div class="manual-item"><b>每日打卡</b>：每天可打卡一次，打卡后获得随机金币奖励。</div>
                <div class="manual-item"><b>基础奖励</b>：10 币基础 + 随机 0~(10+连续加成) 币。连续打卡每满 7 天，随机上限 +5，最高 +20（即最大基础奖励 50 币）。</div>
                <div class="manual-item"><b>季节加成</b>：节日期间打卡有额外倍率（1.2x~2.0x），具体见首页活动横幅。</div>
                <div class="manual-item"><b>装备加成</b>：装备主题/相框可获得额外金币加成（最高 30%）。加成 = 主题加成 + 相框加成 + 拥有数量加成（每 5 件装扮 +1%，上限 10%）。</div>
                <div class="manual-item"><b>连续打卡</b>：断签一天即重置连续天数。周日判断「周满勤」，月末判断「月满勤」。</div>
                <div class="manual-tip">💡 提示：装备高级主题和相框可以显著提升每日金币收入！</div>
              </div></Transition>
            </div>

            <!-- 金币系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('coins')">
                <span>💰 金币系统</span>
                <span class="manual-arrow" :class="{open: manualSections.coins}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.coins" class="manual-content">
                <div class="manual-sub-title">📌 每日打卡奖励</div>
                <div class="manual-item"><b>固定基础</b>：每次打卡固定获得 <b>10 币</b>。</div>
                <div class="manual-item"><b>随机奖励</b>：额外随机 0~N 币，N = 10 + 连续加成。</div>
                <div class="manual-sub">• 连续 0~6 天：随机 0~10，总奖励 10~20 币</div>
                <div class="manual-sub">• 连续 7~13 天：随机 0~15，总奖励 10~25 币</div>
                <div class="manual-sub">• 连续 14~20 天：随机 0~20，总奖励 10~30 币</div>
                <div class="manual-sub">• 连续 21~27 天：随机 0~25，总奖励 10~35 币</div>
                <div class="manual-sub">• 连续 28 天以上：随机 0~30，总奖励 10~40 币（上限）</div>
                <div class="manual-item"><b>季节加成</b>：在节日活动期间，以上奖励乘以活动倍率：</div>
                <div class="manual-sub">• 除夕、跨年：<b>2.0x</b>（最高 40×2 = 80 币）</div>
                <div class="manual-sub">• 春节、国庆等大多数节日：<b>1.5x</b>（最高 40×1.5 = 60 币）</div>
                <div class="manual-sub">• 夏日祭：<b>1.2x</b>（最高 40×1.2 = 48 币）</div>
                <div class="manual-item"><b>装备加成</b>：在季节加成之后，再乘以装备加成：</div>
                <div class="manual-sub">• 主题加成：5%~15%（按主题价格递增）</div>
                <div class="manual-sub">• 相框加成：3%~10%（按相框价格递增）</div>
                <div class="manual-sub">• 拥有数量加成：每拥有 5 件装扮物品 +1%，上限 10%</div>
                <div class="manual-sub">• 总加成上限：<b>30%</b></div>
                <div class="manual-sub-title">📌 成就奖励</div>
                <div class="manual-item">解锁成就自动获得金币，金额 10~3000 币不等，共 64 个成就。详见「成就系统」章节。</div>
                <div class="manual-sub-title">📌 抽奖返还</div>
                <div class="manual-item">普通扭蛋抽到「普通」结果返还 30/50/100 币（随机）；高级扭蛋固定返还 100 币。重复物品按稀有度补偿 50~500 币。</div>
                <div class="manual-sub-title">📌 道具收益</div>
                <div class="manual-item">随机礼盒 0~100 币、每日转盘 0~200 币、神秘礼盒 0~400 币、点金术 0~1000 币（均为随机）。</div>
                <div class="manual-sub-title">📌 金币消耗</div>
                <div class="manual-item">商店商品 25~1500 币、语录包 25~35 币/包、普通扭蛋 150 币/次（650 币/5 次）、高级扭蛋 1500 币/次（6500 币/5 次）。</div>
                <div class="manual-sub-title">📌 举例：新用户第一天</div>
                <div class="manual-item">打卡获得 10+随机0~10 = <b>10~20 币</b>。完成「初来乍到」成就自动获得 <b>+30 币</b>，首日可攒 <b>40~50 币</b>。</div>
                <div class="manual-tip">💡 提示：坚持连续打卡提升随机上限，装备主题和相框提升加成，节日活动期间多打卡！</div>
              </div></Transition>
            </div>

            <!-- 成就系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('achieve')">
                <span>🏆 成就系统</span>
                <span class="manual-arrow" :class="{open: manualSections.achieve}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.achieve" class="manual-content">
                <div class="manual-item"><b>成就类别</b>：基础、进阶、挑战、循环、传说、心情、消费、时光、收集、彩蛋（共 10 类）。</div>
                <div class="manual-item"><b>总成就数</b>：64 个，解锁后自动获得金币奖励（10~3000 币不等）。</div>
                <div class="manual-item"><b>心情成就</b>：在日记中记录心情可解锁，使用全部 5 种心情、连续 7 天记录心情等。</div>
                <div class="manual-item"><b>消费成就</b>：在商店消费累计达到一定金额自动解锁。</div>
                <div class="manual-item"><b>时光成就</b>：寄出/打开时光信件可解锁。</div>
                <div class="manual-item"><b>收集成就</b>：拥有一定数量的主题、特效、相框可解锁。</div>
                <div class="manual-item"><b>彩蛋成就</b>：深夜写日记、写超长日记、同一天完成签到+日记+收藏语录等隐藏条件。</div>
                <div class="manual-item"><b>循环成就</b>：「周满勤」和「月满勤」成就可以多次完成，累计次数越多奖励越高。</div>
                <div class="manual-tip">💡 提示：成就奖励是早期金币的重要来源，优先完成简单的基础成就！心情和彩蛋成就最容易被忽略。</div>
              </div></Transition>
            </div>

            <!-- 商店系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('shop')">
                <span>🛒 商店系统</span>
                <span class="manual-arrow" :class="{open: manualSections.shop}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.shop" class="manual-content">
                <div class="manual-item"><b>商品分类</b>：主题（改变整体色调）、特效（打卡时动画）、相框（周报边框）、语录（扩展台词库）、音效（打卡音效）、日历（日历皮肤）、道具（消耗品）。</div>
                <div class="manual-item"><b>装备系统</b>：主题/特效/相框/音效/日历 各一个槽位，购买后可装备或卸下。</div>
                <div class="manual-item"><b>限时商店</b>：每天刷新 5 件折扣商品（10%~50% off），已拥有的无法重复购买。</div>
                <div class="manual-item"><b>隐藏台词</b>：购买特定高级商品（如极光主题、银河特效等）会解锁专属隐藏台词（共12条），显示在首页语录区。</div>
                <div class="manual-tip">💡 提示：优先购买主题和相框，它们能提供持续的金币加成！</div>
              </div></Transition>
            </div>

            <!-- 道具系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('items')">
                <span>🎫 道具系统</span>
                <span class="manual-arrow" :class="{open: manualSections.items}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.items" class="manual-content">
                <div class="manual-item"><b>被动道具</b>（购买后下次打卡自动生效）：</div>
                <div class="manual-sub">• 双倍金币（30币）：下次打卡奖励 ×2</div>
                <div class="manual-sub">• 三倍金币（60币）：下次打卡奖励 ×3</div>
                <div class="manual-sub">• 金币磁铁（100币）：下次打卡奖励 ×5</div>
                <div class="manual-sub">• 幸运草（25币）：下次打卡额外 +0~50 币</div>
                <div class="manual-sub">• 幸运星（50币）：下次打卡额外 +0~100 币</div>
                <div class="manual-item"><b>主动道具</b>（购买后在商店点击使用）：</div>
                <div class="manual-sub">• 运势水晶（30币）：随机运势（大吉/中吉/小吉/末吉/凶）</div>
                <div class="manual-sub">• 刷新卡（50币）：刷新首页语录</div>
                <div class="manual-sub">• 随机礼盒（50币）：随机 0~100 币</div>
                <div class="manual-sub">• 每日转盘（100币）：随机 0~200 币</div>
                <div class="manual-sub">• 神秘礼盒（200币）：随机 0~400 币</div>
                <div class="manual-sub">• 点金术（500币）：随机 0~1000 币</div>
                <div class="manual-tip">💡 提示：被动道具不会叠加，买多个会在多次打卡时依次生效。幸运类道具和倍率道具会同时生效！</div>
              </div></Transition>
            </div>

            <!-- 抽奖系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('gacha')">
                <span>🎰 抽奖系统</span>
                <span class="manual-arrow" :class="{open: manualSections.gacha}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.gacha" class="manual-content">
                <div class="manual-item"><b>普通扭蛋</b>（150币/次，650币/5次）：</div>
                <div class="manual-sub">• 传说 0.5% | 史诗 3% | 稀有 12% | 普通 84.5%</div>
                <div class="manual-sub">• 普通结果返还 30/50/100 币</div>
                <div class="manual-sub">• 保底：50 次未出稀有+，下次必出史诗以上</div>
                <div class="manual-sub">• 五连保底：最后一抽至少稀有</div>
                <div class="manual-item"><b>高级扭蛋</b>（1500币/次，6500币/5次）：</div>
                <div class="manual-sub">• 传说 3% | 史诗 12% | 稀有 25% | 普通 60%</div>
                <div class="manual-sub">• 普通结果固定返还 100 币</div>
                <div class="manual-sub">• 五连保底：最后一抽至少史诗</div>
                <div class="manual-item"><b>重复补偿</b>：已拥有全部同稀有度物品时，获得金币补偿（50~500币）。</div>
                <div class="manual-tip">💡 提示：五连抽比单抽五次便宜 100 币，还有保底机制！</div>
              </div></Transition>
            </div>

            <!-- 称号系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('title')">
                <span>🏅 称号系统</span>
                <span class="manual-arrow" :class="{open: manualSections.title}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.title" class="manual-content">
                <div class="manual-item"><b>获取方式</b>：满足条件后自动解锁，无需购买。共 28 个称号。</div>
                <div class="manual-item"><b>称号类型</b>：打卡里程碑、连续打卡、金币积累、收藏数量、抽奖次数、成就数量、特殊时间、分类精通。</div>
                <div class="manual-item"><b>装备称号</b>：在「更多 → 称号管理」中装备，装备后首页语录下方显示称号标签。</div>
                <div class="manual-item"><b>同时只能装备一个称号</b>，可以随时卸下或更换。</div>
                <div class="manual-tip">💡 提示：称号是对长期坚持的认可，努力解锁更多称号吧！</div>
              </div></Transition>
            </div>

            <!-- 语录系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('quote')">
                <span>💬 语录系统</span>
                <span class="manual-arrow" :class="{open: manualSections.quote}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.quote" class="manual-content">
                <div class="manual-item"><b>首页语录</b>：每天随机显示一条语录，来源包括内置台词、购买特定商品解锁的隐藏台词（12条）、购买的语录包、季节活动免费台词。</div>
                <div class="manual-item"><b>语录包</b>：商店有 12 个类别 × 4 个档次 = 48 个语录包，每包 250 条语录。类别包括情感、奋斗、治愈、智慧、青春、自然、孤独、幽默、美食、旅行、成长、梦想。</div>
                <div class="manual-item"><b>语录收藏</b>：在「语录」页面可以收藏喜欢的语录，收藏达到 1/5/10/20 条解锁对应成就。</div>
                <div class="manual-item"><b>类别管理</b>：在「我的」页面可以开关已拥有的语录类别，控制哪些类别出现在随机轮换中。</div>
                <div class="manual-tip">💡 提示：语录页面点击「换一条」可以刷新显示的语录！</div>
              </div></Transition>
            </div>

            <!-- 时光邮箱 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('letter')">
                <span>📮 时光邮箱</span>
                <span class="manual-arrow" :class="{open: manualSections.letter}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.letter" class="manual-content">
                <div class="manual-item"><b>写信</b>：在日历页面点击「写一封信」，填写标题、内容和开启日期。开启日期必须是明天之后。</div>
                <div class="manual-item"><b>信件状态</b>：</div>
                <div class="manual-sub">• 🔒 未到时间：显示倒计天数</div>
                <div class="manual-sub">• 📩 可拆封：到达指定日期后可以拆开阅读</div>
                <div class="manual-sub">• 📖 已拆封：可以随时查看，也可以删除</div>
                <div class="manual-item"><b>用途</b>：给未来的自己写一封信，记录当下的心情和期望。</div>
                <div class="manual-tip">💡 提示：写一封一年后开启的信，到时候再看会很有感触！</div>
              </div></Transition>
            </div>

            <!-- 日记系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('journal')">
                <span>📝 日记系统</span>
                <span class="manual-arrow" :class="{open: manualSections.journal}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.journal" class="manual-content">
                <div class="manual-item"><b>写日记</b>：在首页输入框写下心情，可选择心情标签（开心/一般/难过/生气/兴奋）。</div>
                <div class="manual-item"><b>心情统计</b>：日历页面会显示当月心情分布图，日历格子上也会显示心情图标。</div>
                <div class="manual-item"><b>日记成就</b>：写满 5/20/50/100 条日记解锁对应成就。</div>
                <div class="manual-item"><b>日记数量</b>：没有上限，尽情记录吧！</div>
                <div class="manual-tip">💡 提示：每天打卡后顺手写一句日记，既记录心情又能推进成就！</div>
              </div></Transition>
            </div>

            <!-- 周报系统 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('report')">
                <span>📊 周报系统</span>
                <span class="manual-arrow" :class="{open: manualSections.report}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.report" class="manual-content">
                <div class="manual-item"><b>查看周报</b>：在「更多 → 查看周报」打开，显示本周打卡统计。</div>
                <div class="manual-item"><b>周报内容</b>：连续天数、本周打卡数、本周金币估算、出勤率、每日打卡状态。</div>
                <div class="manual-item"><b>保存周报</b>：点击「保存图片」可将周报保存为 PNG 图片，支持分享。</div>
                <div class="manual-item"><b>边框定制</b>：装备不同的相框会改变周报的边框样式和颜色。</div>
                <div class="manual-tip">💡 提示：每周日保存一张周报，记录你的坚持轨迹！</div>
              </div></Transition>
            </div>

            <!-- 季节活动 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('season')">
                <span>🎊 季节活动</span>
                <span class="manual-arrow" :class="{open: manualSections.season}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.season" class="manual-content">
                <div class="manual-item"><b>活动数量</b>：全年 26 个节日活动，涵盖中国传统节日和公历节日。</div>
                <div class="manual-item"><b>活动福利</b>：节日期间打卡金币加成（1.2x~2.0x），首页显示活动横幅。</div>
                <div class="manual-item"><b>节日彩蛋</b>：点击活动横幅上的彩蛋图标，可领取额外金币奖励（30~300 币）。</div>
                <div class="manual-item"><b>免费语录</b>：每个活动附带应景的免费语录，节日期间自动加入语录轮换。</div>
                <div class="manual-item"><b>农历节日</b>：春节、元宵、端午、中秋等农历节日使用预计算日期表（2026-2035年）。</div>
                <div class="manual-tip">💡 提示：除夕和跨年的金币加成最高（2.0x），不要错过！</div>
              </div></Transition>
            </div>

            <!-- 数据管理 -->
            <div class="manual-section">
              <button class="manual-section-btn" @click="toggleManualSection('data')">
                <span>💾 数据管理</span>
                <span class="manual-arrow" :class="{open: manualSections.data}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.data" class="manual-content">
                <div class="manual-item"><b>自动保存</b>：所有数据自动保存在本地文件中（%AppData%/逐光手帐/data.json），无需手动操作。覆盖安装不会丢失数据。</div>
                <div class="manual-item"><b>备份数据</b>：在「更多 → 备份数据」导出 JSON 文件，包含所有打卡和商店数据。</div>
                <div class="manual-item"><b>恢复数据</b>：在「更多 → 恢复数据」导入之前备份的 JSON 文件，恢复后自动刷新。</div>
                <div class="manual-item"><b>重置数据</b>：在「更多 → 重置所有数据」清除全部数据，需要三步确认，不可恢复！</div>
                <div class="manual-item"><b>深色模式</b>：在「更多 → 深色/浅色模式」切换，深色模式默认开启。</div>
                <div class="manual-tip">💡 提示：定期备份数据，换浏览器或清理缓存时不会丢失进度！</div>
              </div></Transition>
            </div>

            <!-- 常见问题 -->
            <div class="manual-section">
              <button class="manual-section-btn faq-btn" @click="toggleManualSection('faq')">
                <span>❓ 常见问题</span>
                <span class="manual-arrow" :class="{open: manualSections.faq}">›</span>
              </button>
              <Transition name="expand"><div v-if="manualSections.faq" class="manual-content">
                <div class="manual-item"><b>Q：打卡后金币显示不对？</b></div>
                <div class="manual-sub">A：签到特效显示的是包含所有加成的最终金额（基础+随机+季节加成+装备加成+道具加成）。如果感觉偏小，可能是连续天数不够或未装备加成道具。在「金币明细」可查看详细收支。</div>
                <div class="manual-item"><b>Q：断签了连续天数归零？</b></div>
                <div class="manual-sub">A：是的，连续打卡要求每天都签到。只要断一天就会重新计算。建议养成每天打卡的习惯！</div>
                <div class="manual-item"><b>Q：抽奖一直不出好东西？</b></div>
                <div class="manual-sub">A：普通扭蛋有 50 次保底机制，50 次未出稀有+则下次必出史诗以上。五连抽也有保底（最后一抽至少稀有）。坚持抽总会出的！</div>
                <div class="manual-item"><b>Q：限时商店的物品会重复吗？</b></div>
                <div class="manual-sub">A：每天的 5 件折扣商品基于日期伪随机生成，同一天看到的物品相同。已购买的物品会灰显无法重复购买。</div>
                <div class="manual-item"><b>Q：语录包买了但首页没显示新语录？</b></div>
                <div class="manual-sub">A：语录是随机轮换的，购买后需要刷新语录才会出现。也可以在「语录」页面查看已拥有的全部语录。</div>
                <div class="manual-item"><b>Q：数据会丢失吗？</b></div>
                <div class="manual-sub">A：数据保存在本地文件中（%AppData%/逐光手帐/），覆盖安装不会丢失。但卸载应用时可能清除数据，建议定期使用「备份数据」功能导出备份。</div>
                <div class="manual-item"><b>Q：称号怎么装备？</b></div>
                <div class="manual-sub">A：在「更多 → 称号管理」中，已解锁的称号点击「装备」即可。装备后首页语录下方会显示称号标签。</div>
                <div class="manual-item"><b>Q：道具买多了会怎样？</b></div>
                <div class="manual-sub">A：被动道具（双倍/三倍/磁铁/幸运草/幸运星）会存起来，每次打卡自动消耗一个。主动道具也可以囤积，需要时手动使用。</div>
              </div></Transition>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.card {
  background: rgba(235,228,218,0.92);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  font-size: 16px;
  font-weight: 700;
  color: #4a4a56;
}

.setting-list { padding: 6px 0; }
.setting-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  border: none;
  width: 100%;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  transition: background 0.25s;
}
.setting-row:last-child { border-bottom: none; }
.setting-row:hover { background: rgba(0,0,0,0.02); }
.setting-row.static { cursor: default; }
.setting-icon { font-size: 24px; }
.setting-label { flex: 1; font-size: 15px; font-weight: 600; color: #4a4a56; }
.setting-val { font-size: 14px; color: #888; font-weight: 500; }
.setting-arrow { font-size: 20px; color: #999; transition: transform 0.2s; }
.setting-row:hover .setting-arrow { transform: translateX(3px); }
.setting-row.danger .setting-label { color: #ef4444; }
.setting-arrow.open { transform: rotate(90deg); }

/* 金币流水 */
.coin-log-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05);
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid rgba(212,168,83,0.15);
}
.coin-log-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 16px;
}
.coin-log-title { font-size: 15px; font-weight: 700; color: #f0d48a; letter-spacing: 0.5px; }
.coin-log-balance-badge {
  font-size: 14px; font-weight: 800; color: #f0d48a;
  background: rgba(212,168,83,0.12); padding: 6px 16px;
  border-radius: 20px; border: 1px solid rgba(212,168,83,0.2);
}
.coin-log-stats {
  display: flex; align-items: center; justify-content: center;
  padding: 0 24px 16px; gap: 0;
}
.coin-stat { flex: 1; text-align: center; }
.coin-stat-label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
.coin-stat-value { font-size: 18px; font-weight: 800; }
.earn-stat .coin-stat-value { color: #34d399; }
.spend-stat .coin-stat-value { color: #f87171; }
.coin-stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.08); margin: 0 16px; }
.coin-log-empty { text-align: center; padding: 32px 24px; font-size: 13px; color: #555; }
.coin-log-list { max-height: 320px; overflow-y: auto; padding: 0 8px 8px; }
.coin-log-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: background 0.2s;
}
.coin-log-item:hover { background: rgba(255,255,255,0.03); }
.log-left { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.log-reason { color: #b0b0c8; font-weight: 500; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-time { color: #555; font-size: 11px; }
.log-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.log-amount { font-weight: 800; font-size: 15px; }
.log-amount.earn { color: #34d399; }
.log-amount.spend { color: #f87171; }
.log-balance { color: #555; font-size: 11px; }

/* 称号管理 */
.titles-card {
  background: rgba(235,228,218,0.92);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
  overflow: hidden;
  margin-bottom: 8px;
}
.titles-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 12px;
}
.titles-title { font-size: 15px; font-weight: 700; color: #4a4a56; }
.titles-count { font-size: 13px; font-weight: 700; color: #d4a853; background: rgba(212,168,83,0.08); padding: 4px 14px; border-radius: 20px; }
.title-current-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 24px; margin: 0 16px 12px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-radius: 14px; border: 1px solid #fde68a;
  font-size: 14px; font-weight: 700; color: #92400e;
}
.title-current-banner.empty { background: #f0ece6; border-color: #ddd8d0; color: #888; font-weight: 500; justify-content: center; }
.title-current-icon { font-size: 22px; }
.title-current-name { flex: 1; }
.title-unequip-btn {
  padding: 6px 14px; border: none; border-radius: 8px;
  background: #e5e7eb; color: #666; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.title-unequip-btn:hover { background: #d1d5db; }
.title-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px; padding: 0 16px 16px;
}
.title-card {
  background: #f9fafb; border: 1.5px solid #e5e7eb;
  border-radius: 14px; padding: 16px 12px; text-align: center;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.title-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.title-card.owned { border-color: #fbbf24; background: #fffbeb; }
.title-card.equipped { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.2); background: #fffbeb; }
.title-icon { font-size: 28px; margin-bottom: 6px; }
.title-name { font-size: 13px; font-weight: 800; color: #333; margin-bottom: 4px; }
.title-desc { font-size: 12px; color: #999; margin-bottom: 8px; }
.title-actions { display: flex; justify-content: center; }
.title-equip-btn {
  padding: 6px 16px; border: none; border-radius: 8px;
  background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.title-equip-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.title-equipped-badge { font-size: 12px; color: #d97706; font-weight: 600; }
.title-buy { display: flex; justify-content: center; }
.title-buy-btn {
  padding: 6px 16px; border: none; border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2); color: #fff;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: transform 0.2s;
}
.title-buy-btn:hover { transform: translateY(-1px); }
.title-locked { font-size: 12px; color: #ccc; }

.expand-enter-active { animation: expand-in 0.35s ease; overflow: hidden; }
.expand-leave-active { animation: expand-in 0.25s ease reverse; overflow: hidden; }
@keyframes expand-in { from { max-height: 0; opacity: 0; } to { max-height: 800px; opacity: 1; } }

.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #e5ded4; border-radius: 28px; text-align: center; box-shadow: 0 32px 64px rgba(0,0,0,0.15); }
.modal-enter-active { animation: m-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { animation: m-in 0.25s ease reverse; }
@keyframes m-in { from { opacity: 0; transform: scale(0.9) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.reset-modal { padding: 44px 48px; min-width: 360px; max-width: 420px; }
.reset-emoji { font-size: 56px; margin-bottom: 18px; }
.reset-h { font-size: 20px; font-weight: 800; color: #4a4a56; margin-bottom: 10px; }
.reset-p { font-size: 14px; color: #888; line-height: 1.8; margin-bottom: 28px; }
.reset-btns { display: flex; gap: 14px; justify-content: center; }
.btn-cancel {
  padding: 12px 28px;
  border: 1.5px solid #e5e5e5;
  border-radius: 14px;
  background: #e0d9ce;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-cancel:hover { background: #f9f9f9; border-color: #ddd; }
.btn-next {
  padding: 12px 28px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff6b8a, #ff8e53);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 16px rgba(255,107,138,0.3);
}
.btn-next:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,107,138,0.4); }
.btn-next.warn { background: linear-gradient(135deg, #f97316, #fb923c); box-shadow: 0 4px 16px rgba(249,115,22,0.3); }
.btn-next.danger { background: linear-gradient(135deg, #dc2626, #ef4444); box-shadow: 0 4px 16px rgba(239,68,68,0.3); animation: pulse-red 1.5s ease-in-out infinite; }
@keyframes pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3), 0 4px 16px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 4px 16px rgba(239,68,68,0.3); } }

/* 使用手册 */
.manual-mask { align-items: flex-start !important; padding: 20px; }
.manual-modal {
  background: #e5ded4; border-radius: 24px;
  width: 100%; max-width: 560px; max-height: calc(100vh - 40px);
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.2);
  margin-top: 0;
}
.manual-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.manual-title { font-size: 18px; font-weight: 800; color: #4a4a56; }
.manual-close {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: #f3f4f6; color: #666; font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.manual-close:hover { background: #e5e7eb; }
.manual-body {
  flex: 1; overflow-y: auto; padding: 8px 0;
  -webkit-overflow-scrolling: touch;
}
.manual-section { border-bottom: 1px solid rgba(0,0,0,0.04); }
.manual-section:last-child { border-bottom: none; }
.manual-section-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 16px 24px; border: none; background: none;
  cursor: pointer; font-size: 15px; font-weight: 700; color: #4a4a56;
  transition: background 0.2s;
}
.manual-section-btn:hover { background: rgba(0,0,0,0.02); }
.manual-section-btn.faq-btn { color: #e85d75; }
.manual-arrow { font-size: 18px; color: #ccc; transition: transform 0.2s; }
.manual-arrow.open { transform: rotate(90deg); }
.manual-content { padding: 0 24px 16px; }
.manual-item { font-size: 13px; color: #555; line-height: 1.8; margin-bottom: 6px; }
.manual-item b { color: #333; font-weight: 700; }
.manual-sub-title { font-size: 13px; font-weight: 800; color: #e85d75; margin: 12px 0 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(232,93,117,0.1); }
.manual-sub-title:first-child { margin-top: 0; }
.manual-sub { font-size: 13px; color: #777; line-height: 1.7; padding-left: 8px; margin-bottom: 4px; }
.manual-tip {
  font-size: 12px; color: #d4a853; background: rgba(212,168,83,0.06);
  padding: 10px 14px; border-radius: 10px; margin-top: 8px;
  border: 1px solid rgba(212,168,83,0.12);
}
</style>

<!-- 深色模式 -->
<style>
.dark-mode .titles-card { background: rgba(22,22,38,0.95) !important; border-color: rgba(100,100,140,0.1) !important; }
.dark-mode .titles-title { color: #d0d0e0 !important; }
.dark-mode .title-current-banner { background: rgba(212,168,83,0.08) !important; border-color: rgba(212,168,83,0.2) !important; color: #f0d48a !important; }
.dark-mode .title-current-banner.empty { background: rgba(30,30,50,0.6) !important; border-color: rgba(100,100,140,0.12) !important; color: #777 !important; }
.dark-mode .title-card { background: rgba(30,30,50,0.6) !important; border-color: rgba(100,100,140,0.12) !important; }
.dark-mode .title-card.owned { background: rgba(212,168,83,0.06) !important; border-color: rgba(212,168,83,0.2) !important; }
.dark-mode .title-card.equipped { border-color: rgba(212,168,83,0.35) !important; box-shadow: 0 0 0 2px rgba(212,168,83,0.1) !important; }
.dark-mode .title-name { color: #d0d0e0 !important; }
.dark-mode .title-desc { color: #777 !important; }
.dark-mode .title-equipped-badge { color: #fbbf24 !important; }
.dark-mode .title-locked { color: #555 !important; }
.dark-mode .title-unequip-btn { background: rgba(100,100,140,0.2) !important; color: #999 !important; }
.dark-mode .title-equip-btn { background: linear-gradient(135deg, #92400e, #b45309) !important; }
.dark-mode .title-buy-btn { background: linear-gradient(135deg, #3a3a52, #4a4a68) !important; }

/* 使用手册深色 */
.dark-mode .manual-modal { background: rgba(22,22,38,0.97) !important; }
.dark-mode .manual-header { border-bottom-color: rgba(100,100,140,0.1) !important; }
.dark-mode .manual-title { color: #d0d0e0 !important; }
.dark-mode .manual-close { background: rgba(100,100,140,0.15) !important; color: #999 !important; }
.dark-mode .manual-section { border-bottom-color: rgba(100,100,140,0.06) !important; }
.dark-mode .manual-section-btn { color: #d0d0e0 !important; }
.dark-mode .manual-section-btn:hover { background: rgba(100,100,140,0.06) !important; }
.dark-mode .manual-section-btn.faq-btn { color: #f9a8d4 !important; }
.dark-mode .manual-arrow { color: #555 !important; }
.dark-mode .manual-item { color: #aaa !important; }
.dark-mode .manual-item b { color: #d0d0e0 !important; }
.dark-mode .manual-sub { color: #777 !important; }
.dark-mode .manual-tip { color: #c8b870 !important; background: rgba(212,168,83,0.06) !important; border-color: rgba(212,168,83,0.12) !important; }
.dark-mode .manual-sub-title { color: #f9a8d4 !important; border-bottom-color: rgba(232,93,117,0.1) !important; }
</style>
