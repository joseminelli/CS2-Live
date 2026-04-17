import { buildCacheKey } from './parsers.js';

export class CacheManager {
  constructor() {
    this.responseCache = new Map();
    this.inFlightRequests = new Map();
  }

  async getOrSet(key, ttlMs, resolver) {
    const now = Date.now();
    const cached = this.responseCache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key);
    }

    const task = Promise.resolve()
      .then(resolver)
      .then((data) => {
        this.responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
        return data;
      })
      .finally(() => {
        this.inFlightRequests.delete(key);
      });

    this.inFlightRequests.set(key, task);
    return task;
  }

  buildKey(prefix, endpoint, params = {}) {
    return buildCacheKey(prefix, endpoint, params);
  }

  clear() {
    this.responseCache.clear();
    this.inFlightRequests.clear();
  }
}

export const cacheManager = new CacheManager();
