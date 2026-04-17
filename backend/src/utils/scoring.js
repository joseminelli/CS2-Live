import { parseNumericSafe } from './parsers.js';

export const getTierScore = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized === 's' || normalized.includes('tier 1') || normalized.includes('tier1')) return 1000;
  if (normalized === 'a' || normalized.includes('tier 2') || normalized.includes('tier2')) return 800;
  if (normalized === 'b' || normalized.includes('tier 3') || normalized.includes('tier3')) return 600;
  if (normalized === 'c' || normalized.includes('tier 4') || normalized.includes('tier4')) return 400;
  return 200;
};

export const getImportanceScore = (match) => {
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

export const sortByImportance = (matches) => {
  if (!Array.isArray(matches)) return [];
  return [...matches].sort((a, b) => getImportanceScore(b) - getImportanceScore(a));
};
