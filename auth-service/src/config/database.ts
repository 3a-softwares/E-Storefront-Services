

import mongoose from 'mongoose';
import { Logger } from '@3asoftwares/utils/server';
import { DATABASE_CONFIG } from '@3asoftwares/utils';

const MONGODB_URL = process.env.MONGODB_URL || DATABASE_CONFIG.MONGODB_URL;
export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URL, options);
    Logger.info('MongoDB connected successfully', undefined, 'Database');

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
