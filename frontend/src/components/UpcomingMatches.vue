<template>
  <div class="upcoming-view">
    <div class="page-header">
      <h1 class="page-title">Próximos Jogos</h1>
      <p class="page-subtitle">Acompanhe os eventos CS2 agendados</p>
    </div>
    
    <div class="controls">
      <div class="filters-grid">
        <label class="filter-group search-group">
          <span class="filter-label">Busca Global</span>
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar time, liga ou campeonato..."
              class="search-input"
            >
            <span class="search-icon">🔍</span>
          </div>
        </label>

        <label class="filter-group">
          <span class="filter-label">Ordenar Resultados</span>
          <select v-model="sortBy" class="filter-select">
            <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>

      <p class="search-context">
        Quando voce pesquisa, o sistema busca em todas as partidas previstas para os proximos 30 dias.
      </p>
    </div>
    
    <div v-if="loading || globalSearchLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando...</p>
    </div>
    
    <div v-else-if="filteredMatches.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <p>Nenhum jogo encontrado</p>
      <p class="empty-hint">Tente ajustar seus filtros</p>
    </div>
    
    <div v-else class="matches-container">
      <div 
        v-for="match in filteredMatches" 
        :key="match.id" 
        class="match-card"
      >
        <div class="card-top">
          <span class="match-date">{{ formatDate(match.scheduled_at) }}</span>
          <div class="competition-meta">
            <span class="competition-primary">{{ getCompetition(match) }}</span>
            <span v-if="getPhase(match)" class="competition-phase">{{ getPhase(match) }}</span>
          </div>
        </div>
        
        <div class="card-content">
          <div class="team-info team-left">
            <button class="team-logo-btn" type="button" @click="openTeamModal(match.opponents[0]?.opponent)">
              <img 
                v-if="match.opponents[0]?.opponent?.image_url" 
                :src="match.opponents[0].opponent.image_url" 
                :alt="match.opponents[0].opponent.name"
                class="team-logo"
              >
              <div v-else class="team-logo-fallback">?</div>
            </button>
            <h3 class="team-name">{{ getTeamName(match.opponents[0]) }}</h3>
          </div>
          
          <div class="match-center">
            <span class="vs-text">vs</span>
            <div class="match-type">{{ getMatchType(match) }}</div>
          </div>
          
          <div class="team-info team-right">
            <h3 class="team-name">{{ getTeamName(match.opponents[1]) }}</h3>
            <button class="team-logo-btn" type="button" @click="openTeamModal(match.opponents[1]?.opponent)">
              <img 
                v-if="match.opponents[1]?.opponent?.image_url" 
                :src="match.opponents[1].opponent.image_url" 
                :alt="match.opponents[1].opponent.name"
                class="team-logo"
              >
              <div v-else class="team-logo-fallback">?</div>
            </button>
          </div>
        </div>
        
        <div class="card-bottom">
          <button class="btn-primary" @click="followMatch(match)">Acompanhar</button>
        </div>
      </div>
    </div>

    <TeamInfoModal v-model="teamModalOpen" :team="selectedTeam" />

    <div class="pagination" v-if="!loading && !globalSearchLoading && !searchQuery.trim() && matches.length > 0">
      <button class="pagination-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Anterior</button>
      <span class="pagination-info">Pagina {{ currentPage }}</span>
      <button class="pagination-btn" :disabled="!hasNextPage" @click="goToPage(currentPage + 1)">Proxima</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchesAPI } from '../api.js'
import { getCompetitionName, getPhaseName, getTeamName } from '../utils/matchDisplay.js'
import { getCompetitionPriority } from '../utils/matchDisplay.js'
import TeamInfoModal from './TeamInfoModal.vue'

const route = useRoute()
const router = useRouter()

const matches = ref([])
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('importance-date')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageSize = 20
const teamModalOpen = ref(false)
const selectedTeam = ref({})
const globalSearchMatches = ref([])
const globalSearchLoading = ref(false)
const hasGlobalSearchDataset = ref(false)
const isApplyingRouteQuery = ref(false)
const pendingTeamToken = ref('')
const SEARCH_WINDOW_DAYS = 30
const GLOBAL_SEARCH_PAGE_SIZE = 50
const GLOBAL_SEARCH_MAX_PAGES = 8

const sortOptions = [
  { key: 'importance-date', label: 'Campeonatos Importantes + Proximidade' },
  { key: 'date', label: 'Data mais proxima' },
  { key: 'league', label: 'Liga e campeonato' },
  { key: 'team', label: 'Nome do time' }
]

const allowedSortKeys = new Set(sortOptions.map((option) => option.key))

const formatDate = (date) => {
  if (!date) return 'TBD'
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCompetition = (match) => {
  return getCompetitionName(match)
}

const getPhase = (match) => {
  return getPhaseName(match)
}

const getMatchType = (match) => {
  return match.match_type === 'best_of_three' ? 'BO3' : match.match_type === 'best_of_five' ? 'BO5' : 'BO1'
}

const normalizeText = (value) => String(value || '').trim()

const isDefinedTeamName = (value) => {
  const name = normalizeText(value)
  if (!name) return false
  return !/^tbd$/i.test(name) && name !== '?'
}

const hasDefinedTeams = (match) => {
  const teamA = getTeamName(match?.opponents?.[0])
  const teamB = getTeamName(match?.opponents?.[1])
  return isDefinedTeamName(teamA) && isDefinedTeamName(teamB)
}

const normalizeTeamToken = (value) => String(value || '').trim().toLowerCase()

const getTeamQueryToken = (team) => {
  if (team?.id != null) return String(team.id)
  if (team?.slug) return String(team.slug)
  if (team?.name) return String(team.name)
  return ''
}

const findTeamByToken = (token) => {
  const normalized = normalizeTeamToken(token)
  if (!normalized) return null

  const pools = [matches.value, globalSearchMatches.value]
  for (const pool of pools) {
    for (const match of pool) {
      const opponents = Array.isArray(match?.opponents) ? match.opponents : []
      for (const item of opponents) {
        const team = item?.opponent || item
        if (!team) continue

        const byId = team.id != null && String(team.id) === normalized
        const bySlug = normalizeTeamToken(team.slug) === normalized
        const byName = normalizeTeamToken(team.name) === normalized

        if (byId || bySlug || byName) return team
      }
    }
  }

  return null
}

const parseSort = (value) => {
  const sort = String(value || '')
  return allowedSortKeys.has(sort) ? sort : 'importance-date'
}

const buildSyncedQuery = () => {
  const next = {}
  if (currentPage.value > 1) next.page = String(currentPage.value)
  if (searchQuery.value.trim()) next.q = searchQuery.value.trim()
  if (sortBy.value !== 'importance-date') next.sort = sortBy.value

  if (teamModalOpen.value && selectedTeam.value?.name) {
    const token = getTeamQueryToken(selectedTeam.value)
    if (token) next.team = token
  }

  return next
}

const syncRouteQueryFromState = async () => {
  const nextQuery = buildSyncedQuery()
  if (JSON.stringify(nextQuery) === JSON.stringify(route.query)) return
  await router.replace({ query: nextQuery })
}

const applyRouteQueryToState = (query) => {
  isApplyingRouteQuery.value = true

  const nextPage = parsePage(query.page)
  if (nextPage !== currentPage.value) currentPage.value = nextPage

  const nextSearch = String(query.q || '').trim()
  if (nextSearch !== searchQuery.value) searchQuery.value = nextSearch

  const nextSort = parseSort(query.sort)
  if (nextSort !== sortBy.value) sortBy.value = nextSort

  pendingTeamToken.value = String(query.team || '').trim()
  if (!pendingTeamToken.value && teamModalOpen.value) {
    teamModalOpen.value = false
  }

  isApplyingRouteQuery.value = false
}

const openTeamModal = async (team, syncUrl = true) => {
  if (!team?.name) return
  selectedTeam.value = team
  teamModalOpen.value = true

  if (syncUrl && !isApplyingRouteQuery.value) {
    await syncRouteQueryFromState()
  }
}

const followMatch = (match) => {
  const stream = match?.streams_list?.find((item) => item?.official)
    || match?.streams_list?.find((item) => item?.main)
    || match?.streams_list?.[0]

  if (stream?.raw_url) {
    window.open(stream.raw_url, '_blank')
    return
  }

  if (stream?.embed_url) {
    window.open(stream.embed_url, '_blank')
    return
  }

  const q = getCompetition(match)
  router.push({
    name: 'tournaments',
    query: q ? { q } : {}
  })
}

const filteredMatches = computed(() => {
  const baseData = searchQuery.value.trim()
    ? (hasGlobalSearchDataset.value ? globalSearchMatches.value : [])
    : matches.value

  let result = baseData.filter(hasDefinedTeams)
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      m.opponents[0]?.opponent?.name?.toLowerCase().includes(query) ||
      m.opponents[1]?.opponent?.name?.toLowerCase().includes(query) ||
      getCompetition(m).toLowerCase().includes(query) ||
      getPhase(m).toLowerCase().includes(query) ||
      (m.league?.name || '').toLowerCase().includes(query) ||
      (m.serie?.full_name || m.serie?.name || '').toLowerCase().includes(query) ||
      (m.tournament?.full_name || m.tournament?.name || '').toLowerCase().includes(query)
    )
  }

  if (sortBy.value === 'league') {
    result = [...result].sort((a, b) => 
      getCompetitionPriority(b) - getCompetitionPriority(a) || (a.league?.name || '').localeCompare(b.league?.name || '')
    )
  } else if (sortBy.value === 'team') {
    result = [...result].sort((a, b) => 
      getCompetitionPriority(b) - getCompetitionPriority(a) || (a.opponents[0]?.opponent?.name || '').localeCompare(b.opponents[0]?.opponent?.name || '')
    )
  } else if (sortBy.value === 'importance-date') {
    result = [...result].sort((a, b) => 
      getCompetitionPriority(b) - getCompetitionPriority(a) || new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0)
    )
  } else {
    result = [...result].sort((a, b) => 
      new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0)
    )
  }
  
  return result
})

const ensureGlobalSearchDataset = async () => {
  if (hasGlobalSearchDataset.value || globalSearchLoading.value) return

  globalSearchLoading.value = true
  try {
    const now = Date.now()
    const upperLimit = now + (SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const collected = []

    for (let page = 1; page <= GLOBAL_SEARCH_MAX_PAGES; page += 1) {
      const response = await matchesAPI.getUpcoming({
        all: false,
        per_page: GLOBAL_SEARCH_PAGE_SIZE,
        page,
        sort: 'scheduled_at'
      })

      const pageItems = Array.isArray(response.data) ? response.data : []
      if (pageItems.length === 0) break

      pageItems.forEach((match) => {
        const timestamp = Date.parse(match?.scheduled_at)
        if (Number.isFinite(timestamp) && timestamp <= upperLimit) {
          collected.push(match)
        }
      })

      const lastDate = Date.parse(pageItems[pageItems.length - 1]?.scheduled_at)
      if (!Number.isFinite(lastDate) || lastDate > upperLimit || pageItems.length < GLOBAL_SEARCH_PAGE_SIZE) {
        break
      }
    }

    globalSearchMatches.value = collected
    hasGlobalSearchDataset.value = true
  } finally {
    globalSearchLoading.value = false
  }
}

onMounted(async () => {
  try {
    applyRouteQueryToState(route.query)
    if (searchQuery.value.trim()) {
      await ensureGlobalSearchDataset()
    }
    await fetchMatches()
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
  } finally {
    loading.value = false
  }
})

const parsePage = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const syncPageFromUrl = () => {
  currentPage.value = parsePage(route.query.page)
}

const fetchMatches = async () => {
  loading.value = true
  const response = await matchesAPI.getUpcoming({
    all: false,
    per_page: pageSize,
    page: currentPage.value
  })
  matches.value = response.data || []
  hasNextPage.value = matches.value.length === pageSize

  const token = pendingTeamToken.value || String(route.query.team || '').trim()
  if (token) {
    const team = findTeamByToken(token)
    if (team) {
      isApplyingRouteQuery.value = true
      try {
        await openTeamModal(team, false)
      } finally {
        isApplyingRouteQuery.value = false
      }
      pendingTeamToken.value = ''
    }
  }

  loading.value = false
}

const goToPage = (page) => {
  currentPage.value = parsePage(page)
  syncRouteQueryFromState()
}

watch(
  () => route.query.page,
  async () => {
    syncPageFromUrl()
    await fetchMatches()
  }
)

watch(
  () => route.query,
  async (query) => {
    applyRouteQueryToState(query)

    if (searchQuery.value.trim()) {
      await ensureGlobalSearchDataset()
    }
  },
  { immediate: true }
)

watch(
  () => searchQuery.value,
  async (value) => {
    if (value.trim()) {
      await ensureGlobalSearchDataset()
    }

    if (!isApplyingRouteQuery.value) {
      currentPage.value = 1
      await syncRouteQueryFromState()
    }
  }
)

watch(
  () => sortBy.value,
  async () => {
    if (isApplyingRouteQuery.value) return
    await syncRouteQueryFromState()
  }
)

watch(
  () => teamModalOpen.value,
  async (open) => {
    if (isApplyingRouteQuery.value) return
    if (!open) {
      await syncRouteQueryFromState()
      return
    }

    if (selectedTeam.value?.name) {
      await syncRouteQueryFromState()
    }
  }
)
</script>

<style scoped>
.upcoming-view {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-title {
  font-size: 42px;
  font-weight: 800;
  margin: 0;
  color: #e4e4e7;
}

.page-subtitle {
  font-size: 18px;
  color: rgba(228, 228, 231, 0.6);
  margin: 0;
}

.controls {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1.5fr minmax(220px, 0.8fr);
  gap: 14px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-group {
  min-width: 0;
}

.filter-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(228, 228, 231, 0.72);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.filter-select {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background: rgba(64, 224, 208, 0.08);
  border: 1px solid rgba(64, 224, 208, 0.24);
  color: #e4e4e7;
  font-size: 14px;
  font-weight: 600;
  padding: 0 12px;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(64, 224, 208, 0.5);
}

.filter-select option {
  background: #06211d;
  color: #e4e4e7;
}

.search-context {
  margin: 0;
  font-size: 13px;
  color: rgba(228, 228, 231, 0.62);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  background: rgba(64, 224, 208, 0.05);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 10px;
  color: #e4e4e7;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(228, 228, 231, 0.4);
}

.search-input:focus {
  outline: none;
  border-color: rgba(64, 224, 208, 0.4);
  background: rgba(64, 224, 208, 0.08);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(64, 224, 208, 0.2);
  border-top-color: #40e0d0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pagination {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.pagination-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(64, 224, 208, 0.4);
  background: rgba(64, 224, 208, 0.16);
  color: #dffaf4;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  font-weight: 600;
  color: rgba(228, 228, 231, 0.8);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 15px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  opacity: 0.3;
}

.empty-state p {
  margin: 0;
  color: rgba(228, 228, 231, 0.6);
  font-size: 16px;
}

.empty-hint {
  color: rgba(228, 228, 231, 0.4) !important;
  font-size: 14px !important;
}

.matches-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
  gap: 18px;
}

.match-card {
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.match-card:hover {
  border-color: rgba(64, 224, 208, 0.4);
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.12) 0%, rgba(30, 144, 255, 0.12) 100%);
  transform: translateY(-2px);
}

.card-top {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(64, 224, 208, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-date {
  font-size: 13px;
  font-weight: 600;
  color: rgba(64, 224, 208, 0.8);
  font-family: 'Courier New', monospace;
}

.league-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  background: rgba(64, 224, 208, 0.15);
  color: #40e0d0;
  border-radius: 4px;
  text-transform: uppercase;
}

.card-content {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.team-info.team-right {
  flex-direction: column-reverse;
}

.team-logo-btn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}

.team-logo {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  object-fit: contain;
  background: rgb(20 73 67 / 30%);
  padding: 4px;
  border: 1px solid rgba(64, 224, 208, 0.15);
}

.team-logo-fallback {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 900;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.team-name {
  font-size: 15px;
  font-weight: 700;
  color: #e4e4e7;
  text-align: center;
  margin: 0;
  line-height: 1.3;
  max-width: 140px;
}

.match-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vs-text {
  font-size: 12px;
  font-weight: 700;
  color: rgba(64, 224, 208, 0.6);
  text-transform: uppercase;
}

.match-type {
  font-size: 13px;
  font-weight: 700;
  color: #40e0d0;
  background: rgba(64, 224, 208, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

.card-bottom {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(64, 224, 208, 0.1);
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: rgba(64, 224, 208, 0.2);
  border: 1px solid rgba(64, 224, 208, 0.4);
  color: #40e0d0;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-primary:hover {
  background: rgba(64, 224, 208, 0.3);
  border-color: rgba(64, 224, 208, 0.6);
  box-shadow: 0 0 15px rgba(64, 224, 208, 0.3);
}

@media (max-width: 1024px) {
  .matches-container {
    grid-template-columns: 1fr;
  }

  .card-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .match-center {
    flex-direction: row;
    justify-content: center;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }
  
  .controls {
    gap: 12px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 10px;
  }

  .filters-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .card-content {
    padding: 16px;
  }

  .card-top,
  .card-bottom {
    padding: 10px 14px;
  }

  .team-logo,
  .team-logo-fallback {
    width: 62px;
    height: 62px;
  }

  .team-name {
    max-width: 110px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .filters-panel {
    padding: 14px;
  }

  .matches-container {
    gap: 12px;
  }

  .card-content {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }

  .team-info,
  .team-info.team-right {
    flex-direction: row;
    justify-content: center;
    gap: 10px;
  }

  .team-name {
    max-width: 130px;
    text-align: left;
  }

  .match-center {
    gap: 6px;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .card-bottom {
    justify-content: stretch;
  }
}
</style>
