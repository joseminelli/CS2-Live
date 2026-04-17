import pandascore from '../config/pandascore.js';
import { cacheManager } from '../utils/cache.js';
import { parsePositiveInt } from '../utils/parsers.js';
import {
  PANDASCORE_PAGE_SIZE,
  PANDASCORE_MAX_PAGES,
  CACHE_TTL_DEFAULT_MS,
  CACHE_TTL_FAST_MS,
  CACHE_TTL_SLOW_MS
} from '../config/cache.js';

export class PandaScoreService {
  constructor() {
    this.cache = cacheManager;
  }

  async get(endpoint, params = {}, ttl = CACHE_TTL_DEFAULT_MS) {
    const key = this.cache.buildKey('single', endpoint, params);
    return this.cache.getOrSet(key, ttl, async () => {
      const response = await pandascore.get(endpoint, { params });
      return response.data;
    });
  }

  async getResponse(endpoint, params = {}, ttl = CACHE_TTL_DEFAULT_MS) {
    const key = this.cache.buildKey('response', endpoint, params);
    return this.cache.getOrSet(key, ttl, async () => {
      const response = await pandascore.get(endpoint, { params });
      return {
        data: response.data,
        headers: response.headers || {}
      };
    });
  }

  async getAllPaginated(endpoint, params = {}) {
    const isFastEndpoint = endpoint.includes('/running');
    const ttl = isFastEndpoint ? CACHE_TTL_FAST_MS : CACHE_TTL_DEFAULT_MS;
    const key = this.cache.buildKey('all', endpoint, params);

    return this.cache.getOrSet(key, ttl, async () => {
      const allItems = [];
      let page = parsePositiveInt(params.page, 1);

      for (let i = 0; i < PANDASCORE_MAX_PAGES; i += 1) {
        const batch = await this.get(
          endpoint,
          {
            ...params,
            per_page: PANDASCORE_PAGE_SIZE,
            page
          },
          ttl
        );

        const normalizedBatch = Array.isArray(batch) ? batch : [];
        allItems.push(...normalizedBatch);

        if (normalizedBatch.length < PANDASCORE_PAGE_SIZE) break;
        page += 1;
      }

      return allItems;
    });
  }
}

export const pandaService = new PandaScoreService();
