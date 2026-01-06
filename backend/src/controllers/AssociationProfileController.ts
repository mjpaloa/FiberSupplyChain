import { Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { UserType } from '../types';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    userType: UserType;
    email: string;
    isSuperAdmin?: boolean;
  };
}

export class AssociationProfileController {
  /**
   * Get association officer profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.userType;

      // Validate authentication
      if (!userId || !userType) {
        console.error('❌ Profile fetch failed: Missing userId or userType in token');
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      // Validate user type
      if (userType !== 'association_officer') {
        console.error(`❌ Profile fetch failed: Wrong userType "${userType}" (expected "association_officer")`);
        return res.status(403).json({ 
          error: 'Forbidden - This endpoint is for association officers only',
          userType: userType
        });
      }

      console.log(`🔍 Fetching association profile for officer_id: ${userId}`);

      const result = await pool.query(
        `SELECT 
          officer_id,
          full_name,
          email,
          position,
          association_name,
          contact_number,
          address,
          profile_picture,
          valid_id_photo,
          term_start_date,
          term_end_date,
          term_duration,
          farmers_under_supervision,
          is_active,
          is_verified,
          verification_status
        FROM association_officers
        WHERE officer_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        console.error(`❌ Profile not found for officer_id: ${userId}`);
        return res.status(404).json({ 
          error: 'Profile not found',
          message: 'No association officer record exists for this account. Please contact support.'
        });
      }

      console.log(`✅ Profile fetched successfully for: ${result.rows[0].full_name}`);

      return res.status(200).json({
        success: true,
        profile: result.rows[0]
      });
    } catch (error: any) {
      console.error('❌ Error fetching association profile:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.userId,
        userType: req.user?.userType
      });
      return res.status(500).json({ 
        error: 'Failed to fetch profile',
        message: 'An internal server error occurred. Please try again later.'
      });
    }
  }

  /**
   * Update association officer profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { full_name, contact_number, address, position, association_name } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate required fields
      if (!full_name || !contact_number || !address) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await pool.query(
        `UPDATE association_officers
        SET 
          full_name = $1,
          contact_number = $2,
          address = $3,
          position = $4,
          association_name = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE officer_id = $6
        RETURNING 
          officer_id,
          full_name,
          email,
          position,
          association_name,
          contact_number,
          address,
          profile_picture`,
        [full_name, contact_number, address, position, association_name, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Update localStorage user data
      const updatedProfile = result.rows[0];

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Construct the file URL (adjust based on your server configuration)
      const fileUrl = `/uploads/profiles/${file.filename}`;

      const result = await pool.query(
        `UPDATE association_officers
        SET profile_picture = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE officer_id = $2
        RETURNING profile_picture`,
        [fileUrl, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profile_picture_url: result.rows[0].profile_picture
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }

  /**
   * Upload valid ID photo
   */
  async uploadIDPhoto(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Construct the file URL (adjust based on your server configuration)
      const fileUrl = `/uploads/profiles/${file.filename}`;

      const result = await pool.query(
        `UPDATE association_officers
        SET valid_id_photo = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE officer_id = $2
        RETURNING valid_id_photo`,
        [fileUrl, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Valid ID photo uploaded successfully',
        valid_id_photo_url: result.rows[0].valid_id_photo
      });
    } catch (error) {
      console.error('Error uploading ID photo:', error);
      return res.status(500).json({ error: 'Failed to upload ID photo' });
    }
  }

  /**
   * Change password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Get current password hash from database
      const userResult = await pool.query(
        'SELECT password_hash FROM association_officers WHERE officer_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const currentPasswordHash = userResult.rows[0].password_hash;

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in database
      await pool.query(
        `UPDATE association_officers
        SET password_hash = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE officer_id = $2`,
        [newPasswordHash, userId]
      );

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ error: 'Failed to change password' });
    }
  }
}
