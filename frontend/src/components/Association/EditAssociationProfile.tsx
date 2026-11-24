import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Upload,
  Camera,
  Save,
  X,
  Loader,
  Shield
} from 'lucide-react';
import { EditorialCard, EditorialCallout } from '../Shared/EditorialUI';

interface AssociationOfficer {
  officer_id: string;
  full_name: string;
  email: string;
  position: string;
  association_name: string;
  contact_number: string;
  address: string;
  profile_picture: string | null;
  valid_id_photo: string | null;
}

interface EditAssociationProfileProps {
  onBack: () => void;
}

const EditAssociationProfile: React.FC<EditAssociationProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<AssociationOfficer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingID, setUploadingID] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    position: '',
    association_name: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          full_name: data.profile.full_name,
          contact_number: data.profile.contact_number,
          address: data.profile.address,
          position: data.profile.position,
          association_name: data.profile.association_name
        });
        setProfilePicturePreview(data.profile.profile_picture);
        setIdPhotoPreview(data.profile.valid_id_photo);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association/profile/upload-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePicturePreview(data.profile_picture_url);
        showMessage('success', 'Profile picture updated successfully!');
      } else {
        showMessage('error', 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showMessage('error', 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleIDPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be less than 5MB');
      return;
    }

    setUploadingID(true);
    const formData = new FormData();
    formData.append('valid_id_photo', file);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association/profile/upload-id', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setIdPhotoPreview(data.valid_id_photo_url);
        showMessage('success', 'Valid ID photo updated successfully!');
      } else {
        showMessage('error', 'Failed to upload ID photo');
      }
    } catch (error) {
      console.error('Error uploading ID photo:', error);
      showMessage('error', 'Failed to upload ID photo');
    } finally {
      setUploadingID(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showMessage('success', 'Profile updated successfully!');
        setTimeout(() => onBack(), 2000);
      } else {
        showMessage('error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
      </div>

      {message && (
        <EditorialCallout tone={message.type === 'success' ? 'emerald' : 'rose'}>
          {message.text}
        </EditorialCallout>
      )}

      <EditorialCard
        title="Edit Profile"
        subtitle="Update your officer details and association information"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="p-4 sm:p-5 bg-[#F8F9FA] rounded-xl border border-gray-200">
            <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#047857]" />
              Profile Picture
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
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
                  <span className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold inline-flex items-center gap-2">
                    {uploadingPicture ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload New Picture
                      </>
                    )}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Full Name
                </span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  Contact Number
                </span>
              </label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  Position
                </span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Association Name
                </span>
              </label>
              <input
                type="text"
                name="association_name"
                value={formData.association_name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Address
                </span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] resize-none"
              />
            </div>
          </div>

          {/* Valid ID Upload */}
          <div className="p-4 sm:p-5 bg-[#F8F9FA] rounded-xl border border-gray-200">
            <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#047857]" />
              Valid ID Photo
            </h3>
            {idPhotoPreview && (
              <div className="mb-4">
                <img
                  src={idPhotoPreview}
                  alt="Valid ID"
                  className="max-w-full max-h-64 h-auto rounded-lg border border-gray-200"
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
              <span className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs sm:text-sm font-semibold inline-flex items-center gap-2">
                {uploadingID ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {idPhotoPreview ? 'Change ID Photo' : 'Upload ID Photo'}
                  </>
                )}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2">Upload a clear photo of your valid ID</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm inline-flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </EditorialCard>
    </div>
  );
};

export default EditAssociationProfile;
