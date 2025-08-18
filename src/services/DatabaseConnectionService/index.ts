import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

export class DataBaseConnection {
    private isDbConnected: boolean;

    constructor() {
        this.isDbConnected = false;
    }

    public async connectMongoDb() {
        try {
            const dbURI = process.env.MONGO_URI;

            if (!dbURI) {
                throw new Error('MONGO_URI variable is not defined');
            }

            await mongoose.connect(dbURI);

            console.log('Database connected');

            this.isDbConnected = true;
        } catch (err) {
            console.error('Connection to Database failed', err);
        }
    }

    public getIsDbConnected(): boolean {
        return this.isDbConnected;
    }
}
