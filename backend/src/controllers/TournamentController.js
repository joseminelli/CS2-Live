import { tournamentService } from '../services/TournamentService.js';
import { parsePositiveInt, parseBoolean } from '../utils/parsers.js';

export class TournamentController {
  async getAll(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 50);
      const page = parsePositiveInt(req.query.page, 1);
      const fetchAll = parseBoolean(req.query.all, false);
      const sort = req.query.sort || '-begin_at';

      const data = await tournamentService.getAll(perPage, page, fetchAll, sort, req.query.filter);
      const tournaments = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: tournaments,
        count: tournaments.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Tournament ID is required'
        });
      }

      const data = await tournamentService.getById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
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

  async getBrackets(req, res, next) {
    try {
      const { id } = req.params;
      const perPage = parsePositiveInt(req.query.per_page, 50);
      const page = parsePositiveInt(req.query.page, 1);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Tournament ID is required'
        });
      }

      const data = await tournamentService.getBrackets(id, perPage, page);

      res.json({
        success: true,
        data: Array.isArray(data) ? data : [],
        count: Array.isArray(data) ? data.length : 0
      });
    } catch (error) {
      next(error);
    }
  }

  async getMatches(req, res, next) {
    try {
      const { id } = req.params;
      const perPage = parsePositiveInt(req.query.per_page, 50);
      const page = parsePositiveInt(req.query.page, 1);

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Tournament ID is required'
        });
      }

      const data = await tournamentService.getMatches(
        id,
        perPage,
        page,
        req.query.filter,
        req.query.sort
      );

      res.json({
        success: true,
        data: Array.isArray(data) ? data : [],
        count: Array.isArray(data) ? data.length : 0
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tournamentController = new TournamentController();
