<script setup>
defineProps({ event: Object })
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="ev-modal">
      <div class="ev-mask" @click="emit('close')">
        <div class="ev-box" @click.stop>
          <div class="ev-icon">{{ event.icon }}</div>
          <div class="ev-title">{{ event.title }}</div>
          <div class="ev-desc">{{ event.desc }}</div>
          <div v-if="event.reward" class="ev-reward">{{ event.reward }}</div>
          <button class="ev-btn" @click="emit('close')">好的~</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ev-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.ev-box {
  background: #fff;
  border-radius: 28px;
  padding: 44px 52px;
  text-align: center;
  box-shadow: 0 32px 64px rgba(0,0,0,0.15);
  max-width: 380px;
}
.ev-icon { font-size: 64px; margin-bottom: 16px; }
.ev-title { font-size: 22px; font-weight: 800; color: #1a1a1a; margin-bottom: 10px; letter-spacing: 0.3px; }
.ev-desc { font-size: 14px; color: #666; line-height: 1.7; margin-bottom: 18px; }
.ev-reward {
  font-size: 16px; font-weight: 700; color: #ff6b8a;
  background: linear-gradient(135deg, #fff5f7, #fff0f3);
  padding: 10px 22px; border-radius: 14px;
  display: inline-block; margin-bottom: 22px;
  border: 1px solid rgba(255,107,138,0.1);
}
.ev-btn {
  display: inline-block;
  padding: 12px 36px;
  border: none; border-radius: 28px;
  font-size: 15px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #ff6b8a, #ffa07a);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255,107,138,0.3);
  transition: all 0.3s;
  letter-spacing: 0.5px;
}
.ev-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,107,138,0.4); }

.ev-modal-enter-active { animation: ev-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.ev-modal-leave-active { animation: ev-in 0.25s ease reverse; }
@keyframes ev-in {
  from { opacity: 0; transform: scale(0.85) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
