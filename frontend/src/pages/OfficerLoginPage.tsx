import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface OfficerLoginPageProps {
  onLoginSuccess: () => void;
}

export const OfficerLoginPage: React.FC<OfficerLoginPageProps> = ({ onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!executeRecaptcha) {
        setError('Security verification not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Get reCAPTCHA v3 token
      const recaptchaToken = await executeRecaptcha('officer_login');

      const response = await fetch('https://server.easyabaca.site/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: 'officer', // Fixed: was incorrectly set to 'association_officer'
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
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

      // Complete login process
      console.log('Login response data:', data);
      console.log('Saving tokens and user data...');
      
      completeLogin(
        data.data.tokens.accessToken,
        data.data.tokens.refreshToken,
        data.data.user,
        'officer' // Fixed: was incorrectly set to 'association_officer'
      );

      console.log('Login completed, calling onLoginSuccess...');
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Please sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-200 flex-shrink-0 mr-3"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>


          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Authorized personnel only. All activities are logged and monitored.
              <br />
              Protected by reCAPTCHA and secured with SSL encryption.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Municipal Agriculture Office - Culiram, Talacogon
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfficerLoginPage;
