import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, Power, Shield, Users, Activity } from 'lucide-react';

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
      const response = await fetch('https://server.easyabaca.site/api/maintenance/status');
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
      const response = await fetch('https://server.easyabaca.site/api/maintenance/toggle', {
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
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            Maintenance Mode
          </h2>
          <p className="text-gray-600 mt-1 ml-13">
            Control system-wide maintenance mode
          </p>
        </div>
        
        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 ${
          isMaintenanceMode 
            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' 
            : 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
        }`}>
          <Activity className={`w-4 h-4 ${
            isMaintenanceMode ? 'animate-pulse' : ''
          }`} />
          {isMaintenanceMode ? 'MAINTENANCE' : 'ONLINE'}
        </div>
      </div>

      {/* Main Toggle Card */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        isMaintenanceMode 
          ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-amber-300 shadow-lg shadow-amber-100' 
          : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 shadow-lg shadow-emerald-100'
      }`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className={`absolute inset-0 ${
            isMaintenanceMode 
              ? 'bg-[radial-gradient(circle_at_50%_50%,_rgba(251,191,36,0.3),transparent_50%)]' 
              : 'bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.3),transparent_50%)]'
          }`}></div>
        </div>

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            {/* Left Side - Status Info */}
            <div className="flex items-center gap-6">
              {/* Icon */}
              <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isMaintenanceMode 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-300' 
                  : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-300'
              }`}>
                {isMaintenanceMode ? (
                  <AlertTriangle className="w-10 h-10 text-white animate-pulse" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-white" />
                )}
                {/* Pulse Ring */}
                {isMaintenanceMode && (
                  <div className="absolute inset-0 rounded-2xl bg-amber-500 animate-ping opacity-20"></div>
                )}
              </div>

              {/* Text */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {isMaintenanceMode ? 'Maintenance Mode is ON' : 'System is Online'}
                </h3>
                <p className="text-gray-600 text-base">
                  {isMaintenanceMode 
                    ? 'Regular users cannot access the system' 
                    : 'All users can access the system normally'}
                </p>
              </div>
            </div>

            {/* Right Side - Toggle Switch */}
            <div className="flex flex-col items-end gap-3">
              {/* Toggle Switch */}
              <button
                onClick={handleToggle}
                disabled={toggling}
                className={`relative w-24 h-12 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 ${
                  isMaintenanceMode
                    ? 'bg-amber-500 focus:ring-amber-200'
                    : 'bg-gray-300 focus:ring-emerald-200'
                } ${
                  toggling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                }`}
              >
                {/* Switch Track */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    isMaintenanceMode 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  }`}></div>
                </div>

                {/* Switch Knob */}
                <div className={`absolute top-1 transition-all duration-300 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center ${
                  isMaintenanceMode ? 'right-1' : 'left-1'
                }`}>
                  {toggling ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : isMaintenanceMode ? (
                    <Power className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Power className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Toggle Label */}
              <span className={`text-sm font-semibold ${
                isMaintenanceMode ? 'text-amber-700' : 'text-gray-500'
              }`}>
                {toggling ? 'Processing...' : isMaintenanceMode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: User Impact */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-amber-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">User Impact</h4>
              <p className="text-sm text-gray-600">
                Regular users will be blocked from accessing the system
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Admin Access */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-emerald-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Admin Access</h4>
              <p className="text-sm text-gray-600">
                Super Admins maintain full system access during maintenance
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Audit Log */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Audit Trail</h4>
              <p className="text-sm text-gray-600">
                All maintenance actions are logged for security audit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Input (when enabling) */}
      {showReasonInput && !isMaintenanceMode && (
        <div className="bg-white border-2 border-amber-300 rounded-xl p-6 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <label className="block text-base font-semibold text-gray-800">
              Reason for Maintenance
            </label>
            <span className="text-sm text-gray-500">(Optional)</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none text-gray-700"
            rows={3}
            placeholder="e.g., System upgrade, Database maintenance, Bug fixes, Security patches..."
          />
          <p className="text-xs text-gray-500">This message will be visible to users on the maintenance page</p>
        </div>
      )}

      {/* Action Buttons */}
      {showReasonInput && !isMaintenanceMode && (
        <div className="flex gap-3">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl ${
              toggling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {toggling ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Wrench className="w-5 h-5" />
                <span>Confirm Enable Maintenance</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setShowReasonInput(false);
              setReason('');
            }}
            className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-lg mb-3">How Maintenance Mode Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Regular users see a maintenance page with your message</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Super Admins can still login and access everything</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">All maintenance actions are logged for security audit</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">Simply toggle off when maintenance is complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceToggle;
