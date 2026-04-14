<template>
  <div class="upcoming-view">
    <div class="page-header">
      <h1 class="page-title">Próximos Jogos</h1>
      <p class="page-subtitle">Acompanhe os eventos CS2 agendados</p>
    </div>
    
    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por time..."
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="sort-controls">
        <button 
          v-for="opt in sortOptions"
          :key="opt.key"
          @click="sortBy = opt.key"
          class="sort-btn"
          :class="{ active: sortBy === opt.key }"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-state">
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
            <img 
              v-if="match.opponents[0]?.opponent?.image_url" 
              :src="match.opponents[0].opponent.image_url" 
              :alt="match.opponents[0].opponent.name"
              class="team-logo"
            >
            <h3 class="team-name">{{ getTeamName(match.opponents[0]) }}</h3>
          </div>
          
          <div class="match-center">
            <span class="vs-text">vs</span>
            <div class="match-type">{{ getMatchType(match) }}</div>
          </div>
          
          <div class="team-info team-right">
            <h3 class="team-name">{{ getTeamName(match.opponents[1]) }}</h3>
            <img 
              v-if="match.opponents[1]?.opponent?.image_url" 
              :src="match.opponents[1].opponent.image_url" 
              :alt="match.opponents[1].opponent.name"
              class="team-logo"
            >
          </div>
        </div>
        
        <div class="card-bottom">
          <button class="btn-primary">Acompanhar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { matchesAPI } from '../api.js'
import { getCompetitionName, getPhaseName, getTeamName } from '../utils/matchDisplay.js'

const matches = ref([])
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('date')

const sortOptions = [
  { key: 'date', label: '📅 Data' },
  { key: 'league', label: '🏆 Liga' },
  { key: 'team', label: '👥 Time' }
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

const getMatchType = (match) => {
  return match.match_type === 'best_of_three' ? 'BO3' : match.match_type === 'best_of_five' ? 'BO5' : 'BO1'
}

const filteredMatches = computed(() => {
  let result = matches.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m => 
      m.opponents[0]?.opponent?.name?.toLowerCase().includes(query) ||
      m.opponents[1]?.opponent?.name?.toLowerCase().includes(query)
    )
  }
  
  if (sortBy.value === 'league') {
    result.sort((a, b) => 
      (a.league?.name || '').localeCompare(b.league?.name || '')
    )
  } else if (sortBy.value === 'team') {
    result.sort((a, b) => 
      (a.opponents[0]?.opponent?.name || '').localeCompare(b.opponents[0]?.opponent?.name || '')
    )
  }
  
  return result
})

onMounted(async () => {
  try {
    loading.value = true
    const response = await matchesAPI.getUpcoming()
    matches.value = response.data || []
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
  } finally {
    loading.value = false
  }
})
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
  font-size: 14px;
  color: rgba(228, 228, 231, 0.6);
  margin: 0;
}

.controls {
  display: flex;
  gap: 20px;
  flex-direction: column;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  background: rgba(64, 224, 208, 0.05);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 8px;
  color: #e4e4e7;
  font-size: 14px;
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

.team-logo {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px;
  border: 1px solid rgba(64, 224, 208, 0.15);
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
  
  .card-content {
    padding: 16px;
  }
}
</style>
