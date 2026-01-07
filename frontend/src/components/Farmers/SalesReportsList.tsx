import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Banknote, Package, Plus, Search, Edit, Trash2, Eye, X, Filter, CheckCircle, Clock } from 'lucide-react';
import SalesReportForm from './SalesReportForm';
import { getUserData } from '../../utils/authToken';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://easyabaca-api.vercel.app';
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
        apiUrl: import.meta.env.VITE_API_URL
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sales/delete-report/${reportId}`, {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="p-12 text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading sales reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Modern Stats Cards with Gradients - UserManagement Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 mb-4 sm:mb-6 md:mb-8">
        {/* Total Revenue Card */}
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Revenue
              </span>
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium mb-1">Total Revenue</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white break-all">₱{stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Abaca Sold Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Sold
              </span>
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium mb-1">Total Abaca Sold</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white break-all">{stats.totalSold.toLocaleString()}kg</p>
            <p className="text-white/70 text-xs mt-2">From {stats.total} report{stats.total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Pending
              </span>
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium mb-1">Pending Review</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{stats.pending}</p>
          </div>
        </div>

        {/* Approved Card */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Approved
              </span>
            </div>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-medium mb-1">Approved Reports</p>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">{stats.approved}</p>
          </div>
        </div>
      </div>

      {/* Modern Filters with Glassmorphism - UserManagement Style */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by buyer, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Status Filter */}
            <div className="flex-1 sm:w-auto">
              <div className="relative">
                <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✓ Approved</option>
                  <option value="rejected">✗ Rejected</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddNew}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold whitespace-nowrap group"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-200" />
              <span className="hidden sm:inline">Add Sales Report</span>
              <span className="sm:hidden">Add Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Table with Enhanced Design - UserManagement Style */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No sales reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first sales report to get started'}
            </p>
            <button
              onClick={handleAddNew}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              Create First Report
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[900px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Report Period
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Abaca Type/Grade
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Quantity (kg)
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Unit Price
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Total Amount
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Buyer
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Status
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredReports
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((report) => (
                    <tr key={report.report_id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group">
                      {/* Report Period */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div>
                            <div className="font-semibold text-xs sm:text-sm text-gray-900">{report.report_month}</div>
                            <div className="text-xs text-gray-500">Sale: {new Date(report.sale_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Abaca Type/Grade */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="font-medium text-gray-900">{report.abaca_type}</div>
                      </td>
                      
                      {/* Quantity */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="font-semibold text-gray-900">{report.quantity_sold.toLocaleString()}kg</div>
                      </td>
                      
                      {/* Unit Price */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="font-semibold text-blue-600">₱{report.unit_price.toLocaleString()}/kg</div>
                      </td>
                      
                      {/* Total Amount */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="font-bold text-emerald-600 text-base sm:text-lg">₱{report.total_amount?.toLocaleString() || '0'}</div>
                      </td>
                      
                      {/* Buyer */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="font-medium text-gray-900">{report.buyer_company_name}</div>
                        <div className="text-xs text-gray-500">{report.delivery_location || 'No location'}</div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : report.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleView(report)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md group-hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {report.status !== 'approved' && (
                            <>
                              <button
                                onClick={() => handleEdit(report)}
                                className="p-1.5 sm:p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(report.report_id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
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
            <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Entries:</span>
                  <div className="flex gap-2">
                    {[10, 20, 50].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                          itemsPerPage === size
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-emerald-50 border border-gray-200'
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredReports.length / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(filteredReports.length / itemsPerPage)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage >= Math.ceil(filteredReports.length / itemsPerPage)
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
          </>
        )}
      </div>

      {/* Floating Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                {viewMode === 'add' ? 'Add New Sales Report' :
                 viewMode === 'edit' ? 'Edit Sales Report' :
                 'View Sales Report'}
              </h3>
              <button
                onClick={closeForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-6">
              {viewMode === 'view' ? (
                <div className="space-y-6">
                  {/* Report Header - Status Badge */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600">Report Status</h4>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold mt-1 ${
                        selectedReport?.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedReport?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedReport?.status ? selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1) : 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-medium text-gray-600">Submitted</h4>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {selectedReport?.submitted_at ? new Date(selectedReport.submitted_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Report Period & Date */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Report Period & Date
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Report Month</label>
                        <p className="text-xl font-bold text-gray-900 mt-1">{selectedReport?.report_month || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sale Date</label>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {selectedReport?.sale_date ? new Date(selectedReport.sale_date + 'T00:00:00').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      Product Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Abaca Type/Grade</label>
                        <p className="text-lg font-bold text-green-700 mt-1">{selectedReport?.abaca_type || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quantity Sold</label>
                        <p className="text-lg font-bold text-gray-900 mt-1">{selectedReport?.quantity_sold?.toLocaleString() || '0'} kg</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Unit Price</label>
                        <p className="text-lg font-bold text-blue-600 mt-1">₱{selectedReport?.unit_price?.toLocaleString() || '0'}/kg</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                        <p className="text-xl font-bold text-emerald-600 mt-1">₱{selectedReport?.total_amount?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction & Payment Details */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-yellow-600" />
                      Transaction & Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Buyer/Company Name</label>
                          <p className="text-base font-semibold text-gray-900 mt-1">{selectedReport?.buyer_company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                          <p className="text-base text-gray-900 mt-1">{selectedReport?.delivery_location || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Payment Method</label>
                          <p className="text-base font-semibold text-gray-900 mt-1 capitalize">{selectedReport?.payment_method ? selectedReport.payment_method.replace('_', ' ') : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Payment Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                              selectedReport?.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              selectedReport?.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {selectedReport?.payment_status ? selectedReport.payment_status.charAt(0).toUpperCase() + selectedReport.payment_status.slice(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Comments */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Notes & Comments
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quality Notes</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg mt-2 min-h-[60px]">
                          {selectedReport?.quality_notes || 'No quality notes provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Other Comments</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg mt-2 min-h-[60px]">
                          {selectedReport?.other_comments || 'No additional comments'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={closeForm}
                      className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('edit');
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
