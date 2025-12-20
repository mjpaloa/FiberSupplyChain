import { useState, useEffect } from 'react';

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
  created_at: string;
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

export default function SuperAdminHarvestDashboard() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    municipality: '',
    barangay: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  console.log('🔄 Component initialized with filters:', filters, 'searchTerm:', searchTerm);

  useEffect(() => {
    console.log('🔄 Filters or searchTerm changed:', filters, 'searchTerm:', searchTerm);
    fetchHarvests();
    fetchStatistics();
  }, [filters, searchTerm]);

  const fetchHarvests = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.municipality) params.append('municipality', filters.municipality);
      if (filters.barangay) params.append('barangay', filters.barangay);
      
      const queryString = params.toString();
      const url = `http://localhost:3001/api/harvests/admin/harvests/all${queryString ? '?' + queryString : ''}`;
      
      console.log('🔍 Fetching harvests from:', url);
      console.log('🔍 With filters:', filters);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🔍 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Received harvests data:', data);
        console.log('✅ Harvests array length:', data.harvests?.length || 0);
        setHarvests(data.harvests || []);
      } else {
        console.error('❌ Failed to fetch harvests:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
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
      const response = await fetch(`/api/harvests/mao/harvests/statistics', {
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

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending Verification': 'bg-yellow-100 text-yellow-800',
      'Verified': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'In Inventory': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-purple-100 text-purple-800',
      'Sold': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const filteredHarvests = harvests.filter(harvest => {
    // If search term is empty or only whitespace, show all harvests
    if (!searchTerm || searchTerm.trim() === '') {
      console.log('🔍 No search term, showing all harvests');
      return true;
    }
    
    // Apply search filter only when search term is not empty
    const term = searchTerm.toLowerCase().trim();
    const matches = (
      (harvest.farmer_name && harvest.farmer_name.toLowerCase().includes(term)) ||
      (harvest.municipality && harvest.municipality.toLowerCase().includes(term)) ||
      (harvest.barangay && harvest.barangay.toLowerCase().includes(term)) ||
      (harvest.abaca_variety && harvest.abaca_variety.toLowerCase().includes(term))
    );
    
    console.log('🔍 Filtering harvest:', { harvest, term, matches });
    return matches;
  });
  
  console.log('📊 Filtered harvests count:', filteredHarvests.length, 'Total harvests:', harvests.length);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">All Harvests Dashboard</h1>
            <p className="text-gray-600 mt-1">Super Admin - View all system harvests</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            📊 Export to CSV
          </button>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Harvests</div>
              <div className="text-2xl font-bold text-green-800">{statistics.total_harvests}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Farmers</div>
              <div className="text-2xl font-bold text-green-800">{statistics.total_farmers}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Fiber (kg)</div>
              <div className="text-2xl font-bold text-green-800">{statistics.total_fiber_kg?.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending_verification}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Last 30 Days</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.harvests_last_30_days}</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Status</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
                <option value="In Inventory">In Inventory</option>
                <option value="Delivered">Delivered</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality</label>
              <input
                type="text"
                value={filters.municipality}
                onChange={(e) => setFilters({ ...filters, municipality: e.target.value })}
                placeholder="Filter by municipality"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
              <input
                type="text"
                value={filters.barangay}
                onChange={(e) => setFilters({ ...filters, barangay: e.target.value })}
                placeholder="Filter by barangay"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search farmer, location..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Harvests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading harvests...</div>
          ) : filteredHarvests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No harvests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiber (kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHarvests.map((harvest) => (
                    <tr key={harvest.harvest_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(harvest.harvest_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {harvest.farmer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {harvest.municipality}, {harvest.barangay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {harvest.abaca_variety}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {harvest.area_hectares} ha
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {harvest.dry_fiber_output_kg?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {harvest.fiber_grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(harvest.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => alert(`View details for harvest ${harvest.harvest_id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing <span className="font-semibold">{filteredHarvests.length}</span> of{' '}
              <span className="font-semibold">{harvests.length}</span> harvests
            </div>
            <div>
              Total Fiber: <span className="font-semibold text-green-600">
                {filteredHarvests.reduce((sum, h) => sum + (h.dry_fiber_output_kg || 0), 0).toFixed(2)} kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
