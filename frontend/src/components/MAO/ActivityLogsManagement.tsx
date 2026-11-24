import React, { useState, useEffect } from 'react';
import { Activity, Search, Globe, Monitor, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { EditorialCard, StatusPill } from '../Shared/EditorialUI';

const ActivityLogsManagement: React.FC = () => {
  const [activeTab] = useState<'logs'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const API_URL = 'https://fibersupplychain.onrender.com/api';

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, searchTerm, userTypeFilter, actionTypeFilter]);

  const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const fetchActivityLogs = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: String(currentPage),
        limit: '50',
      });
      if (searchTerm) searchParams.set('search', searchTerm);
      if (userTypeFilter) searchParams.set('userType', userTypeFilter);
      if (actionTypeFilter) searchParams.set('actionType', actionTypeFilter);

      const response = await fetch(`${API_URL}/activity-logs?${searchParams.toString()}`, {
        headers: getAuthHeaders(),
        cache: forceRefresh ? 'reload' : 'default',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalLogs(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };


  const getActionTypeTone = (actionType: string): 'info' | 'success' | 'neutral' | 'warning' | 'danger' => {
    const tones: Record<string, 'info' | 'success' | 'neutral' | 'warning' | 'danger'> = {
      auth: 'info',
      create: 'success',
      read: 'neutral',
      update: 'warning',
      delete: 'danger',
      system: 'info',
    };
    return tones[actionType] || 'neutral';
  };

  const getUserTypeTone = (userType: string): 'info' | 'success' | 'warning' | 'neutral' => {
    const tones: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
      officer: 'info',
      farmer: 'success',
      buyer: 'warning',
      association_officer: 'info',
    };
    return tones[userType] || 'neutral';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <EditorialCard
        title="Activity Logs & Security"
        subtitle="Audit trail of system authentication and data actions"
        badge={totalLogs}
        actions={
          <button
            type="button"
            onClick={() => fetchActivityLogs(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        }
        noPadding
      >
        {/* Filter Controls */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-[#FAFAFA]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user, action, IP..."
                  className="pl-10 w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">User Type</label>
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              >
                <option value="">All Types</option>
                <option value="officer">Officer</option>
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="association_officer">Association Officer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Action Type</label>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] text-sm"
              >
                <option value="">All Actions</option>
                <option value="auth">Authentication</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-7 w-7 text-[#047857] animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Activity className="h-10 w-10 text-gray-400 mb-3" />
            <p className="font-serif text-base font-bold text-gray-900">No activity logs found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Activity logs table">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP / MAC</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-gray-900">{log.user_name}</span>
                          <span className="text-xs text-gray-500">{log.user_email}</span>
                          <div className="mt-0.5">
                            <StatusPill tone={getUserTypeTone(log.user_type || '')}>
                              {log.user_type || 'Unknown'}
                            </StatusPill>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div>
                            <StatusPill tone={getActionTypeTone(log.action_type)}>
                              {log.action_type}
                            </StatusPill>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">{log.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 tabular-nums">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{log.ip_address}</span>
                          </div>
                          {log.mac_address && (
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500">{log.mac_address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill tone={log.success ? 'success' : 'danger'}>
                          {log.success ? 'Success' : 'Failed'}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-[#FAFAFA] px-5 sm:px-6 py-4">
              <p className="text-xs sm:text-sm text-gray-600 tabular-nums">
                Page {currentPage} of {totalPages} ({totalLogs} total logs)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="p-2 bg-white border border-gray-300 text-gray-700 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="p-2 bg-white border border-gray-300 text-gray-700 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </EditorialCard>
    </div>
  );
};

export default ActivityLogsManagement;
