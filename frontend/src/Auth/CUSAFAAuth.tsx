import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ChevronRight, ChevronLeft, X, Camera, FileText, Building2 } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface CUSAFAAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const CUSAFAAuth: React.FC<CUSAFAAuthProps> = ({ onBack, onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    position: '',
    associationName: '',
    contactNumber: '',
    address: '',
    termDuration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [validIdPreview, setValidIdPreview] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'id') => {
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
        } else {
          setFormData({ ...formData, validIdPhoto: base64 });
          setValidIdPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (type: 'profile' | 'id') => {
    if (type === 'profile') {
      setFormData({ ...formData, profilePhoto: '' });
      setProfilePhotoPreview('');
    } else {
      setFormData({ ...formData, validIdPhoto: '' });
      setValidIdPreview('');
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

      // Get reCAPTCHA v3 token (invisible)
      const recaptchaToken = await executeRecaptcha('login');

      const response = await fetch('https://server.easyabaca.site/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: 'association_officer',
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
        'association_officer'
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

      const recaptchaToken = await executeRecaptcha('register');
      const { confirmPassword, ...submitData } = formData;

      const response = await fetch('https://server.easyabaca.site/api/auth/register/officer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitData,
          recaptchaToken,
          associationName: submitData.associationName || 'CUSAFA' // Ensure association name is set
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors array
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.msg || err.message).join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        const errorMessage = data.error || data.message || 'Registration failed';
        const errorDetails = data.details ? `\nDetails: ${JSON.stringify(data.details)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      // Show success message with verification instructions
      alert(
        'Registration successful!\n\n' +
        'Your account has been created and is pending verification by an administrator.\n' +
        'You will be able to login once your account is approved.\n\n' +
        'Please check back later or contact the administrator for updates.'
      );

      // Switch to login view
      setIsLogin(true);
      setCurrentStep(1);
      setFormData({
        email: formData.email, // Keep email for convenience
        password: '',
        confirmPassword: '',
        fullName: '',
        position: '',
        associationName: '',
        contactNumber: '',
        address: '',
        termDuration: '',
      });
      setProfilePhotoPreview('');
      setValidIdPreview('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const canProceedToStep2 = () => {
    return formData.fullName && formData.email && formData.password && formData.confirmPassword;
  };

  const canProceedToStep3 = () => {
    return formData.position && formData.associationName && formData.contactNumber;
  };

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
              {isLogin ? 'Association Portal' : 'Association Registration'}
            </h2>
            <p className="text-gray-600 text-sm">
              {isLogin ? 'Login Here as Association Officer' : 'Register as Association officer'}
            </p>
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
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                  placeholder="your.email@cusafa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
            // REGISTRATION FORM
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      1
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 1 ? 'text-green-700' : 'text-gray-500'
                      }`}>Basic Info</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 mt-[-20px] ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      2
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 2 ? 'text-green-700' : 'text-gray-500'
                      }`}>Officer Details</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 mt-[-20px] ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-1 ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      3
                    </div>
                    <span className={`text-xs font-medium text-center ${currentStep >= 3 ? 'text-green-700' : 'text-gray-500'
                      }`}>Document Upload</span>
                  </div>
                </div>
              </div>

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="your.email@cusafa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium mb-1">Password must contain:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>At least 4 characters</li>
                        <li>One uppercase letter (A-Z)</li>
                        <li>One lowercase letter (a-z)</li>
                        <li>One number (0-9)</li>
                        <li>One special character (@$!%*?&)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToStep2()}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    Next <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              )}

              {/* Step 2: Officer Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Officer Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                    <select
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                    >
                      <option value="">Select Position</option>
                      <option value="President">President</option>
                      <option value="Vice President">Vice President</option>
                      <option value="Treasurer">Treasurer</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Auditor">Auditor</option>
                      <option value="Board Member">Board Member</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.associationName}
                      onChange={(e) => setFormData({ ...formData, associationName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="CUSAFA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="09123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Complete address"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Term Duration</label>
                    <input
                      type="text"
                      value={formData.termDuration}
                      onChange={(e) => setFormData({ ...formData, termDuration: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                      placeholder="e.g., 2024-2026"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceedToStep3()}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                    >
                      Next <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-4">Document Upload</h3>

                  {/* Profile Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo (Optional)
                    </label>
                    {profilePhotoPreview ? (
                      <div className="relative">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto('profile')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <Camera className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'profile')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Valid ID Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid ID Photo (Optional)
                    </label>
                    {validIdPreview ? (
                      <div className="relative">
                        <img
                          src={validIdPreview}
                          alt="ID preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto('id')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <FileText className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload ID</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'id')}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    <p className="font-medium mb-1">⚠️ Verification Required</p>
                    <p>Your account will be pending verification after registration. An administrator will review and approve your account before you can login.</p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </div>
              )}

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
