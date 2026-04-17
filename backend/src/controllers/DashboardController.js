import { matchService } from '../services/MatchService.js';
import { teamService } from '../services/TeamService.js';
import { tournamentService } from '../services/TournamentService.js';
import { sortByImportance } from '../utils/scoring.js';
import { parseHeaderTotal } from '../utils/parsers.js';

export class DashboardController {
  async getSummary(req, res, next) {
    try {
      const [live, upcoming, recent, teamsList, tournamentsList] = await Promise.all([
        matchService.getLiveWithHeaders(3, 1),
        matchService.getUpcomingWithHeaders(5, 1),
        matchService.getRecentWithHeaders(5, 1),
        teamService.getAllWithHeaders(8, 1),
        tournamentService.getAllWithHeaders(8, 1)
      ]);

      res.json({
        success: true,
        data: {
          liveMatches: sortByImportance(Array.isArray(live.data) ? live.data : []),
          liveCount: parseHeaderTotal(live.headers, Array.isArray(live.data) ? live.data.length : 0),
          upcomingMatches: sortByImportance(Array.isArray(upcoming.data) ? upcoming.data : []),
          upcomingCount: parseHeaderTotal(upcoming.headers, Array.isArray(upcoming.data) ? upcoming.data.length : 0),
          recentMatches: sortByImportance(Array.isArray(recent.data) ? recent.data : []),
          recentCount: parseHeaderTotal(recent.headers, Array.isArray(recent.data) ? recent.data.length : 0),
          teams: Array.isArray(teamsList.data) ? teamsList.data : [],
          teamCount: parseHeaderTotal(teamsList.headers, Array.isArray(teamsList.data) ? teamsList.data.length : 0),
          tournaments: Array.isArray(tournamentsList.data) ? tournamentsList.data : [],
          tournamentCount: parseHeaderTotal(tournamentsList.headers, Array.isArray(tournamentsList.data) ? tournamentsList.data.length : 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
