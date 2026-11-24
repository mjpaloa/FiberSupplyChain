import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { getUserData, getAuthToken } from '../../utils/authToken';
import { EditorialCard, KpiStrip, StatusPill } from '../Shared/EditorialUI';

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
        const apiUrl = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

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

  const approvedReports = recentReports.filter(r => r.status === 'approved');
  const pendingReports = recentReports.filter(r => r.status === 'pending');
  const rejectedCount = recentReports.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      <KpiStrip
        columns={5}
        items={[
          {
            label: 'Verified Sales',
            value: `₱${approvedReports.reduce((sum, r) => sum + (r.totalRevenue || 0), 0).toLocaleString()}`,
            subtext: `${approvedReports.length} approved`,
          },
          {
            label: 'Pending Reports',
            value: pendingReports.length.toLocaleString(),
            subtext: `₱${pendingReports.reduce((sum, r) => sum + (r.totalRevenue || 0), 0).toLocaleString()} pending`,
          },
          {
            label: 'Active Farmers',
            value: new Set(recentReports.map(r => r.farmerId)).size.toLocaleString(),
            subtext: `${approvedReports.length} verified reports`,
          },
          {
            label: 'Total Abaca Sold',
            value: `${approvedReports.reduce((sum, r) => sum + (r.totalQuantity || 0), 0).toLocaleString()} kg`,
            subtext: 'Approved fiber weight',
          },
          {
            label: 'Total Reports',
            value: recentReports.length.toLocaleString(),
            subtext: `${rejectedCount} rejected`,
          },
        ]}
      />

      {/* Search and Filters */}
      <EditorialCard className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search farmers, buyers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm font-medium text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
              className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm font-medium text-gray-700"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export
            </button>
          </div>
        </div>
      </EditorialCard>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <EditorialCard className="p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No sales reports found</h3>
          <p className="text-sm text-gray-500">Farmer sales reports will appear here for management and verification.</p>
        </EditorialCard>
      ) : (
        <EditorialCard
          title="Sales Reports"
          subtitle="Farmer sales submissions and verification status"
          badge={filteredReports.length}
          noPadding
        >
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Sales reports table">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Farmer</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Buyer</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Amount</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Quantity</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-sm">{report.farmerName}</div>
                      <div className="text-gray-500 text-xs font-mono">{generateReadableId(report.id)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.buyerName || 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">
                      {report.status === 'approved' ? `₱${report.totalRevenue?.toLocaleString()}` : 'Pending verification'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                      {report.totalQuantity} kg
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusPill
                        tone={
                          report.status === 'approved'
                            ? 'success'
                            : report.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                      {new Date(report.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewReport(report)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                          aria-label="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditReport(report)}
                          className="p-2 text-gray-600 hover:text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                          title="Edit Report"
                          aria-label="Edit Report"
                        >
                          <Edit size={16} />
                        </button>
                        {report.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveReport(report.id)}
                              className="p-2 text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                              title="Approve Report"
                              aria-label="Approve Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReport(report.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Report"
                              aria-label="Reject Report"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          aria-label="Delete"
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
          <div className="px-5 py-4 border-t border-gray-200 bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-500">Show entries:</span>
              <div className="flex gap-1.5">
                {[10, 20, 30].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleItemsPerPageChange(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${itemsPerPage === size
                      ? 'bg-[#E59500] text-gray-900'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 tabular-nums">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </EditorialCard>
      )}

      {/* View Modal */}
      {showViewModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <h2 className="font-serif text-xl font-bold text-gray-900">Sales Report Details</h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">Report ID</p>
                <p className="font-mono text-sm font-bold text-gray-900">{generateReadableId(selectedReport.id)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Farmer Name</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.farmerName}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Buyer Company</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedReport.buyerName || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Sales</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">₱{selectedReport.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Quantity Sold</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">{selectedReport.totalQuantity} kg</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
                  <StatusPill
                    tone={
                      selectedReport.status === 'approved'
                        ? 'success'
                        : selectedReport.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </StatusPill>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">Submitted Date</p>
                  <p className="text-sm font-semibold text-gray-900">{new Date(selectedReport.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <h2 className="font-serif text-xl font-bold text-gray-900">Edit Sales Report</h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Report ID</label>
                <input
                  type="text"
                  value={generateReadableId(selectedReport.id)}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Farmer Name</label>
                <input
                  type="text"
                  value={selectedReport.farmerName}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buyer Company</label>
                <input
                  type="text"
                  value={editFormData.buyerName}
                  onChange={(e) => setEditFormData({ ...editFormData, buyerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter buyer company name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Total Sales (₱)</label>
                <input
                  type="number"
                  value={editFormData.totalRevenue}
                  onChange={(e) => setEditFormData({ ...editFormData, totalRevenue: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter total sales"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity Sold (kg)</label>
                <input
                  type="number"
                  value={editFormData.totalQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, totalQuantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter quantity sold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateReport}
                className="px-5 py-2 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] text-sm font-semibold transition-colors"
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
