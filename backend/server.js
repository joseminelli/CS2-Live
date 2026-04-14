import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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
    const response = await pandascore.get('/csgo/matches/upcoming', {
      params: {
        per_page: 50,
        page: 1,
        sort: 'scheduled_at'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching upcoming matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch upcoming matches' });
  }
});

// Get recent matches
app.get('/api/matches/recent', async (req, res) => {
  try {
    const response = await pandascore.get('/csgo/matches/past', {
      params: {
        per_page: 50,
        page: 1,
        sort: '-scheduled_at'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recent matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch recent matches' });
  }
});

// Get live matches
app.get('/api/matches/live', async (req, res) => {
  try {
    const response = await pandascore.get('/csgo/matches/running', {
      params: {
        per_page: 50
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching live matches:', error.message);
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
});

// Get match details
app.get('/api/matches/:id', async (req, res) => {
  try {
    const response = await pandascore.get(`/csgo/matches/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching match details:', error.message);
    res.status(500).json({ error: 'Failed to fetch match details' });
  }
});

// Get teams
app.get('/api/teams', async (req, res) => {
  try {
    const response = await pandascore.get('/csgo/teams', {
      params: {
        per_page: 100,
        page: 1,
        sort: 'name'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching teams:', error.message);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team details and statistics
app.get('/api/teams/:id', async (req, res) => {
  try {
    const response = await pandascore.get(`/csgo/teams/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching team details:', error.message);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// Get player statistics
app.get('/api/players/:id', async (req, res) => {
  try {
    const response = await pandascore.get(`/players/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching player:', error.message);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Get league information
app.get('/api/leagues', async (req, res) => {
  try {
    const response = await pandascore.get('/csgo/leagues', {
      params: {
        per_page: 50,
        sort: 'name'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching leagues:', error.message);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Get series
app.get('/api/series', async (req, res) => {
  try {
    const response = await pandascore.get('/csgo/series', {
      params: {
        per_page: 50,
        sort: '-begin_at'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching series:', error.message);
    res.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Get tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const params = {
      per_page: req.query.per_page || 50,
      page: req.query.page || 1,
      sort: req.query.sort || '-begin_at'
    };
    
    if (req.query.filter) params.filter = req.query.filter;
    
    const response = await pandascore.get('/csgo/tournaments', { params });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching tournaments:', error.message);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Get tournament details
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const response = await pandascore.get(`/csgo/tournaments/${req.params.id}`);
    res.json(response.data);
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

    const response = await pandascore.get(`/tournaments/${req.params.id}/brackets`, { params });
    res.json(response.data);
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
    
    const response = await pandascore.get(`/csgo/tournaments/${req.params.id}/matches`, { params });
    res.json(response.data);
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
