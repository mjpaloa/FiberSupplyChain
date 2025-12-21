import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from '../src/routes/authRoutes';
import userRoutes from '../src/routes/userRoutes';
import maoRoutes from '../src/routes/maoRoutes';
import buyersRoutes from '../src/routes/buyersRoutes';
import farmersRoutes from '../src/routes/farmersRoutes';
import adminRoutes from '../src/routes/adminRoutes';
import maintenanceRoutes from '../src/routes/maintenanceRoutes';
import seedlingRoutes from '../src/routes/seedlingRoutes';
import associationSeedlingRoutes from '../src/routes/associationSeedlingRoutes';
import articlesRoutes from '../src/routes/articlesRoutes';
import teamRoutes from '../src/routes/teamRoutes';
import harvestRoutes from '../src/routes/harvestRoutes';
import inventoryRoutes from '../src/routes/inventoryRoutes';
import salesRoutes from '../src/routes/salesRoutes';
import cusafaInventoryRoutes from '../src/routes/cusafaInventoryRoutes';
import buyerPurchasesRoutes from '../src/routes/buyerPurchasesRoutes';
import buyerListingsRoutes from '../src/routes/buyerListingsRoutes';
import fiberDeliveryRoutes from '../src/routes/fiberDeliveryRoutes';
import activityLogsRoutes from '../src/routes/activityLogsRoutes';
import { checkBlockedIp, checkBlockedMac } from '../src/middleware/activityLogger';

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(checkBlockedIp);
app.use(checkBlockedMac);

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

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MAO Culiram Abaca System API', status: 'running' });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
