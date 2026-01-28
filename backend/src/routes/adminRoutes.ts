// routes/adminRoutes.ts - Admin routes for system monitoring and management
import { Router } from 'express';
import {
  getCaptchaStatistics,
  unblockIP
} from '../middleware/captchaMiddleware';
import { authenticate, authorizeMAO } from '../middleware/auth';
import { AdminReportsController } from '../controllers/AdminReportsController';

const router = Router();

/**
 * Admin Routes - Protected by authentication and MAO authorization
 * Only association officers can access these endpoints
 */

/**
 * GET /api/admin/captcha/statistics
 * Get CAPTCHA security statistics
 * Returns: IP statistics, blocked IPs, recent attempts
 */
router.get(
  '/captcha/statistics',
  authenticate,
  authorizeMAO,
  getCaptchaStatistics
);

/**
 * POST /api/admin/captcha/unblock
 * Unblock a specific IP address
 * Body: { ip: string }
 */
router.post(
  '/captcha/unblock',
  authenticate,
  authorizeMAO,
  unblockIP
);

/**
 * GET /api/admin/health
 * System health check
 */
router.get('/health', authenticate, authorizeMAO, (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

/**
 * GET /api/admin/production-report
 * Get production statistics (seedlings, planting, harvest)
 * Returns: Seedlings received, distributed, planted, area planted, estimated production, actual harvested
 */
router.get(
  '/production-report',
  authenticate,
  authorizeMAO,
  AdminReportsController.getProductionReport
);

/**
 * GET /api/admin/sales-report
 * Get sales statistics and recent transactions
 * Returns: Total kg sold, total amount, recent sales list
 */
router.get(
  '/sales-report',
  authenticate,
  authorizeMAO,
  AdminReportsController.getSalesReport
);

/**
 * GET /api/admin/users-report
 * Get user statistics and recent registrations
 * Returns: Total farmers, officers, admins, recent users list
 */
router.get(
  '/users-report',
  authenticate,
  authorizeMAO,
  AdminReportsController.getUsersReport
);

/**
 * GET /api/admin/sales-performance
 * Get sales performance analytics with fiber class breakdown
 * Returns: Volume and sales data for Class A, B, C fibers
 */
router.get(
  '/sales-performance',
  authenticate,
  authorizeMAO,
  AdminReportsController.getSalesPerformanceReport
);


export default router;
