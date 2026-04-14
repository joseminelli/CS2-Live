const PHASE_WORDS = /(playoffs|stage|group|bracket|qualifier|final|upper|lower|opening|round|semifinal|quarterfinal|grand final|decider)/i

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
