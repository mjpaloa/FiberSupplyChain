import { useState, useEffect } from 'react';

interface InventoryItem {
  inventory_id: string;
  mao_name: string;
  stock_weight_kg: number;
  current_stock_kg: number;
  fiber_grade: string;
  fiber_quality_rating: string;
  storage_location: string;
  status: string;
  total_distributed_kg: number;
  created_at: string;
  harvests: {
    farmer_name: string;
    municipality: string;
    abaca_variety: string;
    harvest_date: string;
  };
}

interface Statistics {
  total_inventory_items: number;
  total_stock_kg: number;
  total_distributed_kg: number;
  stocked_items: number;
  total_inventory_value: number;
  total_maos_managing: number;
}

export default function SuperAdminInventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    storage_location: '',
    fiber_grade: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, [filters]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.storage_location) params.append('storage_location', filters.storage_location);
      if (filters.fiber_grade) params.append('fiber_grade', filters.fiber_grade);
      
      const queryString = params.toString();
      const url = `http://localhost:3001/api/inventory/admin/inventory/all${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inventory/inventory/statistics', {
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
      'Stocked': 'bg-green-100 text-green-800',
      'Reserved': 'bg-yellow-100 text-yellow-800',
      'Partially Distributed': 'bg-blue-100 text-blue-800',
      'Fully Distributed': 'bg-gray-100 text-gray-800',
      'Damaged': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getStockPercentage = (current: number, total: number) => {
    return ((current / total) * 100).toFixed(0);
  };

  const filteredInventory = inventory.filter(item =>
    item.mao_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.harvests?.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.storage_location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['MAO Officer', 'Farmer', 'Variety', 'Grade', 'Stock (kg)', 'Distributed (kg)', 'Storage', 'Status'];
    const rows = filteredInventory.map(item => [
      item.mao_name,
      item.harvests?.farmer_name || 'N/A',
      item.harvests?.abaca_variety || 'N/A',
      item.fiber_grade,
      item.current_stock_kg,
      item.total_distributed_kg,
      item.storage_location || 'N/A',
      item.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">All Inventory Dashboard</h1>
            <p className="text-gray-600 mt-1">Super Admin - View all system inventory</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-2xl font-bold text-green-800">{statistics.total_inventory_items}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Stock (kg)</div>
              <div className="text-2xl font-bold text-green-800">{statistics.total_stock_kg?.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Distributed (kg)</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.total_distributed_kg?.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">MAO Officers</div>
              <div className="text-2xl font-bold text-purple-600">{statistics.total_maos_managing}</div>
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
                <option value="Stocked">Stocked</option>
                <option value="Reserved">Reserved</option>
                <option value="Partially Distributed">Partially Distributed</option>
                <option value="Fully Distributed">Fully Distributed</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
              <input
                type="text"
                value={filters.storage_location}
                onChange={(e) => setFilters({ ...filters, storage_location: e.target.value })}
                placeholder="Filter by storage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiber Grade</label>
              <input
                type="text"
                value={filters.fiber_grade}
                onChange={(e) => setFilters({ ...filters, fiber_grade: e.target.value })}
                placeholder="Filter by grade"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search MAO, farmer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No inventory found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MAO Officer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variety</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.inventory_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.mao_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.harvests?.farmer_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{item.harvests?.municipality}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.harvests?.abaca_variety || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.fiber_grade}</div>
                        <div className="text-xs text-gray-500">{item.fiber_quality_rating}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.current_stock_kg.toFixed(2)} kg
                        </div>
                        <div className="text-xs text-gray-500">
                          of {item.stock_weight_kg.toFixed(2)} kg
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full" 
                            style={{ width: `${getStockPercentage(item.current_stock_kg, item.stock_weight_kg)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.storage_location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => alert(`View details for inventory ${item.inventory_id}`)}
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
              Showing <span className="font-semibold">{filteredInventory.length}</span> of{' '}
              <span className="font-semibold">{inventory.length}</span> items
            </div>
            <div className="flex gap-6">
              <div>
                Total Stock: <span className="font-semibold text-green-600">
                  {filteredInventory.reduce((sum, item) => sum + item.current_stock_kg, 0).toFixed(2)} kg
                </span>
              </div>
              <div>
                Distributed: <span className="font-semibold text-blue-600">
                  {filteredInventory.reduce((sum, item) => sum + item.total_distributed_kg, 0).toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
