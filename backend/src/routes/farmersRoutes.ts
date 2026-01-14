// farmersRoutes.ts - Farmers routes
import { Router } from 'express';
import { FarmersController } from '../controllers/FarmersController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All farmer routes require authentication
router.use(authenticate);

// Define Farmers routes
router.get('/profile', FarmersController.getFarmerProfile);
router.get('/listings', FarmersController.getFarmerListings);
router.put('/profile', FarmersController.updateProfile);
router.post('/profile/upload-picture', upload.single('profile_picture'), FarmersController.uploadProfilePicture);
router.post('/profile/upload-id', upload.single('valid_id_photo'), FarmersController.uploadValidId);
router.put('/profile/change-password', FarmersController.changePassword);
router.get('/monitoring', FarmersController.getMyMonitoringRecords);
router.get('/:farmerId', FarmersController.getFarmerById); // Get specific farmer by ID

export default router;