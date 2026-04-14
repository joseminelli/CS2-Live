import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const matchesAPI = {
  getUpcoming: () => api.get('/matches/upcoming'),
  getRecent: () => api.get('/matches/recent'),
  getLive: () => api.get('/matches/live'),
  getById: (id) => api.get(`/matches/${id}`)
}

export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`)
}

export const playersAPI = {
  getById: (id) => api.get(`/players/${id}`)
}

export const leaguesAPI = {
  getAll: () => api.get('/leagues')
}

export const seriesAPI = {
  getAll: () => api.get('/series')
}

export const tournamentsAPI = {
  getAll: (params = {}) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  getBrackets: (id, params = {}) => api.get(`/tournaments/${id}/brackets`, { params }),
  getMatches: (id, params = {}) => api.get(`/tournaments/${id}/matches`, { params })
}

export const healthAPI = {
  check: () => api.get('/health')
}

export default api
