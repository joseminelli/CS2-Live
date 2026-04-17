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

        <div class="global-search" @keydown.esc="closeSearch">
          <input
            v-model="searchQuery"
            class="global-search-input"
            type="text"
            placeholder="Busca global: time, campeonato ou partida..."
            @focus="openSearch"
          >
          <span class="global-search-icon">⌕</span>

          <div v-if="searchOpen" class="search-panel">
            <div class="search-shortcuts">
              <button class="shortcut-btn" @click="quickGo('live')">/live</button>
              <button class="shortcut-btn" @click="quickGo('upcoming')">/proximos</button>
              <button class="shortcut-btn" @click="quickGo('recent')">/resultados</button>
              <button class="shortcut-btn" @click="quickGo('tournaments')">/torneios</button>
            </div>

            <p v-if="searchLoading" class="search-empty">Buscando...</p>
            <p v-else-if="searchQuery.trim() && searchResults.length === 0" class="search-empty">Nenhum resultado encontrado.</p>

            <button
              v-for="item in searchResults"
              :key="item.id"
              class="search-result"
              @click="selectSearchResult(item)"
            >
              <span class="result-type">{{ getResultTypeLabel(item.type) }}</span>
              <span class="result-title">{{ item.title }}</span>
              <span class="result-subtitle">{{ item.subtitle }}</span>
            </button>
          </div>
        </div>

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
import { searchGlobal } from '../services/globalSearch.js'

const isScrolled = ref(false)
const activeView = ref('dashboard')
const searchOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const route = useRoute()
const router = useRouter()
let searchDebounceTimer = null

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

const openSearch = () => {
  searchOpen.value = true
}

const closeSearch = () => {
  searchOpen.value = false
}

const getResultTypeLabel = (type) => {
  if (type === 'team') return 'TIME'
  if (type === 'championship') return 'TORNEIO'
  if (type === 'live') return 'LIVE'
  if (type === 'upcoming') return 'PROXIMO'
  if (type === 'recent') return 'RESULTADO'
  return 'ITEM'
}

const quickGo = async (name) => {
  closeSearch()
  await selectView(name)
}

const selectSearchResult = async (item) => {
  closeSearch()

  if (item.type === 'team') {
    await router.push({ name: 'upcoming', query: { q: item.title } })
    return
  }

  if (item.type === 'championship') {
    await router.push({ name: 'tournaments', query: { q: item.title } })
    return
  }

  if (item.type === 'live') {
    const token = item.payload?.opponents?.[0]?.opponent?.id
      || item.payload?.opponents?.[0]?.opponent?.slug
      || item.payload?.opponents?.[0]?.opponent?.name
      || ''
    await router.push({ name: 'live', query: token ? { team: String(token) } : {} })
    return
  }

  if (item.type === 'upcoming') {
    await router.push({ name: 'upcoming', query: { q: item.title } })
    return
  }

  await router.push({ name: 'recent', query: { q: item.title } })
}

const runSearch = async (value) => {
  const query = String(value || '').trim()
  if (!query) {
    searchResults.value = []
    return
  }

  searchLoading.value = true
  try {
    searchResults.value = await searchGlobal(query)
  } catch (_) {
    searchResults.value = []
  } finally {
    searchLoading.value = false
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
  if (searchDebounceTimer) {
    window.clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
})

watch(
  () => searchQuery.value,
  (value) => {
    if (searchDebounceTimer) {
      window.clearTimeout(searchDebounceTimer)
    }

    searchDebounceTimer = window.setTimeout(() => {
      runSearch(value)
    }, 240)
  }
)
</script>

<style scoped>
.navbar-shell {
  position: fixed;
  top: 14px;
  left: 50%;
  width: min(94vw, 1400px);
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

.global-search {
  position: relative;
  min-width: 290px;
  width: min(30vw, 420px);
}

.global-search-input {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(64, 224, 208, 0.26);
  background: rgba(64, 224, 208, 0.07);
  color: #e9f7f4;
  font-size: 13px;
  font-weight: 600;
  padding: 0 12px 0 34px;
}

.global-search-input:focus {
  outline: none;
  border-color: rgba(64, 224, 208, 0.58);
  box-shadow: 0 0 0 2px rgba(64, 224, 208, 0.15);
}

.global-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(64, 224, 208, 0.78);
  font-size: 13px;
}

.search-panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  border: 1px solid rgba(64, 224, 208, 0.3);
  border-radius: 12px;
  background: rgba(1, 10, 8, 0.96);
  backdrop-filter: blur(10px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  z-index: 20;
}

.search-shortcuts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.shortcut-btn {
  border: 1px solid rgba(64, 224, 208, 0.24);
  background: rgba(64, 224, 208, 0.08);
  color: #c9f9f1;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.search-empty {
  margin: 0;
  color: rgba(233, 247, 244, 0.75);
  font-size: 12px;
  padding: 4px 2px;
}

.search-result {
  border: 1px solid rgba(64, 224, 208, 0.14);
  background: rgba(64, 224, 208, 0.04);
  border-radius: 10px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    'type title'
    'type subtitle';
  column-gap: 8px;
  row-gap: 2px;
  align-items: center;
  text-align: left;
  padding: 8px;
  color: #e9f7f4;
  cursor: pointer;
}

.result-type {
  grid-area: type;
  font-size: 10px;
  font-weight: 800;
  color: rgba(64, 224, 208, 0.9);
}

.result-title {
  grid-area: title;
  font-size: 12px;
  font-weight: 700;
}

.result-subtitle {
  grid-area: subtitle;
  font-size: 11px;
  color: rgba(233, 247, 244, 0.72);
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

  .global-search {
    width: 100%;
    min-width: 0;
    max-width: 420px;
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

