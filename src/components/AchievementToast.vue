<script setup>
defineProps({ text: String })
</script>

<template>
  <div class="toast">
    <span class="toast-icon">🏆</span>
    <span class="toast-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.toast {
  background: linear-gradient(135deg, #1a1a2e 0%, #2a2040 100%);
  color: #fff;
  padding: 16px 28px;
  border-radius: 18px;
  font-size: 14px;
  font-weight: 700;
  box-shadow:
    0 4px 12px rgba(0,0,0,0.15),
    0 16px 48px rgba(0,0,0,0.2),
    inset 0 1px 0 rgba(255,255,255,0.08);
  white-space: nowrap;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  letter-spacing: 0.3px;
  backdrop-filter: blur(12px);
}
.toast-icon { font-size: 20px; }
</style>
