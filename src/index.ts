import productRoutes from './routes/ProductRoutes/index';
import transactionRoutes from './routes/TransactionRoutes/index'
import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from './swagger';
import { DataBaseConnection } from './services/DatabaseConnectionService';

dotenv.config();

const app = express();

app.use(express.json());

app.get('/test', (_, response) => {
    response.status(200).send('All is good');
});

export const databaseConnection = new DataBaseConnection();
databaseConnection.connectMongoDb();

const PORT = process.env.PORT;

app.use('/api', productRoutes);
app.use("/api", transactionRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
    console.log(`Express server is listening on http://localhost:${PORT}`);
});
