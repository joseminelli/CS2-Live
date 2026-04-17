import { pandaService } from './PandaScoreService.js';
import { sortByImportance } from '../utils/scoring.js';
import { parseHeaderTotal } from '../utils/parsers.js';
import { CACHE_TTL_FAST_MS, CACHE_TTL_DEFAULT_MS, CACHE_TTL_SLOW_MS } from '../config/cache.js';

export class MatchService {
  async getLive(perPage = 100, page = 1, fetchAll = true) {
    if (fetchAll) {
      return pandaService.getAllPaginated('/csgo/matches/running', { page });
    }

    const data = await pandaService.get('/csgo/matches/running', {
      per_page: perPage,
      page
    }, CACHE_TTL_FAST_MS);

    return data;
  }

  async getLiveWithHeaders(perPage = 100, page = 1) {
    return pandaService.getResponse('/csgo/matches/running', {
      per_page: perPage,
      page
    }, CACHE_TTL_FAST_MS);
  }

  async getUpcoming(perPage = 100, page = 1, fetchAll = true, sort = 'scheduled_at') {
    if (fetchAll) {
      return pandaService.getAllPaginated('/csgo/matches/upcoming', { sort, page });
    }

    const data = await pandaService.get('/csgo/matches/upcoming', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);

    return data;
  }

  async getUpcomingWithHeaders(perPage = 100, page = 1, sort = 'scheduled_at') {
    return pandaService.getResponse('/csgo/matches/upcoming', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);
  }

  async getRecent(perPage = 100, page = 1, fetchAll = true, sort = '-scheduled_at') {
    if (fetchAll) {
      return pandaService.getAllPaginated('/csgo/matches/past', { sort, page });
    }

    const data = await pandaService.get('/csgo/matches/past', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);

    return data;
  }

  async getRecentWithHeaders(perPage = 100, page = 1, sort = '-scheduled_at') {
    return pandaService.getResponse('/csgo/matches/past', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_DEFAULT_MS);
  }

  async getById(id) {
    return pandaService.get(`/csgo/matches/${id}`, {}, CACHE_TTL_FAST_MS);
  }
}

export const matchService = new MatchService();
