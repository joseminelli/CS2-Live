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
const IS_DEV = import.meta.env.DEV

if (IS_DEV) {
  console.log('🚀 Usando API Base URL:', API_BASE_URL)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
})

const unwrapApiEnvelope = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'data')
    && Object.prototype.hasOwnProperty.call(payload, 'success')) {
    return payload.data
  }

  return payload
}

// Interceptador de requisição para debug
api.interceptors.request.use(
  (config) => {
    if (IS_DEV) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    if (IS_DEV) {
      console.error('❌ Request error:', error)
    }
    return Promise.reject(error)
  }
)

// Interceptador de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => {
    response.data = unwrapApiEnvelope(response.data)

    if (IS_DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    if (IS_DEV) {
      if (error.response) {
        console.error(`❌ API Error: ${error.response.status} - ${error.config?.url}`)
        console.error('Response data:', error.response.data)
      } else if (error.request) {
        console.error('❌ No response received:', error.request)
      } else {
        console.error('❌ Error:', error.message)
      }
    }
    return Promise.reject(error)
  }
)

const responseCache = new Map()
const inFlightGetRequests = new Map()

const CACHE_TTL_MS = {
  default: 30_000,
  '/matches/live': 8_000,
  '/matches/upcoming': 60_000,
  '/matches/recent': 60_000,
  '/dashboard': 20_000,
  '/tournaments': 90_000,
  '/leagues': 300_000,
  '/series': 300_000,
  '/teams': 180_000,
  '/health': 10_000
}

const stableSerialize = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

const buildCacheKey = (url, params) => `${url}::${stableSerialize(params || {})}`

const resolveCacheTtl = (url, ttlOverride) => {
  if (Number.isFinite(ttlOverride) && ttlOverride >= 0) return ttlOverride

  for (const [prefix, ttl] of Object.entries(CACHE_TTL_MS)) {
    if (prefix === 'default') continue
    if (url.startsWith(prefix)) return ttl
  }

  return CACHE_TTL_MS.default
}

const buildCachedResponse = (cached, url, params) => ({
  data: cached.data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    url,
    method: 'get',
    params,
    fromCache: true
  },
  request: null
})

const cachedGet = (url, params = {}, options = {}) => {
  const key = buildCacheKey(url, params)
  const ttlMs = resolveCacheTtl(url, options.ttl)
  const now = Date.now()

  if (!options.forceRefresh && !options.skipCache) {
    const cached = responseCache.get(key)
    if (cached && cached.expiresAt > now) {
      return Promise.resolve(buildCachedResponse(cached, url, params))
    }

    const inflight = inFlightGetRequests.get(key)
    if (inflight) return inflight
  }

  const requestPromise = api.get(url, { params })
    .then((response) => {
      if (!options.skipCache && ttlMs > 0) {
        responseCache.set(key, {
          data: response.data,
          expiresAt: Date.now() + ttlMs
        })
      }
      return response
    })
    .finally(() => {
      inFlightGetRequests.delete(key)
    })

  inFlightGetRequests.set(key, requestPromise)
  return requestPromise
}

export const clearApiCache = () => {
  responseCache.clear()
  inFlightGetRequests.clear()
}

export const matchesAPI = {
  getUpcoming: (params = { all: true }, options = {}) => cachedGet('/matches/upcoming', params, options),
  getRecent: (params = { all: true }, options = {}) => cachedGet('/matches/recent', params, options),
  getLive: (params = { all: true }, options = {}) => cachedGet('/matches/live', params, options),
  getById: (id, options = {}) => cachedGet(`/matches/${id}`, {}, options)
}

export const teamsAPI = {
  getAll: (params = { all: true }, options = {}) => cachedGet('/teams', params, options),
  getById: (id, options = {}) => cachedGet(`/teams/${id}`, {}, options)
}

export const dashboardAPI = {
  getSummary: (options = {}) => cachedGet('/dashboard', {}, options)
}

export const playersAPI = {
  getById: (id, options = {}) => cachedGet(`/players/${id}`, {}, options)
}

export const leaguesAPI = {
  getAll: (options = {}) => cachedGet('/leagues', {}, options)
}

export const seriesAPI = {
  getAll: (options = {}) => cachedGet('/series', {}, options)
}

export const tournamentsAPI = {
  getAll: (params = {}, options = {}) => cachedGet('/tournaments', params, options),
  getById: (id, options = {}) => cachedGet(`/tournaments/${id}`, {}, options),
  getBrackets: (id, params = {}, options = {}) => cachedGet(`/tournaments/${id}/brackets`, params, options),
  getMatches: (id, params = {}, options = {}) => cachedGet(`/tournaments/${id}/matches`, params, options)
}

export const healthAPI = {
  check: (options = {}) => cachedGet('/health', {}, options)
}

export default api
