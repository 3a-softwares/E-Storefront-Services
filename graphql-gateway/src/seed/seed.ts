import { MongoClient, ObjectId } from 'mongodb';
import { COLLECTIONS, DATABASE_NAME } from './constants';
import { generateAllSampleData } from './generate-data';
import dotenv from 'dotenv';
import { Logger } from '@3asoftwares/utils';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

function convertNestedObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof ObjectId) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertNestedObject(item));
  }
  const converted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertNestedObject(value);
  }
  return converted;
}

export async function seedDatabase(): Promise<{
  success: boolean;
  message: string;
  stats: Record<string, any>;
}> {
  let client: MongoClient | undefined;
  try {
    client = new MongoClient(MONGODB_URL);
    await client.connect();

    const db = client.db(DATABASE_NAME);

    // Drop existing collections
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        await db.collection(collectionName).drop();
      } catch (err: any) {
        Logger.warn(
          `Could not drop collection ${collectionName}: ${err.message}`,
          undefined,
          'SeedDatabase'
        );
      }
    }

    const generated = await generateAllSampleData();

    // Seed each collection
    const seedStats: Record<string, unknown> = {};

    for (const [, collectionName] of Object.entries(COLLECTIONS)) {
      const dataArr = generated[collectionName as keyof typeof generated] || [];
      if (Array.isArray(dataArr) && dataArr.length > 0) {
        try {
          const convertedData = dataArr.map(convertNestedObject);
          const result = await db.collection(collectionName).insertMany(convertedData);
          seedStats[collectionName] = {
            inserted: result.insertedCount,
            success: true,
          };
        } catch (err: any) {
          seedStats[collectionName] = {
            success: false,
            error: err.message,
          };
        }
      } else {
        seedStats[collectionName] = {
          inserted: 0,
          success: false,
          error: 'No data generated',
        };
      }
    }

    return {
      success: true,
      message: 'Database seeded with generated data',
      stats: seedStats,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Error seeding database',
      stats: { error: error.message },
    };
  } finally {
    if (client) {
      await client.close();
    }
  }
}
