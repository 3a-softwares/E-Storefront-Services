/**
 * Data Seeding Endpoint
 * Allows admins to seed the database with sample data from the UI
 */

import { Router } from 'express';
import {
  seedDatabaseHandler,
  seedStatusHandler,
  clearSeedHandler,
} from '../controllers/seed.controller';

const router = Router();

router.post('/seed', seedDatabaseHandler);
router.post('/seed/clear', clearSeedHandler);
router.get('/seed/status', seedStatusHandler);

export default router;
