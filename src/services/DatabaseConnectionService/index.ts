import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'node:fs';

dotenv.config();

function buildMongoUri(): string {
  const rawUri = (process.env.MONGO_URI || '').trim();
  if (rawUri) return rawUri;
  
  const isDocker = fs.existsSync('/.dockerenv') || process.env.IN_DOCKER === 'true';

  const host =
    (process.env.MONGO_HOST || '').trim() ||
    (isDocker ? 'mongo' : 'localhost');

  const db = (process.env.MONGO_DB || '').trim() || 'productdb';

  return `mongodb://${host}:27017/${db}`;
}

export class DataBaseConnection {
  private isDbConnected = false;

  public async connectMongoDb(): Promise<void> {
    const dbURI = buildMongoUri();

    try {
      console.log('[DB] connecting to', dbURI);

      await mongoose.connect(dbURI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        retryWrites: true,
      });

      this.isDbConnected = true;

      console.log('[DB] connected');

    } catch (error) {
      this.isDbConnected = false;

      console.error('Connection to Database failed', error);
    }
  }

  public getIsDbConnected(): boolean {
    return this.isDbConnected;
  }
}
