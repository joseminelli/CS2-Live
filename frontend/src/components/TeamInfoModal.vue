<template>
  <Transition name="team-modal-fade">
    <div v-if="modelValue" class="team-modal-overlay" @click.self="close">
      <section class="team-modal" role="dialog" aria-modal="true" :aria-label="`Informacoes do time ${displayName}`">
        <header class="team-modal-header">
          <div class="team-head-main">
            <img
              v-if="teamDetails?.image_url || team?.image_url"
              :src="teamDetails?.image_url || team?.image_url"
              :alt="displayName"
              class="team-modal-logo"
            >
            <div v-else class="team-modal-logo-fallback">?</div>

            <div>
              <h3 class="team-modal-title">{{ displayName }}</h3>
              <p class="team-modal-subtitle">
                {{ teamDetails?.acronym || team?.acronym || 'Sem sigla' }}
              </p>
              <button class="favorite-team-btn" type="button" @click="toggleFavoriteCurrentTeam">
                <span class="favorite-burst" :key="favoritePulseToken">
                  {{ isFavoriteCurrentTeam ? '★ Time favorito' : '☆ Favoritar time' }}
                </span>
              </button>
            </div>
          </div>

          <button class="team-modal-close" type="button" @click="close">Fechar</button>
        </header>

        <div class="team-modal-body">
          <div class="team-info-grid">
            <div class="info-item">
              <span class="info-label">Regiao</span>
              <strong class="info-value">{{ displayRegion }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Ultima atualizacao</span>
              <strong class="info-value">{{ formatDate(teamDetails?.modified_at || team?.modified_at) }}</strong>
            </div>
          </div>

          <div class="players-block">
            <h4 class="players-title">Elenco</h4>

            <div v-if="loading" class="players-empty">Carregando dados do time...</div>
            <div v-else-if="players.length === 0" class="players-empty">Elenco indisponivel</div>
            <div v-else class="players-list">
              <article v-for="player in players" :key="player.id || player.slug || player.name" class="player-card">
                <div class="player-avatar-wrap">
                  <img
                    v-if="player.image_url"
                    :src="player.image_url"
                    :alt="player.name || 'Jogador'"
                    class="player-avatar"
                  >
                  <div v-else class="player-avatar-placeholder">?</div>
                </div>

                <div class="player-meta">
                  <strong class="player-name">{{ player.name || player.slug || 'Jogador' }}</strong>
                  <span class="player-detail">{{ formatCountryName(player.nationality) }}</span>
                  <span class="player-detail">Idade: {{ Number.isFinite(Number(player.age)) ? player.age : 'N/A' }}</span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { teamsAPI } from '../api.js'
import { isFavoriteTeam, toggleFavoriteTeam } from '../services/preferences.js'

const fallbackTeamsById = new Map()
let fallbackTeamsLoaded = false
let fallbackTeamsRequest = null

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  team: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const teamDetails = ref(null)
const detailsCache = new Map()
const favoriteVersion = ref(0)
const favoritePulseToken = ref(0)

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['pt-BR'], { type: 'region' })
  : null

const displayName = computed(() => {
  return teamDetails.value?.name || props.team?.name || 'Time'
})

const players = computed(() => {
  const list = teamDetails.value?.players || props.team?.players || []
  return Array.isArray(list) ? list : []
})

const currentTeam = computed(() => teamDetails.value || props.team || {})

const isFavoriteCurrentTeam = computed(() => {
  favoriteVersion.value
  return isFavoriteTeam(currentTeam.value)
})

const refreshFavoriteState = () => {
  favoriteVersion.value += 1
}

const toggleFavoriteCurrentTeam = () => {
  toggleFavoriteTeam(currentTeam.value)
  refreshFavoriteState()
  favoritePulseToken.value = Date.now()
}

const formatRegionName = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'N/A'

  const normalized = raw.replace(/[^A-Za-z]/g, '').toUpperCase()
  if (normalized.length === 2 && regionNames) {
    try {
      const translated = regionNames.of(normalized)
      if (translated) return translated
    } catch (error) {
      // Ignore invalid region codes and fallback to raw value.
    }
  }

  return raw
}

const formatCountryName = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return 'N/A'

  const normalized = raw.replace(/[^A-Za-z]/g, '').toUpperCase()
  if (normalized.length === 2 && regionNames) {
    try {
      const translated = regionNames.of(normalized)
      if (translated) return translated
    } catch (error) {
      // Ignore invalid nationality code and fallback to raw value.
    }
  }

  return raw
}

const displayRegion = computed(() => {
  return formatRegionName(
    teamDetails.value?.location
    || teamDetails.value?.region
    || props.team?.location
    || props.team?.region
  )
})

const close = () => {
  emit('update:modelValue', false)
}

const formatDate = (value) => {
  if (!value) return 'N/A'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const ensureFallbackTeams = async () => {
  if (fallbackTeamsLoaded) return
  if (fallbackTeamsRequest) {
    await fallbackTeamsRequest
    return
  }

  fallbackTeamsRequest = (async () => {
    const response = await teamsAPI.getAll({ all: true, sort: '-modified_at' })
    const list = Array.isArray(response.data) ? response.data : []

    fallbackTeamsById.clear()
    list.forEach((team) => {
      if (team?.id != null) {
        fallbackTeamsById.set(team.id, team)
      }
    })

    fallbackTeamsLoaded = true
  })()

  try {
    await fallbackTeamsRequest
  } finally {
    fallbackTeamsRequest = null
  }
}

const mergeWithFallback = async (baseData, teamId) => {
  if (!teamId) return baseData

  const hasPlayers = Array.isArray(baseData?.players) && baseData.players.length > 0
  if (hasPlayers) return baseData

  try {
    await ensureFallbackTeams()
    const fallback = fallbackTeamsById.get(teamId)

    if (!fallback) return baseData

    return {
      ...fallback,
      ...baseData,
      players: hasPlayers ? baseData.players : (fallback.players || [])
    }
  } catch (error) {
    console.error('Error loading fallback teams list:', error)
    return baseData
  }
}

const loadTeamDetails = async () => {
  const teamId = props.team?.id

  if (!props.modelValue) return

  if (!teamId) {
    teamDetails.value = props.team || null
    return
  }

  if (detailsCache.has(teamId)) {
    teamDetails.value = detailsCache.get(teamId)
    return
  }

  const hasRichSeed = Array.isArray(props.team?.players) && props.team.players.length > 0
  if (hasRichSeed) {
    teamDetails.value = props.team
    detailsCache.set(teamId, props.team)
    return
  }

  try {
    loading.value = true
    const response = await teamsAPI.getById(teamId)
    const resolvedData = await mergeWithFallback(response.data || props.team, teamId)
    teamDetails.value = resolvedData
    if (teamDetails.value) {
      detailsCache.set(teamId, teamDetails.value)
    }
  } catch (error) {
    console.error('Error loading team details:', error)
    teamDetails.value = await mergeWithFallback(props.team || null, teamId)
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.team?.id],
  async () => {
    await loadTeamDetails()
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('cs2-preferences-updated', refreshFavoriteState)
})

onUnmounted(() => {
  window.removeEventListener('cs2-preferences-updated', refreshFavoriteState)
})
</script>

<style scoped>
.team-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(2, 8, 7, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.team-modal {
  width: min(720px, 100%);
  max-height: 90vh;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(64, 224, 208, 0.3);
  background: linear-gradient(180deg, rgba(9, 18, 17, 0.98) 0%, rgba(8, 13, 16, 0.96) 100%);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
}

.team-modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid rgba(64, 224, 208, 0.16);
}

.team-head-main {
  display: flex;
  gap: 14px;
  align-items: center;
}

.team-modal-logo,
.team-modal-logo-fallback {
  width: 64px;
  height: 64px;
  border-radius: 10px;
}

.team-modal-logo {
  object-fit: contain;
  background: rgba(255, 255, 255, 0.03);
}

.team-modal-logo-fallback {
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 30px;
  font-weight: 800;
}

.team-modal-title {
  margin: 0;
  color: #e8faf5;
  font-size: 24px;
}

.team-modal-subtitle {
  margin: 4px 0 0;
  color: rgba(232, 250, 245, 0.6);
  font-size: 13px;
}

.favorite-team-btn {
  margin-top: 8px;
  border: 1px solid rgba(255, 216, 107, 0.5);
  background: rgba(255, 216, 107, 0.12);
  color: #ffefbd;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.team-modal-close {
  border: 1px solid rgba(64, 224, 208, 0.42);
  background: rgba(64, 224, 208, 0.14);
  color: #cbfff9;
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.team-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.team-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 10px;
  padding: 10px;
  background: rgba(64, 224, 208, 0.06);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(232, 250, 245, 0.62);
}

.info-value {
  font-size: 14px;
  color: #e8faf5;
}

.players-title {
  margin: 0 0 10px;
  color: #d6f7f1;
}

.players-empty {
  color: rgba(232, 250, 245, 0.65);
}

.players-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.player-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(64, 224, 208, 0.3);
  background: rgba(64, 224, 208, 0.1);
}

.player-avatar-wrap {
  flex-shrink: 0;
}

.player-avatar,
.player-avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 8px;
}

.player-avatar {
  object-fit: cover;
  background: rgba(255, 255, 255, 0.06);
}

.player-avatar-placeholder {
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.player-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-name {
  font-size: 14px;
  color: #ddfff8;
  line-height: 1.3;
}

.player-detail {
  font-size: 12px;
  color: rgba(221, 255, 248, 0.72);
}

.team-modal-fade-enter-active,
.team-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.team-modal-fade-enter-from,
.team-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .team-info-grid {
    grid-template-columns: 1fr;
  }

  .players-list {
    grid-template-columns: 1fr;
  }

  .team-modal-title {
    font-size: 20px;
  }
}
</style>
