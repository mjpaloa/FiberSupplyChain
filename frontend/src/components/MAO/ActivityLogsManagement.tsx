import React, { useState, useEffect } from 'react';
import { Activity, Shield, Ban, Search, Globe, Monitor, CheckCircle, XCircle, Clock, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import axios from 'axios';

const ActivityLogsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'blocked-ips' | 'blocked-macs'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [blockedMACs, setBlockedMACs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockType, setBlockType] = useState<'ip' | 'mac'>('ip');
  const [blockForm, setBlockForm] = useState({ address: '', reason: '', isPermanent: false, expiresAt: '', notes: '' });

  const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

  useEffect(() => {
    if (activeTab === 'logs') fetchActivityLogs();
    else if (activeTab === 'blocked-ips') fetchBlockedIPs();
    else if (activeTab === 'blocked-macs') fetchBlockedMACs();
  }, [activeTab, currentPage, searchTerm, userTypeFilter, actionTypeFilter]);

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

  const fetchBlockedIPs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/activity-logs/blocked/ips`, { headers: getAuthHeaders() });
      setBlockedIPs(response.data.blockedIPs);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedMACs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/activity-logs/blocked/macs`, { headers: getAuthHeaders() });
      setBlockedMACs(response.data.blockedMACs);
    } catch (error) {
      console.error('Error fetching blocked MACs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockAddress = async () => {
    if (!blockForm.address || !blockForm.reason) {
      alert('Address and reason are required');
      return;
    }
    try {
      const endpoint = blockType === 'ip' ? `${API_URL}/activity-logs/blocked/ips` : `${API_URL}/activity-logs/blocked/macs`;
      const payload = {
        [blockType === 'ip' ? 'ipAddress' : 'macAddress']: blockForm.address,
        reason: blockForm.reason,
        isPermanent: blockForm.isPermanent,
        expiresAt: blockForm.isPermanent ? null : blockForm.expiresAt || null,
        notes: blockForm.notes || null,
      };
      await axios.post(endpoint, payload, { headers: getAuthHeaders() });
      alert(`${blockType.toUpperCase()} address blocked successfully`);
      setShowBlockModal(false);
      setBlockForm({ address: '', reason: '', isPermanent: false, expiresAt: '', notes: '' });
      if (blockType === 'ip') fetchBlockedIPs();
      else fetchBlockedMACs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to block address');
    }
  };

  const handleUnblock = async (blockId: string, type: 'ip' | 'mac') => {
    if (!confirm(`Are you sure you want to unblock this ${type.toUpperCase()} address?`)) return;
    try {
      await axios.put(`${API_URL}/activity-logs/blocked/${type}s/${blockId}`, { reason: 'Unblocked by admin' }, { headers: getAuthHeaders() });
      alert(`${type.toUpperCase()} address unblocked successfully`);
      if (type === 'ip') fetchBlockedIPs();
      else fetchBlockedMACs();
    } catch (error) {
      alert(`Failed to unblock ${type.toUpperCase()} address`);
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
              <p className="text-gray-600">Monitor user activities and manage blocked addresses</p>
            </div>
          </div>
          <button onClick={() => { if (activeTab === 'logs') fetchActivityLogs(); else if (activeTab === 'blocked-ips') fetchBlockedIPs(); else fetchBlockedMACs(); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'logs', label: 'Activity Logs', icon: Activity, count: totalLogs },
              { id: 'blocked-ips', label: 'Blocked IPs', icon: Globe, count: blockedIPs.filter(ip => ip.is_active).length },
              { id: 'blocked-macs', label: 'Blocked MACs', icon: Monitor, count: blockedMACs.filter(mac => mac.is_active).length },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center space-x-2">
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${tab.id === 'logs' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'logs' && (
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
        )}

        {activeTab === 'blocked-ips' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setBlockType('ip'); setShowBlockModal(true); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
                <Ban className="h-5 w-5" />
                <span>Block IP Address</span>
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : blockedIPs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Shield className="h-12 w-12 mb-4" />
                <p>No blocked IP addresses</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {blockedIPs.map((block) => (
                  <div key={block.block_id} className={`border rounded-lg p-4 ${!block.is_active ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <span className="text-lg font-semibold">{block.ip_address}</span>
                          {block.is_permanent && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Permanent</span>}
                          {!block.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-1"><strong>Reason:</strong> {block.reason}</p>
                        <p className="text-xs text-gray-500">Blocked by {block.blocker?.full_name} on {formatDate(block.blocked_at)}</p>
                      </div>
                      {block.is_active && (
                        <button onClick={() => handleUnblock(block.block_id, 'ip')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Unblock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'blocked-macs' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setBlockType('mac'); setShowBlockModal(true); }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
                <Ban className="h-5 w-5" />
                <span>Block MAC Address</span>
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : blockedMACs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Shield className="h-12 w-12 mb-4" />
                <p>No blocked MAC addresses</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {blockedMACs.map((block) => (
                  <div key={block.block_id} className={`border rounded-lg p-4 ${!block.is_active ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Monitor className="h-5 w-5 text-gray-400" />
                          <span className="text-lg font-semibold">{block.mac_address}</span>
                          {block.is_permanent && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Permanent</span>}
                          {!block.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>}
                        </div>
                        <p className="text-sm text-gray-700 mb-1"><strong>Reason:</strong> {block.reason}</p>
                        <p className="text-xs text-gray-500">Blocked by {block.blocker?.full_name} on {formatDate(block.blocked_at)}</p>
                      </div>
                      {block.is_active && (
                        <button onClick={() => handleUnblock(block.block_id, 'mac')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Unblock
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Block {blockType.toUpperCase()} Address</h3>
              <button onClick={() => setShowBlockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{blockType.toUpperCase()} Address *</label>
                <input type="text" value={blockForm.address} onChange={(e) => setBlockForm({ ...blockForm, address: e.target.value })}
                  placeholder={blockType === 'ip' ? '192.168.1.1' : '00:00:00:00:00:00'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="Enter reason for blocking..." rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={blockForm.isPermanent} onChange={(e) => setBlockForm({ ...blockForm, isPermanent: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700">Permanent Block</span>
                </label>
              </div>
              {!blockForm.isPermanent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expires At</label>
                  <input type="datetime-local" value={blockForm.expiresAt} onChange={(e) => setBlockForm({ ...blockForm, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea value={blockForm.notes} onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                  placeholder="Additional notes..." rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button onClick={() => setShowBlockModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleBlockAddress}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Block Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsManagement;
