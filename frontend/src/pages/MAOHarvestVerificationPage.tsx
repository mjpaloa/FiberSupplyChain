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
      const endpoint = `https://easyabaca-api.vercel.app/api/harvests/mao/harvests${statusParam}`;

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
      const response = await fetch('https://easyabaca-api.vercel.app/api/harvests/mao/harvests/statistics', {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/harvests/mao/harvests/${selectedHarvest.harvest_id}`, {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/harvests/${harvestId}`, {
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
        `https://easyabaca-api.vercel.app/api/harvests/mao/harvests/${selectedHarvest.harvest_id}/${endpoint}`,
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
    const styles = {
      'Pending Verification': 'bg-yellow-100 text-yellow-800',
      'Verified': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'In Inventory': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Stats Cards - Matching User Management */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Harvests Card - Blue */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Harvests</p>
              <p className="text-4xl font-bold text-white">{statistics.total_harvests}</p>
            </div>
          </div>

          {/* Total Farmers Card - Emerald */}
          <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Farmers</p>
              <p className="text-4xl font-bold text-white">{statistics.total_farmers}</p>
            </div>
          </div>

          {/* Total Fiber Card - Purple */}
          <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Fiber (kg)</p>
              <p className="text-4xl font-bold text-white">{statistics.total_fiber_kg?.toFixed(2)}</p>
            </div>
          </div>

          {/* Pending Card - Amber */}
          <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Pending</p>
              <p className="text-4xl font-bold text-white">{statistics.pending_verification}</p>
            </div>
          </div>

          {/* Last 30 Days Card - Slate */}
          <div className="group relative bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Last 30 Days</p>
              <p className="text-4xl font-bold text-white">{statistics.harvests_last_30_days}</p>
            </div>
          </div>
        </div>
      )}

      {/* Neumorphic Search and Filters Section */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search farmer, location, variety..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
              />
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full md:w-56">
            <div className="relative">
              <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-800 shadow-md"
              >
                <option value="all">All Status</option>
                <option value="Pending Verification">⏳ Pending</option>
                <option value="Verified">✓ Verified</option>
                <option value="Rejected">✗ Rejected</option>
              </select>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-6 py-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-2xl hover:from-purple-500 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap group border-2 border-purple-300"
            title="Export to CSV"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Compact Table with Pagination */}
      {loading ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-200 rounded-3xl p-12 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
            <Package className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Loading harvests...</h3>
        </div>
      ) : filteredHarvests.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-200 rounded-3xl p-12 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
            <Package className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No harvests found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
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
                      <UsersIcon className="w-4 h-4" />
                      Farmer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Variety</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Area (ha)</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4" />
                      Fiber (kg)
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {currentHarvests.map((harvest, index) => (
                  <tr key={harvest.harvest_id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-blue-900 text-sm">{harvest.farmer_name}</div>
                      <div className="text-purple-600 text-xs font-mono">{generateReadableId(harvest.harvest_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{harvest.municipality}</div>
                      <div className="text-xs text-emerald-600">{harvest.barangay}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(harvest.harvest_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{harvest.abaca_variety}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{harvest.area_hectares}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-purple-900">{harvest.dry_fiber_output_kg?.toFixed(2)}</div>
                      <div className="text-xs text-purple-600">{harvest.fiber_grade}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(harvest.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewClick(harvest)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(harvest)}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 hover:shadow-md transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {harvest.status === 'Pending Verification' && (
                          <>
                            <button
                              onClick={() => handleVerifyClick(harvest)}
                              className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 hover:shadow-md transition-all duration-200"
                              title="Verify"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectClick(harvest)}
                              className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(harvest.harvest_id)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 hover:shadow-md transition-all duration-200"
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

          {/* Pagination Footer - Matching User Management */}
          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredHarvests.length)} of {filteredHarvests.length} entries
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

      {/* Verification Modal */}
      {showVerifyModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${actionType === 'verify' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {actionType === 'verify' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {actionType === 'verify' ? 'Verify Harvest' : 'Reject Harvest'}
              </h2>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Farmer:</span>
                <span className="font-semibold text-gray-900">{selectedHarvest.farmer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Fiber:</span>
                <span className="font-semibold text-gray-900">{selectedHarvest.dry_fiber_output_kg} kg</span>
                <span className="text-sm text-gray-600">({selectedHarvest.fiber_grade})</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Verification Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder={actionType === 'verify'
                  ? 'Optional notes about the verification...'
                  : 'Please provide reason for rejection...'}
                required={actionType === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitVerification}
                disabled={actionType === 'reject' && !verificationNotes.trim()}
                className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 ${actionType === 'verify'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                  } disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
              >
                {actionType === 'verify' ? '✓ Verify' : '✗ Reject'}
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal - Comprehensive */}
      {showViewModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Harvest Record Details</h2>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Farmer Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5">
                <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg">
                  <UsersIcon className="w-5 h-5" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{selectedHarvest.farmer_name}</p>
                  </div>
                  {selectedHarvest.farmer_contact && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Contact</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.farmer_contact}</p>
                    </div>
                  )}
                  {selectedHarvest.farmer_email && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Email</p>
                      <p className="font-semibold text-gray-900 text-sm">{selectedHarvest.farmer_email}</p>
                    </div>
                  )}
                  {selectedHarvest.cooperative_name && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Cooperative</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.cooperative_name}</p>
                    </div>
                  )}
                  {selectedHarvest.farmer_registration_id && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Registration ID</p>
                      <p className="font-mono text-sm text-gray-900">{selectedHarvest.farmer_registration_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farm Location */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Farm Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Area (Hectares)</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedHarvest.area_hectares} ha</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Municipality</p>
                    <p className="font-semibold text-gray-900">{selectedHarvest.municipality}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Barangay</p>
                    <p className="font-semibold text-gray-900">{selectedHarvest.barangay}</p>
                  </div>
                  {selectedHarvest.farm_coordinates && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Farm Coordinates (GPS)</p>
                      <p className="font-mono text-sm text-gray-900">{selectedHarvest.farm_coordinates}</p>
                    </div>
                  )}
                  {selectedHarvest.farm_name && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Farm Name</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.farm_name}</p>
                    </div>
                  )}
                  {selectedHarvest.landmark && (
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Landmark</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.landmark}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Planting Information */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5">
                <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                  <Sprout className="w-5 h-5" />
                  Planting Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Abaca Variety</p>
                    <p className="font-semibold text-gray-900">{selectedHarvest.abaca_variety}</p>
                  </div>
                  {selectedHarvest.planting_date && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Planting Date</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedHarvest.planting_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedHarvest.planting_material_source && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Planting Method</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.planting_material_source}</p>
                    </div>
                  )}
                  {selectedHarvest.planting_spacing && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Location</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.planting_spacing}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Harvest Details */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5">
                <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  Harvest Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Harvest Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedHarvest.harvest_date).toLocaleDateString()}</p>
                  </div>
                  {selectedHarvest.harvest_method && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Harvest Method</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.harvest_method}</p>
                    </div>
                  )}
                  {selectedHarvest.stalks_harvested && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Stalks Harvested</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.stalks_harvested}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Dry Fiber Output</p>
                    <p className="font-semibold text-gray-900 text-lg">{selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg</p>
                  </div>
                  {selectedHarvest.wet_weight_kg && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Wet Weight</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.wet_weight_kg?.toFixed(2)} kg</p>
                    </div>
                  )}
                  {selectedHarvest.yield_per_hectare_kg && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Yield per Hectare</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.yield_per_hectare_kg?.toFixed(2)} kg/ha</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality & Grading */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2 text-lg">
                  <CheckCircle className="w-5 h-5" />
                  Quality & Grading
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Fiber Grade</p>
                    <p className="font-semibold text-gray-900">{selectedHarvest.fiber_grade || 'N/A'}</p>
                  </div>
                  {selectedHarvest.moisture_status && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Moisture Status</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.moisture_status}</p>
                    </div>
                  )}
                  {selectedHarvest.fiber_color && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Fiber Color</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.fiber_color}</p>
                    </div>
                  )}
                  {selectedHarvest.bales_produced && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Bales Produced</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.bales_produced}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pest & Disease Observations */}
              {(selectedHarvest.pests_observed || selectedHarvest.diseases_observed) && (
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5">
                  <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2 text-lg">
                    <XCircle className="w-5 h-5" />
                    Pest & Disease Observations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedHarvest.pests_observed && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Pests Observed</p>
                        <p className="font-semibold text-gray-900">{selectedHarvest.pests_description || 'Yes'}</p>
                      </div>
                    )}
                    {selectedHarvest.diseases_observed && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Diseases Observed</p>
                        <p className="font-semibold text-gray-900">{selectedHarvest.diseases_description || 'Yes'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Remarks */}
              {selectedHarvest.remarks && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5" />
                    Additional Remarks
                  </h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedHarvest.remarks}</p>
                </div>
              )}

              {/* System Information */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-5">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Harvest ID</p>
                    <p className="text-lg font-bold text-indigo-600">{generateReadableId(selectedHarvest.harvest_id)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedHarvest.status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Created At</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedHarvest.created_at).toLocaleString()}</p>
                  </div>
                  {selectedHarvest.verified_by && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Verified By</p>
                        <p className="font-semibold text-gray-900">{selectedHarvest.verifier?.full_name || 'MAO Officer'}</p>
                      </div>
                      {selectedHarvest.verified_at && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Verified At</p>
                          <p className="font-semibold text-gray-900">{new Date(selectedHarvest.verified_at).toLocaleString()}</p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedHarvest.verification_notes && (
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Verification Notes</p>
                      <p className="font-semibold text-gray-900">{selectedHarvest.verification_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-xl hover:from-gray-700 hover:to-slate-700 font-semibold transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Harvest Modal */}
      {showEditModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <Edit className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Harvest</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Harvest Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.harvest_date}
                  onChange={(e) => setEditFormData({ ...editFormData, harvest_date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Abaca Variety <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.abaca_variety}
                  onChange={(e) => setEditFormData({ ...editFormData, abaca_variety: e.target.value })}
                  placeholder="e.g., Musa textilis"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Area (hectares) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.area_hectares}
                    onChange={(e) => setEditFormData({ ...editFormData, area_hectares: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dry Fiber Output (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.dry_fiber_output_kg}
                    onChange={(e) => setEditFormData({ ...editFormData, dry_fiber_output_kg: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fiber Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.fiber_grade}
                  onChange={(e) => setEditFormData({ ...editFormData, fiber_grade: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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

            <div className="flex gap-3">
              <button
                onClick={handleUpdateHarvest}
                disabled={!editFormData.harvest_date || !editFormData.abaca_variety || !editFormData.area_hectares || !editFormData.dry_fiber_output_kg || !editFormData.fiber_grade}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 font-semibold transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                ✓ Update Harvest
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
