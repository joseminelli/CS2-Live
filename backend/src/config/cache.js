import { parsePositiveInt } from '../utils/parsers.js';

export const PANDASCORE_PAGE_SIZE = 100;
export const PANDASCORE_MAX_PAGES = parsePositiveInt(process.env.PANDASCORE_MAX_PAGES, 200);
export const CACHE_TTL_FAST_MS = parsePositiveInt(process.env.CACHE_TTL_FAST_MS, 15000);
export const CACHE_TTL_DEFAULT_MS = parsePositiveInt(process.env.CACHE_TTL_DEFAULT_MS, 120000);
export const CACHE_TTL_SLOW_MS = parsePositiveInt(process.env.CACHE_TTL_SLOW_MS, 600000);
