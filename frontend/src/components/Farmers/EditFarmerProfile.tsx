import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Upload, Camera, Save, X,
  Loader, Shield
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { EditorialCard, EditorialCallout } from '../Shared/EditorialUI';

const PhilippinePeso = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <text
      x="12"
      y="12"
      dy="1"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="20"
      fontWeight="bold"
      fill="currentColor"
    >
      ₱
    </text>
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
  const [isIdModalOpen, setIdModalOpen] = useState(false);

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
      <EditorialCard>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent mb-3" />
          <p className="text-sm text-gray-600 font-medium">Loading profile...</p>
        </div>
      </EditorialCard>
    );
  }

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
      </div>

      {message && (
        <EditorialCallout tone={message.type === 'success' ? 'emerald' : 'rose'}>
          {message.text}
        </EditorialCallout>
      )}

      <EditorialCard title="Edit Profile" subtitle="Update your personal, location, and verification information">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#047857]" /> Profile Picture
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] text-[#047857] flex items-center justify-center text-3xl font-bold">
                  {formData.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    disabled={uploadingPicture}
                  />
                  <div className="px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
                    {uploadingPicture ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Upload New Picture
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="p-5 bg-gray-50/70 rounded-xl border border-gray-200">
            <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#047857]" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sex</label>
                <select name="sex" value={formData.sex} onChange={handleInputChange} required className={inputClass}>
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                  min="18"
                  max="100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-500" /> Contact Number
                  </span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" /> Email
                  </span>
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-5 bg-gray-50/70 rounded-xl border border-gray-200">
            <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#047857]" /> Location
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Purok, Barangay, Municipality"
              />
            </div>
          </div>

          {/* Valid ID Upload */}
          <div className="p-5 bg-gray-50/70 rounded-xl border border-gray-200 text-center">
            <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-[#047857]" /> Valid ID Photo
            </h3>
            {idPhotoPreview && (
              <div className="mb-4 flex justify-center">
                <img
                  src={idPhotoPreview}
                  alt="Valid ID"
                  className="max-w-full h-48 object-contain rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setIdModalOpen(true)}
                />
              </div>
            )}
            <label className="cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleIDPhotoUpload}
                className="hidden"
                disabled={uploadingID}
              />
              <div className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
                {uploadingID ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> {idPhotoPreview ? 'Change ID Photo' : 'Upload ID Photo'}
                  </>
                )}
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-2">Upload a clear photo of your valid ID</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100 justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </EditorialCard>

      {/* ID Modal */}
      {isIdModalOpen && idPhotoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 p-4"
          onClick={() => setIdModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIdModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-white/10 p-2 rounded-full"
            aria-label="Close ID preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={idPhotoPreview}
            alt="Valid ID Fullscreen"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default EditFarmerProfile;
