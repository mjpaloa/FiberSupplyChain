// services/AuthService.ts - Authentication service with bcrypt and JWT
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { config } from '../config/env';
import {
  UserType,
  JWTPayload,
  AuthTokens,
  FarmerRegistration,
  BuyerRegistration,
  OfficerRegistration,
  Farmer,
  Buyer,
  AssociationOfficer,
  LoginRequest,
  LoginResponse,
} from '../types';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Hash a password (public method for password reset)
   */
  static async hashPasswordPublic(password: string): Promise<string> {
    return this.hashPassword(password);
  }

  /**
   * Compare password with hash
   */
  public static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private static generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(
      payload as object,
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      payload as object,
      config.jwtSecret,
      { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Log authentication event to audit log
   */
  private static async logAuthEvent(
    userId: string | null,
    userType: UserType | null,
    action: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase.from('auth_audit_log').insert({
        user_id: userId,
        user_type: userType,
        action,
        success,
        ip_address: ipAddress,
        user_agent: userAgent,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }

  /**
   * Register a new farmer
   */
  static async registerFarmer(
    data: FarmerRegistration,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Farmer> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('farmers')
        .select('farmer_id, verification_status, is_verified')
        .eq('email', data.email)
        .single();

      if (existing) {
        // If user was rejected, delete the old record to allow re-registration
        if (existing.verification_status === 'rejected' || existing.is_verified === false) {
          console.log(`🔄 Allowing re-registration for rejected farmer: ${data.email}`);

          const { error: deleteError } = await supabase
            .from('farmers')
            .delete()
            .eq('farmer_id', existing.farmer_id);

          if (deleteError) {
            console.error('❌ Error deleting rejected farmer record:', deleteError);
            throw new Error('Failed to process re-registration');
          }

          await this.logAuthEvent(
            null,
            'farmer',
            'register',
            true,
            ipAddress,
            userAgent,
            'Deleted rejected farmer record for re-registration'
          );
        } else {
          // User exists and is not rejected
          await this.logAuthEvent(
            null,
            'farmer',
            'register',
            false,
            ipAddress,
            userAgent,
            'Email already exists'
          );
          throw new Error('Email already registered');
        }
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert farmer
      const { data: farmer, error } = await supabase
        .from('farmers')
        .insert({
          full_name: data.fullName,
          sex: data.sex || null,
          age: data.age || null,
          birthday: data.birthday || null,
          civil_status: data.civilStatus || null,
          contact_number: data.contactNumber || null,
          address: data.address || null,
          barangay: data.barangay || null,
          municipality: data.municipality || null,
          association_name: data.associationName || null,
          farm_location: data.farmLocation || null,
          farm_coordinates: data.farmCoordinates || null,
          farm_area_hectares: data.farmAreaHectares || null,
          years_in_farming: data.yearsInFarming || null,
          type_of_abaca_planted: data.typeOfAbacaPlanted || null,
          average_harvest_volume_kg: data.averageHarvestVolumeKg || null,
          harvest_frequency_weeks: data.harvestFrequencyWeeks || null,
          selling_price_range_min: data.sellingPriceRangeMin || null,
          selling_price_range_max: data.sellingPriceRangeMax || null,
          regular_buyer: data.regularBuyer || null,
          income_per_cycle: data.incomePerCycle || null,
          email: data.email,
          password_hash: passwordHash,
          profile_photo: data.profilePhoto || null,
          valid_id_photo: data.validIdPhoto || null,
          verification_status: 'pending', // Default to pending
          is_verified: false, // Not verified until admin approves
          remarks: data.remarks || null,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAuthEvent(
        farmer.farmer_id,
        'farmer',
        'register',
        true,
        ipAddress,
        userAgent
      );

      return this.mapFarmerFromDB(farmer);
    } catch (error) {
      console.error('Error registering farmer:', error);
      throw error;
    }
  }

  /**
   * Register a new buyer
   */
  static async registerBuyer(
    data: BuyerRegistration,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Buyer> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('buyers')
        .select('buyer_id, verification_status, is_verified')
        .eq('email', data.email)
        .single();

      if (existing) {
        // If user was rejected, delete the old record to allow re-registration
        if (existing.verification_status === 'rejected' || existing.is_verified === false) {
          console.log(`🔄 Allowing re-registration for rejected buyer: ${data.email}`);

          const { error: deleteError } = await supabase
            .from('buyers')
            .delete()
            .eq('buyer_id', existing.buyer_id);

          if (deleteError) {
            console.error('❌ Error deleting rejected buyer record:', deleteError);
            throw new Error('Failed to process re-registration');
          }

          await this.logAuthEvent(
            null,
            'buyer',
            'register',
            true,
            ipAddress,
            userAgent,
            'Deleted rejected buyer record for re-registration'
          );
        } else {
          // User exists and is not rejected
          await this.logAuthEvent(
            null,
            'buyer',
            'register',
            false,
            ipAddress,
            userAgent,
            'Email already exists'
          );
          throw new Error('Email already registered');
        }
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert buyer
      const { data: buyer, error } = await supabase
        .from('buyers')
        .insert({
          business_name: data.businessName,
          owner_name: data.ownerName,
          business_address: data.businessAddress,
          contact_number: data.contactNumber,
          email: data.email,
          license_or_accreditation: data.licenseOrAccreditation,
          buying_schedule: data.buyingSchedule,
          buying_location: data.buyingLocation,
          warehouse_address: data.warehouseAddress,
          accepted_quality_grades: data.acceptedQualityGrades,
          price_range_min: data.priceRangeMin,
          price_range_max: data.priceRangeMax,
          payment_terms: data.paymentTerms,
          partnered_associations: data.partneredAssociations,
          password_hash: passwordHash,
          profile_photo: data.profilePhoto || null,
          valid_id_photo: data.validIdPhoto || null,
          business_permit_photo: data.businessPermitPhoto || null,
          verification_status: 'pending', // Default to pending
          is_verified: false, // Not verified until admin approves
          remarks: data.remarks,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAuthEvent(
        buyer.buyer_id,
        'buyer',
        'register',
        true,
        ipAddress,
        userAgent
      );

      return this.mapBuyerFromDB(buyer);
    } catch (error) {
      console.error('Error registering buyer:', error);
      throw error;
    }
  }

  /**
   * Register a new association officer (self-registration)
   */
  static async registerAssociationOfficer(
    data: OfficerRegistration,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AssociationOfficer> {
    try {
      // Check if email already exists in association_officers table
      const { data: existingAssoc } = await supabase
        .from('association_officers')
        .select('officer_id, verification_status, is_verified')
        .eq('email', data.email)
        .single();

      if (existingAssoc) {
        // If user was rejected, delete the old record to allow re-registration
        if (existingAssoc.verification_status === 'rejected' || existingAssoc.is_verified === false) {
          console.log(`🔄 Allowing re-registration for rejected officer: ${data.email}`);

          const { error: deleteError } = await supabase
            .from('association_officers')
            .delete()
            .eq('officer_id', existingAssoc.officer_id);

          if (deleteError) {
            console.error('❌ Error deleting rejected officer record:', deleteError);
            throw new Error('Failed to process re-registration');
          }

          await this.logAuthEvent(
            null,
            'association_officer',
            'register',
            true,
            ipAddress,
            userAgent,
            'Deleted rejected officer record for re-registration'
          );
        } else {
          // User exists and is not rejected
          await this.logAuthEvent(
            null,
            'association_officer',
            'register',
            false,
            ipAddress,
            userAgent,
            'Email already exists in association officers'
          );
          throw new Error('Email already registered as association officer');
        }
      }

      // Also check organization table to prevent conflicts
      const { data: existingOrg } = await supabase
        .from('organization')
        .select('officer_id')
        .eq('email', data.email)
        .single();

      if (existingOrg) {
        await this.logAuthEvent(
          null,
          'association_officer',
          'register',
          false,
          ipAddress,
          userAgent,
          'Email already exists in organization'
        );
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert into association_officers table
      console.log('📝 Inserting association officer into database:', {
        email: data.email,
        fullName: data.fullName,
        associationName: (data as any).associationName
      });

      const { data: officer, error } = await supabase
        .from('association_officers')
        .insert({
          full_name: data.fullName,
          email: data.email,
          password_hash: passwordHash,
          position: data.position || null,
          association_name: (data as any).associationName || null,
          contact_number: data.contactNumber || null,
          address: data.address || null,
          term_start_date: (data as any).termStartDate || null,
          term_end_date: (data as any).termEndDate || null,
          term_duration: (data as any).termDuration || null,
          farmers_under_supervision: (data as any).farmersUnderSupervision || 0,
          profile_picture: data.profilePhoto || null,
          valid_id_photo: data.validIdPhoto || null,
          is_active: true,
          is_verified: false, // Requires admin verification
          verification_status: 'pending',
          remarks: data.remarks || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting association officer:', error);
        throw error;
      }

      console.log('✅ Association officer inserted successfully:', officer.officer_id);

      await this.logAuthEvent(
        officer.officer_id,
        'association_officer',
        'register',
        true,
        ipAddress,
        userAgent
      );

      // Map to return format
      return {
        officerId: officer.officer_id,
        fullName: officer.full_name,
        email: officer.email,
        position: officer.position,
        associationName: officer.association_name,
        contactNumber: officer.contact_number,
        address: officer.address,
        isActive: officer.is_active,
        isVerified: officer.is_verified,
        verificationStatus: officer.verification_status,
        createdAt: officer.created_at,
        updatedAt: officer.updated_at,
      } as AssociationOfficer;
    } catch (error) {
      console.error('Error registering association officer:', error);
      throw error;
    }
  }

  /**
   * Register a new MAO officer (admin-created)
   */
  static async registerOfficer(
    data: OfficerRegistration,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AssociationOfficer> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('organization')
        .select('officer_id')
        .eq('email', data.email)
        .single();

      if (existing) {
        await this.logAuthEvent(
          null,
          'officer',
          'register',
          false,
          ipAddress,
          userAgent,
          'Email already exists'
        );
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Insert officer
      // Officers created by admin: only basic info (email, password, name, optional profile picture)
      // Full profile will be completed on first login
      // If isSuperAdmin flag is set, mark profile as completed and set super admin privileges
      const isSuperAdmin = data.isSuperAdmin === true;

      // Determine if this is a public registration (has position, officeName, etc.)
      const isPublicRegistration = data.position && data.officeName;

      const { data: officer, error } = await supabase
        .from('organization')
        .insert({
          full_name: data.fullName,
          email: data.email,
          password_hash: passwordHash,
          profile_picture: data.profilePhoto || data.profilePicture || null,
          is_super_admin: isSuperAdmin,
          // Profile fields - set for public registration or super admin
          position: data.position || (isSuperAdmin ? 'System Administrator' : null),
          office_name: data.officeName || (isSuperAdmin ? 'Municipal Agriculture Office, Culiram' : null),
          assigned_municipality: data.assignedMunicipality || (isSuperAdmin ? 'Prosperidad' : null),
          assigned_barangay: data.assignedBarangay || (isSuperAdmin ? 'All Barangays' : null),
          contact_number: data.contactNumber || null,
          address: data.address || null,
          profile_completed: isSuperAdmin ? true : isPublicRegistration,
          is_active: true,
          // Verification status: pending for public registration, verified for admin-created
          verification_status: isPublicRegistration ? 'pending' : 'verified',
          is_verified: isPublicRegistration ? false : true,
        })
        .select()
        .single();

      if (error) throw error;

      await this.logAuthEvent(
        officer.officer_id,
        'officer',
        'register',
        true,
        ipAddress,
        userAgent
      );

      return this.mapOfficerFromDB(officer);
    } catch (error) {
      console.error('Error registering officer:', error);
      throw error;
    }
  }

  /**
   * Login user (farmer, buyer, or officer)
   */
  static async login(
    loginData: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    try {
      const { email, password, userType } = loginData;

      let user: any;
      let userId: string;
      let tableName: string;
      let idField: string;

      // Determine table and ID field based on user type
      switch (userType) {
        case 'farmer':
          tableName = 'farmers';
          idField = 'farmer_id';
          break;
        case 'buyer':
          tableName = 'buyers';
          idField = 'buyer_id';
          break;
        case 'officer':
          tableName = 'organization';
          idField = 'officer_id';
          break;
        case 'association_officer':
          tableName = 'association_officers';
          idField = 'officer_id';
          break;
        default:
          throw new Error('Invalid user type');
      }

      // Fetch user from database
      console.log(`🔍 Looking for ${userType} with email ${email} in table ${tableName}`);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        console.log(`❌ User not found in ${tableName}:`, error);
        await this.logAuthEvent(
          null,
          userType,
          'login',
          false,
          ipAddress,
          userAgent,
          'User not found'
        );
        throw new Error('Invalid email or password');
      }

      console.log(`✅ Found user in ${tableName}:`, { email: data.email, is_active: data.is_active, is_verified: data.is_verified });

      user = data;
      userId = user[idField];

      // Check if user is active
      if (!user.is_active) {
        await this.logAuthEvent(
          userId,
          userType,
          'login',
          false,
          ipAddress,
          userAgent,
          'Account is inactive'
        );

        // If account has rejection reason, show it to the user
        if (user.rejection_reason) {
          throw new Error(
            `Your account application was rejected. Reason: ${user.rejection_reason}\n\n` +
            `Please contact support@mao.gov.ph for assistance.`
          );
        } else {
          throw new Error('Your account is inactive. Please contact support@mao.gov.ph for assistance.');
        }
      }

      // Check if user is verified (farmers, buyers, and officers need verification)
      // Association officers also need verification now
      // Enhanced verification check to ensure both fields are consistent
      const isVerified = user.is_verified === true;
      const verificationStatus = user.verification_status || 'pending';

      // If either field indicates the user is not verified, deny login
      if (!isVerified || verificationStatus !== 'verified') {
        await this.logAuthEvent(
          userId,
          userType,
          'login',
          false,
          ipAddress,
          userAgent,
          'Account not verified'
        );

        // Provide specific error message based on verification status
        if (verificationStatus === 'rejected') {
          const reason = user.rejection_reason || 'Your application did not meet our requirements.';
          throw new Error(
            `Your account application was rejected. Reason: ${reason}\n\n` +
            `Please contact support@mao.gov.ph for assistance.`
          );
        } else {
          throw new Error(
            'Your account is pending verification. Please wait for admin approval before logging in.'
          );
        }
      }

      // Verify password
      console.log(`🔐 Verifying password for ${email}...`);
      const isPasswordValid = await this.comparePassword(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        console.log(`❌ Invalid password for ${email}`);
        await this.logAuthEvent(
          userId,
          userType,
          'login',
          false,
          ipAddress,
          userAgent,
          'Invalid password'
        );
        throw new Error('Invalid email or password');
      }

      console.log(`✅ Password verified for ${email}`);

      // Generate tokens (include isSuperAdmin for officers)
      console.log(`🎫 Generating tokens for ${userType} with userId: ${userId}`);
      const tokens = this.generateTokens({
        userId,
        userType,
        email: user.email,
        isSuperAdmin: userType === 'officer' ? user.is_super_admin : undefined,
      });
      console.log(`✅ Tokens generated successfully for ${email}`);

      // Update last login
      await supabase
        .from(tableName)
        .update({ last_login: new Date().toISOString() })
        .eq(idField, userId);

      // Store refresh token
      await supabase.from('refresh_tokens').insert({
        user_id: userId,
        user_type: userType,
        token_hash: await this.hashPassword(tokens.refreshToken),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
      });

      await this.logAuthEvent(
        userId,
        userType,
        'login',
        true,
        ipAddress,
        userAgent
      );

      // Map user data based on type
      console.log(`🗺️ Mapping user data for ${userType}:`, { userId, email: user.email });
      let mappedUser: Farmer | Buyer | AssociationOfficer;
      switch (userType) {
        case 'farmer':
          mappedUser = this.mapFarmerFromDB(user);
          break;
        case 'buyer':
          mappedUser = this.mapBuyerFromDB(user);
          break;
        case 'officer':
          mappedUser = this.mapOfficerFromDB(user);
          break;
        case 'association_officer':
          console.log(`📋 Mapping association officer data:`, user);
          mappedUser = this.mapAssociationOfficerFromDB(user);
          console.log(`✅ Mapped association officer:`, mappedUser);
          break;
        default:
          throw new Error('Invalid user type for mapping');
      }

      return {
        user: mappedUser,
        tokens,
      };
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.verifyToken(refreshToken);
      if (!payload) {
        throw new Error('Invalid refresh token');
      }

      // Verify refresh token exists in database
      const { data: tokenData } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('user_id', payload.userId)
        .eq('user_type', payload.userType)
        .eq('revoked', false)
        .single();

      if (!tokenData) {
        throw new Error('Refresh token not found or revoked');
      }

      // Generate new tokens
      const newTokens = this.generateTokens(payload);

      // Update refresh token in database
      await supabase
        .from('refresh_tokens')
        .update({
          token_hash: await this.hashPassword(newTokens.refreshToken),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('token_id', tokenData.token_id);

      return newTokens;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  static async logout(userId: string, userType: UserType): Promise<void> {
    try {
      await supabase
        .from('refresh_tokens')
        .update({ revoked: true })
        .eq('user_id', userId)
        .eq('user_type', userType);

      await this.logAuthEvent(userId, userType, 'logout', true);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Map database farmer to Farmer type
   */
  private static mapFarmerFromDB(data: any): Farmer {
    return {
      farmerId: data.farmer_id,
      fullName: data.full_name,
      sex: data.sex,
      age: data.age,
      contactNumber: data.contact_number,
      address: data.address,
      barangay: data.barangay,
      municipality: data.municipality,
      associationName: data.association_name,
      farmLocation: data.farm_location,
      farmCoordinates: data.farm_coordinates,
      farmAreaHectares: data.farm_area_hectares,
      yearsInFarming: data.years_in_farming,
      typeOfAbacaPlanted: data.type_of_abaca_planted,
      averageHarvestVolumeKg: data.average_harvest_volume_kg,
      harvestFrequencyWeeks: data.harvest_frequency_weeks,
      sellingPriceRangeMin: data.selling_price_range_min,
      sellingPriceRangeMax: data.selling_price_range_max,
      regularBuyer: data.regular_buyer,
      incomePerCycle: data.income_per_cycle,
      email: data.email,
      profilePhoto: data.profile_photo,
      validIdPhoto: data.valid_id_photo,
      verificationStatus: data.verification_status,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      rejectionReason: data.rejection_reason,
      remarks: data.remarks,
      isActive: data.is_active,
      isVerified: data.is_verified,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  }

  /**
   * Map database buyer to Buyer type
   */
  private static mapBuyerFromDB(data: any): Buyer {
    return {
      buyerId: data.buyer_id,
      businessName: data.business_name,
      ownerName: data.owner_name,
      businessAddress: data.business_address,
      contactNumber: data.contact_number,
      email: data.email,
      licenseOrAccreditation: data.license_or_accreditation,
      buyingSchedule: data.buying_schedule,
      buyingLocation: data.buying_location,
      warehouseAddress: data.warehouse_address,
      acceptedQualityGrades: data.accepted_quality_grades,
      priceRangeMin: data.price_range_min,
      priceRangeMax: data.price_range_max,
      paymentTerms: data.payment_terms,
      partneredAssociations: data.partnered_associations,
      profilePhoto: data.profile_photo || data.profile_picture,
      profilePicture: data.profile_picture || data.profile_photo,
      validIdPhoto: data.valid_id_photo,
      businessPermitPhoto: data.business_permit_photo,
      verificationStatus: data.verification_status,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      rejectionReason: data.rejection_reason,
      remarks: data.remarks,
      isActive: data.is_active,
      isVerified: data.is_verified,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  }

  /**
   * Map association officer data from database format to frontend format
   */
  private static mapAssociationOfficerFromDB(data: any): AssociationOfficer {
    return {
      officerId: data.officer_id,
      fullName: data.full_name,
      position: data.position,
      associationName: data.association_name,
      contactNumber: data.contact_number,
      email: data.email,
      address: data.address,
      remarks: data.remarks,
      isActive: data.is_active,
      isVerified: data.is_verified,
      verificationStatus: data.verification_status,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  }

  /**
   * Map MAO officer data from database format to frontend format
   */
  private static mapOfficerFromDB(data: any): AssociationOfficer {
    return {
      officerId: data.officer_id,
      fullName: data.full_name,
      position: data.position,
      officeName: data.office_name,
      assignedMunicipality: data.assigned_municipality,
      assignedBarangay: data.assigned_barangay,
      contactNumber: data.contact_number,
      email: data.email,
      address: data.address,
      remarks: data.remarks,
      isActive: data.is_active,
      isVerified: data.is_verified,
      isSuperAdmin: data.is_super_admin || false, // Super Admin flag
      profileCompleted: data.profile_completed || false, // Add profile completion status
      verificationStatus: data.verification_status,
      verifiedBy: data.verified_by,
      verifiedAt: data.verified_at,
      rejectionReason: data.rejection_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  }
}
