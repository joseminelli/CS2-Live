import { Router } from 'express';
import { teamController } from '../controllers/TeamController.js';

const router = Router();

router.get('/', (req, res, next) => teamController.getAll(req, res, next));
router.get('/:id', (req, res, next) => teamController.getById(req, res, next));

export default router;
