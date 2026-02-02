import mongoose from 'mongoose';
import { Logger } from '../utils/logger';

// Don't call dotenv.config() here - it's already loaded in index.ts
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/ecommerce';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URL);
    Logger.info('MongoDB connected successfully', undefined, 'Database');

    mongoose.connection.on('error', (err) => {
      Logger.error('MongoDB connection error', { error: err.message }, 'Database');
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected', undefined, 'Database');
    });

    mongoose.connection.on('reconnected', () => {
      Logger.info('MongoDB reconnected', undefined, 'Database');
    });
  } catch (error: any) {
    Logger.error('Failed to connect to MongoDB', { error: error.message }, 'Database');
    throw error;
  }
};

export default mongoose;
