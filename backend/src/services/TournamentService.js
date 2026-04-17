import { pandaService } from './PandaScoreService.js';
import { CACHE_TTL_DEFAULT_MS, CACHE_TTL_SLOW_MS } from '../config/cache.js';

export class TournamentService {
  async getAll(perPage = 50, page = 1, fetchAll = false, sort = '-begin_at', filter = null) {
    if (fetchAll) {
      const params = { sort, page };
      if (filter) params.filter = filter;
      return pandaService.getAllPaginated('/csgo/tournaments', params);
    }

    const params = {
      per_page: perPage,
      page,
      sort
    };

    if (filter) params.filter = filter;

    const data = await pandaService.get('/csgo/tournaments', params, CACHE_TTL_DEFAULT_MS);
    return data;
  }

  async getAllWithHeaders(perPage = 50, page = 1, sort = '-begin_at', filter = null) {
    const params = {
      per_page: perPage,
      page,
      sort
    };

    if (filter) params.filter = filter;

    return pandaService.getResponse('/csgo/tournaments', params, CACHE_TTL_DEFAULT_MS);
  }

  async getById(id) {
    return pandaService.get(`/csgo/tournaments/${id}`, {}, CACHE_TTL_DEFAULT_MS);
  }

  async getBrackets(id, perPage = 50, page = 1) {
    const params = {
      per_page: perPage,
      page
    };

    return pandaService.get(`/tournaments/${id}/brackets`, params, CACHE_TTL_DEFAULT_MS);
  }

  async getMatches(id, perPage = 50, page = 1, filter = null, sort = null) {
    const params = {
      per_page: perPage,
      page
    };

    if (filter) params.filter = filter;
    if (sort) params.sort = sort;

    return pandaService.get(`/csgo/tournaments/${id}/matches`, params, CACHE_TTL_FAST_MS);
  }
}

export const tournamentService = new TournamentService();
