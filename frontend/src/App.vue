<template>
  <div id="app" class="app-container">
    <div class="ambient-layer" aria-hidden="true">
      <span
        v-for="particle in ambientParticles"
        :key="particle.id"
        class="ambient-particle"
        :class="particle.variant"
        :style="particle.style"
      >
        <img class="ambient-icon" :src="particle.src" :alt="''">
      </span>
      <div class="ambient-sweep ambient-sweep-left" />
      <div class="ambient-sweep ambient-sweep-right" />
      <div class="ambient-haze" />
    </div>

    <Navbar />
    
    <main class="main-content">
      <RouterView />
    </main>
    
    <Footer />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const ambientParticles = [
  { id: 1, src: `${import.meta.env.BASE_URL}assets/icons/icon1.png`, variant: 'icon-large', style: 'left: 8%; top: 18%; animation-delay: 0s; animation-duration: 18s;' },
  { id: 2, src: `${import.meta.env.BASE_URL}assets/icons/icon2.png`, variant: 'icon-large', style: 'left: 76%; top: 12%; animation-delay: -3s; animation-duration: 22s;' },
  { id: 3, src: `${import.meta.env.BASE_URL}assets/icons/icon3.png`, variant: 'icon-medium', style: 'left: 18%; top: 42%; animation-delay: -6s; animation-duration: 20s;' },
  { id: 4, src: `${import.meta.env.BASE_URL}assets/icons/icon4.png`, variant: 'icon-medium', style: 'left: 84%; top: 38%; animation-delay: -9s; animation-duration: 24s;' },
  { id: 5, src: `${import.meta.env.BASE_URL}assets/icons/icon5.png`, variant: 'icon-wide', style: 'left: 64%; top: 72%; animation-delay: -4s; animation-duration: 26s;' },
  { id: 6, src: `${import.meta.env.BASE_URL}assets/icons/icon6.png`, variant: 'icon-wide', style: 'left: 14%; top: 74%; animation-delay: -12s; animation-duration: 28s;' },
  { id: 7, src: `${import.meta.env.BASE_URL}assets/icons/icon7.png`, variant: 'icon-large', style: 'left: 48%; top: 20%; animation-delay: -8s; animation-duration: 30s;' },
  { id: 8, src: `${import.meta.env.BASE_URL}assets/icons/icon8.png`, variant: 'icon-medium', style: 'left: 56%; top: 54%; animation-delay: -2s; animation-duration: 19s;' }
]

</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'InterVariable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
  background: #030807;
  color: #e4e4e7;
  overflow-x: hidden;
  min-height: 100vh;
  font-size: 16px;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

.ambient-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.ambient-layer::before,
.ambient-layer::after {
  content: '';
  position: absolute;
  inset: -10%;
  background-repeat: repeat;
}

.ambient-layer::before {
  background-image:
    radial-gradient(circle at 15% 20%, rgba(67, 203, 156, 0.12) 0 2px, transparent 3px),
    radial-gradient(circle at 82% 14%, rgba(111, 249, 209, 0.12) 0 1.5px, transparent 3px),
    radial-gradient(circle at 70% 78%, rgba(67, 203, 156, 0.08) 0 2px, transparent 4px);
  background-size: 260px 260px, 320px 320px, 420px 420px;
  opacity: 0.55;
  animation: ambient-drift 42s linear infinite;
}

.ambient-layer::after {
  background-image:
    linear-gradient(115deg, transparent 0 44%, rgba(67, 203, 156, 0.04) 45%, transparent 46%),
    linear-gradient(65deg, transparent 0 52%, rgba(67, 203, 156, 0.03) 53%, transparent 54%);
  background-size: 620px 620px, 760px 760px;
  opacity: 0.45;
  animation: ambient-drift-reverse 58s linear infinite;
}

.ambient-particle {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  filter: none;
  animation: particle-float linear infinite;
  opacity: 0.32;
  user-select: none;
  -webkit-user-select: none;
}

.ambient-particle::before {
  content: none;
}

.ambient-particle.icon-wide {
  width: auto;
  min-width: 82px;
  padding: 0;
  height: 54px;
  border-radius: 0;
}

.ambient-particle.icon-medium {
  width: 56px;
  height: 56px;
}

.ambient-particle.icon-large {
  width: 72px;
  height: 72px;
}

.ambient-icon {
  position: relative;
  z-index: 1;
  width: 76%;
  height: 76%;
  object-fit: contain;
  filter: saturate(1.05) contrast(1.02);
  opacity: 0.72;
  animation: icon-pulse 4.8s ease-in-out infinite;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
}

.ambient-sweep {
  position: absolute;
  inset: auto auto 0 0;
  width: 52vw;
  height: 2px;
  transform-origin: left center;
  background: linear-gradient(90deg, transparent 0%, rgba(67, 203, 156, 0.22) 25%, rgba(111, 249, 209, 0.42) 50%, rgba(67, 203, 156, 0.22) 75%, transparent 100%);
  filter: blur(0.4px);
  opacity: 0.38;
  animation: sweep-glide 32s ease-in-out infinite;
}

.ambient-sweep-left {
  top: 22%;
  left: -8%;
}

.ambient-sweep-right {
  top: 70%;
  right: -10%;
  left: auto;
  animation-direction: reverse;
}

.ambient-haze {
  position: absolute;
  inset: auto 10% 8% 10%;
  height: 220px;
  background: radial-gradient(circle at 50% 50%, rgba(67, 203, 156, 0.12), transparent 62%);
  filter: blur(22px);
  opacity: 0.8;
  animation: haze-breathe 9s ease-in-out infinite;
}

.app-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 50% 85%, rgba(67, 203, 156, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 20% 25%, rgba(67, 203, 156, 0.06) 0%, transparent 35%);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

footer {
  position: relative;
  z-index: 1;
}

.main-content {
  flex: 1;
  padding: 150px 32px 60px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  z-index: 1;
}

@media (max-width: 1024px) {
  .main-content {
    padding: 128px 20px 110px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 108px 14px 100px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 96px 10px 92px;
  }
}

@keyframes ambient-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-3%, 2%, 0) scale(1.04);
  }
}

@keyframes ambient-drift-reverse {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(2%, -2%, 0) scale(1.05);
  }
}

@keyframes particle-float {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 0.24;
  }
  25% {
    opacity: 0.62;
  }
  50% {
    transform: translate3d(18px, -26px, 0) rotate(8deg);
    opacity: 0.56;
  }
  75% {
    opacity: 0.7;
  }
  100% {
    transform: translate3d(-8px, -54px, 0) rotate(-4deg);
    opacity: 0.28;
  }
}

@keyframes icon-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.86;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes sweep-glide {
  0%,
  100% {
    transform: translateX(0) scaleX(1);
    opacity: 0.25;
  }
  50% {
    transform: translateX(5vw) scaleX(1.08);
    opacity: 0.55;
  }
}

@keyframes haze-breathe {
  0%,
  100% {
    transform: scale(0.98);
    opacity: 0.45;
  }
  50% {
    transform: scale(1.03);
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-layer::before,
  .ambient-layer::after,
  .ambient-particle,
  .ambient-icon,
  .ambient-sweep,
  .ambient-haze {
    animation: none !important;
  }
}
</style>

