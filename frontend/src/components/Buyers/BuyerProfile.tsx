import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../utils/apiClient';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Edit2, 
  Save, 
  X,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Key,
  Camera
} from 'lucide-react';
import { EditorialCard, StatusPill, EditorialCallout } from '../Shared/EditorialUI';

interface BuyerInfo {
  buyer_id: string;
  business_name: string;
  owner_name: string;
  email: string;
  contact_number: string;
  business_address: string;
  municipality?: string;
  barangay?: string;
  license_or_accreditation?: string;
  buying_schedule?: string;
  buying_location?: string;
  warehouse_address?: string;
  accepted_quality_grades?: string[];
  price_range_min?: number;
  price_range_max?: number;
  payment_terms?: string;
  partnered_associations?: string[];
  profile_photo?: string;
  business_permit_photo?: string;
  valid_id_photo?: string;
  verification_status?: string;
  is_verified?: boolean;
  remarks?: string;
  created_at: string;
}

interface PriceInfo {
  quality: string;
  price_per_kg: number;
  minimum_order: number;
  availability: string;
}

const BuyerProfile: React.FC = () => {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    buyer_id: '',
    business_name: '',
    owner_name: '',
    email: '',
    contact_number: '',
    business_address: '',
    created_at: new Date().toISOString()
  });
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceInfo[]>([
    { quality: 'Class A (Premium)', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Class B (High Quality)', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Medium Grade', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Low Grade', price_per_kg: 0, minimum_order: 0, availability: 'Available' }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  const fetchBuyerProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('📥 Fetching profile for user:', user);
      
      const response = await apiGet('/api/buyers/profile');
      
      if (response.ok) {
        const data = await response.json();
        const buyer = data.buyer;
        console.log('✅ Profile data loaded from buyers table:', buyer);
        
        // Map ALL fields from buyers table
        setBuyerInfo({
          buyer_id: buyer.buyer_id || '',
          business_name: buyer.business_name || '',
          owner_name: buyer.owner_name || '',
          email: buyer.email || '',
          contact_number: buyer.contact_number || '',
          business_address: buyer.business_address || '',
          municipality: buyer.municipality,
          barangay: buyer.barangay,
          license_or_accreditation: buyer.license_or_accreditation,
          buying_schedule: buyer.buying_schedule,
          buying_location: buyer.buying_location,
          warehouse_address: buyer.warehouse_address,
          accepted_quality_grades: buyer.accepted_quality_grades || [],
          price_range_min: buyer.price_range_min,
          price_range_max: buyer.price_range_max,
          payment_terms: buyer.payment_terms,
          partnered_associations: buyer.partnered_associations || [],
          profile_photo: buyer.profile_photo,
          business_permit_photo: buyer.business_permit_photo,
          valid_id_photo: buyer.valid_id_photo,
          verification_status: buyer.verification_status,
          is_verified: buyer.is_verified,
          remarks: buyer.remarks,
          created_at: buyer.created_at || new Date().toISOString()
        });
        setProfilePicture(buyer.profile_photo || null);
        
        // Load pricing data from buyer_prices table
        if (data.prices && data.prices.length > 0) {
          console.log('✅ Pricing data loaded:', data.prices);
          const priceMap: any = {};
          data.prices.forEach((p: any) => {
            priceMap[p.quality] = p;
          });
          
          // Update prices array with database values
          setPrices([
            {
              quality: 'Class A (Premium)',
              price_per_kg: priceMap['Class A (Premium)']?.price_per_kg || 0,
              minimum_order: priceMap['Class A (Premium)']?.minimum_order || 0,
              availability: priceMap['Class A (Premium)']?.availability || 'Available'
            },
            {
              quality: 'Class B (High Quality)',
              price_per_kg: priceMap['Class B (High Quality)']?.price_per_kg || 0,
              minimum_order: priceMap['Class B (High Quality)']?.minimum_order || 0,
              availability: priceMap['Class B (High Quality)']?.availability || 'Available'
            },
            {
              quality: 'Medium Grade',
              price_per_kg: priceMap['Medium Grade']?.price_per_kg || 0,
              minimum_order: priceMap['Medium Grade']?.minimum_order || 0,
              availability: priceMap['Medium Grade']?.availability || 'Available'
            },
            {
              quality: 'Low Grade',
              price_per_kg: priceMap['Low Grade']?.price_per_kg || 0,
              minimum_order: priceMap['Low Grade']?.minimum_order || 0,
              availability: priceMap['Low Grade']?.availability || 'Available'
            }
          ]);
        }
        setError(null);
      } else {
        const errorMsg = 'Unable to load profile from server. Using cached data.';
        setError(errorMsg);
        console.warn('⚠️', errorMsg);
        
        // Graceful fallback to localStorage
        setBuyerInfo({
          buyer_id: user.buyerId || user.buyer_id || '',
          business_name: user.businessName || '',
          owner_name: user.ownerName || '',
          email: user.email || '',
          contact_number: user.contactNumber || '',
          business_address: user.businessAddress || '',
          payment_terms: user.paymentTerms,
          partnered_associations: user.partneredAssociations || [],
          profile_photo: user.profilePhoto,
          created_at: user.createdAt || new Date().toISOString()
        });
        setProfilePicture(user.profilePhoto || null);
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to load profile. Please try refreshing the page.';
      setError(errorMsg);
      console.error('❌ Error fetching buyer profile:', error);
      
      // Graceful fallback - don't crash the app
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setBuyerInfo({
          buyer_id: user.buyerId || user.buyer_id || '',
          business_name: user.businessName || 'Not Available',
          owner_name: user.ownerName || 'Not Available',
          email: user.email || 'Not Available',
          contact_number: user.contactNumber || 'Not Available',
          business_address: user.businessAddress || 'Not Available',
          created_at: user.createdAt || new Date().toISOString()
        });
      } catch (fallbackError) {
        console.error('❌ Critical error: Unable to load any user data', fallbackError);
        setError('Unable to load profile data. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfilePicture(base64String);
        
        // Update profile with new photo
        const response = await apiPut('/api/buyers/update-profile', {
          buyerInfo: { ...buyerInfo, profile_picture: base64String },
          prices
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          throw new Error('Failed to upload photo');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Failed to upload photo. Please try again.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await apiPut('/api/buyers/update-profile', {
        buyerInfo,
        prices
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        setTimeout(() => {
          fetchBuyerProfile();
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (index: number, field: keyof PriceInfo, value: any) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPrices(newPrices);
  };

  const handlePasswordChange = async () => {
    setPasswordMessage(null);

    // Validation
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 4 characters long' });
      return;
    }

    setChangingPassword(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch('https://fibersupplychain.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email || buyerInfo?.email,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowPasswordSection(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Header Summary Card */}
      <EditorialCard>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                {buyerInfo?.business_name || 'Buyer Account'}
              </h2>
              <StatusPill tone="success">Verified</StatusPill>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage your company information and profile settings
            </p>
            {buyerInfo && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  Member since{' '}
                  {buyerInfo?.created_at
                    ? new Date(buyerInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex-1 sm:flex-initial"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-semibold text-sm flex-1 sm:flex-initial"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 flex-1 sm:flex-initial"
                >
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </EditorialCard>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl flex items-start gap-3 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Loading Issue</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-[#92400E] hover:opacity-75 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[#EAF6F0] text-[#047857] border-[#CBEAD9]'
            : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} className="flex-shrink-0" /> : <AlertCircle size={18} className="flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Security Settings Card */}
      <EditorialCard
        title="Security Settings"
        subtitle="Update your account password"
        actions={
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-semibold text-xs sm:text-sm"
          >
            <Key size={15} />
            <span>{showPasswordSection ? 'Hide' : 'Change Password'}</span>
          </button>
        }
      >
        {showPasswordSection ? (
          <div className="space-y-4">
            {passwordMessage && (
              <div className={`p-3.5 rounded-xl flex items-center gap-2.5 border text-sm font-medium ${
                passwordMessage.type === 'success'
                  ? 'bg-[#EAF6F0] text-[#047857] border-[#CBEAD9]'
                  : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordMessage(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <Key size={15} />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>

            <EditorialCallout tone="amber" title="Note:">
              Password must be at least 6 characters long. Make sure to store your new password securely.
            </EditorialCallout>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-gray-500">
            Keep your account protected by updating your password periodically.
          </p>
        )}
      </EditorialCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <EditorialCard
          title="Company Information"
          subtitle="Business details shared across the marketplace"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.business_name || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, business_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter company name"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <Building size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.business_name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Person</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.owner_name || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, owner_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter contact person"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.owner_name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={buyerInfo?.email || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter email"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium truncate">{buyerInfo?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={buyerInfo?.contact_number || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, contact_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="+63 912 345 6789"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.contact_number || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Complete Address</label>
              {isEditing ? (
                <textarea
                  value={buyerInfo?.business_address || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, business_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm resize-none"
                  rows={2}
                  placeholder="Enter complete address"
                />
              ) : (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.business_address || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Municipality */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Municipality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.municipality || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, municipality: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter municipality"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <span className="text-gray-900 font-medium">{buyerInfo?.municipality || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Barangay */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Barangay</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.barangay || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, barangay: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter barangay"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <span className="text-gray-900 font-medium">{buyerInfo?.barangay || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Business Permit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Business Permit No.</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.license_or_accreditation || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, license_or_accreditation: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
                  placeholder="Enter business permit number"
                />
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.license_or_accreditation || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Terms</label>
              {isEditing ? (
                <select
                  value={buyerInfo?.payment_terms || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, payment_terms: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                >
                  <option value="">Select payment terms</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                  <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.payment_terms || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Accepted Quality Grades */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Accepted Quality Grades</label>
              <div className="px-3.5 py-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl text-sm">
                <p className="text-gray-900 font-medium">
                  {buyerInfo?.accepted_quality_grades && buyerInfo.accepted_quality_grades.length > 0
                    ? buyerInfo.accepted_quality_grades.join(', ')
                    : 'All grades accepted'}
                </p>
              </div>
            </div>
          </div>
        </EditorialCard>

        {/* Quick Info & Profile Photo Card */}
        <EditorialCard className="h-fit">
          <div className="flex flex-col items-center pb-6 border-b border-gray-100">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#EAF6F0] text-[#047857]">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>

              <label
                htmlFor="profile-photo-upload"
                className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-7 h-7 text-white" />
                )}
              </label>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Click photo to upload profile picture</p>
          </div>

          <div className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Account Status</span>
              <StatusPill tone="success">Active & Verified</StatusPill>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Member Since</p>
              <p className="text-base font-bold text-gray-900">
                {buyerInfo?.created_at
                  ? new Date(buyerInfo.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Visibility</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your profile and pricing are visible to MAO, associations, and farmers.
              </p>
            </div>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
};

export default BuyerProfile;
