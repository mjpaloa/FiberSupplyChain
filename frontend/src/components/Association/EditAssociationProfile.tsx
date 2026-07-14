import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Upload,
  Camera,
  Save,
  X,
  Loader,
  Shield,
  CheckCircle
} from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Edit Profile Form */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">Update your information</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
            {/* Profile Picture Upload */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                Profile Picture
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                {profilePicturePreview ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-emerald-200"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold border-4 border-emerald-200">
                    {formData.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
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
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Full Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </div>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Number
                  </div>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Position
                  </div>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Association Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Association Name
                  </div>
                </label>
                <input
                  type="text"
                  name="association_name"
                  value={formData.association_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </div>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Valid ID Upload */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                Valid ID Photo
              </h3>
              {idPhotoPreview && (
                <div className="mb-4">
                  <img
                    src={idPhotoPreview}
                    alt="Valid ID"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIDPhotoUpload}
                  className="hidden"
                  disabled={uploadingID}
                />
                <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-xs sm:text-sm font-semibold flex items-center gap-2 justify-center">
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
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">Upload a clear photo of your valid ID</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </div>
  );
};

export default EditAssociationProfile;
