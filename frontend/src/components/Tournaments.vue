<template>
  <div class="tournaments-view">
    <div class="page-header">
      <h1 class="page-title">Torneios CS2</h1>
      <p class="page-subtitle">Campeonatos organizados com fases e status em tempo real</p>
    </div>

    <div class="controls">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar campeonato ou fase..."
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>

      <div class="filter-controls">
        <button
          v-for="status in statusFilters"
          :key="status.key"
          @click="selectedStatus = status.key"
          class="filter-btn"
          :class="{ active: selectedStatus === status.key }"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando torneios...</p>
    </div>

    <div v-else-if="filteredChampionships.length === 0" class="empty-state">
      <div class="empty-icon">🏆</div>
      <p>Nenhum campeonato encontrado</p>
      <p class="empty-hint">Tente ajustar o filtro ou busca</p>
    </div>

    <div v-else class="tournaments-grid">
      <article
        v-for="champ in filteredChampionships"
        :key="champ.uid"
        class="tournament-card"
        :class="{ expanded: expandedId === champ.uid }"
      >
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
            <div>
              <span class="modal-kicker">Chaveamento</span>
              <h3 class="modal-title">{{ selectedChampionship?.championshipName || 'Campeonato' }}</h3>
              <p class="modal-subtitle">
                {{ activeBracketStage?.label || selectedChampionship?.currentPhase?.phaseName || 'Fase selecionada' }}
              </p>
            </div>

            <button class="close-btn" @click="closeBracket">Fechar painel</button>
          </header>

          <div class="bracket-stage-tabs">
            <button
              v-for="stage in bracketStages"
              :key="stage.id"
              class="stage-tab"
              :class="{ active: stage.id === selectedBracketStageId }"
              @click="selectBracketStage(stage)"
            >
              <span class="stage-tab-label">{{ stage.label }}</span>
              <span class="stage-tab-status">{{ getStatusLabel(stage.status) }}</span>
            </button>
          </div>

          <div class="bracket-summary">
            <div class="summary-item">
              <span class="summary-label">Campeonato</span>
              <strong class="summary-value">{{ selectedChampionship?.championshipName || 'Campeonato' }}</strong>
            </div>
            <div class="summary-item">
              <span class="summary-label">Fase</span>
              <strong class="summary-value">{{ activeBracketStage?.label || selectedChampionship?.currentPhase?.phaseName || 'Sem fase definida' }}</strong>
            </div>
            <div class="summary-item">
              <span class="summary-label">Partidas</span>
              <strong class="summary-value">{{ bracketRounds.reduce((total, round) => total + round.matches.length, 0) }}</strong>
            </div>
            <div class="summary-item">
              <span class="summary-label">Seções</span>
              <strong class="summary-value">{{ bracketRounds.length }}</strong>
            </div>
          </div>

          <div v-if="bracketLoading" class="bracket-loading">
            <div class="spinner"></div>
            <p>Buscando chaveamento...</p>
          </div>

          <div v-else-if="bracketError" class="bracket-empty">
            <div class="empty-icon">🧩</div>
            <p>{{ bracketError }}</p>
          </div>

          <div v-else class="bracket-scroll">
            <div class="bracket-stage-strip">
              <span class="stage-pill">Visualização do chaveamento</span>
              <span class="stage-pill">{{ selectedChampionship?.region || 'Global' }}</span>
              <span class="stage-pill">{{ activeBracketStage?.label || 'Stage atual' }}</span>
            </div>

            <div v-if="activeBracketMode === 'group'" class="group-stage-list">
              <article v-for="match in flatBracketMatches" :key="match.key" class="stage-match-row">
                <div class="stage-match-main">
                  <div class="stage-match-head">
                    <span class="match-tag">{{ match.roundLabel }}</span>
                    <span class="match-time">{{ match.timeLabel }}</span>
                  </div>
                  <div class="stage-match-teams">
                    <div class="stage-team-line">
                      <span class="team-name-inline">{{ match.teamA }}</span>
                      <strong class="team-score">{{ match.scoreA }}</strong>
                    </div>
                    <div class="stage-team-separator">VS</div>
                    <div class="stage-team-line">
                      <span class="team-name-inline">{{ match.teamB }}</span>
                      <strong class="team-score">{{ match.scoreB }}</strong>
                    </div>
                  </div>
                </div>
                <div class="stage-match-side">
                  <span class="stage-match-status">{{ match.statusLabel }}</span>
                  <span class="stage-match-number">{{ match.numberLabel }}</span>
                </div>
              </article>
            </div>

            <div v-else class="bracket-container">
              <section v-for="section in bracketSections" :key="section.key" class="bracket-section">
                <header class="bracket-section-header">
                  <div>
                    <span class="section-kicker">Chaveamento</span>
                    <h4>{{ section.title }}</h4>
                    <p>{{ section.subtitle }}</p>
                  </div>
                </header>

                <div class="bracket-visual">
                  <div class="bracket-rounds">
                    <div v-for="(round, roundIndex) in section.rounds" :key="round.key" class="bracket-round">
                      <div class="round-header">
                        <span class="round-label">{{ round.label }}</span>
                        <span class="round-meta">{{ round.matches.length }} partida(s)</span>
                      </div>
                      
                      <div class="matches-column">
                        <div 
                          v-for="(match, matchIndex) in round.matches" 
                          :key="match.key"
                          class="bracket-matchup"
                        >
                          <div class="matchup-container">
                            <!-- Team A -->
                            <div class="matchup-team" :class="{ 'is-winner': match.winner === 0 }">
                              <div class="team-slot">
                                <div class="team-badge" :style="{ backgroundColor: getTeamColor(match.teamA) }"></div>
                                <div class="team-info">
                                  <span class="team-name">{{ match.teamA }}</span>
                                  <span class="team-score">{{ match.scoreA || '-' }}</span>
                                </div>
                              </div>
                              <div v-if="match.timeLabel" class="match-schedule">
                                <span class="time-badge">{{ match.timeLabel }}</span>
                              </div>
                            </div>

                            <!-- Divider -->
                            <div class="matchup-divider"></div>

                            <!-- Team B -->
                            <div class="matchup-team" :class="{ 'is-winner': match.winner === 1 }">
                              <div class="team-slot">
                                <div class="team-badge" :style="{ backgroundColor: getTeamColor(match.teamB) }"></div>
                                <div class="team-info">
                                  <span class="team-name">{{ match.teamB }}</span>
                                  <span class="team-score">{{ match.scoreB || '-' }}</span>
                                </div>
                              </div>
                              <div v-if="match.timeLabel" class="match-schedule">
                                <span class="time-badge">{{ match.timeLabel }}</span>
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
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { tournamentsAPI } from '../api.js'
import { getChampionshipPriority } from '../utils/matchDisplay.js'

const tournaments = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedStatus = ref('all')
const expandedId = ref(null)
const bracketOpen = ref(false)
const bracketLoading = ref(false)
const bracketError = ref('')
const selectedChampionship = ref(null)
const bracketStages = ref([])
const selectedBracketStageId = ref('')
const bracketRounds = ref([])

const activeBracketStage = computed(() => {
  return bracketStages.value.find((stage) => stage.id === selectedBracketStageId.value) || null
})

const activeBracketMode = computed(() => {
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

const getRoundSide = (item) => {
  const label = item.round_name || item.round?.name || item.round || item.stage || item.label || item.name || ''
  return getBracketSide(label)
}

const getRoundSortValue = (item) => {
  const candidate = item.round_number ?? item.round ?? item.number
  if (Number.isFinite(Number(candidate))) return Number(candidate)
  const label = String(getRoundLabel(item)).toLowerCase()
  if (label.includes('grand final')) return 999
  if (label.includes('semi')) return 80
  if (label.includes('quarter')) return 60
  if (label.includes('playoff')) return 40
  if (label.includes('group')) return 20
  return 1000
}

const normalizeBracketMatches = (payload) => {
  const items = extractArray(payload)
  const lookup = new Map(items.filter((item) => item?.id != null).map((item) => [item.id, item]))
  const depthCache = new Map()

  const rounds = new Map()

  items.forEach((item, index) => {
    const roundLabel = getRoundLabel(item)
    const roundOrder = getBracketDepth(item, lookup, depthCache)
    const roundKey = `${roundOrder}-${roundLabel}`

    if (!rounds.has(roundKey)) {
      rounds.set(roundKey, {
        key: roundKey,
        label: roundLabel,
        order: roundOrder,
        side: getRoundSide(item),
        matches: []
      })
    }

    const teamA = item.opponents?.[0]?.opponent?.name || item.opponents?.[0]?.name || item.team1?.name || item.home_team?.name || 'TBD'
    const teamB = item.opponents?.[1]?.opponent?.name || item.opponents?.[1]?.name || item.team2?.name || item.away_team?.name || 'TBD'
    const scoreA = item.results?.[0]?.score ?? item.scores?.[0] ?? item.team1_score ?? '-'
    const scoreB = item.results?.[1]?.score ?? item.scores?.[1] ?? item.team2_score ?? '-'
    const matchLabel = getBracketMatchLabel(item)
    const matchupLabel = matchLabel.subtitle || `${teamA} vs ${teamB}`

    const winner = scoreA !== '-' && scoreB !== '-'
      ? Number(scoreA) > Number(scoreB)
        ? 0
        : Number(scoreB) > Number(scoreA)
          ? 1
          : null
      : null

    const timeValue = item.begin_at || item.scheduled_at || item.start_at || item.date || ''

    rounds.get(roundKey).matches.push({
      key: item.id || `${roundKey}-${index}`,
      teamA,
      teamB,
      scoreA,
      scoreB,
      winner,
      stageLabel: roundLabel,
      matchTitle: matchLabel.title,
      matchSubtitle: matchupLabel,
      statusLabel: getStatusLabel(normalizeStatus(item.status || item.state || 'upcoming')),
      timeLabel: timeValue ? new Date(timeValue).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sem horário',
      numberLabel: item.number ? `Jogo ${item.number}` : `Partida ${index + 1}`
    })
  })

  return Array.from(rounds.values())
    .sort((a, b) => a.order - b.order)
    .map((round) => ({
      ...round,
      matches: round.matches.sort((a, b) => String(a.key).localeCompare(String(b.key)))
    }))
}

const closeBracket = () => {
  bracketOpen.value = false
}

const openBracket = async (championship) => {
  selectedChampionship.value = championship
  bracketStages.value = getBracketStageOptions(championship)
  const initialStage = bracketStages.value.find((stage) => stage.id === String(championship.currentPhase?.tournamentId))
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

const groupedChampionships = computed(() => {
  const grouped = new Map()

  tournaments.value.forEach((tournament, index) => {
    const key = getGroupKey(tournament)

    if (!grouped.has(key)) {
      grouped.set(key, {
        uid: key,
        championshipName: getChampionshipName(tournament),
        leagueName: tournament.league?.name || '',
        serieName: tournament.serie?.full_name || tournament.serie?.name || '',
        region: tournament.region || '',
        teamsCount: tournament.teams_count || tournament.number_of_teams || null,
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

    current.phases.push({
      uid: `${tournament.id || index}-${index}`,
      phaseName: tournament.name || tournament.full_name || 'Fase',
      beginAt: tournament.begin_at,
      endAt: tournament.end_at,
      status: phaseStatus,
      region: tournament.region || tournament.league?.region || '',
      tournamentId: tournament.id
    })
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
      const inPhases = champ.phases.some((phase) => phase.phaseName.toLowerCase().includes(query))
      return inChampionship || inPhases
    })
  }

  if (selectedStatus.value !== 'all') {
    result = result.filter((champ) => champ.status === selectedStatus.value)
  }

  return result.sort((a, b) => getChampionshipPriority(b) - getChampionshipPriority(a) || new Date(b.latestDate || 0) - new Date(a.latestDate || 0))
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

onMounted(async () => {
  try {
    loading.value = true
    const response = await tournamentsAPI.getAll({
      per_page: 100,
      sort: '-modified_at'
    })
    tournaments.value = response.data || []
  } catch (error) {
    console.error('Error fetching tournaments:', error)
  } finally {
    loading.value = false
  }
})
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
  gap: 14px;
}

.search-box {
  position: relative;
  max-width: 460px;
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

.filter-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  border-radius: 999px !important;
  padding: 8px 14px !important;
  font-size: 12px !important;
  letter-spacing: 0.04em;
  border: 1px solid rgba(67, 203, 156, 0.32) !important;
  background: rgba(8, 18, 16, 0.92) !important;
  color: rgba(215, 242, 236, 0.9) !important;
}

.filter-btn:hover {
  border-color: rgba(67, 203, 156, 0.62) !important;
  box-shadow: 0 0 14px rgba(67, 203, 156, 0.22);
}

.filter-btn.active {
  color: #072018 !important;
  background: linear-gradient(180deg, #8dffdc 0%, #43cb9c 100%) !important;
  border-color: rgba(67, 203, 156, 0.9) !important;
  box-shadow: 0 0 18px rgba(67, 203, 156, 0.35);
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
  z-index: 120;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.bracket-modal {
  width: min(98vw, 1560px);
  max-height: 92vh;
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
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 18px;
  border-bottom: 1px solid rgba(67, 203, 156, 0.16);
}

.bracket-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(67, 203, 156, 0.12);
  background: linear-gradient(180deg, rgba(8, 22, 18, 0.5), rgba(3, 10, 8, 0.2));
}

.bracket-stage-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 14px 22px 0;
}

.stage-tab {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 180px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(67, 203, 156, 0.18);
  background: rgba(6, 14, 12, 0.72);
  color: #eaf6f2;
  cursor: pointer;
  transition: all 0.22s ease;
}

.stage-tab:hover {
  border-color: rgba(67, 203, 156, 0.38);
  transform: translateY(-1px);
}

.stage-tab.active {
  background: linear-gradient(180deg, rgba(67, 203, 156, 0.2), rgba(6, 14, 12, 0.9));
  border-color: rgba(67, 203, 156, 0.7);
  box-shadow: 0 0 20px rgba(67, 203, 156, 0.18);
}

.stage-tab-label {
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.stage-tab-status {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(201, 240, 230, 0.72);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(6, 14, 12, 0.72);
  border: 1px solid rgba(67, 203, 156, 0.14);
}

.summary-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(197, 233, 225, 0.68);
}

.summary-value {
  font-size: 13px;
  color: #edf7f4;
  line-height: 1.2;
}

.modal-kicker {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(200, 243, 235, 0.7);
  margin-bottom: 4px;
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

.close-btn {
  border: 1px solid rgba(67, 203, 156, 0.3);
  background: rgba(67, 203, 156, 0.1);
  color: #dff8f0;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 34px;
  }

  .header-content {
    align-items: flex-start;
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

  .bracket-stage-tabs {
    padding: 12px 16px 0;
  }

  .stage-tab {
    min-width: 160px;
  }

  .bracket-columns {
    grid-auto-columns: minmax(260px, 1fr);
  }

  .bracket-section {
    padding: 16px;
  }

  .bracket-section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .bracket-section-header h4 {
    font-size: 20px;
  }

  .bracket-rounds {
    gap: 24px;
  }

  .bracket-round {
    min-width: 240px;
  }

  .matchup-team {
    padding: 12px 14px;
  }

  .team-badge {
    width: 48px;
    height: 48px;
  }

  .team-name {
    font-size: 13px;
  }

  .bracket-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bracket-section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
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
