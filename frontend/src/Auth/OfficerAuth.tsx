import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

interface OfficerAuthProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export const OfficerAuth: React.FC<OfficerAuthProps> = ({ onLoginSuccess }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();
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

      const response = await fetch('https://easyabaca-api.vercel.app/api/auth/login', {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: 'url(/assets/images/abcafiber.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-black/45"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Portal</h2>
            <p className="text-gray-600 text-sm">For MAO HVC and Administrators</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

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

            {/* reCAPTCHA v3 - Invisible, automatic verification */}

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
