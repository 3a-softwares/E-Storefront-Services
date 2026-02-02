import mongoose from 'mongoose';
import { Logger } from '@3asoftwares/utils/server';

// Don't call dotenv.config() here - it's already loaded in index.ts

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ecommerce';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URL);
    Logger.info('Connected to MongoDB successfully', undefined, 'Database');

    mongoose.connection.on('error', (err) => {
      Logger.error('MongoDB connection error', err, 'Database');
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected', undefined, 'Database');
    });
  } catch (error) {
    Logger.error('Failed to connect to MongoDB', error, 'Database');
    process.exit(1);
  }
};
