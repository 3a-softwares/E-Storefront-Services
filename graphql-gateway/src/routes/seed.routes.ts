/**
 * Data Seeding Endpoint
 * Allows admins to seed the database with sample data from the UI
 */

import { Router } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';
const DATABASE_NAME = 'ecommerce';

const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  COUPONS: 'coupons',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  ADDRESSES: 'addresses',
  TICKETS: 'tickets',
};

// Convert MongoDB extended JSON to proper objects
function convertNestedObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj.$oid) {
    return new ObjectId(obj.$oid);
  }

  if (obj.$date) {
    return new Date(obj.$date);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertNestedObject(item));
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertNestedObject(value);
  }
  return converted;
}

/**
 * POST /api/seed
 * Seeds the database with sample data
 * Requires admin authorization
 */
router.post('/seed', async (req, res) => {
  let client;

  try {
    // Verify admin role (middleware should handle this)
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can seed data',
      });
    }

    console.log('Starting database seeding...');

    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DATABASE_NAME);

    // Drop existing collections
    console.log('Dropping existing collections...');
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        await db.collection(collectionName).drop();
      } catch (err) {
        if (err.code !== 26) {
          console.warn(`Warning dropping ${collectionName}:`, err.message);
        }
      }
    }

    // Read and seed each collection
    const seedStats = {};

    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
      const filename = `${collectionName}.json`;
      const filepath = path.join(__dirname, '../data', filename);

      if (fs.existsSync(filepath)) {
        try {
          const rawData = fs.readFileSync(filepath, 'utf8');
          const jsonData = JSON.parse(rawData);
          const convertedData = jsonData.map(convertNestedObject);

          if (convertedData.length > 0) {
            const result = await db.collection(collectionName).insertMany(convertedData);
            seedStats[collectionName] = {
              inserted: result.insertedCount,
              success: true,
            };
            console.log(`✅ ${collectionName}: ${result.insertedCount} documents inserted`);
          }
        } catch (err) {
          seedStats[collectionName] = {
            success: false,
            error: err.message,
          };
          console.error(`❌ Error seeding ${collectionName}:`, err.message);
        }
      } else {
        console.warn(`⚠️  Data file not found: ${filename}`);
      }
    }

    await client.close();

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      stats: seedStats,
    });
  } catch (err) {
    console.error('Seeding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: err.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

/**
 * GET /api/seed/status
 * Check seeding status / database population
 */
router.get('/seed/status', async (req, res) => {
  let client;

  try {
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DATABASE_NAME);

    const stats = {};

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
      error: err.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

export default router;
