const FAVORITE_TEAMS_KEY = 'cs2live.favoriteTeams'
const FAVORITE_CHAMPIONSHIPS_KEY = 'cs2live.favoriteChampionships'
const PERSONALIZED_HOME_KEY = 'cs2live.personalizedHome'

const readJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (_) {
    return fallback
  }
}

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

const emitChange = () => {
  window.dispatchEvent(new CustomEvent('cs2-preferences-updated'))
}

const normalizeKeyPart = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const collectChampionshipKeys = (input) => {
  if (!input) return []

  const uid = input.uid != null ? String(input.uid) : ''

  const leagueId = input.league?.id ?? input.league_id ?? input.leagueId
  const serieId = input.serie?.id ?? input.serie_id ?? input.serieId
  const tournamentId = input.tournament?.id ?? input.tournament_id ?? input.tournamentId

  const leagueName = input.league?.name ?? input.leagueName
  const serieName = input.serie?.full_name ?? input.serie?.name ?? input.serieName
  const tournamentName = input.tournament?.name ?? input.tournamentName

  const leagueRef = leagueId != null ? String(leagueId) : normalizeKeyPart(leagueName)
  const serieRef = serieId != null ? String(serieId) : normalizeKeyPart(serieName)
  const tournamentRef = tournamentId != null ? String(tournamentId) : normalizeKeyPart(tournamentName)

  const keys = []

  if (leagueRef && serieRef) keys.push(`ls:${leagueRef}-${serieRef}`)
  if (tournamentRef) keys.push(`t:${tournamentRef}`)
  if (uid) keys.push(`uid:${uid}`)
  if (leagueRef) keys.push(`l:${leagueRef}`)
  if (serieRef) keys.push(`s:${serieRef}`)

  return Array.from(new Set(keys.filter(Boolean)))
}

export const getFavoriteTeamIds = () => {
  const list = readJson(FAVORITE_TEAMS_KEY, [])
  return Array.isArray(list) ? list.map((item) => String(item)) : []
}

export const getFavoriteChampionshipIds = () => {
  const list = readJson(FAVORITE_CHAMPIONSHIPS_KEY, [])
  return Array.isArray(list) ? list.map((item) => String(item)) : []
}

export const isPersonalizedHomeEnabled = () => {
  return readJson(PERSONALIZED_HOME_KEY, false) === true
}

export const setPersonalizedHomeEnabled = (enabled) => {
  writeJson(PERSONALIZED_HOME_KEY, Boolean(enabled))
  emitChange()
}

export const toggleFavoriteTeam = (team) => {
  const teamId = team?.id != null ? String(team.id) : ''
  if (!teamId) return false

  const favorites = new Set(getFavoriteTeamIds())
  if (favorites.has(teamId)) {
    favorites.delete(teamId)
  } else {
    favorites.add(teamId)
  }

  writeJson(FAVORITE_TEAMS_KEY, Array.from(favorites))
  emitChange()
  return favorites.has(teamId)
}

export const isFavoriteTeam = (team) => {
  const teamId = team?.id != null ? String(team.id) : ''
  if (!teamId) return false
  return getFavoriteTeamIds().includes(teamId)
}

export const buildChampionshipId = (input) => {
  const keys = collectChampionshipKeys(input)
  return keys[0] || ''
}

export const toggleFavoriteChampionship = (championship) => {
  const keys = collectChampionshipKeys(championship)
  if (keys.length === 0) return false

  const favorites = new Set(getFavoriteChampionshipIds())
  const alreadyFavorite = keys.some((key) => favorites.has(key))

  if (alreadyFavorite) {
    keys.forEach((key) => favorites.delete(key))
  } else {
    keys.forEach((key) => favorites.add(key))
  }

  writeJson(FAVORITE_CHAMPIONSHIPS_KEY, Array.from(favorites))
  emitChange()
  return !alreadyFavorite
}

export const isFavoriteChampionship = (championship) => {
  const keys = collectChampionshipKeys(championship)
  if (keys.length === 0) return false

  const favorites = new Set(getFavoriteChampionshipIds())
  return keys.some((key) => favorites.has(key))
}

export const clearAllFavorites = () => {
  writeJson(FAVORITE_TEAMS_KEY, [])
  writeJson(FAVORITE_CHAMPIONSHIPS_KEY, [])
  emitChange()
}
