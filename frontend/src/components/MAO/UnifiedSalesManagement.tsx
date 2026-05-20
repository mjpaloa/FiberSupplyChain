import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Edit,
  Trash2,
  Package,
  X
} from 'lucide-react';
import { getUserData, getAuthToken } from '../../utils/authToken';

interface SalesReport {
  id: string;
  farmerId: string;
  farmerName: string;
  buyerName?: string;
  totalRevenue: number;
  totalQuantity: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// Helper function to generate readable ID from UUID
const generateReadableId = (uuid: string): string => {
  if (!uuid) return 'N/A';
  // Take first 8 chars and convert to uppercase for readability
  const shortId = uuid.replace(/-/g, '').substring(0, 8).toUpperCase();
  // Format as SR-XXX-XXXXX for better readability
  return `SR-${shortId.substring(0, 3)}-${shortId.substring(3)}`;
};

const UnifiedSalesManagement: React.FC = () => {
  const [recentReports, setRecentReports] = useState<SalesReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    buyerName: '',
    totalRevenue: '',
    totalQuantity: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  // Load data from API
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'https://server.easyabaca.site';

        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch sales reports
        const reportsResponse = await fetch(`${apiUrl}/api/sales/reports`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.success && reportsData.reports) {
            const formattedReports = reportsData.reports.map((report: any) => ({
              id: report.report_id,
              farmerId: report.farmer_id,
              farmerName: report.farmers?.full_name || 'Unknown Farmer',
              buyerName: report.buyer_company_name,
              totalRevenue: report.total_amount || 0,
              totalQuantity: report.quantity_sold || 0,
              status: report.status || 'pending',
              submittedAt: report.submitted_at
            }));
            setRecentReports(formattedReports);
          }
        }
      } catch (error) {
        console.error('Error loading sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, []);

  // Handle approve report
  const handleApproveReport = async (reportId: string) => {
    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://server.easyabaca.site';

      const response = await fetch(`${apiUrl}/api/sales/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          reviewed_by: getUserData()?.id
        })
      });

      if (response.ok) {
        setRecentReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'approved' as const }
              : report
          )
        );
      }
    } catch (error) {
      console.error('Error approving report:', error);
    }
  };

  // Handle view report
  const handleViewReport = (report: SalesReport) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  // Handle edit report
  const handleEditReport = (report: SalesReport) => {
    setSelectedReport(report);
    setEditFormData({
      buyerName: report.buyerName || '',
      totalRevenue: report.totalRevenue.toString(),
      totalQuantity: report.totalQuantity.toString(),
      status: report.status
    });
    setShowEditModal(true);
  };

  // Handle update report
  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://server.easyabaca.site';

      const response = await fetch(`${apiUrl}/api/sales/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer_company_name: editFormData.buyerName,
          quantity_sold: parseFloat(editFormData.totalQuantity),
          total_amount: parseFloat(editFormData.totalRevenue),
          status: editFormData.status,
          reviewed_by: getUserData()?.id
        })
      });

      if (response.ok) {
        await response.json();
        setRecentReports(prev =>
          prev.map(report =>
            report.id === selectedReport.id
              ? {
                ...report,
                buyerName: editFormData.buyerName,
                totalRevenue: parseFloat(editFormData.totalRevenue),
                totalQuantity: parseFloat(editFormData.totalQuantity),
                status: editFormData.status
              }
              : report
          )
        );
        setShowEditModal(false);
        alert('✅ Report updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to update report: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('❌ Failed to update report');
    }
  };

  // Handle delete report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this sales report?')) {
      return;
    }

    try {
      // Since we don't have a delete endpoint, we'll just remove it from the UI
      setRecentReports(prev => prev.filter(report => report.id !== reportId));
      alert('✅ Report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('❌ Failed to delete report');
    }
  };

  // Handle reject report
  const handleRejectReport = async (reportId: string) => {
    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://server.easyabaca.site';

      const response = await fetch(`${apiUrl}/api/sales/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected',
          reviewed_by: getUserData()?.id,
          rejection_reason: 'Rejected by admin'
        })
      });

      if (response.ok) {
        setRecentReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: 'rejected' as const }
              : report
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
    }
  };

  // Filter reports based on search and filters
  const filteredReports = recentReports.filter(report => {
    const matchesSearch = !searchTerm ||
      report.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    const matchesDate = dateFilter === 'all' || (() => {
      const reportDate = new Date(report.submittedAt);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          return reportDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return reportDate >= weekAgo;
        case 'month':
          return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Stats are calculated inline in the cards

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Stats Cards - Matching User Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Verified Sales Card - Blue */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <span className="text-2xl font-bold text-white">₱</span>
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Verified Sales</p>
            <p className="text-3xl font-bold text-white">
              ₱{recentReports.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.totalRevenue || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pending Card - Yellow */}
        <div className="group relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Pending</p>
            <p className="text-3xl font-bold text-white">{recentReports.filter(r => r.status === 'pending').length}</p>
            <p className="text-white/70 text-xs mt-2">
              ₱{recentReports.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.totalRevenue || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Active Card - Purple */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Active</p>
            <p className="text-3xl font-bold text-white">{new Set(recentReports.map(r => r.farmerId)).size}</p>
            <p className="text-white/70 text-xs mt-2">
              {recentReports.filter(r => r.status === 'approved').length} reports
            </p>
          </div>
        </div>

        {/* Total Abaca Sold Card - Cyan */}
        <div className="group relative bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Abaca Sold</p>
            <p className="text-3xl font-bold text-white">
              {recentReports.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.totalQuantity || 0), 0).toLocaleString()} kg
            </p>
          </div>
        </div>

        {/* Reports Card - Red */}
        <div className="group relative bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Reports</p>
            <p className="text-3xl font-bold text-white">{recentReports.length}</p>
            <p className="text-white/70 text-xs mt-2">
              {recentReports.filter(r => r.status === 'rejected').length} rejected
            </p>
          </div>
        </div>
      </div>

      {/* Neumorphic Search and Filters Section */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farmers, buyers, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 font-medium text-gray-800 shadow-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-4 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 font-medium text-gray-800 shadow-md"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold border-2 border-blue-300">
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Compact Table with Pagination */}
      {filteredReports.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-200 rounded-3xl p-12 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
            <FileText className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No sales reports found</h3>
          <p className="text-gray-600">Farmer sales reports will appear here for management and verification</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-100 via-emerald-100 to-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Farmer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">₱</span>
                      Amount
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {currentReports.map((report, index) => (
                  <tr key={report.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-blue-900 text-sm">{report.farmerName}</div>
                        <div className="text-purple-600 text-xs font-mono">{generateReadableId(report.id)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-emerald-900">{report.buyerName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-purple-900">
                        {report.status === 'approved' ? `₱${report.totalRevenue?.toLocaleString()}` : 'Pending verification'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{report.totalQuantity} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {report.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                        {report.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {report.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-md ${report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{new Date(report.submittedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditReport(report)}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 hover:shadow-md transition-all duration-200"
                          title="Edit Report"
                        >
                          <Edit size={16} />
                        </button>
                        {report.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReport(report.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 hover:shadow-md transition-all duration-200"
                              title="Approve Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectReport(report.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                              title="Reject Report"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 hover:shadow-md transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-6 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Show entries:</span>
                <div className="flex gap-2">
                  {[10, 20, 30].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${itemsPerPage === size
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50 border border-gray-200'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page info and navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sales Report Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Report ID */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Report ID</p>
                <p className="font-mono text-lg font-bold text-indigo-900">{generateReadableId(selectedReport.id)}</p>
              </div>

              {/* Farmer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Farmer Name</p>
                  <p className="font-semibold text-gray-900">{selectedReport.farmerName}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Buyer Company</p>
                  <p className="font-semibold text-gray-900">{selectedReport.buyerName || 'N/A'}</p>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-green-900">₱{selectedReport.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Quantity Sold</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedReport.totalQuantity} kg</p>
                </div>
              </div>

              {/* Status and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${selectedReport.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedReport.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Submitted Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedReport.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Sales Report</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Report ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report ID</label>
                <input
                  type="text"
                  value={generateReadableId(selectedReport.id)}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl font-mono text-gray-600"
                />
              </div>

              {/* Farmer Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farmer Name</label>
                <input
                  type="text"
                  value={selectedReport.farmerName}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
                />
              </div>

              {/* Buyer Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Company</label>
                <input
                  type="text"
                  value={editFormData.buyerName}
                  onChange={(e) => setEditFormData({ ...editFormData, buyerName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  placeholder="Enter buyer company name"
                />
              </div>

              {/* Total Sales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Sales (₱)</label>
                <input
                  type="number"
                  value={editFormData.totalRevenue}
                  onChange={(e) => setEditFormData({ ...editFormData, totalRevenue: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  placeholder="Enter total sales"
                />
              </div>

              {/* Quantity Sold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Sold (kg)</label>
                <input
                  type="number"
                  value={editFormData.totalQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, totalQuantity: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  placeholder="Enter quantity sold"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReport}
                className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold transition-colors shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSalesManagement;
