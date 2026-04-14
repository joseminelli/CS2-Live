<template>
  <div class="recent-view">
    <div class="page-header">
      <h1 class="page-title">Resultados Recentes</h1>
      <p class="page-subtitle">Acompanhe os resultados finalizados de CS2</p>
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
            <img 
              v-if="match.opponents[0]?.opponent?.image_url" 
              :src="match.opponents[0].opponent.image_url" 
              :alt="match.opponents[0].opponent.name"
              class="team-logo"
            >
            <h3 class="team-name">{{ getTeamName(match.opponents[0]) }}</h3>
            <span v-if="isWinner(match, 0)" class="winner-badge">VENCEDOR</span>
          </div>
          
          <div class="score-display">
            <div class="score-box" :class="{ winner: isWinner(match, 0) }">
              <span class="score-digit">{{ match.results[0]?.score || '-' }}</span>
            </div>
            <div class="match-divider">:</div>
            <div class="score-box" :class="{ winner: isWinner(match, 1) }">
              <span class="score-digit">{{ match.results[1]?.score || '-' }}</span>
            </div>
          </div>
          
          <div class="team-section team-right" :class="{ winner: isWinner(match, 1) }">
            <span v-if="isWinner(match, 1)" class="winner-badge">VENCEDOR</span>
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

const isWinner = (match, opponentIndex) => {
  if (!match.results || match.results.length < 2) return false
  const scores = [match.results[0]?.score, match.results[1]?.score]
  if (opponentIndex === 0) return scores[0] > scores[1]
  return scores[1] > scores[0]
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
      (b.league?.name || '').localeCompare(a.league?.name || '')
    )
  } else if (sortBy.value === 'team') {
    result.sort((a, b) => 
      (b.opponents[0]?.opponent?.name || '').localeCompare(a.opponents[0]?.opponent?.name || '')
    )
  } else {
    result.sort((a, b) => new Date(b.ended_at || b.scheduled_at) - new Date(a.ended_at || a.scheduled_at))
  }
  
  return result
})

onMounted(async () => {
  try {
    loading.value = true
    const response = await matchesAPI.getRecent()
    matches.value = response.data || []
  } catch (error) {
    console.error('Error fetching recent matches:', error)
  } finally {
    loading.value = false
  }
})
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
  
  .controls {
    gap: 12px;
  }
  
  .card-content {
    padding: 16px;
    gap: 12px;
  }
  
  .team-logo {
    width: 60px;
    height: 60px;
  }
  
  .team-name {
    font-size: 14px;
  }
  
  .score-box {
    width: 80px;
    height: 80px;
  }
  
  .score-digit {
    font-size: 36px;
  }
}
</style>
