/**
 * Data Seeding Endpoint
 * Allows admins to seed the database with sample data from the UI
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { seedDatabase } from '../seed/seed';
import { COLLECTIONS } from '../seed/constants';

const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
const DATABASE_NAME = 'ecommerce';

const router = Router();

/**
 * POST /api/seed
 * Seeds the database with sample data
 * Requires admin authorization
 */
router.post('/seed', async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userRole = (req as any).user?.role;
        if (userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can seed data',
            });
        }

        const result = await seedDatabase();
        return res.status(200).json({
            success: result.success,
            message: result.message,
            stats: result.stats,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error seeding database',
            error: (err as any).message,
        });
    }
});

/**
 * GET /api/seed/status
 * Check seeding status / database population
 */
router.get('/seed/status', async (req: Request, res: Response) => {
    let client: MongoClient | undefined;
    try {
        client = new MongoClient(MONGODB_URL);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const stats: Record<string, number> = {};
        for (const collectionName of Object.values(COLLECTIONS)) {
            const count = await db.collection(collectionName).countDocuments();
            stats[collectionName] = count;
        }
        await client.close();
        return res.status(200).json({
            success: true,
            stats,
            isEmpty: Object.values(stats).every((count) => count === 0),
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error checking seed status',
            error: (err as any).message,
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

export default router;
