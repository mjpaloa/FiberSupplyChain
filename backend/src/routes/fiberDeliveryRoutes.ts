// fiberDeliveryRoutes.ts - Fiber Delivery Routes
import { Router } from 'express';
import { FiberDeliveryController } from '../controllers/FiberDeliveryController';
import { authenticate, authorizeFarmer, authorizeCUSAFA, authorizeRoles } from '../middleware/auth';

const router = Router();

// Farmer routes - Allow farmers, MAO officers, and association officers to create deliveries
router.post('/create', authenticate, authorizeRoles('farmer', 'officer', 'association_officer'), FiberDeliveryController.createDelivery);
router.get('/farmer/my-deliveries', authenticate, authorizeFarmer, FiberDeliveryController.getFarmerDeliveries);
router.get('/farmer/:deliveryId', authenticate, FiberDeliveryController.getDeliveryById);
router.put('/farmer/:deliveryId', authenticate, authorizeFarmer, FiberDeliveryController.updateDelivery);
router.delete('/farmer/:deliveryId', authenticate, authorizeFarmer, FiberDeliveryController.deleteDelivery);
router.post('/farmer/:deliveryId/cancel', authenticate, authorizeFarmer, FiberDeliveryController.cancelDelivery);

// CUSAFA/Admin routes - Allow all authenticated users to view deliveries
router.get('/all', authenticate, FiberDeliveryController.getAllDeliveries);
// Allow both MAO officers and association officers to update delivery status
router.put('/cusafa/:deliveryId/status', authenticate, authorizeRoles('officer', 'association_officer'), FiberDeliveryController.updateDeliveryStatus);

export default router;
