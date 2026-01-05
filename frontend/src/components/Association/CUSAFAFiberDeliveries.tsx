import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Eye,
  X,
  CheckCircle,
  Leaf,
  Award,
  Search,
  Trash2,
  Edit,
  Download,
  User,
  XCircle
} from 'lucide-react';

interface Delivery {
  delivery_id: string;
  delivery_date: string;
  delivery_time: string;
  variety: string;
  quantity_kg: number;
  grade: string;
  price_per_kg: number;
  total_amount: number;
  pickup_location: string;
  delivery_location: string;
  delivery_method: string;
  farmer_contact: string;
  buyer_contact: string;
  status: string;
  payment_status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  buyers?: {
    business_name: string;
    contact_number: string;
    business_address: string;
  };
  farmers?: {
    first_name: string;
    last_name: string;
    contact_number: string;
    municipality: string;
    barangay: string;
  };
}

const CUSAFAFiberDeliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await fetch(`https://easyabaca-api.vercel.app/api/fiber-deliveries/all${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setDeliveries(data.deliveries || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDelivery || !newStatus) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://easyabaca-api.vercel.app/api/fiber-deliveries/cusafa/${selectedDelivery.delivery_id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus, notes: statusNotes })
        }
      );

      if (response.ok) {
        alert('Status updated successfully!');
        setShowStatusModal(false);
        setSelectedDelivery(null);
        setNewStatus('');
        setStatusNotes('');
        fetchDeliveries();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const handleDeleteDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://easyabaca-api.vercel.app/api/fiber-deliveries/${selectedDelivery.delivery_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✅ Delivery deleted successfully!');
        setShowDeleteModal(false);
        setSelectedDelivery(null);
        fetchDeliveries();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Error deleting delivery');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'In Transit': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Completed': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter deliveries by search term
  const filteredDeliveries = deliveries.filter(delivery => {
    const searchLower = searchTerm.toLowerCase();
    const buyerName = delivery.buyers?.business_name?.toLowerCase() || '';
    const farmerName = `${delivery.farmers?.first_name || ''} ${delivery.farmers?.last_name || ''}`.toLowerCase();
    const variety = delivery.variety?.toLowerCase() || '';
    const deliveryId = delivery.delivery_id?.toLowerCase() || '';
    const location = delivery.delivery_location?.toLowerCase() || '';

    return buyerName.includes(searchLower) ||
      farmerName.includes(searchLower) ||
      variety.includes(searchLower) ||
      deliveryId.includes(searchLower) ||
      location.includes(searchLower);
  });

  // Pagination
  const totalEntries = filteredDeliveries.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const getStatusProgress = (status: string) => {
    const progress: { [key: string]: number } = {
      'In Transit': 33, 'Delivered': 66, 'Completed': 100, 'Cancelled': 0
    };
    return progress[status] || 0;
  };

  const downloadCSV = () => {
    const headers = ['Delivery ID', 'Farmer', 'Buyer', 'Variety', 'Quantity (kg)', 'Grade', 'Status', 'Delivery Date', 'Location'];
    const rows = filteredDeliveries.map(d => [
      d.delivery_id,
      `${d.farmers?.first_name || ''} ${d.farmers?.last_name || ''}`,
      d.buyers?.business_name || 'N/A',
      d.variety,
      d.quantity_kg,
      d.grade,
      d.status,
      new Date(d.delivery_date).toLocaleDateString(),
      d.delivery_location
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiber-deliveries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: deliveries.length,
    in_transit: deliveries.filter(d => d.status === 'In Transit').length,
    delivered: deliveries.filter(d => d.status === 'Delivered').length,
    completed: deliveries.filter(d => d.status === 'Completed').length,
    total_fiber_kg: deliveries.filter(d => d.status === 'Completed').reduce((sum, d) => sum + parseFloat(d.quantity_kg.toString()), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats - Match Association Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl shadow-lg p-4 md:p-5 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 md:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <h3 className="text-xs font-semibold opacity-90 mb-1.5 tracking-wide uppercase">Total Deliveries</h3>
            <p className="text-2xl md:text-3xl font-black mb-1">{stats.total}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <Package className="w-3.5 h-3.5" />
              <span>All deliveries</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-lg p-4 md:p-5 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 md:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Truck className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <h3 className="text-xs font-semibold opacity-90 mb-1.5 tracking-wide uppercase">In Transit</h3>
            <p className="text-2xl md:text-3xl font-black mb-1">{stats.in_transit}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <Truck className="w-3.5 h-3.5" />
              <span>On the way</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-lg p-4 md:p-5 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 md:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <h3 className="text-xs font-semibold opacity-90 mb-1.5 tracking-wide uppercase">Delivered</h3>
            <p className="text-2xl md:text-3xl font-black mb-1">{stats.delivered}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Received</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-lg p-4 md:p-5 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 md:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <h3 className="text-xs font-semibold opacity-90 mb-1.5 tracking-wide uppercase">Completed</h3>
            <p className="text-2xl md:text-3xl font-black mb-1">{stats.completed}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Processed</span>
            </div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-lg p-4 md:p-5 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 md:p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Leaf className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
            <h3 className="text-xs font-semibold opacity-90 mb-1.5 tracking-wide uppercase">Total Fiber (kg)</h3>
            <p className="text-2xl md:text-3xl font-black mb-1">{stats.total_fiber_kg.toFixed(2)}</p>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <Leaf className="w-3.5 h-3.5" />
              <span>Delivered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters & Search Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex flex-col gap-4">
          {/* Status Filter Buttons */}
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {['all', 'In Transit', 'Delivered', 'Completed', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 sm:px-5 md:px-6 py-3 sm:py-3 md:py-4 text-sm sm:text-sm md:text-base rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 shadow-md border-2 ${statusFilter === status
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg'
                  }`}
              >
                {status === 'all' ? 'All Deliveries' : status}
              </button>
            ))}
          </div>

          {/* Search & Export */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farmers, buyers, variety, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 sm:py-3 md:py-4 text-base sm:text-base bg-white border-2 border-blue-200 rounded-xl sm:rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
              />
            </div>

            <button
              onClick={downloadCSV}
              className="flex items-center justify-center px-6 py-3.5 sm:py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-xl sm:rounded-2xl hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold border-2 border-blue-300 whitespace-nowrap text-base"
            >
              <Download className="w-5 h-5 mr-2" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries Table - Sales Management Style */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-100 via-emerald-100 to-purple-100">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <User className="w-4 h-4 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Buyer/Farmer</span>
                    <span className="sm:hidden">Buyer</span>
                  </div>
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">Variety</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Package className="w-4 h-4 sm:w-4 sm:h-4" />
                    Qty
                  </div>
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4 text-left text-xs sm:text-sm md:text-base font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-indigo-100">
              {paginatedDeliveries.map((delivery, index) => (
                <tr
                  key={delivery.delivery_id}
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}
                >
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
                      <div className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm sm:text-sm md:text-base shadow-lg border-2 border-white">
                        {delivery.buyers?.business_name?.charAt(0) || 'B'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-blue-900 text-sm sm:text-sm md:text-base truncate">{delivery.buyers?.business_name || 'Buyer'}</div>
                        {delivery.farmers && (
                          <div className="text-emerald-600 text-xs sm:text-xs md:text-sm font-medium truncate hidden sm:block">👨‍🌾 {delivery.farmers.first_name} {delivery.farmers.last_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div>
                      <div className="text-sm sm:text-sm md:text-base font-semibold text-gray-900">{delivery.variety}</div>
                      <div className="text-xs sm:text-xs md:text-sm text-gray-500 flex items-center gap-1">
                        <Award size={12} className="sm:w-3 sm:h-3 text-amber-500" />
                        {delivery.grade}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div className="text-sm sm:text-sm md:text-base font-semibold text-gray-900">{delivery.quantity_kg} kg</div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div className="text-xs sm:text-xs md:text-sm font-semibold text-gray-900">
                      <span className="hidden sm:inline">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(delivery.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {delivery.status === 'In Transit' && <Truck className="w-4 h-4 sm:w-4 sm:h-4 text-purple-500" />}
                      {delivery.status === 'Delivered' && <Package className="w-4 h-4 sm:w-4 sm:h-4 text-green-500" />}
                      {delivery.status === 'Completed' && <CheckCircle className="w-4 h-4 sm:w-4 sm:h-4 text-emerald-500" />}
                      {delivery.status === 'Cancelled' && <XCircle className="w-4 h-4 sm:w-4 sm:h-4 text-red-500" />}
                      <span className={`inline-flex px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-1.5 text-xs sm:text-xs md:text-sm font-bold rounded-full shadow-md ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2 w-16 sm:w-20 overflow-hidden">
                        <div
                          className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${getStatusProgress(delivery.status) === 100
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                            : getStatusProgress(delivery.status) >= 50
                              ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500'
                            }`}
                          style={{ width: `${getStatusProgress(delivery.status)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-700">{getStatusProgress(delivery.status)}%</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-3 md:py-5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => { setSelectedDelivery(delivery); setShowDetailsModal(true); }}
                        className="p-2 sm:p-1.5 md:p-2 bg-blue-100 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                        title="View Details"
                      >
                        <Eye size={16} className="sm:w-4 sm:h-4" />
                      </button>
                      {delivery.status !== 'Completed' && delivery.status !== 'Cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setNewStatus(delivery.status);
                            setShowStatusModal(true);
                          }}
                          className="p-2 sm:p-1.5 md:p-2 bg-emerald-100 text-emerald-600 rounded-lg sm:rounded-xl hover:bg-emerald-200 hover:shadow-md transition-all duration-200 hidden sm:inline-flex"
                          title="Update Status"
                        >
                          <Edit size={16} className="sm:w-4 sm:h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 sm:p-1.5 md:p-2 bg-red-100 text-red-600 rounded-lg sm:rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 size={16} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - Sales Management Style */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Show entries:</span>
              <div className="flex gap-1 sm:gap-2">
                {[10, 20, 30].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setEntriesPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-200 ${entriesPerPage === size
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50 border border-gray-200'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Page info and navigation */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <span className="text-xs sm:text-sm text-gray-600">
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
              </span>
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-200 ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-200 ${currentPage === totalPages || totalPages === 0
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

      {totalEntries === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No deliveries found</p>
          <p className="text-sm text-gray-500">{searchTerm ? 'Try adjusting your search criteria' : 'Deliveries will appear here once created'}</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDelivery.status)}`}>
                  {selectedDelivery.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Farmer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {selectedDelivery.farmers?.first_name} {selectedDelivery.farmers?.last_name}</p>
                  <p className="text-sm"><strong>Contact:</strong> {selectedDelivery.farmer_contact}</p>
                  <p className="text-sm"><strong>Location:</strong> {selectedDelivery.farmers?.barangay}, {selectedDelivery.farmers?.municipality}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Buyer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Business:</strong> {selectedDelivery.buyers?.business_name}</p>
                  <p className="text-sm"><strong>Contact:</strong> {selectedDelivery.buyer_contact}</p>
                  <p className="text-sm"><strong>Address:</strong> {selectedDelivery.buyers?.business_address}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Fiber Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Variety</p>
                    <p className="font-semibold">{selectedDelivery.variety}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fiber (kg)</p>
                    <p className="font-semibold">{selectedDelivery.quantity_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-semibold">{selectedDelivery.grade}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Delivery Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Delivery Date & Time</p>
                    <p className="font-semibold">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                      {selectedDelivery.delivery_time && ` at ${selectedDelivery.delivery_time}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Method</p>
                    <p className="font-semibold">{selectedDelivery.delivery_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pickup Location</p>
                    <p className="font-semibold">{selectedDelivery.pickup_location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Location</p>
                    <p className="font-semibold">{selectedDelivery.delivery_location}</p>
                  </div>
                </div>
              </div>


              {selectedDelivery.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update Delivery Status</h2>
                <p className="text-sm text-gray-600">Change the status of this delivery</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Farmer:</strong> {selectedDelivery.farmers?.first_name} {selectedDelivery.farmers?.last_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Buyer:</strong> {selectedDelivery.buyers?.business_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Current Status:</strong> {selectedDelivery.status}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Status <span className="text-red-500">*</span>
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this status change..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedDelivery(null);
                  setNewStatus('');
                  setStatusNotes('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Delivery</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Delivery ID:</strong> {selectedDelivery.delivery_id}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Buyer:</strong> {selectedDelivery.buyers?.business_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Quantity:</strong> {selectedDelivery.quantity_kg} kg
              </p>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this delivery? This will permanently remove the delivery record from the system.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDelivery(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDelivery}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CUSAFAFiberDeliveries;
