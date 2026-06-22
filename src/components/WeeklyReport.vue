<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '../stores/game'
import { useShopStore } from '../stores/shop'

const store = useGameStore()
const shop = useShopStore()
const emit = defineEmits(['close'])
const canvasRef = ref(null)

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getWeekDates() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(dateStr(d))
  }
  return dates
}

function drawCard() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 400, H = 560
  canvas.width = W
  canvas.height = H

  // 获取装备的相框 — 完整样式数据
  const frame = shop.activeFrame
  const fd = frame?.data || {}
  const frameColor = fd.color || '#ff6b8a'
  const frameWidth = fd.width || 0
  const frameStyle = fd.style || 'solid'
  const frameBg = fd.bg || '#ffffff'
  const titleColor = fd.titleColor || '#ff6b8a'
  const textColor = fd.textColor || '#333'
  const statDotColors = fd.statDotColors || ['#ff6b8a','#ffa07a','#f5c842','#10b981']
  const progressColors = fd.progressColors || ['#ff6b8a','#ffa07a']
  const weekDotColor = fd.weekDotColor || '#ff6b8a'
  const sloganColor = fd.sloganColor || '#bbb'
  const dividerColor = fd.dividerColor || '#f0f0f0'

  // background
  ctx.fillStyle = frameBg
  roundRect(ctx, 0, 0, W, H, 20)
  ctx.fill()

  // 相框边框
  if (frame && frameWidth > 0) {
    ctx.save()
    ctx.strokeStyle = frameColor
    if (frameStyle === 'dashed') {
      ctx.lineWidth = frameWidth * 2
      ctx.setLineDash([8, 4])
      roundRect(ctx, frameWidth, frameWidth, W - frameWidth * 2, H - frameWidth * 2, 16)
      ctx.stroke()
      ctx.setLineDash([])
    } else if (frameStyle === 'double') {
      ctx.lineWidth = frameWidth
      roundRect(ctx, frameWidth, frameWidth, W - frameWidth * 2, H - frameWidth * 2, 16)
      ctx.stroke()
      ctx.lineWidth = frameWidth
      const inner = frameWidth * 3
      roundRect(ctx, inner, inner, W - inner * 2, H - inner * 2, 12)
      ctx.stroke()
    } else {
      ctx.lineWidth = frameWidth * 2
      roundRect(ctx, frameWidth, frameWidth, W - frameWidth * 2, H - frameWidth * 2, 16)
      ctx.stroke()
    }
    ctx.restore()
  }

  // top gradient bar
  const barH = 8
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, progressColors[0])
  grad.addColorStop(1, progressColors[1] || progressColors[0])
  ctx.fillStyle = grad
  roundRectTop(ctx, 0, 0, W, barH, 20)
  ctx.fill()

  // app name
  ctx.fillStyle = titleColor
  ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('\u{1F305} 逐光手帐', W / 2, 48)

  // title
  ctx.fillStyle = textColor
  ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('打卡周报', W / 2, 80)

  // date range
  const weekDates = getWeekDates()
  const start = weekDates[0].slice(5).replace('-', '/')
  const end = weekDates[6].slice(5).replace('-', '/')
  ctx.fillStyle = sloganColor
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(start + ' — ' + end, W / 2, 104)

  // divider
  ctx.strokeStyle = dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(30, 120)
  ctx.lineTo(W - 30, 120)
  ctx.stroke()

  // stats
  const checkedCount = weekDates.filter(d => store.checkins.includes(d)).length
  const coinsEst = checkedCount * 15
  const rate = checkedCount / 7
  const streak = store.streakDays

  const stats = [
    { label: '连续打卡', value: streak + ' 天', dot: statDotColors[0] },
    { label: '本周打卡', value: checkedCount + ' 天', dot: statDotColors[1] },
    { label: '本周金币', value: coinsEst + ' 币', dot: statDotColors[2] },
    { label: '打卡率', value: Math.round(rate * 100) + '%', dot: statDotColors[3] },
  ]

  ctx.textAlign = 'left'
  ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  stats.forEach((s, i) => {
    const y = 158 + i * 42
    ctx.fillStyle = s.dot
    ctx.beginPath()
    ctx.arc(50, y - 4, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = fd.textColor ? (textColor === '#333' ? '#666' : textColor + 'cc') : '#666'
    ctx.fillText(s.label, 68, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = textColor
    ctx.font = 'bold 15px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(s.value, W - 40, y)
    ctx.textAlign = 'left'
    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  })

  // progress bar
  const barY = 340
  const barLeft = 40
  const barWidth = W - 80
  const barHeight = 18
  ctx.fillStyle = frameBg === '#ffffff' ? '#f5f5f5' : (frameBg + '80')
  roundRect(ctx, barLeft, barY, barWidth, barHeight, 9)
  ctx.fill()
  if (rate > 0) {
    const pw = Math.max(barHeight, barWidth * rate)
    const fg = ctx.createLinearGradient(barLeft, 0, barLeft + pw, 0)
    fg.addColorStop(0, progressColors[0])
    fg.addColorStop(1, progressColors[1] || progressColors[0])
    ctx.fillStyle = fg
    roundRect(ctx, barLeft, barY, pw, barHeight, 9)
    ctx.fill()
  }
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  var pctText = Math.round(rate * 100) + '%'
  ctx.fillText(pctText, barLeft + Math.max(barHeight, barWidth * rate) / 2, barY + 13)

  // completion label
  ctx.fillStyle = sloganColor
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('完成率', W / 2, barY + barHeight + 22)

  // bottom section
  var slogY = 420
  ctx.strokeStyle = dividerColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, slogY)
  ctx.lineTo(W - 80, slogY)
  ctx.stroke()

  // week dots
  var dotY = slogY + 32
  var dotSpacing = (W - 120) / 6
  weekDates.forEach((d, i) => {
    var cx = 60 + i * dotSpacing
    var checked = store.checkins.includes(d)
    ctx.fillStyle = checked ? weekDotColor : (frameBg === '#ffffff' ? '#e5e5e5' : '#555')
    ctx.beginPath()
    ctx.arc(cx, dotY, 5, 0, Math.PI * 2)
    ctx.fill()
    if (checked) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('✓', cx, dotY + 3)
    }
  })

  // slogan
  ctx.textAlign = 'center'
  ctx.fillStyle = sloganColor
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('逐光手帐 · 让坚持可见', W / 2, dotY + 40)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function roundRectTop(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function download() {
  const canvas = canvasRef.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = '逐光手帐_周报.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

onMounted(() => { drawCard() })
</script>

<template>
  <Teleport to="body">
    <Transition name="wr-modal">
      <div class="wr-mask" @click="emit('close')">
        <div class="wr-box" @click.stop>
          <canvas ref="canvasRef" class="wr-canvas"></canvas>
          <button class="wr-save" @click="download">💾 保存图片</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wr-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.wr-box {
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}
.wr-canvas {
  border-radius: 24px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  max-width: 90vw;
}
.wr-save {
  padding: 14px 36px;
  border: none; border-radius: 28px;
  font-size: 15px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #ff6b8a, #ffa07a);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255,107,138,0.3);
  transition: all 0.3s;
  letter-spacing: 0.5px;
}
.wr-save:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,107,138,0.4); }

.wr-modal-enter-active { animation: wr-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.wr-modal-leave-active { animation: wr-in 0.25s ease reverse; }
@keyframes wr-in {
  from { opacity: 0; transform: scale(0.9) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
