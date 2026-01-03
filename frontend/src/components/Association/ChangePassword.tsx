import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Loader,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';

interface ChangePasswordProps {
  onBack: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setValidationErrors([]);
  };

  const validatePassword = (): boolean => {
    const errors: string[] = [];

    if (formData.newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.push('New password and confirmation do not match');
    }

    if (formData.newPassword === formData.currentPassword) {
      errors.push('New password must be different from current password');
    }

    if (!/[A-Z]/.test(formData.newPassword)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(formData.newPassword)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(formData.newPassword)) {
      errors.push('Password must contain at least one number');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/association/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => onBack(), 2000);
      } else {
        showMessage('error', data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Change Password Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Change Password</h1>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-1">Update your account password</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-xs sm:text-sm text-red-700">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Password */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Current Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-6">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    New Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.label === 'Weak' ? 'text-red-600' :
                        passwordStrength.label === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Password must contain:</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`} />
                      One number
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-8">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm New Password
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-10 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                  <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || validationErrors.length > 0}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
