import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../utils/apiClient';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Package, 
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
  Camera,
  Upload
} from 'lucide-react';

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
      const response = await fetch('https://easyabaca-api.vercel.app/api/auth/reset-password', {
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <Building className="w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Buyer Profile</h1>
              </div>
              <p className="text-blue-50 text-sm sm:text-base">Manage your company information and abaca fiber pricing</p>
              {buyerInfo && (
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg">
                    <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-medium">Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-lg">
                    <Calendar size={14} className="sm:w-4 sm:h-4" />
                    <span>Since {buyerInfo?.created_at ? new Date(buyerInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base flex-1 sm:flex-initial"
                >
                  <Edit2 size={18} className="sm:w-5 sm:h-5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold text-sm sm:text-base flex-1 sm:flex-initial"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-semibold disabled:opacity-50 shadow-lg text-sm sm:text-base flex-1 sm:flex-initial"
                  >
                    <Save size={18} className="sm:w-5 sm:h-5" />
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-lg animate-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200' : 'bg-red-100 text-red-800 border-2 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" /> : <AlertCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />}
          <span className="font-medium text-sm sm:text-base">{message.text}</span>
        </div>
      )}

      {/* Password Change Section */}
      <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl">
              <Lock className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Security Settings</h2>
              <p className="text-xs sm:text-sm text-gray-500">Update your password</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            <Key size={14} className="sm:w-4 sm:h-4" />
            {showPasswordSection ? 'Hide' : 'Change Password'}
          </button>
        </div>

        {showPasswordSection && (
          <div className="space-y-4">
            {/* Error Banner */}
      {error && (
        <div className="mb-4 sm:mb-6 p-4 rounded-xl flex items-start gap-3 bg-yellow-50 text-yellow-900 border-2 border-yellow-200">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-1">⚠️ Loading Issue</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 sm:mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium text-sm sm:text-base">{message.text}</span>
        </div>
      )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordMessage(null);
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {changingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>Note:</strong> Password must be at least 6 characters long. Make sure to remember your new password.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl">
              <Building className="text-white" size={20} />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.business_name || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, business_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Building size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.business_name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.owner_name || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, owner_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact person"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <User size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.owner_name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={buyerInfo?.email || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Mail size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={buyerInfo?.contact_number || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, contact_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+63 912 345 6789"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Phone size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.contact_number || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Complete Address</label>
              {isEditing ? (
                <textarea
                  value={buyerInfo?.business_address || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, business_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter complete address"
                />
              ) : (
                <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <MapPin size={18} className="text-gray-500 mt-1" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.business_address || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Municipality */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.municipality || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, municipality: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter municipality"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-900 font-medium">{buyerInfo?.municipality || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Barangay */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.barangay || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, barangay: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter barangay"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-900 font-medium">{buyerInfo?.barangay || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Business Permit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Permit No.</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.license_or_accreditation || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, license_or_accreditation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter business permit number"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <FileText size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.license_or_accreditation || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
              {isEditing ? (
                <select
                  value={buyerInfo?.payment_terms || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, payment_terms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payment terms</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Calendar size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.payment_terms || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Accepted Quality Grades</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <p className="text-gray-900 font-medium">
                  {buyerInfo?.accepted_quality_grades && buyerInfo.accepted_quality_grades.length > 0 
                    ? buyerInfo.accepted_quality_grades.join(', ')
                    : 'All grades accepted'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Card with Profile Picture */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-emerald-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white h-fit border-2 border-white/20">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-4 border-white/30 shadow-lg">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-emerald-400">
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Upload Button Overlay */}
              <label 
                htmlFor="profile-photo-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-8 h-8 text-white" />
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
            <p className="text-xs text-blue-100 mt-3 text-center">Click to upload profile picture</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-4 border-b border-white/20">
            <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
              <CheckCircle size={20} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">Verified Buyer</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Member Since</p>
              <p className="text-xl font-bold">
                {buyerInfo?.created_at ? new Date(buyerInfo.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-100 text-sm mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Active & Verified</span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-100 text-sm mb-2">Visibility</p>
              <p className="text-sm">Your profile and pricing are visible to MAO, associations, and farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl">
            <DollarSign className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Abaca Fiber Pricing</h2>
            <p className="text-gray-600 text-xs sm:text-sm">Set your buying prices for different fiber qualities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {prices.map((price, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-emerald-400 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{price.quality}</h3>
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="text-emerald-600" size={18} />
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {/* Price per KG */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per KG (₱)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={price.price_per_kg}
                      onChange={(e) => handlePriceChange(index, 'price_per_kg', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-emerald-50 rounded-xl">
                      <span className="text-2xl font-bold text-emerald-700">₱{price.price_per_kg.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Minimum Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order (KG)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={price.minimum_order}
                      onChange={(e) => handlePriceChange(index, 'minimum_order', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-900 font-medium">{price.minimum_order} kg</span>
                    </div>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                  {isEditing ? (
                    <select
                      value={price.availability}
                      onChange={(e) => handlePriceChange(index, 'availability', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Not Buying">Not Buying</option>
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        price.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                        price.availability === 'Limited' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {price.availability}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-blue-900 font-semibold mb-1">Important Note</p>
              <p className="text-blue-800 text-sm">
                Your pricing information will be visible to all farmers, associations, and MAO officers. 
                Keep your prices updated to ensure accurate transactions and maintain trust in the marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default BuyerProfile;
