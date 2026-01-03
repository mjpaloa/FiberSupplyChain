import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import maoRoutes from './routes/maoRoutes';
import buyersRoutes from './routes/buyersRoutes';
import farmersRoutes from './routes/farmersRoutes';
import adminRoutes from './routes/adminRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import seedlingRoutes from './routes/seedlingRoutes';
import associationSeedlingRoutes from './routes/associationSeedlingRoutes';
import articlesRoutes from './routes/articlesRoutes';
import teamRoutes from './routes/teamRoutes';
import harvestRoutes from './routes/harvestRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import salesRoutes from './routes/salesRoutes';
import cusafaInventoryRoutes from './routes/cusafaInventoryRoutes';
import buyerPurchasesRoutes from './routes/buyerPurchasesRoutes';
import buyerListingsRoutes from './routes/buyerListingsRoutes';
import fiberDeliveryRoutes from './routes/fiberDeliveryRoutes';
import activityLogsRoutes from './routes/activityLogsRoutes';
import associationProfileRoutes from './routes/associationProfileRoutes';
import { checkBlockedIp, checkBlockedMac } from './middleware/activityLogger';

// Import config
import { config } from './config/env';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = config.port;

// CORS configuration for production
const corsOptions = {
  origin: [
    'https://easyabaca.site',
    'https://www.easyabaca.site',
    'http://localhost:5173', // For local development
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Security middleware - Check for blocked IPs and MACs
app.use(checkBlockedIp);
app.use(checkBlockedMac);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mao', maoRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/farmers', farmersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/seedlings', seedlingRoutes);
app.use('/api/association-seedlings', associationSeedlingRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/harvests', harvestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/cusafa-inventory', cusafaInventoryRoutes);
app.use('/api/buyer-purchases', buyerPurchasesRoutes);
app.use('/api/buyer-listings', buyerListingsRoutes);
app.use('/api/fiber-deliveries', fiberDeliveryRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/association', associationProfileRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MAO Culiram Abaca System API' });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
