// CleanupController.ts - Controller for managing user cleanup operations
import { Request, Response } from 'express';
import { CleanupService } from '../services/CleanupService';
import { supabase } from '../config/supabase';

export class CleanupController {
  /**
   * Manually trigger cleanup of deactivated users
   * POST /api/mao/cleanup/run
   */
  static async runCleanup(req: Request, res: Response): Promise<void> {
    try {
      console.log('🧹 Manual cleanup triggered by admin:', req.user?.userId);
      
      await CleanupService.cleanupDeactivatedUsers();
      
      res.status(200).json({
        message: 'Cleanup completed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error running cleanup:', error);
      res.status(500).json({
        error: 'Failed to run cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get deactivation statistics
   * GET /api/mao/cleanup/stats
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await CleanupService.getDeactivationStats();
      
      res.status(200).json({
        message: 'Deactivation statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      res.status(500).json({
        error: 'Failed to get deactivation statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get list of users pending deletion (deactivated > 2 days)
   * GET /api/mao/cleanup/pending
   */
  static async getPendingDeletion(req: Request, res: Response): Promise<void> {
    try {
      // Calculate dates
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString();

      // Get pending farmers
      const { data: pendingFarmers } = await supabase
        .from('farmers')
        .select('farmer_id, full_name, email, deactivated_at, deactivated_by')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      // Get pending buyers
      const { data: pendingBuyers } = await supabase
        .from('buyers')
        .select('buyer_id, owner_name, email, deactivated_at, deactivated_by')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      // Get pending officers
      const { data: pendingOfficers } = await supabase
        .from('association_officers')
        .select('officer_id, full_name, email, deactivated_at, deactivated_by')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      // Calculate days remaining for each user
      const calculateDaysRemaining = (deactivatedAt: string) => {
        const deactivatedDate = new Date(deactivatedAt);
        const expiryDate = new Date(deactivatedDate);
        expiryDate.setDate(expiryDate.getDate() + 3);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
      };

      const pendingData = {
        farmers: (pendingFarmers || []).map(farmer => ({
          id: farmer.farmer_id,
          name: farmer.full_name,
          email: farmer.email,
          type: 'farmer',
          deactivatedAt: farmer.deactivated_at,
          deactivatedBy: farmer.deactivated_by,
          daysRemaining: calculateDaysRemaining(farmer.deactivated_at)
        })),
        buyers: (pendingBuyers || []).map(buyer => ({
          id: buyer.buyer_id,
          name: buyer.owner_name,
          email: buyer.email,
          type: 'buyer',
          deactivatedAt: buyer.deactivated_at,
          deactivatedBy: buyer.deactivated_by,
          daysRemaining: calculateDaysRemaining(buyer.deactivated_at)
        })),
        officers: (pendingOfficers || []).map(officer => ({
          id: officer.officer_id,
          name: officer.full_name,
          email: officer.email,
          type: 'association_officer',
          deactivatedAt: officer.deactivated_at,
          deactivatedBy: officer.deactivated_by,
          daysRemaining: calculateDaysRemaining(officer.deactivated_at)
        }))
      };

      const totalPending = pendingData.farmers.length + pendingData.buyers.length + pendingData.officers.length;

      res.status(200).json({
        message: `Found ${totalPending} users pending deletion`,
        data: pendingData,
        summary: {
          farmers: pendingData.farmers.length,
          buyers: pendingData.buyers.length,
          officers: pendingData.officers.length,
          total: totalPending
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error getting pending deletion list:', error);
      res.status(500).json({
        error: 'Failed to get pending deletion list',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
