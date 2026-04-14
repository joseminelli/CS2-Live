<template>
  <div class="live-view">
    <div class="page-header">
      <h1 class="page-title">Jogos Ao Vivo</h1>
      <p class="page-subtitle">Acompanhamento em tempo real • Atualiza a cada 30 segundos</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Buscando jogos ao vivo...</p>
    </div>

    <div v-else-if="matches.length === 0" class="empty-state">
      <div class="empty-icon">🎮</div>
      <p>Nenhum jogo ao vivo no momento</p>
      <p class="empty-hint">Verifique novamente em alguns instantes</p>
    </div>

    <div v-else class="live-grid">
      <div v-for="match in matches" :key="match.id" class="live-card">
        <div class="card-header">
          <span class="live-badge">● EM PROGRESSO</span>
          <div class="competition-meta">
            <span class="competition-primary">{{ getCompetition(match) }}</span>
            <span v-if="getPhase(match)" class="competition-phase">{{ getPhase(match) }}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="team-section team-1">
            <button class="team-logo-btn" type="button" @click="openTeamModal(match.opponents[0]?.opponent)">
              <img v-if="match.opponents[0]?.opponent?.image_url" :src="match.opponents[0].opponent.image_url"
                :alt="match.opponents[0].opponent.name" class="team-logo">
              <div v-else class="team-logo-fallback">?</div>
            </button>
            <h3 class="team-title">{{ getTeamName(match.opponents[0]) }}</h3>
          </div>

          <div class="score-display">
            <div class="score-box">
              <span class="score-digit">{{ match.results[0]?.score || '0' }}</span>
            </div>
            <div class="match-divider">:</div>
            <div class="score-box">
              <span class="score-digit">{{ match.results[1]?.score || '0' }}</span>
            </div>
          </div>

          <div class="team-section team-2">
            <h3 class="team-title2">{{ getTeamName(match.opponents[1]) }}</h3>
            <button class="team-logo-btn" type="button" @click="openTeamModal(match.opponents[1]?.opponent)">
              <img v-if="match.opponents[1]?.opponent?.image_url" :src="match.opponents[1].opponent.image_url"
                :alt="match.opponents[1].opponent.name" class="team-logo">
              <div v-else class="team-logo-fallback">?</div>
            </button>
          </div>
        </div>

        <div class="card-footer">
          <span v-if="match.games_attributes" class="match-info">
            Map {{ getRoundNumber(match) }}
          </span>
          <div v-if="match.streams_list && match.streams_list.length > 0" class="streams-buttons">
            <button v-for="(stream, index) in match.streams_list" :key="index" @click="openStream(stream)"
              class="btn-stream" :title="stream.language">
              {{ getStreamName(stream) }}
            </button>
          </div>
          <div v-else class="no-streams">
            Sem stream
          </div>
        </div>
      </div>
    </div>

    <TeamInfoModal v-model="teamModalOpen" :team="selectedTeam" />

    <div class="pagination" v-if="!loading && matches.length > 0">
      <button class="pagination-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Anterior</button>
      <span class="pagination-info">Pagina {{ currentPage }}</span>
      <button class="pagination-btn" :disabled="!hasNextPage" @click="goToPage(currentPage + 1)">Proxima</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchesAPI } from '../api.js'
import { getCompetitionName, getPhaseName, getTeamName } from '../utils/matchDisplay.js'
import { getCompetitionPriority } from '../utils/matchDisplay.js'
import TeamInfoModal from './TeamInfoModal.vue'

const route = useRoute()
const router = useRouter()

const matches = ref([])
const loading = ref(true)
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageSize = 12
const teamModalOpen = ref(false)
const selectedTeam = ref({})

const openTeamModal = (team) => {
  if (!team?.name) return
  selectedTeam.value = team
  teamModalOpen.value = true
}

const getRoundNumber = (match) => {
  if (match.games_attributes && match.games_attributes.length > 0) {
    return match.games_attributes.filter(g => g.finished).length + 1
  }
  return 1
}

const getCompetition = (match) => {
  return getCompetitionName(match)
}

const getPhase = (match) => {
  return getPhaseName(match)
}

const watchLive = (match) => {
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
    alert('Link de stream não disponível para este jogo')
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

let pollInterval

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

const fetchMatches = async (showLoader = true) => {
  if (showLoader) loading.value = true
  const response = await matchesAPI.getLive({
    all: false,
    per_page: pageSize,
    page: currentPage.value
  })
  matches.value = [...(response.data || [])].sort((a, b) => getCompetitionPriority(b) - getCompetitionPriority(a))
  hasNextPage.value = matches.value.length === pageSize
  if (showLoader) loading.value = false
}

const goToPage = (page) => {
  router.push({ query: { ...route.query, page: String(page) } })
}

onMounted(async () => {
  try {
    ensurePageQuery()
    syncPageFromUrl()
    await fetchMatches()

    pollInterval = setInterval(async () => {
      try {
        await fetchMatches(false)
      } catch (error) {
        console.error('Error updating live matches:', error)
      }
    }, 30000)
  } catch (error) {
    console.error('Error fetching live matches:', error)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
})

watch(
  () => route.query.page,
  async () => {
    syncPageFromUrl()
    await fetchMatches()
  }
)
</script>

<style scoped>
.live-view {
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
  font-size: 56px;
  font-weight: 800;
  margin: 0;
  color: #e4e4e7;
}

.page-subtitle {
  font-size: 18px;
  color: rgba(228, 228, 231, 0.6);
  margin: 0;
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
  to {
    transform: rotate(360deg);
  }
}

.pagination {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.pagination-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.4);
  background: rgba(255, 107, 107, 0.16);
  color: #ffe3e3;
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

.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 28px;
}

.live-card {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.08) 0%, rgba(255, 107, 107, 0.04) 100%);
  border: 2px solid rgba(255, 107, 107, 0.3);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
}

.live-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 107, 107, 0.15) 0%, transparent 70%);
  opacity: 0;
  animation: cardGlow 2s infinite;
  pointer-events: none;
}

@keyframes cardGlow {

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

.live-card:hover {
  border-color: rgba(255, 107, 107, 0.6);
  transform: translateY(-4px);
}

.card-header {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 107, 107, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.live-badge {
  font-size: 13px;
  font-weight: 800;
  padding: 8px 14px;
  background: #ff6b6b;
  color: white;
  border-radius: 6px;
  letter-spacing: 0.05em;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.league-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 107, 107, 0.8);
  text-transform: uppercase;
}

.card-body {
  padding: 40px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.team-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  flex: 1;
  min-width: 0;
}

.team-section.team-2 {
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
  width: 100px;
  height: 100px;
  border-radius: 14px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border: 2px solid rgba(255, 107, 107, 0.2);
  transition: all 0.3s ease;
}

.team-logo-fallback {
  width: 100px;
  height: 100px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 900;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.live-card:hover .team-logo {
  border-color: rgba(255, 107, 107, 0.4);
}

.team-title2,
.team-title {
  font-size: 18px;
  font-weight: 700;
  color: #e4e4e7;
  text-align: center;
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
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
  border: 2px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-box::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 0%, rgba(255, 107, 107, 0.2) 0%, transparent 70%);
  opacity: 0;
  animation: scoreGlow 2s infinite;
}

@keyframes scoreGlow {

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

.score-digit {
  font-size: 48px;
  font-weight: 900;
  color: #ff6b6b;
  position: relative;
  z-index: 1;
}

.match-divider {
  font-size: 24px;
  color: rgba(228, 228, 231, 0.3);
  font-weight: bold;
}

.card-footer {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 107, 107, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.match-info {
  font-size: 14px;
  color: rgba(255, 107, 107, 0.7);
  font-weight: 600;
}

.btn-watch {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-watch:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.streams-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-stream {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  color: #ff6b6b;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.btn-stream:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: rgba(255, 107, 107, 0.6);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

.no-streams {
  color: rgba(228, 228, 231, 0.4);
  font-size: 14px;
}

@media (max-width: 1200px) {
  .live-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }

  .live-grid {
    grid-template-columns: 1fr;
  }

  .card-body {
    padding: 20px 16px;
    gap: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .team-section,
  .team-section.team-2 {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
  }

  .team-title2 {
    text-align: right;
    flex: 1;
  }
  
  .team-title {
    text-align: left;
    flex: 1;
  }

  .score-display {
    flex-direction: row;
    justify-content: center;
    gap: 10px;
    min-width: 0;
  }

  .match-divider {
    font-size: 28px;
    align-self: center;
  }

  .team-logo {
    width: 60px;
    height: 60px;
  }

  .team-title2,
  .team-title {
    font-size: 14px;
  }

  .score-box {
    width: 80px;
    height: 80px;
  }

  .score-digit {
    font-size: 36px;
  }

  .card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .streams-buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 26px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .live-card {
    padding: 10px;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .live-badge {
    font-size: 10px;
    padding: 4px 8px;
  }

  .score-box {
    width: 62px;
    height: 62px;
  }

  .score-digit {
    font-size: 28px;
  }
}
</style>
