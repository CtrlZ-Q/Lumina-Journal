<template>
  <Transition name="effect-fade">
    <div v-if="show" class="effect-overlay" @click="close">
      <!-- 特效画布 -->
      <canvas ref="canvas" class="effect-canvas"></canvas>
      <!-- 中心内容 -->
      <div class="effect-center">
        <div class="effect-reward">
          <span class="reward-icon">{{ rewardIcon }}</span>
          <span class="reward-amount">+{{ reward }} 币</span>
        </div>
        <div v-if="bonusRate > 0" class="bonus-tag">
          <span class="bonus-icon">✨</span>
          <span>装备加成 +{{ bonusRate }}%</span>
        </div>
        <div class="effect-hint">点击任意位置关闭</div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  show: Boolean,
  effect: String, // 特效类型
  reward: Number,
  bonusRate: Number,
})

const emit = defineEmits(['close'])
const canvas = ref(null)
let animationId = null

const rewardIcon = ref('🪙')

function close() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  emit('close')
}

// 特效动画
const effects = {
  confetti(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6)
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.rotation += p.vr
      if (p.y > h + 20) { p.y = -20; p.vy = 2 }
    }
  },
  fireworks(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life -= 0.01
      p.size *= 0.99
      if (p.life <= 0) {
        p.x = w / 2 + (Math.random() - 0.5) * w * 0.5
        p.y = h * 0.8
        p.vx = (Math.random() - 0.5) * 8
        p.vy = -Math.random() * 12 - 5
        p.life = 1
        p.size = Math.random() * 3 + 1
      }
    }
  },
  bubble(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = p.color.replace(')', ',0.1)').replace('rgb', 'rgba')
      ctx.fill()
      p.x += Math.sin(p.angle) * 1.5
      p.y -= p.speed
      p.angle += 0.03
      if (p.y < -p.size * 2) {
        p.y = h + p.size * 2
        p.x = Math.random() * w
      }
    }
  },
  sakura(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      p.x += p.vx + Math.sin(p.angle) * 2
      p.y += p.vy
      p.rotation += p.vr
      p.angle += 0.02
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w }
    }
  },
  snow(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
      ctx.fill()
      p.x += Math.sin(p.angle) * 1
      p.y += p.speed
      p.angle += 0.01
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w }
    }
  },
  lightning(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, w, h)
    if (Math.random() < 0.15) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(0, 0, w, h)
    }
    for (const p of particles) {
      if (p.life > 0) {
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.width
        ctx.shadowColor = p.color
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.moveTo(p.x, 0)
        for (let i = 0; i < 8; i++) {
          p.x += (Math.random() - 0.5) * 60
          ctx.lineTo(p.x, (h / 8) * (i + 1))
        }
        ctx.stroke()
        ctx.shadowBlur = 0
        p.life -= 0.02
      }
      if (p.life <= 0 && Math.random() < 0.08) {
        p.x = Math.random() * w
        p.life = 1
        p.width = Math.random() * 3 + 1
      }
    }
  },
  butterfly(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      // 蝴蝶翅膀
      const wing = Math.sin(p.wingAngle) * 0.5 + 0.5
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(-p.size * wing, 0, p.size * 1.2, p.size * 0.8, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(p.size * wing, 0, p.size * 1.2, p.size * 0.8, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      p.x += p.vx + Math.sin(p.angle) * 2
      p.y += Math.sin(p.angle * 0.7) * 1.5
      p.wingAngle += 0.15
      p.angle += 0.02
      if (p.x > w + 30) { p.x = -30; p.y = Math.random() * h }
    }
  },
  stars(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 15
      // 五角星
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const r = p.size
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
      }
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.vr
      p.opacity -= 0.003
      if (p.opacity <= 0) {
        p.x = Math.random() * w
        p.y = Math.random() * h
        p.opacity = 1
      }
    }
  },
  rainbow(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    const colors = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff', '#8800ff']
    for (let i = 0; i < colors.length; i++) {
      ctx.beginPath()
      ctx.arc(w / 2, h * 0.8, 200 - i * 25, Math.PI, 0)
      ctx.strokeStyle = colors[i]
      ctx.lineWidth = 20
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 500 + i) * 0.3
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // 彩虹粒子
    for (const p of particles) {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fillRect(p.x, p.y, p.size, p.size)
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      if (p.y > h) { p.y = -10; p.x = Math.random() * w }
    }
  },
  fire(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    // 火焰渐变背景
    const grad = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.8)
    grad.addColorStop(0, 'rgba(255,100,0,0.15)')
    grad.addColorStop(1, 'rgba(255,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fill()
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += p.vy
      p.size *= 0.995
      p.opacity -= 0.008
      if (p.opacity <= 0 || p.size < 0.5) {
        p.x = w / 2 + (Math.random() - 0.5) * w * 0.4
        p.y = h * 0.85 + Math.random() * 50
        p.vx = (Math.random() - 0.5) * 3
        p.vy = -Math.random() * 5 - 2
        p.size = Math.random() * 8 + 4
        p.opacity = 1
      }
    }
  },
  comet(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,10,0.1)'
    ctx.fillRect(0, 0, w, h)
    for (const p of particles) {
      // 彗星尾巴
      for (let t = 0; t < 15; t++) {
        const tx = p.x - p.vx * t * 2
        const ty = p.y - p.vy * t * 2
        ctx.beginPath()
        ctx.arc(tx, ty, p.size * (1 - t / 15), 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = (1 - t / 15) * 0.5
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // 彗星头部
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = p.color
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.shadowBlur = 0
      p.x += p.vx
      p.y += p.vy
      if (p.x > w + 50 || p.x < -50 || p.y > h + 50 || p.y < -50) {
        p.x = -30
        p.y = Math.random() * h * 0.5
        p.vx = Math.random() * 8 + 5
        p.vy = Math.random() * 3 - 1
      }
    }
  },
  aurora(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    // 极光波浪
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(0, h * 0.3 + i * 30)
      for (let x = 0; x < w; x += 5) {
        const y = h * 0.3 + i * 30 + Math.sin(x / 100 + Date.now() / 1000 + i) * 40
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      const colors = ['#00ff88', '#00ffcc', '#00ccff', '#8800ff', '#ff00cc']
      ctx.fillStyle = colors[i]
      ctx.globalAlpha = 0.08
      ctx.fill()
    }
    ctx.globalAlpha = 1
    // 极光粒子
    for (const p of particles) {
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fillRect(p.x, p.y, p.size, p.size * 3)
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += Math.sin(p.angle) * 0.5
      p.angle += 0.02
      p.opacity -= 0.002
      if (p.opacity <= 0) {
        p.x = Math.random() * w
        p.y = Math.random() * h * 0.5
        p.opacity = 0.8
      }
    }
  },
  explosion(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, 0, w, h)
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.life
      ctx.fill()
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life -= 0.015
      if (p.life <= 0) {
        p.x = w / 2 + (Math.random() - 0.5) * 100
        p.y = h / 2 + (Math.random() - 0.5) * 100
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 10 + 3
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed
        p.life = 1
        p.size = Math.random() * 4 + 2
      }
    }
  },
  galaxy(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(0,0,20,0.15)'
    ctx.fillRect(0, 0, w, h)
    for (const p of particles) {
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(p.angle)
      ctx.translate(p.orbit, 0)
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()
      p.angle += p.speed
      p.orbit += p.orbitSpeed
      if (p.orbit > Math.max(w, h) * 0.6) {
        p.orbit = Math.random() * 50
        p.angle = Math.random() * Math.PI * 2
      }
    }
  },
  magic_circle(ctx, w, h, particles) {
    ctx.clearRect(0, 0, w, h)
    const time = Date.now() / 1000
    // 魔法阵圆环
    ctx.strokeStyle = '#a855f7'
    ctx.lineWidth = 3
    ctx.shadowColor = '#a855f7'
    ctx.shadowBlur = 20
    // 外圈
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 150 + Math.sin(time) * 10, 0, Math.PI * 2)
    ctx.stroke()
    // 内圈
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 100 + Math.cos(time * 1.5) * 8, 0, Math.PI * 2)
    ctx.stroke()
    // 符文线
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time * 0.5
      ctx.beginPath()
      ctx.moveTo(w / 2 + Math.cos(angle) * 100, h / 2 + Math.sin(angle) * 100)
      ctx.lineTo(w / 2 + Math.cos(angle) * 150, h / 2 + Math.sin(angle) * 150)
      ctx.stroke()
    }
    ctx.shadowBlur = 0
    // 魔法粒子
    for (const p of particles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.opacity
      ctx.fill()
      ctx.globalAlpha = 1
      p.x += p.vx
      p.y += p.vy
      p.opacity -= 0.005
      if (p.opacity <= 0) {
        const angle = Math.random() * Math.PI * 2
        const r = Math.random() * 150
        p.x = w / 2 + Math.cos(angle) * r
        p.y = h / 2 + Math.sin(angle) * r
        p.vx = (Math.random() - 0.5) * 2
        p.vy = (Math.random() - 0.5) * 2
        p.opacity = 0.8
      }
    }
  },
}

function createParticles(effectType, w, h) {
  const count = 80
  const particles = []
  const colors = {
    confetti: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
    fireworks: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff', '#ff00ff'],
    bubble: ['rgba(100,200,255,0.6)', 'rgba(255,100,200,0.6)', 'rgba(100,255,100,0.6)'],
    sakura: ['#ffb7c5', '#ff69b4', '#ffc0cb', '#ff8fab'],
    snow: ['#ffffff', '#e8f0ff', '#d0e0ff'],
    lightning: ['#aaaaff', '#8888ff', '#ffffff'],
    butterfly: ['#ff69b4', '#da70d6', '#ba55d3', '#9370db', '#8a2be2'],
    stars: ['#ffd700', '#ffec8b', '#fff68f', '#ffe4b5'],
    rainbow: ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0077ff', '#8800ff'],
    fire: ['#ff4500', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00'],
    comet: ['#00bfff', '#87cefa', '#add8e6'],
    aurora: ['#00ff88', '#00ffcc', '#00ccff', '#8800ff', '#ff00cc'],
    explosion: ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffff00'],
    galaxy: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
    magic_circle: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
  }
  const effectColors = colors[effectType] || colors.confetti

  for (let i = 0; i < count; i++) {
    const base = {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 6 + 2,
      color: effectColors[Math.floor(Math.random() * effectColors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1,
      opacity: 1,
      life: 1,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
    }

    switch (effectType) {
      case 'confetti':
        base.vy = Math.random() * 3 + 2
        base.rotation = 0
        base.vr = (Math.random() - 0.5) * 0.2
        break
      case 'fireworks':
        base.x = w / 2 + (Math.random() - 0.5) * w * 0.5
        base.y = h * 0.8
        base.vx = (Math.random() - 0.5) * 8
        base.vy = -Math.random() * 12 - 5
        break
      case 'bubble':
        base.speed = Math.random() * 2 + 1
        base.size = Math.random() * 15 + 5
        break
      case 'sakura':
        base.rotation = Math.random() * Math.PI * 2
        base.vr = (Math.random() - 0.5) * 0.1
        base.vy = Math.random() * 2 + 1
        break
      case 'lightning':
        base.life = 0
        base.width = Math.random() * 3 + 1
        break
      case 'butterfly':
        base.wingAngle = Math.random() * Math.PI
        base.rotation = (Math.random() - 0.5) * 0.3
        base.size = Math.random() * 8 + 5
        break
      case 'stars':
        base.rotation = Math.random() * Math.PI * 2
        base.vr = (Math.random() - 0.5) * 0.05
        base.size = Math.random() * 8 + 4
        break
      case 'rainbow':
        base.vy = Math.random() * -3
        base.size = Math.random() * 4 + 2
        break
      case 'fire':
        base.size = Math.random() * 8 + 4
        base.vy = -Math.random() * 5 - 2
        break
      case 'comet':
        base.x = -30
        base.y = Math.random() * h * 0.5
        base.vx = Math.random() * 8 + 5
        base.vy = Math.random() * 3 - 1
        base.size = Math.random() * 4 + 3
        break
      case 'aurora':
        base.y = Math.random() * h * 0.5
        base.size = Math.random() * 3 + 1
        break
      case 'explosion':
        base.x = w / 2 + (Math.random() - 0.5) * 100
        base.y = h / 2 + (Math.random() - 0.5) * 100
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 10 + 3
        base.vx = Math.cos(angle) * speed
        base.vy = Math.sin(angle) * speed
        base.size = Math.random() * 4 + 2
        break
      case 'galaxy':
        base.orbit = Math.random() * 200
        base.speed = (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1)
        base.orbitSpeed = Math.random() * 0.3 + 0.1
        base.size = Math.random() * 3 + 1
        break
      case 'magic_circle':
        const mAngle = Math.random() * Math.PI * 2
        const mR = Math.random() * 150
        base.x = w / 2 + Math.cos(mAngle) * mR
        base.y = h / 2 + Math.sin(mAngle) * mR
        base.size = Math.random() * 3 + 1
        break
    }
    particles.push(base)
  }
  return particles
}

function startAnimation() {
  if (!canvas.value || !props.effect) return
  const c = canvas.value
  const ctx = c.getContext('2d')
  c.width = window.innerWidth
  c.height = window.innerHeight

  const effectType = props.effect
  const effectFn = effects[effectType]
  if (!effectFn) return

  const particles = createParticles(effectType, c.width, c.height)

  function animate() {
    effectFn(ctx, c.width, c.height, particles)
    animationId = requestAnimationFrame(animate)
  }
  animate()
}

watch(() => props.show, async (val) => {
  if (val) {
    await nextTick()
    startAnimation()
  } else {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})
</script>

<style scoped>
.effect-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
}
.effect-canvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
.effect-center {
  position: relative;
  z-index: 1;
  text-align: center;
  pointer-events: none;
}
.effect-reward {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: reward-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.reward-icon {
  font-size: 64px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}
.reward-amount {
  font-size: 36px;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.5);
  letter-spacing: 2px;
}
.bonus-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 8px 20px;
  background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2));
  border: 1px solid rgba(255,215,0,0.4);
  border-radius: 20px;
  color: #ffd700;
  font-size: 16px;
  font-weight: 700;
  animation: bonus-slide 0.8s ease-out 0.3s both;
}
.bonus-icon {
  font-size: 18px;
}
.effect-hint {
  margin-top: 40px;
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  animation: hint-fade 1s ease-out 1s both;
}

@keyframes reward-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes bonus-slide {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes hint-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.effect-fade-enter-active { transition: opacity 0.3s ease; }
.effect-fade-leave-active { transition: opacity 0.5s ease; }
.effect-fade-enter-from, .effect-fade-leave-to { opacity: 0; }

/* 深色模式 */
:deep(.dark-mode) .effect-overlay {
  background: rgba(0,0,0,0.6);
}
</style>
