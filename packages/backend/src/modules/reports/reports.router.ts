import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { authGuard } from '../../middleware/auth.js';

const router = Router();

router.use(authGuard);

router.get('/summary', reportsController.getSummary);
router.get('/project/:id', reportsController.getProjectReport);
router.get('/export/csv', reportsController.exportCsv);

export { router as reportsRouter };
