import { MongoClient, ObjectId } from 'mongodb';
import { COLLECTIONS, DATABASE_NAME } from './constants';
import { generateAllSampleData } from './generate-data';
import dotenv from 'dotenv';

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

export async function seedDatabase(): Promise<{ success: boolean; message: string; stats: Record<string, any> }> {
    let client: MongoClient | undefined;
    try {
        console.log('Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URL);
        await client.connect();
        console.log('Connected to MongoDB\n');

        const db = client.db(DATABASE_NAME);

        // Drop existing collections
        console.log('Dropping existing collections...');
        for (const collectionName of Object.values(COLLECTIONS)) {
            try {
                await db.collection(collectionName).drop();
                console.log(`  Dropped: ${collectionName}`);
            } catch (err: any) {
                if (err.code !== 26) {
                    console.log(`  Skipped: ${collectionName} (not found)`);
                }
            }
        }

        console.log('\nGenerating sample data...');
        const generated = await generateAllSampleData();

        // Seed each collection
        const seedStats: Record<string, any> = {};
        console.log('\nSeeding collections...\n');

        for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
            const dataArr = generated[collectionName as keyof typeof generated] || [];
            if (Array.isArray(dataArr) && dataArr.length > 0) {
                try {
                    const convertedData = dataArr.map(convertNestedObject);
                    const result = await db.collection(collectionName).insertMany(convertedData);
                    seedStats[collectionName] = {
                        inserted: result.insertedCount,
                        success: true,
                    };
                    console.log(`  ✓ ${collectionName}: ${result.insertedCount} documents inserted`);
                } catch (err: any) {
                    seedStats[collectionName] = {
                        success: false,
                        error: err.message,
                    };
                    console.error(`  ✗ Error seeding ${collectionName}: ${err.message}`);
                }
            } else {
                seedStats[collectionName] = {
                    inserted: 0,
                    success: false,
                    error: 'No data generated',
                };
                console.warn(`  ⚠ ${collectionName}: No data generated`);
            }
        }

        console.log('\n✅ DATABASE SEEDING COMPLETE');
        console.log('═══════════════════════════════════════════════════════════');

        return {
            success: true,
            message: 'Database seeded with generated data',
            stats: seedStats,
        };
    } catch (error: any) {
        console.error('❌ Error seeding database:', error);
        return {
            success: false,
            message: 'Error seeding database',
            stats: { error: error.message },
        };
    } finally {
        if (client) {
            await client.close();
            console.log('Disconnected from MongoDB');
        }
    }
}
