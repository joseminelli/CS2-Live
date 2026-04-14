import axios from 'axios'

// Detecta o ambiente e usa a URL apropriada
const getApiBaseUrl = () => {
  // Em produção (vercel/deploy)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL_PROD || 'https://cs-2-live.vercel.app/api'
  }
  // Em desenvolvimento (localhost)
  return import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('🚀 Usando API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

// Interceptador de requisição para debug
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Request error:', error)
    return Promise.reject(error)
  }
)

// Interceptador de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.config.url}`)
      console.error('Response data:', error.response.data)
    } else if (error.request) {
      console.error('❌ No response received:', error.request)
    } else {
      console.error('❌ Error:', error.message)
    }
    return Promise.reject(error)
  }
)

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
