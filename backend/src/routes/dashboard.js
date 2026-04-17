import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController.js';

const router = Router();

router.get('/', (req, res, next) => dashboardController.getSummary(req, res, next));

export default router;
