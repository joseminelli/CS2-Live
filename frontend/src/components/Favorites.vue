<template>
    <div class="favorites-view">
        <div class="page-header">
            <div class="header-copy">
                <p class="eyebrow">Gerenciamento</p>
                <h1 class="page-title">Favoritos</h1>
                <p class="page-subtitle">Organize times e campeonatos salvos em um único lugar.</p>
            </div>

            <div class="header-actions">
                <button class="header-action primary" @click="togglePersonalizedHome">
                    {{ personalizedHome ? 'Desativar home personalizada' : 'Ativar home personalizada' }}
                </button>
                <button class="header-action danger" @click="clearFavorites">Limpar tudo</button>
            </div>
        </div>

        <section class="summary-strip">
            <article class="summary-card">
                <span class="summary-label">Times</span>
                <strong class="summary-value">{{ favoriteTeams.length }}</strong>
            </article>
            <article class="summary-card">
                <span class="summary-label">Campeonatos</span>
                <strong class="summary-value">{{ favoriteChampionships.length }}</strong>
            </article>
            <article class="summary-card">
                <span class="summary-label">Home personalizada</span>
                <strong class="summary-value">{{ personalizedHome ? 'Ativa' : 'Desativada' }}</strong>
            </article>
        </section>

        <section class="controls-panel">
            <div class="search-box">
                <input v-model="searchQuery" type="text" class="search-input"
                    placeholder="Buscar favorito por nome, região ou fase...">
                <span class="search-icon">⌕</span>
            </div>
        </section>

        <section class="favorites-section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">Times favoritos</h2>
                    <p class="section-subtitle">Remova qualquer time com um toque ou abra os detalhes.</p>
                </div>
                <button class="section-action" @click="clearTeams" :disabled="favoriteTeams.length === 0">Limpar
                    times</button>
            </div>

            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Carregando favoritos...</p>
            </div>

            <div v-else-if="filteredTeams.length === 0" class="empty-state">
                <div class="empty-icon">👥</div>
                <p>{{ favoriteTeams.length === 0 ? 'Nenhum time favoritado' : 'Nenhum time corresponde à busca' }}</p>
                <p class="empty-hint">Adicione favoritos na tela de times ou use a estrela nos cards.</p>
            </div>

            <div v-else class="favorites-grid teams-grid">
                <article v-for="team in filteredTeams" :key="team.id" class="favorite-card">
                    <div class="favorite-card-top">
                        <button :class="['favorite-toggle', team.missing ? 'missing' : '']" type="button"
                            @click="removeTeam(team)">★</button>
                        <div class="favorite-identity">
                            <button class="team-logo-btn" type="button" @click="openTeamModal(team)">
                                <img v-if="team.image_url" :src="team.image_url" :alt="team.name" class="favorite-logo">
                                <div v-else class="team-logo-fallback">?</div>
                            </button>
                            <div>
                                <h3 class="favorite-name">{{ team.name }}</h3>
                                <p class="favorite-meta">{{ team.location || (team.missing ? 'Favorito ausente' :
                                    'Região não informada') }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="favorite-card-body">
                        <p class="favorite-description">
                            {{ team.players?.length ? `${team.players.length} jogadores listados` : 'Sem elenco listado'
                            }}
                        </p>
                        <div v-if="team.players?.length" class="favorite-tags">
                            <span v-for="player in team.players" :key="player.id" class="favorite-tag">
                                {{ player.name }}
                            </span>
                        </div>
                    </div>

                    <div class="favorite-card-actions">
                        <button class="card-action" @click="goToRoute('upcoming', team.name)">Ver jogos</button>
                    </div>
                </article>
            </div>
        </section>

        <section class="favorites-section">
            <div class="section-header">
                <div>
                    <h2 class="section-title">Campeonatos favoritos</h2>
                    <p class="section-subtitle">Gerencie torneios, fases e chaveamentos salvos.</p>
                </div>
                <button class="section-action" @click="clearChampionships"
                    :disabled="favoriteChampionships.length === 0">Limpar campeonatos</button>
            </div>

            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Carregando favoritos...</p>
            </div>

            <div v-else-if="filteredChampionships.length === 0" class="empty-state">
                <div class="empty-icon">🏆</div>
                <p>{{ favoriteChampionships.length === 0 ? 'Nenhum campeonato favoritado' : `Nenhum campeonato
                    corresponde à busca` }}</p>
                <p class="empty-hint">Salve campeonatos na página de torneios para acompanhar depois.</p>
            </div>

            <div v-else class="favorites-grid championships-grid">
                <article v-for="champ in filteredChampionships" :key="champ.key"
                    class="favorite-card championship-card">
                    <div class="favorite-card-top">
                        <button class="favorite-toggle" type="button" @click="removeChampionship(champ)">★</button>
                        <div class="favorite-identity">
                            <div class="favorite-badge">{{ champ.statusLabel }}</div>
                            <div>
                                <h3 class="favorite-name">{{ champ.championshipName }} {{ champ.serieName }}</h3>
                                <p class="favorite-meta">{{ champ.phaseLabel }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="favorite-card-body">
                        <p class="favorite-description">{{ champ.region }} • {{ champ.teamsText }}</p>
                        <div class="favorite-tags">
                            <span class="favorite-tag">{{ champ.leagueLabel }}</span>
                            <span class="favorite-tag">{{ champ.serieLabel }}</span>
                        </div>
                    </div>

                    <div class="favorite-card-actions">
                        <button class="card-action" @click="goToChampionship(champ)">Abrir torneio</button>
                    </div>
                </article>
            </div>
        </section>

        <TeamInfoModal v-model="teamModalOpen" :team="selectedTeam" />
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
    import { useRouter } from 'vue-router'
import { teamsAPI, tournamentsAPI } from '../api.js'
import { getCompetitionPriority } from '../utils/matchDisplay.js'
    import TeamInfoModal from './TeamInfoModal.vue'
import {
    buildChampionshipId,
    clearFavoriteChampionships,
    clearFavoriteTeams,
    clearAllFavorites,
    getFavoriteChampionshipIds,
    getFavoriteTeamIds,
    isPersonalizedHomeEnabled,
    setPersonalizedHomeEnabled,
    toggleFavoriteChampionship,
    toggleFavoriteTeam
} from '../services/preferences.js'

const router = useRouter()

const loading = ref(true)
const searchQuery = ref('')
const favoriteTeams = ref([])
const favoriteChampionships = ref([])
const teamModalOpen = ref(false)
const selectedTeam = ref({})
const personalizedHome = ref(isPersonalizedHomeEnabled())

const normalize = (value) => String(value || '').trim().toLowerCase()

const getText = (championship, fallback = 'Campeonato') => {
    return championship?.name
        || championship?.championshipName
        || championship?.full_name
        || championship?.tournament?.name
        || championship?.tournament?.full_name
        || fallback
}

const getRegion = (championship) => {
    return championship?.region
        || championship?.currentPhase?.region
        || championship?.league?.region
        || 'Global'
}

const getPhaseLabel = (championship) => {
    return championship?.currentPhase?.phaseName
        || championship?.serie?.full_name
        || championship?.serie?.name
        || championship?.phaseName
        || 'Sem fase informada'
}

const getStatusLabel = (championship) => {
    const raw = normalize(championship?.status)
    if (raw.includes('running')) return 'Ao vivo'
    if (raw.includes('finished')) return 'Finalizado'
    return 'Próximo'
}

const getTeamsText = (championship) => {
    const total = Number(championship?.teamsCount || championship?.teams_count)
    if (!Number.isFinite(total) || total <= 0) return 'Times a confirmar'
    return `${total} times`
}

const getGroupKey = (tournament) => {
    const leaguePart = tournament?.league?.id || tournament?.league?.name || 'league'
    const seriePart = tournament?.serie?.id || tournament?.serie?.name || 'serie'
    return `${leaguePart}-${seriePart}`
}


const openTeamModal = (team) => {
    if (!team?.name) return
    selectedTeam.value = team
    teamModalOpen.value = true
}

const getChampionshipName = (tournament) => {
    return tournament?.championshipName
        || tournament?.tournament?.name
        || tournament?.tournament?.full_name
        || tournament?.league?.name
        || tournament?.serie?.full_name
        || tournament?.serie?.name
        || tournament?.name
        || tournament?.full_name
        || 'Campeonato'
}

const getPhaseName = (tournament) => {
    return tournament?.name
        || tournament?.full_name
        || tournament?.currentPhase?.phaseName
        || tournament?.serie?.full_name
        || tournament?.serie?.name
        || 'Fase não informada'
}

const getStatus = (tournament) => {
    const raw = normalize(tournament?.status)
    if (raw.includes('running')) return 'running'
    if (raw.includes('finished')) return 'finished'
    return 'upcoming'
}

const getGroupStatusLabel = (group) => {
    if (group.status === 'running') return 'Ao vivo'
    if (group.status === 'finished') return 'Finalizado'
    return 'Próximo'
}

const getGroupTeamsText = (group) => {
    const total = Number(group.teamsCount || group.teams_count)
    if (!Number.isFinite(total) || total <= 0) return 'Times a confirmar'
    return `${total} times`
}

const getPhaseSummary = (group) => {
    const phaseNames = Array.from(new Set(group.phases.map((phase) => phase.phaseName).filter(Boolean)))
    if (phaseNames.length === 0) return 'Sem fases informadas'
    if (phaseNames.length === 1) return phaseNames[0]
    if (phaseNames.length === 2) return `${phaseNames[0]} e ${phaseNames[1]}`
    return `${phaseNames[0]} + ${phaseNames.length - 1} fases`
}

const fetchAllPages = async (fetcher, params, pageLimit = 6) => {
    const collected = []

    for (let page = 1; page <= pageLimit; page += 1) {
        const response = await fetcher({ ...params, page })
        const items = Array.isArray(response.data) ? response.data : []
        if (items.length === 0) break

        collected.push(...items)
        if (items.length < (params.per_page || 25)) break
    }

    return collected
}

const loadFavoriteTeams = async (teamIds) => {
    const normalizeText = (value = '') => String(value || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim()

    let teamPages = []

    try {
        const response = await teamsAPI.getAll({ all: true, sort: 'name' })
        teamPages = Array.isArray(response.data) ? response.data : []
    } catch (_) {
        teamPages = await fetchAllPages(teamsAPI.getAll, { all: false, per_page: 100, sort: 'name' }, 12)
    }

    const pageLookup = new Map()

    teamPages.forEach((team) => {
        const id = String(team?.id || team?.team_id || '')
        const slug = String(team?.slug || '')
        const name = normalizeText(team?.name || '')

        if (id) pageLookup.set(id, team)
        if (slug) pageLookup.set(slug, team)
        if (name) pageLookup.set(name, team)
    })

    const foundTeams = []
    const missing = []

    for (const teamId of teamIds) {
        const key = String(teamId || '').trim()
        if (!key) continue

        let team = pageLookup.get(key)

        if (!team) {
            const normalizedKey = normalizeText(key)
            team = teamPages.find((item) => {
                const itemId = String(item?.id || item?.team_id || '')
                const itemSlug = String(item?.slug || '')
                const itemName = normalizeText(item?.name || '')
                return itemId === key || itemSlug === key || itemName === normalizedKey || itemName.includes(normalizedKey)
            })
        }

        if (team) {
            foundTeams.push(team)
        } else {
            missing.push(key)
        }
    }

    return {
        teams: foundTeams.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        missing
    }
}

const loadFavoriteChampionships = async (championshipIds) => {
    let championshipRes = []

    try {
        const response = await tournamentsAPI.getAll({ all: true, sort: '-begin_at' })
        championshipRes = Array.isArray(response.data) ? response.data : []
    } catch (_) {
        championshipRes = await fetchAllPages(tournamentsAPI.getAll, { all: false, per_page: 50, sort: '-begin_at' }, 4)
    }

    const favoritesSet = new Set(championshipIds)
    const grouped = new Map()

    championshipRes.forEach((tournament, index) => {
        const phaseKey = buildChampionshipId(tournament) || String(tournament?.id || tournament?.uid || '')
        if (!phaseKey || !favoritesSet.has(phaseKey)) return

        const groupKey = getGroupKey(tournament)

        if (!grouped.has(groupKey)) {
            grouped.set(groupKey, {
                key: groupKey,
                championshipName: getChampionshipName(tournament),
                leagueName: tournament?.league?.name || '',
                serieName: tournament?.serie?.full_name || tournament?.serie?.name || '',
                region: tournament?.region || tournament?.league?.region || 'Global',
                teamsCount: tournament?.teams_count || tournament?.number_of_teams || null,
                teams_count: tournament?.teams_count || tournament?.number_of_teams || null,
                prizePool: tournament?.prize_pool || null,
                prize_pool: tournament?.prize_pool || null,
                tier: tournament?.tier || tournament?.league?.tier || '',
                leagueTier: tournament?.league?.tier || tournament?.serie?.tier || '',
                status: getStatus(tournament),
                latestDate: tournament?.begin_at || tournament?.created_at || null,
                phases: []
            })
        }

        const current = grouped.get(groupKey)
        const incomingDate = new Date(tournament?.begin_at || tournament?.created_at || 0).getTime()
        const latestDate = new Date(current.latestDate || 0).getTime()

        if (incomingDate > latestDate) {
            current.latestDate = tournament?.begin_at || tournament?.created_at || current.latestDate
        }

        current.teamsCount = Math.max(Number(current.teamsCount || 0), Number(tournament?.teams_count || tournament?.number_of_teams || 0)) || current.teamsCount
        current.teams_count = current.teamsCount
        current.prizePool = Math.max(Number(current.prizePool || 0), Number(tournament?.prize_pool || 0)) || current.prizePool
        current.prize_pool = current.prizePool

        if (!current.tier && (tournament?.tier || tournament?.league?.tier)) {
            current.tier = tournament?.tier || tournament?.league?.tier
        }

        if (!current.leagueTier && (tournament?.league?.tier || tournament?.serie?.tier)) {
            current.leagueTier = tournament?.league?.tier || tournament?.serie?.tier
        }

        current.phases.push({
            uid: `${tournament?.id || index}-${index}`,
            phaseName: getPhaseName(tournament),
            beginAt: tournament?.begin_at,
            endAt: tournament?.end_at,
            status: getStatus(tournament),
            region: tournament?.region || tournament?.league?.region || '',
            tournamentId: tournament?.id
        })
    })

    return Array.from(grouped.values())
        .map((group) => {
            group.phases.sort((a, b) => new Date(a.beginAt || 0) - new Date(b.beginAt || 0))
            group.currentPhase = group.phases.find((phase) => phase.status === 'running')
                || group.phases.find((phase) => phase.status === 'upcoming')
                || group.phases.find((phase) => phase.status === 'finished')
                || group.phases[0]
            group.status = group.phases.some((phase) => phase.status === 'running')
                ? 'running'
                : group.phases.some((phase) => phase.status === 'upcoming')
                    ? 'upcoming'
                    : 'finished'

            return {
                ...group,
                uid: group.key,
                tournamentId: group.currentPhase?.tournamentId || group.phases[0]?.tournamentId || null,
                phaseLabel: getPhaseSummary(group),
                statusLabel: getGroupStatusLabel(group),
                teamsText: getGroupTeamsText(group),
                leagueLabel: group.leagueName || 'Liga não informada',
                serieLabel: group.currentPhase?.phaseName || group.serieName || 'Fase não informada',
                raw: group
            }
        })
        .sort((a, b) => getCompetitionPriority(b) - getCompetitionPriority(a) || a.championshipName.localeCompare(b.championshipName))
}

const loadFavorites = async () => {
    loading.value = true

    try {
        const teamIds = new Set(getFavoriteTeamIds())
        const championshipIds = new Set(getFavoriteChampionshipIds())
        const [teamResult, championshipResult] = await Promise.all([
            loadFavoriteTeams(Array.from(teamIds)),
            loadFavoriteChampionships(Array.from(championshipIds))
        ])

        favoriteTeams.value = [...teamResult.teams]

        teamResult.missing.forEach((mid) => {
            favoriteTeams.value.push({ id: mid, name: `Time não encontrado (ID ${mid})`, missing: true })
        })

        favoriteChampionships.value = championshipResult
    } catch (error) {
        favoriteTeams.value = []
        favoriteChampionships.value = []
        console.error('Error loading favorites:', error)
    } finally {
        loading.value = false
    }
}

const isVisible = (value) => {
    const query = normalize(searchQuery.value)
    if (!query) return true
    return normalize(value).includes(query)
}

const filteredTeams = computed(() => {
    return favoriteTeams.value.filter((team) => (
        isVisible(team.name)
        || isVisible(team.region)
        || team.players?.some((player) => isVisible(player.name))
    ))
})

const filteredChampionships = computed(() => {
    return favoriteChampionships.value.filter((champ) => (
        isVisible(champ.championshipName)
        || isVisible(champ.phaseLabel)
        || isVisible(champ.region)
        || isVisible(champ.leagueLabel)
        || isVisible(champ.serieLabel)
    ))
})

const refreshState = async () => {
    personalizedHome.value = isPersonalizedHomeEnabled()
    await loadFavorites()
}

const togglePersonalizedHome = async () => {
    setPersonalizedHomeEnabled(!personalizedHome.value)
    await refreshState()
}

const clearFavorites = async () => {
    clearAllFavorites()
    await refreshState()
}

const clearTeams = async () => {
    clearFavoriteTeams()
    await refreshState()
}

const clearChampionships = async () => {
    clearFavoriteChampionships()
    await refreshState()
}

const removeTeam = async (team) => {
    toggleFavoriteTeam(team)
    await refreshState()
}

const removeChampionship = async (championship) => {
    toggleFavoriteChampionship(championship.raw)
    await refreshState()
}

const goToRoute = async (routeName, query) => {
    await router.push({ name: routeName, query: query ? { q: query } : {} })
}

const goToChampionship = async (championship) => {
    await router.push({ name: 'tournaments', query: { q: `${championship.championshipName} ${championship.serieName}` } })
}

onMounted(async () => {
    window.addEventListener('cs2-preferences-updated', refreshState)
    await refreshState()
})

onUnmounted(() => {
    window.removeEventListener('cs2-preferences-updated', refreshState)
})
</script>

<style scoped>
.favorites-view {
    display: flex;
    flex-direction: column;
    gap: 26px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 18px;
}

.eyebrow {
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 800;
    color: rgba(64, 224, 208, 0.82);
}

.page-title {
    font-size: 54px;
    margin: 0 0 10px;
}

.page-subtitle {
    margin: 0;
    color: rgba(228, 228, 231, 0.62);
    font-size: 18px;
}

.header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.header-action,
.section-action,
.card-action {
    border: 1px solid rgba(64, 224, 208, 0.26);
    background: rgba(64, 224, 208, 0.08);
    color: #e9f7f4;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.header-action:hover,
.section-action:hover,
.card-action:hover {
    transform: translateY(-1px);
    border-color: rgba(64, 224, 208, 0.52);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.14);
}

.header-action.primary {
    background: rgba(64, 224, 208, 0.16);
}

.header-action.danger {
    border-color: rgba(255, 107, 107, 0.3);
    background: rgba(255, 107, 107, 0.08);
}

.summary-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}

.summary-card {
    border: 1px solid rgba(64, 224, 208, 0.18);
    border-radius: 14px;
    padding: 16px 18px;
    background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.summary-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(64, 224, 208, 0.82);
}

.summary-value {
    font-size: 24px;
    font-weight: 900;
    color: #ecf3f2;
}

.controls-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.search-box {
    position: relative;
    max-width: 520px;
}

.search-input {
    width: 100%;
    padding: 14px 16px 14px 44px;
    background: rgba(64, 224, 208, 0.05);
    border: 1px solid rgba(64, 224, 208, 0.2);
    border-radius: 10px;
    color: #e4e4e7;
    font-size: 16px;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: rgba(64, 224, 208, 0.72);
}

.favorites-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.section-title {
    font-size: 28px;
    margin: 0 0 6px;
}

.section-subtitle {
    margin: 0;
    color: rgba(228, 228, 231, 0.6);
    font-size: 14px;
}

.favorites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
}

.favorite-card {
    border: 1px solid rgba(64, 224, 208, 0.18);
    border-radius: 16px;
    padding: 18px;
    background: linear-gradient(135deg, rgba(64, 224, 208, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%);
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.favorite-card:hover {
    transform: translateY(-2px);
    border-color: rgba(64, 224, 208, 0.38);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
}

.favorite-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.favorite-toggle {
    border: 0;
    background: linear-gradient(180deg, rgba(255, 215, 110, 0.14), rgba(255, 215, 110, 0.06));
    color: #ffd86b;
    border-radius: 10px;
    width: 44px;
    height: 36px;
    flex-shrink: 0;
    cursor: pointer;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.14);
}

.favorite-toggle.missing {
    background: linear-gradient(180deg, rgba(200, 60, 60, 0.08), rgba(200, 60, 60, 0.04));
    color: #ffb3b3;
}

.favorite-identity {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.team-logo-btn {
    width: 56px;
    height: 56px;
    border: 1px solid rgba(64, 224, 208, 0.24);
    border-radius: 12px;
    background: rgba(64, 224, 208, 0.08);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.team-logo-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(64, 224, 208, 0.48);
    background: rgba(64, 224, 208, 0.14);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.14);
}

.team-logo-btn:focus-visible {
    outline: none;
    border-color: rgba(64, 224, 208, 0.62);
    box-shadow: 0 0 0 2px rgba(64, 224, 208, 0.24);
}

.favorite-logo,
.favorite-logo-fallback {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    object-fit: contain;
    background: transparent;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 900;
}

.favorite-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(64, 224, 208, 0.12);
    border: 1px solid rgba(64, 224, 208, 0.26);
    color: #c9fbf4;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
}

.favorite-name {
    margin: 0 0 4px;
    font-size: 18px;
}

.favorite-meta {
    margin: 0;
    color: rgba(228, 228, 231, 0.64);
    font-size: 13px;
}

.favorite-card-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.favorite-description {
    margin: 0;
    color: rgba(228, 228, 231, 0.78);
    font-size: 14px;
}

.favorite-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.favorite-tag {
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(64, 224, 208, 0.08);
    border: 1px solid rgba(64, 224, 208, 0.16);
    color: #d5fbf6;
    font-size: 11px;
    font-weight: 700;
}

.favorite-card-actions {
    display: flex;
    gap: 10px;
}

.card-action {
    width: 100%;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    text-align: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(64, 224, 208, 0.2);
    border-top-color: #40e0d0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.empty-icon {
    font-size: 72px;
    opacity: 0.3;
}

.empty-hint {
    color: rgba(228, 228, 231, 0.46);
    font-size: 14px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-title {
        font-size: 36px;
    }

    .summary-strip {
        grid-template-columns: 1fr;
    }

    .favorites-grid {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>