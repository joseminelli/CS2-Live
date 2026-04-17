import { pandaService } from './PandaScoreService.js';
import { CACHE_TTL_DEFAULT_MS, CACHE_TTL_SLOW_MS } from '../config/cache.js';

export class TeamService {
  async getAll(perPage = 100, page = 1, fetchAll = true, sort = 'name') {
    if (fetchAll) {
      return pandaService.getAllPaginated('/csgo/teams', { sort, page });
    }

    const data = await pandaService.get('/csgo/teams', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_SLOW_MS);

    return data;
  }

  async getAllWithHeaders(perPage = 100, page = 1, sort = 'name') {
    return pandaService.getResponse('/csgo/teams', {
      per_page: perPage,
      page,
      sort
    }, CACHE_TTL_SLOW_MS);
  }

  async getById(id) {
    return pandaService.get(`/csgo/teams/${id}`, {}, CACHE_TTL_SLOW_MS);
  }
}

export const teamService = new TeamService();
