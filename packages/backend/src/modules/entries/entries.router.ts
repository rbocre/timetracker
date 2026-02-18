import { Router } from 'express';
import * as entriesController from './entries.controller.js';
import { validate } from '../../middleware/validate.js';
import { createEntrySchema, updateEntrySchema, timerStartSchema } from './entries.validator.js';
import { authGuard } from '../../middleware/auth.js';

const router = Router();

router.use(authGuard);

router.get('/', entriesController.getAll);
router.post('/', validate(createEntrySchema), entriesController.create);
router.get('/:id', entriesController.getById);
router.put('/:id', validate(updateEntrySchema), entriesController.update);
router.delete('/:id', entriesController.remove);
router.post('/timer/start', validate(timerStartSchema), entriesController.startTimer);
router.post('/timer/:id/stop', entriesController.stopTimer);

export { router as entriesRouter };
