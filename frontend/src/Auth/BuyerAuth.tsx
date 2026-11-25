import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { Building2, ChevronRight, ChevronLeft, Upload, X, Camera, FileText, Award, Eye, EyeOff } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { completeLogin } from '../utils/authToken';
import {
  AuthLayout,
  AuthStepProgress,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BTN_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
  AUTH_SECONDARY_BTN_CLASS,
} from './AuthLayout';

interface BuyerAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const BuyerAuth: React.FC<BuyerAuthProps> = ({ onBack, onLoginSuccess }) => {
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

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

      const response = await fetch(`${API_BASE_URL}/api/auth/register/buyer`, {
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
    <AuthLayout
      roleLabel="Buyer Portal"
      roleIcon={<Building2 className="w-5 h-5" />}
      title={isLogin ? 'Buyer Sign In' : 'Buyer Registration'}
      subtitle={isLogin ? 'For verified abaca fiber traders and processors' : 'Register your trading business and buying rates'}
      asideHeadline="Source Quality-Graded Abaca Fiber"
      asideDescription="Publish Class A, B & C buying prices, coordinate direct purchases with verified farmers, and manage your digital fiber inventory ledger."
      asideHighlights={[
        'Publish transparent Class A / B / C price listings',
        'Track fiber purchases, inventory lots & direct sales',
        'Export CSV & PDF receipts for every transaction',
      ]}
      onBack={onBack}
      mode={isLogin ? 'login' : 'register'}
      onModeChange={(nextMode) => {
        setIsLogin(nextMode === 'login');
        setCurrentStep(1);
        setError('');
      }}
      error={error}
      footerNote="All buyer accounts require valid business permits and MAO verification."
    >
      {isLogin ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="buyer-login-email" className={AUTH_LABEL_CLASS}>
              Email Address <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <input
              id="buyer-login-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={AUTH_INPUT_CLASS}
              placeholder="buyer@company.com"
            />
          </div>

          <div>
            <label htmlFor="buyer-login-password" className={AUTH_LABEL_CLASS}>
              Password <span aria-hidden="true" className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="buyer-login-password"
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
              'Sign In as Buyer'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <AuthStepProgress
            steps={['Business Info', 'Buying Details', 'Account Setup']}
            currentStep={currentStep}
          />

          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div>
                <label htmlFor="buyer-business-name" className={AUTH_LABEL_CLASS}>
                  Business Name <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="buyer-business-name"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  enterKeyHint="next"
                  required
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Nonoy Abaca Trading"
                />
              </div>

              <div>
                <label htmlFor="buyer-owner-name" className={AUTH_LABEL_CLASS}>
                  Owner's Name <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="buyer-owner-name"
                  name="ownerName"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label htmlFor="buyer-business-address" className={AUTH_LABEL_CLASS}>Business Address</label>
                <textarea
                  id="buyer-business-address"
                  name="businessAddress"
                  rows={2}
                  autoComplete="street-address"
                  value={formData.businessAddress || ''}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className={`${AUTH_INPUT_CLASS} resize-y`}
                  placeholder="123 Main St, Prosperidad, Agusan del Sur"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="buyer-contact" className={AUTH_LABEL_CLASS}>Contact Number</label>
                  <input
                    id="buyer-contact"
                    name="contactNumber"
                    type="tel"
                    autoComplete="tel"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="09171234567"
                  />
                </div>
                <div>
                  <label htmlFor="buyer-license" className={AUTH_LABEL_CLASS}>License / Accreditation</label>
                  <input
                    id="buyer-license"
                    name="licenseOrAccreditation"
                    type="text"
                    value={formData.licenseOrAccreditation || ''}
                    onChange={(e) => setFormData({ ...formData, licenseOrAccreditation: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="PhilFIDA-12345"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="buyer-schedule" className={AUTH_LABEL_CLASS}>Buying Schedule</label>
                  <input
                    id="buyer-schedule"
                    name="buyingSchedule"
                    type="text"
                    value={formData.buyingSchedule || ''}
                    onChange={(e) => setFormData({ ...formData, buyingSchedule: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="Mon-Fri, 8AM-5PM"
                  />
                </div>
                <div>
                  <label htmlFor="buyer-payment-terms" className={AUTH_LABEL_CLASS}>Payment Terms</label>
                  <input
                    id="buyer-payment-terms"
                    name="paymentTerms"
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="Cash on Delivery"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="buyer-location" className={AUTH_LABEL_CLASS}>Buying Location</label>
                <input
                  id="buyer-location"
                  name="buyingLocation"
                  type="text"
                  value={formData.buyingLocation || ''}
                  onChange={(e) => setFormData({ ...formData, buyingLocation: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Prosperidad Public Market"
                />
              </div>

              <div>
                <label htmlFor="buyer-warehouse" className={AUTH_LABEL_CLASS}>Warehouse Address</label>
                <textarea
                  id="buyer-warehouse"
                  name="warehouseAddress"
                  rows={2}
                  value={formData.warehouseAddress || ''}
                  onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                  className={`${AUTH_INPUT_CLASS} resize-y`}
                  placeholder="Warehouse location"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="buyer-min-price" className={AUTH_LABEL_CLASS}>Min Price (₱/kg)</label>
                  <input
                    id="buyer-min-price"
                    name="priceRangeMin"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.priceRangeMin || ''}
                    onChange={(e) => setFormData({ ...formData, priceRangeMin: parseFloat(e.target.value) })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label htmlFor="buyer-max-price" className={AUTH_LABEL_CLASS}>Max Price (₱/kg)</label>
                  <input
                    id="buyer-max-price"
                    name="priceRangeMax"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={formData.priceRangeMax || ''}
                    onChange={(e) => setFormData({ ...formData, priceRangeMax: parseFloat(e.target.value) })}
                    className={AUTH_INPUT_CLASS}
                    placeholder="88.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="buyer-grades" className={AUTH_LABEL_CLASS}>Accepted Quality Grades</label>
                <input
                  id="buyer-grades"
                  name="acceptedQualityGrades"
                  type="text"
                  value={formData.acceptedQualityGrades?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, acceptedQualityGrades: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="Class A, Class B, Class C"
                />
              </div>

              <div>
                <label htmlFor="buyer-associations" className={AUTH_LABEL_CLASS}>Partnered Associations</label>
                <input
                  id="buyer-associations"
                  name="partneredAssociations"
                  type="text"
                  value={formData.partneredAssociations?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, partneredAssociations: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="CUSAFA, SAAD"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF6F0] text-[#047857] flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Verification Documents</h3>
                    <p className="text-xs text-gray-500">Upload owner photo, valid ID, and business permit (max 5MB each)</p>
                  </div>
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>
                    Owner's Photo <span aria-hidden="true" className="text-rose-600">*</span>
                  </span>
                  {!profilePhotoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Upload profile photo</span>
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
                      <img src={profilePhotoPreview} alt="Owner preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto('profile')}
                        aria-label="Remove owner photo"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>
                    Owner's Valid ID <span aria-hidden="true" className="text-rose-600">*</span>
                  </span>
                  {!validIdPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <FileText className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Upload valid ID</span>
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
                      <img src={validIdPreview} alt="Valid ID preview" className="w-full h-40 object-contain bg-gray-50" />
                      <button
                        type="button"
                        onClick={() => removePhoto('id')}
                        aria-label="Remove valid ID"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <span className={AUTH_LABEL_CLASS}>
                    Business Permit / License (PhilFIDA, DTI, Mayor's Permit) <span aria-hidden="true" className="text-rose-600">*</span>
                  </span>
                  {!businessPermitPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-white border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#047857] hover:bg-gray-50 transition-colors">
                      <Award className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-gray-700">Upload business permit</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'permit')}
                        className="sr-only"
                        required
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={businessPermitPreview} alt="Permit preview" className="w-full h-40 object-contain bg-gray-50" />
                      <button
                        type="button"
                        onClick={() => removePhoto('permit')}
                        aria-label="Remove business permit"
                        className="absolute top-2 right-2 p-1.5 bg-white/95 border border-gray-200 text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="buyer-reg-email" className={AUTH_LABEL_CLASS}>
                  Email Address <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="buyer-reg-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={AUTH_INPUT_CLASS}
                  placeholder="buyer@company.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="buyer-reg-password" className={AUTH_LABEL_CLASS}>
                    Password <span aria-hidden="true" className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="buyer-reg-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      enterKeyHint="next"
                      aria-describedby="buyer-password-rules"
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
                  <label htmlFor="buyer-reg-confirm-password" className={AUTH_LABEL_CLASS}>
                    Confirm Password <span aria-hidden="true" className="text-rose-600">*</span>
                  </label>
                  <input
                    id="buyer-reg-confirm-password"
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

              <div id="buyer-password-rules" className="rounded-xl bg-[#F8F9FA] border border-gray-200 px-3.5 py-2.5 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Password requirements:</p>
                <p>At least 4 characters, including uppercase (A-Z), lowercase (a-z), number (0-9), and special character (@$!%*?&).</p>
              </div>

              <div>
                <label htmlFor="buyer-remarks" className={AUTH_LABEL_CLASS}>Remarks / Notes</label>
                <textarea
                  id="buyer-remarks"
                  name="remarks"
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className={`${AUTH_INPUT_CLASS} resize-y`}
                  placeholder="Additional notes..."
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

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={(currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
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
                {loading ? 'Creating account...' : 'Create Buyer Account'}
              </button>
            )}
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
