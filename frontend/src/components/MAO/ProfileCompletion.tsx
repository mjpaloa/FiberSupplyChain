import { API_BASE_URL } from '../../config/api';
import React, { useState } from 'react';
import { User, MapPin, Phone, Building2, Upload, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface ProfileCompletionProps {
  onComplete: () => void;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    position: '',
    officeName: '',
    assignedMunicipality: '',
    assignedBarangay: '',
    contactNumber: '',
    address: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 3;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setProfilePicture(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePicture(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit on step 3
    if (currentStep !== totalSteps) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      let profilePictureData = '';
      if (profilePicture) {
        const reader = new FileReader();
        profilePictureData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(profilePicture);
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/api/mao/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          profilePicture: profilePictureData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      const updatedUser = { ...user, profileCompleted: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('Profile completed successfully!');
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Work Information</h3>
            
            {/* Position */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-[#047857]" />
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="President, Vice President, Treasurer, etc."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors text-sm text-gray-900"
                required
              />
            </div>

            {/* Office Name */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-[#047857]" />
                Office Name
              </label>
              <input
                type="text"
                name="officeName"
                value={formData.officeName}
                onChange={handleChange}
                placeholder="e.g., Municipal Agriculture Office, Talacogon"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors text-sm text-gray-900"
                required
              />
            </div>

            {/* Assigned Municipality */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-[#047857]" />
                Assigned Municipality
              </label>
              <input
                type="text"
                name="assignedMunicipality"
                value={formData.assignedMunicipality}
                onChange={handleChange}
                placeholder="e.g., Talacogon"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors text-sm text-gray-900"
                required
              />
            </div>

            {/* Assigned Barangay Coverage */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-[#047857]" />
                Assigned Barangay Coverage
              </label>
              <input
                type="text"
                name="assignedBarangay"
                value={formData.assignedBarangay}
                onChange={handleChange}
                placeholder="e.g., Barangay Poblacion, San Isidro"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors text-sm text-gray-900"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
            
            {/* Contact Number */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-[#047857]" />
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="09171234567"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors text-sm text-gray-900"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-[#047857]" />
                Complete Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Purok, Barangay, Municipality"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none transition-colors resize-none text-sm text-gray-900"
                required
              />
            </div>

          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">Profile Picture</h3>
            
            {/* Profile Picture Upload */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                <Upload className="w-4 h-4 text-[#047857]" />
                Profile Picture (Optional)
              </label>
              
              {previewUrl ? (
                <div className="flex justify-center">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-44 h-44 rounded-2xl object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 text-gray-700 rounded-full p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-[#F8F9FA] hover:bg-gray-100/70 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-[#EAF6F0] rounded-xl mb-3">
                        <Upload className="w-7 h-7 text-[#047857]" />
                      </div>
                      <p className="mb-1 text-sm text-gray-700 font-semibold">
                        <span className="text-[#047857]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="editorial-portal min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#EAF6F0] border border-[#CBEAD9] rounded-2xl mb-4">
            <User className="w-7 h-7 text-[#047857]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1.5">Complete Your Profile</h1>
          <p className="text-sm text-gray-500 font-medium">Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold border transition-colors ${
                  currentStep === step 
                    ? 'bg-[#047857] text-white border-[#047857]' 
                    : currentStep > step
                    ? 'bg-[#EAF6F0] text-[#047857] border-[#CBEAD9]'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step ? 'bg-[#047857]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-6 py-2.5 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={loading}
                  className="ml-auto px-6 py-2.5 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    'Complete Profile'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-5">
          This information will be used for your official records
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletion;
