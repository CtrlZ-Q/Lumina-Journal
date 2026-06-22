<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  anim: { type: String, default: 'sparkle-burst' },
  colors: { type: Array, default: () => ['#94a3b8','#64748b'] },
  speed: { type: Number, default: 3 },
  density: { type: Number, default: 8 },
})

const rand = (min, max) => Math.random() * (max - min) + min

// 每隔几秒重新生成粒子，制造随机感
const seed = ref(0)
let timer = null
onMounted(() => {
  timer = setInterval(() => { seed.value++ }, 4000 + Math.random() * 3000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })

const particles = computed(() => {
  void seed.value // 触发重算
  const arr = []
  const n = Math.min(props.density, 35)
  for (let i = 0; i < n; i++) {
    const dur = props.speed * 0.5 + Math.random() * props.speed * 1.2
    arr.push({
      left: rand(0, 100) + '%',
      top: rand(0, 100) + '%',
      size: rand(5, 14) + 'px',
      delay: rand(0, props.speed * 0.8) + 's',
      dur: dur + 's',
      color: props.colors[i % props.colors.length],
      // 随机移动方向
      tx: rand(-45, 45) + 'px',
      ty: rand(-45, 45) + 'px',
      tx2: rand(-35, 35) + 'px',
      ty2: rand(-35, 35) + 'px',
      // 随机旋转
      rot: rand(0, 360) + 'deg',
      rot2: rand(-180, 180) + 'deg',
    })
  }
  return arr
})

const bgGlow = computed(() => {
  if (props.colors.length < 2) return props.colors[0] + '22'
  return 'linear-gradient(135deg, ' + props.colors[0] + '22, ' + props.colors[1] + '14)'
})

function g90(c, a) { return 'linear-gradient(90deg, transparent, ' + c + a + ', transparent)' }
function g135(a, b) { return 'linear-gradient(135deg, ' + a + ', ' + b + ')' }
function rad(c, a) { return 'radial-gradient(circle, ' + c + a + ', transparent)' }
function rad3(c1, a1, c2, a2) { return 'radial-gradient(circle, ' + c1 + a1 + ', ' + c2 + a2 + ', transparent)' }
function bs(c, r) { return '0 0 ' + r + 'px ' + c }
function rot(d) { return 'rotate(' + d + 'deg)' }
function sec(s) { return s + 's' }
function pct(p) { return p + '%' }
</script>

<template>
  <div class="shop-anim" :style="{ background: bgGlow }">

    <!-- 闪烁粒子：随机漂移 -->
    <template v-if="anim === 'sparkle-burst'">
      <div v-for="(p, i) in particles" :key="i" class="a-sparkle"
        :style="{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color, boxShadow: bs(p.color, 6), animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 花瓣飘落：左右摇摆+旋转 -->
    <template v-else-if="anim === 'petal-drift'">
      <div v-for="(p, i) in particles" :key="i" class="a-petal"
        :style="{ left: p.left, background: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.6), '--tx': p.tx, '--tx2': p.tx2, '--rot': p.rot }" />
    </template>

    <!-- 萤火虫：随机游走 -->
    <template v-else-if="anim === 'firefly-glow'">
      <div v-for="(p, i) in particles" :key="i" class="a-firefly"
        :style="{ left: p.left, top: p.top, background: p.color, boxShadow: '0 0 8px ' + p.color + ', 0 0 16px ' + p.color + '60', animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty, '--tx2': p.tx2, '--ty2': p.ty2 }" />
    </template>

    <!-- 波浪 -->
    <template v-else-if="anim === 'wave-motion'">
      <div v-for="(p, i) in particles.slice(0, 4)" :key="i" class="a-wave"
        :style="{ background: g90(p.color, '35'), animationDelay: sec(i*0.7), animationDuration: sec(props.speed*1.4+i*0.3) }" />
    </template>

    <!-- 气泡上升：左右摇摆 -->
    <template v-else-if="anim === 'bubble-rise'">
      <div v-for="(p, i) in particles" :key="i" class="a-bubble"
        :style="{ left: p.left, borderColor: p.color + '70', animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.8), '--tx': p.tx, width: rand(5,12)+'px', height: rand(5,12)+'px' }" />
    </template>

    <!-- 星星闪烁：缩放+微移 -->
    <template v-else-if="anim === 'star-twinkle'">
      <div v-for="(p, i) in particles" :key="i" class="a-star"
        :style="{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color, boxShadow: bs(p.color, 8), animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 火焰上升：摇曳 -->
    <template v-else-if="anim === 'fire-rise'">
      <div v-for="(p, i) in particles" :key="i" class="a-fire"
        :style="{ left: p.left, background: rad(p.color, ''), animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*0.9), '--tx': p.tx, '--ty': p.ty, filter: 'blur(1.5px)' }" />
    </template>

    <!-- 雪花飘落：左右飘 -->
    <template v-else-if="anim === 'snow-fall'">
      <div v-for="(p, i) in particles" :key="i" class="a-snow"
        :style="{ left: p.left, width: rand(3,7)+'px', height: rand(3,7)+'px', background: p.color, opacity: 0.7+Math.random()*0.3, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*2), '--tx': p.tx, '--tx2': p.tx2 }" />
    </template>

    <!-- 树叶飘落：旋转+飘 -->
    <template v-else-if="anim === 'leaf-fall'">
      <div v-for="(p, i) in particles" :key="i" class="a-leaf"
        :style="{ left: p.left, background: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.8), '--tx': p.tx, '--tx2': p.tx2, '--rot': p.rot }" />
    </template>

    <!-- 极光波动：流动光带 -->
    <template v-else-if="anim === 'aurora-wave'">
      <div v-for="(p, i) in particles.slice(0, 5)" :key="i" class="a-aurora"
        :style="{ background: g90(p.color, '30'), animationDelay: sec(i*0.6), animationDuration: sec(props.speed*1.1+i*0.4), top: pct(10+i*16), '--tx': p.tx }" />
    </template>

    <!-- 银河旋转：旋臂+旋转星 -->
    <template v-else-if="anim === 'galaxy-spin'">
      <div class="a-galaxy-core" :style="{ background: rad(colors[0], '50'), animationDuration: sec(props.speed*1.8) }" />
      <div v-for="(p, i) in particles.slice(0, 3)" :key="'a'+i" class="a-galaxy-arm"
        :style="{ borderColor: p.color + '22', animationDuration: sec(props.speed*2+i*3), transform: rot(i*60) }" />
      <div v-for="(p, i) in particles" :key="'s'+i" class="a-galaxy-star"
        :style="{ left: p.left, top: p.top, background: p.color, boxShadow: bs(p.color, 5), animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 流星：拖尾划过 -->
    <template v-else-if="anim === 'meteor-streak'">
      <div v-for="(p, i) in particles.slice(0, 6)" :key="i" class="a-meteor"
        :style="{ background: g135(p.color, 'transparent'), animationDelay: sec(i*0.8+rand(0,1)), animationDuration: sec(props.speed*1.2+rand(0,1)), top: pct(rand(0,40)), left: pct(rand(0,50)) }" />
    </template>

    <!-- 霓虹闪烁：扫描线 -->
    <template v-else-if="anim === 'neon-flash'">
      <div v-for="(p, i) in particles.slice(0, 5)" :key="i" class="a-neon"
        :style="{ background: g90(p.color, '50'), boxShadow: '0 0 12px ' + p.color + '30', animationDelay: sec(i*0.5), animationDuration: sec(props.speed*1.1+i*0.2), top: pct(10+i*18) }" />
    </template>

    <!-- 闪电：随机劈落 -->
    <template v-else-if="anim === 'lightning-bolt'">
      <div v-for="(p, i) in particles.slice(0, 4)" :key="i" class="a-lightning"
        :style="{ background: 'linear-gradient(180deg, transparent, ' + p.color + '90, transparent)', animationDelay: sec(i*1.2+rand(0,2)), animationDuration: sec(props.speed*2+rand(0,1)), left: pct(15+i*20+rand(-5,5)), filter: 'blur(1px)' }" />
    </template>

    <!-- 魔法阵：旋转环+粒子 -->
    <template v-else-if="anim === 'magic-circle'">
      <div class="a-magic-ring" :style="{ borderColor: colors[0] + '40', animationDuration: sec(props.speed*1.5) }" />
      <div class="a-magic-ring a-magic-ring-inner" :style="{ borderColor: (colors[1]||colors[0]) + '30', animationDuration: sec(props.speed*2) }" />
      <div v-for="(p, i) in particles" :key="i" class="a-sparkle"
        :style="{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color, boxShadow: bs(p.color, 5), animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 涟漪：扩散环 -->
    <template v-else-if="anim === 'ripple-ring'">
      <div v-for="(p, i) in particles.slice(0, 4)" :key="i" class="a-ripple"
        :style="{ borderColor: p.color + '50', animationDelay: sec(i*0.6), animationDuration: sec(props.speed*1.3+rand(0,0.5)) }" />
    </template>

    <!-- 脉冲：呼吸光 -->
    <template v-else-if="anim === 'pulse-ring'">
      <div v-for="(p, i) in particles.slice(0, 4)" :key="i" class="a-pulse"
        :style="{ background: rad(p.color, '25'), animationDelay: sec(i*0.4), animationDuration: sec(props.speed+rand(0,1)), left: pct(20+i*20+rand(-5,5)), top: pct(20+i*15+rand(-5,5)) }" />
    </template>

    <!-- 爱心漂浮：上浮+摇摆 -->
    <template v-else-if="anim === 'heart-float'">
      <div v-for="(p, i) in particles" :key="i" class="a-heart"
        :style="{ left: p.left, color: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.6), '--tx': p.tx, '--tx2': p.tx2 }">♥</div>
    </template>

    <!-- 彩纸爆炸：四散飞射 -->
    <template v-else-if="anim === 'confetti-burst'">
      <div v-for="(p, i) in particles" :key="i" class="a-confetti"
        :style="{ left: '50%', top: '50%', background: p.color, animationDelay: sec(i*0.04), animationDuration: sec(parseFloat(p.dur)*0.9), '--tx': p.tx, '--ty': p.ty, '--rot': p.rot, width: rand(4,8)+'px', height: rand(6,10)+'px' }" />
    </template>

    <!-- 烟花：爆炸粒子 -->
    <template v-else-if="anim === 'firework-pop'">
      <div v-for="(p, i) in particles.slice(0, 14)" :key="i" class="a-firework"
        :style="{ left: '50%', top: '50%', background: p.color, boxShadow: bs(p.color, 4), animationDelay: sec(i*0.03), animationDuration: sec(parseFloat(p.dur)*0.7), '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 霜花闪烁：结晶闪光 -->
    <template v-else-if="anim === 'frost-shimmer'">
      <div v-for="(p, i) in particles" :key="i" class="a-frost"
        :style="{ left: p.left, top: p.top, background: p.color, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty, filter: 'blur(0.3px)' }" />
    </template>

    <!-- 暗脉冲：深色呼吸 -->
    <template v-else-if="anim === 'dark-pulse'">
      <div class="a-dark-orb" :style="{ background: rad(colors[0], '30'), animationDuration: sec(props.speed*1.5) }" />
      <div class="a-dark-orb a-dark-orb-2" :style="{ background: rad(colors[1]||colors[0], '22'), animationDuration: sec(props.speed*2) }" />
      <div v-for="(p, i) in particles.slice(0, 8)" :key="i" class="a-dim-star"
        :style="{ left: p.left, top: p.top, background: p.color, boxShadow: bs(p.color, 4), animationDelay: p.delay, animationDuration: p.dur }" />
    </template>

    <!-- 超新星：核心闪光+爆炸 -->
    <template v-else-if="anim === 'supernova'">
      <div class="a-supernova-core" :style="{ background: rad3(colors[0], '60', colors[1]||colors[0], '25'), animationDuration: sec(props.speed*1.3) }" />
      <div v-for="(p, i) in particles.slice(0, 12)" :key="i" class="a-firework"
        :style="{ left: '50%', top: '50%', background: p.color, boxShadow: bs(p.color, 4), animationDelay: sec(i*0.02), animationDuration: sec(parseFloat(p.dur)*0.6), '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 彩虹：拱形脉冲 -->
    <template v-else-if="anim === 'rainbow-arc'">
      <div v-for="(c, i) in colors" :key="i" class="a-rainbow-band"
        :style="{ borderColor: c + '30', animationDuration: sec(props.speed*1.8+i*0.2), width: (100-i*12)+'px', height: (50-i*6)+'px', animationDelay: sec(i*0.12) }" />
    </template>

    <!-- 日光：光芒扩展 -->
    <template v-else-if="anim === 'sun-glow'">
      <div class="a-sun-core" :style="{ background: rad3(colors[0], '45', colors[1]||colors[0], '20'), animationDuration: sec(props.speed*1.4) }" />
      <div v-for="(p, i) in particles.slice(0, 6)" :key="i" class="a-sun-ray"
        :style="{ transform: rot(i*30+rand(-10,10)), background: 'linear-gradient(0deg, ' + p.color + '30, transparent)', animationDuration: sec(props.speed*1.8+rand(0,1)) }" />
    </template>

    <!-- 枫叶：旋转飘落 -->
    <template v-else-if="anim === 'maple-leaf'">
      <div v-for="(p, i) in particles" :key="i" class="a-maple"
        :style="{ left: p.left, color: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*2), '--tx': p.tx, '--tx2': p.tx2, '--rot': p.rot }">🍁</div>
    </template>

    <!-- 薄雾：流动 -->
    <template v-else-if="anim === 'mist-drift'">
      <div v-for="(p, i) in particles.slice(0, 5)" :key="i" class="a-mist"
        :style="{ background: g90(p.color, '20'), animationDelay: sec(i*1), animationDuration: sec(props.speed*2+i*0.5), top: pct(8+i*18), '--tx': p.tx }" />
    </template>

    <!-- 水晶折射：闪光+移动 -->
    <template v-else-if="anim === 'crystal-reflect'">
      <div v-for="(p, i) in particles" :key="i" class="a-crystal"
        :style="{ left: p.left, top: p.top, background: p.color, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur, transform: rot(rand(0,45)), '--tx': p.tx, '--ty': p.ty }" />
    </template>

    <!-- 齿轮旋转 -->
    <template v-else-if="anim === 'gear-rotate'">
      <div v-for="(p, i) in particles.slice(0, 4)" :key="i" class="a-gear"
        :style="{ borderColor: p.color + '30', animationDuration: sec(props.speed*2+i*2.5), left: pct(15+i*22), top: pct(20+i*12) }" />
    </template>

    <!-- 音符漂浮：上浮+摇摆 -->
    <template v-else-if="anim === 'note-float'">
      <div v-for="(p, i) in particles.slice(0, 8)" :key="i" class="a-note"
        :style="{ left: p.left, color: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.6), '--tx': p.tx, '--tx2': p.tx2 }">{{ ['♪','♫','♬','♩'][i%4] }}</div>
    </template>

    <!-- 像素弹出：随机位置闪烁 -->
    <template v-else-if="anim === 'pixel-pop'">
      <div v-for="(p, i) in particles" :key="i" class="a-pixel"
        :style="{ left: p.left, top: p.top, background: p.color, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur }" />
    </template>

    <!-- 胶片颗粒：随机闪烁 -->
    <template v-else-if="anim === 'film-grain'">
      <div v-for="(p, i) in particles.slice(0, 14)" :key="i" class="a-grain"
        :style="{ left: p.left, top: p.top, background: p.color, width: rand(1,3)+'px', height: rand(1,3)+'px', animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*0.4) }" />
    </template>

    <!-- 水墨扩散：渐变扩散 -->
    <template v-else-if="anim === 'ink-spread'">
      <div v-for="(p, i) in particles.slice(0, 5)" :key="i" class="a-ink"
        :style="{ background: rad(p.color, '25'), animationDelay: sec(i*0.7+rand(0,0.5)), animationDuration: sec(props.speed*2+rand(0,1)), left: pct(15+i*17+rand(-5,5)), top: pct(15+i*12+rand(-5,5)) }" />
    </template>

    <!-- 雨滴：斜落 -->
    <template v-else-if="anim === 'rain-drop'">
      <div v-for="(p, i) in particles" :key="i" class="a-rain"
        :style="{ left: p.left, background: 'linear-gradient(180deg, transparent, ' + p.color + '50)', animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*0.7), '--tx': p.tx }" />
    </template>

    <!-- 金色光：闪烁漂移 -->
    <template v-else-if="anim === 'gold-shimmer'">
      <div v-for="(p, i) in particles" :key="i" class="a-gold"
        :style="{ left: p.left, top: p.top, background: p.color, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty, filter: 'blur(0.3px)' }" />
    </template>

    <!-- 蝴蝶飞舞：曲线飞行 -->
    <template v-else-if="anim === 'butterfly-fly'">
      <div v-for="(p, i) in particles.slice(0, 6)" :key="i" class="a-butterfly"
        :style="{ left: p.left, top: p.top, color: p.color, animationDelay: p.delay, animationDuration: sec(parseFloat(p.dur)*1.8), '--tx': p.tx, '--ty': p.ty, '--tx2': p.tx2, '--ty2': p.ty2 }">🦋</div>
    </template>

    <!-- 默认 -->
    <template v-else>
      <div v-for="(p, i) in particles" :key="i" class="a-sparkle"
        :style="{ left: p.left, top: p.top, width: p.size, height: p.size, background: p.color, boxShadow: bs(p.color, 6), animationDelay: p.delay, animationDuration: p.dur, '--tx': p.tx, '--ty': p.ty }" />
    </template>
  </div>
</template>

<style scoped>
.shop-anim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* ===== 闪烁粒子：漂移+闪烁 ===== */
.a-sparkle {
  position: absolute;
  border-radius: 50%;
  animation: sparkle-drift ease-in-out infinite alternate;
}
@keyframes sparkle-drift {
  0%   { opacity: 0; transform: scale(0) translate(0, 0); }
  30%  { opacity: 1; transform: scale(1.4) translate(var(--tx, 5px), var(--ty, -5px)); }
  70%  { opacity: 0.8; transform: scale(1) translate(calc(var(--tx, 5px) * -0.6), calc(var(--ty, -5px) * -0.6)); }
  100% { opacity: 0; transform: scale(0.3) translate(var(--tx, 5px), var(--ty, -5px)); }
}

/* ===== 花瓣飘落：左右摇摆+旋转 ===== */
.a-petal {
  position: absolute;
  top: -12px;
  width: 9px; height: 9px;
  border-radius: 50% 0 50% 50%;
  animation: petal-fall linear infinite;
  opacity: 0.75;
}
@keyframes petal-fall {
  0%   { transform: translateY(-12px) translateX(0) rotate(0deg); opacity: 0; }
  8%   { opacity: 0.75; }
  25%  { transform: translateY(25vh) translateX(var(--tx, 15px)) rotate(90deg); }
  50%  { transform: translateY(50vh) translateX(var(--tx2, -10px)) rotate(200deg); }
  75%  { transform: translateY(75vh) translateX(var(--tx, 15px)) rotate(300deg); }
  92%  { opacity: 0.3; }
  100% { transform: translateY(108vh) translateX(calc(var(--tx2, -10px) * 0.5)) rotate(400deg); opacity: 0; }
}

/* ===== 萤火虫：多段随机游走 ===== */
.a-firefly {
  position: absolute;
  width: 5px; height: 5px;
  border-radius: 50%;
  animation: firefly-wander ease-in-out infinite alternate;
}
@keyframes firefly-wander {
  0%   { transform: translate(0, 0); opacity: 0.15; }
  20%  { transform: translate(var(--tx, 12px), var(--ty, -8px)); opacity: 0.95; }
  40%  { transform: translate(var(--tx2, -10px), var(--ty2, 12px)); opacity: 0.2; }
  60%  { transform: translate(calc(var(--tx, 12px) * 0.5), var(--ty, -8px)); opacity: 0.85; }
  80%  { transform: translate(var(--tx2, -10px), calc(var(--ty2, 12px) * -0.5)); opacity: 0.3; }
  100% { transform: translate(calc(var(--tx, 12px) * -0.3), calc(var(--ty, -8px) * 0.3)); opacity: 0.9; }
}

/* ===== 波浪 ===== */
.a-wave {
  position: absolute;
  left: -10%; width: 120%;
  height: 45%;
  border-radius: 50% 50% 0 0;
  animation: wave-drift ease-in-out infinite;
}
@keyframes wave-drift {
  0%, 100% { transform: translateX(-4%) scaleY(1); }
  50%      { transform: translateX(4%) scaleY(1.15); }
}

/* ===== 气泡上升：摇摆 ===== */
.a-bubble {
  position: absolute;
  bottom: -12px;
  border: 1.5px solid;
  border-radius: 50%;
  background: transparent;
  animation: bubble-sway linear infinite;
}
@keyframes bubble-sway {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  8%   { opacity: 0.65; }
  25%  { transform: translateY(-25vh) translateX(var(--tx, 8px)); }
  50%  { transform: translateY(-50vh) translateX(calc(var(--tx, 8px) * -0.6)); }
  75%  { transform: translateY(-75vh) translateX(var(--tx, 8px)); }
  92%  { opacity: 0.2; }
  100% { transform: translateY(-108vh) translateX(calc(var(--tx, 8px) * -0.3)); opacity: 0; }
}

/* ===== 星星闪烁：缩放+微移 ===== */
.a-star {
  position: absolute;
  border-radius: 50%;
  animation: star-pulse ease-in-out infinite alternate;
}
@keyframes star-pulse {
  0%   { opacity: 0.08; transform: scale(0.4) translate(0, 0); }
  40%  { opacity: 1; transform: scale(1.5) translate(var(--tx, 3px), var(--ty, -3px)); }
  70%  { opacity: 0.6; transform: scale(0.9) translate(calc(var(--tx, 3px) * -0.5), calc(var(--ty, -3px) * -0.5)); }
  100% { opacity: 0.08; transform: scale(0.4) translate(var(--tx, 3px), var(--ty, -3px)); }
}

/* ===== 火焰上升：摇曳 ===== */
.a-fire {
  position: absolute;
  bottom: 0;
  width: 14px; height: 14px;
  border-radius: 50%;
  animation: fire-sway linear infinite;
}
@keyframes fire-sway {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.85; }
  30%  { transform: translateY(-30%) translateX(var(--tx, 5px)) scale(0.8); opacity: 0.7; }
  60%  { transform: translateY(-60%) translateX(calc(var(--tx, 5px) * -0.5)) scale(0.5); opacity: 0.4; }
  100% { transform: translateY(-90%) translateX(var(--ty, -3px)) scale(0.2); opacity: 0; }
}

/* ===== 雪花飘落：左右飘 ===== */
.a-snow {
  position: absolute;
  top: -8px;
  border-radius: 50%;
  animation: snow-drift linear infinite;
}
@keyframes snow-drift {
  0%   { transform: translateY(-8px) translateX(0); opacity: 0; }
  8%   { opacity: 0.85; }
  25%  { transform: translateY(25vh) translateX(var(--tx, 10px)); }
  50%  { transform: translateY(50vh) translateX(var(--tx2, -8px)); }
  75%  { transform: translateY(75vh) translateX(var(--tx, 10px)); }
  92%  { opacity: 0.3; }
  100% { transform: translateY(108vh) translateX(calc(var(--tx2, -8px) * 0.4)); opacity: 0; }
}

/* ===== 树叶飘落：旋转+飘 ===== */
.a-leaf {
  position: absolute;
  top: -12px;
  width: 11px; height: 8px;
  border-radius: 0 50% 50% 50%;
  animation: leaf-spin linear infinite;
  opacity: 0.65;
}
@keyframes leaf-spin {
  0%   { transform: translateY(-12px) translateX(0) rotate(0deg); opacity: 0; }
  8%   { opacity: 0.65; }
  25%  { transform: translateY(25vh) translateX(var(--tx, 12px)) rotate(calc(var(--rot, 90deg))); }
  50%  { transform: translateY(50vh) translateX(var(--tx2, -8px)) rotate(calc(var(--rot, 90deg) * 2)); }
  75%  { transform: translateY(75vh) translateX(var(--tx, 12px)) rotate(calc(var(--rot, 90deg) * 3)); }
  92%  { opacity: 0.2; }
  100% { transform: translateY(108vh) translateX(calc(var(--tx2, -8px) * 0.3)) rotate(calc(var(--rot, 90deg) * 4)); opacity: 0; }
}

/* ===== 极光波动：流动光带 ===== */
.a-aurora {
  position: absolute;
  left: -10%; width: 120%;
  height: 28%;
  animation: aurora-flow ease-in-out infinite alternate;
  filter: blur(10px);
}
@keyframes aurora-flow {
  0%   { transform: translateX(-6%) scaleY(0.8); opacity: 0.35; }
  50%  { transform: translateX(3%) scaleY(1.2); opacity: 0.7; }
  100% { transform: translateX(6%) scaleY(0.9); opacity: 0.45; }
}

/* ===== 银河旋转 ===== */
.a-galaxy-core {
  position: absolute;
  left: 50%; top: 50%;
  width: 45px; height: 45px;
  transform: translate(-50%,-50%);
  border-radius: 50%;
  animation: galaxy-breathe ease-in-out infinite alternate;
}
@keyframes galaxy-breathe {
  0%   { transform: translate(-50%,-50%) scale(0.7); opacity: 0.35; }
  100% { transform: translate(-50%,-50%) scale(1.3); opacity: 0.75; }
}
.a-galaxy-arm {
  position: absolute;
  left: 50%; top: 50%;
  width: 75%; height: 75%;
  transform: translate(-50%,-50%);
  border: 1.5px solid transparent;
  border-top-color: inherit;
  border-radius: 50%;
  animation: galaxy-rotate linear infinite;
}
@keyframes galaxy-rotate {
  0%   { transform: translate(-50%,-50%) rotate(0deg); }
  100% { transform: translate(-50%,-50%) rotate(360deg); }
}
.a-galaxy-star {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  animation: star-pulse ease-in-out infinite alternate;
}

/* ===== 流星：拖尾划过 ===== */
.a-meteor {
  position: absolute;
  width: 50px; height: 2px;
  border-radius: 1px;
  animation: meteor-fly linear infinite;
}
@keyframes meteor-fly {
  0%   { transform: translate(0, 0) rotate(-35deg); opacity: 0; }
  8%   { opacity: 0.9; }
  70%  { opacity: 0.4; }
  100% { transform: translate(80px, 50px) rotate(-35deg); opacity: 0; }
}

/* ===== 霓虹闪烁：扫描线 ===== */
.a-neon {
  position: absolute;
  left: 0; width: 100%;
  height: 2px;
  animation: neon-sweep linear infinite;
}
@keyframes neon-sweep {
  0%   { opacity: 0; transform: scaleX(0.2) translateY(0); }
  40%  { opacity: 1; transform: scaleX(1) translateY(0); }
  60%  { opacity: 0.8; transform: scaleX(0.8) translateY(2px); }
  100% { opacity: 0; transform: scaleX(0.2) translateY(-2px); }
}

/* ===== 闪电：随机劈落 ===== */
.a-lightning {
  position: absolute;
  top: 0;
  width: 2px; height: 45%;
  animation: lightning-strike ease-in-out infinite;
}
@keyframes lightning-strike {
  0%, 75%, 100% { opacity: 0; }
  78%  { opacity: 0.5; }
  82%  { opacity: 0.1; }
  85%  { opacity: 1; }
  88%  { opacity: 0.2; }
  91%  { opacity: 0.8; }
  95%  { opacity: 0; }
}

/* ===== 魔法阵 ===== */
.a-magic-ring {
  position: absolute;
  left: 50%; top: 50%;
  width: 65px; height: 65px;
  transform: translate(-50%,-50%);
  border: 1.5px solid;
  border-radius: 50%;
  animation: magic-spin linear infinite;
}
.a-magic-ring-inner {
  width: 42px; height: 42px;
  animation-direction: reverse;
}
@keyframes magic-spin {
  0%   { transform: translate(-50%,-50%) rotate(0deg); opacity: 0.5; }
  50%  { opacity: 0.8; }
  100% { transform: translate(-50%,-50%) rotate(360deg); opacity: 0.5; }
}

/* ===== 涟漪：扩散环 ===== */
.a-ripple {
  position: absolute;
  left: 50%; top: 50%;
  width: 20px; height: 20px;
  transform: translate(-50%,-50%);
  border: 2px solid;
  border-radius: 50%;
  animation: ripple-expand ease-out infinite;
}
@keyframes ripple-expand {
  0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.7; }
  100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
}

/* ===== 脉冲：呼吸光 ===== */
.a-pulse {
  position: absolute;
  width: 55px; height: 55px;
  border-radius: 50%;
  animation: pulse-breathe ease-in-out infinite alternate;
}
@keyframes pulse-breathe {
  0%   { transform: scale(0.5); opacity: 0.2; }
  100% { transform: scale(1.5); opacity: 0.65; }
}

/* ===== 爱心漂浮：上浮+摇摆 ===== */
.a-heart {
  position: absolute;
  bottom: 0;
  font-size: 11px;
  animation: heart-rise ease-in-out infinite;
}
@keyframes heart-rise {
  0%   { transform: translateY(0) translateX(0) scale(0.7); opacity: 0; }
  10%  { opacity: 0.75; }
  30%  { transform: translateY(-30vh) translateX(var(--tx, 8px)) scale(1); }
  60%  { transform: translateY(-60vh) translateX(var(--tx2, -6px)) scale(0.9); }
  90%  { opacity: 0.2; }
  100% { transform: translateY(-100vh) translateX(var(--tx, 8px)) scale(0.5); opacity: 0; }
}

/* ===== 彩纸爆炸：四散+旋转 ===== */
.a-confetti {
  position: absolute;
  border-radius: 2px;
  animation: confetti-fly ease-out forwards;
}
@keyframes confetti-fly {
  0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx, 25px), var(--ty, -35px)) rotate(var(--rot, 720deg)) scale(0.3); opacity: 0; }
}

/* ===== 烟花：爆炸粒子 ===== */
.a-firework {
  position: absolute;
  width: 4px; height: 4px;
  border-radius: 50%;
  animation: firework-burst ease-out forwards;
}
@keyframes firework-burst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx, 25px), var(--ty, -25px)) scale(0); opacity: 0; }
}

/* ===== 霜花闪烁：结晶闪光+微移 ===== */
.a-frost {
  position: absolute;
  border-radius: 50%;
  animation: frost-sparkle ease-in-out infinite alternate;
}
@keyframes frost-sparkle {
  0%   { opacity: 0; transform: scale(0.2) translate(0, 0); }
  40%  { opacity: 0.9; transform: scale(1.4) translate(var(--tx, 3px), var(--ty, -3px)); }
  70%  { opacity: 0.5; transform: scale(0.8) translate(calc(var(--tx, 3px) * -0.5), calc(var(--ty, -3px) * -0.5)); }
  100% { opacity: 0; transform: scale(0.2) translate(var(--tx, 3px), var(--ty, -3px)); }
}

/* ===== 暗脉冲 ===== */
.a-dark-orb {
  position: absolute;
  left: 25%; top: 25%;
  width: 55px; height: 55px;
  border-radius: 50%;
  animation: dark-breathe ease-in-out infinite alternate;
}
.a-dark-orb-2 {
  left: auto; top: auto;
  right: 15%; bottom: 15%;
}
@keyframes dark-breathe {
  0%   { transform: scale(0.7); opacity: 0.2; }
  100% { transform: scale(1.4); opacity: 0.6; }
}
.a-dim-star {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  animation: dim-twinkle ease-in-out infinite alternate;
}
@keyframes dim-twinkle {
  0%   { opacity: 0.05; }
  50%  { opacity: 0.7; }
  100% { opacity: 0.05; }
}

/* ===== 超新星 ===== */
.a-supernova-core {
  position: absolute;
  left: 50%; top: 50%;
  width: 35px; height: 35px;
  transform: translate(-50%,-50%);
  border-radius: 50%;
  animation: supernova-flash ease-in-out infinite alternate;
}
@keyframes supernova-flash {
  0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0.4; }
  100% { transform: translate(-50%,-50%) scale(1.6); opacity: 1; }
}

/* ===== 彩虹 ===== */
.a-rainbow-band {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%,-50%);
  border: 3px solid transparent;
  border-top-color: inherit;
  border-radius: 50% 50% 0 0;
  animation: rainbow-glow ease-in-out infinite alternate;
}
@keyframes rainbow-glow {
  0%   { opacity: 0.2; transform: translate(-50%,-50%) scale(0.92); }
  100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1.08); }
}

/* ===== 日光 ===== */
.a-sun-core {
  position: absolute;
  left: 50%; top: 50%;
  width: 45px; height: 45px;
  transform: translate(-50%,-50%);
  border-radius: 50%;
  animation: sun-breathe ease-in-out infinite alternate;
}
@keyframes sun-breathe {
  0%   { transform: translate(-50%,-50%) scale(0.7); opacity: 0.4; }
  100% { transform: translate(-50%,-50%) scale(1.3); opacity: 0.9; }
}
.a-sun-ray {
  position: absolute;
  left: 50%; top: 50%;
  width: 2px; height: 55%;
  transform-origin: bottom center;
  animation: ray-sway ease-in-out infinite alternate;
}
@keyframes ray-sway {
  0%   { opacity: 0.2; }
  100% { opacity: 0.65; }
}

/* ===== 枫叶 ===== */
.a-maple {
  position: absolute;
  top: -18px;
  font-size: 11px;
  animation: maple-fall linear infinite;
}
@keyframes maple-fall {
  0%   { transform: translateY(-18px) translateX(0) rotate(0deg); opacity: 0; }
  8%   { opacity: 0.7; }
  25%  { transform: translateY(25vh) translateX(var(--tx, 12px)) rotate(calc(var(--rot, 90deg))); }
  50%  { transform: translateY(50vh) translateX(var(--tx2, -10px)) rotate(calc(var(--rot, 90deg) * 2)); }
  75%  { transform: translateY(75vh) translateX(var(--tx, 12px)) rotate(calc(var(--rot, 90deg) * 3)); }
  92%  { opacity: 0.2; }
  100% { transform: translateY(108vh) translateX(calc(var(--tx2, -10px) * 0.3)) rotate(calc(var(--rot, 90deg) * 4)); opacity: 0; }
}

/* ===== 薄雾 ===== */
.a-mist {
  position: absolute;
  left: -20%; width: 140%;
  height: 32%;
  animation: mist-drift ease-in-out infinite alternate;
  filter: blur(8px);
}
@keyframes mist-drift {
  0%   { transform: translateX(-8%); opacity: 0.25; }
  100% { transform: translateX(8%); opacity: 0.55; }
}

/* ===== 水晶折射 ===== */
.a-crystal {
  position: absolute;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: crystal-flash ease-in-out infinite alternate;
}
@keyframes crystal-flash {
  0%   { opacity: 0; transform: scale(0.4) rotate(0deg) translate(0, 0); }
  40%  { opacity: 0.85; transform: scale(1.1) rotate(8deg) translate(var(--tx, 3px), var(--ty, -3px)); }
  70%  { opacity: 0.4; transform: scale(0.7) rotate(-5deg) translate(calc(var(--tx, 3px) * -0.5), calc(var(--ty, -3px) * -0.5)); }
  100% { opacity: 0; transform: scale(0.4) rotate(0deg) translate(0, 0); }
}

/* ===== 齿轮 ===== */
.a-gear {
  position: absolute;
  width: 22px; height: 22px;
  border: 2px solid transparent;
  border-top-color: inherit;
  border-bottom-color: inherit;
  border-radius: 50%;
  animation: gear-spin linear infinite;
}
@keyframes gear-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== 音符漂浮 ===== */
.a-note {
  position: absolute;
  bottom: 0;
  font-size: 13px;
  animation: note-rise ease-in-out infinite;
}
@keyframes note-rise {
  0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.7; }
  30%  { transform: translateY(-30vh) translateX(var(--tx, 8px)) rotate(8deg); }
  60%  { transform: translateY(-60vh) translateX(var(--tx2, -6px)) rotate(-8deg); }
  90%  { opacity: 0.2; }
  100% { transform: translateY(-100vh) translateX(var(--tx, 8px)) rotate(12deg); opacity: 0; }
}

/* ===== 像素弹出 ===== */
.a-pixel {
  position: absolute;
  animation: pixel-blink step-end infinite;
}
@keyframes pixel-blink {
  0%   { opacity: 0; transform: scale(0); }
  25%  { opacity: 1; transform: scale(1.3); }
  50%  { opacity: 0; transform: scale(0); }
  75%  { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0; transform: scale(0); }
}

/* ===== 胶片颗粒 ===== */
.a-grain {
  position: absolute;
  animation: grain-flash step-end infinite;
}
@keyframes grain-flash {
  0%   { opacity: 0; }
  30%  { opacity: 0.5; }
  60%  { opacity: 0; }
  80%  { opacity: 0.3; }
  100% { opacity: 0; }
}

/* ===== 水墨扩散 ===== */
.a-ink {
  position: absolute;
  width: 35px; height: 35px;
  border-radius: 50%;
  animation: ink-grow ease-out infinite;
}
@keyframes ink-grow {
  0%   { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(3); opacity: 0; }
}

/* ===== 雨滴：斜落 ===== */
.a-rain {
  position: absolute;
  top: -10px;
  width: 1.5px; height: 14px;
  border-radius: 1px;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  0%   { transform: translateY(-10px) translateX(0); opacity: 0; }
  8%   { opacity: 0.65; }
  90%  { opacity: 0.25; }
  100% { transform: translateY(108vh) translateX(var(--tx, 5px)); opacity: 0; }
}

/* ===== 金色光 ===== */
.a-gold {
  position: absolute;
  border-radius: 50%;
  animation: gold-drift ease-in-out infinite alternate;
}
@keyframes gold-drift {
  0%   { opacity: 0; transform: scale(0.2) translate(0, 0); }
  35%  { opacity: 0.95; transform: scale(1.4) translate(var(--tx, 4px), var(--ty, -4px)); }
  65%  { opacity: 0.5; transform: scale(0.8) translate(calc(var(--tx, 4px) * -0.5), calc(var(--ty, -4px) * -0.5)); }
  100% { opacity: 0; transform: scale(0.2) translate(var(--tx, 4px), var(--ty, -4px)); }
}

/* ===== 蝴蝶飞舞 ===== */
.a-butterfly {
  position: absolute;
  font-size: 11px;
  animation: butterfly-wander ease-in-out infinite;
}
@keyframes butterfly-wander {
  0%   { transform: translate(0, 0) rotate(0deg); opacity: 0.2; }
  20%  { transform: translate(var(--tx, 12px), var(--ty, -10px)) rotate(6deg); opacity: 0.85; }
  40%  { transform: translate(var(--tx2, -8px), var(--ty2, 8px)) rotate(-4deg); opacity: 0.3; }
  60%  { transform: translate(calc(var(--tx, 12px) * 0.5), var(--ty, -10px)) rotate(5deg); opacity: 0.75; }
  80%  { transform: translate(var(--tx2, -8px), calc(var(--ty2, 8px) * -0.5)) rotate(-3deg); opacity: 0.25; }
  100% { transform: translate(0, 0) rotate(0deg); opacity: 0.2; }
}
</style>
