import { MongoClient, ObjectId } from 'mongodb';
import { COLLECTIONS, DATABASE_NAME } from './constants';
import { generateAllSampleData } from './generate-data';
import { Logger } from '@3asoftwares/utils';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ecommerce';

function convertNestedObject(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof ObjectId || value instanceof Date) {
    return value;
  }

  if (value.$oid && typeof value.$oid === 'string') {
    return new ObjectId(value.$oid);
  }

  if (value.$date) {
    return new Date(value.$date);
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = convertNestedObject(value[i]);
    }
    return value;
  }

  for (const key in value) {
    value[key] = convertNestedObject(value[key]);
  }

  return value;
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

    // Drop existing collections except `users` so current accounts are preserved
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        if (collectionName === COLLECTIONS.users) {
          Logger.info(
            `Skipping drop of users collection to preserve existing accounts`,
            undefined,
            'SeedDatabase'
          );
          continue;
        }
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

    Logger.info('Seeding database with generated data...', undefined, 'SeedDatabase');
    // Seed each collection
    const seedStats: Record<string, unknown> = {};

    for (const [, collectionName] of Object.entries(COLLECTIONS)) {
      const dataArr = generated[collectionName as keyof typeof generated] || [];
      Logger.info(
        `Seeding collection ${collectionName} with ${dataArr.length} records...`,
        undefined,
        'SeedDatabase'
      );
      if (Array.isArray(dataArr) && dataArr.length > 0) {
        try {
          // Convert nested objects ($oid/$date) to proper BSON types
          let convertedData = dataArr.map(convertNestedObject);

          // If seeding users, preserve existing users by skipping generated users
          // whose email already exists in the DB.
          if (collectionName === COLLECTIONS.users) {
            const existing = await db
              .collection(collectionName)
              .find({}, { projection: { email: 1 } })
              .toArray();
            const existingEmails = new Set(
              existing.map((e: any) => (e.email ? e.email.toLowerCase() : ''))
            );

            const beforeCount = convertedData.length;
            convertedData = convertedData.filter(
              (d: any) => !d.email || !existingEmails.has(String(d.email).toLowerCase())
            );

            Logger.info(
              `Filtered users: ${beforeCount - convertedData.length} existing users preserved`,
              undefined,
              'SeedDatabase'
            );
          }

          if (convertedData.length === 0) {
            seedStats[collectionName] = { inserted: 0, success: true };
          } else {
            const result = await db.collection(collectionName).insertMany(convertedData);
            seedStats[collectionName] = {
              inserted: result.insertedCount,
              success: true,
            };
          }
        } catch (err: any) {
          Logger.error(
            `Error seeding collection ${collectionName}: ${err.message}`,
            undefined,
            'SeedDatabase'
          );
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
