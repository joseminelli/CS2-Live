export const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseBoolean = (value, fallback = false) => {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

export const parseNumericSafe = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parseHeaderTotal = (headers, fallback = 0) => {
  const total = headers?.['x-total'];
  const parsed = Number.parseInt(total, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const sortObjectKeys = (value) => {
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

export const buildCacheKey = (prefix, endpoint, params = {}) => {
  return `${prefix}:${endpoint}:${JSON.stringify(sortObjectKeys(params))}`;
};
