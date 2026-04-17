import { Router } from 'express';
import { tournamentController } from '../controllers/TournamentController.js';

const router = Router();

router.get('/', (req, res, next) => tournamentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => tournamentController.getById(req, res, next));
router.get('/:id/brackets', (req, res, next) => tournamentController.getBrackets(req, res, next));
router.get('/:id/matches', (req, res, next) => tournamentController.getMatches(req, res, next));

export default router;
