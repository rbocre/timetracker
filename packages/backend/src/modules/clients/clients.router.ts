import { Router } from 'express';
import * as clientsController from './clients.controller.js';
import { validate } from '../../middleware/validate.js';
import { createClientSchema, updateClientSchema } from './clients.validator.js';
import { authGuard } from '../../middleware/auth.js';

const router = Router();

router.use(authGuard);

router.get('/', clientsController.getAll);
router.post('/', validate(createClientSchema), clientsController.create);
router.get('/:id', clientsController.getById);
router.put('/:id', validate(updateClientSchema), clientsController.update);
router.delete('/:id', clientsController.remove);

export { router as clientsRouter };
