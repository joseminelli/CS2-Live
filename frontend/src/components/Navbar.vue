<template>
  <div>
    <header class="navbar-shell" :class="{ scrolled: isScrolled }">
      <div class="navbar-inner">
        <button @click="selectView('dashboard')" class="brand" aria-label="Ir para dashboard">
          <img src="/Cs2liveCut.png" alt="CS2 Live Logo" class="brand-icon">
        </button>

        <nav class="desktop-nav" aria-label="Navegacao principal">
          <button v-for="(item, index) in navItems" :key="item.id" @click="selectView(item.id)" class="nav-item"
            :class="{ active: activeView === item.id }" :aria-current="activeView === item.id ? 'page' : undefined"
            :title="item.label">
            <span class="nav-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-line" />
          </button>
        </nav>

        <div ref="searchRoot" class="global-search" @keydown.esc="closeSearch">
          <input v-model="searchQuery" class="global-search-input" type="text"
            placeholder="Busca global: time, campeonato ou partida..." @focus="openSearch">
          <span class="global-search-icon">⌕</span>

          <Transition name="search-panel">
            <div v-if="searchOpen" class="search-panel">
              <div class="search-shortcuts">
                <button class="shortcut-btn" @click="quickGo('live')">/live</button>
                <button class="shortcut-btn" @click="quickGo('upcoming')">/proximos</button>
                <button class="shortcut-btn" @click="quickGo('recent')">/resultados</button>
                <button class="shortcut-btn" @click="quickGo('favorites')">/favoritos</button>
                <button class="shortcut-btn" @click="quickGo('tournaments')">/torneios</button>
              </div>

              <p v-if="searchLoading" class="search-empty">Buscando...</p>
              <p v-else-if="searchQuery.trim() && searchResults.length === 0" class="search-empty">Nenhum resultado
                encontrado.</p>

              <TransitionGroup tag="div" name="search-result" class="search-results-list">
                <button v-for="(item, index) in searchResults" :key="item.id" class="search-result"
                  :style="{ '--search-result-index': index }" @click="selectSearchResult(item)">
                  <span class="result-type">{{ getResultTypeLabel(item.type) }}</span>
                  <span class="result-title">{{ item.title }}</span>
                  <span class="result-subtitle">{{ item.subtitle }}</span>
                </button>
              </TransitionGroup>
            </div>
          </Transition>
        </div>

        <div class="mobile-header-chip">
          <span class="chip-dot" />
          <span class="chip-label">{{ activeLabel }}</span>
        </div>
        <div ref="settingsRoot" class="settings-root">
          <button class="settings-btn" @click="toggleSettings" aria-label="Abrir configurações" title="Configurações">
            <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" stroke-width="3"
              stroke="#000000" fill="none">
              <path
                d="M45,14.67l-2.76,2a1,1,0,0,1-1,.11L37.65,15.3a1,1,0,0,1-.61-.76l-.66-3.77a1,1,0,0,0-1-.84H30.52a1,1,0,0,0-1,.77l-.93,3.72a1,1,0,0,1-.53.65l-3.3,1.66a1,1,0,0,1-1-.08l-3-2.13a1,1,0,0,0-1.31.12l-3.65,3.74a1,1,0,0,0-.13,1.26l1.87,2.88a1,1,0,0,1,.1.89L16.34,27a1,1,0,0,1-.68.63l-3.85,1.06a1,1,0,0,0-.74,1v4.74a1,1,0,0,0,.8,1l3.9.8a1,1,0,0,1,.72.57l1.42,3.15a1,1,0,0,1-.05.92l-2.13,3.63a1,1,0,0,0,.17,1.24L19.32,49a1,1,0,0,0,1.29.09L23.49,47a1,1,0,0,1,1-.1l3.74,1.67a1,1,0,0,1,.59.75l.66,3.79a1,1,0,0,0,1,.84h4.89a1,1,0,0,0,1-.86l.58-4a1,1,0,0,1,.58-.77l3.58-1.62a1,1,0,0,1,1,.09l3.14,2.12a1,1,0,0,0,1.3-.15L50,45.06a1,1,0,0,0,.09-1.27l-2.08-3a1,1,0,0,1-.09-1l1.48-3.43a1,1,0,0,1,.71-.59L53.77,35a1,1,0,0,0,.8-1V29.42a1,1,0,0,0-.8-1l-3.72-.78a1,1,0,0,1-.73-.62l-1.45-3.65a1,1,0,0,1,.11-.94l2.15-3.14A1,1,0,0,0,50,18l-3.71-3.25A1,1,0,0,0,45,14.67Z"
                stroke="#cfeee7" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="32.82" cy="31.94" r="9.94" stroke="#cfeee7" stroke-width="1" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>


            <span class="settings-label">Configurações</span>
          </button>
          <Transition name="settings-panel">
            <div v-if="settingsOpen" class="settings-panel">
              <button class="settings-item" @click="selectView('favorites'); closeSettings()">
                <span style="display:inline-flex;align-items:center;gap:8px">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
                      fill="#ffd86b" />
                  </svg>
                  Gerenciar Favoritos</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <div class="mobile-nav-hint">
      <span>Navegação rápida</span>
      <span>Toque em uma aba para mudar de área</span>
    </div>

    <nav class="mobile-dock" aria-label="Navegacao mobile">
      <button v-for="item in navItems" :key="item.id" @click="selectView(item.id)" class="dock-item"
        :class="{ active: activeView === item.id }" :aria-current="activeView === item.id ? 'page' : undefined"
        :title="item.label">
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
const searchRoot = ref(null)
const route = useRoute()
const router = useRouter()
let searchDebounceTimer = null
let removeDocumentClickListener = null

const navItems = [
  { id: 'dashboard', label: 'Inicio', mobileLabel: 'Início', icon: '🏠' },
  { id: 'live', label: 'Ao Vivo', mobileLabel: 'Ao vivo', icon: '🔴' },
  { id: 'upcoming', label: 'Próximos', mobileLabel: 'Próximos', icon: '📅' },
  { id: 'recent', label: 'Resultados', mobileLabel: 'Resultados', icon: '📊' },
  { id: 'tournaments', label: 'Torneios', mobileLabel: 'Torneios', icon: '🏆' },
]

const settingsOpen = ref(false)
const settingsRoot = ref(null)

const toggleSettings = () => {
  settingsOpen.value = !settingsOpen.value
}

const openSettings = () => { settingsOpen.value = true }
const closeSettings = () => { settingsOpen.value = false }

const activeLabel = computed(() => navItems.find((item) => item.id === activeView.value)?.label || 'Inicio')

const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const selectView = async (viewId) => {
  closeSearch()
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
  if (type === 'favorites') return 'FAVORITO'
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

  if (item.type === 'favorites') {
    await router.push({ name: 'favorites' })
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

  const handleDocumentClick = (event) => {
    // close search when clicking outside
    if (searchOpen.value) {
      if (searchRoot.value?.contains(event.target)) {
        // clicked inside search, keep open
      } else {
        closeSearch()
      }
    }

    // close settings when clicking outside
    if (settingsOpen.value) {
      if (settingsRoot.value?.contains(event.target)) {
        // inside settings, keep open
      } else {
        closeSettings()
      }
    }
  }

  document.addEventListener('click', handleDocumentClick)
  removeDocumentClickListener = () => {
    document.removeEventListener('click', handleDocumentClick)
  }
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
  if (removeDocumentClickListener) {
    removeDocumentClickListener()
    removeDocumentClickListener = null
  }
  if (searchDebounceTimer) {
    window.clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  settingsOpen.value = false
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
  /* width: min(94vw, 1400px); */
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

.search-panel-enter-active,
.search-panel-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 180ms ease;
  transform-origin: top center;
}

.search-panel-enter-from,
.search-panel-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.985);
  filter: blur(3px);
}

.search-panel-enter-to,
.search-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
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

.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  transform-origin: top center;
}

.search-result-enter-active,
.search-result-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 180ms ease;
}

.search-result-enter-active {
  transition-delay: calc(var(--search-result-index, 0) * 28ms);
}

.search-result-enter-from,
.search-result-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
  filter: blur(2px);
}

.search-result-enter-to,
.search-result-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.search-result-move {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
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

.mobile-nav-hint {
  display: none;
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

.settings-root {
  position: relative;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
}

.settings-btn {
  min-height: 42px;
  padding: 0 14px;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid rgba(64, 224, 208, 0.24);
  background: linear-gradient(180deg, rgba(64, 224, 208, 0.12) 0%, rgba(64, 224, 208, 0.05) 100%);
  color: #e8f8f5;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(64, 224, 208, 0.08);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.settings-label {
  line-height: 1;
}

.settings-panel {
  position: absolute;
  right: -20px;
  top: calc(100% + 25px);
  width: max-content;
  background: rgba(1, 10, 8, 0.96);
  border: 1px solid rgba(64, 224, 208, 0.24);
  border-radius: 10px;
  padding: 0px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 30;
}

.settings-item {
  background: transparent;
  color: #e9f7f4;
  border: 0;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
}

.settings-item:hover {
  background: rgba(64, 224, 208, 0.06);
}

.settings-btn:hover {
  border-color: rgba(64, 224, 208, 0.42);
  background: linear-gradient(180deg, rgba(64, 224, 208, 0.18) 0%, rgba(64, 224, 208, 0.08) 100%);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18), inset 0 0 0 1px rgba(64, 224, 208, 0.14);
  transform: translateY(-1px);
}

.settings-btn svg {
  flex-shrink: 0;
}

.settings-label {
  display: none;
}

.settings-btn {
  padding: 0;
  width: 42px;
}

@media (max-width: 1024px) {
  .navbar-shell {
    top: 10px;
    width: calc(100vw - 18px);
  }

  .settings-panel {
    right: -10px;
    top: calc(100% + 18px);
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

  .mobile-nav-hint {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    padding: 0 4px 8px;
    color: rgba(233, 247, 244, 0.62);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
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
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, color 180ms ease;
  }

  .dock-item:hover {
    transform: translateY(-1px);
    border-color: rgba(64, 224, 208, 0.28);
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

  .mobile-nav-hint {
    margin-top: 6px;
    padding-bottom: 6px;
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
