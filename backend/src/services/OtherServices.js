import { pandaService } from './PandaScoreService.js';
import { CACHE_TTL_SLOW_MS } from '../config/cache.js';

export class LeagueService {
  async getAll(perPage = 50) {
    return pandaService.get('/csgo/leagues', {
      per_page: perPage,
      sort: 'name'
    }, CACHE_TTL_SLOW_MS);
  }
}

export class SeriesService {
  async getAll(perPage = 50) {
    return pandaService.get('/csgo/series', {
      per_page: perPage,
      sort: '-begin_at'
    }, CACHE_TTL_SLOW_MS);
  }
}

export class PlayerService {
  async getById(id) {
    return pandaService.get(`/players/${id}`, {}, CACHE_TTL_SLOW_MS);
  }
}

export const leagueService = new LeagueService();
export const seriesService = new SeriesService();
export const playerService = new PlayerService();
