import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { Eye, EyeOff, ChevronRight, ChevronLeft, X, Camera, FileText, Building2 } from 'lucide-react';
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

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

      const response = await fetch(`${API_BASE_URL}/api/auth/register/officer`, {
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
    <AuthLayout
      roleLabel="CUSAFA Association"
      roleIcon={<Building2 className="w-5 h-5" />}
      title={isLogin ? 'Association Sign In' : 'Officer Registration'}
      subtitle={isLogin ? 'Login here as a CUSAFA association officer' : 'Register as a verified association coordinator'}
      asideHeadline="Coordinate Seedlings, Harvests & Member Logistics"
      asideDescription="Distribute MAO seedling allocations to member farmers, oversee warehouse dry fiber inventory, and coordinate deliveries with verified buyers."
      asideHighlights={[
        'Track association seedling allocations & farmer distributions',
        'Manage verified warehouse fiber inventory & shipments',
        'View live buyer pricing benchmarks across grades',
      ]}
      onBack={onBack}
      mode={isLogin ? 'login' : 'register'}
      onModeChange={(nextMode) => {
        setIsLogin(nextMode === 'login');
        setCurrentStep(1);
        setError('');
      }}
      error={error}
      footerNote="Association officer accounts require MAO administrator approval before activation."
    >
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="cusafa-login-email" className={AUTH_LABEL_CLASS}>
              Email Address <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <input
              id="cusafa-login-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={AUTH_INPUT_CLASS}
              placeholder="officer@cusafa.com"
            />
          </div>

          <div>
            <label htmlFor="cusafa-login-password" className={AUTH_LABEL_CLASS}>
              Password <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="cusafa-login-password"
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
              'Sign In as Officer'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <AuthStepProgress
            steps={['Basic Info', 'Officer Details', 'Documents']}
            currentStep={currentStep}
          />

          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div>
                <label htmlFor="cusafa-fullname" className={AUTH_LABEL_CLASS}>
                  Full Name <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="cusafa-fullname"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label htmlFor="cusafa-reg-email" className={AUTH_LABEL_CLASS}>
                  Email Address <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="cusafa-reg-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="officer@cusafa.com"
                />
              </div>

              <div>
                <label htmlFor="cusafa-reg-password" className={AUTH_LABEL_CLASS}>
                  Password <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="cusafa-reg-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    enterKeyHint="next"
                    aria-describedby="cusafa-password-rules"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`${AUTH_INPUT_CLASS} pr-11`}
                    placeholder="Create a strong password"
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
                <p id="cusafa-password-rules" className="mt-1.5 text-xs text-gray-500">
                  Must include uppercase, lowercase, number, and special character (@$!%*?&).
                </p>
              </div>

              <div>
                <label htmlFor="cusafa-reg-confirm-password" className={AUTH_LABEL_CLASS}>
                  Confirm Password <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="cusafa-reg-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Re-enter password"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToStep2()}
                  className={`${AUTH_PRIMARY_BTN_CLASS} w-auto`}
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3.5">
              <div>
                <label htmlFor="cusafa-position" className={AUTH_LABEL_CLASS}>
                  Position <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <select
                  id="cusafa-position"
                  name="position"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className={AUTH_INPUT_CLASS}
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
                <label htmlFor="cusafa-association-name" className={AUTH_LABEL_CLASS}>
                  Organization Name <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="cusafa-association-name"
                  name="associationName"
                  type="text"
                  autoComplete="organization"
                  required
                  value={formData.associationName}
                  onChange={(e) => setFormData({ ...formData, associationName: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="CUSAFA"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cusafa-contact" className={AUTH_LABEL_CLASS}>
                    Contact Number <span aria-hidden="true" className="text-rose-600">*</span>
                  </label>
                  <input
                    id="cusafa-contact"
                    name="contactNumber"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="09123456789"
                  />
                </div>
                <div>
                  <label htmlFor="cusafa-term" className={AUTH_LABEL_CLASS}>Term Duration</label>
                  <input
                    id="cusafa-term"
                    name="termDuration"
                    type="text"
                    value={formData.termDuration}
                    onChange={(e) => setFormData({ ...formData, termDuration: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="e.g., 2024-2026"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cusafa-address" className={AUTH_LABEL_CLASS}>Address</label>
                <textarea
                  id="cusafa-address"
                  name="address"
                  rows={2}
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`${AUTH_INPUT_CLASS} resize-y`}
                  placeholder="Complete address"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={prevStep} className={AUTH_SECONDARY_BTN_CLASS}>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToStep3()}
                  className={`${AUTH_PRIMARY_BTN_CLASS} w-auto`}
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-4">
                <div>
                  <span className={AUTH_LABEL_CLASS}>Profile Photo (Optional)</span>
                  {profilePhotoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={profilePhotoPreview} alt="Profile preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('profile')}
                        aria-label="Remove profile photo"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <Camera className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Click to upload photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'profile')}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>Valid ID Photo (Optional)</span>
                  {validIdPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={validIdPreview} alt="Valid ID preview" className="w-full h-40 object-contain bg-gray-50" />
                      <button
                        type="button"
                        onClick={() => removePhoto('id')}
                        aria-label="Remove ID photo"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <FileText className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Click to upload valid ID</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'id')}
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-[#EAF6F0] border border-[#CBEAD9] p-3.5 text-xs text-gray-800 leading-relaxed">
                <p className="font-semibold text-[#047857] mb-0.5">Verification Required</p>
                <p>Your account will be pending verification after registration until approved by a MAO administrator.</p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={prevStep} className={AUTH_SECONDARY_BTN_CLASS}>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${AUTH_PRIMARY_BTN_CLASS} w-auto`}
                >
                  {loading ? 'Registering...' : 'Create Officer Account'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </AuthLayout>
  );
};
