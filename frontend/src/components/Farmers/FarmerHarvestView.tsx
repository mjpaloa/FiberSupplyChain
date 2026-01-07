import { useState, useEffect } from 'react';
import { Package, Search, X, Eye, Edit2, Calendar, MapPin, Sprout, Award, TrendingUp, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import HarvestSubmissionPage from '../../pages/HarvestSubmissionPage';

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
      
      const response = await fetch(`https://easyabaca-api.vercel.app/api/harvests/farmer/harvests${statusParam}`, {
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
      const response = await fetch('https://easyabaca-api.vercel.app/api/harvests/farmer/harvests/statistics', {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/cusafa-inventory/add/${harvest.harvest_id}`, {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/harvests/${selectedHarvest.harvest_id}`, {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/harvests/${selectedHarvest.harvest_id}`, {
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
    <div>
      {/* Modern Stats Cards - UserManagement Style */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-5 md:mb-6">
          {/* Total Harvests Card */}
          <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Total</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Total Harvests</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{statistics.total_harvests}</p>
            </div>
          </div>

          {/* Total Fiber Card */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">KG</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Total Fiber</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{statistics.total_fiber_kg?.toFixed(2)}</p>
            </div>
          </div>

          {/* Pending Card */}
          <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Pending</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Awaiting Verification</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{statistics.pending}</p>
            </div>
          </div>

          {/* Verified Card */}
          <div className="group relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Verified</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Verified Harvests</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{statistics.verified}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modern Filters with Glassmorphism - UserManagement Style */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-3 sm:p-4 md:p-6 mb-4 sm:mb-5 md:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by variety, grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Status Filter */}
            <div className="flex-1 sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer font-medium"
              >
                <option value="all">All Status</option>
                <option value="Pending Verification">⏳ Pending Verification</option>
                <option value="Verified">✓ Verified</option>
                <option value="Rejected">✗ Rejected</option>
                <option value="In Inventory">📦 In Inventory</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Submit New Harvest</span>
              <span className="sm:hidden">Submit Harvest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Table - UserManagement Style */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading harvests...</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Harvests Yet</h3>
            <p className="text-gray-500 mb-6">Start tracking your abaca harvests today!</p>
            <button
              onClick={() => setShowSubmitForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Submit Your First Harvest
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px]">
              <thead>
                <tr className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b-2 border-emerald-100">
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <Sprout className="w-4 h-4" />
                      Variety
                    </div>
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Area (ha)</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fiber (kg)</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      Grade
                    </div>
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedHarvests.map((harvest, index) => (
                  <tr 
                    key={harvest.harvest_id} 
                    className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {new Date(harvest.harvest_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{harvest.municipality}</div>
                          <div className="text-xs text-gray-500">{harvest.barangay}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-1.5 sm:p-2 bg-teal-100 rounded-lg">
                          <Sprout className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">{harvest.abaca_variety}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">{harvest.area_hectares} ha</span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-xs sm:text-sm font-bold text-blue-600">{harvest.dry_fiber_output_kg?.toFixed(2) || 'N/A'} kg</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">{harvest.fiber_grade || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(harvest.status)}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleViewDetails(harvest)}
                          className="p-1.5 sm:p-2 bg-blue-100 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {harvest.status !== 'Verified' && harvest.status !== 'In Inventory' && (
                          <>
                            <button
                              onClick={() => handleEditClick(harvest)}
                              className="p-1.5 sm:p-2 bg-amber-100 text-amber-600 rounded-lg sm:rounded-xl hover:bg-amber-200 hover:shadow-md transition-all duration-200"
                              title="Edit Harvest"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(harvest)}
                              className="p-1.5 sm:p-2 bg-red-100 text-red-600 rounded-lg sm:rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                              title="Delete Harvest"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {harvest.status === 'Verified' && (
                          <button
                            onClick={() => handleAddToInventory(harvest)}
                            className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl hover:bg-indigo-200 hover:shadow-md transition-all duration-200"
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

        {/* Pagination Controls - UserManagement Style */}
        {harvests.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-4 border-t-2 border-emerald-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Show entries selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Show entries:</span>
                <div className="flex gap-2">
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPageNum(1);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        itemsPerPage === size
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-600 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagination info and controls */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">
                  Showing <span className="font-bold text-emerald-600">{((currentPageNum - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-emerald-600">{Math.min(currentPageNum * itemsPerPage, filteredHarvests.length)}</span> of <span className="font-bold text-emerald-600">{filteredHarvests.length}</span> entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
                    disabled={currentPageNum === 1}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-emerald-50 border-2 border-gray-200 hover:border-emerald-300 hover:shadow-md"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPageNum === totalPages}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Harvest Submission Form */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex justify-between items-center border-b-4 border-emerald-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Submit New Harvest</h2>
                  <p className="text-emerald-100 text-sm">Record your abaca harvest details</p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitForm(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                title="Close"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
              <HarvestSubmissionPage />
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 flex justify-between items-center border-b-4 border-blue-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Harvest Details</h2>
                  <p className="text-blue-100 text-sm">Complete harvest information</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                title="Close"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Harvest Information */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-600" />
                    Harvest Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Harvest ID</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.harvest_id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Harvest Date</label>
                      <p className="text-sm font-bold text-gray-900">{new Date(selectedHarvest.harvest_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Variety</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.abaca_variety}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedHarvest.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Location
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Municipality</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.municipality}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Barangay</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.barangay}</p>
                    </div>
                  </div>
                </div>

                {/* Production Details */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Production
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Area (Hectares)</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.area_hectares} ha</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Dry Fiber Output</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg</p>
                    </div>
                  </div>
                </div>

                {/* Quality Information */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Quality
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Fiber Grade</label>
                      <p className="text-sm font-bold text-gray-900">{selectedHarvest.fiber_grade || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Created At</label>
                      <p className="text-sm font-bold text-gray-900">{new Date(selectedHarvest.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                {selectedHarvest.status !== 'Verified' && selectedHarvest.status !== 'In Inventory' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditClick(selectedHarvest);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Harvest
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 flex justify-between items-center border-b-4 border-amber-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Harvest</h2>
                  <p className="text-amber-100 text-sm">Update harvest information</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                title="Close"
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Abaca Variety</label>
                  <input
                    type="text"
                    value={editFormData.abaca_variety || ''}
                    onChange={(e) => setEditFormData({...editFormData, abaca_variety: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Area (Hectares)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.area_hectares || ''}
                      onChange={(e) => setEditFormData({...editFormData, area_hectares: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Dry Fiber (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.dry_fiber_output_kg || ''}
                      onChange={(e) => setEditFormData({...editFormData, dry_fiber_output_kg: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fiber Grade</label>
                  <select
                    value={editFormData.fiber_grade || ''}
                    onChange={(e) => setEditFormData({...editFormData, fiber_grade: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  >
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                    <option value="Grade S">Grade S</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality</label>
                    <input
                      type="text"
                      value={editFormData.municipality || ''}
                      onChange={(e) => setEditFormData({...editFormData, municipality: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                    <input
                      type="text"
                      value={editFormData.barangay || ''}
                      onChange={(e) => setEditFormData({...editFormData, barangay: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date</label>
                  <input
                    type="date"
                    value={editFormData.harvest_date?.split('T')[0] || ''}
                    onChange={(e) => setEditFormData({...editFormData, harvest_date: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3 justify-end">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateHarvest}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Update Harvest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-600 px-8 py-6 flex items-center gap-3 border-b-4 border-red-700">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delete Harvest</h2>
                <p className="text-red-100 text-sm">This action cannot be undone</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
                <p className="text-gray-700 mb-4">Are you sure you want to delete this harvest?</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Variety:</span> {selectedHarvest.abaca_variety}</p>
                  <p><span className="font-semibold">Date:</span> {new Date(selectedHarvest.harvest_date).toLocaleDateString()}</p>
                  <p><span className="font-semibold">Fiber:</span> {selectedHarvest.dry_fiber_output_kg?.toFixed(2)} kg</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteHarvest}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
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
