import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const PANDASCORE_PAGE_SIZE = 100;
const PANDASCORE_MAX_PAGES = parsePositiveInt(process.env.PANDASCORE_MAX_PAGES, 200);
const CACHE_TTL_FAST_MS = parsePositiveInt(process.env.CACHE_TTL_FAST_MS, 15000);
const CACHE_TTL_DEFAULT_MS = parsePositiveInt(process.env.CACHE_TTL_DEFAULT_MS, 120000);
const CACHE_TTL_SLOW_MS = parsePositiveInt(process.env.CACHE_TTL_SLOW_MS, 600000);

const responseCache = new Map();
const inFlightRequests = new Map();

const parseBoolean = (value, fallback = false) => {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const sortObjectKeys = (value) => {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
};

const buildCacheKey = (prefix, endpoint, params = {}) => {
  return `${prefix}:${endpoint}:${JSON.stringify(sortObjectKeys(params))}`;
};

const getOrSetCache = async (key, ttlMs, resolver) => {
  const now = Date.now();
  const cached = responseCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const task = Promise.resolve()
    .then(resolver)
    .then((data) => {
      responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, task);
  return task;
};

const cachedPandaGet = async (endpoint, params = {}, ttlMs = CACHE_TTL_DEFAULT_MS) => {
  const key = buildCacheKey('single', endpoint, params);
  return getOrSetCache(key, ttlMs, async () => {
    const response = await pandascore.get(endpoint, { params });
    return response.data;
  });
};

const cachedPandaResponse = async (endpoint, params = {}, ttlMs = CACHE_TTL_DEFAULT_MS) => {
  const key = buildCacheKey('response', endpoint, params);
  return getOrSetCache(key, ttlMs, async () => {
    const response = await pandascore.get(endpoint, { params });
    return {
      data: response.data,
      headers: response.headers || {}
    };
  });
};

const parseHeaderTotal = (headers, fallback = 0) => {
  const total = headers?.['x-total'];
  const parsed = Number.parseInt(total, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseNumericSafe = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTierScore = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized === 's' || normalized.includes('tier 1') || normalized.includes('tier1')) return 1000;
  if (normalized === 'a' || normalized.includes('tier 2') || normalized.includes('tier2')) return 800;
  if (normalized === 'b' || normalized.includes('tier 3') || normalized.includes('tier3')) return 600;
  if (normalized === 'c' || normalized.includes('tier 4') || normalized.includes('tier4')) return 400;
  return 200;
};

const getImportanceScore = (match) => {
  if (!match) return 0;
  const prizePool = Math.max(
    parseNumericSafe(match?.prize_pool),
    parseNumericSafe(match?.tournament?.prize_pool),
    parseNumericSafe(match?.league?.prize_pool),
    parseNumericSafe(match?.serie?.prize_pool)
  );
  const teamsCount = Math.max(
    parseNumericSafe(match?.teams_count),
    parseNumericSafe(match?.number_of_teams),
    parseNumericSafe(match?.tournament?.teams_count),
    parseNumericSafe(match?.tournament?.number_of_teams)
  );
  const tierScore = Math.max(
    getTierScore(match?.tier),
    getTierScore(match?.league?.tier),
    getTierScore(match?.serie?.tier),
    getTierScore(match?.tournament?.tier)
  );
  return (tierScore * 10000000) + (teamsCount * 100000) + (Math.sqrt(prizePool + 1) * 1000);
};

const sortByImportance = (matches) => {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => getImportanceScore(b) - getImportanceScore(a));
};

const fetchAllPaginated = async (endpoint, params = {}) => {
  const key = buildCacheKey('all', endpoint, params);
  const ttlMs = endpoint.includes('/running') ? CACHE_TTL_FAST_MS : CACHE_TTL_DEFAULT_MS;

  return getOrSetCache(key, ttlMs, async () => {
    const allItems = [];
    let page = parsePositiveInt(params.page, 1);

    for (let i = 0; i < PANDASCORE_MAX_PAGES; i += 1) {
      const batch = await cachedPandaGet(
        endpoint,
        {
          ...params,
          per_page: PANDASCORE_PAGE_SIZE,
          page
        },
        ttlMs
      );

      const normalizedBatch = Array.isArray(batch) ? batch : [];
      allItems.push(...normalizedBatch);

      if (normalizedBatch.length < PANDASCORE_PAGE_SIZE) break;
      page += 1;
    }

    return allItems;
  });
};

// Configuração CORS melhorada
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://cs-2-live.vercel.app',
      'https://cs2live.vercel.app'
    ];

    // Permitir requisições sem origin (mobile apps, node-fetch, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir tudo em desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400
};

// Middleware CORS explícito
app.use(cors(corsOptions));

// Handler para preflight requests
app.options('*', cors(corsOptions));

// Middleware adicional para garantir headers CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://cs-2-live.vercel.app',
    'https://cs2live.vercel.app'
  ];

  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
  }

  next();
});

app.use(express.json());

// PandaScore API Instance
const pandascore = axios.create({
  baseURL: process.env.PANDASCOPE_BASE_URL || 'https://api.pandascore.co',
  headers: {
    'Authorization': `Bearer ${process.env.PANDASCOPE_API_TOKEN}`,
    'Accept': 'application/json'
  }
});

// Routes

// Get upcoming matches
app.get('/api/matches/upcoming', async (req, res) => {
  try {
    const perPage = parsePositiveInt(req.query.per_page, PANDASCORE_PAGE_SIZE);
    const page = parsePositiveInt(req.query.page, 1);
    const fetchAll = parseBoolean(req.query.all, true);
    const sort = req.query.sort || 'scheduled_at';

    if (fetchAll) {
      const allMatches = await fetchAllPaginated('/csgo/matches/upcoming', { sort, page });
      return res.json(allMatches);
    }

    const data = await cachedPandaGet('/csgo/matches/upcoming', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching upcoming matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming matches' });
  }
});

// Dashboard summary
app.get('/api/dashboard', async (req, res) => {
  try {
    const [live, upcoming, recent, teamsList, tournamentsList] = await Promise.all([
      cachedPandaResponse('/csgo/matches/running', { per_page: 3, page: 1 }, CACHE_TTL_FAST_MS),
      cachedPandaResponse('/csgo/matches/upcoming', { per_page: 5, page: 1, sort: 'scheduled_at' }, CACHE_TTL_DEFAULT_MS),
      cachedPandaResponse('/csgo/matches/past', { per_page: 5, page: 1, sort: '-scheduled_at' }, CACHE_TTL_DEFAULT_MS),
      cachedPandaResponse('/csgo/teams', { per_page: 8, page: 1, sort: 'name' }, CACHE_TTL_SLOW_MS),
      cachedPandaResponse('/csgo/tournaments', { per_page: 1, page: 1 }, CACHE_TTL_DEFAULT_MS)
    ]);

    res.json({
      liveMatches: sortByImportance(Array.isArray(live.data) ? live.data : []),
      liveCount: parseHeaderTotal(live.headers, Array.isArray(live.data) ? live.data.length : 0),
      upcomingMatches: sortByImportance(Array.isArray(upcoming.data) ? upcoming.data : []),
      upcomingCount: parseHeaderTotal(upcoming.headers, Array.isArray(upcoming.data) ? upcoming.data.length : 0),
      recentMatches: sortByImportance(Array.isArray(recent.data) ? recent.data : []),
      recentCount: parseHeaderTotal(recent.headers, Array.isArray(recent.data) ? recent.data.length : 0),
      teams: Array.isArray(teamsList.data) ? teamsList.data : [],
      teamCount: parseHeaderTotal(teamsList.headers, Array.isArray(teamsList.data) ? teamsList.data.length : 0),
      tournaments: Array.isArray(tournamentsList.data) ? tournamentsList.data : [],
      tournamentCount: parseHeaderTotal(tournamentsList.headers, Array.isArray(tournamentsList.data) ? tournamentsList.data.length : 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get recent matches
app.get('/api/matches/recent', async (req, res) => {
  try {
    const perPage = parsePositiveInt(req.query.per_page, PANDASCORE_PAGE_SIZE);
    const page = parsePositiveInt(req.query.page, 1);
    const fetchAll = parseBoolean(req.query.all, true);
    const sort = req.query.sort || '-scheduled_at';

    if (fetchAll) {
      const allMatches = await fetchAllPaginated('/csgo/matches/past', { sort, page });
      return res.json(allMatches);
    }

    const data = await cachedPandaGet('/csgo/matches/past', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching recent matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent matches' });
  }
});

// Get live matches
app.get('/api/matches/live', async (req, res) => {
  try {
    const perPage = parsePositiveInt(req.query.per_page, PANDASCORE_PAGE_SIZE);
    const page = parsePositiveInt(req.query.page, 1);
    const fetchAll = parseBoolean(req.query.all, true);

    if (fetchAll) {
      const allMatches = await fetchAllPaginated('/csgo/matches/running', { page });
      return res.json(allMatches);
    }

    const data = await cachedPandaGet('/csgo/matches/running', {
      per_page: perPage,
      page
    }, CACHE_TTL_FAST_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching live matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

// Get match details
app.get('/api/matches/:id', async (req, res) => {
  try {
    const data = await cachedPandaGet(`/csgo/matches/${req.params.id}`, {}, CACHE_TTL_FAST_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching match details:', error.message);
    res.status(500).json({ error: 'Failed to fetch match details' });
  }
});

// Get teams
app.get('/api/teams', async (req, res) => {
  try {
    const perPage = parsePositiveInt(req.query.per_page, PANDASCORE_PAGE_SIZE);
    const page = parsePositiveInt(req.query.page, 1);
    const fetchAll = parseBoolean(req.query.all, true);
    const sort = req.query.sort || 'name';

    if (fetchAll) {
      const allTeams = await fetchAllPaginated('/csgo/teams', { sort, page });
      return res.json(allTeams);
    }

    const data = await cachedPandaGet('/csgo/teams', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_SLOW_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team details and statistics
app.get('/api/teams/:id', async (req, res) => {
  try {
    const data = await cachedPandaGet(`/csgo/teams/${req.params.id}`, {}, CACHE_TTL_SLOW_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching team details:', error.message);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// Get player statistics
app.get('/api/players/:id', async (req, res) => {
  try {
    const data = await cachedPandaGet(`/players/${req.params.id}`, {}, CACHE_TTL_SLOW_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching player:', error.message);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Get league information
app.get('/api/leagues', async (req, res) => {
  try {
    const data = await cachedPandaGet('/csgo/leagues', {
      per_page: 50,
      sort: 'name'
    }, CACHE_TTL_SLOW_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Get series
app.get('/api/series', async (req, res) => {
  try {
    const data = await cachedPandaGet('/csgo/series', {
      per_page: 50,
      sort: '-begin_at'
    }, CACHE_TTL_SLOW_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching series:', error.message);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Get tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const perPage = parsePositiveInt(req.query.per_page, 50);
    const page = parsePositiveInt(req.query.page, 1);
    const fetchAll = parseBoolean(req.query.all, false);
    const sort = req.query.sort || '-begin_at';

    if (fetchAll) {
      const allTournaments = await fetchAllPaginated('/csgo/tournaments', {
        sort,
        page,
        filter: req.query.filter
      });
      return res.json(allTournaments);
    }

    const params = {
      per_page: perPage,
      page,
      sort
    };

    if (req.query.filter) params.filter = req.query.filter;

    const data = await cachedPandaGet('/csgo/tournaments', params, CACHE_TTL_DEFAULT_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching tournaments:', error.message);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Get tournament details
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const data = await cachedPandaGet(`/csgo/tournaments/${req.params.id}`, {}, CACHE_TTL_DEFAULT_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching tournament details:', error.message);
    res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
});

// Get tournament brackets
app.get('/api/tournaments/:id/brackets', async (req, res) => {
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1
    };

    const data = await cachedPandaGet(`/tournaments/${req.params.id}/brackets`, params, CACHE_TTL_DEFAULT_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching tournament brackets:', error.message);
    res.status(500).json({ error: 'Failed to fetch tournament brackets' });
  }
});

// Get matches for tournament
app.get('/api/tournaments/:id/matches', async (req, res) => {
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1
    };
    
    if (req.query.filter) params.filter = req.query.filter;
    if (req.query.sort) params.sort = req.query.sort;
    
    const data = await cachedPandaGet(`/csgo/tournaments/${req.params.id}/matches`, params, CACHE_TTL_FAST_MS);
    res.json(data);
  } catch (error) {
    console.error('Error fetching tournament matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch tournament matches' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 PandaScore API configured`);
});
