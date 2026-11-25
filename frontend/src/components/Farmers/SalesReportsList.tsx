import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import { FileText, Calendar, Banknote, Package, Plus, Search, Edit, Trash2, Eye, X, Filter } from 'lucide-react';
import SalesReportForm from './SalesReportForm';
import { getUserData } from '../../utils/authToken';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface SalesReport {
  report_id: string;
  report_month: string;
  abaca_type: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  buyer_company_name: string;
  payment_method: string;
  payment_status: string;
  status: string;
  submitted_at: string;
  sale_date: string;
  delivery_location: string;
  shipping_fee: number;
  quality_notes: string;
  other_comments: string;
}

interface SalesReportsListProps {
  onAddNewReport?: () => void;
}

export const SalesReportsList: React.FC<SalesReportsListProps> = () => {
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null);
  const [viewMode, setViewMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadFarmerReports();
  }, []);

  const loadFarmerReports = async () => {
    try {
      setLoading(true);
      
      // Get the actual farmer ID from authenticated user data
      const userData = getUserData();
      console.log('🔍 User data from localStorage:', userData);
      console.log('🔍 User data keys:', userData ? Object.keys(userData) : 'No user data');
      
      // Check multiple possible farmer ID fields
      const farmerId = userData?.farmer_id || userData?.id || userData?.user_id || userData?.farmerId;
      
      // Log all possible ID fields for debugging
      console.log('🔍 Checking ID fields:', {
        farmer_id: userData?.farmer_id,
        id: userData?.id,
        user_id: userData?.user_id,
        farmerId: userData?.farmerId,
        finalFarmerId: farmerId,
        allUserData: userData
      });
      
      if (!userData || !farmerId) {
        console.error('❌ No authenticated farmer found. User data:', userData);
        console.error('❌ Available fields:', userData ? Object.keys(userData) : 'No user data');
        setReports([]);
        return;
      }
      
      console.log('✅ Using farmer ID:', farmerId);
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/sales/farmer-reports/${farmerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON response');
      }

      const result = await response.json();
      
      if (result.success) {
        setReports(result.reports || []);
      }
    } catch (error) {
      console.error('❌ Error loading farmer reports:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        userData: getUserData(),
        apiUrl: API_BASE_URL
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      report.buyer_company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.abaca_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddNew = () => {
    setSelectedReport(null);
    setViewMode('add');
    setShowForm(true);
  };

  const handleEdit = (report: SalesReport) => {
    setSelectedReport(report);
    setViewMode('edit');
    setShowForm(true);
  };

  const handleView = (report: SalesReport) => {
    setSelectedReport(report);
    setViewMode('view');
    setShowForm(true);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/delete-report/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      const result = await response.json();

      if (result.success) {
        alert('Report deleted successfully!');
        loadFarmerReports(); // Reload the list
      } else {
        alert('Failed to delete report: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error deleting report. Please try again.');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedReport(null);
    setViewMode(null);
  };

  const handleFormSubmit = (data: any) => {
    console.log('Form submitted:', data);
    closeForm();
    loadFarmerReports(); // Reload data
  };

  const stats = {
    total: reports.length,
    totalRevenue: reports.reduce((sum, report) => sum + (report.total_amount || 0), 0),
    totalSold: reports.reduce((sum, report) => sum + (report.quantity_sold || 0), 0),
    pending: reports.filter(r => r.status === 'pending').length,
    approved: reports.filter(r => r.status === 'approved').length,
  };

  if (loading) {
    return (
      <EditorialCard>
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-2 border-[#047857] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Loading sales reports...</p>
        </div>
      </EditorialCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Revenue',
            value: `₱${stats.totalRevenue.toLocaleString()}`,
            subtext: 'Reported sales'
          },
          {
            label: 'Total Abaca Sold',
            value: `${stats.totalSold.toLocaleString()} kg`,
            subtext: `From ${stats.total} report${stats.total !== 1 ? 's' : ''}`
          },
          { label: 'Pending Review', value: stats.pending, subtext: 'Awaiting approval' },
          { label: 'Approved Reports', value: stats.approved, subtext: 'Verified by MAO' }
        ]}
      />

      {/* Filter & Add Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by buyer, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter sales reports by status"
              className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer font-medium text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddNew}
            className="px-5 py-2.5 text-sm bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sales Report</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <EditorialCard noPadding>
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-serif text-lg font-bold text-gray-900">No sales reports found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first sales report to get started'}
            </p>
            <button
              type="button"
              onClick={handleAddNew}
              className="mt-5 px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Sales reports table">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Report Period
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Abaca Type/Grade
                      </div>
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity (kg)
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredReports
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((report) => (
                      <tr key={report.report_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-sm text-gray-900">{report.report_month}</div>
                          <div className="text-xs text-gray-500">
                            Sale: {new Date(report.sale_date).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                          {report.abaca_type}
                        </td>

                        <td className="px-5 py-3.5 text-sm font-medium text-gray-900 tabular-nums">
                          {report.quantity_sold.toLocaleString()} kg
                        </td>

                        <td className="px-5 py-3.5 text-sm font-medium text-gray-700 tabular-nums">
                          ₱{report.unit_price.toLocaleString()}/kg
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[#047857] text-sm tabular-nums">
                            ₱{report.total_amount?.toLocaleString() || '0'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-sm">
                          <div className="font-medium text-gray-900">{report.buyer_company_name}</div>
                          <div className="text-xs text-gray-500">{report.delivery_location || 'No location'}</div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <StatusPill
                            tone={
                              report.status === 'approved'
                                ? 'success'
                                : report.status === 'pending'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </StatusPill>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleView(report)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {report.status !== 'approved' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(report)}
                                  className="p-2 text-[#92400E] hover:bg-[#FEF3C7] rounded-xl transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(report.report_id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white border-t border-gray-100 px-5 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-gray-500">Entries:</span>
                  <div className="flex gap-1.5">
                    {[10, 20, 50].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          itemsPerPage === size
                            ? 'bg-[#E59500] text-gray-900'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 tabular-nums">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} entries
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(Math.ceil(filteredReports.length / itemsPerPage), prev + 1)
                        )
                      }
                      disabled={currentPage >= Math.ceil(filteredReports.length / itemsPerPage)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </EditorialCard>

      {/* Floating Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100 z-10">
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">
                  {viewMode === 'add'
                    ? 'Add New Sales Report'
                    : viewMode === 'edit'
                      ? 'Edit Sales Report'
                      : 'View Sales Report'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Monthly abaca fiber sales record</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close sales report modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {viewMode === 'view' ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Report Status</h4>
                      <StatusPill
                        tone={
                          selectedReport?.status === 'approved'
                            ? 'success'
                            : selectedReport?.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {selectedReport?.status
                          ? selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)
                          : 'N/A'}
                      </StatusPill>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-medium text-gray-500">Submitted</h4>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedReport?.submitted_at ? new Date(selectedReport.submitted_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Report Period & Date */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#047857]" />
                      Report Period & Date
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Report Month</label>
                        <p className="text-base font-bold text-gray-900 mt-1">{selectedReport?.report_month || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Sale Date</label>
                        <p className="text-base font-bold text-gray-900 mt-1">
                          {selectedReport?.sale_date
                            ? new Date(selectedReport.sale_date + 'T00:00:00').toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#047857]" />
                      Product Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Abaca Type/Grade</label>
                        <p className="text-sm font-bold text-gray-900 mt-1">{selectedReport?.abaca_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Quantity Sold</label>
                        <p className="text-sm font-bold text-gray-900 mt-1 tabular-nums">
                          {selectedReport?.quantity_sold?.toLocaleString() || '0'} kg
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Unit Price</label>
                        <p className="text-sm font-bold text-gray-900 mt-1 tabular-nums">
                          ₱{selectedReport?.unit_price?.toLocaleString() || '0'}/kg
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Total Amount</label>
                        <p className="text-base font-bold text-[#047857] mt-1 tabular-nums">
                          ₱{selectedReport?.total_amount?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction & Payment Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-[#E59500]" />
                      Transaction & Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Buyer / Company Name</label>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            {selectedReport?.buyer_company_name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Delivery Location</label>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {selectedReport?.delivery_location || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Payment Method</label>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                            {selectedReport?.payment_method ? selectedReport.payment_method.replace('_', ' ') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Payment Status</label>
                          <StatusPill
                            tone={
                              selectedReport?.payment_status === 'paid'
                                ? 'success'
                                : selectedReport?.payment_status === 'pending'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {selectedReport?.payment_status
                              ? selectedReport.payment_status.charAt(0).toUpperCase() + selectedReport.payment_status.slice(1)
                              : 'N/A'}
                          </StatusPill>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Comments */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      Notes & Comments
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Quality Notes</label>
                        <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 p-3.5 rounded-xl mt-1.5 min-h-[56px]">
                          {selectedReport?.quality_notes || 'No quality notes provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Other Comments</label>
                        <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 p-3.5 rounded-xl mt-1.5 min-h-[56px]">
                          {selectedReport?.other_comments || 'No additional comments'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('edit');
                      }}
                      className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Report
                    </button>
                  </div>
                </div>
              ) : (
                <SalesReportForm
                  onSubmit={handleFormSubmit}
                  onCancel={closeForm}
                  initialData={selectedReport}
                  isEditMode={viewMode === 'edit'}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReportsList;
