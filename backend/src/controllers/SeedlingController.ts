// SeedlingController.ts - Seedling distribution management
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateSeedlingDTO, UpdateSeedlingDTO } from '../types/seedling';

export class SeedlingController {
  /**
   * Get all seedlings with farmer details
   */
  static async getAllSeedlings(req: Request, res: Response) {
    try {
      const { variety, status, farmer_id, date_from, date_to, limit = '100', offset = '0' } = req.query;
      const userId = req.user?.userId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      let query = supabase
        .from('seedlings')
        .select(`
          seedling_id,
          variety,
          source_supplier,
          quantity_distributed,
          date_distributed,
          recipient_farmer_id,
          recipient_association,
          remarks,
          status,
          distributed_by,
          seedling_photo,
          packaging_photo,
          quality_photo,
          planting_date,
          planting_location,
          planting_photo_1,
          planting_photo_2,
          planting_photo_3,
          planting_notes,
          planted_quantity,
          damaged_quantity,
          planted_by,
          planted_at,
          created_at,
          farmers:recipient_farmer_id (
            farmer_id,
            full_name,
            email,
            association_name
          ),
          organization:distributed_by (
            officer_id,
            full_name
          )
        `)
        .order('date_distributed', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      // If user is an officer (not super admin), filter by their own distributions
      if (!isSuperAdmin) {
        query = query.eq('distributed_by', userId);
      }

      // Apply filters
      if (variety) {
        query = query.ilike('variety', `%${variety}%`);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (farmer_id) {
        query = query.eq('recipient_farmer_id', farmer_id);
      }
      if (date_from) {
        query = query.gte('date_distributed', date_from);
      }
      if (date_to) {
        query = query.lte('date_distributed', date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching seedlings:', error);
      res.status(500).json({ error: 'Failed to fetch seedlings' });
    }
  }

  /**
   * Get single seedling by ID
   */
  static async getSeedling(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('seedlings')
        .select(`
          *,
          farmers:recipient_farmer_id (
            farmer_id,
            full_name,
            email,
            contact_number,
            association_name,
            municipality,
            barangay
          ),
          officers:distributed_by (
            officer_id,
            full_name,
            email
          )
        `)
        .eq('seedling_id', id)
        .single();

      if (error) throw error;

      if (!data) {
        res.status(404).json({ error: 'Seedling not found' });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching seedling:', error);
      res.status(500).json({ error: 'Failed to fetch seedling' });
    }
  }

  /**
   * Create new seedling distribution
   */
  static async createSeedling(req: Request, res: Response) {
    try {
      const seedlingData: CreateSeedlingDTO = req.body;
      const officerId = req.user?.userId; // Get officer who is distributing

      // Validate required fields
      if (!seedlingData.variety || !seedlingData.quantity_distributed) {
        res.status(400).json({
          error: 'Variety and quantity are required'
        });
        return;
      }

      const { data, error } = await supabase
        .from('seedlings')
        .insert({
          ...seedlingData,
          distributed_by: officerId,
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Seedling distribution recorded successfully',
        seedling: data
      });
    } catch (error) {
      console.error('Error creating seedling:', error);
      res.status(500).json({ error: 'Failed to create seedling distribution' });
    }
  }

  /**
   * Update seedling information
   */
  static async updateSeedling(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateSeedlingDTO = req.body;

      const { data, error } = await supabase
        .from('seedlings')
        .update(updates)
        .eq('seedling_id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Seedling updated successfully',
        seedling: data
      });
    } catch (error) {
      console.error('Error updating seedling:', error);
      res.status(500).json({ error: 'Failed to update seedling' });
    }
  }

  /**
   * Delete seedling record
   */
  static async deleteSeedling(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('seedlings')
        .delete()
        .eq('seedling_id', id);

      if (error) throw error;

      res.status(200).json({ message: 'Seedling record deleted successfully' });
    } catch (error) {
      console.error('Error deleting seedling:', error);
      res.status(500).json({ error: 'Failed to delete seedling' });
    }
  }

  /**
   * Get seedling statistics
   */
  static async getSeedlingStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      // Build base query with optional filtering
      let allQuery = supabase.from('seedlings').select('quantity_distributed');
      let varietyQuery = supabase.from('seedlings').select('variety, quantity_distributed');
      let recentQuery = supabase.from('seedlings').select('*').order('date_distributed', { ascending: false }).limit(5);

      // If user is an officer (not super admin), filter by their own distributions
      if (!isSuperAdmin) {
        allQuery = allQuery.eq('distributed_by', userId);
        varietyQuery = varietyQuery.eq('distributed_by', userId);
        recentQuery = recentQuery.eq('distributed_by', userId);
      }

      // Get total seedlings distributed
      const { data: allSeedlings, error: allError } = await allQuery;

      if (allError) throw allError;

      const totalQuantity = allSeedlings?.reduce(
        (sum, s) => sum + (s.quantity_distributed || 0),
        0
      ) || 0;

      // Get seedlings by variety
      const { data: byVariety, error: varietyError } = await varietyQuery;

      if (varietyError) throw varietyError;

      const varietyStats = byVariety?.reduce((acc: any, s) => {
        const variety = s.variety || 'Unknown';
        if (!acc[variety]) {
          acc[variety] = 0;
        }
        acc[variety] += s.quantity_distributed || 0;
        return acc;
      }, {});

      // Get recent distributions
      const { data: recent, error: recentError } = await recentQuery;

      if (recentError) throw recentError;

      res.status(200).json({
        totalDistributions: allSeedlings?.length || 0,
        totalQuantity,
        byVariety: varietyStats,
        recentDistributions: recent,
      });
    } catch (error) {
      console.error('Error fetching seedling stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  /**
   * Get seedlings for a specific farmer
   */
  static async getFarmerSeedlings(req: Request, res: Response) {
    try {
      const farmerId = req.user?.userId; // Get authenticated farmer
      const { limit = '50', offset = '0' } = req.query;

      const { data, error } = await supabase
        .from('farmer_seedling_distributions')
        .select(`
          distribution_id,
          association_distribution_id,
          variety,
          quantity_distributed,
          date_distributed,
          recipient_farmer_id,
          remarks,
          status,
          seedling_photo,
          packaging_photo,
          quality_photo,
          planting_date,
          planting_location,
          planting_photo_1,
          planting_photo_2,
          planting_photo_3,
          planting_notes,
          planted_by,
          planted_at,
          created_at,
          association_seedling_distributions:association_distribution_id (
            source_supplier,
            organization:distributed_by (
              officer_id,
              full_name
            )
          )
        `)
        .eq('recipient_farmer_id', farmerId)
        .order('date_distributed', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        seedling_id: row.distribution_id,
        variety: row.variety,
        source_supplier: row.association_seedling_distributions?.source_supplier || null,
        quantity_distributed: row.quantity_distributed,
        date_distributed: row.date_distributed,
        recipient_farmer_id: row.recipient_farmer_id,
        recipient_association: row.association_seedling_distributions?.organization?.full_name || null,
        remarks: row.remarks,
        status: row.status,
        distributed_by: row.association_seedling_distributions?.organization?.officer_id || null,
        seedling_photo: row.seedling_photo,
        packaging_photo: row.packaging_photo,
        quality_photo: row.quality_photo,
        planting_date: row.planting_date,
        planting_location: row.planting_location,
        planting_photo_1: row.planting_photo_1,
        planting_photo_2: row.planting_photo_2,
        planting_photo_3: row.planting_photo_3,
        planting_notes: row.planting_notes,
        planted_by: row.planted_by,
        planted_at: row.planted_at,
        created_at: row.created_at,
        organization: row.association_seedling_distributions?.organization || null,
      }));

      res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching farmer seedlings:', error);
      res.status(500).json({ error: 'Failed to fetch seedlings' });
    }
  }

  /**
   * Mark seedling as planted (Farmer only)
   */
  static async markAsPlanted(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;
      const plantingData = req.body;

      // Verify seedling belongs to this farmer
      const { data: seedling, error: checkError } = await supabase
        .from('seedlings')
        .select('recipient_farmer_id')
        .eq('seedling_id', id)
        .single();

      if (checkError) throw checkError;

      if (seedling.recipient_farmer_id !== farmerId) {
        res.status(403).json({ error: 'Not authorized to update this seedling' });
        return;
      }

      // Update seedling with planting info
      const { data, error } = await supabase
        .from('seedlings')
        .update({
          status: 'planted',
          planting_date: plantingData.planting_date,
          planting_location: plantingData.planting_location,
          planting_photo_1: plantingData.planting_photo_1,
          planting_photo_2: plantingData.planting_photo_2,
          planting_photo_3: plantingData.planting_photo_3,
          planting_notes: plantingData.planting_notes,
          planted_quantity: plantingData.planted_quantity,
          damaged_quantity: plantingData.damaged_quantity,
          planted_by: farmerId,
          planted_at: new Date().toISOString(),
        })
        .eq('seedling_id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Seedling marked as planted successfully',
        seedling: data
      });
    } catch (error) {
      console.error('Error marking seedling as planted:', error);
      res.status(500).json({ error: 'Failed to mark seedling as planted' });
    }
  }
}
