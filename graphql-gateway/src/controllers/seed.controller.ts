import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { seedDatabase } from '../seed/seed';
import { COLLECTIONS, DATABASE_NAME, USER_ROLES } from '../seed/constants';
import { Logger } from '@3asoftwares/utils';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ecommerce';

export async function seedDatabaseHandler(req: Request, res: Response) {
  try {
    const userRole = (req as any).body?.role;
    if (userRole !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Only admins can seed data' });
    }

    const result = await seedDatabase();
    return res.status(200).json({
      success: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: err?.message || err,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function seedStatusHandler(_req: Request, res: Response) {
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

    const totalDocuments = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const isEmpty = totalDocuments === 0;

    return res
      .status(200)
      .json({ success: true, stats, totalDocuments, isEmpty, timestamp: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Error checking seed status',
      error: err?.message || err,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function clearSeedHandler(req: Request, res: Response) {
  let client: MongoClient | undefined;
  try {
    const userRole = (req as any).body?.role;
    if (userRole !== USER_ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Only admins can clear data' });
    }

    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DATABASE_NAME);

    const clearStats: Record<string, number> = {};
    for (const collectionName of Object.values(COLLECTIONS)) {
      if (collectionName === COLLECTIONS.users) {
        // Preserve admin users, remove others
        const result = await db
          .collection(collectionName)
          .deleteMany({ role: { $ne: USER_ROLES.ADMIN } });
        clearStats[collectionName] = result.deletedCount ?? 0;
        Logger.info(
          `Cleared non-admin users from ${collectionName}: ${clearStats[collectionName]}`
        );
      } else {
        try {
          // Try dropping the collection entirely when possible
          await db.collection(collectionName).drop();
          clearStats[collectionName] = -1; // indicate dropped
        } catch (dropErr: any) {
          // If drop fails (collection may not exist), fallback to deleteMany
          const result = await db.collection(collectionName).deleteMany({});
          clearStats[collectionName] = result.deletedCount ?? 0;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Database cleared successfully',
      stats: clearStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Error clearing database',
      error: err?.message || err,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
