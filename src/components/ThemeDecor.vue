<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({ animation: String })

// Generate random values once per mount
const rand = (min, max) => Math.random() * (max - min) + min

const particles = ref([])

// 粒子集中在左右两侧，避开中间内容区
function sideLeft() {
  return Math.random() < 0.5 ? rand(0, 28) : rand(72, 100)
}

function generateParticles(type, count) {
  const arr = []
  for (let i = 0; i < count; i++) {
    arr.push({
      left: sideLeft() + '%',
      delay: rand(0, 6) + 's',
      duration: rand(4, 10) + 's',
      size: rand(8, 22) + 'px',
      startX: rand(-30, 30) + 'px',
      sway: rand(20, 60) + 'px',
      rotate: rand(0, 360) + 'deg',
      opacity: rand(0.4, 0.9),
    })
  }
  return arr
}

// 每隔几秒重生成粒子，制造随机感
const seed = ref(0)
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    particles.value = [] // 清空缓存，下次 getP 会重新生成
    seed.value++
  }, 5000 + Math.random() * 4000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

watch(() => props.animation, () => {
  particles.value = []
}, { immediate: true })

function getP(type, count) {
  void seed.value // 触发重算
  if (particles.value.length === 0) {
    particles.value = generateParticles(type, count)
  }
  return particles.value
}
</script>

<template>
  <div v-if="animation" class="theme-decor">
    <!-- 极光流光 -->
    <template v-if="animation === 'flowing_light' || animation === 'aurora'">
      <div class="flow-light fl1"></div>
      <div class="flow-light fl2"></div>
      <div class="flow-light fl3"></div>
    </template>

    <!-- 闪烁星星 -->
    <template v-else-if="animation === 'stars'">
      <div v-for="(p, i) in getP('stars', 30)" :key="i" class="star" :style="{ left: p.left, top: rand(0,100)+'%', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway }"></div>
    </template>

    <!-- 飘落花瓣 -->
    <template v-else-if="animation === 'petals'">
      <div v-for="(p, i) in getP('petals', 18)" :key="i" class="petal"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway, '--start-rot': p.rotate }"></div>
    </template>

    <!-- 波浪 -->
    <template v-else-if="animation === 'waves'">
      <div class="wave w1"></div>
      <div class="wave w2"></div>
      <div class="wave w3"></div>
      <div class="wave w4"></div>
      <div class="wave w5"></div>
    </template>

    <!-- 飘落树叶 -->
    <template v-else-if="animation === 'leaves'">
      <div v-for="(p, i) in getP('leaves', 12)" :key="i" class="leaf"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway, '--start-rot': p.rotate }"></div>
    </template>

    <!-- 飘落雪花 -->
    <template v-else-if="animation === 'snow'">
      <div v-for="(p, i) in getP('snow', 28)" :key="i" class="snowflake"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size, '--sway': p.sway }"></div>
    </template>

    <!-- 火焰 -->
    <template v-else-if="animation === 'fire'">
      <div class="fire-glow fg1"></div>
      <div class="fire-glow fg2"></div>
      <div class="fire-glow fg3"></div>
    </template>

    <!-- 气泡 -->
    <template v-else-if="animation === 'bubbles' || animation === 'bubble'">
      <div v-for="(p, i) in getP('bubbles', 14)" :key="i" class="bubble"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: (parseFloat(p.duration)*1.3)+'s', width: (8+Math.random()*16)+'px', height: (8+Math.random()*16)+'px', '--sway': p.sway }"></div>
    </template>

    <!-- 闪光粒子 -->
    <template v-else-if="animation === 'sparkle'">
      <div v-for="(p, i) in getP('sparkle', 22)" :key="i" class="sparkle-dot" :style="{ left: p.left, top: rand(0,100)+'%', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway }"></div>
    </template>

    <!-- 彩纸 -->
    <template v-else-if="animation === 'confetti'">
      <div v-for="(p, i) in getP('confetti', 14)" :key="i" class="confetti-piece"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, background: ['#ff6b8a','#ffd700','#4ecdc4','#a066d9','#ff9f43','#45b7d1'][i%6], '--sway': p.sway }"></div>
    </template>

    <!-- 萤火虫 -->
    <template v-else-if="animation === 'fireflies' || animation === 'firefly'">
      <div v-for="(p, i) in getP('fireflies', 15)" :key="i" class="firefly"
        :style="{ left: p.left, top: rand(0,100)+'%', animationDelay: p.delay, animationDuration: p.duration }"></div>
    </template>

    <!-- 霓虹/赛博 -->
    <template v-else-if="animation === 'neon'">
      <div class="neon-line nl1"></div>
      <div class="neon-line nl2"></div>
      <div class="neon-line nl3"></div>
      <div class="neon-line nl4"></div>
      <div class="neon-line nl5"></div>
      <div class="cyber-grid"></div>
      <div v-for="(p, i) in getP('sparkle', 10)" :key="i" class="cyber-dot"
        :style="{ left: p.left, top: rand(0,100)+'%', animationDelay: p.delay, animationDuration: p.duration }"></div>
    </template>

    <!-- 光晕 -->
    <template v-else-if="animation === 'glow'">
      <div class="glow-orb go1"></div>
      <div class="glow-orb go2"></div>
    </template>

    <!-- 闪电 -->
    <template v-else-if="animation === 'lightning'">
      <div class="lightning-bolt lb1"></div>
      <div class="lightning-bolt lb2"></div>
      <div class="storm-glow"></div>
    </template>

    <!-- 暗脉冲（星空黑/极夜） -->
    <template v-else-if="animation === 'dark_pulse'">
      <div class="dark-pulse dp1"></div>
      <div class="dark-pulse dp2"></div>
      <div v-for="(p, i) in getP('dark_pulse', 18)" :key="i" class="dim-star" :style="{ left: p.left, top: rand(0,100)+'%', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway }"></div>
      <div class="meteor-streak m1"></div>
      <div class="meteor-streak m2"></div>
      <div class="meteor-streak m3"></div>
    </template>

    <!-- 日出 -->
    <template v-else-if="animation === 'sunrise'">
      <div class="sun-glow"></div>
      <div class="sun-ray sr1"></div>
      <div class="sun-ray sr2"></div>
      <div class="sun-ray sr3"></div>
    </template>

    <!-- 流沙 -->
    <template v-else-if="animation === 'sand'">
      <div v-for="(p, i) in getP('sand', 10)" :key="i" class="sand-particle"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway }"></div>
    </template>

    <!-- 银河旋转 -->
    <template v-else-if="animation === 'galaxy_spin'">
      <div class="nebula-glow ng1"></div>
      <div class="nebula-glow ng2"></div>
      <div class="galaxy-ring gr1"></div>
      <div class="galaxy-ring gr2"></div>
      <div v-for="(p, i) in getP('galaxy', 22)" :key="i" class="drift-star" :style="{ left: p.left, top: rand(0,100)+'%', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, '--tx': p.startX, '--sway': p.sway }"></div>
    </template>

    <!-- 蝴蝶飞舞 -->
    <template v-else-if="animation === 'butterfly'">
      <div v-for="(p, i) in getP('butterfly', 8)" :key="i" class="butterfly-float"
        :style="{ left: p.left, top: rand(10,80)+'%', animationDelay: p.delay, animationDuration: (parseFloat(p.duration)*1.5)+'s', '--sway': p.sway }">🦋</div>
    </template>

    <!-- 彗星划过 -->
    <template v-else-if="animation === 'comet'">
      <div class="comet-trail" style="top: 10%; left: -5%;"></div>
      <div class="comet-trail" style="top: 40%; left: 10%; animation-delay: 4s;"></div>
    </template>

    <!-- 烟花/爆炸 -->
    <template v-else-if="animation === 'fireworks' || animation === 'explosion'">
      <div v-for="(p, i) in getP('fireworks', 14)" :key="i" class="firework-burst"
        :style="{ left: p.left, top: p.left, animationDelay: p.delay, animationDuration: p.duration }"></div>
    </template>

    <!-- 银河（别名） -->
    <template v-else-if="animation === 'galaxy'">
      <div class="nebula-glow ng1"></div>
      <div class="nebula-glow ng2"></div>
      <div class="galaxy-ring gr1"></div>
      <div class="galaxy-ring gr2"></div>
      <div v-for="(p, i) in getP('galaxy', 22)" :key="i" class="drift-star" :style="{ left: p.left, top: rand(0,100)+'%', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration, '--tx': p.startX, '--sway': p.sway }"></div>
    </template>

    <!-- 魔法阵 -->
    <template v-else-if="animation === 'magic_circle'">
      <div class="magic-ring mr1"></div>
      <div class="magic-ring mr2"></div>
      <div v-for="(p, i) in getP('magic', 24)" :key="i" class="sparkle-dot"
        :style="{ left: p.left, top: rand(0,100)+'%', animationDelay: p.delay, animationDuration: p.duration, background: '#a855f7', boxShadow: '0 0 8px #a855f7' }"></div>
    </template>

    <!-- 彩虹拱门 -->
    <template v-else-if="animation === 'rainbow'">
      <div v-for="(c, i) in ['#ff0000','#ff7700','#ffff00','#00ff00','#0077ff','#8800ff']" :key="i" class="rainbow-band"
        :style="{ borderColor: c+'40', width: (260-i*25)+'px', height: (130-i*12)+'px', animationDelay: (i*0.15)+'s' }"></div>
    </template>

    <!-- 樱花飘落（别名） -->
    <template v-else-if="animation === 'sakura'">
      <div v-for="(p, i) in getP('sakura', 12)" :key="i" class="petal"
        :style="{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--sway': p.sway, '--start-rot': p.rotate, background: 'radial-gradient(ellipse, rgba(255,183,197,0.95), rgba(255,105,180,0.25))' }"></div>
    </template>

    <!-- 星尘爆（别名） -->
    <template v-else-if="animation === 'stardust'">
      <div v-for="(p, i) in getP('stardust', 14)" :key="i" class="sparkle-dot"
        :style="{ left: p.left, top: rand(0,100)+'%', animationDelay: p.delay, animationDuration: (parseFloat(p.duration)*0.7)+'s', background: '#ffd700', boxShadow: '0 0 8px #ffd700' }"></div>
    </template>

    <!-- 独角兽彩虹 -->
    <template v-else-if="animation === 'unicorn'">
      <div v-for="(c, i) in ['#f9a8d4','#c4b5fd','#93c5fd','#86efac','#fde68a']" :key="'rb'+i" class="rainbow-band"
        :style="{ borderColor: c+'35', width: (280-i*30)+'px', height: (140-i*15)+'px', animationDelay: (i*0.12)+'s' }"></div>
      <div v-for="(p, i) in getP('unicorn', 10)" :key="'sp'+i" class="sparkle-dot"
        :style="{ left: p.left, top: rand(0,100)+'%', animationDelay: p.delay, animationDuration: p.duration, background: ['#f9a8d4','#c4b5fd','#93c5fd','#86efac','#fde68a'][i%5] }"></div>
    </template>
  </div>
</template>

<style scoped>
.theme-decor {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

/* ===== 流光/极光 ===== */
.flow-light {
  position: absolute;
  width: 300%; height: 25%;
  left: -100%;
  filter: blur(60px);
  animation: flow-drift 10s ease-in-out infinite alternate;
}
.fl1 { top: 0%; left: -80%; width: 200%; background: linear-gradient(90deg, transparent 15%, rgba(100,255,200,0.25) 35%, rgba(100,200,255,0.25) 55%, transparent 85%); }
.fl2 { top: 15%; left: -80%; width: 200%; background: linear-gradient(90deg, transparent 15%, rgba(180,100,255,0.22) 40%, rgba(100,255,200,0.25) 65%, transparent 85%); animation-delay: -4s; animation-duration: 14s; }
.fl3 { top: 30%; left: -80%; width: 200%; background: linear-gradient(90deg, transparent 15%, rgba(100,200,255,0.25) 30%, rgba(255,100,200,0.3) 60%, transparent 85%); animation-delay: -7s; animation-duration: 12s; }
@keyframes flow-drift {
  0% { transform: translateX(-10%) scaleY(1); }
  100% { transform: translateX(10%) scaleY(1.5); }
}

/* ===== 星星 ===== */
.star { position: absolute; background: #fff; border-radius: 50%; box-shadow: 0 0 7px rgba(255,255,255,0.8); animation: twinkle 2s ease-in-out infinite alternate; }
@keyframes twinkle {
  0% { opacity: 0.55; transform: scale(0.5) translate(0, 0); }
  40% { opacity: 1; transform: scale(1.3) translate(var(--sway, 5px), calc(var(--sway, 5px) * -0.7)); }
  70% { opacity: 0.5; transform: scale(0.8) translate(calc(var(--sway, 5px) * -0.5), var(--sway, 5px)); }
  100% { opacity: 0.55; transform: scale(0.5) translate(0, 0); }
}

/* ===== 花瓣（随机角度/速度） ===== */
.petal {
  position: absolute;
  top: -30px;
  width: 14px; height: 14px;
  background: radial-gradient(ellipse, rgba(255,182,193,0.9), rgba(255,105,180,0.28));
  border-radius: 50% 0 50% 50%;
  animation: fall-petal var(--dur, 7s) linear infinite;
  --sway: 40px;
  --start-rot: 0deg;
}
@keyframes fall-petal {
  0% { transform: translateY(-30px) rotate(var(--start-rot)) translateX(0); opacity: 0; }
  8% { opacity: 0.45; }
  25% { transform: translateY(25vh) rotate(calc(var(--start-rot) + 90deg)) translateX(var(--sway)); }
  50% { transform: translateY(50vh) rotate(calc(var(--start-rot) + 180deg)) translateX(calc(var(--sway) * -0.5)); }
  75% { transform: translateY(75vh) rotate(calc(var(--start-rot) + 270deg)) translateX(var(--sway)); }
  90% { opacity: 0.38; }
  100% { transform: translateY(105vh) rotate(calc(var(--start-rot) + 360deg)) translateX(calc(var(--sway) * -0.3)); opacity: 0; }
}

/* ===== 波浪 ===== */
.wave {
  position: absolute;
  bottom: 0; left: -5%;
  width: 45%; height: 150px;
  border-radius: 50% 50% 0 0;
  animation: wave-move 6s ease-in-out infinite;
}
.w1 { background: linear-gradient(180deg, transparent, rgba(120,180,212,0.25)); }
.w2 { height: 100px; background: linear-gradient(180deg, transparent, rgba(120,180,212,0.25)); animation-delay: -2s; bottom: -15px; }
.w3 { height: 200px; background: linear-gradient(180deg, transparent, rgba(120,180,212,0.32)); animation-delay: -4s; bottom: -30px; }
.w4 { left: auto; right: -5%; background: linear-gradient(180deg, transparent, rgba(120,180,212,0.32)); animation-delay: -1s; }
.w5 { left: auto; right: -5%; height: 120px; background: linear-gradient(180deg, transparent, rgba(120,180,212,0.22)); animation-delay: -3s; bottom: -20px; }
@keyframes wave-move {
  0%, 100% { transform: translateX(-4%); }
  50% { transform: translateX(4%); }
}

/* ===== 树叶 ===== */
.leaf {
  position: absolute;
  top: -30px;
  width: 18px; height: 12px;
  background: rgba(120,184,154,0.6);
  border-radius: 0 50% 50% 50%;
  animation: fall-leaf var(--dur, 8s) linear infinite;
  --sway: 30px;
  --start-rot: 0deg;
}
@keyframes fall-leaf {
  0% { transform: translateY(-30px) rotate(var(--start-rot)) translateX(0); opacity: 0; }
  8% { opacity: 0.6; }
  25% { transform: translateY(25vh) rotate(calc(var(--start-rot) + 90deg)) translateX(var(--sway)); }
  50% { transform: translateY(50vh) rotate(calc(var(--start-rot) + 180deg)) translateX(calc(var(--sway) * -0.7)); }
  75% { transform: translateY(75vh) rotate(calc(var(--start-rot) + 270deg)) translateX(var(--sway)); }
  90% { opacity: 0.55; }
  100% { transform: translateY(105vh) rotate(calc(var(--start-rot) + 360deg)) translateX(0); opacity: 0; }
}

/* ===== 雪花 ===== */
.snowflake {
  position: absolute;
  top: -10px;
  background: rgba(255,255,255,0.85);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255,255,255,0.25);
  animation: fall-snow var(--dur, 6s) linear infinite;
  --sway: 20px;
}
@keyframes fall-snow {
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  8% { opacity: 0.9; }
  25% { transform: translateY(25vh) translateX(var(--sway)); }
  50% { transform: translateY(50vh) translateX(calc(var(--sway) * -0.5)); }
  75% { transform: translateY(75vh) translateX(var(--sway)); }
  90% { opacity: 0.38; }
  100% { transform: translateY(105vh) translateX(calc(var(--sway) * -0.3)); opacity: 0; }
}

/* ===== 火焰 ===== */
.fire-glow {
  position: absolute;
  bottom: -10%;
  border-radius: 50%;
  filter: blur(70px);
  animation: fire-pulse 3s ease-in-out infinite alternate;
}
.fg1 { left: 3%; width: 300px; height: 300px; background: rgba(255,80,0,0.22); }
.fg2 { right: 3%; width: 250px; height: 250px; background: rgba(255,180,0,0.25); animation-delay: -1.5s; }
.fg3 { right: 5%; left: auto; width: 220px; height: 220px; background: rgba(255,50,0,0.32); animation-delay: -0.8s; bottom: 0; }
@keyframes fire-pulse {
  0% { transform: scale(1) translateY(0); opacity: 0.45; }
  100% { transform: scale(1.25) translateY(-20px); opacity: 1; }
}

/* ===== 气泡 ===== */
.bubble {
  position: absolute;
  top: 20%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,180,200,0.85) 0%, rgba(255,150,180,0.4) 50%, transparent 100%);
  box-shadow: 0 0 12px rgba(255,180,200,0.5), 0 0 24px rgba(255,150,180,0.2);
  animation: soft-float 8s ease-in-out infinite;
  --sway: 12px;
}
@keyframes soft-float {
  0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }
  15%  { opacity: 0.7; transform: translate(var(--sway), -6vh) scale(1); }
  35%  { opacity: 0.6; transform: translate(calc(var(--sway) * -0.4), -15vh) scale(1.1); }
  55%  { opacity: 0.45; transform: translate(var(--sway), -25vh) scale(1); }
  75%  { opacity: 0.2; transform: translate(0, -35vh) scale(0.8); }
  100% { transform: translate(0, -45vh) scale(0.4); opacity: 0; }
}

/* ===== 闪光 ===== */
.sparkle-dot { position: absolute; background: rgba(200,180,255,0.9); border-radius: 50%; box-shadow: 0 0 6px rgba(200,180,255,0.6); animation: sparkle-blink 1.8s ease-in-out infinite alternate; }
@keyframes sparkle-blink {
  0% { opacity: 0; transform: scale(0) translate(0, 0); }
  30% { opacity: 1; transform: scale(1.5) translate(var(--sway, 4px), calc(var(--sway, 4px) * -0.6)); }
  60% { opacity: 0.6; transform: scale(1) translate(calc(var(--sway, 4px) * -0.4), var(--sway, 4px)); }
  100% { opacity: 0; transform: scale(0) translate(0, 0); }
}

/* ===== 彩纸 ===== */
.confetti-piece {
  position: absolute;
  top: -15px;
  width: 10px; height: 16px;
  border-radius: 2px;
  animation: fall-confetti var(--dur, 5s) linear infinite;
  --sway: 25px;
}
@keyframes fall-confetti {
  0% { transform: translateY(-15px) rotate(0deg); opacity: 0; }
  8% { opacity: 0.9; }
  25% { transform: translateY(25vh) rotate(180deg) translateX(var(--sway)); }
  50% { transform: translateY(50vh) rotate(360deg) translateX(calc(var(--sway) * -0.5)); }
  75% { transform: translateY(75vh) rotate(540deg) translateX(var(--sway)); }
  90% { opacity: 0.38; }
  100% { transform: translateY(105vh) rotate(720deg) translateX(0); opacity: 0; }
}

/* ===== 萤火虫 ===== */
.firefly {
  position: absolute;
  width: 7px; height: 7px;
  background: rgba(255,200,80,0.9);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(255,200,80,0.8), 0 0 20px rgba(255,180,50,0.3);
  animation: fly-around 3.5s ease-in-out infinite alternate;
}
@keyframes fly-around {
  0% { transform: translate(0, 0); opacity: 0.38; }
  20% { transform: translate(20px, -15px); opacity: 0.95; }
  40% { transform: translate(-15px, 20px); opacity: 0.45; }
  60% { transform: translate(25px, 10px); opacity: 0.9; }
  80% { transform: translate(-10px, -20px); opacity: 0.6; }
  100% { transform: translate(15px, -5px); opacity: 0.45; }
}

/* ===== 霓虹 ===== */
.neon-line {
  position: absolute;
  left: 0; width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(100,220,255,0.6), rgba(160,128,255,0.5), transparent);
  animation: neon-scan 4s linear infinite;
  box-shadow: 0 0 8px rgba(160,128,192,0.25);
}
.nl1 { top: 15%; }
.nl2 { top: 45%; animation-delay: -1.5s; }
.nl3 { top: 75%; animation-delay: -3s; }
.nl4 { top: 25%; left: auto; right: 0; animation-delay: -0.8s; }
.nl5 { top: 65%; left: auto; right: 0; animation-delay: -2.5s; }
@keyframes neon-scan {
  0% { opacity: 0; transform: scaleX(0.3); }
  50% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(0.3); }
}

/* ===== 光晕 ===== */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  animation: glow-breathe 5s ease-in-out infinite alternate;
}
.go1 { top: 5%; right: 5%; width: 280px; height: 280px; background: rgba(212,165,116,0.22); }
.go2 { bottom: 15%; left: 10%; width: 280px; height: 280px; background: rgba(212,165,116,0.25); animation-delay: -2.5s; }
@keyframes glow-breathe {
  0% { transform: scale(1); opacity: 0.38; }
  100% { transform: scale(1.3); opacity: 1; }
}

/* ===== 闪电 ===== */
.lightning-bolt {
  position: absolute;
  top: 0;
  width: 3px; height: 40%;
  background: linear-gradient(180deg, transparent, rgba(200,200,255,0.6), rgba(255,255,255,0.9), transparent);
  animation: lightning-flash 4s ease-in-out infinite;
  filter: blur(1px);
  box-shadow: 0 0 10px rgba(200,200,255,0.25);
}
.lb1 { left: 12%; animation-duration: 4s; }
.lb2 { left: 85%; animation-duration: 5s; animation-delay: -2s; }
.storm-glow {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 30%;
  background: linear-gradient(180deg, rgba(100,100,180,0.22), transparent);
  animation: storm-pulse 6s ease-in-out infinite alternate;
}
@keyframes lightning-flash {
  0%, 85%, 100% { opacity: 0; }
  88% { opacity: 0.6; }
  90% { opacity: 0.38; }
  92% { opacity: 1; }
  95% { opacity: 0; }
}
@keyframes storm-pulse {
  0% { opacity: 0.45; }
  100% { opacity: 0.6; }
}

/* ===== 暗脉冲 ===== */
.dark-pulse {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: dark-breathe 6s ease-in-out infinite alternate;
}
.dp1 { top: 10%; left: 5%; width: 300px; height: 300px; background: rgba(80,60,120,0.25); }
.dp2 { bottom: 10%; right: 5%; width: 250px; height: 250px; background: rgba(60,40,100,0.22); animation-delay: -3s; }
.dim-star { position: absolute; background: rgba(180,160,220,0.7); border-radius: 50%; box-shadow: 0 0 7px rgba(180,160,220,0.28); animation: dim-twinkle 3s ease-in-out infinite alternate; }
@keyframes dark-breathe {
  0% { transform: scale(1); opacity: 0.55; }
  100% { transform: scale(1.3); opacity: 0.9; }
}
@keyframes dim-twinkle {
  0% { opacity: 0.08; transform: translate(0, 0); }
  50% { opacity: 0.6; transform: translate(var(--sway, 3px), calc(var(--sway, 3px) * -0.5)); }
  100% { opacity: 0.08; transform: translate(0, 0); }
}

/* ===== 日出 ===== */
.sun-glow {
  position: absolute;
  bottom: -10%; right: 10%; left: auto;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(255,200,100,0.25) 0%, rgba(255,150,50,0.25) 40%, transparent 70%);
  animation: sunrise-pulse 5s ease-in-out infinite alternate;
}
.sun-ray {
  position: absolute;
  bottom: 0; left: 50%;
  width: 2px; height: 50%;
  background: linear-gradient(0deg, rgba(255,200,100,0.28), transparent);
  transform-origin: bottom center;
  animation: ray-sway 6s ease-in-out infinite alternate;
}
.sr1 { transform: rotate(-20deg); animation-delay: -1s; }
.sr2 { transform: rotate(0deg); }
.sr3 { transform: rotate(20deg); animation-delay: -2s; }
@keyframes sunrise-pulse {
  0% { transform: scale(1); opacity: 0.45; }
  100% { transform: scale(1.2); opacity: 1; }
}
@keyframes ray-sway {
  0% { opacity: 0.55; }
  100% { opacity: 0.6; }
}

/* ===== 流沙 ===== */
.sand-particle {
  position: absolute;
  top: -10px;
  width: 4px; height: 4px;
  background: rgba(212,165,96,0.6);
  border-radius: 50%;
  animation: fall-sand var(--dur, 7s) linear infinite;
  --sway: 25px;
}
@keyframes fall-sand {
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  10% { opacity: 0.55; }
  25% { transform: translateY(25vh) translateX(var(--sway)); }
  50% { transform: translateY(50vh) translateX(calc(var(--sway) * -0.5)); }
  75% { transform: translateY(75vh) translateX(var(--sway)); }
  90% { opacity: 0.45; }
  100% { transform: translateY(105vh) translateX(0); opacity: 0; }
}

/* ===== 银河光环 ===== */
.galaxy-ring {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(120,100,220,0.28);
  border-radius: 50%;
  animation: ring-pulse 6s ease-in-out infinite alternate;
}
.gr1 { width: 300px; height: 300px; }
.gr2 { width: 320px; height: 160px; border-color: rgba(100,140,220,0.32); animation-delay: -3s; transform: translate(-50%, -50%) rotate(20deg); }
@keyframes ring-pulse {
  0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
  100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
}

/* ===== 流星 ===== */
/* ===== 流星 ===== */
.meteor-streak {
  position: absolute;
  width: 200px; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), #fff);
  border-radius: 2px;
  will-change: transform, opacity;
}
.m1 { top: 8%; left: 0; animation: meteor-go 4s linear infinite; }
.m2 { top: 28%; left: 8%; animation: meteor-go 5s linear 3s infinite; }
.m3 { top: 48%; left: -3%; animation: meteor-go 4.5s linear 6.5s infinite; }
@keyframes meteor-go {
  0%   { transform: translate(0, 0) rotate(25deg); opacity: 0; }
  10%  { opacity: 0.9; }
  70%  { opacity: 0.5; }
  100% { transform: translate(85vw, 45vh) rotate(25deg); opacity: 0; }
}

/* ===== 赛博网格+点 ===== */
.cyber-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(100,200,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100,200,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-scan 8s linear infinite;
}
@keyframes grid-scan {
  0% { opacity: 0.5; }
  50% { opacity: 0.6; }
  100% { opacity: 0.5; }
}
.cyber-dot {
  position: absolute;
  width: 4px; height: 4px;
  background: rgba(100,220,255,0.8);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(100,220,255,0.6);
  animation: cyber-blink 2s ease-in-out infinite alternate;
}
@keyframes cyber-blink {
  0% { opacity: 0.1; transform: scale(0.5); }
  50% { opacity: 0.9; transform: scale(1.3); }
  100% { opacity: 0.1; transform: scale(0.5); }
}

/* ===== 星云+漂移星 ===== */
.nebula-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: nebula-breathe 8s ease-in-out infinite alternate;
}
.ng1 { left: 8%; top: 10%; width: 280px; height: 180px; background: rgba(100,80,200,0.28); }
.ng2 { right: 8%; bottom: 15%; width: 240px; height: 150px; background: rgba(60,100,200,0.22); animation-delay: -4s; }
@keyframes nebula-breathe {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0.65; transform: scale(1.15); }
}
.drift-star {
  position: absolute;
  background: #fff;
  border-radius: 50%;
  animation: star-drift ease-in-out infinite alternate;
}
.drift-star::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: inherit;
  filter: blur(8px);
  opacity: 0.55;
}
@keyframes star-drift {
  0% { opacity: 0.38; transform: translate(0, 0) scale(0.5); }
  30% { opacity: 1; transform: translate(var(--tx, 5px), 0) scale(1.3); }
  60% { opacity: 0.32; transform: translate(calc(var(--tx, 5px) * -0.5), var(--sway, 3px)) scale(0.7); }
  100% { opacity: 0.38; transform: translate(0, 0) scale(0.5); }
}


/* ===== 蝴蝶飞舞 ===== */
.butterfly-float {
  position: absolute;
  font-size: 18px;
  animation: butterfly-wander ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
}
@keyframes butterfly-wander {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0.45; }
  20% { transform: translate(30px, -20px) rotate(6deg); opacity: 0.45; }
  40% { transform: translate(-20px, 15px) rotate(-4deg); opacity: 0.5; }
  60% { transform: translate(25px, -10px) rotate(5deg); opacity: 0.6; }
  80% { transform: translate(-15px, 20px) rotate(-3deg); opacity: 0.45; }
  100% { transform: translate(0, 0) rotate(0deg); opacity: 0.45; }
}

/* ===== 彗星划过 ===== */
.comet-trail {
  position: absolute;
  width: 150px; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), #fff);
  border-radius: 1px;
  animation: shooting-star 6s ease-out infinite;
  -webkit-mask-image: linear-gradient(90deg, transparent, white 30%, white);
  mask-image: linear-gradient(90deg, transparent white 30%, white);
}
.comet-trail::after {
  content: '';
  position: absolute;
  right: -4px; top: -4px;
  width: 10px; height: 10px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 8px #fff, 0 0 20px rgba(200,220,255,0.6), 0 0 40px rgba(180,200,255,0.2);
}

/* ===== 烟花/爆炸 ===== */
.firework-burst {
  position: absolute;
  width: 6px; height: 6px;
  border-radius: 50%;
  animation: fw-burst ease-out infinite;
}
.firework-burst::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: inherit;
  filter: blur(8px);
  opacity: 0.38;
}
@keyframes fw-burst {
  0% { transform: scale(0); opacity: 1; box-shadow: 0 0 0 0 rgba(255,255,255,0.8); }
  30% { transform: scale(1); box-shadow: 0 0 20px 4px rgba(255,215,0,0.6); }
  60% { opacity: 0.45; }
  100% { transform: scale(0); opacity: 0; box-shadow: 0 0 0 0 transparent; }
}
.firework-burst:nth-child(1) { background: #ff6b8a; }
.firework-burst:nth-child(2) { background: #ffd700; }
.firework-burst:nth-child(3) { background: #4ecdc4; }
.firework-burst:nth-child(4) { background: #a066d9; }
.firework-burst:nth-child(5) { background: #ff9f43; }
.firework-burst:nth-child(6) { background: #45b7d1; }
.firework-burst:nth-child(7) { background: #ff6b8a; }
.firework-burst:nth-child(8) { background: #ffd700; }

/* ===== 魔法阵 ===== */
.magic-ring {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(168,85,247,0.25);
  border-radius: 50%;
  animation: magic-spin linear infinite;
  box-shadow: 0 0 15px rgba(168,85,247,0.32), inset 0 0 15px rgba(168,85,247,0.22);
}
.mr1 { left: 20%; width: 250px; height: 250px; animation-duration: 12s; }
.mr2 { left: 20%; width: 300px; height: 300px; animation-duration: 8s; animation-direction: reverse; border-color: rgba(196,181,253,0.3); }
@keyframes magic-spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ===== 彩虹拱门 ===== */
.rainbow-band {
  position: absolute;
  left: 50%; bottom: 10%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: inherit;
  border-radius: 50% 50% 0 0;
  animation: rainbow-glow 3s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes rainbow-glow {
  0% { opacity: 0.45; transform: translateX(-50%) scale(0.95); }
  100% { opacity: 0.55; transform: translateX(-50%) scale(1.05); }
}
</style>
