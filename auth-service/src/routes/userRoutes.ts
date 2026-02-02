

import express from 'express';
import * as userController from '../controllers/UserController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, userController.getUsers);

router.patch('/:id/role', authenticate, userController.updateUserRole);

router.delete('/:id', authenticate, userController.deleteUser);

export default router;
