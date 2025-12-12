import { Router } from 'express';
import { BuyerPurchasesController } from '../controllers/BuyerPurchasesController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create new purchase
router.post('/', authenticate, BuyerPurchasesController.createPurchase);

// Get buyer's purchases with filters
router.get('/', authenticate, BuyerPurchasesController.getBuyerPurchases);

// Get analytics
router.get('/analytics', authenticate, BuyerPurchasesController.getAnalytics);

// Get transactions
router.get('/transactions', authenticate, BuyerPurchasesController.getTransactions);

// Update purchase
router.put('/:purchaseId', authenticate, BuyerPurchasesController.updatePurchase);

// Delete purchase
router.delete('/:purchaseId', authenticate, BuyerPurchasesController.deletePurchase);

// Record inventory sale
router.post('/inventory/sell', authenticate, BuyerPurchasesController.recordSale);

export default router;
