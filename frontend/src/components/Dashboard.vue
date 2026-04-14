<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">Dashboard Principal</h1>
        <p class="page-subtitle">Acompanhamento em tempo real de Counter-Strike 2</p>
      </div>
      <div class="refresh-indicator">
        <span v-if="!loading" class="sync-status">✓ Sincronizado</span>
        <span v-else class="sync-loading">⟳ Atualizando...</span>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card live-card">
        <div class="stat-header">
          <span class="stat-icon live">🔴</span>
          <span class="stat-title">Jogos Ao Vivo</span>
        </div>
        <div class="stat-value">{{ liveCount }}</div>
        <div class="stat-footer">matches em progresso</div>
      </div>
      
      <div class="stat-card upcoming-card">
        <div class="stat-header">
          <span class="stat-icon">📅</span>
          <span class="stat-title">Próximos Jogos</span>
        </div>
        <div class="stat-value">{{ upcomingCount }}</div>
        <div class="stat-footer">eventos agendados</div>
      </div>
      
      <div class="stat-card finished-card">
        <div class="stat-header">
          <span class="stat-icon">✓</span>
          <span class="stat-title">Finalizados</span>
        </div>
        <div class="stat-value">{{ recentCount }}</div>
        <div class="stat-footer">resultados disponíveis</div>
      </div>
      
      <div class="stat-card teams-card">
        <div class="stat-header">
          <span class="stat-icon">👥</span>
          <span class="stat-title">Times CS2</span>
        </div>
        <div class="stat-value">{{ teamCount }}</div>
        <div class="stat-footer">times competitivos</div>
      </div>
    </div>
    
    <!-- Live Matches Section -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">🔴 Jogos Ao Vivo</h2>
        <span class="live-pulse">LIVE</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando dados...</p>
      </div>
      <div v-else-if="liveMatches.length === 0" class="empty-state">
        <p>Nenhum jogo ao vivo no momento</p>
      </div>
      <div v-else class="matches-grid">
        <div v-for="match in liveMatches.slice(0, 3)" :key="match.id" class="live-match-card">
          <div class="match-status">EN PROGRESSO</div>
          <div class="match-content">
            <div class="match-team">
              <img v-if="match.opponents[0]?.opponent?.image_url" :src="match.opponents[0].opponent.image_url" :alt="match.opponents[0].opponent.name" class="team-logo">
              <span class="team-name">{{ match.opponents[0]?.opponent?.name || 'TBD' }}</span>
            </div>
            <div class="match-score">
              <span class="score">{{ match.results[0]?.score || '-' }}</span>
              <span class="divider">:</span>
              <span class="score">{{ match.results[1]?.score || '-' }}</span>
            </div>
            <div class="match-team">
              <span class="team-name">{{ match.opponents[1]?.opponent?.name || 'TBD' }}</span>
              <img v-if="match.opponents[1]?.opponent?.image_url" :src="match.opponents[1].opponent.image_url" :alt="match.opponents[1].opponent.name" class="team-logo">
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Upcoming Matches Section -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">📅 Próximos Jogos</h2>
      </div>
      
      <div v-if="upcomingMatches.length === 0" class="empty-state">
        <p>Nenhum jogo próximo agendado</p>
      </div>
      <div v-else class="upcoming-list">
        <div v-for="match in upcomingMatches.slice(0, 5)" :key="match.id" class="upcoming-item">
          <div class="upcoming-time">{{ formatDateTime(match.scheduled_at) }}</div>
          <div class="upcoming-match">
            <span class="team-name-short">{{ match.opponents[0]?.opponent?.name || 'TBD' }}</span>
            <span class="vs-text">vs</span>
            <span class="team-name-short">{{ match.opponents[1]?.opponent?.name || 'TBD' }}</span>
          </div>
          <div class="league-badge">{{ match.league?.name || 'League' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { matchesAPI, teamsAPI } from '../api.js'

const loading = ref(true)
const liveMatches = ref([])
const upcomingMatches = ref([])
const recentMatches = ref([])
const teams = ref([])

const liveCount = ref(0)
const upcomingCount = ref(0)
const recentCount = ref(0)
const teamCount = ref(0)

const formatDateTime = (date) => {
  if (!date) return 'TBD'
  return new Date(date).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    loading.value = true
    
    const [live, upcoming, recent, teamsList] = await Promise.all([
      matchesAPI.getLive().catch(() => ({ data: [] })),
      matchesAPI.getUpcoming().catch(() => ({ data: [] })),
      matchesAPI.getRecent().catch(() => ({ data: [] })),
      teamsAPI.getAll().catch(() => ({ data: [] }))
    ])
    
    liveMatches.value = live.data || []
    upcomingMatches.value = upcoming.data || []
    recentMatches.value = recent.data || []
    teams.value = teamsList.data || []
    
    liveCount.value = liveMatches.value.length
    upcomingCount.value = upcomingMatches.value.length
    recentCount.value = recentMatches.value.length
    teamCount.value = teams.value.length
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 8px;
  color: #e4e4e7;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 16px;
  color: rgba(228, 228, 231, 0.6);
  margin: 0;
}

.refresh-indicator {
  font-size: 12px;
  padding: 8px 16px;
  background: rgba(64, 224, 208, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 6px;
  color: rgba(64, 224, 208, 0.8);
  font-family: 'Courier New', monospace;
}

.sync-loading {
  display: inline-block;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #40e0d0, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  border-color: rgba(64, 224, 208, 0.4);
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.12) 0%, rgba(30, 144, 255, 0.12) 100%);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card.live-card {
  border-left: 3px solid #ff6b6b;
}

.stat-card.upcoming-card {
  border-left: 3px solid #6496ff;
}

.stat-card.finished-card {
  border-left: 3px solid #40c864;
}

.stat-card.teams-card {
  border-left: 3px solid #ffd700;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-icon {
  font-size: 24px;
}

.stat-icon.live {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.5; }
}

.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(228, 228, 231, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 48px;
  font-weight: 800;
  color: #40e0d0;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-footer {
  font-size: 12px;
  color: rgba(228, 228, 231, 0.5);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #e4e4e7;
}

.live-pulse {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  background: #ff6b6b;
  color: white;
  border-radius: 4px;
  letter-spacing: 0.05em;
  animation: blink 1.5s infinite;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.live-match-card {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 107, 107, 0.04) 100%);
  border: 2px solid rgba(255, 107, 107, 0.25);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.live-match-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 107, 107, 0.1) 0%, transparent 70%);
  opacity: 0;
  animation: liveGlow 2s infinite;
}

@keyframes liveGlow {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.match-status {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  background: #ff6b6b;
  color: white;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.match-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  z-index: 1;
  padding-top: 20px;
}

.match-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.match-team:last-child {
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
  font-size: 14px;
  font-weight: 700;
  color: #e4e4e7;
  text-align: center;
  max-width: 120px;
  line-height: 1.2;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score {
  font-size: 42px;
  font-weight: 800;
  color: #40e0d0;
  min-width: 50px;
  text-align: center;
}

.divider {
  font-size: 32px;
  color: rgba(228, 228, 231, 0.3);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(64, 224, 208, 0.2);
  border-top-color: #40e0d0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(228, 228, 231, 0.5);
  font-size: 16px;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  display: grid;
  grid-template-columns: 120px 1fr 140px;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: rgba(64, 224, 208, 0.05);
  border: 1px solid rgba(64, 224, 208, 0.15);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.upcoming-item:hover {
  background: rgba(64, 224, 208, 0.08);
  border-color: rgba(64, 224, 208, 0.3);
}

.upcoming-time {
  font-size: 12px;
  font-weight: 600;
  color: rgba(64, 224, 208, 0.8);
  font-family: 'Courier New', monospace;
}

.upcoming-match {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.team-name-short {
  font-weight: 700;
  color: #e4e4e7;
  flex: 1;
  text-align: center;
}

.vs-text {
  font-size: 11px;
  color: rgba(228, 228, 231, 0.5);
  font-weight: 600;
  text-transform: uppercase;
}

.league-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(30, 144, 255, 0.15);
  color: #6496ff;
  border-radius: 4px;
  text-align: right;
}

@media (max-width: 1200px) {
  .matches-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .upcoming-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .section-title {
    font-size: 18px;
  }
}
</style>

