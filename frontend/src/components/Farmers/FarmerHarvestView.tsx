import { useState, useEffect } from 'react';
import { Package, Search, X, Eye, Edit2, Calendar, MapPin, Sprout, Award, TrendingUp, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import HarvestSubmissionPage from '../../pages/HarvestSubmissionPage';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface Harvest {
  harvest_id: string;
  harvest_date: string;
  abaca_variety: string;
  area_hectares: number;
  dry_fiber_output_kg: number;
  fiber_grade: string;
  status: string;
  municipality: string;
  barangay: string;
  created_at: string;
}

interface Statistics {
  total_harvests: number;
  pending: number;
  verified: number;
  rejected: number;
  in_inventory: number;
  total_fiber_kg: number;
  total_area_hectares: number;
  avg_yield_per_hectare: number;
}

export default function FarmerHarvestView() {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Harvest>>({});

  useEffect(() => {
    if (!showSubmitForm) {
      fetchHarvests();
      fetchStatistics();
    }
    // Reset to page 1 when filter changes
    setCurrentPageNum(1);
  }, [filter, showSubmitForm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPageNum(1);
  }, [searchQuery]);

  // Listen for harvest submission event
  useEffect(() => {
    const handleHarvestSubmitted = () => {
      setShowSubmitForm(false);
      fetchHarvests();
      fetchStatistics();
    };

    window.addEventListener('harvestSubmitted', handleHarvestSubmitted);
    return () => window.removeEventListener('harvestSubmitted', handleHarvestSubmitted);
  }, []);

  const fetchHarvests = async () => {
    try {
      const token = localStorage.getItem('token');
      const statusParam = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';

      const response = await fetch(`https://fibersupplychain.onrender.com/api/harvests/farmer/harvests${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHarvests(data.harvests);
      }
    } catch (error) {
      console.error('Error fetching harvests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fibersupplychain.onrender.com/api/harvests/farmer/harvests/statistics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleAddToInventory = async (harvest: Harvest) => {
    if (!confirm(`Add this harvest to CUSAFA Fiber Inventory?\n\nVariety: ${harvest.abaca_variety}\nQuantity: ${harvest.dry_fiber_output_kg} kg\nGrade: ${harvest.fiber_grade}`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/cusafa-inventory/add/${harvest.harvest_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: 'CUSAFA Warehouse',
          notes: `Added by farmer - ${harvest.abaca_variety}`
        })
      });

      if (response.ok) {
        alert('✅ Harvest added to CUSAFA Fiber Inventory successfully!');
        fetchHarvests(); // Refresh list
        fetchStatistics(); // Refresh stats
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to add to inventory'}`);
      }
    } catch (error) {
      console.error('Error adding to inventory:', error);
      alert('❌ Failed to add to inventory');
    }
  };

  const handleViewDetails = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setShowViewModal(true);
  };

  const handleEditClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setEditFormData(harvest);
    setShowEditModal(true);
  };

  const handleDeleteClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setShowDeleteModal(true);
  };

  const handleUpdateHarvest = async () => {
    if (!selectedHarvest) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/harvests/${selectedHarvest.harvest_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        alert('✅ Harvest updated successfully!');
        setShowEditModal(false);
        fetchHarvests();
        fetchStatistics();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to update harvest'}`);
      }
    } catch (error) {
      console.error('Error updating harvest:', error);
      alert('❌ Failed to update harvest');
    }
  };

  const handleDeleteHarvest = async () => {
    if (!selectedHarvest) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/harvests/${selectedHarvest.harvest_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('✅ Harvest deleted successfully!');
        setShowDeleteModal(false);
        fetchHarvests();
        fetchStatistics();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete harvest'}`);
      }
    } catch (error) {
      console.error('Error deleting harvest:', error);
      alert('❌ Failed to delete harvest');
    }
  };

  const getStatusBadge = (status: string) => {
    const toneMap: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'neutral'> = {
      'Pending Verification': 'warning',
      'Verified': 'success',
      'Rejected': 'danger',
      'In Inventory': 'info',
      'Delivered': 'success',
      'Sold': 'success'
    };

    return (
      <StatusPill tone={toneMap[status] || 'neutral'}>
        {status}
      </StatusPill>
    );
  };


  // Filter harvests by search query
  const filteredHarvests = harvests.filter(harvest => {
    const searchLower = searchQuery.toLowerCase();
    return (
      harvest.abaca_variety.toLowerCase().includes(searchLower) ||
      harvest.fiber_grade?.toLowerCase().includes(searchLower) ||
      harvest.municipality.toLowerCase().includes(searchLower) ||
      harvest.barangay.toLowerCase().includes(searchLower) ||
      harvest.status.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredHarvests.length / itemsPerPage);
  const paginatedHarvests = filteredHarvests.slice(
    (currentPageNum - 1) * itemsPerPage,
    currentPageNum * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      {statistics && (
        <KpiStrip
          columns={4}
          items={[
            { label: 'Total Harvests', value: statistics.total_harvests, subtext: 'Recorded harvests' },
            {
              label: 'Total Fiber',
              value: `${(statistics.total_fiber_kg ?? 0).toFixed(2)} kg`,
              subtext: 'Dry fiber output'
            },
            { label: 'Awaiting Verification', value: statistics.pending, subtext: 'Pending review' },
            { label: 'Verified Harvests', value: statistics.verified, subtext: 'Approved by MAO' }
          ]}
        />
      )}

      {/* Unified Search, Filter & Submit Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search variety, grade, municipality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter harvests by status"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Pending Verification">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="In Inventory">In Inventory</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitForm(true)}
            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            <span>Submit New Harvest</span>
          </button>
        </div>
      </div>

      {/* Harvests Table */}
      <EditorialCard noPadding>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent mb-3" />
            <p className="text-sm text-gray-600 font-medium">Loading harvests...</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-[#EAF6F0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-[#047857]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-gray-900 mb-1.5">No Harvests Yet</h3>
            <p className="text-sm text-gray-500 mb-5">Start tracking your abaca harvests today.</p>
            <button
              type="button"
              onClick={() => setShowSubmitForm(true)}
              className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm"
            >
              Submit Your First Harvest
            </button>
          </div>
        ) : (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Harvest records table">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Date
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      Location
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-gray-400" />
                      Variety
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Area (ha)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fiber (kg)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-gray-400" />
                      Grade
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedHarvests.map((harvest) => (
                  <tr key={harvest.harvest_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(harvest.harvest_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{harvest.municipality}</div>
                      <div className="text-xs text-gray-500">{harvest.barangay}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{harvest.abaca_variety}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{harvest.area_hectares} ha</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-[#047857] tabular-nums">
                        {harvest.dry_fiber_output_kg?.toFixed(2) || 'N/A'} kg
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{harvest.fiber_grade || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(harvest.status)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(harvest)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {harvest.status !== 'Verified' && harvest.status !== 'In Inventory' && harvest.status !== 'Delivered' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditClick(harvest)}
                              className="p-2 text-[#92400E] hover:bg-[#FEF3C7] rounded-xl transition-colors"
                              title="Edit Harvest"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(harvest)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Harvest"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {harvest.status === 'Verified' && (
                          <button
                            type="button"
                            onClick={() => handleAddToInventory(harvest)}
                            className="p-2 text-[#047857] hover:bg-[#EAF6F0] rounded-xl transition-colors"
                            title="Add to CUSAFA Inventory"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {harvests.length > 0 && (
          <div className="bg-white px-5 py-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-gray-500">Show entries:</span>
                <div className="flex gap-1.5">
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPageNum(1);
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
                  Showing {((currentPageNum - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPageNum * itemsPerPage, filteredHarvests.length)} of {filteredHarvests.length} entries
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPageNum((prev) => Math.max(1, prev - 1))}
                    disabled={currentPageNum === 1}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPageNum((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPageNum >= totalPages}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </EditorialCard>

      {/* Modal for Harvest Submission Form */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="shrink-0 bg-white px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Submit New Harvest</h2>
                <p className="text-xs text-gray-500 mt-0.5">Record your abaca harvest details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Close"
                aria-label="Close harvest submission modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4 sm:p-6">
              <HarvestSubmissionPage />
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="shrink-0 bg-white px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Harvest Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Complete harvest information</p>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Close"
                aria-label="Close harvest details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#047857]" />
                    Harvest Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Harvest ID</label>
                      <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">{selectedHarvest.harvest_id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Harvest Date</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {new Date(selectedHarvest.harvest_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Variety</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedHarvest.abaca_variety}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Status</label>
                      {getStatusBadge(selectedHarvest.status)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#047857]" />
                    Location
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Municipality</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedHarvest.municipality}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Barangay</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedHarvest.barangay}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#E59500]" />
                    Production
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Area (Hectares)</label>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">{selectedHarvest.area_hectares} ha</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Dry Fiber Output</label>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                        {selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#E59500]" />
                    Quality
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Fiber Grade</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedHarvest.fiber_grade || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Created At</label>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {new Date(selectedHarvest.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex gap-3 justify-end">
              {selectedHarvest.status !== 'Verified' && selectedHarvest.status !== 'In Inventory' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditClick(selectedHarvest);
                  }}
                  className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold flex items-center gap-2 text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Harvest
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="shrink-0 bg-white px-6 py-5 flex justify-between items-center border-b border-gray-100">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Edit Harvest</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update harvest information</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Close"
                aria-label="Close edit harvest modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Abaca Variety</label>
                  <input
                    type="text"
                    value={editFormData.abaca_variety || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, abaca_variety: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Area (Hectares)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.area_hectares || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, area_hectares: parseFloat(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dry Fiber (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.dry_fiber_output_kg || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dry_fiber_output_kg: parseFloat(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fiber Grade</label>
                  <select
                    value={editFormData.fiber_grade || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, fiber_grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                  >
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                    <option value="Grade S">Grade S</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Municipality</label>
                    <input
                      type="text"
                      value={editFormData.municipality || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, municipality: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Barangay</label>
                    <input
                      type="text"
                      value={editFormData.barangay || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, barangay: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Harvest Date</label>
                  <input
                    type="date"
                    value={editFormData.harvest_date?.split('T')[0] || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, harvest_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateHarvest}
                className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Update Harvest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Delete Harvest</h2>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-800 mb-3">Are you sure you want to delete this harvest?</p>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <p><span className="font-semibold">Variety:</span> {selectedHarvest.abaca_variety}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(selectedHarvest.harvest_date).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Fiber:</span> {selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteHarvest}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Harvest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
