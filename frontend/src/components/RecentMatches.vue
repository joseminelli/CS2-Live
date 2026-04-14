<template>
  <div class="recent-view">
    <div class="page-header">
      <h1 class="page-title">Resultados Recentes</h1>
      <p class="page-subtitle">Acompanhe os resultados finalizados de CS2</p>
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
        A busca considera partidas finalizadas dos ultimos 30 dias.
      </p>
    </div>
    
    <div v-if="loading || globalSearchLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando resultados...</p>
    </div>
    
    <div v-else-if="filteredMatches.length === 0" class="empty-state">
      <div class="empty-icon">📈</div>
      <p>Nenhum resultado encontrado</p>
      <p class="empty-hint">Tente ajustar seus filtros</p>
    </div>
    
    <div v-else class="matches-container">
      <div 
        v-for="match in filteredMatches" 
        :key="match.id" 
        class="match-card"
      >
        <div class="card-top">
          <span class="match-date">{{ formatDate(match.ended_at || match.scheduled_at) }}</span>
          <div class="competition-meta">
            <span class="competition-primary">{{ getCompetition(match) }}</span>
            <span v-if="getPhase(match)" class="competition-phase">{{ getPhase(match) }}</span>
          </div>
        </div>
        
        <div class="card-content">
          <div class="team-section team-left" :class="{ winner: isWinner(match, 0) }">
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
            <span v-if="isWinner(match, 0)" class="winner-badge">VENCEDOR</span>
          </div>
          
          <div class="score-display">
            <div class="score-box" :class="{ winner: isWinner(match, 0) }">
              <span class="score-digit">{{ match.results[0]?.score || '0' }}</span>
            </div>
            <div class="match-divider">:</div>
            <div class="score-box" :class="{ winner: isWinner(match, 1) }">
              <span class="score-digit">{{ match.results[1]?.score || '0' }}</span>
            </div>
          </div>
          
          <div class="team-section team-right" :class="{ winner: isWinner(match, 1) }">
            <span v-if="isWinner(match, 1)" class="winner-badge">VENCEDOR</span>
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
          <div v-if="match.streams_list && match.streams_list.length > 0" class="streams-buttons">
            <button 
              v-for="(stream, index) in match.streams_list" 
              :key="index"
              @click="openStream(stream)"
              class="btn-stream"
              :title="stream.language"
            >
              {{ getStreamName(stream) }}
            </button>
          </div>
          <div v-else class="no-streams">
            Sem replay disponível
          </div>
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
const sortBy = ref('date')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageSize = 20
const teamModalOpen = ref(false)
const selectedTeam = ref({})
const globalSearchMatches = ref([])
const globalSearchLoading = ref(false)
const hasGlobalSearchDataset = ref(false)
const SEARCH_WINDOW_DAYS = 30
const GLOBAL_SEARCH_PAGE_SIZE = 50
const GLOBAL_SEARCH_MAX_PAGES = 8

const sortOptions = [
  { key: 'date', label: 'Mais recentes' },
  { key: 'league', label: 'Liga e campeonato' },
  { key: 'team', label: 'Nome do time' }
]

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

const isWinner = (match, opponentIndex) => {
  if (!match.results || match.results.length < 2) return false
  const scores = [match.results[0]?.score, match.results[1]?.score]
  if (opponentIndex === 0) return scores[0] > scores[1]
  return scores[1] > scores[0]
}

const openTeamModal = (team) => {
  if (!team?.name) return
  selectedTeam.value = team
  teamModalOpen.value = true
}

const watchReplay = (match) => {
  if (match.streams_list && match.streams_list.length > 0) {
    // Procurar por stream oficial, depois main, depois o primeiro disponível
    let stream = match.streams_list.find(s => s.official) || 
                 match.streams_list.find(s => s.main) || 
                 match.streams_list[0]
    
    if (stream.raw_url) {
      window.open(stream.raw_url, '_blank')
    } else if (stream.embed_url) {
      window.open(stream.embed_url, '_blank')
    }
  } else {
    alert('Replay não disponível para este jogo')
  }
}

const getStreamName = (stream) => {
  if (stream.raw_url) {
    const url = stream.raw_url.toLowerCase()
    if (url.includes('twitch')) {
      const match = url.match(/twitch\.tv\/([^/?]+)/)
      if (match) return `🎮 ${match[1].toUpperCase()}`
      return '🎮 Twitch'
    } else if (url.includes('youtube')) {
      return '▶️ YouTube'
    } else if (url.includes('youtube.com')) {
      return '▶️ YouTube'
    }
  }
  if (stream.embed_url && stream.embed_url.includes('youtube')) {
    return '▶️ YouTube'
  }
  return `📺 Stream ${stream.language?.toUpperCase() || ''}`
}

const openStream = (stream) => {
  if (stream.raw_url) {
    window.open(stream.raw_url, '_blank')
  } else if (stream.embed_url) {
    window.open(stream.embed_url, '_blank')
  }
}

const filteredMatches = computed(() => {
  const baseData = searchQuery.value.trim()
    ? (hasGlobalSearchDataset.value ? globalSearchMatches.value : [])
    : matches.value

  let result = baseData
  
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
      getCompetitionPriority(b) - getCompetitionPriority(a) || (b.league?.name || '').localeCompare(a.league?.name || '')
    )
  } else if (sortBy.value === 'team') {
    result = [...result].sort((a, b) => 
      getCompetitionPriority(b) - getCompetitionPriority(a) || (b.opponents[0]?.opponent?.name || '').localeCompare(a.opponents[0]?.opponent?.name || '')
    )
  } else {
    result = [...result].sort((a, b) => 
      getCompetitionPriority(b) - getCompetitionPriority(a) || new Date(b.ended_at || b.scheduled_at) - new Date(a.ended_at || a.scheduled_at)
    )
  }
  
  return result
})

const ensureGlobalSearchDataset = async () => {
  if (hasGlobalSearchDataset.value || globalSearchLoading.value) return

  globalSearchLoading.value = true
  try {
    const now = Date.now()
    const lowerLimit = now - (SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const collected = []

    for (let page = 1; page <= GLOBAL_SEARCH_MAX_PAGES; page += 1) {
      const response = await matchesAPI.getRecent({
        all: false,
        per_page: GLOBAL_SEARCH_PAGE_SIZE,
        page,
        sort: '-scheduled_at'
      })

      const pageItems = Array.isArray(response.data) ? response.data : []
      if (pageItems.length === 0) break

      pageItems.forEach((match) => {
        const timestamp = Date.parse(match?.ended_at || match?.scheduled_at)
        if (Number.isFinite(timestamp) && timestamp >= lowerLimit) {
          collected.push(match)
        }
      })

      const lastDate = Date.parse(pageItems[pageItems.length - 1]?.ended_at || pageItems[pageItems.length - 1]?.scheduled_at)
      if (!Number.isFinite(lastDate) || lastDate < lowerLimit || pageItems.length < GLOBAL_SEARCH_PAGE_SIZE) {
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
    ensurePageQuery()
    syncPageFromUrl()
    await fetchMatches()
  } catch (error) {
    console.error('Error fetching recent matches:', error)
  } finally {
    loading.value = false
  }
})

const parsePage = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const ensurePageQuery = () => {
  if (!route.query.page) {
    router.replace({ query: { ...route.query, page: '1' } })
  }
}

const syncPageFromUrl = () => {
  currentPage.value = parsePage(route.query.page)
}

const fetchMatches = async () => {
  loading.value = true
  const response = await matchesAPI.getRecent({
    all: false,
    per_page: pageSize,
    page: currentPage.value
  })
  matches.value = response.data || []
  hasNextPage.value = matches.value.length === pageSize
  loading.value = false
}

const goToPage = (page) => {
  router.push({ query: { ...route.query, page: String(page) } })
}

watch(
  () => route.query.page,
  async () => {
    syncPageFromUrl()
    await fetchMatches()
  }
)

watch(
  () => searchQuery.value,
  async (value) => {
    if (value.trim()) {
      await ensureGlobalSearchDataset()
    }
  }
)
</script>

<style scoped>
.recent-view {
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
  font-size: 12px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.team-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex: 1;
  position: relative;
}

.team-section.team-right {
  flex-direction: column-reverse;
}

.team-section.winner {
  opacity: 1;
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
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border: 2px solid rgba(64, 224, 208, 0.15);
  transition: all 0.3s ease;
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
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.team-section.winner .team-logo {
  border-color: #40c864;
  box-shadow: 0 0 12px rgba(64, 200, 100, 0.3);
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

.team-section.winner .team-name {
  color: #40c864;
}

.winner-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 8px;
  background: #40c864;
  color: #0a0e27;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 120px;
}

.score-box {
  width: 100px;
  height: 100px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(64, 224, 208, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.score-box.winner {
  border-color: #40c864;
  background: rgba(64, 200, 100, 0.1);
  box-shadow: 0 0 15px rgba(64, 200, 100, 0.3);
}

.score-digit {
  font-size: 48px;
  font-weight: 900;
  color: #40e0d0;
  position: relative;
  z-index: 1;
}

.score-box.winner .score-digit {
  color: #40c864;
}

.match-divider {
  font-size: 24px;
  color: rgba(228, 228, 231, 0.3);
  font-weight: bold;
}

.card-bottom {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(64, 224, 208, 0.1);
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-watch {
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

.btn-watch:hover {
  background: rgba(64, 224, 208, 0.3);
  border-color: rgba(64, 224, 208, 0.6);
  box-shadow: 0 0 15px rgba(64, 224, 208, 0.3);
}

.streams-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-stream {
  background: rgba(64, 224, 208, 0.15);
  border: 1px solid rgba(64, 224, 208, 0.3);
  color: #40e0d0;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.btn-stream:hover {
  background: rgba(64, 224, 208, 0.25);
  border-color: rgba(64, 224, 208, 0.5);
  box-shadow: 0 0 10px rgba(64, 224, 208, 0.2);
}

.no-streams {
  color: rgba(228, 228, 231, 0.4);
  font-size: 12px;
  text-align: center;
  width: 100%;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
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

  .filters-grid {
    grid-template-columns: 1fr;
    align-items: stretch;
    gap: 10px;
  }
  
  .controls {
    gap: 12px;
  }

  .matches-container {
    grid-template-columns: 1fr;
  }
  
  .card-content {
    padding: 16px;
    gap: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .team-section,
  .team-section.team-right {
    flex-direction: row;
    justify-content: center;
    gap: 10px;
  }
  
  .team-logo,
  .team-logo-fallback {
    width: 60px;
    height: 60px;
  }
  
  .team-name {
    font-size: 14px;
    text-align: left;
    max-width: 130px;
  }
  
  .score-box {
    width: 80px;
    height: 80px;
  }
  
  .score-digit {
    font-size: 36px;
  }

  .card-top,
  .card-bottom {
    padding: 10px 14px;
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

  .score-box {
    width: 62px;
    height: 62px;
  }

  .score-digit {
    font-size: 28px;
  }

  .card-bottom {
    justify-content: flex-start;
  }

  .btn-watch {
    width: 100%;
    text-align: center;
  }
}
</style>
