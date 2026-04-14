const PHASE_WORDS = /(playoffs|stage|group|bracket|qualifier|final|upper|lower|opening|round|semifinal|quarterfinal|grand final|decider)/i
const BIG_EVENT_WORDS = /(major|championship|world|master|premier|international|world cup|open|finals|esl|blast|pgl|iem|pro league|elite|super|global)/i

export const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim()

export const toTitleCase = (value) => {
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

export const getCompetitionName = (match) => {
  const leagueName = normalizeText(match?.league?.name)
  const serieName = normalizeText(match?.serie?.full_name || match?.serie?.name)
  const tournamentName = normalizeText(match?.tournament?.full_name || match?.tournament?.name)

  if (leagueName && serieName && !PHASE_WORDS.test(serieName)) {
    if (!serieName.toLowerCase().includes(leagueName.toLowerCase())) {
      return toTitleCase(`${leagueName} ${serieName}`)
    }
    return toTitleCase(serieName)
  }

  if (leagueName && !PHASE_WORDS.test(leagueName)) return toTitleCase(leagueName)
  if (serieName && !PHASE_WORDS.test(serieName)) return toTitleCase(serieName)
  if (tournamentName && !PHASE_WORDS.test(tournamentName)) return toTitleCase(tournamentName)

  return toTitleCase(tournamentName || serieName || leagueName || 'CS2')
}

export const getPhaseName = (match) => {
  const competitionName = getCompetitionName(match).toLowerCase()
  const candidates = [
    match?.tournament?.name,
    match?.tournament?.full_name,
    match?.serie?.full_name,
    match?.serie?.name
  ]
    .map(normalizeText)
    .filter(Boolean)

  const phaseName = candidates.find((value) => value.toLowerCase() !== competitionName && PHASE_WORDS.test(value))
  if (phaseName) return toTitleCase(phaseName)

  const fallback = candidates.find((value) => value.toLowerCase() !== competitionName)
  return fallback ? toTitleCase(fallback) : ''
}

export const getTeamName = (opponent) => {
  return toTitleCase(opponent?.opponent?.name || opponent?.name || 'TBD')
}

const parseNumeric = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

const getTierScore = (value) => {
  const normalized = normalizeText(value).toLowerCase()
  if (!normalized) return 0
  if (normalized === 's' || normalized.includes('tier 1') || normalized.includes('tier1')) return 1000
  if (normalized === 'a' || normalized.includes('tier 2') || normalized.includes('tier2')) return 800
  if (normalized === 'b' || normalized.includes('tier 3') || normalized.includes('tier3')) return 600
  if (normalized === 'c' || normalized.includes('tier 4') || normalized.includes('tier4')) return 400
  return 200
}

const getImportanceTextScore = (text) => {
  const normalized = normalizeText(text).toLowerCase()
  if (!normalized) return 0
  if (BIG_EVENT_WORDS.test(normalized)) return 700
  if (/(playoff|final|world)/i.test(normalized)) return 500
  return 0
}

export const getCompetitionPriority = (match) => {
  const prizePool = Math.max(
    parseNumeric(match?.prize_pool),
    parseNumeric(match?.tournament?.prize_pool),
    parseNumeric(match?.league?.prize_pool),
    parseNumeric(match?.serie?.prize_pool)
  )

  const teamsCount = Math.max(
    parseNumeric(match?.teams_count),
    parseNumeric(match?.number_of_teams),
    parseNumeric(match?.tournament?.teams_count),
    parseNumeric(match?.tournament?.number_of_teams)
  )

  const tierScore = Math.max(
    getTierScore(match?.tier),
    getTierScore(match?.league?.tier),
    getTierScore(match?.serie?.tier),
    getTierScore(match?.tournament?.tier)
  )

  const textScore = Math.max(
    getImportanceTextScore(match?.league?.name),
    getImportanceTextScore(match?.serie?.full_name || match?.serie?.name),
    getImportanceTextScore(match?.tournament?.full_name || match?.tournament?.name)
  )

  return (tierScore * 1000000) + (teamsCount * 10000) + (prizePool * 10) + textScore
}

export const getChampionshipPriority = (championship) => {
  const prizePool = Math.max(
    parseNumeric(championship?.prizePool),
    parseNumeric(championship?.prize_pool)
  )

  const teamsCount = Math.max(parseNumeric(championship?.teamsCount), parseNumeric(championship?.teams_count))

  const phaseCount = Array.isArray(championship?.phases) ? championship.phases.length : 0

  const tierScore = Math.max(
    getTierScore(championship?.tier),
    getTierScore(championship?.leagueTier)
  )

  const textScore = Math.max(
    getImportanceTextScore(championship?.championshipName),
    getImportanceTextScore(championship?.leagueName),
    getImportanceTextScore(championship?.serieName)
  )

  return (tierScore * 1000000) + (teamsCount * 10000) + (phaseCount * 1000) + (prizePool * 10) + textScore
}
