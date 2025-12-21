// controllers/AuthController.ts - Authentication controllers
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { verifyRecaptchaEnhanced } from '../utils/captchaEnhanced';
import { config } from '../config/env';
import { supabase } from '../config/supabase';
import {
  FarmerRegistration,
  BuyerRegistration,
  OfficerRegistration,
  LoginRequest,
} from '../types';

export class AuthController {
  /**
   * Register a new farmer
   * POST /api/auth/register/farmer
   */
  static async registerFarmer(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const data: FarmerRegistration = req.body;
      console.log('Received farmer registration data:', data);

      // Verify reCAPTCHA token (required for security)
      if (!data.recaptchaToken) {
        res.status(400).json({
          error: 'reCAPTCHA verification is required. Please complete the "I\'m not a robot" challenge.',
        });
        return;
      }

      // Get IP and User Agent
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      // DEVELOPMENT MODE: Skip reCAPTCHA verification if in development
      if (config.nodeEnv === 'development') {
        console.log('⚠️ DEV MODE: Skipping reCAPTCHA verification');
      } else {
        const isValid = await verifyRecaptchaEnhanced(
          data.recaptchaToken,
          ipAddress,
          userAgent,
          '/api/auth/register/farmer',
          config.recaptchaVersion,
          config.recaptchaMinScore
        );

        if (!isValid) {
          // SOFT FAIL: Log error but allow registration to proceed to avoid blocking legitimate users
          console.warn('⚠️ reCAPTCHA verification failed for farmer registration (Allowed):', data.email);
          // res.status(400).json({
          //   error: 'reCAPTCHA verification failed. Please try again.',
          // });
          // return;
        }
      }

      // Register farmer
      const farmer = await AuthService.registerFarmer(
        data,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        message: 'Farmer registered successfully',
        data: farmer,
      });
    } catch (error: any) {
      console.error('Error in registerFarmer:', error);
      res.status(400).json({
        error: error.message || 'Failed to register farmer',
      });
    }
  }

  /**
   * Register a new buyer
   * POST /api/auth/register/buyer
   */
  static async registerBuyer(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const data: BuyerRegistration = req.body;

      // Verify reCAPTCHA token (required for security)
      if (!data.recaptchaToken) {
        res.status(400).json({
          error: 'reCAPTCHA verification is required. Please complete the "I\'m not a robot" challenge.',
        });
        return;
      }

      // Get IP and User Agent
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const isValid = await verifyRecaptchaEnhanced(
        data.recaptchaToken,
        ipAddress,
        userAgent,
        '/api/auth/register/buyer',
        config.recaptchaVersion,
        config.recaptchaMinScore
      );

      if (!isValid) {
        // SOFT FAIL: Log error but allow registration to proceed to avoid blocking legitimate users
        console.warn('⚠️ reCAPTCHA verification failed for buyer registration (Allowed):', data.email);
        // res.status(400).json({
        //   error: 'reCAPTCHA verification failed. Please try again.',
        // });
        // return;
      }

      // Register buyer
      const buyer = await AuthService.registerBuyer(data, ipAddress, userAgent);

      res.status(201).json({
        message: 'Buyer registered successfully',
        data: buyer,
      });
    } catch (error: any) {
      console.error('Error in registerBuyer:', error);
      res.status(400).json({
        error: error.message || 'Failed to register buyer',
      });
    }
  }

  /**
   * Register a new association officer
   * POST /api/auth/register/officer
   */
  static async registerOfficer(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const data: OfficerRegistration = req.body;

      // Get IP and User Agent
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      // Check if this is an admin-created account (authenticated user)
      const authenticatedUser = (req as any).user;
      const isAdminCreated = authenticatedUser && authenticatedUser.userType === 'officer';

      // CAPTCHA is only required for public registration (which is now disabled)
      // Admin-created accounts skip CAPTCHA verification
      if (!isAdminCreated && data.recaptchaToken) {
        const isValid = await verifyRecaptchaEnhanced(
          data.recaptchaToken,
          ipAddress,
          userAgent,
          '/api/auth/register/officer',
          config.recaptchaVersion,
          config.recaptchaMinScore
        );

        if (!isValid) {
          // SOFT FAIL: Log error but allow registration to proceed to avoid blocking legitimate users
          console.warn('⚠️ reCAPTCHA verification failed for officer registration (Allowed):', data.email);
          // res.status(400).json({
          //   error: 'reCAPTCHA verification failed. Please try again.',
          // });
          // return;
        }
      }

      // Register association officer (self-registration, requires admin verification)
      const officer = await AuthService.registerAssociationOfficer(
        data,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        message: isAdminCreated
          ? 'Officer account created successfully by admin'
          : 'Association officer registered successfully',
        data: officer,
      });
    } catch (error: any) {
      console.error('Error in registerOfficer:', error);
      res.status(400).json({
        error: error.message || 'Failed to register officer',
      });
    }
  }

  /**
   * Login user (farmer, buyer, or officer)
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const loginData: LoginRequest = req.body;

      // Get IP and User Agent
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      // Verify reCAPTCHA token (optional in development)
      if (loginData.recaptchaToken && config.recaptchaSecretKey) {
        try {
          const isValid = await verifyRecaptchaEnhanced(
            loginData.recaptchaToken,
            ipAddress,
            userAgent,
            '/api/auth/login',
            config.recaptchaVersion,
            config.recaptchaMinScore
          );

          if (!isValid) {
            // Silent in development - don't spam console
          }
        } catch (error) {
          // Silent in development
        }
      } else {
        // reCAPTCHA not configured - silent in development
      }

      // Login user
      const result = await AuthService.login(loginData, ipAddress, userAgent);

      res.status(200).json({
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      console.error('Error in login:', error);
      res.status(401).json({
        error: error.message || 'Login failed',
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken, recaptchaToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Verify CAPTCHA for refresh token
      if (!recaptchaToken) {
        res.status(400).json({ error: 'CAPTCHA verification is required' });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const isValid = await verifyRecaptchaEnhanced(
        recaptchaToken,
        ipAddress,
        userAgent,
        '/api/auth/refresh',
        config.recaptchaVersion,
        config.recaptchaMinScore
      );

      if (!isValid) {
        res.status(400).json({ error: 'CAPTCHA verification failed' });
        return;
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error: any) {
      console.error('Error in refreshToken:', error);
      res.status(401).json({
        error: error.message || 'Failed to refresh token',
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { userId, userType } = req.body;

      if (!userId || !userType) {
        res.status(400).json({ error: 'User ID and type are required' });
        return;
      }

      // Verify user can only logout themselves
      const authenticatedUser = (req as any).user;
      if (authenticatedUser && authenticatedUser.userId !== userId) {
        res.status(403).json({
          error: 'You can only logout your own account'
        });
        return;
      }

      await AuthService.logout(userId, userType);

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error: any) {
      console.error('Error in logout:', error);
      res.status(400).json({
        error: error.message || 'Logout failed',
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // This would be called after authentication middleware
      // The user info would be attached to req by the middleware
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.substring(7);
      const payload = AuthService.verifyToken(token);

      if (!payload) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      // Fetch fresh data from database based on user type
      if (payload.userType === 'officer') {
        const { data: officer, error } = await supabase
          .from('organization')
          .select('*')
          .eq('officer_id', payload.userId)
          .single();

        if (error) {
          console.error('Error fetching officer data:', error);
          res.status(500).json({ error: 'Failed to fetch officer data' });
          return;
        }

        console.log('📊 Raw officer data from database:', {
          contact_number: officer.contact_number,
          address: officer.address,
          position: officer.position,
          association_name: officer.association_name
        });

        // Return fresh officer data from database
        res.status(200).json({
          officer_id: officer.officer_id,
          full_name: officer.full_name,
          email: officer.email,
          position: officer.position,
          association_name: officer.association_name,
          contact_number: officer.contact_number,
          address: officer.address,
          term_start_date: officer.term_start_date,
          term_end_date: officer.term_end_date,
          term_duration: officer.term_duration,
          farmers_under_supervision: officer.farmers_under_supervision,
          profile_picture: officer.profile_picture,
          profile_completed: officer.profile_completed,
          profile_completed_at: officer.profile_completed_at,
          is_super_admin: officer.is_super_admin,
          is_active: officer.is_active,
          is_verified: officer.is_verified,
          created_at: officer.created_at,
          updated_at: officer.updated_at,
          last_login: officer.last_login,
        });
      } else if (payload.userType === 'association_officer') {
        const { data: officer, error } = await supabase
          .from('association_officers')
          .select('*')
          .eq('officer_id', payload.userId)
          .single();

        if (error) {
          console.error('Error fetching association officer data:', error);
          res.status(500).json({ error: 'Failed to fetch association officer data' });
          return;
        }

        // Return fresh association officer data from database
        res.status(200).json(officer);
      } else if (payload.userType === 'farmer') {
        const { data: farmer, error } = await supabase
          .from('farmers')
          .select('*')
          .eq('farmer_id', payload.userId)
          .single();

        if (error) {
          console.error('Error fetching farmer data:', error);
          res.status(500).json({ error: 'Failed to fetch farmer data' });
          return;
        }

        res.status(200).json(farmer);
      } else if (payload.userType === 'buyer') {
        const { data: buyer, error } = await supabase
          .from('buyers')
          .select('*')
          .eq('buyer_id', payload.userId)
          .single();

        if (error) {
          console.error('Error fetching buyer data:', error);
          res.status(500).json({ error: 'Failed to fetch buyer data' });
          return;
        }

        res.status(200).json(buyer);
      } else {
        // Fallback to JWT payload if user type is unknown
        res.status(200).json({
          message: 'User authenticated',
          data: payload,
        });
      }
    } catch (error: any) {
      console.error('Error in getCurrentUser:', error);
      res.status(401).json({
        error: error.message || 'Authentication failed',
      });
    }
  }

  /**
   * Create officer account (Admin only)
   * POST /api/mao/create-officer
   */
  static async createOfficerAccount(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { fullName, email, password, profilePicture, isSuperAdmin } = req.body;

      // Create officer data
      const officerData = {
        fullName,
        email,
        password,
        profilePicture: profilePicture || null,
        isSuperAdmin: isSuperAdmin || false, // Default to false if not specified
      };

      // Register officer
      const result = await AuthService.registerOfficer(
        officerData,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(201).json({
        message: 'Officer account created successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to create officer account',
      });
    }
  }

  /**
   * Reset password for a user (temporary fix for association officers)
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        res.status(400).json({ error: 'Email and new password are required' });
        return;
      }

      // Hash the new password
      const passwordHash = await AuthService.hashPasswordPublic(newPassword);

      // Update the password for the association officer
      const { error } = await supabase
        .from('association_officers')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
        return;
      }

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
  }
}
