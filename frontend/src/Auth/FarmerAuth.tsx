import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { User, ChevronRight, ChevronLeft, Upload, X, Camera, FileText, Eye, EyeOff } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  AuthLayout,
  AuthStepProgress,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from './AuthLayout';

interface FarmerAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const FarmerAuth: React.FC<FarmerAuthProps> = ({ onBack, onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLogin, setIsLogin] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    confirmPassword: '',
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

      const recaptchaToken = await executeRecaptcha('login');

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: 'farmer',
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
        'farmer'
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

      const response = await fetch(`${API_BASE_URL}/api/auth/register/farmer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submitData, recaptchaToken }),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Registration failed';
        const errorDetails = data.details ? `\nDetails: ${JSON.stringify(data.details)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = () => {
    return formData.fullName?.trim();
  };

  const isStep2Valid = () => {
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      setError('Please fill in all required fields (Full Name is required)');
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      setError('Please complete all required fields in this step');
      return;
    }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <AuthLayout
      roleLabel="Farmer Portal"
      roleIcon={<User className="w-5 h-5" />}
      title={isLogin ? 'Farmer Sign In' : 'Farmer Registration'}
      subtitle={isLogin ? 'For registered Abaca farmers in Culiram' : 'Register your farm profile and verification ID'}
      asideHeadline="Grow, Track & Sell Abaca Directly"
      asideDescription="Monitor your distributed seedlings, field inspection updates, verified harvests, and direct buyer pricing in one place."
      asideHighlights={[
        'Track seedling distributions and field planting status',
        'View MAO & CUSAFA farm monitoring recommendations',
        'Submit verified harvests and check live buyer rates',
      ]}
      onBack={onBack}
      mode={isLogin ? 'login' : 'register'}
      onModeChange={(nextMode) => {
        setIsLogin(nextMode === 'login');
        setCurrentStep(1);
        setError('');
      }}
      error={error}
      footerNote="Verification typically takes 1–3 business days after document submission."
    >
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="farmer-login-email" className={AUTH_LABEL_CLASS}>
              Email Address <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <input
              id="farmer-login-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={AUTH_INPUT_CLASS}
              placeholder="farmer@example.com"
            />
          </div>

          <div>
            <label htmlFor="farmer-login-password" className={AUTH_LABEL_CLASS}>
              Password <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="farmer-login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                enterKeyHint="done"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`${AUTH_INPUT_CLASS} pr-11`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={AUTH_SUBMIT_BTN_CLASS}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In as Farmer'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <AuthStepProgress steps={['Personal Info', 'Account Setup']} currentStep={currentStep} />

          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div>
                <label htmlFor="farmer-fullname" className={AUTH_LABEL_CLASS}>
                  Full Name <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="farmer-fullname"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmer-sex" className={AUTH_LABEL_CLASS}>Sex</label>
                  <select
                    id="farmer-sex"
                    name="sex"
                    autoComplete="sex"
                    value={formData.sex || ''}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="farmer-age" className={AUTH_LABEL_CLASS}>Age</label>
                  <input
                    id="farmer-age"
                    name="age"
                    type="number"
                    min="18"
                    inputMode="numeric"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value, 10) : '' })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmer-birthday" className={AUTH_LABEL_CLASS}>Birthday</label>
                  <input
                    id="farmer-birthday"
                    name="birthday"
                    type="date"
                    autoComplete="bday"
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="farmer-civil-status" className={AUTH_LABEL_CLASS}>Civil Status</label>
                  <select
                    id="farmer-civil-status"
                    name="civilStatus"
                    value={formData.civilStatus || ''}
                    onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="farmer-contact" className={AUTH_LABEL_CLASS}>Contact Number</label>
                <input
                  id="farmer-contact"
                  name="contactNumber"
                  type="tel"
                  autoComplete="tel"
                  enterKeyHint="next"
                  value={formData.contactNumber || ''}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="09171234567"
                />
              </div>

              <div>
                <label htmlFor="farmer-address" className={AUTH_LABEL_CLASS}>Farm / Home Address</label>
                <input
                  id="farmer-address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  enterKeyHint="next"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Purok 1, Culiram, Talacogon"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF6F0] text-[#047857] flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Verification Documents</h3>
                    <p className="text-xs text-gray-500">Upload a profile photo and valid ID (JPG/PNG, max 5MB each)</p>
                  </div>
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>
                    Profile Photo <span aria-hidden="true" className="text-rose-600">*</span>
                  </span>
                  {!profilePhotoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-28 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
                      <span className="text-xs font-medium text-gray-700">Click to upload profile photo</span>
                      <span className="text-[11px] text-gray-400">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'profile')}
                        className="sr-only"
                        required
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-44 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('profile')}
                        aria-label="Remove profile photo"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>
                    Valid ID (Driver's License, National ID, etc.) <span aria-hidden="true" className="text-rose-600">*</span>
                  </span>
                  {!validIdPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-28 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <FileText className="w-6 h-6 text-gray-400 mb-1.5" />
                      <span className="text-xs font-medium text-gray-700">Click to upload valid ID</span>
                      <span className="text-[11px] text-gray-400">JPG, PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'id')}
                        className="sr-only"
                        required
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={validIdPreview} alt="Valid ID preview" className="w-full h-44 object-contain bg-gray-50" />
                      <button
                        type="button"
                        onClick={() => removePhoto('id')}
                        aria-label="Remove valid ID photo"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="farmer-reg-email" className={AUTH_LABEL_CLASS}>
                  Email Address <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="farmer-reg-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="farmer@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="farmer-reg-password" className={AUTH_LABEL_CLASS}>
                    Password <span aria-hidden="true" className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="farmer-reg-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      enterKeyHint="next"
                      aria-describedby="farmer-password-rules"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`${AUTH_INPUT_CLASS} pr-10`}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-800"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="farmer-reg-confirm-password" className={AUTH_LABEL_CLASS}>
                    Confirm Password <span aria-hidden="true" className="text-rose-600">*</span>
                  </label>
                  <input
                    id="farmer-reg-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    enterKeyHint="done"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div id="farmer-password-rules" className="rounded-xl bg-[#F8F9FA] border border-gray-200 px-3.5 py-2.5 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Password requirements:</p>
                <p>At least 4 characters, including uppercase (A-Z), lowercase (a-z), number (0-9), and special character (@$!%*?&).</p>
              </div>

              <div>
                <label htmlFor="farmer-remarks" className={AUTH_LABEL_CLASS}>Remarks / Notes</label>
                <textarea
                  id="farmer-remarks"
                  name="remarks"
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className={`${AUTH_INPUT_CLASS} resize-y`}
                  placeholder="Optional farm details or association notes..."
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className={AUTH_SECONDARY_BTN_CLASS}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 1 && !isStep1Valid()}
                className={`${AUTH_PRIMARY_BTN_CLASS} w-auto ml-auto`}
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`${AUTH_PRIMARY_BTN_CLASS} w-auto ml-auto`}
              >
                {loading ? 'Creating account...' : 'Create Farmer Account'}
              </button>
            )}
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
