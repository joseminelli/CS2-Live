import { Router } from 'express';
import { leagueController, seriesController, playerController } from '../controllers/OtherControllers.js';

const router = Router();

router.get('/leagues', (req, res, next) => leagueController.getAll(req, res, next));
router.get('/series', (req, res, next) => seriesController.getAll(req, res, next));
router.get('/players/:id', (req, res, next) => playerController.getById(req, res, next));

export default router;
