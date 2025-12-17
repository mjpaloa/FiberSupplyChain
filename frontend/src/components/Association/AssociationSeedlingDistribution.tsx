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
  RefreshCw,
  CheckCircle,
  Sprout,
  TrendingUp
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
        'http://localhost:3001/api/association-seedlings/association/farmer-distributions',
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
        `http://localhost:3001/api/association-seedlings/association/farmer-distributions/${distributionId}`,
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

  const handleRefresh = () => {
    fetchFarmerDistributions();
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
    <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-md ${STATUS_CLASSES[status] || 'bg-gray-500 text-white'}`}>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-700 mb-1">Total Distributions</p>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          <p className="text-xs text-blue-600 mt-2">To farmers</p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-emerald-700 mb-1">Planted</p>
          <p className="text-3xl font-bold text-emerald-900">{stats.planted}</p>
          <p className="text-xs text-emerald-600 mt-2">Successfully planted</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-purple-700 mb-1">Distributed</p>
          <p className="text-3xl font-bold text-purple-900">{stats.distributed}</p>
          <p className="text-xs text-purple-600 mt-2">Pending planting</p>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold text-teal-700 mb-1">Total Seedlings</p>
          <p className="text-3xl font-bold text-teal-900">{stats.totalQuantity.toLocaleString()}</p>
          <p className="text-xs text-teal-600 mt-2">Total quantity distributed</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg">
        <div className="p-6">
          <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border-2 border-emerald-200 rounded-3xl p-6 mb-8 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by variety or farmer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
                  />
                </div>
              </div>

              <div className="w-full lg:w-56">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-800 shadow-md"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-12 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Loading farmer distributions...</p>
            </div>
          ) : filteredDistributions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-2">No farmer distributions found</p>
              <p className="text-sm text-gray-500">Use the inventory page to distribute seedlings to farmers.</p>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] overflow-hidden">
              <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Show entries:</span>
                    <div className="flex gap-2">
                      {[10, 20, 50].map((size) => (
                        <button
                          key={size}
                          onClick={() => handleItemsPerPageChange(size)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                            itemsPerPage === size
                              ? 'bg-indigo-500 text-white shadow-lg'
                              : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDistributions.length)} of {filteredDistributions.length} entries
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-100 via-blue-100 to-purple-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Variety</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Quantity
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Farmer
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Municipality</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-indigo-100">
                    {currentDistributions.map((distribution) => (
                      <tr key={distribution.distribution_id} className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-lg">{distribution.variety}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatDate(distribution.date_distributed)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <Package className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="font-bold text-emerald-600 text-lg">
                              {distribution.quantity_distributed.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="font-semibold text-emerald-900">{distribution.farmers?.full_name || 'N/A'}</div>
                            <div className="text-emerald-600 text-xs">{distribution.farmers?.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-blue-800 font-medium text-sm">
                            {distribution.farmers?.municipality || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(distribution.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openViewModal(distribution)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFarmerDistribution(distribution.distribution_id)}
                              className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDistributions.length)} of {filteredDistributions.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                      }`}
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
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                            currentPage === page
                              ? 'bg-indigo-500 text-white shadow-lg'
                              : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        currentPage === totalPages || totalPages === 0
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
          )}
        </div>
      </div>

      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Farmer Distribution Details</h2>
                <p className="text-sm text-gray-500">{selectedDistribution.variety}</p>
              </div>
              <button onClick={closeViewModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Distribution Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Distribution Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variety</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.variety}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.quantity_distributed.toLocaleString()} seedlings</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date Distributed</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedDistribution.date_distributed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {renderStatusBadge(selectedDistribution.status)}
                  </div>
                </div>
              </div>

              {/* Farmer Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.farmers?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.farmers?.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.farmers?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Barangay</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.farmers?.barangay || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Municipality</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.farmers?.municipality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Planting Information - Always show */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-teal-600" />
                  🌱 Planting Information
                </h3>
                {selectedDistribution.planting_date ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Planting Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(selectedDistribution.planting_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Planting Location</p>
                        <p className="font-semibold text-gray-900">{selectedDistribution.planting_location || 'Not specified'}</p>
                      </div>
                    </div>
                    {selectedDistribution.planting_notes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Planting Notes</p>
                        <p className="font-semibold text-gray-900 bg-white rounded-lg p-3 border border-teal-200">{selectedDistribution.planting_notes}</p>
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Remarks
                  </h3>
                  <p className="font-medium text-gray-900 bg-white rounded-lg p-3 border border-purple-200">{selectedDistribution.remarks}</p>
                </div>
              )}

              {/* Source Distribution */}
              {selectedDistribution.association_seedling_distributions && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    📦 Source Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Variety</p>
                      <p className="font-semibold text-gray-900">{selectedDistribution.association_seedling_distributions.variety}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Supplier</p>
                      <p className="font-semibold text-gray-900">{selectedDistribution.association_seedling_distributions.source_supplier || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Distribution Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(selectedDistribution.association_seedling_distributions.date_distributed)}</p>
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
