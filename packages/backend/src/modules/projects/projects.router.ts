import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from './projects.validator.js';
import { authGuard } from '../../middleware/auth.js';

const router = Router();

router.use(authGuard);

router.get('/', projectsController.getAll);
router.post('/', validate(createProjectSchema), projectsController.create);
router.get('/:id', projectsController.getById);
router.put('/:id', validate(updateProjectSchema), projectsController.update);
router.delete('/:id', projectsController.remove);

export { router as projectsRouter };
