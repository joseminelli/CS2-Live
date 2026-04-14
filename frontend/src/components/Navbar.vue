<template>
  <div>
    <header class="navbar-shell" :class="{ scrolled: isScrolled }">
      <div class="navbar-inner">
        <button @click="selectView('dashboard')" class="brand" aria-label="Ir para dashboard">
          <span class="brand-icon">⚡</span>
          <span class="brand-text">CS2 TRACKER</span>
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

        <button
          class="mobile-toggle"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          :aria-label="isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'"
          :aria-expanded="isMobileMenuOpen"
        >
          <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>

    <Transition name="mobile-slide">
      <div v-if="isMobileMenuOpen" class="mobile-panel" @click.self="isMobileMenuOpen = false">
        <div class="mobile-list">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="selectView(item.id)"
            class="mobile-item"
            :class="{ active: activeView === item.id }"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const activeView = ref('dashboard')
const route = useRoute()
const router = useRouter()

const navItems = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'live', label: 'Ao Vivo' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'recent', label: 'Resultados' },
  { id: 'tournaments', label: 'Torneios' },
  { id: 'teams', label: 'Times' }
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const selectView = async (viewId) => {
  activeView.value = viewId
  isMobileMenuOpen.value = false
  if (route.name !== viewId) {
    await router.push({ name: viewId })
  }
}

watch(isMobileMenuOpen, (val) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
})

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
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
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
  padding: 0 18px;
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
  width: 40px;
  height: 40px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #00110d;
  font-weight: 700;
  background: radial-gradient(circle at 30% 30%, #7cffdb 0%, #36dfbf 55%, #0fb59c 100%);
  box-shadow: 0 0 14px rgba(64, 224, 208, 0.48);
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

.nav-item.active::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border: 1px solid rgba(64, 224, 208, 0.6);
  box-shadow: 0 0 8px rgba(64, 224, 208, 0.45);
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
  border: 0;
  background: transparent;
  color: #ecfbf8;
  cursor: pointer;
}

.mobile-panel {
  position: fixed;
  inset: 0;
  top: 82px;
  z-index: 45;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
}

.mobile-list {
  margin: 10px auto 0;
  width: min(92vw, 640px);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 14px;
  padding: 10px;
  background: rgba(2, 10, 9, 0.9);
}

.mobile-item {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(64, 224, 208, 0.15);
  background: transparent;
  color: #f1f9f7;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.mobile-item.active,
.mobile-item:hover {
  color: #40e0d0;
  border-color: rgba(64, 224, 208, 0.45);
  background: rgba(64, 224, 208, 0.08);
}

.mobile-slide-enter-active,
.mobile-slide-leave-active {
  transition: opacity 240ms ease;
}

.mobile-slide-enter-from,
.mobile-slide-leave-to {
  opacity: 0;
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
  .desktop-nav {
    display: none;
  }

  .mobile-toggle {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .mobile-toggle:hover {
    background: rgba(64, 224, 208, 0.1);
  }
}

@media (max-width: 640px) {
  .brand-text {
    display: none;
  }

  .navbar-inner {
    height: 62px;
  }
}
</style>

