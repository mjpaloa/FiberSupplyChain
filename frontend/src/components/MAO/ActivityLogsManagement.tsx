import React, { useState, useEffect } from 'react';
import { Activity, Search, Globe, Monitor, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

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

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit: 50 };
      if (searchTerm) params.search = searchTerm;
      if (userTypeFilter) params.userType = userTypeFilter;
      if (actionTypeFilter) params.actionType = actionTypeFilter;
      const response = await axios.get(`${API_URL}/activity-logs`, { headers: getAuthHeaders(), params });
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.totalPages);
      setTotalLogs(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };


  const getActionTypeColor = (actionType: string) => {
    const colors: Record<string, string> = {
      auth: 'bg-blue-100 text-blue-800', create: 'bg-green-100 text-green-800', read: 'bg-gray-100 text-gray-800',
      update: 'bg-yellow-100 text-yellow-800', delete: 'bg-red-100 text-red-800', system: 'bg-purple-100 text-purple-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const getUserTypeColor = (userType: string) => {
    const colors: Record<string, string> = {
      officer: 'bg-indigo-100 text-indigo-800', farmer: 'bg-green-100 text-green-800',
      buyer: 'bg-orange-100 text-orange-800', association_officer: 'bg-purple-100 text-purple-800',
    };
    return colors[userType] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Activity Logs & Security</h2>
            </div>
          </div>
          <button onClick={fetchActivityLogs}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..."
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Types</option>
                  <option value="officer">Officer</option>
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="association_officer">Association Officer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <select value={actionTypeFilter} onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
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

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Activity className="h-12 w-12 mb-4" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP/MAC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.log_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{log.user_name}</span>
                              <span className="text-xs text-gray-500">{log.user_email}</span>
                              <span className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full w-fit ${getUserTypeColor(log.user_type || '')}`}>
                                {log.user_type || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-1">
                              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full w-fit ${getActionTypeColor(log.action_type)}`}>
                                {log.action_type}
                              </span>
                              <span className="text-sm">{log.action}</span>
                              <span className="text-xs text-gray-500">{log.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <Globe className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{log.ip_address}</span>
                              </div>
                              {log.mac_address && (
                                <div className="flex items-center space-x-2">
                                  <Monitor className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs text-gray-500">{log.mac_address}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.success ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-gray-700">Page {currentPage} of {totalPages} ({totalLogs} total logs)</p>
                  <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                      className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                      className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default ActivityLogsManagement;
