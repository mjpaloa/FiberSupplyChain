// HarvestController.ts - Harvest management controller
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class HarvestController {
  // =====================================================
  // FARMER ENDPOINTS
  // =====================================================

  // Create new harvest submission (Farmer)
  static async createHarvest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        // 1) Farm / Location (optional overrides, otherwise auto-filled)
        farm_coordinates, // GPS coordinates or location description
        landmark,
        farm_name,
        farm_code,
        area_hectares,
        plot_lot_id,

        // 2) Farmer Info (optional overrides)
        farmer_email,
        mao_registration,
        farmer_registration_id,

        // 3) Planting and Variety
        abaca_variety,
        planting_date,
        planting_material_source,
        planting_density_hills_per_ha,
        planting_spacing,

        // 4) Harvest Details
        harvest_date,
        harvest_shift,
        harvest_crew_name,
        harvest_crew_id,
        harvest_method,
        stalks_harvested,
        tuxies_collected,
        wet_weight_kg,
        dry_fiber_output_kg,
        estimated_fiber_recovery_percent,
        yield_per_hectare_kg,

        // 5) Quality / Grading
        fiber_grade,
        fiber_length_cm,
        fiber_color,
        fiber_fineness,
        fiber_cleanliness,
        moisture_status,
        defects_noted,
        has_mold,
        has_discoloration,
        has_pest_damage,
        stripper_operator_name,
        bales_produced,
        weight_per_bale_kg,

        // 6) Inputs / Costs
        fertilizer_applied,
        fertilizer_application_date,
        fertilizer_quantity,
        pesticide_applied,
        pesticide_application_date,
        pesticide_quantity,
        labor_hours,
        number_of_workers,
        harvesting_cost_per_kg,
        harvesting_cost_per_ha,
        total_harvesting_cost,

        // 7) Pest / Disease
        pests_observed,
        pests_description,
        diseases_observed,
        diseases_description,
        remarks,
        photo_urls,

        // 8) Verification
        inspected_by,
        inspector_position,
        inspection_date,
        farmer_signature_url,
        farmer_thumbmark_url,
        receiving_buyer_trader,
        buyer_contact
      } = req.body;

      // Get farmer details to auto-populate location and contact info
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('full_name, contact_number, address, municipality, barangay, association_name, farm_location, farm_coordinates, farm_area_hectares')
        .eq('farmer_id', userId)
        .single();

      if (farmerError || !farmer) {
        res.status(404).json({ error: 'Farmer not found' });
        return;
      }

      // Insert harvest record with auto-populated farmer info
      const { data: harvest, error: harvestError } = await supabase
        .from('harvests')
        .insert({
          // Farmer ID
          farmer_id: userId,

          // Location (auto-populated from farmer profile, can be overridden)
          county_province: farmer.address ? farmer.address.substring(0, 255) : '', // Trim to fit VARCHAR(255)
          municipality: farmer.municipality,
          barangay: farmer.barangay,
          farm_coordinates: farm_coordinates || farmer.farm_coordinates,
          landmark: landmark || farmer.farm_location,
          farm_name,
          farm_code,
          area_hectares: area_hectares || farmer.farm_area_hectares,
          plot_lot_id,

          // Farmer Info (auto-populated from farmer profile)
          farmer_name: farmer.full_name,
          farmer_contact: farmer.contact_number,
          farmer_email,
          cooperative_name: farmer.association_name,
          mao_registration,
          farmer_registration_id,

          // Planting
          abaca_variety,
          planting_date,
          planting_material_source,
          planting_density_hills_per_ha,
          planting_spacing,

          // Harvest
          harvest_date,
          harvest_shift,
          harvest_crew_name,
          harvest_crew_id,
          harvest_method,
          stalks_harvested,
          tuxies_collected,
          wet_weight_kg,
          dry_fiber_output_kg,
          estimated_fiber_recovery_percent,
          yield_per_hectare_kg,

          // Quality
          fiber_grade,
          fiber_length_cm,
          fiber_color,
          fiber_fineness,
          fiber_cleanliness,
          moisture_status,
          defects_noted,
          has_mold,
          has_discoloration,
          has_pest_damage,
          stripper_operator_name,
          bales_produced,
          weight_per_bale_kg,

          // Inputs
          fertilizer_applied,
          fertilizer_application_date,
          fertilizer_quantity,
          pesticide_applied,
          pesticide_application_date,
          pesticide_quantity,
          labor_hours,
          number_of_workers,
          harvesting_cost_per_kg,
          harvesting_cost_per_ha,
          total_harvesting_cost,

          // Pest/Disease
          pests_observed,
          pests_description,
          diseases_observed,
          diseases_description,
          remarks,
          photo_urls,

          // Verification
          inspected_by,
          inspector_position,
          inspection_date,
          farmer_signature_url,
          farmer_thumbmark_url,
          receiving_buyer_trader,
          buyer_contact,

          status: 'Pending Verification'
        })
        .select()
        .single();

      if (harvestError) {
        console.error('❌ Error creating harvest:', harvestError);
        res.status(400).json({
          error: 'Failed to create harvest record',
          message: harvestError.message,
          code: harvestError.code
        });
        return;
      }

      console.log('✅ Harvest created:', harvest.harvest_id);
      res.status(201).json({
        message: 'Harvest submitted successfully',
        harvest
      });
    } catch (error) {
      console.error('Error in createHarvest:', error);
      res.status(500).json({ error: 'Failed to create harvest' });
    }
  }

  // Get farmer's own harvests
  static async getMyHarvests(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { status, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('harvests')
        .select('*')
        .eq('farmer_id', userId)
        .order('harvest_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching farmer harvests:', error);
        res.status(500).json({ error: 'Failed to fetch harvests' });
        return;
      }

      res.status(200).json({ harvests: data || [] });
    } catch (error) {
      console.error('Error in getMyHarvests:', error);
      res.status(500).json({ error: 'Failed to fetch harvests' });
    }
  }

  // Get single harvest details (Farmer - own harvest only)
  static async getHarvestById(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { harvestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, error } = await supabase
        .from('harvests')
        .select('*')
        .eq('harvest_id', harvestId)
        .eq('farmer_id', userId)
        .single();

      if (error || !data) {
        res.status(404).json({ error: 'Harvest not found' });
        return;
      }

      res.status(200).json({ harvest: data });
    } catch (error) {
      console.error('Error in getHarvestById:', error);
      res.status(500).json({ error: 'Failed to fetch harvest' });
    }
  }

  // Update harvest (Farmer - only if pending)
  static async updateHarvest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { harvestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if harvest exists and is pending
      const { data: existing, error: checkError } = await supabase
        .from('harvests')
        .select('status')
        .eq('harvest_id', harvestId)
        .eq('farmer_id', userId)
        .single();

      if (checkError || !existing) {
        res.status(404).json({ error: 'Harvest not found' });
        return;
      }

      if (existing.status !== 'Pending Verification') {
        res.status(403).json({ error: 'Cannot update harvest that has been verified or rejected' });
        return;
      }

      // Update harvest
      const { data, error } = await supabase
        .from('harvests')
        .update(req.body)
        .eq('harvest_id', harvestId)
        .eq('farmer_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating harvest:', error);
        res.status(500).json({ error: 'Failed to update harvest' });
        return;
      }

      res.status(200).json({
        message: 'Harvest updated successfully',
        harvest: data
      });
    } catch (error) {
      console.error('Error in updateHarvest:', error);
      res.status(500).json({ error: 'Failed to update harvest' });
    }
  }

  // Delete harvest (Farmer - only if pending)
  static async deleteHarvest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { harvestId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if harvest exists and is pending
      const { data: existing, error: checkError } = await supabase
        .from('harvests')
        .select('status')
        .eq('harvest_id', harvestId)
        .eq('farmer_id', userId)
        .single();

      if (checkError || !existing) {
        res.status(404).json({ error: 'Harvest not found' });
        return;
      }

      if (existing.status !== 'Pending Verification') {
        res.status(403).json({ error: 'Cannot delete harvest that has been verified' });
        return;
      }

      const { error } = await supabase
        .from('harvests')
        .delete()
        .eq('harvest_id', harvestId)
        .eq('farmer_id', userId);

      if (error) {
        console.error('Error deleting harvest:', error);
        res.status(500).json({ error: 'Failed to delete harvest' });
        return;
      }

      res.status(200).json({ message: 'Harvest deleted successfully' });
    } catch (error) {
      console.error('Error in deleteHarvest:', error);
      res.status(500).json({ error: 'Failed to delete harvest' });
    }
  }

  // Get farmer's harvest statistics
  static async getMyHarvestStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, error } = await supabase
        .from('harvests')
        .select('status, dry_fiber_output_kg, yield_per_hectare_kg, area_hectares')
        .eq('farmer_id', userId);

      if (error) {
        console.error('Error fetching harvest stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
        return;
      }

      const stats = {
        total_harvests: data.length,
        pending: data.filter(h => h.status === 'Pending Verification').length,
        verified: data.filter(h => h.status === 'Verified' || h.status === 'In Inventory' || h.status === 'Delivered').length,
        rejected: data.filter(h => h.status === 'Rejected').length,
        in_inventory: data.filter(h => h.status === 'In Inventory').length,
        total_fiber_kg: data.reduce((sum, h) => sum + (h.dry_fiber_output_kg || 0), 0),
        total_area_hectares: data.reduce((sum, h) => sum + (h.area_hectares || 0), 0),
        avg_yield_per_hectare: data.length > 0
          ? data.reduce((sum, h) => sum + (h.yield_per_hectare_kg || 0), 0) / data.length
          : 0
      };

      res.status(200).json({ statistics: stats });
    } catch (error) {
      console.error('Error in getMyHarvestStats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  // =====================================================
  // MAO ENDPOINTS
  // =====================================================

  // Get all harvests (All officers see all harvests, with filtering options)
  static async getAllHarvests(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      // More robust Super Admin check
      let isSuperAdmin = req.user?.isSuperAdmin === true;
      let userPosition = '';

      // Additional check: if user is officer, check their position in database
      if (!isSuperAdmin && req.user?.userType === 'officer' && userId) {
        console.log('🔍 Checking officer details...');
        const { data: officerData, error: officerError } = await supabase
          .from('organization')
          .select('position, is_super_admin')
          .eq('officer_id', userId)
          .single();

        if (!officerError && officerData) {
          console.log('🔍 Officer data:', officerData);
          userPosition = officerData.position || '';
          // Check if position indicates Super Admin
          if (officerData.position &&
            (officerData.position.includes('System Administrator') ||
              officerData.position.includes('Admin') ||
              officerData.is_super_admin)) {
            isSuperAdmin = true;
            console.log('👑 User identified as Super Admin by position');
          }
        }
      }

      console.log('📊 Fetching harvests for user:', userId, 'isSuperAdmin:', isSuperAdmin, 'Position:', userPosition);

      const { status, municipality, barangay, limit = 50, offset = 0 } = req.query;

      let query = supabase
        .from('harvests')
        .select('*')
        .order('harvest_date', { ascending: false });

      // In this system:
      // - All officers (MAOs, Admins) see all harvests in their area
      // - Super Admins see everything
      // - Regular MAOs can apply filters as needed
      console.log('👥 All officers can see all harvests in the system');

      // Apply filters only if they are provided (not empty strings)
      if (status && status !== 'all') {
        console.log('🔍 Applying status filter:', status);
        query = query.eq('status', status);
      }
      if (municipality && municipality !== '') {
        console.log('🔍 Applying municipality filter:', municipality);
        query = query.eq('municipality', municipality);
      }
      if (barangay && barangay !== '') {
        console.log('🔍 Applying barangay filter:', barangay);
        query = query.eq('barangay', barangay);
      }

      query = query.range(Number(offset), Number(offset) + Number(limit) - 1);

      console.log('🔍 Final query built');

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching all harvests:', error);
        res.status(500).json({ error: 'Failed to fetch harvests' });
        return;
      }

      console.log('✅ Found harvests:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 First harvest sample:', {
          id: data[0].harvest_id,
          farmer: data[0].farmer_name,
          date: data[0].harvest_date,
          status: data[0].status,
          verified_by: data[0].verified_by
        });
      } else {
        // Debug: Let's see what's in the database without filters
        console.log('🔍 No harvests found with filters, checking all harvests...');
        const { data: allData, error: allError } = await supabase
          .from('harvests')
          .select('*')
          .limit(5);

        if (!allError && allData) {
          console.log('📋 All harvests in database (first 5):', allData.map(h => ({
            id: h.harvest_id,
            farmer: h.farmer_name,
            status: h.status,
            verified_by: h.verified_by,
            date: h.harvest_date
          })));
        }
      }

      // Fetch verifier information separately since there's no FK constraint
      const harvestsWithVerifiers = await Promise.all(
        (data || []).map(async (harvest) => {
          if (harvest.verified_by) {
            const { data: verifier, error: verifierError } = await supabase
              .from('organization')
              .select('full_name, email')
              .eq('officer_id', harvest.verified_by)
              .single();

            if (!verifierError && verifier) {
              return {
                ...harvest,
                verifier
              };
            }
          }
          return {
            ...harvest,
            verifier: null
          };
        })
      );

      res.status(200).json({ harvests: harvestsWithVerifiers });
    } catch (error) {
      console.error('Error in getAllHarvests:', error);
      res.status(500).json({ error: 'Failed to fetch harvests' });
    }
  }

  // Get all harvests for Super Admin (sees everything)
  static async getAllHarvestsForSuperAdmin(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      // More robust Super Admin check
      let isSuperAdmin = req.user?.isSuperAdmin === true;

      // Additional check: if user is officer, check their position in database
      if (!isSuperAdmin && req.user?.userType === 'officer' && userId) {
        console.log('🔍 Super Admin route - checking if user is Super Admin by position...');
        const { data: officerData, error: officerError } = await supabase
          .from('organization')
          .select('position, is_super_admin')
          .eq('officer_id', userId)
          .single();

        if (!officerError && officerData) {
          console.log('🔍 Officer data in Super Admin route:', officerData);
          // Check if position indicates Super Admin
          if (officerData.position &&
            (officerData.position.includes('System Administrator') ||
              officerData.position.includes('Admin') ||
              officerData.is_super_admin)) {
            isSuperAdmin = true;
            console.log('👑 User identified as Super Admin by position in Super Admin route');
          }
        }
      }

      console.log('👑 Super Admin route - User:', userId, 'isSuperAdmin:', isSuperAdmin);

      if (!isSuperAdmin) {
        console.log('❌ Access denied - user is not Super Admin');
        res.status(403).json({ error: 'Access denied. Super Admin only.' });
        return;
      }

      console.log('✅ Super Admin access granted - fetching all harvests');
      // Just call the main getAllHarvests function since it now handles super admin role
      return HarvestController.getAllHarvests(req, res);
    } catch (error) {
      console.error('Error in getAllHarvestsForSuperAdmin:', error);
      res.status(500).json({ error: 'Failed to fetch harvests' });
    }
  }

  // Verify harvest (MAO)
  static async verifyHarvest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { harvestId } = req.params;
      const { verification_notes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data, error } = await supabase
        .from('harvests')
        .update({
          status: 'Verified',
          verified_by: userId,
          verified_at: new Date().toISOString(),
          verification_notes
        })
        .eq('harvest_id', harvestId)
        .select()
        .single();

      if (error) {
        console.error('Error verifying harvest:', error);
        res.status(500).json({ error: 'Failed to verify harvest' });
        return;
      }

      console.log('✅ Harvest verified:', harvestId);
      res.status(200).json({
        message: 'Harvest verified successfully',
        harvest: data
      });
    } catch (error) {
      console.error('Error in verifyHarvest:', error);
      res.status(500).json({ error: 'Failed to verify harvest' });
    }
  }

  // Reject harvest (MAO)
  static async rejectHarvest(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { harvestId } = req.params;
      const { verification_notes } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!verification_notes) {
        res.status(400).json({ error: 'Verification notes required for rejection' });
        return;
      }

      const { data, error } = await supabase
        .from('harvests')
        .update({
          status: 'Rejected',
          verified_by: userId,
          verified_at: new Date().toISOString(),
          verification_notes
        })
        .eq('harvest_id', harvestId)
        .select()
        .single();

      if (error) {
        console.error('Error rejecting harvest:', error);
        res.status(500).json({ error: 'Failed to reject harvest' });
        return;
      }

      console.log('❌ Harvest rejected:', harvestId);
      res.status(200).json({
        message: 'Harvest rejected',
        harvest: data
      });
    } catch (error) {
      console.error('Error in rejectHarvest:', error);
      res.status(500).json({ error: 'Failed to reject harvest' });
    }
  }

  // Get harvest statistics (MAO)
  static async getHarvestStatistics(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('harvest_statistics')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching harvest statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
        return;
      }

      res.status(200).json({ statistics: data });
    } catch (error) {
      console.error('Error in getHarvestStatistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  // Get farmer harvest summary (MAO)
  static async getFarmerHarvestSummary(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('farmer_harvest_summary')
        .select('*')
        .order('total_fiber_produced_kg', { ascending: false });

      if (error) {
        console.error('Error fetching farmer summary:', error);
        res.status(500).json({ error: 'Failed to fetch farmer summary' });
        return;
      }

      res.status(200).json({ farmers: data || [] });
    } catch (error) {
      console.error('Error in getFarmerHarvestSummary:', error);
      res.status(500).json({ error: 'Failed to fetch farmer summary' });
    }
  }
}
