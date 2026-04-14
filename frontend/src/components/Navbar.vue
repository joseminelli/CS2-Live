<template>
  <div>
    <header class="navbar-shell" :class="{ scrolled: isScrolled }">
      <div class="navbar-inner">
        <button @click="selectView('dashboard')" class="brand" aria-label="Ir para dashboard">
          <img src="/Cs2liveCut.png" alt="CS2 Live Logo" class="brand-icon">
        </button>

        <nav class="desktop-nav" aria-label="Navegacao principal">
          <button
            v-for="(item, index) in navItems"
            :key="item.id"
            @click="selectView(item.id)"
            class="nav-item"
            :class="{ active: activeView === item.id }"
          >
            <span class="nav-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-line" />
          </button>
        </nav>

        <div class="mobile-header-chip">
          <span class="chip-dot" />
          <span class="chip-label">{{ activeLabel }}</span>
        </div>
      </div>
    </header>

    <nav class="mobile-dock" aria-label="Navegacao mobile">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="selectView(item.id)"
        class="dock-item"
        :class="{ active: activeView === item.id }"
      >
        <span class="dock-icon">{{ item.icon }}</span>
        <span class="dock-label">{{ item.mobileLabel || item.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const isScrolled = ref(false)
const activeView = ref('dashboard')
const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'dashboard', label: 'Inicio', mobileLabel: 'Home', icon: '🏠' },
  { id: 'live', label: 'Ao Vivo', mobileLabel: 'Live', icon: '🔴' },
  { id: 'upcoming', label: 'Próximos', mobileLabel: 'Prox', icon: '📅' },
  { id: 'recent', label: 'Resultados', mobileLabel: 'Recentes', icon: '📊' },
  { id: 'tournaments', label: 'Torneios', mobileLabel: 'Torneios', icon: '🏆' }
]

const activeLabel = computed(() => navItems.find((item) => item.id === activeView.value)?.label || 'Inicio')

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const selectView = async (viewId) => {
  activeView.value = viewId
  if (route.name !== viewId) {
    await router.push({ name: viewId })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  activeView.value = route.name || 'dashboard'
})

watch(
  () => route.name,
  (name) => {
    activeView.value = name || 'dashboard'
  },
  { immediate: true }
)

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.navbar-shell {
  position: fixed;
  top: 14px;
  left: 50%;
  width: min(94vw, 1240px);
  transform: translateX(-50%);
  z-index: 50;
  border-radius: 14px;
  border: 1px solid rgba(64, 224, 208, 0.26);
  background: linear-gradient(180deg, rgba(1, 10, 8, 0.88) 0%, rgba(1, 8, 7, 0.72) 100%);
  box-shadow: inset 0 0 20px rgba(64, 224, 208, 0.16), 0 8px 22px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(9px);
  animation: navbar-enter 700ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
}

.navbar-shell::after {
  content: '';
  position: absolute;
  inset: auto 16px 0 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(64, 224, 208, 0.72) 50%, transparent 100%);
}

.navbar-shell.scrolled {
  border-color: rgba(64, 224, 208, 0.42);
  background: linear-gradient(180deg, rgba(1, 10, 8, 0.96) 0%, rgba(1, 8, 7, 0.84) 100%);
}

.navbar-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  gap: 12px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #e9f7f4;
  cursor: pointer;
}

.brand-icon {
  width: 80px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-text {
  font-size: 1.08rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-style: italic;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-item {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #f2f6f5;
  cursor: pointer;
  padding: 7px 0;
}

.nav-index {
  font-size: 0.54rem;
  font-weight: 600;
  color: rgba(64, 224, 208, 0.55);
}

.nav-label {
  font-size: 0.88rem;
  font-style: italic;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.nav-line {
  position: absolute;
  left: 0;
  bottom: -5px;
  width: 0;
  height: 3px;
  background: #40e0d0;
  box-shadow: 0 0 12px rgba(64, 224, 208, 0.85), 0 0 2px rgba(64, 224, 208, 1);
  transition: width 260ms ease;
}


.nav-item:hover .nav-label,
.nav-item.active .nav-label {
  color: #66f6e8;
}

.nav-item:hover .nav-line,
.nav-item.active .nav-line {
  width: 100%;
}

.mobile-toggle {
  display: none;
}

.mobile-header-chip {
  display: none;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  padding: 7px 12px;
  border: 1px solid rgba(64, 224, 208, 0.28);
  background: rgba(64, 224, 208, 0.08);
  color: #cbf8f2;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #52efd7;
  box-shadow: 0 0 12px rgba(82, 239, 215, 0.65);
}

.mobile-dock {
  display: none;
}

@keyframes navbar-enter {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-26px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@media (max-width: 1024px) {
  .navbar-shell {
    top: 10px;
    width: calc(100vw - 18px);
  }

  .navbar-inner {
    height: 68px;
    padding: 0 12px;
  }

  .desktop-nav {
    display: none;
  }

  .mobile-header-chip {
    display: inline-flex;
  }

  .mobile-dock {
    position: fixed;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    width: min(96vw, 760px);
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    padding: 10px;
    border-radius: 18px;
    border: 1px solid rgba(64, 224, 208, 0.3);
    background: linear-gradient(180deg, rgba(1, 10, 8, 0.95) 0%, rgba(1, 8, 7, 0.9) 100%);
    backdrop-filter: blur(10px);
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(64, 224, 208, 0.12);
    z-index: 52;
  }

  .dock-item {
    border: 1px solid rgba(64, 224, 208, 0.12);
    border-radius: 12px;
    background: rgba(64, 224, 208, 0.02);
    color: #e8f8f5;
    min-height: 54px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    transition: all 180ms ease;
  }

  .dock-icon {
    font-size: 16px;
    line-height: 1;
  }

  .dock-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1;
  }

  .dock-item.active {
    border-color: rgba(64, 224, 208, 0.62);
    background: linear-gradient(180deg, rgba(64, 224, 208, 0.22) 0%, rgba(64, 224, 208, 0.12) 100%);
    color: #7afce5;
    box-shadow: 0 0 16px rgba(64, 224, 208, 0.3);
    transform: translateY(-2px);
  }

  .dock-item:active {
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .navbar-shell {
    top: 8px;
    width: calc(100vw - 12px);
    border-radius: 12px;
  }

  .brand-text {
    display: none;
  }

  .navbar-inner {
    height: 60px;
    padding: 0 10px;
  }

  .mobile-header-chip {
    padding: 6px 10px;
    font-size: 10px;
  }

  .mobile-dock {
    bottom: 10px;
    width: calc(100vw - 10px);
    padding: 8px;
    gap: 6px;
    border-radius: 14px;
  }

  .dock-item {
    min-height: 50px;
    border-radius: 10px;
  }

  .dock-icon {
    font-size: 15px;
  }

  .dock-label {
    font-size: 9px;
  }
}
</style>

