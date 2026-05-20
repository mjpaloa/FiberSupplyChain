import { useState, useEffect } from 'react';
import { Globe, User } from 'lucide-react';

interface InventoryItem {
  inventory_id: string;
  harvest_id: string;
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
    harvest_date: string;
    abaca_variety: string;
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

export default function MAOInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Stocked');
  const [viewMode, setViewMode] = useState<'own' | 'all'>('own');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.isSuperAdmin === true;

  useEffect(() => {
    fetchInventory();
    fetchStatistics();
  }, [filter, viewMode]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const statusParam = filter !== 'all' ? `?status=${encodeURIComponent(filter)}` : '';
      
      // Use different endpoint based on view mode
      const endpoint = (isSuperAdmin && viewMode === 'all')
        ? `https://server.easyabaca.site/api/inventory/admin/inventory/all${statusParam}`
        : `https://server.easyabaca.site/api/inventory/inventory${statusParam}`;
      
      const response = await fetch(endpoint, {
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
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('https://server.easyabaca.site/api/inventory/inventory/statistics', {
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
    (item.harvests?.farmer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.harvests?.municipality?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.storage_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.mao_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['MAO Officer', 'Farmer', 'Variety', 'Grade', 'Stock (kg)', 'Distributed (kg)', 'Storage', 'Status'];
    const rows = filteredInventory.map(item => [
      item.mao_name || 'N/A',
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
        {/* Header with View Mode Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Inventory Management</h1>
            <p className="text-gray-600 mt-1">
              {viewMode === 'all' ? 'Viewing all system inventory' : 'Viewing your inventory'}
            </p>
          </div>
          <div className="flex gap-3">
            {isSuperAdmin && (
              <div className="flex bg-white rounded-lg shadow p-1">
                <button
                  onClick={() => setViewMode('own')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                    viewMode === 'own'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Inventory
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition ${
                    viewMode === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  All Inventory
                </button>
              </div>
            )}
            {viewMode === 'all' && (
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-semibold"
              >
                📊 Export CSV
              </button>
            )}
          </div>
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
              <div className="text-sm text-gray-600">{viewMode === 'all' && isSuperAdmin ? 'MAO Officers' : 'Stocked Items'}</div>
              <div className="text-2xl font-bold text-purple-600">
                {viewMode === 'all' && isSuperAdmin ? statistics.total_maos_managing : statistics.stocked_items}
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs and Search */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex items-center justify-between border-b">
            <div className="flex overflow-x-auto">
              {['Stocked', 'Reserved', 'Partially Distributed', 'Fully Distributed', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-6 py-3 font-medium whitespace-nowrap ${
                    filter === status
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
            {viewMode === 'all' && (
              <div className="px-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search MAO, farmer, location..."
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No inventory items found.</p>
              <button
                onClick={() => alert('Navigate to Harvest Verification page')}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Add Verified Harvests to Inventory
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {viewMode === 'all' && isSuperAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MAO Officer</th>
                    )}
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
                      {viewMode === 'all' && isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.mao_name || 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.harvests?.farmer_name}</div>
                        <div className="text-sm text-gray-500">{item.harvests?.municipality}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.harvests?.abaca_variety}
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
                          of {item.stock_weight_kg.toFixed(2)} kg ({getStockPercentage(item.current_stock_kg, item.stock_weight_kg)}%)
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => alert(`View details for inventory ${item.inventory_id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {item.current_stock_kg > 0 && (
                          <button
                            onClick={() => alert(`Create distribution for inventory ${item.inventory_id}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Distribute
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
