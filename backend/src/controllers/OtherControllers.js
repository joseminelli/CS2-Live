import { leagueService, seriesService, playerService } from '../services/OtherServices.js';
import { parsePositiveInt } from '../utils/parsers.js';

export class LeagueController {
  async getAll(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 50);

      const data = await leagueService.getAll(perPage);
      const leagues = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: leagues,
        count: leagues.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export class SeriesController {
  async getAll(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 50);

      const data = await seriesService.getAll(perPage);
      const series = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: series,
        count: series.length
      });
    } catch (error) {
      next(error);
    }
  }
}

export class PlayerController {
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Player ID is required'
        });
      }

      const data = await playerService.getById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leagueController = new LeagueController();
export const seriesController = new SeriesController();
export const playerController = new PlayerController();
