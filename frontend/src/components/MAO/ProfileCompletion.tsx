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
      
      const response = await fetch(`/api/mao/complete-profile', {
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
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Work Information</h3>
            
            {/* Position */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="President, Vice President, Treasurer, etc."
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-800"
                required
              />
            </div>

            {/* Office Name */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                Office Name
              </label>
              <input
                type="text"
                name="officeName"
                value={formData.officeName}
                onChange={handleChange}
                placeholder="e.g., Municipal Agriculture Office, Talacogon"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-800"
                required
              />
            </div>

            {/* Assigned Municipality */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Assigned Municipality
              </label>
              <input
                type="text"
                name="assignedMunicipality"
                value={formData.assignedMunicipality}
                onChange={handleChange}
                placeholder="e.g., Talacogon"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-800"
                required
              />
            </div>

            {/* Assigned Barangay Coverage */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Assigned Barangay Coverage
              </label>
              <input
                type="text"
                name="assignedBarangay"
                value={formData.assignedBarangay}
                onChange={handleChange}
                placeholder="e.g., Barangay Poblacion, San Isidro"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-800"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h3>
            
            {/* Contact Number */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="09171234567"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-800"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Complete Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Purok, Barangay, Municipality"
                rows={3}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none font-medium text-gray-800"
                required
              />
            </div>

          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Profile Picture</h3>
            
            {/* Profile Picture Upload */}
            <div>
              <label className="flex items-center text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-2">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                Profile Picture (Optional)
              </label>
              
              {previewUrl ? (
                <div className="flex justify-center">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-48 h-48 rounded-2xl object-cover border-4 border-emerald-500 shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition shadow-lg hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-3 border-emerald-300 border-dashed rounded-2xl cursor-pointer bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-emerald-100 rounded-xl mb-4">
                        <Upload className="w-10 h-10 text-emerald-600" />
                      </div>
                      <p className="mb-2 text-base text-gray-700 font-semibold">
                        <span className="text-emerald-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 font-medium">PNG, JPG, GIF up to 5MB</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-transform">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-700 bg-clip-text text-transparent mb-3">Complete Your Profile</h1>
          <p className="text-gray-600 text-lg font-medium">Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all duration-300 ${
                  currentStep === step 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg scale-110' 
                    : currentStep > step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                    currentStep > step ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modern Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-100 p-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t-2 border-gray-100">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }}
                  disabled={loading}
                  className="ml-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <p className="text-center text-sm text-gray-500 mt-6">
          This information will be used for your official records
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletion;
