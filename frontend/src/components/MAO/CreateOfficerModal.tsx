import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, User } from 'lucide-react';

interface CreateOfficerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOfficerModal: React.FC<CreateOfficerModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/create-officer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          isSuperAdmin: formData.isSuperAdmin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create coordinator account');
      }

      alert('✅ Coordinator account created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#047857]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">Create Coordinator Account</h2>
              <p className="text-xs text-gray-500">Add a new MAO coordinator</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
              <User className="w-4 h-4 mr-1.5 text-gray-400" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              placeholder="Juan Dela Cruz"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              placeholder="coordinator@association.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
              <Lock className="w-4 h-4 mr-1.5 text-gray-400" />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              placeholder="Min. 8 characters"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
              <Lock className="w-4 h-4 mr-1.5 text-gray-400" />
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              placeholder="Re-enter password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Super Admin Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
            <input
              type="checkbox"
              id="isSuperAdmin"
              checked={formData.isSuperAdmin}
              onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked })}
              className="w-4 h-4 mt-0.5 text-[#047857] border-gray-300 rounded focus:ring-[#047857]"
            />
            <label htmlFor="isSuperAdmin" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer leading-relaxed">
              Make this account a <span className="text-[#92400E] font-bold">Super Admin</span> (full access to create accounts + maintenance mode)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#047857] hover:bg-[#065F46] text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOfficerModal;
