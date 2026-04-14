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

    <div v-if="loading" class="stats-grid">
      <div v-for="n in 4" :key="`stat-skeleton-${n}`" class="stat-card stat-skeleton-card">
        <div class="stat-header">
          <div class="skeleton-chip"></div>
          <div class="skeleton-line skeleton-line-md"></div>
        </div>
        <div class="skeleton-line skeleton-value"></div>
        <div class="skeleton-line skeleton-line-sm"></div>
      </div>
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card live-card" role="button" tabindex="0" @click="goToRoute('live')"
        @keyup.enter="goToRoute('live')">
        <div class="stat-header">
          <span class="stat-icon live">🔴</span>
          <span class="stat-title">Jogos Ao Vivo</span>
        </div>
        <div class="stat-value">{{ liveCount }}</div>
        <div class="stat-footer">matches em progresso</div>
      </div>

      <div class="stat-card upcoming-card" role="button" tabindex="0" @click="goToRoute('upcoming')"
        @keyup.enter="goToRoute('upcoming')">
        <div class="stat-header">
          <span class="stat-icon">📅</span>
          <span class="stat-title">Próximos Jogos</span>
        </div>
        <div class="stat-value">{{ upcomingCount }}</div>
        <div class="stat-footer">eventos agendados</div>
      </div>

      <div class="stat-card finished-card" role="button" tabindex="0" @click="goToRoute('recent')"
        @keyup.enter="goToRoute('recent')">
        <div class="stat-header">
          <span class="stat-icon">✓</span>
          <span class="stat-title">Finalizados</span>
        </div>
        <div class="stat-value">{{ recentCount }}</div>
        <div class="stat-footer">resultados disponíveis</div>
      </div>

      <div class="stat-card teams-card" role="button" tabindex="0" @click="goToRoute('tournaments')"
        @keyup.enter="goToRoute('tournaments')">
        <div class="stat-header">
          <span class="stat-icon">🏆</span>
          <span class="stat-title">Torneios</span>
        </div>
        <div class="stat-value">{{ tournamentCount }}</div>
        <div class="stat-footer">campeonatos em base</div>
      </div>
    </div>

    <!-- Live Matches Section -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Jogos Ao Vivo</h2>
        <span class="live-pulse">LIVE</span>
        <button class="section-action" @click="goToRoute('live')">Ver todos</button>
      </div>

      <div v-if="loading" class="matches-grid">
        <div v-for="n in 3" :key="`dash-live-skeleton-${n}`" class="live-match-card skeleton-match-card">
          <div class="skeleton-line skeleton-line-sm"></div>
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
      <div v-else-if="liveMatches.length === 0" class="empty-state">
        <p>Nenhum jogo ao vivo no momento</p>
      </div>
      <div v-else class="matches-grid">
        <div v-for="match in liveMatches.slice(0, 3)" :key="match.id" class="live-match-card" role="button" tabindex="0"
          @click="openLiveMatch(match)" @keyup.enter="openLiveMatch(match)">
          <div class="match-status">EM PROGRESSO</div>
          <div class="match-content">
            <div class="match-team">
              <button class="team-logo-btn" type="button" @click.stop="openTeamModal(match.opponents[0]?.opponent)">
                <img v-if="match.opponents[0]?.opponent?.image_url" :src="match.opponents[0].opponent.image_url"
                  :alt="match.opponents[0].opponent.name" class="team-logo">
                <div v-else class="team-logo-fallback">?</div>
              </button>
              <span class="team-name">{{ match.opponents[0]?.opponent?.name || 'TBD' }}</span>
            </div>
            <div class="match-score">
              <span class="score">{{ match.results[0]?.score || '0' }}</span>
              <span class="divider">:</span>
              <span class="score">{{ match.results[1]?.score || '0' }}</span>
            </div>
            <div class="match-team">
              <span class="team-name">{{ match.opponents[1]?.opponent?.name || 'TBD' }}</span>
              <button class="team-logo-btn" type="button" @click.stop="openTeamModal(match.opponents[1]?.opponent)">
                <img v-if="match.opponents[1]?.opponent?.image_url" :src="match.opponents[1].opponent.image_url"
                  :alt="match.opponents[1].opponent.name" class="team-logo">
                <div v-else class="team-logo-fallback">?</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Matches Section -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Próximos Jogos</h2>
        <button class="section-action" @click="goToRoute('upcoming')">Ver todos</button>
      </div>

      <div v-if="loading" class="upcoming-list">
        <div v-for="n in 5" :key="`dash-upcoming-skeleton-${n}`" class="upcoming-item skeleton-upcoming-item">
          <div class="skeleton-line skeleton-line-sm"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
        </div>
      </div>
      <div v-else-if="upcomingMatches.length === 0" class="empty-state">
        <p>Nenhum jogo próximo agendado</p>
      </div>
      <div v-else class="upcoming-list">
        <div v-for="match in upcomingMatches.slice(0, 5)" :key="match.id" class="upcoming-item" role="button"
          tabindex="0" @click="goToRoute('upcoming')" @keyup.enter="goToRoute('upcoming')">
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

    <TeamInfoModal v-model="teamModalOpen" :team="selectedTeam" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardAPI } from '../api.js'
import { getCompetitionPriority } from '../utils/matchDisplay.js'
import TeamInfoModal from './TeamInfoModal.vue'

const router = useRouter()

const loading = ref(true)
const liveMatches = ref([])
const upcomingMatches = ref([])
const recentMatches = ref([])

const liveCount = ref(0)
const upcomingCount = ref(0)
const recentCount = ref(0)
const tournamentCount = ref(0)

const teamModalOpen = ref(false)
const selectedTeam = ref({})

const goToRoute = (routeName) => {
  router.push({ name: routeName })
}

const openLiveMatch = (match) => {
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

  goToRoute('live')
}

const openTeamModal = (team) => {
  if (!team?.name) return
  selectedTeam.value = team
  teamModalOpen.value = true
}

const sortByCompetitionImportance = (items) => {
  return [...items].sort((a, b) => getCompetitionPriority(b) - getCompetitionPriority(a))
}

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

    const response = await dashboardAPI.getSummary()
    const summary = response.data || {}

    liveMatches.value = sortByCompetitionImportance(summary.liveMatches || [])
    upcomingMatches.value = sortByCompetitionImportance(summary.upcomingMatches || [])
    recentMatches.value = sortByCompetitionImportance(summary.recentMatches || [])
    liveCount.value = summary.liveCount ?? liveMatches.value.length
    upcomingCount.value = summary.upcomingCount ?? upcomingMatches.value.length
    recentCount.value = summary.recentCount ?? recentMatches.value.length
    tournamentCount.value = summary.tournamentCount ?? summary.tournamentsCount ?? summary.tournaments?.length ?? 0
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
  gap: 50px;
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
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 12px;
  color: #e4e4e7;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 20px;
  color: rgba(228, 228, 231, 0.6);
  margin: 0;
}

.refresh-indicator {
  font-size: 15px;
  padding: 10px 18px;
  background: rgba(64, 224, 208, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 8px;
  color: rgba(64, 224, 208, 0.8);
  font-family: 'Courier New', monospace;
}

.sync-loading {
  display: inline-block;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 28px;
}

.stat-card {
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 12px;
  padding: 32px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
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

.stat-card:focus-visible {
  outline: 2px solid rgba(64, 224, 208, 0.8);
  outline-offset: 2px;
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
  gap: 14px;
  margin-bottom: 20px;
}

.stat-icon {
  font-size: 28px;
}

.stat-icon.live {
  animation: blink 1s infinite;
}

@keyframes blink {

  0%,
  50%,
  100% {
    opacity: 1;
  }

  25%,
  75% {
    opacity: 0.5;
  }
}

.stat-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(228, 228, 231, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 56px;
  font-weight: 800;
  color: #40e0d0;
  margin-bottom: 12px;
  line-height: 1;
}

.stat-footer {
  font-size: 16px;
  color: rgba(228, 228, 231, 0.5);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.section-action {
  margin-left: auto;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(64, 224, 208, 0.35);
  background: rgba(64, 224, 208, 0.12);
  color: rgba(228, 228, 231, 0.9);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.section-action:hover {
  border-color: rgba(64, 224, 208, 0.6);
  background: rgba(64, 224, 208, 0.2);
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #e4e4e7;
}

.live-pulse {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border-radius: 6px;
  letter-spacing: 0.05em;
  animation: blink 1.5s infinite;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 28px;
}

.live-match-card {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 107, 107, 0.04) 100%);
  border: 2px solid rgba(255, 107, 107, 0.25);
  border-radius: 12px;
  padding: 32px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
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

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

.match-status {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border-radius: 6px;
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
  width: 90px;
  height: 90px;
  border-radius: 10px;
  object-fit: contain;
  background: rgb(20 73 67 / 30%);
  padding: 6px;
  border: 1px solid rgba(64, 224, 208, 0.15);
}

.team-logo-btn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}

.team-logo-fallback {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 900;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.team-name {
  font-size: 18px;
  font-weight: 700;
  color: #e4e4e7;
  text-align: center;
  max-width: 150px;
  line-height: 1.2;
}

.match-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score {
  font-size: 56px;
  font-weight: 800;
  color: #40e0d0;
  min-width: 70px;
  text-align: center;
}

.divider {
  font-size: 42px;
  color: rgba(228, 228, 231, 0.3);
}

.stat-skeleton-card,
.skeleton-match-card,
.skeleton-upcoming-item {
  cursor: default;
}

.skeleton-chip {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(90deg, rgba(64, 224, 208, 0.18), rgba(64, 224, 208, 0.4), rgba(64, 224, 208, 0.18));
  background-size: 220% 100%;
  animation: dashSkeleton 1.2s linear infinite;
}

.skeleton-line {
  height: 12px;
  width: 100%;
  margin-top: 5px;
  margin-bottom: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(64, 224, 208, 0.14), rgba(64, 224, 208, 0.34), rgba(64, 224, 208, 0.14));
  background-size: 220% 100%;
  animation: dashSkeleton 1.2s linear infinite;
}

.skeleton-line-lg {
  width: 78%;
  height: 20px;
}

.skeleton-line-md {
  width: 55%;
}

.skeleton-line-sm {
  width: 40%;
}

.skeleton-value {
  height: 56px;
  width: 45%;
  margin: 8px 0 14px;
}

@keyframes dashSkeleton {
  from {
    background-position: 220% 0;
  }

  to {
    background-position: -220% 0;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(228, 228, 231, 0.5);
  font-size: 18px;
}

.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upcoming-item {
  display: grid;
  grid-template-columns: 140px 1fr 160px;
  align-items: center;
  gap: 24px;
  padding: 20px;
  background: rgba(64, 224, 208, 0.05);
  border: 1px solid rgba(64, 224, 208, 0.15);
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upcoming-item:hover {
  background: rgba(64, 224, 208, 0.08);
  border-color: rgba(64, 224, 208, 0.3);
}

.upcoming-time {
  font-size: 14px;
  font-weight: 600;
  color: rgba(64, 224, 208, 0.8);
  font-family: 'Courier New', monospace;
}

.upcoming-match {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 18px;
}

.team-name-short {
  font-weight: 700;
  color: #e4e4e7;
  flex: 1;
  text-align: center;
}

.vs-text {
  font-size: 13px;
  color: rgba(228, 228, 231, 0.5);
  font-weight: 600;
  text-transform: uppercase;
}

.league-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  width: fit-content;
  background: rgba(30, 144, 255, 0.15);
  color: #6496ff;
  border-radius: 6px;
  justify-self: end;
  text-align: right;
}

@media (max-width: 1200px) {
  .matches-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 44px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .stat-card {
    padding: 18px;
  }

  .stat-value {
    font-size: 42px;
  }

  .section-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .section-action {
    margin-left: 0;
  }

  .upcoming-item {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px;
  }

  .upcoming-match {
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 4px;
  }

  .matches-grid {
    gap: 14px;
  }

  .live-match-card {
    padding: 14px;
  }

  .match-content {
    padding-top: 28px;
    align-items: stretch;
  }

  .score {
    font-size: 34px;
    min-width: 38px;
  }

  .divider {
    font-size: 28px;
  }

  .team-logo,
  .team-logo-fallback {
    width: 62px;
    height: 62px;
  }

  .team-name {
    font-size: 14px;
    max-width: 110px;
  }

  .page-title {
    font-size: 28px;
  }

  .section-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    gap: 28px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .refresh-indicator {
    font-size: 12px;
    padding: 6px 10px;
  }

  .match-status {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
