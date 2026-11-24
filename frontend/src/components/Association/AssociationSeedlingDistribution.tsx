import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Package,
  Users,
  X,
  Sprout
} from 'lucide-react';
import {
  KpiStrip,
  EditorialCard,
  StatusPill,
  EditorialCallout
} from '../Shared/EditorialUI';

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
  distributed_to_farmer: 'Distributed',
  planted: 'Planted',
  damaged: 'Damaged',
  replanted: 'Replanted',
  lost: 'Lost',
  other: 'Other'
};

const STATUS_TONES: Record<string, 'info' | 'success' | 'danger' | 'warning' | 'neutral'> = {
  distributed_to_farmer: 'info',
  planted: 'success',
  damaged: 'danger',
  replanted: 'warning',
  lost: 'neutral',
  other: 'neutral'
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'distributed_to_farmer', label: 'Distributed' },
  { value: 'planted', label: 'Planted' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'replanted', label: 'Replanted' },
  { value: 'lost', label: 'Lost' }
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

      alert('✅ Farmer distribution deleted successfully.');
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
    <StatusPill tone={STATUS_TONES[status] || 'neutral'}>
      {STATUS_LABELS[status] || 'Unknown'}
    </StatusPill>
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
        <EditorialCallout tone="rose" title="Error">
          {error}
        </EditorialCallout>
      )}

      {/* Stats Cards */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Total Distributions',
            value: stats.total.toLocaleString(),
            subtext: 'To farmers',
          },
          {
            label: 'Planted',
            value: stats.planted.toLocaleString(),
            subtext: 'Successfully planted',
          },
          {
            label: 'Total Seedlings',
            value: stats.totalQuantity.toLocaleString(),
            subtext: 'Distributed overall',
          },
        ]}
      />

      {/* Search and Filters */}
      <EditorialCard>
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search variety or farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter distributions by status"
              className="w-full md:w-auto px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                aria-label="Items per page"
                className="px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-800 font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </EditorialCard>

      {/* Table Container */}
      <EditorialCard noPadding>
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full border-2 border-gray-200 border-t-[#047857] animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">Loading farmer distributions...</p>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-base mb-1">No farmer distributions found</p>
            <p className="text-xs text-gray-500">Use the inventory page to distribute seedlings to farmers.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Farmer seedling distributions">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variety</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Farmer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentDistributions.map((distribution) => (
                    <tr key={distribution.distribution_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {distribution.variety}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600 tabular-nums whitespace-nowrap">
                        {formatDate(distribution.date_distributed)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-900 font-semibold tabular-nums">
                        {distribution.quantity_distributed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-900 font-medium">
                        {distribution.farmers?.full_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {distribution.farmers?.municipality || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5">
                        {renderStatusBadge(distribution.status)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openViewModal(distribution)}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            title="View Details"
                            aria-label="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFarmerDistribution(distribution.distribution_id)}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                            aria-label="Delete distribution"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-[#FAFAFA]">
              <p className="text-xs text-gray-500 tabular-nums">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDistributions.length)} of {filteredDistributions.length} entries
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
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
                      type="button"
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded-xl border transition-colors text-xs font-semibold tabular-nums ${
                        currentPage === page
                          ? 'bg-[#E59500] text-gray-900 border-[#E59500]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </EditorialCard>

      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
              <div className="flex-1 min-w-0 mr-2">
                <h2 className="font-serif text-xl font-bold text-gray-900 truncate">Farmer Distribution Details</h2>
                <p className="text-xs text-gray-500 truncate mt-0.5">{selectedDistribution.variety}</p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Distribution Summary */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#047857]" />
                  Distribution Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                    <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.variety}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedDistribution.quantity_distributed.toLocaleString()} seedlings</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date Distributed</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{formatDate(selectedDistribution.date_distributed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {renderStatusBadge(selectedDistribution.status)}
                  </div>
                </div>
              </div>

              {/* Farmer Information */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#047857]" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                    <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.farmers?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Contact Number</p>
                    <p className="font-semibold text-sm text-gray-900 break-all tabular-nums">{selectedDistribution.farmers?.contact_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <p className="font-semibold text-sm text-gray-900 break-all">{selectedDistribution.farmers?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Barangay</p>
                    <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.farmers?.barangay || 'N/A'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Municipality</p>
                    <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.farmers?.municipality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Planting Information - Always show */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#047857]" />
                  Planting Information
                </h3>
                {selectedDistribution.planting_date ? (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Planting Date</p>
                        <p className="font-semibold text-sm text-gray-900 tabular-nums">{formatDate(selectedDistribution.planting_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Planting Location</p>
                        <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.planting_location || 'Not specified'}</p>
                      </div>
                    </div>
                    {selectedDistribution.planting_notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Planting Notes</p>
                        <p className="text-sm text-gray-900 bg-white rounded-xl p-3 border border-gray-200 break-words">{selectedDistribution.planting_notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs py-2">Not yet planted</p>
                )}
              </div>

              {/* Remarks */}
              {selectedDistribution.remarks && (
                <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-2">Remarks</h3>
                  <p className="text-sm text-gray-900 bg-white rounded-xl p-3 border border-gray-200 break-words">{selectedDistribution.remarks}</p>
                </div>
              )}

              {/* Source Distribution */}
              {selectedDistribution.association_seedling_distributions && (
                <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#E59500]" />
                    Source Distribution
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                      <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.association_seedling_distributions.variety}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Supplier</p>
                      <p className="font-semibold text-sm text-gray-900 break-words">{selectedDistribution.association_seedling_distributions.source_supplier || 'N/A'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5">Distribution Date</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{formatDate(selectedDistribution.association_seedling_distributions.date_distributed)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={closeViewModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationSeedlingDistribution;
