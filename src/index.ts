import dotenv from 'dotenv';
import express from 'express';
import AuthRoutes from './routes/AuthRoutes/index'
import productRoutes from './routes/ProductRoutes/index';
import transactionRoutes from './routes/TransactionRoutes/index';
import { corsMiddleware } from './middlewares/CORS';
import { setupSwagger } from './docs/swaggerdoc';
import { errorHandler } from './middlewares/errorHandler';
import { DataBaseConnection } from './services/DatabaseConnectionService';

dotenv.config();

const app = express();

app.use(corsMiddleware);

app.use(express.json());

app.get('/test', (_, response) => {
    response.status(200).send('All is good');
});

export const databaseConnection = new DataBaseConnection();
databaseConnection.connectMongoDb();

const PORT = process.env.PORT;

app.use(productRoutes);
app.use(transactionRoutes);
app.use(AuthRoutes);
app.use(errorHandler);

setupSwagger(app);

app.listen(PORT, () => {
    console.log(`Express server is listening on http://localhost:${PORT}`);
});