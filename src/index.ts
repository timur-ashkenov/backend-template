import dotenv from 'dotenv';
import express from 'express';
import AuthRoutes from './routes/AuthRoutes';
import { buildMoySkladMarketRouter } from './routes/MoySkladMarketRoutes';
import transactionRoutes from './routes/TransactionRoutes';
import { corsMiddleware } from './middlewares/CORS';
import { setupSwagger } from './docs/swaggerdoc';
import { errorHandler } from './middlewares/errorHandler';
import { DataBaseConnection } from './services/DatabaseConnectionService';

dotenv.config();

async function bootstrap() {
    const app = express();

    app.use(corsMiddleware);
    app.use(express.json());

    app.get('/test', (_req, res) => res.status(200).send('All is good'));
    app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
    app.get('/api/ping', (_req, res) => res.send('pong'));

    const databaseConnection = new DataBaseConnection();
    await databaseConnection.connectMongoDb(); 
    const db = databaseConnection.getNativeDb(); 

    await db
        .collection('productStats')
        .createIndex({ productId: 1 }, { unique: true });
    await db.collection('reviews').createIndex({ productId: 1, createdAt: -1 });
    await db
    .collection("ugcMeta")
    .createIndex({ productId: 1 }, { unique: true });

    app.use(transactionRoutes);
    app.use(AuthRoutes);

    app.use('/', buildMoySkladMarketRouter(db));

    setupSwagger(app);

    app.use(errorHandler);

    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, () => {
        console.log(`Express server is listening on http://localhost:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exit(1);
});
