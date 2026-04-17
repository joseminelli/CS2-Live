<template>
  <div class="live-view">
    <div class="page-header">
      <h1 class="page-title">Jogos Ao Vivo</h1>
      <p class="page-subtitle">Acompanhamento em tempo real • Atualiza a cada 30 segundos</p>
    </div>

    <div v-if="errorMessage" class="error-banner">
      <p>{{ errorMessage }}</p>
      <button class="retry-btn" @click="fetchMatches(true)">Tentar novamente</button>
    </div>

    <div v-if="staleWarning" class="warning-banner">{{ staleWarning }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Buscando jogos ao vivo...</p>
    </div>

    <div v-else-if="matches.length === 0" class="empty-state">
      <div class="empty-icon">🎮</div>
      <p>Nenhum jogo ao vivo no momento</p>
      <p class="empty-hint">Verifique novamente em alguns instantes</p>
    </div>

    <div v-else class="live-grid" :class="liveColumnsClass">
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
              <span class="score-digit">{{ getCurrentMapScore(match, 0) }}</span>
            </div>
            <div class="match-divider">:</div>
            <div class="score-box">
              <span class="score-digit">{{ getCurrentMapScore(match, 1) }}</span>
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
          <span v-if="hasGameDetails(match)" class="match-info">
            Mapa atual {{ getCurrentMapNumber(match) }}
          </span>
          <div v-if="match.streams_list && match.streams_list.length > 0" class="streams-buttons">
            <button v-for="(stream, index) in getVisibleStreams(match)" :key="`${match.id}-stream-${index}`" @click="openStream(stream)"
              class="btn-stream" :title="stream.language">
              {{ getStreamName(stream) }}
            </button>
            <button
              v-if="getHiddenStreamsCount(match) > 0"
              class="btn-stream btn-stream-toggle"
              type="button"
              @click="toggleStreams(match)"
            >
              +{{ getHiddenStreamsCount(match) }}
            </button>
            <button
              v-else-if="isStreamsExpanded(match) && (match.streams_list?.length || 0) > STREAMS_PREVIEW_LIMIT"
              class="btn-stream btn-stream-toggle"
              type="button"
              @click="toggleStreams(match)"
            >
              menos
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { matchesAPI } from '../api.js'
import { getCompetitionName, getPhaseName, getTeamName } from '../utils/matchDisplay.js'
import { getCompetitionPriority } from '../utils/matchDisplay.js'
import TeamInfoModal from './TeamInfoModal.vue'

const route = useRoute()
const router = useRouter()

const matches = ref([])
const loading = ref(true)
const errorMessage = ref('')
const staleWarning = ref('')
const currentPage = ref(1)
const hasNextPage = ref(false)
const pageSize = 12
const teamModalOpen = ref(false)
const selectedTeam = ref({})
const isApplyingTeamQuery = ref(false)
const STREAMS_PREVIEW_LIMIT = 5
const expandedStreams = ref({})

const liveColumnsClass = computed(() => {
  const total = matches.value.length
  if (total >= 3) return 'live-grid-cols-3'
  if (total === 2) return 'live-grid-cols-2'
  return 'live-grid-cols-1'
})

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

  for (const match of matches.value) {
    const opponents = Array.isArray(match?.opponents) ? match.opponents : []
    for (const item of opponents) {
      const team = item?.opponent || item
      if (!team) continue

      const byId = team.id != null && String(team.id) === normalized
      const bySlug = normalizeTeamToken(team.slug) === normalized
      const byName = normalizeTeamToken(team.name) === normalized

      if (byId || bySlug || byName) {
        return team
      }
    }
  }

  return null
}

const syncTeamQuery = async (team) => {
  const token = getTeamQueryToken(team)
  const nextQuery = { ...route.query }

  if (!token) {
    delete nextQuery.team
  } else {
    nextQuery.team = token
  }

  if (JSON.stringify(nextQuery) === JSON.stringify(route.query)) return
  await router.replace({ query: nextQuery })
}

const openTeamModal = async (team, syncUrl = true) => {
  if (!team?.name) return
  selectedTeam.value = team
  teamModalOpen.value = true

  if (syncUrl && !isApplyingTeamQuery.value) {
    await syncTeamQuery(team)
  }
}

const getFirstDefined = (...values) => values.find((value) => value !== null && value !== undefined && value !== '')

const parseScoreValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : null
}

const getGameStatus = (game) => String(game?.status || game?.state || '').toLowerCase()

const getCurrentMapGame = (match) => {
  const games = Array.isArray(match?.games_attributes) ? match.games_attributes : []
  if (games.length === 0) return null

  return games.find((game) => ['running', 'ongoing', 'in_progress', 'live'].includes(getGameStatus(game)))
    || games.find((game) => game && game.finished !== true && !['finished', 'complete', 'completed'].includes(getGameStatus(game)))
    || games[games.length - 1]
}

const hasGameDetails = (match) => Array.isArray(match?.games_attributes) && match.games_attributes.length > 0

const getCurrentMapNumber = (match) => {
  const currentGame = getCurrentMapGame(match)
  if (currentGame) {
    const candidate = getFirstDefined(currentGame.number, currentGame.game_number, currentGame.round_number, currentGame.round)
    const parsed = Number(candidate)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  if (Array.isArray(match?.games_attributes) && match.games_attributes.length > 0) {
    return match.games_attributes.filter((game) => game?.finished).length + 1
  }

  return 1
}

const getCurrentMapScore = (match, sideIndex) => {
  const currentGame = getCurrentMapGame(match)
  if (currentGame) {
    const rawScore = getFirstDefined(
      currentGame?.results?.[sideIndex]?.score,
      currentGame?.scores?.[sideIndex],
      sideIndex === 0 ? currentGame?.team1_score : currentGame?.team2_score,
      sideIndex === 0 ? currentGame?.home_score : currentGame?.away_score,
      sideIndex === 0 ? currentGame?.score1 : currentGame?.score2
    )

    const score = parseScoreValue(rawScore)
    return score ?? '0'
  }

  const seriesScore = parseScoreValue(match?.results?.[sideIndex]?.score)
  return seriesScore ?? '0'
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

const getMatchKey = (match) => String(match?.id ?? '')

const isStreamsExpanded = (match) => Boolean(expandedStreams.value[getMatchKey(match)])

const getStreamsForMatch = (match) => Array.isArray(match?.streams_list) ? match.streams_list : []

const getVisibleStreams = (match) => {
  const all = getStreamsForMatch(match)
  if (all.length <= STREAMS_PREVIEW_LIMIT) return all
  return isStreamsExpanded(match) ? all : all.slice(0, STREAMS_PREVIEW_LIMIT)
}

const getHiddenStreamsCount = (match) => {
  const all = getStreamsForMatch(match)
  if (isStreamsExpanded(match)) return 0
  return Math.max(all.length - STREAMS_PREVIEW_LIMIT, 0)
}

const toggleStreams = (match) => {
  const key = getMatchKey(match)
  if (!key) return
  expandedStreams.value = {
    ...expandedStreams.value,
    [key]: !expandedStreams.value[key]
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
  errorMessage.value = ''
  staleWarning.value = ''

  try {
    const response = await matchesAPI.getLive({
      all: false,
      per_page: pageSize,
      page: currentPage.value
    }, { forceRefresh: showLoader })

    matches.value = [...(response.data || [])].sort((a, b) => getCompetitionPriority(b) - getCompetitionPriority(a))
    hasNextPage.value = matches.value.length === pageSize

    if (response.config?.stale) {
      staleWarning.value = response.config.warning || 'Mostrando ultimo dado em cache.'
    }

    const teamFromQuery = String(route.query.team || '').trim()
    if (teamFromQuery) {
      const team = findTeamByToken(teamFromQuery)
      if (team) {
        isApplyingTeamQuery.value = true
        try {
          await openTeamModal(team, false)
        } finally {
          isApplyingTeamQuery.value = false
        }
      }
    }
  } catch (error) {
    errorMessage.value = error?.userMessage || 'API fora do ar. Tente novamente em instantes.'
  } finally {
    if (showLoader) loading.value = false
  }
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

watch(
  () => route.query.team,
  async (value) => {
    const token = String(value || '').trim()

    if (!token) {
      if (teamModalOpen.value) {
        teamModalOpen.value = false
      }
      return
    }

    const team = findTeamByToken(token)
    if (!team) return

    isApplyingTeamQuery.value = true
    try {
      await openTeamModal(team, false)
    } finally {
      isApplyingTeamQuery.value = false
    }
  },
  { immediate: true }
)

watch(
  () => teamModalOpen.value,
  async (open) => {
    if (isApplyingTeamQuery.value) return

    if (!open && route.query.team) {
      await syncTeamQuery(null)
      return
    }

    if (open && selectedTeam.value?.name) {
      await syncTeamQuery(selectedTeam.value)
    }
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

.error-banner,
.warning-banner {
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 107, 107, 0.34);
  background: rgba(255, 107, 107, 0.09);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.warning-banner {
  border-color: rgba(255, 206, 84, 0.4);
  background: rgba(255, 206, 84, 0.1);
}

.retry-btn {
  border: 1px solid rgba(255, 107, 107, 0.6);
  background: rgba(255, 107, 107, 0.2);
  color: #ffe9e9;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
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
  grid-template-columns: 1fr;
  gap: 28px;
}

.live-grid.live-grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.live-grid.live-grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  padding: 20px 16px;
  display: flex;
  align-items: stretch;
  gap: 10px;
  flex-direction: column;
  flex: 1;
  position: relative;
  z-index: 1;
}

.team-section {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}

.team-section.team-2 {
  flex-direction: row;
}

.team-logo-btn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}

.team-logo {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  object-fit: contain;
  background: rgb(20 73 67 / 30%);
  padding: 8px;
  transition: all 0.3s ease;
}

.team-logo-fallback {
  width: 60px;
  height: 60px;
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
  font-size: 14px;
  font-weight: 700;
  color: #e4e4e7;
  flex: 1;
  margin: 0;
  line-height: 1.3;
  word-break: break-word;
}

.team-title {
  text-align: left;
}

.team-title2 {
  text-align: right;
}

.score-display {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 10px;
  min-width: 0;
}

.score-box {
  width: 80px;
  height: 80px;
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
  font-size: 36px;
  font-weight: 900;
  color: #ff6b6b;
  position: relative;
  z-index: 1;
}

.match-divider {
  font-size: 28px;
  align-self: center;
  color: rgba(228, 228, 231, 0.3);
  font-weight: bold;
}

.card-footer {
  padding: 20px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 107, 107, 0.2);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
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
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: flex-start;
  max-width: 100%;
  max-height: 70px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.streams-buttons::-webkit-scrollbar {
  height: 6px;
}

.streams-buttons::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 107, 0.45);
  border-radius: 999px;
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
  flex: 0 0 auto;
}

.btn-stream:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: rgba(255, 107, 107, 0.6);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
}

.btn-stream-toggle {
  border-style: dashed;
  font-weight: 800;
}

.no-streams {
  color: rgba(228, 228, 231, 0.4);
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 32px;
  }

  .live-grid.live-grid-cols-1,
  .live-grid.live-grid-cols-2,
  .live-grid.live-grid-cols-3 {
    grid-template-columns: 1fr;
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
