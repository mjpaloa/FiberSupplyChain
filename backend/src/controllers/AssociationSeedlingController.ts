// AssociationSeedlingController.ts - Association-based seedling distribution management
import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class AssociationSeedlingController {
  /**
   * MAO: Get all association distributions
   */
  static async getAllAssociationDistributions(req: Request, res: Response) {
    try {
      const { variety, status, association_id, date_from, date_to, limit = '100', offset = '0' } = req.query;
      const userId = req.user?.userId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      // Use association_seedling_distributions table (view is optional)
      let query = supabase
        .from('association_seedling_distributions')
        .select('*')
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
      if (association_id) {
        query = query.eq('recipient_association_id', association_id);
      }
      if (date_from) {
        query = query.gte('date_distributed', date_from);
      }
      if (date_to) {
        query = query.lte('date_distributed', date_to);
      }

      const { data, error } = await query;

      let resultData = data;
      let resultError: any = error;

      // Fallback: if view is missing (PGRST205), query the base table instead
      if (resultError && resultError.code === 'PGRST205') {
        let fallbackQuery = supabase
          .from('association_seedling_distributions')
          .select('*')
          .order('date_distributed', { ascending: false })
          .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (!isSuperAdmin) {
          fallbackQuery = fallbackQuery.eq('distributed_by', userId);
        }

        if (variety) {
          fallbackQuery = fallbackQuery.ilike('variety', `%${variety}%`);
        }
        if (status) {
          fallbackQuery = fallbackQuery.eq('status', status);
        }
        if (association_id) {
          fallbackQuery = fallbackQuery.eq('recipient_association_id', association_id);
        }
        if (date_from) {
          fallbackQuery = fallbackQuery.gte('date_distributed', date_from);
        }
        if (date_to) {
          fallbackQuery = fallbackQuery.lte('date_distributed', date_to);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;

        if (fallbackError) throw fallbackError;

        resultData = fallbackData;
        resultError = null;
      } else if (resultError) {
        throw resultError;
      }

      // Map view result and calculate progress real-time
      const distributions = resultData || [];
      const distIds = distributions.map((row: any) => row.distribution_id);

      // Batch fetch farmer distributions to calculate progress
      const { data: allFarmerDistributions } = await supabase
        .from('farmer_seedling_distributions')
        .select('association_distribution_id, quantity_distributed, status, recipient_farmer_id')
        .in('association_distribution_id', distIds)
        .not('status', 'eq', 'cancelled');

      const mapped = distributions.map((row: any) => {
        // Get stats for this specific distribution
        const myFarmerDists = (allFarmerDistributions || []).filter(
          f => f.association_distribution_id === row.distribution_id
        );

        const totalDistributed = myFarmerDists.reduce((sum, f) => sum + (f.quantity_distributed || 0), 0);
        const uniqueFarmers = new Set(myFarmerDists.map(f => f.recipient_farmer_id)).size;
        const remainingQuantity = Math.max(row.quantity_distributed - totalDistributed, 0);

        return {
          distribution_id: row.distribution_id,
          variety: row.variety,
          source_supplier: row.source_supplier,
          quantity_distributed: row.quantity_distributed,
          date_distributed: row.date_distributed,
          recipient_association_id: row.recipient_association_id,
          recipient_association_name: row.recipient_association_name || row.association_name,
          remarks: row.remarks,
          status: row.status,
          distributed_by: row.distributed_by,
          seedling_photo: row.seedling_photo,
          packaging_photo: row.packaging_photo,
          quality_photo: row.quality_photo,
          created_at: row.created_at,
          organization: row.distributed_by
            ? {
              officer_id: row.distributed_by,
              full_name: row.distributed_by_name || '',
            }
            : undefined,
          association_officers: row.recipient_association_id
            ? {
              officer_id: row.recipient_association_id,
              full_name: row.recipient_officer_name || '',
              association_name: row.association_name || row.recipient_association_name,
              contact_number: row.recipient_contact,
            }
            : undefined,
          distributed_to_farmers: totalDistributed,
          farmers_count: uniqueFarmers,
          remaining_quantity: remainingQuantity,
        };
      });

      res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching association distributions:', error);
      res.status(500).json({ error: 'Failed to fetch association distributions' });
    }
  }

  /**
   * MAO: Create new association distribution
   */
  static async createAssociationDistribution(req: Request, res: Response) {
    try {
      const distributionData = req.body;
      const officerId = req.user?.userId; // Get MAO officer who is distributing

      // Validate required fields
      if (!distributionData.variety || !distributionData.quantity_distributed || !distributionData.recipient_association_id) {
        res.status(400).json({
          error: 'Variety, quantity, and recipient association are required'
        });
        return;
      }

      // Get association details
      const { data: association, error: assocError } = await supabase
        .from('association_officers')
        .select('full_name, association_name')
        .eq('officer_id', distributionData.recipient_association_id)
        .single();

      if (assocError || !association) {
        res.status(400).json({ error: 'Invalid association selected' });
        return;
      }

      const { data, error } = await supabase
        .from('association_seedling_distributions')
        .insert({
          ...distributionData,
          recipient_association_name: association.association_name,
          distributed_by: officerId,
          status: 'distributed_to_association' // Set initial status
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Seedlings distributed to association successfully',
        distribution: data
      });
    } catch (error) {
      console.error('Error creating association distribution:', error);
      res.status(500).json({ error: 'Failed to create association distribution' });
    }
  }

  /**
   * MAO: Update association distribution
   */
  static async updateAssociationDistribution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const distributionData = req.body;
      const officerId = req.user?.userId; // Get MAO officer who is updating

      // Validate required fields
      if (!distributionData.variety || !distributionData.quantity_distributed || !distributionData.recipient_association_id) {
        res.status(400).json({
          error: 'Variety, quantity, and recipient association are required'
        });
        return;
      }

      // Get association details
      const { data: association, error: assocError } = await supabase
        .from('association_officers')
        .select('full_name, association_name')
        .eq('officer_id', distributionData.recipient_association_id)
        .single();

      if (assocError || !association) {
        res.status(400).json({ error: 'Invalid association selected' });
        return;
      }

      const { data, error } = await supabase
        .from('association_seedling_distributions')
        .update({
          ...distributionData,
          recipient_association_name: association.association_name,
          updated_at: new Date().toISOString()
        })
        .eq('distribution_id', id)
        .eq('distributed_by', officerId) // Ensure user can only update their own distributions
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        res.status(404).json({ error: 'Distribution not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Distribution updated successfully',
        distribution: data
      });
    } catch (error) {
      console.error('Error updating association distribution:', error);
      res.status(500).json({ error: 'Failed to update association distribution' });
    }
  }

  /**
   * Association: Get distributions received by association
   */
  static async getAssociationReceivedDistributions(req: Request, res: Response) {
    try {
      const associationId = req.user?.userId; // Get authenticated association officer
      const { limit = '50', offset = '0' } = req.query;

      // Use association_seedling_distributions table with JOIN to get distributor name
      const { data, error } = await supabase
        .from('association_seedling_distributions')
        .select(`
          *,
          organization:distributed_by (
            officer_id,
            full_name
          )
        `)
        .eq('recipient_association_id', associationId)
        .order('date_distributed', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      let resultData = data;
      let resultError: any = error;

      // Fallback: if view is missing (PGRST205), query the base table instead
      if (resultError && resultError.code === 'PGRST205') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('association_seedling_distributions')
          .select(`
            *,
            organization:distributed_by (
              officer_id,
              full_name
            )
          `)
          .eq('recipient_association_id', associationId)
          .order('date_distributed', { ascending: false })
          .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

        if (fallbackError) throw fallbackError;

        resultData = fallbackData;
        resultError = null;
      } else if (resultError) {
        throw resultError;
      }

      // Calculate remaining quantities for each distribution
      const mapped = await Promise.all((resultData || []).map(async (row: any) => {
        // Get total distributed to farmers for this association distribution
        const { data: farmerDistributions, error: farmerDistError } = await supabase
          .from('farmer_seedling_distributions')
          .select('quantity_distributed')
          .eq('association_distribution_id', row.distribution_id);

        const totalDistributed = farmerDistributions?.reduce(
          (sum: number, dist: any) => sum + (dist.quantity_distributed || 0),
          0
        ) || 0;

        const remainingQuantity = Math.max(row.quantity_distributed - totalDistributed, 0);

        return {
          distribution_id: row.distribution_id,
          variety: row.variety,
          source_supplier: row.source_supplier,
          quantity_distributed: row.quantity_distributed,
          date_distributed: row.date_distributed,
          recipient_association_name: row.recipient_association_name,
          remarks: row.remarks,
          status: row.status,
          seedling_photo: row.seedling_photo,
          packaging_photo: row.packaging_photo,
          quality_photo: row.quality_photo,
          created_at: row.created_at,
          organization: row.distributed_by
            ? {
              officer_id: row.distributed_by,
              full_name: row.distributed_by_name || '',
            }
            : undefined,
          distributed_to_farmers: totalDistributed,
          farmers_count: row.farmers_receiving_count ?? 0,
          remaining_quantity: remainingQuantity,
        };
      }));

      res.status(200).json(mapped);
    } catch (error) {
      console.error('Error fetching association received distributions:', error);
      res.status(500).json({ error: 'Failed to fetch distributions' });
    }
  }

  /**
   * Association: Get farmers under association for distribution
   */
  static async getAssociationFarmers(req: Request, res: Response) {
    try {
      const associationOfficer = req.user?.userId;

      // Get association details first
      const { data: association, error: assocError } = await supabase
        .from('association_officers')
        .select('association_name')
        .eq('officer_id', associationOfficer)
        .single();

      if (assocError || !association) {
        res.status(400).json({ error: 'Association not found' });
        return;
      }

      const normalizedAssociation = association.association_name?.trim().toLowerCase();
      const isCUSAFACenter = normalizedAssociation === 'cusafa';

      // Allow CUSAFA central officers to see all verified/active farmers
      let farmerQuery = supabase
        .from('farmers')
        .select(`
          farmer_id,
          full_name,
          email,
          contact_number,
          municipality,
          barangay,
          association_name,
          is_verified,
          is_active
        `)
        .eq('is_verified', true)
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (!isCUSAFACenter) {
        farmerQuery = farmerQuery.eq('association_name', association.association_name);
      }

      const { data, error } = await farmerQuery;

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching association farmers:', error);
      res.status(500).json({ error: 'Failed to fetch farmers' });
    }
  }


  /**
   * Association: Distribute seedlings to farmers
   */
  static async distributeSeedlingsToFarmers(req: Request, res: Response) {
    try {
      const { association_distribution_id, farmer_distributions } = req.body;
      const associationId = req.user?.userId;

      // Validate association distribution exists and belongs to this association
      const { data: assocDistribution, error: assocError } = await supabase
        .from('association_seedling_distributions')
        .select('*')
        .eq('distribution_id', association_distribution_id)
        .eq('recipient_association_id', associationId)
        .single();

      if (assocError || !assocDistribution) {
        res.status(400).json({ error: 'Association distribution not found or unauthorized' });
        return;
      }

      // Validate total quantity doesn't exceed available
      const totalDistributed = farmer_distributions.reduce((sum: number, dist: any) => sum + dist.quantity_distributed, 0);

      // Get already distributed quantity
      const { data: existingDistributions, error: existingError } = await supabase
        .from('farmer_seedling_distributions')
        .select('quantity_distributed')
        .eq('association_distribution_id', association_distribution_id);

      if (existingError) throw existingError;

      const alreadyDistributed = existingDistributions?.reduce((sum, dist) => sum + dist.quantity_distributed, 0) || 0;

      if (alreadyDistributed + totalDistributed > assocDistribution.quantity_distributed) {
        res.status(400).json({
          error: `Cannot distribute ${totalDistributed} seedlings. Only ${assocDistribution.quantity_distributed - alreadyDistributed} remaining.`
        });
        return;
      }

      // Create farmer distributions
      const farmerDistributionsData = farmer_distributions.map((dist: any) => ({
        association_distribution_id,
        variety: assocDistribution.variety,
        quantity_distributed: dist.quantity_distributed,
        date_distributed: new Date().toISOString().split('T')[0],
        recipient_farmer_id: dist.farmer_id,
        remarks: dist.remarks || '',
        distributed_by_association: associationId,
        status: 'distributed_to_farmer' // Set initial status
      }));

      const { data, error } = await supabase
        .from('farmer_seedling_distributions')
        .insert(farmerDistributionsData)
        .select();

      if (error) throw error;

      // Calculate new total distributed
      const newTotalDistributed = alreadyDistributed + totalDistributed;

      // Update association distribution status based on remaining quantity
      let newStatus = 'partially_distributed_to_farmers';
      if (newTotalDistributed >= assocDistribution.quantity_distributed) {
        newStatus = 'fully_distributed_to_farmers';
      } else if (newTotalDistributed === 0) {
        newStatus = 'distributed_to_association';
      }

      // Update the association distribution status and photos (if provided)
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add photos if provided in the first distribution (photos are shared across all farmer distributions)
      if (farmer_distributions[0]?.seedling_photo) {
        updateData.seedling_photo = farmer_distributions[0].seedling_photo;
      }
      if (farmer_distributions[0]?.packaging_photo) {
        updateData.packaging_photo = farmer_distributions[0].packaging_photo;
      }
      if (farmer_distributions[0]?.quality_photo) {
        updateData.quality_photo = farmer_distributions[0].quality_photo;
      }

      const { error: updateError } = await supabase
        .from('association_seedling_distributions')
        .update(updateData)
        .eq('distribution_id', association_distribution_id);

      if (updateError) {
        console.error('Error updating association distribution status:', updateError);
        // Don't fail the request, just log the error
      }

      res.status(201).json({
        message: 'Seedlings distributed to farmers successfully',
        distributions: data,
        remaining_quantity: assocDistribution.quantity_distributed - newTotalDistributed
      });
    } catch (error) {
      console.error('Error distributing seedlings to farmers:', error);
      res.status(500).json({ error: 'Failed to distribute seedlings to farmers' });
    }
  }

  /**
   * MAO: Delete association distribution
   */
  static async deleteAssociationDistribution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const officerId = req.user?.userId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      // Only allow deleting distributions created by this officer unless super admin
      let deleteQuery = supabase
        .from('association_seedling_distributions')
        .delete()
        .eq('distribution_id', id);

      if (!isSuperAdmin) {
        deleteQuery = deleteQuery.eq('distributed_by', officerId);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      res.status(200).json({ message: 'Association distribution deleted successfully' });
    } catch (error) {
      console.error('Error deleting association distribution:', error);
      res.status(500).json({ error: 'Failed to delete association distribution' });
    }
  }

  /**
   * Association: Get farmer distributions made by association
   */
  static async getAssociationFarmerDistributions(req: Request, res: Response) {
    try {
      const associationId = req.user?.userId;
      const { limit = '50', offset = '0' } = req.query;

      const { data, error } = await supabase
        .from('farmer_seedling_distributions')
        .select(`
          distribution_id,
          variety,
          quantity_distributed,
          date_distributed,
          remarks,
          status,
          planting_date,
          planting_location,
          planted_quantity,
          damaged_quantity,
          planted_at,
          created_at,
          farmers:recipient_farmer_id (
            farmer_id,
            full_name,
            email,
            contact_number,
            municipality,
            barangay
          ),
          association_seedling_distributions:association_distribution_id (
            distribution_id,
            variety,
            source_supplier,
            date_distributed
          )
        `)
        .eq('distributed_by_association', associationId)
        .order('date_distributed', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching association farmer distributions:', error);
      res.status(500).json({ error: 'Failed to fetch farmer distributions' });
    }
  }

  /**
   * Association: Delete farmer distribution
   */
  static async deleteFarmerDistribution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const associationId = req.user?.userId;

      // Ensure this distribution belongs to the authenticated association
      const { data: existing, error: fetchError } = await supabase
        .from('farmer_seedling_distributions')
        .select('distribution_id, distributed_by_association')
        .eq('distribution_id', id)
        .single();

      if (fetchError) throw fetchError;

      if (!existing || existing.distributed_by_association !== associationId) {
        res.status(403).json({ error: 'Not authorized to delete this farmer distribution' });
        return;
      }

      const { error } = await supabase
        .from('farmer_seedling_distributions')
        .delete()
        .eq('distribution_id', id)
        .eq('distributed_by_association', associationId);

      if (error) throw error;

      // Triggers in the database will automatically update association distribution status
      res.status(200).json({ message: 'Farmer distribution deleted successfully' });
    } catch (error) {
      console.error('Error deleting farmer distribution:', error);
      res.status(500).json({ error: 'Failed to delete farmer distribution' });
    }
  }

  /**
   * Farmer: Get seedlings received from association
   */
  static async getFarmerReceivedSeedlings(req: Request, res: Response) {
    try {
      const farmerId = req.user?.userId;
      const { limit = '50', offset = '0' } = req.query;

      const { data, error } = await supabase
        .from('farmer_seedling_distributions')
        .select(`
          distribution_id,
          variety,
          quantity_distributed,
          date_distributed,
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
          planted_quantity,
          damaged_quantity,
          planted_at,
          created_at,
          association_officers:distributed_by_association (
            officer_id,
            full_name,
            association_name,
            contact_number
          ),
          association_seedling_distributions:association_distribution_id (
            distribution_id,
            source_supplier,
            date_distributed,
            seedling_photo,
            packaging_photo,
            quality_photo,
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

      console.log("📥 DATABASE RESPONSE:", data?.map(d => ({
        id: d.distribution_id,
        status: d.status,
        planted: d.planted_quantity,
        damaged: d.damaged_quantity
      })));

      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching farmer received seedlings:', error);
      res.status(500).json({ error: 'Failed to fetch seedlings' });
    }
  }

  /**
   * Farmer: Mark seedlings as planted
   */
  static async markSeedlingsAsPlanted(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const farmerId = req.user?.userId;
      const plantingData = req.body;

      console.log('🌱 Mark as planted request:', {
        distributionId: id,
        farmerId: farmerId,
        userObject: req.user,
        hasPlantingData: !!plantingData
      });

      // Validate distribution ID
      if (!id || id === 'undefined' || id === 'null') {
        res.status(400).json({
          error: 'Invalid distribution ID. Please provide a valid seedling distribution ID.',
          received: id
        });
        return;
      }

      // Validate farmer ID
      if (!farmerId) {
        res.status(401).json({ error: 'Farmer ID not found in authentication token' });
        return;
      }

      // Verify seedling belongs to this farmer
      const { data: seedling, error: checkError } = await supabase
        .from('farmer_seedling_distributions')
        .select('recipient_farmer_id, association_distribution_id')
        .eq('distribution_id', id)
        .single();

      if (checkError) {
        console.error('Error fetching seedling distribution:', checkError);
        throw checkError;
      }

      if (!seedling) {
        res.status(404).json({ error: 'Seedling distribution not found' });
        return;
      }

      console.log('🔍 Seedling verification:', {
        seedlingFarmerId: seedling.recipient_farmer_id,
        requestFarmerId: farmerId,
        match: seedling.recipient_farmer_id === farmerId
      });

      if (seedling.recipient_farmer_id !== farmerId) {
        res.status(403).json({ error: 'Not authorized to update this seedling distribution' });
        return;
      }

      // Prepare update data - only include planted_by if farmerId exists
      const updateData: any = {
        status: 'planted',
        planting_date: plantingData.planting_date || null,
        planted_quantity: plantingData.planted_quantity || null,
        damaged_quantity: plantingData.damaged_quantity || null,
        planting_location: plantingData.planting_location || null,
        planting_photo_1: plantingData.planting_photo_1 || null,
        planting_photo_2: plantingData.planting_photo_2 || null,
        planting_photo_3: plantingData.planting_photo_3 || null,
        planting_notes: plantingData.planting_notes || null,
        planted_at: new Date().toISOString(),
      };

      // Only add planted_by if farmerId is valid
      if (farmerId) {
        updateData.planted_by = farmerId;
      }

      console.log('📝 Update data:', updateData);

      // Update with planting info
      // Note: Database trigger will automatically update the parent association_seedling_distributions
      // status to reflect planting progress (partially_planted or fully_planted)
      const { data, error } = await supabase
        .from('farmer_seedling_distributions')
        .update(updateData)
        .eq('distribution_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating seedling distribution:', error);
        throw error;
      }

      console.log('✅ Seedling marked as planted successfully');

      res.status(200).json({
        message: 'Seedlings marked as planted successfully',
        distribution: data
      });
    } catch (error) {
      console.error('Error marking seedlings as planted:', error);
      res.status(500).json({ error: 'Failed to mark seedlings as planted' });
    }
  }

  /**
   * CUSAFA: Get all distribution data (associations and farmers)
   */
  static async getCUSAFADistributionData(req: Request, res: Response) {
    try {
      const { date_from, date_to, association_name, municipality } = req.query;

      // Get association distributions
      let assocQuery = supabase
        .from('association_seedling_distributions')
        .select(`
          distribution_id,
          variety,
          source_supplier,
          quantity_distributed,
          date_distributed,
          recipient_association_name,
          status,
          created_at,
          organization:distributed_by (
            officer_id,
            full_name
          ),
          association_officers:recipient_association_id (
            officer_id,
            full_name,
            association_name,
            contact_number
          )
        `)
        .order('date_distributed', { ascending: false });

      // Get farmer distributions
      let farmerQuery = supabase
        .from('farmer_seedling_distributions')
        .select(`
          distribution_id,
          variety,
          quantity_distributed,
          date_distributed,
          status,
          planting_date,
          planting_location,
          planting_notes,
          planting_photo_1,
          planting_photo_2,
          planting_photo_3,
          planted_quantity,
          damaged_quantity,
          planted_at,
          created_at,
          farmers:recipient_farmer_id (
            farmer_id,
            full_name,
            email,
            municipality,
            barangay,
            association_name
          ),
          association_officers:distributed_by_association (
            officer_id,
            full_name,
            association_name
          )
        `)
        .order('date_distributed', { ascending: false });

      // Apply filters
      if (date_from) {
        assocQuery = assocQuery.gte('date_distributed', date_from);
        farmerQuery = farmerQuery.gte('date_distributed', date_from);
      }
      if (date_to) {
        assocQuery = assocQuery.lte('date_distributed', date_to);
        farmerQuery = farmerQuery.lte('date_distributed', date_to);
      }

      const [assocResult, farmerResult] = await Promise.all([
        assocQuery,
        farmerQuery
      ]);

      if (assocResult.error) throw assocResult.error;
      if (farmerResult.error) throw farmerResult.error;

      // Filter by association name if provided
      let filteredAssocData = assocResult.data;
      let filteredFarmerData = farmerResult.data;

      if (association_name) {
        filteredAssocData = filteredAssocData?.filter(d =>
          d.recipient_association_name?.toLowerCase().includes((association_name as string).toLowerCase())
        );
        filteredFarmerData = filteredFarmerData?.filter(d =>
          (d.association_officers as any)?.association_name?.toLowerCase().includes((association_name as string).toLowerCase())
        );
      }

      if (municipality) {
        filteredFarmerData = filteredFarmerData?.filter(d =>
          (d.farmers as any)?.municipality?.toLowerCase().includes((municipality as string).toLowerCase())
        );
      }

      res.status(200).json({
        association_distributions: filteredAssocData,
        farmer_distributions: filteredFarmerData,
        summary: {
          total_association_distributions: filteredAssocData?.length || 0,
          total_farmer_distributions: filteredFarmerData?.length || 0,
          total_seedlings_to_associations: filteredAssocData?.reduce((sum, d) => sum + d.quantity_distributed, 0) || 0,
          total_seedlings_to_farmers: filteredFarmerData?.reduce((sum, d) => sum + d.quantity_distributed, 0) || 0,
        }
      });
    } catch (error) {
      console.error('Error fetching CUSAFA distribution data:', error);
      res.status(500).json({ error: 'Failed to fetch distribution data' });
    }
  }

  /**
   * Association: Update received distribution (remarks, etc.)
   */
  static async updateAssociationReceivedDistribution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const associationId = req.user?.userId;
      const { remarks, status } = req.body;

      // Verify the distribution belongs to this association
      const { data: distribution, error: distError } = await supabase
        .from('association_seedling_distributions')
        .select('*')
        .eq('distribution_id', id)
        .eq('recipient_association_id', associationId)
        .single();

      if (distError || !distribution) {
        res.status(404).json({ error: 'Distribution not found or unauthorized' });
        return;
      }

      const updates: Record<string, any> = {
        remarks: remarks ?? distribution.remarks,
        updated_at: new Date().toISOString()
      };

      if (status) {
        const allowedStatuses = [
          'distributed_to_association',
          'partially_distributed_to_farmers',
          'fully_distributed_to_farmers',
          'cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
          res.status(400).json({ error: 'Invalid status provided' });
          return;
        }

        updates.status = status;
      }

      // Update remarks/status (associations can't change quantity or other fields)
      const { data, error } = await supabase
        .from('association_seedling_distributions')
        .update(updates)
        .eq('distribution_id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: 'Distribution updated successfully',
        distribution: data
      });
    } catch (error) {
      console.error('Error updating association received distribution:', error);
      res.status(500).json({ error: 'Failed to update distribution' });
    }
  }

  /**
   * Association: Delete received distribution
   */
  static async deleteAssociationReceivedDistribution(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const associationId = req.user?.userId;

      // Verify the distribution belongs to this association
      const { data: distribution, error: distError } = await supabase
        .from('association_seedling_distributions')
        .select('*')
        .eq('distribution_id', id)
        .eq('recipient_association_id', associationId)
        .single();

      if (distError || !distribution) {
        res.status(404).json({ error: 'Distribution not found or unauthorized' });
        return;
      }

      // Check if there are farmer distributions
      const { data: farmerDists, error: farmerError } = await supabase
        .from('farmer_seedling_distributions')
        .select('distribution_id')
        .eq('association_distribution_id', id);

      if (farmerError) throw farmerError;

      if (farmerDists && farmerDists.length > 0) {
        res.status(400).json({
          error: 'Cannot delete distribution. There are existing farmer distributions. Please delete farmer distributions first.'
        });
        return;
      }

      // Delete the distribution
      const { error: deleteError } = await supabase
        .from('association_seedling_distributions')
        .delete()
        .eq('distribution_id', id);

      if (deleteError) throw deleteError;

      res.status(200).json({ message: 'Distribution deleted successfully' });
    } catch (error) {
      console.error('Error deleting association received distribution:', error);
      res.status(500).json({ error: 'Failed to delete distribution' });
    }
  }

  /**
   * Get distribution statistics
   */
  static async getDistributionStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.userType;
      const isSuperAdmin = req.user?.isSuperAdmin;

      let assocQuery = supabase.from('association_seedling_distributions').select('quantity_distributed, date_distributed');
      let farmerQuery = supabase.from('farmer_seedling_distributions').select('quantity_distributed, date_distributed, status');

      // Filter based on user type
      if (userType === 'association_officer') {
        assocQuery = assocQuery.eq('recipient_association_id', userId);
        farmerQuery = farmerQuery.eq('distributed_by_association', userId);
      } else if (userType === 'officer' && !isSuperAdmin) {
        assocQuery = assocQuery.eq('distributed_by', userId);
      }

      const [assocResult, farmerResult] = await Promise.all([
        assocQuery,
        farmerQuery
      ]);

      if (assocResult.error) throw assocResult.error;
      if (farmerResult.error) throw farmerResult.error;

      const assocData = assocResult.data || [];
      const farmerData = farmerResult.data || [];

      // Calculate statistics
      const totalAssocDistributions = assocData.length;
      const totalFarmerDistributions = farmerData.length;
      const totalSeedlingsToAssociations = assocData.reduce((sum, d) => sum + d.quantity_distributed, 0);
      const totalSeedlingsToFarmers = farmerData.reduce((sum, d) => sum + d.quantity_distributed, 0);
      const plantedSeedlings = farmerData.filter(d => d.status === 'planted').reduce((sum, d) => sum + d.quantity_distributed, 0);

      // This month statistics
      const thisMonth = new Date();
      const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split('T')[0];

      const thisMonthAssoc = assocData.filter(d => d.date_distributed >= thisMonthStart).length;
      const thisMonthFarmer = farmerData.filter(d => d.date_distributed >= thisMonthStart).length;

      res.status(200).json({
        association_distributions: {
          total: totalAssocDistributions,
          this_month: thisMonthAssoc,
          total_quantity: totalSeedlingsToAssociations
        },
        farmer_distributions: {
          total: totalFarmerDistributions,
          this_month: thisMonthFarmer,
          total_quantity: totalSeedlingsToFarmers,
          planted_quantity: plantedSeedlings
        },
        overall: {
          total_distributions: totalAssocDistributions + totalFarmerDistributions,
          total_seedlings: totalSeedlingsToAssociations,
          distributed_to_farmers: totalSeedlingsToFarmers,
          planted_seedlings: plantedSeedlings,
          planting_rate: totalSeedlingsToFarmers > 0 ? ((plantedSeedlings / totalSeedlingsToFarmers) * 100).toFixed(1) : '0'
        }
      });
    } catch (error) {
      console.error('Error fetching distribution stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}