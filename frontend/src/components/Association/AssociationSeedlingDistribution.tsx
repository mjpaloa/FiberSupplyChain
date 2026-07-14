import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Package,
  Users,
  X,
  CheckCircle,
  Sprout,
  MapPin
} from 'lucide-react';

interface FarmerInfo {
  farmer_id: string;
  full_name: string;
  email?: string;
  contact_number?: string;
  municipality?: string;
  barangay?: string;
  association_name?: string;
}

interface AssociationDistributionSummary {
  distribution_id: string;
  variety: string;
  source_supplier?: string;
  date_distributed: string;
}

interface FarmerDistribution {
  distribution_id: string;
  variety: string;
  quantity_distributed: number;
  date_distributed: string;
  remarks?: string;
  status: string;
  planting_date?: string;
  planting_location?: string;
  planting_notes?: string;
  planted_at?: string;
  created_at: string;
  farmers?: FarmerInfo;
  association_seedling_distributions?: AssociationDistributionSummary;
}

const STATUS_LABELS: Record<string, string> = {
  distributed_to_farmer: '🌱 Distributed',
  planted: '✅ Planted',
  damaged: '❌ Damaged',
  replanted: '🔄 Replanted',
  lost: '⚠️ Lost',
  other: '📋 Other'
};

const STATUS_CLASSES: Record<string, string> = {
  distributed_to_farmer: 'bg-blue-500 text-white',
  planted: 'bg-emerald-500 text-white',
  damaged: 'bg-red-500 text-white',
  replanted: 'bg-amber-500 text-white',
  lost: 'bg-gray-600 text-white',
  other: 'bg-purple-500 text-white'
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'distributed_to_farmer', label: '🌱 Distributed' },
  { value: 'planted', label: '✅ Planted' },
  { value: 'damaged', label: '❌ Damaged' },
  { value: 'replanted', label: '🔄 Replanted' },
  { value: 'lost', label: '⚠️ Lost' }
];

const AssociationSeedlingDistribution: React.FC = () => {
  const [farmerDistributions, setFarmerDistributions] = useState<FarmerDistribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<FarmerDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<FarmerDistribution | null>(null);

  useEffect(() => {
    fetchFarmerDistributions();
  }, []);

  useEffect(() => {
    filterDistributions();
  }, [farmerDistributions, searchTerm, statusFilter]);

  const fetchFarmerDistributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      const response = await fetch(
        'https://fibersupplychain.onrender.com/api/association-seedlings/association/farmer-distributions',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch farmer distributions.');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setFarmerDistributions(data);
      } else {
        setFarmerDistributions([]);
        throw new Error('Unexpected response format from server.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load farmer distributions.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filterDistributions = () => {
    let filtered = [...farmerDistributions];
    const term = searchTerm.trim().toLowerCase();

    if (term) {
      filtered = filtered.filter((distribution) => {
        const matchesVariety = distribution.variety.toLowerCase().includes(term);
        const matchesFarmer = distribution.farmers?.full_name?.toLowerCase().includes(term);
        const matchesMunicipality = distribution.farmers?.municipality?.toLowerCase().includes(term);
        const matchesBarangay = distribution.farmers?.barangay?.toLowerCase().includes(term);
        return matchesVariety || matchesFarmer || matchesMunicipality || matchesBarangay;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((distribution) => distribution.status === statusFilter);
    }

    setCurrentPage(1);
    setFilteredDistributions(filtered);
  };

  const handleDeleteFarmerDistribution = async (distributionId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this farmer distribution record? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      const response = await fetch(
        `https://fibersupplychain.onrender.com/api/association-seedlings/association/farmer-distributions/${distributionId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to delete farmer distribution.');
      }

      alert('? Farmer distribution deleted successfully.');
      fetchFarmerDistributions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete farmer distribution.';
      alert(message);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const openViewModal = (distribution: FarmerDistribution) => {
    setSelectedDistribution(distribution);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedDistribution(null);
    setShowViewModal(false);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDistributions = filteredDistributions.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredDistributions.length / itemsPerPage));
  const showPagination = filteredDistributions.length > itemsPerPage;

  const formatDate = (value?: string) => {
    if (!value) return '�';
    return new Date(value).toLocaleDateString();
  };

  const renderStatusBadge = (status: string) => (
    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${STATUS_CLASSES[status] || 'bg-gray-500 text-white'}`}>
      {STATUS_LABELS[status] || '? Unknown'}
    </span>
  );

  const stats = {
    total: farmerDistributions.length,
    planted: farmerDistributions.filter(d => d.status === 'planted').length,
    distributed: farmerDistributions.filter(d => d.status === 'distributed_to_farmer').length,
    totalQuantity: farmerDistributions.reduce((sum, d) => sum + d.quantity_distributed, 0),
    damaged: farmerDistributions.filter(d => d.status === 'damaged').length
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">TOTAL DISTRIBUTIONS</p>
          <p className="text-4xl font-black mb-3">{stats.total}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Package size={16} />
            <span>To farmers</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">PLANTED</p>
          <p className="text-4xl font-black mb-3">{stats.planted}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <CheckCircle size={16} />
            <span>Successfully planted</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sprout size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">TOTAL SEEDLINGS</p>
          <p className="text-4xl font-black mb-3">{stats.totalQuantity.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Sprout size={16} />
            <span>Distributed overall</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search variety or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-md p-7 border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading farmer distributions...</p>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-lg mb-2">No farmer distributions found</p>
            <p className="text-sm text-gray-500">Use the inventory page to distribute seedlings to farmers.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-gray-50 rounded-t-xl">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Variety</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Farmer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {currentDistributions.map((distribution) => (
                      <tr key={distribution.distribution_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                            {distribution.variety}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900">
                          {formatDate(distribution.date_distributed)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900 font-semibold">
                          {distribution.quantity_distributed.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900">
                          {distribution.farmers?.full_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900">
                          {distribution.farmers?.municipality || 'N/A'}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100">
                          {renderStatusBadge(distribution.status)}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openViewModal(distribution)}
                              className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-blue-100 text-blue-700 hover:bg-blue-200"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFarmerDistribution(distribution.distribution_id)}
                              className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-red-100 text-red-700 hover:bg-red-200"
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
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDistributions.length)} of {filteredDistributions.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Previous
                </button>
                {showPagination && Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  let page;
                  if (totalPages <= 5) {
                    page = index + 1;
                  } else if (currentPage <= 3) {
                    page = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + index;
                  } else {
                    page = currentPage - 2 + index;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                        currentPage === page
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex-1 min-w-0 mr-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">Farmer Distribution Details</h2>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedDistribution.variety}</p>
              </div>
              <button onClick={closeViewModal} className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Distribution Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Distribution Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Variety</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.variety}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900">{selectedDistribution.quantity_distributed.toLocaleString()} seedlings</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Date Distributed</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900">{formatDate(selectedDistribution.date_distributed)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Status</p>
                    {renderStatusBadge(selectedDistribution.status)}
                  </div>
                </div>
              </div>

              {/* Farmer Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.farmers?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Contact Number</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-all">{selectedDistribution.farmers?.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-all">{selectedDistribution.farmers?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Barangay</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.farmers?.barangay || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Municipality</p>
                    <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.farmers?.municipality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Planting Information - Always show */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-teal-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Sprout className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                  🌱 Planting Information
                </h3>
                {selectedDistribution.planting_date ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Planting Date</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">{formatDate(selectedDistribution.planting_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Planting Location</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.planting_location || 'Not specified'}</p>
                      </div>
                    </div>
                    {selectedDistribution.planting_notes && (
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Planting Notes</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 bg-white rounded-lg p-3 border border-teal-200 break-words">{selectedDistribution.planting_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Not yet planted</p>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {selectedDistribution.remarks && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    Remarks
                  </h3>
                  <p className="font-medium text-sm sm:text-base text-gray-900 bg-white rounded-lg p-3 border border-purple-200 break-words">{selectedDistribution.remarks}</p>
                </div>
              )}

              {/* Source Distribution */}
              {selectedDistribution.association_seedling_distributions && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-amber-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    📦 Source Distribution
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Variety</p>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.association_seedling_distributions.variety}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Supplier</p>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{selectedDistribution.association_seedling_distributions.source_supplier || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Distribution Date</p>
                      <p className="font-semibold text-sm sm:text-base text-gray-900">{formatDate(selectedDistribution.association_seedling_distributions.date_distributed)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationSeedlingDistribution;
