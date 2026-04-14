<template>
  <div class="teams-view">
    <div class="page-header">
      <h1 class="page-title">Times CS2</h1>
      <p class="page-subtitle">Explore os times competitivos de Counter-Strike 2</p>
    </div>
    
    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar time..."
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
      <div class="filter-grid">
        <label class="field-group">
          <span class="field-label">Ordenar</span>
          <select v-model="sortBy" class="select-input">
            <option v-for="opt in sortOptions" :key="opt.key" :value="opt.key">
              {{ opt.label }}
            </option>
          </select>
        </label>

        <label class="field-group">
          <span class="field-label">Região</span>
          <select v-model="regionFilter" class="select-input">
            <option value="all">Todas</option>
            <option v-for="region in availableRegions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
        </label>
      </div>

      <div class="quick-filters">
        <button
          v-for="opt in quickFilters"
          :key="opt.key"
          class="sort-btn"
          :class="{ active: activeFilter === opt.key }"
          @click="activeFilter = opt.key"
        >
          {{ opt.label }}
        </button>
      </div>

      <p class="ranking-note">
        Destaque local por atividade e completude do perfil. Use os filtros para achar times menos conhecidos.
      </p>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando times...</p>
    </div>
    
    <div v-else-if="filteredTeams.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <p>Nenhum time encontrado</p>
      <p class="empty-hint">Tente ajustar seus filtros</p>
    </div>
    
    <div v-else class="teams-grid">
      <div 
        v-for="team in filteredTeams" 
        :key="team.id" 
        class="team-card"
      >
        <div class="card-header">
          <img 
            v-if="team.image_url" 
            :src="team.image_url" 
            :alt="team.name"
            class="team-logo"
          >
          <div v-else class="team-logo-placeholder">
            ?
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="team-title">{{ team.name }}</h3>
          
          <div class="team-stats">
            <div class="stat-item">
              <span class="stat-label">Region</span>
              <span class="stat-value">{{ team.region || 'N/A' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Players</span>
              <span class="stat-value">{{ team.players?.length || 'N/A' }}</span>
            </div>
          </div>
          
          <div v-if="team.players && team.players.length > 0" class="players-preview">
            <div class="players-label">Jogadores</div>
            <div class="players-list">
              <span v-for="player in team.players" :key="player.id" class="player-tag">
                {{ player.name || 'Unknown' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <button class="btn-primary">Ver Detalhes</button>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="!loading && teams.length > 0">
      <button class="pagination-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Anterior</button>
      <span class="pagination-info">Pagina {{ currentPage }}</span>
      <button class="pagination-btn" :disabled="!hasNextPage" @click="goToPage(currentPage + 1)">Proxima</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { teamsAPI } from '../api.js'

const route = useRoute()
const router = useRouter()

const teams = ref([])
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('featured')
const activeFilter = ref('all')
const regionFilter = ref('all')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageSize = 24

const sortOptions = [
  { key: 'featured', label: '✨ Destaque' },
  { key: 'recent', label: '🕒 Recentes' },
  { key: 'name', label: '📌 Nome' },
  { key: 'region', label: '🌍 Região' },
  { key: 'players', label: '👥 Jogadores' }
]

const quickFilters = [
  { key: 'all', label: 'Todos' },
  { key: 'roster', label: 'Com elenco' },
  { key: 'logo', label: 'Com logo' },
  { key: 'active', label: 'Ativos' }
]

const availableRegions = computed(() => {
  const regions = new Set()

  teams.value.forEach((team) => {
    if (team.region) {
      regions.add(team.region)
    }
  })

  return Array.from(regions).sort((a, b) => a.localeCompare(b))
})

const parseDate = (value) => {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

const getFeaturedScore = (team) => {
  const updatedScore = parseDate(team.modified_at)
  const rosterScore = (team.players?.length || 0) * 86400000
  const logoScore = team.image_url ? 43200000 : 0

  return updatedScore + rosterScore + logoScore
}

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

const goToPage = (page) => {
  router.push({ query: { ...route.query, page: String(page) } })
}

const fetchTeams = async () => {
  loading.value = true
  const response = await teamsAPI.getAll({
    all: false,
    per_page: pageSize,
    page: currentPage.value,
    sort: '-modified_at'
  })
  teams.value = response.data || []
  hasNextPage.value = teams.value.length === pageSize

  loading.value = false
}

const filteredTeams = computed(() => {
  let result = teams.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.name?.toLowerCase().includes(query) ||
      t.region?.toLowerCase().includes(query) ||
      t.players?.some(player => player.name?.toLowerCase().includes(query))
    )
  }

  if (regionFilter.value !== 'all') {
    result = result.filter(team => team.region === regionFilter.value)
  }

  if (activeFilter.value === 'roster') {
    result = result.filter(team => (team.players?.length || 0) > 0)
  } else if (activeFilter.value === 'logo') {
    result = result.filter(team => Boolean(team.image_url))
  } else if (activeFilter.value === 'active') {
    const threshold = Date.now() - (180 * 24 * 60 * 60 * 1000)
    result = result.filter(team => parseDate(team.modified_at) >= threshold)
  }

  if (sortBy.value === 'featured') {
    result.sort((a, b) => {
      const scoreDiff = getFeaturedScore(b) - getFeaturedScore(a)
      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return a.name.localeCompare(b.name)
    })
  } else if (sortBy.value === 'recent') {
    result.sort((a, b) => {
      const scoreDiff = parseDate(b.modified_at) - parseDate(a.modified_at)
      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return a.name.localeCompare(b.name)
    })
  } else if (sortBy.value === 'region') {
    result.sort((a, b) => 
      (a.region || 'Z').localeCompare(b.region || 'Z')
    )
  } else if (sortBy.value === 'players') {
    result.sort((a, b) => 
      (b.players?.length || 0) - (a.players?.length || 0)
    )
  } else {
    result.sort((a, b) => 
      a.name.localeCompare(b.name)
    )
  }
  
  return result
})

onMounted(async () => {
  try {
    ensurePageQuery()
    syncPageFromUrl()
    await fetchTeams()
  } catch (error) {
    console.error('Error fetching teams:', error)
  } finally {
    loading.value = false
  }
})

watch(
  () => route.query.page,
  async () => {
    syncPageFromUrl()
    await fetchTeams()
  }
)
</script>

<style scoped>
.teams-view {
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
  gap: 20px;
  flex-direction: column;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(228, 228, 231, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.select-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(64, 224, 208, 0.06);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 10px;
  color: #e4e4e7;
  font-size: 15px;
}

.quick-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ranking-note {
  margin: 0;
  color: rgba(228, 228, 231, 0.58);
  font-size: 13px;
  line-height: 1.4;
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

.sort-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sort-btn {
  padding: 8px 16px;
  background: rgba(64, 224, 208, 0.08);
  border: 1px solid rgba(64, 224, 208, 0.2);
  color: rgba(228, 228, 231, 0.8);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-btn:hover {
  border-color: rgba(64, 224, 208, 0.4);
  background: rgba(64, 224, 208, 0.1);
}

.sort-btn.active {
  background: rgba(64, 224, 208, 0.2);
  border-color: rgba(64, 224, 208, 0.6);
  color: #40e0d0;
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

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.team-card {
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.team-card:hover {
  border-color: rgba(64, 224, 208, 0.4);
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.12) 0%, rgba(30, 144, 255, 0.12) 100%);
  transform: translateY(-4px);
  box-shadow: 0 0 20px rgba(64, 224, 208, 0.2);
}

.card-header {
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(64, 224, 208, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 140px;
}

.team-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 8px;
}

.team-logo-placeholder {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  font-weight: 900;
  color: #ffffff;
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-title {
  font-size: 18px;
  font-weight: 700;
  color: #e4e4e7;
  margin: 0;
  text-align: center;
  line-height: 1.3;
}

.team-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  background: rgba(64, 224, 208, 0.08);
  border: 1px solid rgba(64, 224, 208, 0.15);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: rgba(228, 228, 231, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #40e0d0;
}

.players-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.players-label {
  font-size: 11px;
  color: rgba(228, 228, 231, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-tag {
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(64, 224, 208, 0.1);
  color: rgba(228, 228, 231, 0.8);
  border-radius: 4px;
  border-left: 2px solid #40e0d0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.card-footer {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(64, 224, 208, 0.1);
  display: flex;
  justify-content: center;
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

@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }
  
  .controls {
    gap: 12px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
  
  .teams-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>
