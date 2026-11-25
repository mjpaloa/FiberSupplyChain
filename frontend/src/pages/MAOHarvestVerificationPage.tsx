import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Package,
  Users as UsersIcon,
  Calendar,
  Sprout,
  X,
  Edit
} from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../components/Shared/EditorialUI';

interface Harvest {
  harvest_id: string;
  harvest_date: string;
  farmer_name: string;
  municipality: string;
  barangay: string;
  abaca_variety: string;
  area_hectares: number;
  dry_fiber_output_kg: number;
  fiber_grade: string;
  status: string;
  verified_by: string;
  verifier?: {
    full_name: string;
    email: string;
  };
  created_at: string;

  // Farm Location Details
  county_province?: string;
  farm_coordinates?: string;
  landmark?: string;
  farm_name?: string;
  farm_code?: string;
  plot_lot_id?: string;

  // Farmer Information
  farmer_contact?: string;
  farmer_email?: string;
  cooperative_name?: string;
  mao_registration?: string;
  farmer_registration_id?: string;

  // Planting Information
  planting_date?: string;
  planting_material_source?: string;
  planting_density_hills_per_ha?: number;
  planting_spacing?: string;

  // Harvest Details
  harvest_shift?: string;
  harvest_crew_name?: string;
  harvest_crew_id?: string;
  harvest_method?: string;
  stalks_harvested?: number;
  tuxies_collected?: number;
  wet_weight_kg?: number;
  estimated_fiber_recovery_percent?: number;
  yield_per_hectare_kg?: number;

  // Quality & Grading
  fiber_length_cm?: number;
  fiber_color?: string;
  fiber_fineness?: string;
  fiber_cleanliness?: string;
  moisture_status?: string;
  defects_noted?: string[];
  has_mold?: boolean;
  has_discoloration?: boolean;
  has_pest_damage?: boolean;
  stripper_operator_name?: string;
  bales_produced?: number;
  weight_per_bale_kg?: number;

  // Inputs & Costs
  fertilizer_applied?: string;
  fertilizer_application_date?: string;
  fertilizer_quantity?: string;
  pesticide_applied?: string;
  pesticide_application_date?: string;
  pesticide_quantity?: string;
  labor_hours?: number;
  number_of_workers?: number;
  harvesting_cost_per_kg?: number;
  harvesting_cost_per_ha?: number;
  total_harvesting_cost?: number;

  // Pest & Disease
  pests_observed?: boolean;
  pests_description?: string;
  diseases_observed?: boolean;
  diseases_description?: string;
  remarks?: string;
  photo_urls?: string[];

  // Verification
  inspected_by?: string;
  inspector_position?: string;
  inspection_date?: string;
  farmer_signature_url?: string;
  farmer_thumbmark_url?: string;
  receiving_buyer_trader?: string;
  buyer_contact?: string;
  verification_notes?: string;
  verified_at?: string;
}

interface Statistics {
  total_harvests: number;
  pending_verification: number;
  verified_harvests: number;
  rejected_harvests: number;
  in_inventory: number;
  total_farmers: number;
  total_fiber_kg: number;
  avg_yield_per_hectare: number;
  harvests_last_30_days: number;
}

// Helper function to convert UUID to readable number ID
const generateReadableId = (uuid: string): string => {
  // Take first 8 characters of UUID and convert to decimal
  const hexPart = uuid.replace(/-/g, '').substring(0, 8);
  const decimal = parseInt(hexPart, 16);
  // Convert to a shorter number (6-7 digits)
  const shortId = Math.abs(decimal % 10000000);
  return `#${String(shortId).padStart(7, '0')}`;
};

export default function MAOHarvestVerificationPage() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending Verification');
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionType, setActionType] = useState<'verify' | 'reject'>('verify');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editFormData, setEditFormData] = useState({
    harvest_date: '',
    abaca_variety: '',
    area_hectares: '',
    dry_fiber_output_kg: '',
    fiber_grade: ''
  });

  useEffect(() => {
    fetchHarvests();
    fetchStatistics();
  }, [filter]);

  const fetchHarvests = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const statusParam = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';

      // Use the correct endpoint for MAO officers
      const endpoint = `${API_BASE_URL}/api/harvests/mao/harvests${statusParam}`;

      const response = await fetch(endpoint, {
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
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/harvests/mao/harvests/statistics`, {
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

  const handleVerifyClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setActionType('verify');
    setVerificationNotes('');
    setShowVerifyModal(true);
  };

  const handleRejectClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setActionType('reject');
    setVerificationNotes('');
    setShowVerifyModal(true);
  };

  const handleViewClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setShowViewModal(true);
  };

  const handleEditClick = (harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setEditFormData({
      harvest_date: harvest.harvest_date.split('T')[0],
      abaca_variety: harvest.abaca_variety,
      area_hectares: harvest.area_hectares.toString(),
      dry_fiber_output_kg: harvest.dry_fiber_output_kg.toString(),
      fiber_grade: harvest.fiber_grade
    });
    setShowEditModal(true);
  };

  const handleUpdateHarvest = async () => {
    if (!selectedHarvest) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/harvests/mao/harvests/${selectedHarvest.harvest_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          harvest_date: editFormData.harvest_date,
          abaca_variety: editFormData.abaca_variety,
          area_hectares: parseFloat(editFormData.area_hectares),
          dry_fiber_output_kg: parseFloat(editFormData.dry_fiber_output_kg),
          fiber_grade: editFormData.fiber_grade
        })
      });

      if (response.ok) {
        alert('✅ Harvest updated successfully!');
        setShowEditModal(false);
        fetchHarvests();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to update harvest'}`);
      }
    } catch (error) {
      console.error('Error updating harvest:', error);
      alert('❌ Failed to update harvest');
    }
  };

  const handleDelete = async (harvestId: string) => {
    if (!confirm('Are you sure you want to delete this harvest record? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/harvests/${harvestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        alert('✅ Harvest record deleted successfully!');
        fetchHarvests(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete harvest'}`);
      }
    } catch (error) {
      console.error('Error deleting harvest:', error);
      alert('❌ Failed to delete harvest');
    }
  };


  const handleSubmitVerification = async () => {
    if (!selectedHarvest) return;

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const endpoint = actionType === 'verify' ? 'verify' : 'reject';

      const response = await fetch(
        `${API_BASE_URL}/api/harvests/mao/harvests/${selectedHarvest.harvest_id}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ verification_notes: verificationNotes })
        }
      );

      if (response.ok) {
        alert(`Harvest ${actionType === 'verify' ? 'verified' : 'rejected'} successfully!`);
        setShowVerifyModal(false);
        fetchHarvests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process verification');
    }
  };

  const getStatusBadge = (status: string) => {
    const tone =
      status === 'Verified'
        ? 'success'
        : status === 'Pending Verification'
          ? 'warning'
          : status === 'Rejected'
            ? 'danger'
            : status === 'In Inventory'
              ? 'info'
              : 'neutral';

    return <StatusPill tone={tone}>{status}</StatusPill>;
  };

  const filteredHarvests = harvests.filter(harvest =>
    (harvest.farmer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (harvest.municipality?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (harvest.barangay?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredHarvests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHarvests = filteredHarvests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };


  const exportToCSV = () => {
    const headers = ['Harvest Date', 'Farmer', 'Municipality', 'Barangay', 'Variety', 'Area (ha)', 'Fiber (kg)', 'Grade', 'Status'];
    const rows = filteredHarvests.map(h => [
      new Date(h.harvest_date).toLocaleDateString(),
      h.farmer_name,
      h.municipality,
      h.barangay,
      h.abaca_variety,
      h.area_hectares,
      h.dry_fiber_output_kg,
      h.fiber_grade,
      h.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harvests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      {statistics && (
        <KpiStrip
          columns={5}
          items={[
            {
              label: 'Total Harvests',
              value: statistics.total_harvests.toLocaleString(),
              subtext: 'Submitted records',
            },
            {
              label: 'Total Farmers',
              value: statistics.total_farmers.toLocaleString(),
              subtext: 'Active growers',
            },
            {
              label: 'Total Fiber (kg)',
              value: statistics.total_fiber_kg?.toFixed(2) ?? '0.00',
              subtext: 'Dry fiber output',
            },
            {
              label: 'Pending',
              value: statistics.pending_verification.toLocaleString(),
              accentSubtext: statistics.pending_verification > 0 ? 'Needs review' : undefined,
              subtext: statistics.pending_verification === 0 ? 'All reviewed' : undefined,
            },
            {
              label: 'Last 30 Days',
              value: statistics.harvests_last_30_days.toLocaleString(),
              subtext: 'Recent harvests',
            },
          ]}
        />
      )}

      {/* Search and Filters */}
      <EditorialCard>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search farmer, location, variety..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-52">
            <div className="relative">
              <CheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
              >
                <option value="all">All Status</option>
                <option value="Pending Verification">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </EditorialCard>

      {/* Harvests Table */}
      {loading ? (
        <EditorialCard className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#047857] rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Loading harvests...</h3>
        </EditorialCard>
      ) : filteredHarvests.length === 0 ? (
        <EditorialCard className="p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No harvests found</h3>
          <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
        </EditorialCard>
      ) : (
        <EditorialCard noPadding>
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Harvest verification records table">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Variety</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Area (ha)</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fiber (kg)</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentHarvests.map((harvest) => (
                  <tr key={harvest.harvest_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-sm">{harvest.farmer_name}</div>
                      <div className="text-gray-400 text-xs font-mono tabular-nums">{generateReadableId(harvest.harvest_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{harvest.municipality}</div>
                      <div className="text-xs text-gray-500">{harvest.barangay}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 tabular-nums">
                        {new Date(harvest.harvest_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{harvest.abaca_variety}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 tabular-nums">{harvest.area_hectares}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 tabular-nums">{harvest.dry_fiber_output_kg?.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{harvest.fiber_grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(harvest.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleViewClick(harvest)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(harvest)}
                          className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {harvest.status === 'Pending Verification' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleVerifyClick(harvest)}
                              className="p-2 text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                              title="Verify"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectClick(harvest)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(harvest.harvest_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Pagination Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600">Show entries:</span>
                <div className="flex gap-1.5">
                  {[10, 20, 30].map((size) => (
                    <button
                      type="button"
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${itemsPerPage === size
                          ? 'bg-[#E59500] text-gray-900'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-600 tabular-nums">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredHarvests.length)} of {filteredHarvests.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </EditorialCard>
      )}

      {/* Verification Modal */}
      {showVerifyModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${actionType === 'verify' ? 'bg-[#EAF6F0] text-[#047857]' : 'bg-red-50 text-red-600'}`}>
                {actionType === 'verify' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <h2 className="font-serif text-xl font-bold text-gray-900">
                {actionType === 'verify' ? 'Verify Harvest' : 'Reject Harvest'}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Farmer:</span>
                  <span className="font-semibold text-gray-900">{selectedHarvest.farmer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500">Fiber:</span>
                  <span className="font-semibold text-gray-900">{selectedHarvest.dry_fiber_output_kg} kg</span>
                  <span className="text-gray-500">({selectedHarvest.fiber_grade})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Verification Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors resize-none"
                  placeholder={actionType === 'verify'
                    ? 'Optional notes about the verification...'
                    : 'Please provide reason for rejection...'}
                  required={actionType === 'reject'}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={actionType === 'reject' && !verificationNotes.trim()}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${actionType === 'verify'
                    ? 'bg-[#047857] hover:bg-[#065F46]'
                    : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
              >
                {actionType === 'verify' ? 'Verify Harvest' : 'Reject Harvest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Comprehensive */}
      {showViewModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EAF6F0] text-[#047857] rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Harvest Record Details</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Farmer Information */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <UsersIcon className="w-4 h-4 text-[#047857]" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Name</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.farmer_name}</p>
                  </div>
                  {selectedHarvest.farmer_contact && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contact</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.farmer_contact}</p>
                    </div>
                  )}
                  {selectedHarvest.farmer_email && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Email</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedHarvest.farmer_email}</p>
                    </div>
                  )}
                  {selectedHarvest.cooperative_name && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cooperative</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.cooperative_name}</p>
                    </div>
                  )}
                  {selectedHarvest.farmer_registration_id && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Registration ID</p>
                      <p className="font-mono text-sm text-gray-900 tabular-nums">{selectedHarvest.farmer_registration_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farm Location */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-[#047857]" />
                  Farm Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Area (Hectares)</p>
                    <p className="font-semibold text-gray-900 text-base tabular-nums">{selectedHarvest.area_hectares} ha</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Municipality</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.municipality}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Barangay</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.barangay}</p>
                  </div>
                  {selectedHarvest.farm_coordinates && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Farm Coordinates (GPS)</p>
                      <p className="font-mono text-sm text-gray-900 tabular-nums">{selectedHarvest.farm_coordinates}</p>
                    </div>
                  )}
                  {selectedHarvest.farm_name && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Farm Name</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.farm_name}</p>
                    </div>
                  )}
                  {selectedHarvest.landmark && (
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landmark</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.landmark}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Planting Information */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <Sprout className="w-4 h-4 text-[#047857]" />
                  Planting Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Abaca Variety</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.abaca_variety}</p>
                  </div>
                  {selectedHarvest.planting_date && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Planting Date</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{new Date(selectedHarvest.planting_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedHarvest.planting_material_source && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Planting Method</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.planting_material_source}</p>
                    </div>
                  )}
                  {selectedHarvest.planting_spacing && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.planting_spacing}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Harvest Details */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-[#047857]" />
                  Harvest Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Harvest Date</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{new Date(selectedHarvest.harvest_date).toLocaleDateString()}</p>
                  </div>
                  {selectedHarvest.harvest_method && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Harvest Method</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.harvest_method}</p>
                    </div>
                  )}
                  {selectedHarvest.stalks_harvested && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Stalks Harvested</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.stalks_harvested}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Dry Fiber Output</p>
                    <p className="font-semibold text-gray-900 text-base tabular-nums">{selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg</p>
                  </div>
                  {selectedHarvest.wet_weight_kg && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Wet Weight</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.wet_weight_kg?.toFixed(2)} kg</p>
                    </div>
                  )}
                  {selectedHarvest.yield_per_hectare_kg && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Yield per Hectare</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.yield_per_hectare_kg?.toFixed(2)} kg/ha</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality & Grading */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <CheckCircle className="w-4 h-4 text-[#047857]" />
                  Quality & Grading
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fiber Grade</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.fiber_grade || 'N/A'}</p>
                  </div>
                  {selectedHarvest.moisture_status && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Moisture Status</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.moisture_status}</p>
                    </div>
                  )}
                  {selectedHarvest.fiber_color && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fiber Color</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedHarvest.fiber_color}</p>
                    </div>
                  )}
                  {selectedHarvest.bales_produced && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Bales Produced</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.bales_produced}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pest & Disease Observations */}
              {(selectedHarvest.pests_observed || selectedHarvest.diseases_observed) && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                  <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Pest & Disease Observations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedHarvest.pests_observed && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Pests Observed</p>
                        <p className="font-semibold text-sm text-gray-900">{selectedHarvest.pests_description || 'Yes'}</p>
                      </div>
                    )}
                    {selectedHarvest.diseases_observed && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Diseases Observed</p>
                        <p className="font-semibold text-sm text-gray-900">{selectedHarvest.diseases_description || 'Yes'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Remarks */}
              {selectedHarvest.remarks && (
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                  <h3 className="font-serif font-bold text-gray-900 mb-2 flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-gray-600" />
                    Additional Remarks
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedHarvest.remarks}</p>
                </div>
              )}

              {/* System Information */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Harvest ID</p>
                    <p className="text-sm font-bold text-gray-900 font-mono tabular-nums">{generateReadableId(selectedHarvest.harvest_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedHarvest.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created At</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{new Date(selectedHarvest.created_at).toLocaleString()}</p>
                  </div>
                  {selectedHarvest.verified_by && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Verified By</p>
                        <p className="font-semibold text-sm text-gray-900">{selectedHarvest.verifier?.full_name || 'MAO Officer'}</p>
                      </div>
                      {selectedHarvest.verified_at && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Verified At</p>
                          <p className="font-semibold text-sm text-gray-900 tabular-nums">{new Date(selectedHarvest.verified_at).toLocaleString()}</p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedHarvest.verification_notes && (
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Verification Notes</p>
                      <p className="font-medium text-sm text-gray-900">{selectedHarvest.verification_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Harvest Modal */}
      {showEditModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FEF3C7] text-[#92400E] rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Edit Harvest</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.harvest_date}
                  onChange={(e) => setEditFormData({ ...editFormData, harvest_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Abaca Variety <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.abaca_variety}
                  onChange={(e) => setEditFormData({ ...editFormData, abaca_variety: e.target.value })}
                  placeholder="e.g., Musa textilis"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Area (hectares) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.area_hectares}
                    onChange={(e) => setEditFormData({ ...editFormData, area_hectares: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Dry Fiber Output (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.dry_fiber_output_kg}
                    onChange={(e) => setEditFormData({ ...editFormData, dry_fiber_output_kg: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Fiber Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.fiber_grade}
                  onChange={(e) => setEditFormData({ ...editFormData, fiber_grade: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateHarvest}
                disabled={!editFormData.harvest_date || !editFormData.abaca_variety || !editFormData.area_hectares || !editFormData.dry_fiber_output_kg || !editFormData.fiber_grade}
                className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Update Harvest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
