// CleanupService.ts - Automated cleanup for deactivated users after 3 days
import { supabase } from '../config/supabase';

export class CleanupService {
  /**
   * Delete users who have been deactivated for more than 3 days
   */
  static async cleanupDeactivatedUsers(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of deactivated users...');
      
      // Calculate the cutoff date (3 days ago)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const cutoffDate = threeDaysAgo.toISOString();
      
      console.log(`📅 Cutoff date: ${cutoffDate}`);

      // Cleanup deactivated farmers
      const { data: deactivatedFarmers, error: farmersError } = await supabase
        .from('farmers')
        .select('farmer_id, full_name, email, deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      if (farmersError) {
        console.error('❌ Error fetching deactivated farmers:', farmersError);
      } else if (deactivatedFarmers && deactivatedFarmers.length > 0) {
        console.log(`🚜 Found ${deactivatedFarmers.length} farmers to delete:`, 
          deactivatedFarmers.map(f => ({ id: f.farmer_id, name: f.full_name, email: f.email }))
        );

        const { error: deleteFarmersError } = await supabase
          .from('farmers')
          .delete()
          .eq('is_active', false)
          .not('deactivated_at', 'is', null)
          .lt('deactivated_at', cutoffDate);

        if (deleteFarmersError) {
          console.error('❌ Error deleting farmers:', deleteFarmersError);
        } else {
          console.log(`✅ Successfully deleted ${deactivatedFarmers.length} farmers`);
        }
      } else {
        console.log('✅ No farmers to delete');
      }

      // Cleanup deactivated buyers
      const { data: deactivatedBuyers, error: buyersError } = await supabase
        .from('buyers')
        .select('buyer_id, owner_name, email, deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      if (buyersError) {
        console.error('❌ Error fetching deactivated buyers:', buyersError);
      } else if (deactivatedBuyers && deactivatedBuyers.length > 0) {
        console.log(`🏢 Found ${deactivatedBuyers.length} buyers to delete:`, 
          deactivatedBuyers.map(b => ({ id: b.buyer_id, name: b.owner_name, email: b.email }))
        );

        const { error: deleteBuyersError } = await supabase
          .from('buyers')
          .delete()
          .eq('is_active', false)
          .not('deactivated_at', 'is', null)
          .lt('deactivated_at', cutoffDate);

        if (deleteBuyersError) {
          console.error('❌ Error deleting buyers:', deleteBuyersError);
        } else {
          console.log(`✅ Successfully deleted ${deactivatedBuyers.length} buyers`);
        }
      } else {
        console.log('✅ No buyers to delete');
      }

      // Cleanup deactivated association officers
      const { data: deactivatedOfficers, error: officersError } = await supabase
        .from('association_officers')
        .select('officer_id, full_name, email, deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null)
        .lt('deactivated_at', cutoffDate);

      if (officersError) {
        console.error('❌ Error fetching deactivated officers:', officersError);
      } else if (deactivatedOfficers && deactivatedOfficers.length > 0) {
        console.log(`👥 Found ${deactivatedOfficers.length} officers to delete:`, 
          deactivatedOfficers.map(o => ({ id: o.officer_id, name: o.full_name, email: o.email }))
        );

        const { error: deleteOfficersError } = await supabase
          .from('association_officers')
          .delete()
          .eq('is_active', false)
          .not('deactivated_at', 'is', null)
          .lt('deactivated_at', cutoffDate);

        if (deleteOfficersError) {
          console.error('❌ Error deleting officers:', deleteOfficersError);
        } else {
          console.log(`✅ Successfully deleted ${deactivatedOfficers.length} officers`);
        }
      } else {
        console.log('✅ No officers to delete');
      }

      console.log('🧹 Cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Get statistics about deactivated users
   */
  static async getDeactivationStats(): Promise<{
    farmers: { total: number; expiringSoon: number };
    buyers: { total: number; expiringSoon: number };
    officers: { total: number; expiringSoon: number };
  }> {
    try {
      // Calculate dates
      const now = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      // Get farmer stats
      const { data: deactivatedFarmers } = await supabase
        .from('farmers')
        .select('deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null);

      const farmerStats = {
        total: deactivatedFarmers?.length || 0,
        expiringSoon: deactivatedFarmers?.filter(f => {
          const deactivatedDate = new Date(f.deactivated_at);
          const expiryDate = new Date(deactivatedDate);
          expiryDate.setDate(expiryDate.getDate() + 3);
          return expiryDate <= oneDayFromNow;
        }).length || 0
      };

      // Get buyer stats
      const { data: deactivatedBuyers } = await supabase
        .from('buyers')
        .select('deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null);

      const buyerStats = {
        total: deactivatedBuyers?.length || 0,
        expiringSoon: deactivatedBuyers?.filter(b => {
          const deactivatedDate = new Date(b.deactivated_at);
          const expiryDate = new Date(deactivatedDate);
          expiryDate.setDate(expiryDate.getDate() + 3);
          return expiryDate <= oneDayFromNow;
        }).length || 0
      };

      // Get officer stats
      const { data: deactivatedOfficers } = await supabase
        .from('association_officers')
        .select('deactivated_at')
        .eq('is_active', false)
        .not('deactivated_at', 'is', null);

      const officerStats = {
        total: deactivatedOfficers?.length || 0,
        expiringSoon: deactivatedOfficers?.filter(o => {
          const deactivatedDate = new Date(o.deactivated_at);
          const expiryDate = new Date(deactivatedDate);
          expiryDate.setDate(expiryDate.getDate() + 3);
          return expiryDate <= oneDayFromNow;
        }).length || 0
      };

      return {
        farmers: farmerStats,
        buyers: buyerStats,
        officers: officerStats
      };
    } catch (error) {
      console.error('❌ Error getting deactivation stats:', error);
      throw error;
    }
  }
}
