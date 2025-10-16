<template>
  <div class="logo-title" role="img" aria-label="Mighty Agent">
    <img class="logo" :src="logo" alt="Mighty Agent logo" />
  </div>
</template>
<script setup>
import logo from '@/assets/svg/mighty-agent-logo.svg'
</script>
<style scoped>
.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

.logo-title .logo {
  width: 168px;
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(32, 210, 255, 0.25));
  transition: transform 0.25s ease, filter 0.25s ease;
}

.logo-title .logo:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 12px 35px rgba(32, 210, 255, 0.35));
}
</style>
