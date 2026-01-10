// maoRoutes.ts - MAO routes
import { Router } from 'express';
import { body } from 'express-validator';
import { MAOController } from '../controllers/MAOController';
import { UserManagementController } from '../controllers/UserManagementController';
import { CleanupController } from '../controllers/CleanupController';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authorizeMAO } from '../middleware/auth';

const router = Router();

// All MAO routes require authentication
router.use(authenticate);
router.use(authorizeMAO);

// Define MAO routes
router.get('/dashboard', MAOController.getDashboardData);
router.get('/buyers', MAOController.getVerifiedBuyers);

/**
 * @route   POST /api/mao/complete-profile
 * @desc    Complete officer profile after first login
 * @access  Private (Officer only)
 */
router.post('/complete-profile', MAOController.completeProfile);

// User Management Routes - Farmers
router.get('/farmers', UserManagementController.getFarmers);
router.get('/farmers/:id', UserManagementController.getFarmer);
router.put('/farmers/:id', UserManagementController.updateFarmer);
router.post('/farmers/:id/verify', UserManagementController.verifyFarmer);
router.post('/farmers/:id/reject', UserManagementController.rejectFarmer);
router.post('/farmers/:id/deactivate', UserManagementController.deactivateFarmer);
router.post('/farmers/:id/reactivate', UserManagementController.reactivateFarmer);
router.delete('/farmers/:id/permanent', UserManagementController.permanentlyDeleteFarmer);

// User Management Routes - Buyers
router.get('/buyers-list', UserManagementController.getBuyers);
router.get('/buyers/:id', UserManagementController.getBuyer);
router.put('/buyers/:id', UserManagementController.updateBuyer);
router.post('/buyers/:id/verify', UserManagementController.verifyBuyer);
router.post('/buyers/:id/reject', UserManagementController.rejectBuyer);
router.post('/buyers/:id/deactivate', UserManagementController.deactivateBuyer);
router.post('/buyers/:id/reactivate', UserManagementController.reactivateBuyer);
router.delete('/buyers/:id/permanent', UserManagementController.permanentlyDeleteBuyer);

// User Management Routes - Association Officers
router.get('/association-officers', UserManagementController.getOfficers);
router.get('/association-officers/:id', UserManagementController.getOfficer);
router.put('/association-officers/:id', UserManagementController.updateOfficer);
router.post('/association-officers/:id/verify', UserManagementController.verifyOfficer);
router.post('/association-officers/:id/reject', UserManagementController.rejectOfficer);
router.post('/association-officers/:id/deactivate', UserManagementController.deactivateOfficer);
router.post('/association-officers/:id/reactivate', UserManagementController.reactivateOfficer);
router.delete('/association-officers/:id/permanent', UserManagementController.permanentlyDeleteOfficer);

// Officer Management Routes (All officers including admin-created)
router.get('/officers', MAOController.getOfficers);
router.delete('/officers/admin/:id', MAOController.deleteOfficer);

// Monitoring Routes
router.get('/monitoring', MAOController.getMonitoringRecords);
router.get('/monitoring/:id', MAOController.getMonitoringRecord);
router.post('/monitoring', MAOController.createMonitoringRecord);
router.put('/monitoring/:id', MAOController.updateMonitoringRecord);
router.delete('/monitoring/:id', MAOController.deleteMonitoringRecord);

// Seedling Distribution Routes
router.get('/associations', MAOController.getVerifiedAssociations);

/**
 * @route   POST /api/mao/create-officer
 * @desc    Create new officer account (Admin only)
 * @access  Private (MAO only)
 */
router.post(
  '/create-officer',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    // profilePicture is optional
    // Other fields will be filled during profile completion
  ],
  AuthController.createOfficerAccount
);

// Cleanup Management Routes
router.post('/cleanup/run', CleanupController.runCleanup);
router.get('/cleanup/stats', CleanupController.getStats);
router.get('/cleanup/pending', CleanupController.getPendingDeletion);

export default router;