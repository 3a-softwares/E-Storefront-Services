import mongoose from 'mongoose';
import { Logger } from '@3asoftwares/utils/server';
import { DATABASE_CONFIG } from '@3asoftwares/utils';

const MONGODB_URL = process.env.MONGODB_URL || DATABASE_CONFIG.MONGODB_URL;
export const connectDatabase = async (): Promise<void> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      Logger.info('MongoDB already connected', undefined, 'Database');
      return;
    }

    // Optimize connection options for both serverless and traditional environments
    const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const options = {
      maxPoolSize: isServerless ? 5 : 10, // Smaller pool for serverless
      minPoolSize: isServerless ? 1 : 0,
      serverSelectionTimeoutMS: isServerless ? 15000 : 5000, // Longer timeout for Vercel cold starts
      socketTimeoutMS: isServerless ? 60000 : 45000, // Longer socket timeout for slow networks
      maxIdleTimeMS: isServerless ? 30000 : undefined, // Close idle connections faster on serverless
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 20000,
      family: 4, // Use IPv4 only (more reliable with MongoDB Atlas)
    };

    await mongoose.connect(MONGODB_URL, options);
    Logger.info('MongoDB connected successfully!', undefined, 'Database');

    mongoose.connection.on('error', (err) => {
      Logger.error('MongoDB connection error', err, 'Database');
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected', undefined, 'Database');
    });

    mongoose.connection.on('reconnected', () => {
      Logger.info('MongoDB reconnected', undefined, 'Database');
    });
  } catch (error: any) {
    Logger.error('MongoDB connection failed', error, 'Database');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    Logger.info('MongoDB connection closed', undefined, 'Database');
  } catch (error: any) {
    Logger.error('Error closing MongoDB connection', error, 'Database');
  }
};
