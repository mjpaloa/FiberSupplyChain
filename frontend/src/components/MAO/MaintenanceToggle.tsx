import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, Power, Shield, Users } from 'lucide-react';
import { EditorialCard, StatusPill, EditorialCallout } from '../Shared/EditorialUI';

const MaintenanceToggle: React.FC = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/maintenance/status`);
      const data = await response.json();
      setIsMaintenanceMode(data.maintenanceMode);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isMaintenanceMode && !reason.trim()) {
      setShowReasonInput(true);
      return;
    }

    setToggling(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/maintenance/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !isMaintenanceMode,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle maintenance mode');
      }

      setIsMaintenanceMode(!isMaintenanceMode);
      setReason('');
      setShowReasonInput(false);
      alert(`✅ Maintenance mode ${!isMaintenanceMode ? 'enabled' : 'disabled'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling maintenance:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle Card */}
      <EditorialCard
        title="Maintenance Mode"
        subtitle="Control system-wide maintenance mode and user access"
        actions={
          <StatusPill tone={isMaintenanceMode ? 'warning' : 'success'}>
            {isMaintenanceMode ? 'MAINTENANCE' : 'ONLINE'}
          </StatusPill>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-5 bg-[#F8F9FA] rounded-2xl border border-gray-200">
          {/* Left Side - Status Info */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${
                isMaintenanceMode
                  ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#EAF6F0] border-[#CBEAD9] text-[#047857]'
              }`}
            >
              {isMaintenanceMode ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <CheckCircle className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-0.5">
                {isMaintenanceMode ? 'Maintenance Mode is ON' : 'System is Online'}
              </h3>
              <p className="text-sm text-gray-600">
                {isMaintenanceMode
                  ? 'Regular users cannot access the system'
                  : 'All users can access the system normally'}
              </p>
            </div>
          </div>

          {/* Right Side - Toggle Switch */}
          <div className="flex items-center sm:flex-col sm:items-end gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={isMaintenanceMode}
              aria-label="Toggle maintenance mode"
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-20 h-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isMaintenanceMode
                  ? 'bg-[#E59500] focus:ring-[#E59500]'
                  : 'bg-gray-300 focus:ring-[#047857]'
              } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`absolute top-1 transition-all duration-200 w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center ${
                  isMaintenanceMode ? 'right-1' : 'left-1'
                }`}
              >
                {toggling ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : isMaintenanceMode ? (
                  <Power className="w-4 h-4 text-[#92400E]" />
                ) : (
                  <Power className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            <span
              className={`text-xs font-semibold ${
                isMaintenanceMode ? 'text-[#92400E]' : 'text-gray-600'
              }`}
            >
              {toggling ? 'Processing...' : isMaintenanceMode ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </EditorialCard>

      {/* Reason Input (when enabling) */}
      {showReasonInput && !isMaintenanceMode && (
        <EditorialCard
          title="Reason for Maintenance"
          subtitle="This message will be visible to users on the maintenance page (optional)"
        >
          <div className="space-y-4">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] resize-none text-sm text-gray-900"
              rows={3}
              placeholder="e.g., System upgrade, Database maintenance, Bug fixes, Security patches..."
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReasonInput(false);
                  setReason('');
                }}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggle}
                disabled={toggling}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#E59500] hover:bg-[#D48800] text-gray-900 transition-colors inline-flex items-center justify-center gap-2 ${
                  toggling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {toggling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>Confirm Enable Maintenance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </EditorialCard>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#92400E]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">User Impact</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Regular users will be blocked from accessing the system
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-[#047857]" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Admin Access</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Super Admins maintain full system access during maintenance
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-sky-700" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">Audit Trail</h4>
              <p className="text-xs sm:text-sm text-gray-600">
                All maintenance actions are logged for security audit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Guide */}
      <EditorialCallout tone="neutral" title="How Maintenance Mode Works:">
        Regular users see a maintenance page with your message, while Super Admins can still log in and manage the platform. All toggle events are recorded in the activity audit log.
      </EditorialCallout>
    </div>
  );
};

export default MaintenanceToggle;
