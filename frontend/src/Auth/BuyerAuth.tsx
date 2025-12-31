import React, { useState } from 'react';
import { Building2, ArrowLeft, ChevronRight, ChevronLeft, Upload, X, Camera, FileText, Award } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { completeLogin } from '../utils/authToken';

interface BuyerAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const BuyerAuth: React.FC<BuyerAuthProps> = ({ onBack, onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [validIdPreview, setValidIdPreview] = useState<string>('');
  const [businessPermitPreview, setBusinessPermitPreview] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id' | 'permit') => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'profile') {
          setFormData({ ...formData, profilePhoto: base64 });
          setProfilePhotoPreview(base64);
        } else if (type === 'id') {
          setFormData({ ...formData, validIdPhoto: base64 });
          setValidIdPreview(base64);
        } else {
          setFormData({ ...formData, businessPermitPhoto: base64 });
          setBusinessPermitPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (type: 'profile' | 'id' | 'permit') => {
    if (type === 'profile') {
      setFormData({ ...formData, profilePhoto: '' });
      setProfilePhotoPreview('');
    } else if (type === 'id') {
      setFormData({ ...formData, validIdPhoto: '' });
      setValidIdPreview('');
    } else {
      setFormData({ ...formData, businessPermitPhoto: '' });
      setBusinessPermitPreview('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!executeRecaptcha) {
        setError('reCAPTCHA not loaded');
        setLoading(false);
        return;
      }

      const recaptchaToken = await executeRecaptcha('login');

      const response = await fetch('https://easyabaca-api.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: 'buyer',
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Debug logging to help identify the issue
      console.log('Login response data:', data);
      console.log('User isVerified:', data.data.user.isVerified);
      console.log('User verificationStatus:', data.data.user.verificationStatus);

      // Check if the account is verified (enhanced check for both fields)
      const isVerified = data.data.user.isVerified === true;
      const verificationStatus = data.data.user.verificationStatus || 'pending';

      console.log('Enhanced check - isVerified:', isVerified);
      console.log('Enhanced check - verificationStatus:', verificationStatus);
      console.log('Condition result (!isVerified || verificationStatus !== \'verified\'):', !isVerified || verificationStatus !== 'verified');

      if (!isVerified || verificationStatus !== 'verified') {
        if (verificationStatus === 'rejected') {
          setError('Your account has been rejected. Reason: ' + (data.data.user.rejectionReason || 'Not specified'));
        } else {
          setError('Your account is pending verification. Please wait for admin approval before logging in.');
        }
        setLoading(false);
        return;
      }

      // Use centralized token management
      completeLogin(
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        data.data.user,
        'buyer'
      );

      alert('Login successful!');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (!executeRecaptcha) {
        setError('reCAPTCHA not loaded');
        setLoading(false);
        return;
      }

      // Use 'login' action for registration as well to ensure consistent scoring
      const recaptchaToken = await executeRecaptcha('login');
      const { confirmPassword, ...submitData } = formData;

      const response = await fetch('https://easyabaca-api.vercel.app/api/auth/register/buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submitData, recaptchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message with verification instructions
      alert(
        '✅ Registration Successful!\n\n' +
        '📋 Your application is now pending verification.\n\n' +
        '⏱️ What happens next?\n' +
        '• Our team will review your application and documents\n' +
        '• Verification usually takes 1-3 business days\n' +
        '• We will contact you via email or phone once verified\n\n' +
        '📞 For urgent concerns:\n' +
        'Email: support@mao.gov.ph\n' +
        'Phone: (085) 123-4567\n\n' +
        'Thank you for your patience!'
      );

      setIsLogin(true);
      setCurrentStep(1);
      setFormData({ email: formData.email, password: '', confirmPassword: '' });
      setProfilePhotoPreview('');
      setValidIdPreview('');
      setBusinessPermitPreview('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = () => {
    return formData.businessName?.trim() && formData.ownerName?.trim();
  };

  const isStep2Valid = () => {
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      setError('Please fill in all required fields (Business Name and Owner\'s Name are required)');
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      setError('Please complete all required fields in this step');
      return;
    }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: 'url(/assets/images/abcafiber.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-black/45"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-green-100">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="mb-6 flex items-center text-gray-600 hover:text-green-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {isLogin ? 'Buyer Portal' : 'Buyer Registration'}
            </h2>
            <p className="text-gray-600 text-sm">For Abaca Buyers and Traders</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setCurrentStep(1);
              }}
              className={`flex-1 py-2 rounded-md transition-colors ${isLogin ? 'bg-white shadow text-green-700 font-medium' : 'text-gray-600'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setCurrentStep(1);
              }}
              className={`flex-1 py-2 rounded-md transition-colors ${!isLogin ? 'bg-white shadow text-green-700 font-medium' : 'text-gray-600'
                }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      1
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 1 ? 'text-green-700' : 'text-gray-500'
                      }`}>Business Info</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 mt-[-20px] ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      2
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 2 ? 'text-green-700' : 'text-gray-500'
                      }`}>Buying Details</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 mt-[-20px] ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      3
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 3 ? 'text-green-700' : 'text-gray-500'
                      }`}>Account Setup</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.businessName || ''}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Noy-Noy Abaca Trading"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner's Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerName || ''}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <textarea
                      rows={2}
                      value={formData.businessAddress || ''}
                      onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="123 Main St, Prosperidad, Agusan del Sur"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.contactNumber || ''}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="09171234567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License/Accreditation</label>
                      <input
                        type="text"
                        value={formData.licenseOrAccreditation || ''}
                        onChange={(e) => setFormData({ ...formData, licenseOrAccreditation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="PhilFIDA-12345"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Buying Details */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buying Schedule</label>
                      <input
                        type="text"
                        value={formData.buyingSchedule || ''}
                        onChange={(e) => setFormData({ ...formData, buyingSchedule: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Mon-Fri, 8AM-5PM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={formData.paymentTerms || ''}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Cash on Delivery"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buying Location</label>
                    <input
                      type="text"
                      value={formData.buyingLocation || ''}
                      onChange={(e) => setFormData({ ...formData, buyingLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Prosperidad Public Market"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Address</label>
                    <textarea
                      rows={2}
                      value={formData.warehouseAddress || ''}
                      onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Warehouse location"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₱/kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceRangeMin || ''}
                        onChange={(e) => setFormData({ ...formData, priceRangeMin: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="25.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₱/kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.priceRangeMax || ''}
                        onChange={(e) => setFormData({ ...formData, priceRangeMax: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="35.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accepted Quality Grades</label>
                    <input
                      type="text"
                      value={formData.acceptedQualityGrades?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, acceptedQualityGrades: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Grade A, Grade B, Grade C (comma-separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partnered Associations</label>
                    <input
                      type="text"
                      value={formData.partneredAssociations?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, partneredAssociations: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="CuSAFA, SAAD (comma-separated)"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Account Information */}
              {currentStep === 3 && (
                <div className="space-y-3">
                  {/* Photo Upload Section */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Camera className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-900 text-sm">Verification Documents Required</h4>
                        <p className="text-xs text-green-700">Upload owner's photo, ID, and business permit</p>
                      </div>
                    </div>

                    {/* Profile Photo Upload */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner's Photo * <span className="text-xs text-gray-500">(Max 5MB)</span>
                      </label>
                      {!profilePhotoPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload profile photo</span>
                          <span className="text-xs text-gray-500">JPG, PNG (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'profile')}
                            className="hidden"
                            required
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <img
                            src={profilePhotoPreview}
                            alt="Profile Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('profile')}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Valid ID Upload */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner's Valid ID * <span className="text-xs text-gray-500">(Driver's License, National ID, etc.)</span>
                      </label>
                      {!validIdPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <FileText className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload valid ID</span>
                          <span className="text-xs text-gray-500">JPG, PNG (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'id')}
                            className="hidden"
                            required
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <img
                            src={validIdPreview}
                            alt="ID Preview"
                            className="w-full h-48 object-contain rounded-lg bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('id')}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Business Permit Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Permit/License * <span className="text-xs text-gray-500">(PhilFIDA, DTI, Mayor's Permit)</span>
                      </label>
                      {!businessPermitPreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                          <Award className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload business permit</span>
                          <span className="text-xs text-gray-500">JPG, PNG (Max 5MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'permit')}
                            className="hidden"
                            required
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <img
                            src={businessPermitPreview}
                            alt="Business Permit Preview"
                            className="w-full h-48 object-contain rounded-lg bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('permit')}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Must contain uppercase, lowercase, number, and special character</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                    <textarea
                      rows={3}
                      value={formData.remarks || ''}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={(currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
                    className="ml-auto px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-auto px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Authorized personnel only. All activities are logged and monitored.
              <br />
              Protected by reCAPTCHA and secured with SSL encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
