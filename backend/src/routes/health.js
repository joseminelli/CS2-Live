import { Router } from 'express';
import { healthController } from '../controllers/HealthController.js';

const router = Router();

router.get('/', (req, res, next) => healthController.check(req, res, next));

export default router;
