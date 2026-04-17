import { teamService } from '../services/TeamService.js';
import { parsePositiveInt, parseBoolean } from '../utils/parsers.js';

export class TeamController {
  async getAll(req, res, next) {
    try {
      const perPage = parsePositiveInt(req.query.per_page, 100);
      const page = parsePositiveInt(req.query.page, 1);
      const fetchAll = parseBoolean(req.query.all, true);
      const sort = req.query.sort || 'name';

      const data = await teamService.getAll(perPage, page, fetchAll, sort);
      const teams = Array.isArray(data) ? data : [];

      res.json({
        success: true,
        data: teams,
        count: teams.length
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
          error: 'Team ID is required'
        });
      }

      const data = await teamService.getById(id);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
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

export const teamController = new TeamController();
