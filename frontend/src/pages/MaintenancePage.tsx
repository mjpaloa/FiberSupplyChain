import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { completeLogin } from '../utils/authToken';
import { Wrench, WifiOff, Shield, X, Mail } from 'lucide-react';

const MaintenancePage: React.FC = () => {
  const [dots, setDots] = useState('');
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated dots for "Working on it..."
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Hidden button reveal - click logo 5 times
  const handleLogoClick = () => {
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      setShowAdminButton(true);
    }
  };

  const handleAdminAccess = () => {
    // Show login modal instead of redirecting
    setShowLoginModal(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, userType: 'officer' });

      const response = await fetch('https://easyabaca-api.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          userType: 'officer',
          // No recaptchaToken - optional in backend
        }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // The response structure is: { message: "...", data: { user: {...}, tokens: {...} } }
      const userData = data.data?.user || data.user || data;
      const tokens = data.data?.tokens || data.tokens;
      
      console.log('User data:', userData);
      console.log('Tokens:', tokens);

      if (!userData || !tokens) {
        throw new Error('Invalid response from server');
      }
      
      if (!userData.isSuperAdmin) {
        throw new Error('Access denied. Only Super Admins can login during maintenance.');
      }

      // Use centralized token management
      completeLogin(
        tokens.accessToken,
        tokens.refreshToken,
        userData,
        'officer'
      );

      console.log('✅ Login successful! Redirecting to MAO Dashboard...');

      // Redirect to MAO Dashboard instead of reloading
      // This allows Super Admin to disable maintenance mode
      window.location.href = '/mao/dashboard';
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-500/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          {/* Disconnected Person Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Person Icon with Broken Wire Animation */}
              <div className="relative">
                {/* Left Wire (Connected) */}
                <div className="absolute -left-32 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center">
                    <WifiOff className="w-8 h-8 text-red-400 animate-pulse" />
                    <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-transparent animate-pulse" />
                  </div>
                </div>

                {/* Person Circle */}
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                  <div className="text-white">
                    {/* Sad Face */}
                    <svg
                      className="w-20 h-20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {/* Head */}
                      <circle cx="12" cy="12" r="10" />
                      {/* Eyes */}
                      <circle cx="9" cy="9" r="1" fill="currentColor" />
                      <circle cx="15" cy="9" r="1" fill="currentColor" />
                      {/* Sad Mouth */}
                      <path d="M9 16 Q12 14 15 16" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Right Wire (Broken/Sparking) */}
                <div className="absolute -right-32 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center">
                    <div className="w-24 h-1 bg-gradient-to-l from-red-500 to-transparent animate-pulse" />
                    {/* Spark Effect */}
                    <div className="relative">
                      <AlertTriangle className="w-8 h-8 text-yellow-400 animate-ping" />
                      <AlertTriangle className="w-8 h-8 text-yellow-400 absolute top-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Icon - Click 5 times to reveal admin button */}
          <div className="flex justify-center mb-6">
            <div 
              onClick={handleLogoClick}
              className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl animate-wiggle cursor-pointer hover:scale-110 transition-transform"
              title={showAdminButton ? 'Admin Access Unlocked!' : `Click ${5 - clickCount} more times...`}
            >
              <Wrench className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Hidden Admin Access Button */}
          {showAdminButton && (
            <div className="flex justify-center mb-6 animate-fade-in">
              <button
                onClick={handleAdminAccess}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Shield className="w-5 h-5" />
                <span>Super Admin Access</span>
              </button>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            System Under Maintenance
          </h1>

          {/* Subtitle with animated dots */}
          <p className="text-xl text-center text-emerald-300 mb-8 font-medium">
            We're working on it{dots}
          </p>

          {/* Description */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <p className="text-gray-300 text-center leading-relaxed">
              Our system is currently undergoing scheduled maintenance to improve your experience.
              We'll be back online shortly. Thank you for your patience!
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>Check Again</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400 text-sm">
              Need urgent assistance? Contact us at{' '}
              <a href="mailto:support@mao.gov.ph" className="text-emerald-400 hover:text-emerald-300 underline">
                support@mao.gov.ph
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          MAO Culiram Abaca System • Maintenance Mode
        </p>
      </div>

      {/* Super Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20 p-8 max-w-md w-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Super Admin</h2>
                  <p className="text-sm text-gray-400">Login to disable maintenance</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="superadmin@mao.gov.ph"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Login as Super Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300 text-center">
                🔒 Only Super Admin accounts can login during maintenance mode
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MaintenancePage;
