<template>
  <div class="tournaments-view">
    <div class="page-header">
      <h1 class="page-title">Torneios CS2</h1>
      <p class="page-subtitle">Campeonatos organizados com fases e status em tempo real</p>
    </div>

    <div class="controls">
      <div class="filters-grid">
        <label class="filter-group search-group">
          <span class="filter-label">Busca Global</span>
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="Buscar campeonato, liga ou fase..."
              class="search-input">
            <span class="search-icon">🔍</span>
          </div>
        </label>

        <label class="filter-group">
          <span class="filter-label">Status</span>
          <select v-model="selectedStatus" class="filter-select">
            <option v-for="status in statusFilters" :key="status.key" :value="status.key">
              {{ status.label }}
            </option>
          </select>
        </label>

        <label class="filter-group">
          <span class="filter-label">Ordenar Por</span>
          <select v-model="selectedSort" class="filter-select">
            <option value="importance">Importancia do campeonato</option>
            <option value="recent">Atualizacao mais recente</option>
          </select>
        </label>
      </div>

      <p class="search-context">
        Busca global em torneios na janela de 30 dias, com prioridade por importancia competitiva.
      </p>
    </div>

    <div v-if="loading || globalSearchLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando torneios...</p>
    </div>

    <div v-else-if="filteredChampionships.length === 0" class="empty-state">
      <div class="empty-icon">🏆</div>
      <p>Nenhum campeonato encontrado</p>
      <p class="empty-hint">Tente ajustar o filtro ou busca</p>
    </div>

    <div v-else class="tournaments-grid">
      <article v-for="champ in filteredChampionships" :key="champ.uid" class="tournament-card"
        :class="{ expanded: expandedId === champ.uid }">
        <button class="card-header" @click="toggleExpand(champ.uid)">
          <div class="header-content">
            <div class="tournament-info">
              <span class="info-label">Campeonato</span>
              <h3 class="tournament-name">{{ champ.championshipName }}</h3>

              <div class="phase-row">
                <span class="phase-chip">Fase atual: {{ champ.currentPhase?.phaseName || 'N/A' }}</span>
                <span class="phase-count">{{ champ.phases.length }} fases</span>
              </div>
            </div>

            <div class="header-side">
              <span class="tournament-status" :class="champ.status">
                {{ getStatusLabel(champ.status) }}
              </span>
              <span class="status-icon">{{ expandedId === champ.uid ? '▼' : '▶' }}</span>
            </div>
          </div>
        </button>

        <div v-if="expandedId === champ.uid" class="card-content">
          <div class="content-section">
            <h4 class="section-title">Fases do Campeonato</h4>

            <div class="phase-list">
              <div v-for="phase in champ.phases" :key="phase.uid" class="phase-item">
                <div class="phase-main">
                  <span class="phase-name">{{ phase.phaseName }}</span>
                  <span class="phase-date">{{ formatDateRange(phase.beginAt, phase.endAt) }}</span>
                </div>

                <div class="phase-meta">
                  <span class="phase-status" :class="phase.status">{{ getStatusLabel(phase.status) }}</span>
                  <span class="phase-region">{{ phase.region || 'Global' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="content-section info-grid">
            <div class="info-item">
              <span class="info-label">Liga</span>
              <span class="info-value">{{ champ.leagueName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Série</span>
              <span class="info-value">{{ champ.serieName || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Região</span>
              <span class="info-value">{{ champ.region || 'Global' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Times</span>
              <span class="info-value">{{ champ.teamsCount || '?' }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-secondary" @click.stop="openBracket(champ)">
              Ver chaveamento
            </button>
          </div>
        </div>
      </article>
    </div>

    <Transition name="bracket-fade">
      <div v-if="bracketOpen" class="bracket-overlay" @click.self="closeBracket">
        <section class="bracket-modal">
          <header class="bracket-modal-header">
            <div class="header-left">
              <button class="close-btn-icon" @click="closeBracket">✕</button>
              <div class="header-info">
                <h3 class="modal-title">{{ selectedChampionship?.championshipName || 'Campeonato' }}</h3>
                <p class="modal-subtitle">{{ activeBracketStage?.label || selectedChampionship?.currentPhase?.phaseName
                  || 'Chaveamento' }}</p>
              </div>
            </div>
          </header>

          <div v-if="bracketStages.length > 1" class="bracket-nav-tabs">
            <button v-for="stage in bracketStages.slice(0, 4)" :key="stage.id" class="tab-btn"
              :class="{ active: stage.id === selectedBracketStageId }" @click="selectBracketStage(stage)">
              {{ stage.label }}
            </button>
          </div>

          <div v-if="bracketLoading" class="bracket-loading">
            <div class="spinner"></div>
          </div>

          <div v-else-if="bracketError" class="bracket-empty">
            <p>{{ bracketError }}</p>
          </div>

          <div v-else class="bracket-scroll">
            <div class="bracket-container">
              <div class="playoff-bracket">
                <div v-for="section in displayBracketSections" :key="section.key" class="bracket-round-section">
                  <h4 class="round-section-title">{{ section.title }}</h4>
                  <div class="rounds-flow">
                    <div v-for="(round, roundIndex) in section.rounds" :key="round.key" class="round-column"
                      :style="getRoundColumnStyle(roundIndex)">
                      <div class="flow-round-label">{{ round.label }}</div>
                      <div class="round-match-list">
                        <div v-for="match in round.matches" :key="match.key" class="playoff-matchup"
                          :class="{ 'is-live': match.isLive, clickable: match.isLive && match.liveUrl }"
                          :role="match.isLive && match.liveUrl ? 'button' : undefined"
                          :tabindex="match.isLive && match.liveUrl ? 0 : undefined" @click="openMatchLive(match)"
                          @keydown.enter.prevent="openMatchLive(match)">
                          <div v-if="match.isLive" class="live-indicator">LIVE</div>
                          <div class="team-box" :class="{ winner: match.winner === 0 }">
                            <span class="team-name-short">{{ match.teamA }}</span>
                            <span class="team-score-value">{{ match.scoreA }}</span>
                          </div>
                          <div class="divider"></div>
                          <div class="team-box" :class="{ winner: match.winner === 1 }">
                            <span class="team-name-short">{{ match.teamB }}</span>
                            <span class="team-score-value">{{ match.scoreB }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tournamentsAPI } from '../api.js'
import { getChampionshipPriority } from '../utils/matchDisplay.js'

const route = useRoute()
const router = useRouter()

const tournaments = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedSort = ref('importance')
const expandedId = ref(null)
const bracketOpen = ref(false)
const bracketLoading = ref(false)
const bracketError = ref('')
const selectedChampionship = ref(null)
const bracketStages = ref([])
const selectedBracketStageId = ref('')
const bracketRounds = ref([])
const globalSearchLoading = ref(false)
const globalSearchTournaments = ref([])
const hasGlobalSearchDataset = ref(false)
const SEARCH_WINDOW_DAYS = 30
const GLOBAL_SEARCH_PAGE_SIZE = 50
const GLOBAL_SEARCH_MAX_PAGES = 10
const isApplyingRouteQuery = ref(false)
const pendingBracketQuery = ref(null)
const MANAGED_QUERY_KEYS = ['q', 'status', 'sort', 'exp', 'br', 'champ', 'stage']

const activeBracketStage = computed(() => {
  return bracketStages.value.find((stage) => stage.id === selectedBracketStageId.value) || null
})

const activeBracketMode = computed(() => {
  const hasBracketRounds = bracketRounds.value.some((round) => /\b(upper|lower|semi|quarter|final|bracket)\b/i.test(round.label || ''))
  if (hasBracketRounds) return 'playoff'

  const label = normalizeText(activeBracketStage.value?.label || selectedChampionship.value?.currentPhase?.phaseName || '')
  if (/(playoff|bracket|upper|lower|semi|quarter|final)/i.test(label)) return 'playoff'
  if (/(group|stage|opening|qualifier)/i.test(label)) return 'group'
  return 'group'
})

const flatBracketMatches = computed(() => {
  return bracketRounds.value.flatMap((round) =>
    round.matches.map((match) => ({
      ...match,
      roundKey: round.key,
      roundLabel: round.label,
      roundSide: round.side
    }))
  )
})

const bracketSections = computed(() => {
  if (activeBracketMode.value !== 'playoff') return []

  const upperRounds = bracketRounds.value.filter((round) => round.side !== 'lower')
  const lowerRounds = bracketRounds.value.filter((round) => round.side === 'lower')

  const sections = []

  if (upperRounds.length > 0) {
    sections.push({
      key: 'upper',
      title: 'Upper Bracket',
      subtitle: 'Caminho principal do campeonato',
      rounds: upperRounds
    })
  }

  if (lowerRounds.length > 0) {
    sections.push({
      key: 'lower',
      title: 'Lower Bracket',
      subtitle: 'Rota de eliminação / repescagem',
      rounds: lowerRounds
    })
  }

  return sections
})

const displayBracketSections = computed(() => {
  if (activeBracketMode.value === 'playoff' && bracketSections.value.length > 0) {
    return bracketSections.value
  }

  if (bracketRounds.value.length === 0) return []

  return [
    {
      key: 'group',
      title: activeBracketStage.value?.label || 'Group Stage',
      rounds: bracketRounds.value
    }
  ]
})

const getRoundColumnStyle = (roundIndex) => {
  return {
    '--round-offset': `${roundIndex * 24}px`,
    '--round-gap': `${Math.min(26 + (roundIndex * 14), 72)}px`
  }
}

const statusFilters = [
  { key: 'all', label: 'Todos' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'running', label: 'Em andamento' },
  { key: 'finished', label: 'Finalizados' }
]

const statusPriority = {
  running: 3,
  upcoming: 2,
  finished: 1
}

const normalizeStatus = (rawStatus) => {
  const value = String(rawStatus || '').toLowerCase()

  if (['running', 'ongoing', 'in_progress'].includes(value)) return 'running'
  if (['finished', 'canceled', 'cancelled', 'abandoned'].includes(value)) return 'finished'
  if (['upcoming', 'not_started', 'scheduled'].includes(value)) return 'upcoming'

  return 'upcoming'
}

const getStatusLabel = (status) => {
  const labels = {
    upcoming: 'Próximo',
    running: 'Em andamento',
    finished: 'Finalizado'
  }
  return labels[status] || 'Indefinido'
}

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const toTitleCase = (value) => {
  const text = normalizeText(value)
  if (!text) return ''

  return text
    .split(' ')
    .map((word) => {
      if (/^(vs|de|do|da|das|dos|e)$/i.test(word)) return word.toLowerCase()
      if (/^tbd$/i.test(word)) return 'TBD'
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

const getTeamColor = (teamName) => {
  const colors = [
    '#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#ff9ff3',
    '#54a0ff', '#ff6a88', '#ffa502', '#00d2d3', '#845ef7',
    '#ff6348', '#ffd500', '#00d159', '#005eff', '#ff006d'
  ]

  if (!teamName) return colors[0]

  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = ((hash << 5) - hash) + teamName.charCodeAt(i)
    hash = hash & hash
  }

  return colors[Math.abs(hash) % colors.length]
}

const splitBracketLabel = (value) => {
  const cleaned = normalizeText(value)

  if (!cleaned) {
    return { title: 'Partida', subtitle: '' }
  }

  const [titlePart, ...rest] = cleaned.split(/:\s*/)
  const subtitle = normalizeText(rest.join(': '))

  return {
    title: toTitleCase(titlePart),
    subtitle
  }
}

const getBracketSide = (value) => {
  const text = normalizeText(value).toLowerCase()
  if (/(lower|loser|consolation|lb)/i.test(text)) return 'lower'
  if (/(upper|winner|winners|ub|opening)/i.test(text)) return 'upper'
  return 'upper'
}

const getBracketMatchLabel = (item) => {
  const rawName = normalizeText(item.name || item.full_name || item.label || item.stage || item.round_name || '')
  return splitBracketLabel(rawName)
}

const getChampionshipName = (tournament) => {
  const leagueName = tournament.league?.name || ''
  const serieName = tournament.serie?.full_name || tournament.serie?.name || ''
  const fallback = tournament.full_name || tournament.name || 'Campeonato CS2'

  const phaseWords = /(playoffs|stage|group|bracket|qualifier|final)/i

  const safeLeague = leagueName.trim()
  const safeSerie = serieName.trim()

  if (safeLeague && safeSerie && !phaseWords.test(safeSerie)) {
    if (!safeSerie.toLowerCase().includes(safeLeague.toLowerCase())) {
      return `${safeLeague} ${safeSerie}`
    }
    return safeSerie
  }

  if (leagueName && !phaseWords.test(leagueName)) return leagueName
  if (serieName && !phaseWords.test(serieName)) return serieName
  return fallback
}

const getBracketSourcePhase = (championship) => {
  return championship.currentPhase || championship.phases[0] || null
}

const getBracketStageOptions = (championship) => {
  return championship.phases
    .filter((phase) => phase.tournamentId)
    .sort((a, b) => new Date(a.beginAt || 0) - new Date(b.beginAt || 0))
    .map((phase, index) => ({
      id: String(phase.tournamentId),
      label: phase.phaseName || `Stage ${index + 1}`,
      status: phase.status,
      tournamentId: phase.tournamentId
    }))
}

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.matches)) return payload.matches
  if (Array.isArray(payload?.brackets)) return payload.brackets
  if (Array.isArray(payload?.rounds)) return payload.rounds.flatMap((round) => round.matches || [])
  if (Array.isArray(payload?.nodes)) return payload.nodes
  return []
}

const getBracketDepth = (item, lookup, depthCache) => {
  const itemId = item?.id
  if (itemId == null) return getRoundSortValue(item)
  if (depthCache.has(itemId)) return depthCache.get(itemId)

  const previousMatches = Array.isArray(item.previous_matches) ? item.previous_matches : []
  if (previousMatches.length === 0) {
    depthCache.set(itemId, 0)
    return 0
  }

  const previousDepths = previousMatches
    .map((reference) => lookup.get(reference.match_id))
    .filter(Boolean)
    .map((previousMatch) => getBracketDepth(previousMatch, lookup, depthCache))

  const depth = previousDepths.length > 0 ? Math.max(...previousDepths) + 1 : getRoundSortValue(item)
  depthCache.set(itemId, depth)
  return depth
}

const getRoundLabel = (item) => {
  const label = item.round_name || item.round?.name || item.round || item.number || item.stage || item.label || item.name || 'Round'
  return splitBracketLabel(label).title
}

const normalizeRoundLabel = (label) => {
  const text = normalizeText(label)
  if (!text) return 'Round'

  return text
    .replace(/\s+#?\d+$/i, '')
    .replace(/\s+(\d+)(st|nd|rd|th)$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const getRoundSequence = (item) => {
  const raw = normalizeText(item.round_name || item.round?.name || item.round || item.stage || item.label || item.name || '')
  const match = raw.match(/(?:\s|#)(\d+)$/)
  return match ? Number(match[1]) : Number(item.number || 0) || 0
}

const getRoundSide = (item) => {
  const label = item.round_name || item.round?.name || item.round || item.stage || item.label || item.name || ''
  return getBracketSide(label)
}

const getRoundSortValue = (item) => {
  const candidate = item.round_number ?? item.round ?? item.number
  if (Number.isFinite(Number(candidate))) return Number(candidate)
  const label = String(item.normalizedRoundLabel || getRoundLabel(item)).toLowerCase()
  if (label.includes('round of 32')) return 10
  if (label.includes('round of 16') || label.includes('octa')) return 20
  if (label.includes('quarter')) return 30
  if (label.includes('semi')) return 40
  if (label.includes('final') && !label.includes('grand')) return 50
  if (label.includes('grand final')) return 60
  if (label.includes('playoff')) return 25
  if (label.includes('group')) return 5
  return 1000
}

const getFirstDefined = (...values) => values.find((value) => value !== null && value !== undefined && value !== '')

const parseScoreValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatMatchScore = (rawScore, statusKey) => {
  if (statusKey === 'upcoming') return '-'
  const parsed = parseScoreValue(rawScore)
  return parsed === null ? '-' : String(parsed)
}

const getOfficialLiveUrl = (item) => {
  const streams = Array.isArray(item?.streams_list) ? item.streams_list : []

  const direct = [
    item?.official_stream_url,
    item?.official_live_url,
    item?.stream_url,
    item?.live_url,
    item?.broadcast_url,
    item?.watch_url,
    item?.twitch_url
  ]

  const streamCandidates = streams.flatMap((stream) => [
    stream?.official_url,
    stream?.raw_url,
    stream?.embed_url,
    stream?.url
  ])

  const candidate = [...direct, ...streamCandidates]
    .find((value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim()))

  return candidate ? candidate.trim() : ''
}

const normalizeBracketMatches = (payload) => {
  const items = extractArray(payload)
  const lookup = new Map(items.filter((item) => item?.id != null).map((item) => [item.id, item]))
  const depthCache = new Map()

  const rounds = new Map()

  items.forEach((item, index) => {
    const rawRoundLabel = getRoundLabel(item)
    const roundLabel = normalizeRoundLabel(rawRoundLabel)
    const depthOrder = getBracketDepth(item, lookup, depthCache)
    const semanticOrder = getRoundSortValue({ ...item, normalizedRoundLabel: roundLabel })
    const roundOrder = semanticOrder === 1000 ? depthOrder : semanticOrder
    const roundSide = getRoundSide(item)
    const roundKey = `${roundSide}-${roundOrder}-${roundLabel}`

    if (!rounds.has(roundKey)) {
      rounds.set(roundKey, {
        key: roundKey,
        label: roundLabel,
        order: roundOrder,
        side: roundSide,
        matches: []
      })
    }

    const teamA = item.opponents?.[0]?.opponent?.name || item.opponents?.[0]?.name || item.team1?.name || item.home_team?.name || 'TBD'
    const teamB = item.opponents?.[1]?.opponent?.name || item.opponents?.[1]?.name || item.team2?.name || item.away_team?.name || 'TBD'
    const statusKey = normalizeStatus(item.status || item.state || 'upcoming')
    const rawScoreA = getFirstDefined(item.results?.[0]?.score, item.scores?.[0], item.team1_score)
    const rawScoreB = getFirstDefined(item.results?.[1]?.score, item.scores?.[1], item.team2_score)
    const scoreA = formatMatchScore(rawScoreA, statusKey)
    const scoreB = formatMatchScore(rawScoreB, statusKey)
    const matchLabel = getBracketMatchLabel(item)
    const matchupLabel = matchLabel.subtitle || `${teamA} vs ${teamB}`

    const scoreANumeric = parseScoreValue(rawScoreA)
    const scoreBNumeric = parseScoreValue(rawScoreB)

    const winner = scoreANumeric !== null && scoreBNumeric !== null
      ? scoreANumeric > scoreBNumeric
        ? 0
        : scoreBNumeric > scoreANumeric
          ? 1
          : null
      : null

    const liveUrl = getOfficialLiveUrl(item)
    const isLive = statusKey === 'running'

    const timeValue = item.begin_at || item.scheduled_at || item.start_at || item.date || ''

    rounds.get(roundKey).matches.push({
      key: item.id || `${roundKey}-${index}`,
      teamA,
      teamB,
      scoreA,
      scoreB,
      winner,
      isLive,
      liveUrl,
      statusKey,
      sequence: getRoundSequence(item),
      stageLabel: roundLabel,
      matchTitle: matchLabel.title,
      matchSubtitle: matchupLabel,
      statusLabel: getStatusLabel(statusKey),
      timeLabel: timeValue ? new Date(timeValue).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sem horário',
      numberLabel: item.number ? `Jogo ${item.number}` : `Partida ${index + 1}`
    })
  })

  return Array.from(rounds.values())
    .sort((a, b) => a.order - b.order || String(a.label).localeCompare(String(b.label)))
    .map((round) => ({
      ...round,
      matches: round.matches.sort((a, b) => {
        const seqDiff = (a.sequence || 0) - (b.sequence || 0)
        if (seqDiff !== 0) return seqDiff
        return String(a.key).localeCompare(String(b.key))
      })
    }))
}

const closeBracket = () => {
  bracketOpen.value = false
}

const openBracket = async (championship, options = {}) => {
  const preferredStageId = String(options.stageId || '').trim()
  selectedChampionship.value = championship
  bracketStages.value = getBracketStageOptions(championship)
  const initialStage = bracketStages.value.find((stage) => stage.id === preferredStageId)
    || bracketStages.value.find((stage) => stage.id === String(championship.currentPhase?.tournamentId))
    || bracketStages.value.find((stage) => stage.status === 'running')
    || bracketStages.value[0]

  selectedBracketStageId.value = initialStage?.id || ''
  bracketOpen.value = true
  bracketError.value = ''
  bracketRounds.value = []

  try {
    if (!initialStage?.tournamentId) {
      throw new Error('Sem fase com chaveamento disponível')
    }

    await loadBracketStage(initialStage)
  } catch (error) {
    bracketError.value = error?.message || 'Não foi possível carregar o chaveamento'
  } finally {
    bracketLoading.value = false
  }
}

const loadBracketStage = async (stage) => {
  if (!stage?.tournamentId) {
    throw new Error('Sem fase com chaveamento disponível')
  }

  bracketLoading.value = true
  bracketError.value = ''
  bracketRounds.value = []

  try {
    const response = await tournamentsAPI.getBrackets(stage.tournamentId, {
      per_page: 100
    })

    const normalized = normalizeBracketMatches(response.data)
    if (!normalized.length) {
      throw new Error('Chaveamento indisponível para este estágio')
    }

    bracketRounds.value = normalized
    selectedBracketStageId.value = String(stage.tournamentId)
  } finally {
    bracketLoading.value = false
  }
}

const selectBracketStage = async (stage) => {
  if (!stage || String(stage.tournamentId) === selectedBracketStageId.value) return
  try {
    await loadBracketStage(stage)
  } catch (error) {
    bracketError.value = error?.message || 'Não foi possível carregar o estágio selecionado'
  }
}

const openMatchLive = (match) => {
  if (!match?.isLive || !match?.liveUrl) return
  window.open(match.liveUrl, '_blank', 'noopener,noreferrer')
}

const inferStatusByDate = (beginAt, endAt) => {
  const now = Date.now()
  const begin = beginAt ? new Date(beginAt).getTime() : null
  const end = endAt ? new Date(endAt).getTime() : null

  if (begin && end) {
    if (now >= begin && now <= end) return 'running'
    if (now > end) return 'finished'
    return 'upcoming'
  }

  if (begin && !end) {
    return now >= begin ? 'running' : 'upcoming'
  }

  return null
}

const resolvePhaseStatus = (tournament) => {
  const byDate = inferStatusByDate(tournament.begin_at, tournament.end_at)
  const normalized = normalizeStatus(tournament.status)

  if (byDate === 'running' || byDate === 'finished') return byDate
  if (normalized === 'running' || normalized === 'finished') return normalized
  return byDate || normalized
}

const pickGroupStatus = (phases) => {
  if (phases.some((p) => p.status === 'running')) return 'running'
  if (phases.some((p) => p.status === 'upcoming')) return 'upcoming'
  return 'finished'
}

const pickCurrentPhase = (phases) => {
  const running = phases
    .filter((p) => p.status === 'running')
    .sort((a, b) => new Date(a.beginAt || 0) - new Date(b.beginAt || 0))

  if (running.length > 0) return running[0]

  const upcoming = phases
    .filter((p) => p.status === 'upcoming')
    .sort((a, b) => new Date(a.beginAt || 0) - new Date(b.beginAt || 0))

  if (upcoming.length > 0) return upcoming[0]

  const finished = phases
    .filter((p) => p.status === 'finished')
    .sort((a, b) => new Date(b.endAt || b.beginAt || 0) - new Date(a.endAt || a.beginAt || 0))

  return finished[0] || phases[0]
}

const getGroupKey = (tournament) => {
  const leaguePart = tournament.league?.id || tournament.league?.name || 'league'
  const seriePart = tournament.serie?.id || tournament.serie?.name || 'série'
  return `${leaguePart}-${seriePart}`
}

const parseNumericSafe = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const computeGroupImportance = (group) => {
  return getChampionshipPriority({
    championshipName: group.championshipName,
    leagueName: group.leagueName,
    serieName: group.serieName,
    teamsCount: group.teamsCount,
    teams_count: group.teams_count,
    prizePool: group.prizePool,
    prize_pool: group.prize_pool,
    tier: group.tier,
    leagueTier: group.leagueTier,
    phases: group.phases
  })
}

const groupedChampionships = computed(() => {
  const sourceTournaments = searchQuery.value.trim()
    ? (hasGlobalSearchDataset.value ? globalSearchTournaments.value : [])
    : tournaments.value

  const grouped = new Map()

  sourceTournaments.forEach((tournament, index) => {
    const key = getGroupKey(tournament)

    if (!grouped.has(key)) {
      grouped.set(key, {
        uid: key,
        championshipName: getChampionshipName(tournament),
        leagueName: tournament.league?.name || '',
        serieName: tournament.serie?.full_name || tournament.serie?.name || '',
        region: tournament.region || '',
        teamsCount: tournament.teams_count || tournament.number_of_teams || null,
        teams_count: tournament.teams_count || tournament.number_of_teams || null,
        prizePool: tournament.prize_pool || null,
        prize_pool: tournament.prize_pool || null,
        tier: tournament.tier || tournament.league?.tier || '',
        leagueTier: tournament.league?.tier || tournament.serie?.tier || '',
        importanceScore: 0,
        status: 'upcoming',
        latestDate: tournament.begin_at || tournament.created_at || null,
        phases: []
      })
    }

    const current = grouped.get(key)

    const phaseStatus = resolvePhaseStatus(tournament)

    const latest = new Date(current.latestDate || 0).getTime()
    const incoming = new Date(tournament.begin_at || tournament.created_at || 0).getTime()
    if (incoming > latest) {
      current.latestDate = tournament.begin_at || tournament.created_at || current.latestDate
    }

    const currentTeams = Math.max(
      parseNumericSafe(current.teamsCount),
      parseNumericSafe(tournament.teams_count),
      parseNumericSafe(tournament.number_of_teams)
    )
    current.teamsCount = currentTeams || current.teamsCount
    current.teams_count = current.teamsCount

    const currentPrize = Math.max(
      parseNumericSafe(current.prizePool),
      parseNumericSafe(tournament.prize_pool)
    )
    current.prizePool = currentPrize || current.prizePool
    current.prize_pool = current.prizePool

    if (!current.tier && (tournament.tier || tournament.league?.tier)) {
      current.tier = tournament.tier || tournament.league?.tier
    }

    if (!current.leagueTier && (tournament.league?.tier || tournament.serie?.tier)) {
      current.leagueTier = tournament.league?.tier || tournament.serie?.tier
    }

    current.phases.push({
      uid: `${tournament.id || index}-${index}`,
      phaseName: tournament.name || tournament.full_name || 'Fase',
      beginAt: tournament.begin_at,
      endAt: tournament.end_at,
      status: phaseStatus,
      region: tournament.region || tournament.league?.region || '',
      tournamentId: tournament.id
    })

    current.importanceScore = Math.max(parseNumericSafe(current.importanceScore), computeGroupImportance(current))
  })

  return Array.from(grouped.values()).map((group) => {
    group.phases.sort((a, b) => new Date(a.beginAt || 0) - new Date(b.beginAt || 0))
    group.status = pickGroupStatus(group.phases)
    group.currentPhase = pickCurrentPhase(group.phases)
    return group
  })
})

const filteredChampionships = computed(() => {
  let result = groupedChampionships.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((champ) => {
      const inChampionship = champ.championshipName.toLowerCase().includes(query)
      const inLeague = champ.leagueName.toLowerCase().includes(query)
      const inSerie = champ.serieName.toLowerCase().includes(query)
      const inPhases = champ.phases.some((phase) => phase.phaseName.toLowerCase().includes(query))
      return inChampionship || inLeague || inSerie || inPhases
    })
  }

  if (selectedStatus.value !== 'all') {
    result = result.filter((champ) => champ.status === selectedStatus.value)
  }

  return result.sort((a, b) => {
    if (selectedSort.value === 'importance') {
      const explicitDiff = parseNumericSafe(b.importanceScore) - parseNumericSafe(a.importanceScore)
      if (explicitDiff !== 0) return explicitDiff

      const priorityDiff = getChampionshipPriority(b) - getChampionshipPriority(a)
      if (priorityDiff !== 0) return priorityDiff
    }

    const statusDiff = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0)
    if (statusDiff !== 0) return statusDiff

    return new Date(b.latestDate || 0) - new Date(a.latestDate || 0)
  })
})

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

const formatDateRange = (beginAt, endAt) => {
  if (!beginAt && !endAt) return 'Data indefinida'

  const format = (date) => {
    if (!date) return 'TBD'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
  }

  if (!endAt) return `${format(beginAt)}`
  return `${format(beginAt)} - ${format(endAt)}`
}

const parseBracketOpen = (value) => {
  const normalized = String(value || '').toLowerCase()
  return normalized === '1' || normalized === 'true'
}

const sanitizeStatus = (value) => {
  const allowed = new Set(['all', 'upcoming', 'running', 'finished'])
  return allowed.has(String(value || '')) ? String(value) : 'all'
}

const sanitizeSort = (value) => {
  const allowed = new Set(['importance', 'recent'])
  return allowed.has(String(value || '')) ? String(value) : 'importance'
}

const getRouteQueryWithoutManagedKeys = () => {
  const base = { ...route.query }
  MANAGED_QUERY_KEYS.forEach((key) => {
    delete base[key]
  })
  return base
}

const buildManagedQueryFromState = () => {
  const nextQuery = getRouteQueryWithoutManagedKeys()

  const normalizedSearch = searchQuery.value.trim()
  if (normalizedSearch) nextQuery.q = normalizedSearch

  if (selectedStatus.value !== 'all') nextQuery.status = selectedStatus.value
  if (selectedSort.value !== 'importance') nextQuery.sort = selectedSort.value
  if (expandedId.value) nextQuery.exp = String(expandedId.value)

  if (bracketOpen.value && selectedChampionship.value?.uid) {
    nextQuery.br = '1'
    nextQuery.champ = String(selectedChampionship.value.uid)
    if (selectedBracketStageId.value) {
      nextQuery.stage = String(selectedBracketStageId.value)
    }
  }

  return nextQuery
}

const syncRouteQueryFromState = async () => {
  const nextQuery = buildManagedQueryFromState()
  const currentSerialized = JSON.stringify(route.query)
  const nextSerialized = JSON.stringify(nextQuery)
  if (currentSerialized === nextSerialized) return
  await router.replace({ query: nextQuery })
}

const applyRouteQueryToState = (query) => {
  isApplyingRouteQuery.value = true

  const nextSearch = String(query.q || '').trim()
  if (nextSearch !== searchQuery.value) searchQuery.value = nextSearch

  const nextStatus = sanitizeStatus(query.status)
  if (nextStatus !== selectedStatus.value) selectedStatus.value = nextStatus

  const nextSort = sanitizeSort(query.sort)
  if (nextSort !== selectedSort.value) selectedSort.value = nextSort

  const nextExpanded = String(query.exp || '').trim() || null
  if (nextExpanded !== expandedId.value) expandedId.value = nextExpanded

  const shouldOpenBracket = parseBracketOpen(query.br)
  const nextChampUid = String(query.champ || '').trim()
  const nextStageId = String(query.stage || '').trim()

  if (shouldOpenBracket && nextChampUid) {
    pendingBracketQuery.value = { champUid: nextChampUid, stageId: nextStageId }
  } else {
    pendingBracketQuery.value = null
    if (bracketOpen.value) {
      closeBracket()
    }
  }

  isApplyingRouteQuery.value = false
}

const resolvePendingBracketQuery = async () => {
  const pending = pendingBracketQuery.value
  if (!pending?.champUid) return
  if (loading.value || globalSearchLoading.value) return

  if (bracketOpen.value && selectedChampionship.value?.uid === pending.champUid) {
    if (pending.stageId && pending.stageId !== selectedBracketStageId.value) {
      const nextStage = bracketStages.value.find((stage) => stage.id === pending.stageId)
      if (nextStage) {
        await selectBracketStage(nextStage)
      }
    }
    pendingBracketQuery.value = null
    return
  }

  const championship = groupedChampionships.value.find((item) => item.uid === pending.champUid)
  if (!championship) return

  pendingBracketQuery.value = null
  await openBracket(championship, { stageId: pending.stageId })
}

onMounted(async () => {
  try {
    loading.value = true
    applyRouteQueryToState(route.query)

    const response = await tournamentsAPI.getAll({
      per_page: 100,
      sort: '-modified_at'
    })
    tournaments.value = response.data || []
    await resolvePendingBracketQuery()
  } catch (error) {
    console.error('Error fetching tournaments:', error)
  } finally {
    loading.value = false
  }
})

const ensureGlobalSearchDataset = async () => {
  if (hasGlobalSearchDataset.value || globalSearchLoading.value) return

  globalSearchLoading.value = true
  try {
    const now = Date.now()
    const lowerLimit = now - (SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const upperLimit = now + (SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const collected = []
    let reachedWindow = false

    for (let page = 1; page <= GLOBAL_SEARCH_MAX_PAGES; page += 1) {
      const response = await tournamentsAPI.getAll({
        all: false,
        per_page: GLOBAL_SEARCH_PAGE_SIZE,
        page,
        sort: '-begin_at'
      })

      const pageItems = Array.isArray(response.data) ? response.data : []
      if (pageItems.length === 0) break

      pageItems.forEach((tournament) => {
        const timestamp = Date.parse(tournament?.begin_at || tournament?.modified_at || tournament?.created_at)
        if (!Number.isFinite(timestamp)) return

        if (timestamp <= upperLimit) {
          reachedWindow = true
        }

        if (timestamp >= lowerLimit && timestamp <= upperLimit) {
          collected.push(tournament)
        }
      })

      const lastTimestamp = Date.parse(
        pageItems[pageItems.length - 1]?.begin_at
        || pageItems[pageItems.length - 1]?.modified_at
        || pageItems[pageItems.length - 1]?.created_at
      )

      if (!Number.isFinite(lastTimestamp) || pageItems.length < GLOBAL_SEARCH_PAGE_SIZE) {
        break
      }

      if (reachedWindow && lastTimestamp < lowerLimit) {
        break
      }
    }

    globalSearchTournaments.value = collected
    hasGlobalSearchDataset.value = true
  } finally {
    globalSearchLoading.value = false
  }
}

watch(
  () => searchQuery.value,
  async (value) => {
    if (value.trim()) {
      await ensureGlobalSearchDataset()
    }
  }
)

watch(
  () => route.query,
  async (query) => {
    applyRouteQueryToState(query)
    await resolvePendingBracketQuery()
  },
  { immediate: true }
)

watch(
  [searchQuery, selectedStatus, selectedSort, expandedId, bracketOpen, selectedBracketStageId, () => selectedChampionship.value?.uid],
  async () => {
    if (isApplyingRouteQuery.value) return
    await syncRouteQueryFromState()
  }
)

watch(
  () => groupedChampionships.value,
  async () => {
    await resolvePendingBracketQuery()
  }
)
</script>

<style scoped>
.tournaments-view {
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
  color: rgba(228, 228, 231, 0.7);
  margin: 0;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1.5fr minmax(170px, 0.7fr) minmax(220px, 0.9fr);
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
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  border-radius: 10px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.tournaments-grid {
  display: grid;
  gap: 14px;
}

.tournament-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  width: 100%;
  border: none;
  background: transparent;
  padding: 18px 20px;
  cursor: pointer;
  text-align: left;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.tournament-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(190, 231, 221, 0.65);
  font-weight: 700;
}

.tournament-name {
  font-size: 20px;
  font-weight: 900;
  margin: 0;
  color: #ecf6f3;
  letter-spacing: 0.01em;
}

.phase-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.phase-chip {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  color: #86efd6;
  background: rgba(67, 203, 156, 0.14);
  border: 1px solid rgba(67, 203, 156, 0.3);
  border-radius: 999px;
  padding: 3px 10px;
}

.phase-count {
  font-size: 11px;
  color: rgba(204, 236, 227, 0.75);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.header-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tournament-status {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: 999px;
  padding: 4px 10px;
  border: 1px solid rgba(67, 203, 156, 0.35);
  color: #74f5ce;
  background: rgba(67, 203, 156, 0.12);
}

.tournament-status.running {
  color: #ffc6c6;
  border-color: rgba(255, 107, 107, 0.4);
  background: rgba(255, 107, 107, 0.16);
}

.tournament-status.finished {
  color: #bfe7ff;
  border-color: rgba(111, 170, 255, 0.4);
  background: rgba(111, 170, 255, 0.16);
}

.status-icon {
  color: rgba(133, 244, 215, 0.85);
  font-size: 13px;
}

.card-content {
  border-top: 1px solid rgba(67, 203, 156, 0.16);
  padding: 0 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.btn-secondary {
  border-radius: 999px !important;
  padding: 10px 16px !important;
  font-size: 12px !important;
}

.bracket-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.bracket-modal {
  width: min(98vw, 1560px);
  max-height: 88vh;
  margin-top: 80px;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(67, 203, 156, 0.3);
  background:
    radial-gradient(circle at top left, rgba(67, 203, 156, 0.12), transparent 26%),
    radial-gradient(circle at bottom right, rgba(67, 203, 156, 0.08), transparent 22%),
    linear-gradient(180deg, rgba(3, 11, 10, 0.98), rgba(1, 6, 6, 0.99));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62), 0 0 50px rgba(67, 203, 156, 0.1), inset 0 0 0 1px rgba(67, 203, 156, 0.06);
  display: flex;
  flex-direction: column;
}

.bracket-modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 22px 18px;
  border-bottom: 1px solid rgba(67, 203, 156, 0.16);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.close-btn-icon {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(67, 203, 156, 0.3);
  background: rgba(67, 203, 156, 0.08);
  color: #dff8f0;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.close-btn-icon:hover {
  background: rgba(67, 203, 156, 0.15);
  border-color: rgba(67, 203, 156, 0.5);
}

.header-info {
  flex: 1;
}

.bracket-nav-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(67, 203, 156, 0.12);
}

.tab-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(67, 203, 156, 0.2);
  background: rgba(67, 203, 156, 0.05);
  color: #e0f2f0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  border-color: rgba(67, 203, 156, 0.4);
  background: rgba(67, 203, 156, 0.12);
}

.tab-btn.active {
  background: rgba(67, 203, 156, 0.25);
  border-color: rgba(67, 203, 156, 0.6);
  color: #7afce5;
}

.playoff-bracket {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.bracket-round-section {
  background: rgba(67, 203, 156, 0.04);
  border: 1px solid rgba(67, 203, 156, 0.12);
  border-radius: 14px;
  padding: 20px;
}

.round-section-title {
  font-size: 16px;
  font-weight: 800;
  color: #8ef8df;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rounds-flow {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  padding: 10px 10px 12px 0;
}

.round-column {
  flex: 0 0 auto;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  margin-top: var(--round-offset, 0px);
  justify-content: center;
}

.round-column:not(:last-child)::before {
  content: '';
  position: absolute;
  right: -22px;
  top: 36px;
  width: 22px;
  height: 2px;
  background: rgba(67, 203, 156, 0.28);
}

.round-column:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -22px;
  top: 36px;
  width: 22px;
  height: calc(100% - 72px);
  border-right: 2px solid rgba(67, 203, 156, 0.22);
  border-bottom: 2px solid rgba(67, 203, 156, 0.22);
  border-bottom-right-radius: 12px;
  pointer-events: none;
}

.flow-round-label {
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  color: rgba(228, 228, 231, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(67, 203, 156, 0.1);
}

.round-match-list {
  display: flex;
  flex-direction: column;
  gap: var(--round-gap, 28px);
}

.playoff-matchup {
  border: 1px solid rgba(67, 203, 156, 0.2);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(5, 15, 13, 0.78), rgba(2, 9, 8, 0.9));
  overflow: hidden;
  transition: all 0.2s ease;
  min-height: 82px;
}

.playoff-matchup.clickable {
  cursor: pointer;
}

.playoff-matchup.is-live {
  border-color: rgba(255, 59, 48, 0.85);
  box-shadow: 0 0 0 1px rgba(255, 59, 48, 0.3), 0 0 18px rgba(255, 59, 48, 0.22);
}

.playoff-matchup.is-live .team-score-value {
  color: #ff3b30;
}

.live-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 10px;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffd9d6;
  background: linear-gradient(90deg, rgba(255, 59, 48, 0.78), rgba(170, 22, 22, 0.9));
}

.playoff-matchup:hover {
  border-color: rgba(67, 203, 156, 0.4);
  background: rgba(6, 14, 12, 0.8);
}

.team-box {
  padding: 12px 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid rgba(67, 203, 156, 0.1);
  justify-content: space-around;
}

.team-box:last-child {
  border-bottom: none;
}

.team-box.winner {
  background: rgba(67, 203, 156, 0.1);
}

.team-name-short {
  font-size: 13px;
  font-weight: 700;
  width: 100px;
  color: #e0f2f0;
  line-height: 1.3;
  word-break: break-word;
}

.team-box.winner .team-name-short {
  color: #7afce5;
}

.team-score-value {
  font-size: 18px;
  font-weight: 900;
  color: #8ef8df;
}

.divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(67, 203, 156, 0.15), transparent);
}


.modal-title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: #edf7f4;
}

.modal-subtitle {
  margin: 6px 0 0;
  color: rgba(191, 227, 218, 0.72);
  font-size: 13px;
}

.bracket-loading,
.bracket-empty {
  padding: 56px 20px;
  text-align: center;
}

.bracket-scroll {
  overflow: auto;
  padding: 18px 20px 24px;
}

.bracket-stage-strip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.stage-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(67, 203, 156, 0.1);
  border: 1px solid rgba(67, 203, 156, 0.22);
  color: #baf6e4;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
}

.group-stage-list {
  display: none;
}

.stage-match-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(67, 203, 156, 0.14);
  background: linear-gradient(180deg, rgba(6, 14, 12, 0.72), rgba(2, 8, 7, 0.9));
}

.stage-match-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.stage-match-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.stage-match-teams {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-team-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(67, 203, 156, 0.07);
  border: 1px solid rgba(67, 203, 156, 0.08);
}

.stage-team-separator {
  align-self: center;
  color: rgba(194, 231, 221, 0.58);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 900;
}

.stage-match-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  min-width: 92px;
  gap: 8px;
  padding-left: 10px;
  border-left: 1px solid rgba(67, 203, 156, 0.12);
}

.stage-match-status,
.stage-match-number {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(194, 231, 221, 0.72);
}

.bracket-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bracket-section {
  border: 1px solid rgba(67, 203, 156, 0.14);
  border-radius: 18px;
  padding: 24px;
  background: linear-gradient(180deg, rgba(6, 14, 12, 0.58), rgba(2, 8, 7, 0.84));
}

.bracket-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(67, 203, 156, 0.18);
}

.bracket-section-header h4 {
  margin: 0;
  color: #effaf7;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.bracket-section-header p {
  margin: 8px 0 0;
  color: rgba(194, 231, 221, 0.72);
  font-size: 14px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(180, 232, 219, 0.7);
  font-weight: 700;
}

.bracket-visual {
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 16px;
}

.bracket-rounds {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  min-width: max-content;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  position: relative;
}

.bracket-round::after {
  content: '';
  position: absolute;
  top: 60px;
  left: 100%;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(67, 203, 156, 0.4), transparent);
}

.round-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(67, 203, 156, 0.08);
  border: 1px solid rgba(67, 203, 156, 0.2);
  border-radius: 10px;
}

.round-label {
  font-size: 16px;
  font-weight: 800;
  color: #8ef8df;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.round-meta {
  font-size: 12px;
  color: rgba(194, 231, 221, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.matches-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bracket-matchup {
  position: relative;
  background: linear-gradient(180deg, rgba(8, 22, 19, 0.7), rgba(2, 9, 8, 0.85));
  border: 1px solid rgba(67, 203, 156, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.matchup-container {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.matchup-team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(67, 203, 156, 0.1);
}

.matchup-team:last-child {
  border-bottom: none;
}

.matchup-team.is-winner {
  background: rgba(67, 203, 156, 0.12);
}

.matchup-team.is-winner .team-badge {
  box-shadow: 0 0 12px rgba(67, 203, 156, 0.5);
  border: 2px solid rgba(67, 203, 156, 0.6);
}

.team-slot {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.team-badge {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, currentColor 0%, rgba(255, 255, 255, 0.1) 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.team-name {
  font-size: 15px;
  font-weight: 800;
  color: #e4e4e7;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-score {
  font-size: 20px;
  font-weight: 900;
  color: #8ef8df;
}

.match-schedule {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.time-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  background: rgba(67, 203, 156, 0.15);
  color: rgba(194, 231, 221, 0.8);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.matchup-divider {
  height: 2px;
  background: linear-gradient(90deg, rgba(67, 203, 156, 0.1), transparent);
}

.bracket-fade-enter-active,
.bracket-fade-leave-active {
  transition: opacity 180ms ease;
}

.bracket-fade-enter-from,
.bracket-fade-leave-to {
  opacity: 0;
}

.section-title {
  margin: 14px 0 0;
  font-size: 13px;
  text-transform: uppercase;
  color: #8df4da;
  letter-spacing: 0.08em;
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phase-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(67, 203, 156, 0.18);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(6, 14, 12, 0.62);
}

.phase-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phase-name {
  color: #e9f3f0;
  font-weight: 700;
  font-size: 14px;
}

.phase-date {
  color: rgba(190, 225, 216, 0.7);
  font-size: 12px;
}

.phase-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.phase-status {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7af2ce;
}

.phase-region {
  font-size: 11px;
  color: rgba(190, 225, 216, 0.65);
  text-transform: uppercase;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(67, 203, 156, 0.16);
  border-radius: 9px;
  padding: 10px;
  background: rgba(6, 14, 12, 0.62);
}

.info-value {
  color: #e7f4ef;
  font-size: 14px;
  font-weight: 700;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 70px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0 auto 14px;
  border: 3px solid rgba(67, 203, 156, 0.25);
  border-top-color: #43cb9c;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 34px;
  }

  .controls {
    gap: 10px;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    align-items: stretch;
  }

  .filter-select,
  .search-input {
    height: 44px;
    font-size: 13px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-side {
    width: 100%;
    justify-content: space-between;
  }

  .phase-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .phase-meta {
    align-items: flex-start;
  }

  .bracket-overlay {
    padding: 12px;
  }

  .bracket-modal-header {
    flex-direction: column;
  }

  .bracket-modal {
    width: calc(100vw - 12px);
    max-height: 85vh;
  }

  .bracket-modal-header {
    padding: 14px 14px 12px;
  }

  .close-btn-icon {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .modal-title {
    font-size: 18px;
  }

  .modal-subtitle {
    font-size: 12px;
  }

  .bracket-nav-tabs {
    padding: 10px 14px;
    gap: 6px;
  }

  .tab-btn {
    padding: 6px 11px;
    font-size: 11px;
  }

  .bracket-scroll {
    padding: 12px 14px 16px;
  }

  .round-column {
    min-width: 180px;
    margin-top: 0;
  }

  .round-column:not(:last-child)::before,
  .round-column:not(:last-child)::after {
    display: none;
  }

  .team-box {
    padding: 10px;
  }

  .team-name-short {
    font-size: 12px;
  }

  .team-score-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .bracket-overlay {
    padding: 8px;
  }

  .bracket-modal {
    width: calc(100vw - 8px);
    border-radius: 16px;
  }

  .bracket-modal-header {
    padding: 12px 12px 10px;
  }

  .modal-title {
    font-size: 16px;
  }

  .modal-subtitle {
    font-size: 11px;
  }

  .round-column {
    min-width: 150px;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 28px;
  }

  .page-subtitle,
  .search-context {
    font-size: 12px;
  }

  .card-header {
    padding: 14px;
  }

  .card-content {
    padding: 0 14px 14px;
    gap: 12px;
  }

  .tournament-name {
    font-size: 17px;
  }

  .bracket-summary {
    grid-template-columns: 1fr;
  }

  .bracket-section {
    padding: 12px;
  }

  .bracket-section-header h4 {
    font-size: 18px;
  }

  .bracket-round {
    min-width: 200px;
  }

  .matchup-team {
    padding: 10px 12px;
  }

  .team-badge {
    width: 40px;
    height: 40px;
  }

  .team-name {
    font-size: 12px;
  }

  .team-score {
    font-size: 18px;
  }
}
</style>
