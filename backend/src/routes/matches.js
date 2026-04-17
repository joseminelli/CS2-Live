import { Router } from 'express';
import { matchController } from '../controllers/MatchController.js';

const router = Router();

router.get('/live', (req, res, next) => matchController.getLive(req, res, next));
router.get('/upcoming', (req, res, next) => matchController.getUpcoming(req, res, next));
router.get('/recent', (req, res, next) => matchController.getRecent(req, res, next));
router.get('/:id', (req, res, next) => matchController.getById(req, res, next));

export default router;
