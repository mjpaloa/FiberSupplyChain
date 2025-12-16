// farmersRoutes.ts - Farmers routes
import { Router } from 'express';
import { FarmersController } from '../controllers/FarmersController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All farmer routes require authentication
router.use(authenticate);

// Define Farmers routes
router.get('/profile', FarmersController.getFarmerProfile);
router.get('/listings', FarmersController.getFarmerListings);
router.put('/profile', FarmersController.updateProfile);
router.get('/monitoring', FarmersController.getMyMonitoringRecords);
router.get('/:farmerId', FarmersController.getFarmerById); // Get specific farmer by ID

export default router;