import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  AuthLayout,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_BTN_CLASS,
} from './AuthLayout';

interface OfficerAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const OfficerAuth: React.FC<OfficerAuthProps> = ({ onBack, onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const response = await fetch('https://fibersupplychain.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: 'officer',
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Use centralized token management
      completeLogin(
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        data.data.user,
        'officer'
      );

      alert('Login successful!');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      showPortalSwitcher={false}
      roleLabel="Admin Portal"
      roleIcon={<ShieldCheck className="w-5 h-5" />}
      title="Admin Portal"
      subtitle="Sign in for MAO HVC coordinators and system administrators"
      asideHeadline="Municipal Abaca Supply Chain Oversight"
      asideDescription="Coordinate seedling allocations, verify harvests, oversee buyer listings, and track municipal fiber deliveries from one unified workspace."
      asideHighlights={[
        'Real-time production, monitoring & sales analytics',
        'Farmer, CUSAFA officer & buyer verification workflow',
        'Audit logging and role-based administrative controls',
      ]}
      onBack={onBack}
      error={error}
      footerNote="Authorized MAO personnel only. All activities are logged and monitored."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="officer-email" className={AUTH_LABEL_CLASS}>
            Email Address <span aria-hidden="true" className="text-rose-600">*</span>
          </label>
          <input
            id="officer-email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            enterKeyHint="next"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={AUTH_INPUT_CLASS}
            placeholder="officer@talacogon.gov.ph"
          />
        </div>

        <div>
          <label htmlFor="officer-password" className={AUTH_LABEL_CLASS}>
            Password <span aria-hidden="true" className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              id="officer-password"
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

        <button
          type="submit"
          disabled={loading}
          className={AUTH_SUBMIT_BTN_CLASS}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In to Admin Portal'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
