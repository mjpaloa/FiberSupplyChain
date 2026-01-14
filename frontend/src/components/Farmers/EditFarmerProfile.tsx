import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Building2, Upload, Camera, Save, X,
  Loader, Shield, CheckCircle, Tractor
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const PhilippinePeso = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 11H4" />
    <path d="M20 7H4" />
    <path d="M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v12a1 1 0 0 1 1 1h2a1 1 0 0 1 1-1V9" />
  </svg>
);

interface FarmerProfile {
  farmer_id: string; full_name: string; email: string; sex: string; age: number;
  contact_number: string; address: string; barangay: string; municipality: string;
  association_name: string; farm_location: string; farm_area_hectares: number;
  years_in_farming: number; type_of_abaca_planted: string; average_harvest_volume_kg: number;
  harvest_frequency_weeks: number; selling_price_range_min: number; selling_price_range_max: number;
  regular_buyer: string; income_per_cycle: number; profile_photo: string | null; valid_id_photo: string | null;
}

interface EditFarmerProfileProps { onBack: () => void; }

const EditFarmerProfile: React.FC<EditFarmerProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingID, setUploadingID] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '', sex: '', age: 0, contact_number: '', address: '', barangay: '', municipality: '',
    association_name: '', farm_location: '', farm_area_hectares: 0, years_in_farming: 0,
    type_of_abaca_planted: '', average_harvest_volume_kg: 0, harvest_frequency_weeks: 0,
    selling_price_range_min: 0, selling_price_range_max: 0, regular_buyer: '', income_per_cycle: 0
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const profileData = data.profile || data;
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '', sex: profileData.sex || '', age: profileData.age || 0,
          contact_number: profileData.contact_number || '', address: profileData.address || '',
          barangay: profileData.barangay || '', municipality: profileData.municipality || '',
          association_name: profileData.association_name || '', farm_location: profileData.farm_location || '',
          farm_area_hectares: profileData.farm_area_hectares || 0, years_in_farming: profileData.years_in_farming || 0,
          type_of_abaca_planted: profileData.type_of_abaca_planted || '',
          average_harvest_volume_kg: profileData.average_harvest_volume_kg || 0,
          harvest_frequency_weeks: profileData.harvest_frequency_weeks || 0,
          selling_price_range_min: profileData.selling_price_range_min || 0,
          selling_price_range_max: profileData.selling_price_range_max || 0,
          regular_buyer: profileData.regular_buyer || '', income_per_cycle: profileData.income_per_cycle || 0
        });
        setProfilePicturePreview(profileData.profile_photo);
        setIdPhotoPreview(profileData.valid_id_photo);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile');
    } finally { setLoading(false); }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMessage('error', 'Image must be less than 5MB'); return; }
    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('profile_picture', file);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/farmers/profile/upload-picture`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setProfilePicturePreview(data.profile_picture_url || data.profile_photo);
        showMessage('success', 'Profile picture updated successfully!');
      } else { showMessage('error', 'Failed to upload profile picture'); }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showMessage('error', 'Failed to upload profile picture');
    } finally { setUploadingPicture(false); }
  };

  const handleIDPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMessage('error', 'Image must be less than 5MB'); return; }
    setUploadingID(true);
    const formData = new FormData();
    formData.append('valid_id_photo', file);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/farmers/profile/upload-id`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setIdPhotoPreview(data.valid_id_photo_url || data.valid_id_photo);
        showMessage('success', 'Valid ID photo updated successfully!');
      } else { showMessage('error', 'Failed to upload ID photo'); }
    } catch (error) {
      console.error('Error uploading ID photo:', error);
      showMessage('error', 'Failed to upload ID photo');
    } finally { setUploadingID(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/farmers/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showMessage('success', 'Profile updated successfully!');
        setTimeout(() => onBack(), 2000);
      } else { showMessage('error', 'Failed to update profile'); }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Failed to update profile');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-3 sm:p-4 md:p-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </div>

        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <X className="w-5 h-5 flex-shrink-0" />}
            <p className="text-xs sm:text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">Update your information</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
            {/* Profile Picture */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> Profile Picture
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-emerald-200" />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-emerald-200">
                    {formData.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" disabled={uploadingPicture} />
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
                      {uploadingPicture ? (<><Loader className="w-4 h-4 animate-spin" /> Uploading...</>) : (<><Upload className="w-4 h-4" /> Upload New Picture</>)}
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="18" max="100"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> Contact Number</div>
                  </label>
                  <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</div>
                  </label>
                  <input type="email" value={profile?.email || ''} disabled
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" /> Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} required rows={2}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                  <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Municipality</label>
                  <input type="text" name="municipality" value={formData.municipality} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Association */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" /> Association
              </h3>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Association Name</label>
                <input type="text" name="association_name" value={formData.association_name} onChange={handleInputChange} required
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>

            {/* Farm Information */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tractor className="w-4 h-4 sm:w-5 sm:h-5" /> Farm Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Farm Location</label>
                  <textarea name="farm_location" value={formData.farm_location} onChange={handleInputChange} required rows={2}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Farm Area (hectares)</label>
                  <input type="number" name="farm_area_hectares" value={formData.farm_area_hectares} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Years in Farming</label>
                  <input type="number" name="years_in_farming" value={formData.years_in_farming} onChange={handleInputChange} required min="0"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Type of Abaca Planted</label>
                  <input type="text" name="type_of_abaca_planted" value={formData.type_of_abaca_planted} onChange={handleInputChange} required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Average Harvest (kg)</label>
                  <input type="number" name="average_harvest_volume_kg" value={formData.average_harvest_volume_kg} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Harvest Frequency (weeks)</label>
                  <input type="number" name="harvest_frequency_weeks" value={formData.harvest_frequency_weeks} onChange={handleInputChange} required min="0"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Sales Information */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5" /> Sales Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Min Price (₱/kg)</label>
                  <input type="number" name="selling_price_range_min" value={formData.selling_price_range_min} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Max Price (₱/kg)</label>
                  <input type="number" name="selling_price_range_max" value={formData.selling_price_range_max} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Regular Buyer</label>
                  <input type="text" name="regular_buyer" value={formData.regular_buyer} onChange={handleInputChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Income per Cycle (₱)</label>
                  <input type="number" name="income_per_cycle" value={formData.income_per_cycle} onChange={handleInputChange} required min="0" step="0.01"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Valid ID Upload */}
            <div className="p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> Valid ID Photo
              </h3>
              {idPhotoPreview && (
                <div className="mb-4">
                  <img src={idPhotoPreview} alt="Valid ID" className="max-w-full h-auto rounded-lg shadow-md" />
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleIDPhotoUpload} className="hidden" disabled={uploadingID} />
                <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
                  {uploadingID ? (<><Loader className="w-4 h-4 animate-spin" /> Uploading...</>) : (<><Upload className="w-4 h-4" /> {idPhotoPreview ? 'Change ID Photo' : 'Upload ID Photo'}</>)}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">Upload a clear photo of your valid ID</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button type="button" onClick={onBack}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? (<><Loader className="w-4 h-4 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4" /> Save Changes</>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFarmerProfile;
