// FarmersController.ts - Farmers controller
import { Request, Response } from 'express';
import { FarmersService } from '../services/FarmersService';
import { AuthService } from '../services/AuthService';
import { supabase } from '../config/supabase';
import bcrypt from 'bcrypt';

export class FarmersController {
  // Upload profile picture
  static async uploadProfilePicture(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Convert file buffer to Base64 for database storage (Vercel has no persistent fs)
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Update farmer profile in database
      const { error } = await supabase
        .from('farmers')
        .update({
          profile_photo: dataURI,
          updated_at: new Date().toISOString()
        })
        .eq('farmer_id', userId);

      if (error) {
        console.error('Error updating profile photo in DB:', error);
        res.status(500).json({ error: 'Failed to update profile picture' });
        return;
      }

      res.status(200).json({
        message: 'Profile picture uploaded successfully',
        profile_picture_url: dataURI
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }

  // Upload valid ID
  static async uploadValidId(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Convert file buffer to Base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      // Update farmer profile in database
      const { error } = await supabase
        .from('farmers')
        .update({
          valid_id_photo: dataURI,
          updated_at: new Date().toISOString()
        })
        .eq('farmer_id', userId);

      if (error) {
        console.error('Error updating valid ID photo in DB:', error);
        res.status(500).json({ error: 'Failed to update valid ID photo' });
        return;
      }

      res.status(200).json({
        message: 'Valid ID uploaded successfully',
        valid_id_photo_url: dataURI
      });
    } catch (error) {
      console.error('Error uploading valid ID:', error);
      res.status(500).json({ error: 'Failed to upload valid ID' });
    }
  }

  // Get farmer profile
  static async getFarmerProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('full_name, contact_number, address, municipality, barangay, association_name, farm_location, farm_coordinates, farm_area_hectares')
        .eq('farmer_id', userId)
        .single();

      if (error || !farmer) {
        console.error('Error fetching farmer profile:', error);
        res.status(404).json({ error: 'Farmer not found' });
        return;
      }

      res.status(200).json({ farmer });
    } catch (error) {
      console.error('Error in getFarmerProfile:', error);
      res.status(500).json({ error: 'Failed to fetch farmer profile' });
    }
  }

  // Get farmer listings
  static async getFarmerListings(req: Request, res: Response) {
    try {
      const listings = await FarmersService.getFarmerListings();
      res.status(200).json(listings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch farmer listings' });
    }
  }

  // Update farmer profile (farmer updates their own profile)
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        full_name,
        contact_number,
        address,
        sex,
        age,
        barangay,
        municipality,
        association_name,
        profilePhoto,
        farm_location,
        farm_coordinates,
        farm_area_hectares
      } = req.body;

      console.log('📝 Farmer updating profile:', {
        userId,
        full_name,
        contact_number,
        address
      });

      // Update farmer profile
      const { data, error } = await supabase
        .from('farmers')
        .update({
          full_name,
          contact_number,
          address,
          sex,
          age: age ? parseInt(age) : null,
          barangay,
          municipality,
          association_name,
          profile_photo: profilePhoto || null,
          farm_location,
          farm_coordinates,
          farm_area_hectares: farm_area_hectares ? parseFloat(farm_area_hectares) : null,
          updated_at: new Date().toISOString()
        })
        .eq('farmer_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating farmer profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
        return;
      }

      console.log('✅ Farmer profile updated:', {
        full_name: data.full_name,
        contact_number: data.contact_number,
        address: data.address
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        farmer: data
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // Get farmer's own monitoring records
  static async getMyMonitoringRecords(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Fetch monitoring records for this farmer
      const { data, error } = await supabase
        .from('monitoring_records')
        .select('*')
        .eq('farmer_id', userId)
        .order('date_of_visit', { ascending: false });

      if (error) {
        console.error('Error fetching farmer monitoring records:', error);
        res.status(500).json({ error: 'Failed to fetch monitoring records' });
        return;
      }

      res.status(200).json({ records: data || [] });
    } catch (error) {
      console.error('Error in getMyMonitoringRecords:', error);
      res.status(500).json({ error: 'Failed to fetch monitoring records' });
    }
  }

  // Get farmer by ID (for auto-filling contact info in delivery forms)
  static async getFarmerById(req: Request, res: Response) {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        res.status(400).json({ error: 'Farmer ID is required' });
        return;
      }

      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('farmer_id, full_name, contact_number, email, municipality, barangay, address')
        .eq('farmer_id', farmerId)
        .single();

      if (error || !farmer) {
        console.error('Error fetching farmer by ID:', error);
        res.status(404).json({ error: 'Farmer not found' });
        return;
      }

      console.log('✅ Farmer fetched by ID:', farmer.full_name, '- Contact:', farmer.contact_number);
      res.status(200).json(farmer);
    } catch (error) {
      console.error('Error in getFarmerById:', error);
      res.status(500).json({ error: 'Failed to fetch farmer details' });
    }
  }
  // Change password
  static async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current and new password are required' });
        return;
      }

      // Get current password hash
      const { data: farmer, error } = await supabase
        .from('farmers')
        .select('password_hash')
        .eq('farmer_id', userId)
        .single();

      if (error || !farmer) {
        res.status(404).json({ error: 'Farmer not found' });
        return;
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, farmer.password_hash);
      if (!isValid) {
        res.status(400).json({ error: 'Incorrect current password' });
        return;
      }

      // Hash new password
      const newPasswordHash = await AuthService.hashPasswordPublic(newPassword);

      // Update password
      const { error: updateError } = await supabase
        .from('farmers')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('farmer_id', userId);

      if (updateError) {
        throw updateError;
      }

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}