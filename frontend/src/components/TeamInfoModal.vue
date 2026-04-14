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
            </div>
          </div>

          <button class="team-modal-close" type="button" @click="close">Fechar</button>
        </header>

        <div class="team-modal-body">
          <div class="team-info-grid">
            <div class="info-item">
              <span class="info-label">Regiao</span>
              <strong class="info-value">{{ teamDetails?.location || teamDetails?.region || team?.location || team?.region || 'N/A' }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Slug</span>
              <strong class="info-value">{{ teamDetails?.slug || team?.slug || 'N/A' }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Ultima atualizacao</span>
              <strong class="info-value">{{ formatDate(teamDetails?.modified_at || team?.modified_at) }}</strong>
            </div>
            <div class="info-item">
              <span class="info-label">Jogadores</span>
              <strong class="info-value">{{ players.length }}</strong>
            </div>
          </div>

          <div class="players-block">
            <h4 class="players-title">Elenco</h4>

            <div v-if="loading" class="players-empty">Carregando dados do time...</div>
            <div v-else-if="players.length === 0" class="players-empty">Elenco indisponivel</div>
            <div v-else class="players-list">
              <span v-for="player in players" :key="player.id || player.slug || player.name" class="player-chip">
                {{ player.name || player.slug || 'Jogador' }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { teamsAPI } from '../api.js'

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

const displayName = computed(() => {
  return teamDetails.value?.name || props.team?.name || 'Time'
})

const players = computed(() => {
  const list = teamDetails.value?.players || props.team?.players || []
  return Array.isArray(list) ? list : []
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
    teamDetails.value = response.data || props.team
    if (teamDetails.value) {
      detailsCache.set(teamId, teamDetails.value)
    }
  } catch (error) {
    console.error('Error loading team details:', error)
    teamDetails.value = props.team || null
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.player-chip {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(64, 224, 208, 0.3);
  background: rgba(64, 224, 208, 0.12);
  color: #ddfff8;
  font-size: 12px;
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

  .team-modal-title {
    font-size: 20px;
  }
}
</style>
