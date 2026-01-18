// MAOController.ts - MAO controller
import { Request, Response } from 'express';
import { MAOService } from '../services/MAOService';
import { supabase } from '../config/supabase';

export class MAOController {
  // Get MAO dashboard data
  static async getDashboardData(req: Request, res: Response) {
    try {
      const dashboardData = await MAOService.getDashboardData();
      res.status(200).json(dashboardData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch MAO dashboard data' });
    }
  }

  // Get verified buyers
  static async getVerifiedBuyers(req: Request, res: Response) {
    try {
      const buyers = await MAOService.getVerifiedBuyers();
      res.status(200).json(buyers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch verified buyers' });
    }
  }

  // Complete officer profile
  static async completeProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        fullName,
        position,
        officeName,
        associationName, // Add as fallback
        assignedMunicipality,
        assignedBarangay,
        contactNumber,
        contact_number, // Add as fallback
        address,
        profilePicture,
      } = req.body;

      const finalOfficeName = officeName || associationName;
      const finalContactNumber = contactNumber || contact_number;

      console.log('📝 Received profile update data:', {
        fullName,
        position,
        officeName: finalOfficeName,
        assignedMunicipality,
        assignedBarangay,
        contactNumber: finalContactNumber,
        address,
        userId
      });

      // Update officer profile
      const updatePayload: any = {
        position,
        office_name: finalOfficeName,
        assigned_municipality: assignedMunicipality,
        assigned_barangay: assignedBarangay,
        contact_number: finalContactNumber,
        address,
        profile_picture: profilePicture || null,
        profile_completed: true,
        profile_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Also update full_name if provided
      if (fullName) {
        updatePayload.full_name = fullName;
      }

      const { data, error } = await supabase
        .from('organization')
        .update(updatePayload)
        .eq('officer_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
        return;
      }

      console.log('✅ Profile updated in database:', {
        full_name: data.full_name,
        contact_number: data.contact_number,
        address: data.address,
        position: data.position,
        office_name: data.office_name
      });

      res.status(200).json({
        message: 'Profile completed successfully',
        officer: data,
      });
    } catch (error) {
      console.error('Error in completeProfile:', error);
      res.status(500).json({ error: 'Failed to complete profile' });
    }
  }

  // Get all officers
  static async getOfficers(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('organization')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching officers:', error);
        res.status(500).json({ error: 'Failed to fetch officers' });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getOfficers:', error);
      res.status(500).json({ error: 'Failed to fetch officers' });
    }
  }

  // Delete officer
  static async deleteOfficer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('organization')
        .delete()
        .eq('officer_id', id);

      if (error) {
        console.error('Error deleting officer:', error);
        res.status(500).json({ error: 'Failed to delete officer' });
        return;
      }

      res.status(200).json({ message: 'Officer deleted successfully' });
    } catch (error) {
      console.error('Error in deleteOfficer:', error);
      res.status(500).json({ error: 'Failed to delete officer' });
    }
  }

  // Get all monitoring records
  static async getMonitoringRecords(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      console.log('📊 Fetching monitoring records for user:', userId, 'isSuperAdmin:', isSuperAdmin);

      let query = supabase
        .from('monitoring_records')
        .select('*')
        .order('date_of_visit', { ascending: false });

      // If user is a regular officer (not super admin), show records they created
      if (!isSuperAdmin) {
        // Show all records created by this officer
        query = query.eq('created_by', userId);
        console.log('🔍 Filtering by created_by:', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching monitoring records:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring records' });
        return;
      }

      console.log(`✅ Found ${data?.length || 0} monitoring records`);
      res.status(200).json({ records: data || [] });
    } catch (error) {
      console.error('❌ Error in getMonitoringRecords:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring records' });
    }
  }

  // Get single monitoring record
  static async getMonitoringRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('monitoring_records')
        .select('*')
        .eq('monitoring_id', id)
        .single();

      if (error) {
        console.error('Error fetching monitoring record:', error);
        res.status(404).json({ error: 'Monitoring record not found' });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getMonitoringRecord:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring record' });
    }
  }

  // Get all verified associations for seedling distribution
  static async getVerifiedAssociations(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('association_officers')
        .select('officer_id, full_name, association_name, contact_number')
        .eq('is_verified', true)
        .eq('is_active', true)
        .order('association_name', { ascending: true });

      if (error) {
        console.error('Error fetching associations:', error);
        res.status(500).json({ error: 'Failed to fetch associations' });
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error('Error in getVerifiedAssociations:', error);
      res.status(500).json({ error: 'Failed to fetch associations' });
    }
  }

  // Create monitoring record
  static async createMonitoringRecord(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        monitoringId,
        dateOfVisit,
        monitoredBy,
        monitoredByRole,
        farmerId,
        farmerName,
        associationName,
        farmLocation,
        farmCondition,
        growthStage,
        issuesObserved,
        otherIssues,
        actionsTaken,
        recommendations,
        nextMonitoringDate,
        weatherCondition,
        estimatedYield,
        remarks,
        photoUrls,
        status
      } = req.body;

      console.log('📥 Received monitoring data:', req.body);

      // Validate required fields (farmerId is optional, nextMonitoringDate optional if status=Completed)
      if (!monitoringId || !dateOfVisit || !monitoredBy || !farmerName ||
        !farmCondition || !growthStage || !actionsTaken || !recommendations) {
        console.error('❌ Missing required fields');
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Only require nextMonitoringDate if status is not Completed (Final Visit)
      if (status !== 'Completed' && !nextMonitoringDate) {
        console.error('❌ Next monitoring date required for ongoing monitoring');
        res.status(400).json({ error: 'Next monitoring date is required for ongoing monitoring' });
        return;
      }

      console.log('✅ Validation passed, inserting record...');

      const { data, error } = await supabase
        .from('monitoring_records')
        .insert({
          monitoring_id: monitoringId,
          date_of_visit: dateOfVisit,
          monitored_by: monitoredBy,
          monitored_by_role: monitoredByRole,
          farmer_id: farmerId || null,
          farmer_name: farmerName,
          association_name: associationName,
          farm_location: farmLocation,
          farm_condition: farmCondition,
          growth_stage: growthStage,
          issues_observed: issuesObserved || [],
          other_issues: otherIssues,
          actions_taken: actionsTaken,
          recommendations: recommendations,
          next_monitoring_date: nextMonitoringDate || null,
          weather_condition: weatherCondition,
          estimated_yield: estimatedYield,
          remarks: remarks,
          photo_urls: photoUrls || [],
          status: status || 'Ongoing',
          created_by: userId,
          updated_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating monitoring record:', error);
        res.status(500).json({ error: 'Failed to create monitoring record', details: error.message });
        return;
      }

      res.status(201).json({ message: 'Monitoring record created successfully', data });
    } catch (error) {
      console.error('Error in createMonitoringRecord:', error);
      res.status(500).json({ error: 'Failed to create monitoring record' });
    }
  }

  // Update monitoring record
  static async updateMonitoringRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const {
        dateOfVisit,
        monitoredBy,
        monitoredByRole,
        farmerId,
        farmerName,
        associationName,
        farmLocation,
        farmCondition,
        growthStage,
        issuesObserved,
        otherIssues,
        actionsTaken,
        recommendations,
        nextMonitoringDate,
        weatherCondition,
        estimatedYield,
        remarks,
        photoUrls
      } = req.body;

      const updateData: any = {
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      // Only update fields that are provided
      if (dateOfVisit) updateData.date_of_visit = dateOfVisit;
      if (monitoredBy) updateData.monitored_by = monitoredBy;
      if (monitoredByRole !== undefined) updateData.monitored_by_role = monitoredByRole;
      if (farmerId) updateData.farmer_id = farmerId;
      if (farmerName) updateData.farmer_name = farmerName;
      if (associationName !== undefined) updateData.association_name = associationName;
      if (farmLocation !== undefined) updateData.farm_location = farmLocation;
      if (farmCondition) updateData.farm_condition = farmCondition;
      if (growthStage) updateData.growth_stage = growthStage;
      if (issuesObserved !== undefined) updateData.issues_observed = issuesObserved;
      if (otherIssues !== undefined) updateData.other_issues = otherIssues;
      if (actionsTaken) updateData.actions_taken = actionsTaken;
      if (recommendations) updateData.recommendations = recommendations;
      if (nextMonitoringDate) updateData.next_monitoring_date = nextMonitoringDate;
      if (weatherCondition !== undefined) updateData.weather_condition = weatherCondition;
      if (estimatedYield !== undefined) updateData.estimated_yield = estimatedYield;
      if (remarks !== undefined) updateData.remarks = remarks;
      if (photoUrls !== undefined) updateData.photo_urls = photoUrls;

      const { data, error } = await supabase
        .from('monitoring_records')
        .update(updateData)
        .eq('monitoring_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating monitoring record:', error);
        res.status(500).json({ error: 'Failed to update monitoring record', details: error.message });
        return;
      }

      res.status(200).json({ message: 'Monitoring record updated successfully', data });
    } catch (error) {
      console.error('Error in updateMonitoringRecord:', error);
      res.status(500).json({ error: 'Failed to update monitoring record' });
    }
  }

  // Delete monitoring record
  static async deleteMonitoringRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('monitoring_records')
        .delete()
        .eq('monitoring_id', id);

      if (error) {
        console.error('Error deleting monitoring record:', error);
        res.status(500).json({ error: 'Failed to delete monitoring record' });
        return;
      }

      res.status(200).json({ message: 'Monitoring record deleted successfully' });
    } catch (error) {
      console.error('Error in deleteMonitoringRecord:', error);
      res.status(500).json({ error: 'Failed to delete monitoring record' });
    }
  }
}