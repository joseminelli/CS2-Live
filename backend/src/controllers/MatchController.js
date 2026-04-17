import { matchService } from '../services/MatchService.js';
import { parsePositiveInt, parseBoolean } from '../utils/parsers.js';

export class MatchController {
  async getLive(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 100);
      const page = parsePositiveInt(req.query.page, 1);
      const fetchAll = parseBoolean(req.query.all, true);

      const data = await matchService.getLive(perPage, page, fetchAll);
      const matches = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: matches,
        count: matches.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getUpcoming(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 100);
      const page = parsePositiveInt(req.query.page, 1);
      const fetchAll = parseBoolean(req.query.all, true);
      const sort = req.query.sort || 'scheduled_at';

      const data = await matchService.getUpcoming(perPage, page, fetchAll, sort);
      const matches = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: matches,
        count: matches.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 100);
      const page = parsePositiveInt(req.query.page, 1);
      const fetchAll = parseBoolean(req.query.all, true);
      const sort = req.query.sort || '-scheduled_at';

      const data = await matchService.getRecent(perPage, page, fetchAll, sort);
      const matches = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: matches,
        count: matches.length
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
          error: 'Match ID is required'
        });
      }

      const data = await matchService.getById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
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

export const matchController = new MatchController();
