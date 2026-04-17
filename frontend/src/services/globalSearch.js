import { matchesAPI, teamsAPI, tournamentsAPI } from '../api.js'

const safeArray = (value) => (Array.isArray(value) ? value : [])

const buildTeamResult = (team) => ({
  id: `team-${team.id}`,
  type: 'team',
  title: team.name || 'Time',
  subtitle: `Time${team.region ? ` • ${team.region}` : ''}`,
  payload: team
})

const buildTournamentResult = (tournament) => ({
  id: `tournament-${tournament.id}`,
  type: 'championship',
  title: tournament.name || tournament.full_name || 'Campeonato',
  subtitle: tournament.league?.name || tournament.serie?.name || 'Torneio',
  payload: tournament
})

const buildMatchResult = (match, type) => {
  const teamA = match.opponents?.[0]?.opponent?.name || 'TBD'
  const teamB = match.opponents?.[1]?.opponent?.name || 'TBD'
  const competition = match.league?.name || match.tournament?.name || 'CS2'
  return {
    id: `${type}-${match.id}`,
    type,
    title: `${teamA} vs ${teamB}`,
    subtitle: `${competition}${match.scheduled_at ? ` • ${new Date(match.scheduled_at).toLocaleString('pt-BR')}` : ''}`,
    payload: match
  }
}

const normalize = (value) => String(value || '').trim().toLowerCase()

const includesQuery = (text, query) => normalize(text).includes(query)

const matchContainsQuery = (match, query) => {
  return includesQuery(match?.opponents?.[0]?.opponent?.name, query)
    || includesQuery(match?.opponents?.[1]?.opponent?.name, query)
    || includesQuery(match?.league?.name, query)
    || includesQuery(match?.tournament?.name, query)
    || includesQuery(match?.tournament?.full_name, query)
    || includesQuery(match?.serie?.name, query)
    || includesQuery(match?.serie?.full_name, query)
}

const fetchPagedMatches = async (fetcher, params, pageLimit = 3) => {
  const collected = []

  for (let page = 1; page <= pageLimit; page += 1) {
    const response = await fetcher({ ...params, page })
    const items = safeArray(response.data)

    if (items.length === 0) break

    collected.push(...items)

    if (items.length < (params.per_page || 25)) break
  }

  return collected
}

const rankResult = (result, query) => {
  const title = normalize(result.title)
  if (title === query) return 100
  if (title.startsWith(query)) return 80
  if (title.includes(query)) return 60
  return 30
}

export const searchGlobal = async (rawQuery) => {
  const query = normalize(rawQuery)
  if (!query) return []

  const [teamsRes, tournamentsRes, liveMatches, upcomingMatches, recentMatches] = await Promise.all([
    teamsAPI.getAll({ all: false, per_page: 40, page: 1, sort: 'name' }),
    tournamentsAPI.getAll({ all: false, per_page: 40, page: 1, sort: '-begin_at' }),
    fetchPagedMatches(matchesAPI.getLive, { all: false, per_page: 20 }, 2),
    fetchPagedMatches(matchesAPI.getUpcoming, { all: false, per_page: 25, sort: 'scheduled_at' }, 4),
    fetchPagedMatches(matchesAPI.getRecent, { all: false, per_page: 25, sort: '-scheduled_at' }, 3)
  ])

  const teams = safeArray(teamsRes.data)
    .filter((team) => includesQuery(team.name, query))
    .map(buildTeamResult)

  const tournaments = safeArray(tournamentsRes.data)
    .filter((tournament) => includesQuery(tournament.name, query)
      || includesQuery(tournament.full_name, query)
      || includesQuery(tournament.league?.name, query)
      || includesQuery(tournament.serie?.name, query))
    .map(buildTournamentResult)

  const liveResults = safeArray(liveMatches)
    .filter((match) => matchContainsQuery(match, query))
    .map((match) => buildMatchResult(match, 'live'))

  const upcomingResults = safeArray(upcomingMatches)
    .filter((match) => matchContainsQuery(match, query))
    .map((match) => buildMatchResult(match, 'upcoming'))

  const recentResults = safeArray(recentMatches)
    .filter((match) => matchContainsQuery(match, query))
    .map((match) => buildMatchResult(match, 'recent'))

  return [...teams, ...tournaments, ...liveResults, ...upcomingResults, ...recentResults]
    .map((item) => ({ ...item, score: rankResult(item, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}
