import React, { useState, useEffect } from 'react';
import {
  Truck, Package, CheckCircle, XCircle, User,
  DollarSign, Download, Search, Eye, Leaf, Award
} from 'lucide-react';

interface Delivery {
  delivery_id: string;
  farmer_id: string;
  buyer_id: string;
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
  payment_method: string;
  payment_status: string;
  notes: string;
  status: string;
  created_at: string;
  buyers?: {
    business_name: string;
    contact_number: string;
    business_address: string;
    profile_photo?: string;
  };
  farmers?: {
    full_name: string;
    contact_number: string;
    municipality: string;
    barangay: string;
  };
}

const DeliveryTrackingMonitor: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'In Transit': 'bg-purple-100 text-purple-800 border-purple-300',
      'Delivered': 'bg-green-100 text-green-800 border-green-300',
      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Unpaid': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusProgress = (status: string) => {
    const progress: { [key: string]: number } = {
      'In Transit': 33, 'Delivered': 66, 'Completed': 100, 'Cancelled': 0
    };
    return progress[status] || 0;
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const farmerName = delivery.farmers 
      ? delivery.farmers.full_name.toLowerCase()
      : '';
    const matchesSearch = 
      delivery.buyers?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.delivery_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farmerName.includes(searchQuery.toLowerCase());
    return matchesSearch;
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
  }, [statusFilter, searchQuery]);

  const stats = {
    total: deliveries.length,
    in_transit: deliveries.filter(d => d.status === 'In Transit').length,
    delivered: deliveries.filter(d => d.status === 'Delivered').length,
    total_fiber_kg: deliveries.reduce((sum, d) => sum + parseFloat(d.quantity_kg.toString()), 0)
  };

  const downloadCSV = () => {
    const headers = ['Delivery ID', 'Farmer', 'Buyer', 'Variety', 'Quantity (kg)', 'Grade', 'Status', 'Delivery Date', 'Location', 'Payment Status'];
    const rows = filteredDeliveries.map(d => [
      d.delivery_id,
      d.farmers?.full_name || 'N/A',
      d.buyers?.business_name || 'N/A',
      d.variety,
      d.quantity_kg,
      d.grade,
      d.status,
      new Date(d.delivery_date).toLocaleDateString(),
      d.delivery_location,
      d.payment_status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Deliveries Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Truck className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Total Deliveries</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.total}</p>
          <p className="text-white/70 text-xs">All time deliveries</p>
        </div>

        {/* In Transit Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">In Transit</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.in_transit}</p>
          <p className="text-white/70 text-xs">Currently shipping</p>
        </div>

        {/* Delivered Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Delivered</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.delivered}</p>
          <p className="text-white/70 text-xs">Successfully delivered</p>
        </div>

        {/* Total Fiber Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Leaf className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Total Fiber</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.total_fiber_kg.toFixed(1)}</p>
          <p className="text-white/70 text-xs">Kilograms delivered</p>
        </div>
      </div>

      {/* Enhanced Filters & Search Section */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Status Filter Buttons - Left Side */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'In Transit', 'Delivered', 'Completed', 'Cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-4 rounded-2xl font-semibold transition-all duration-200 shadow-md border-2 ${
                  statusFilter === status 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-lg scale-105' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg'
                }`}
              >
                {status === 'all' ? 'All Deliveries' : status}
              </button>
            ))}
          </div>
          
          {/* Search & Export - Right Side */}
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farmers, buyers, variety, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
              />
            </div>
            
            <button 
              onClick={downloadCSV} 
              className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold border-2 border-blue-300 whitespace-nowrap"
            >
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries List - Sales Management Style */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-100 via-emerald-100 to-purple-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Buyer/Farmer
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Variety & Grade</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Quantity
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-indigo-100">
              {paginatedDeliveries.map((delivery, index) => (
                <tr 
                  key={delivery.delivery_id} 
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                  }`}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {delivery.buyers?.profile_photo ? (
                          <img 
                            src={delivery.buyers.profile_photo} 
                            alt={delivery.buyers.business_name}
                            className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white"
                            onError={(e) => {
                              // Fallback to gradient avatar if image fails to load
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const sibling = target.nextElementSibling as HTMLDivElement;
                              if (sibling) sibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white"
                          style={{ display: delivery.buyers?.profile_photo ? 'none' : 'flex' }}
                        >
                          {delivery.buyers?.business_name?.charAt(0) || 'B'}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-blue-900 text-sm">{delivery.buyers?.business_name || 'Buyer'}</div>
                        {delivery.farmers && (
                          <div className="text-emerald-600 text-xs font-medium">👨‍🌾 {delivery.farmers.full_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{delivery.variety}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Award size={12} className="text-amber-500" />
                        {delivery.grade}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{delivery.quantity_kg} kg</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{new Date(delivery.delivery_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {delivery.status === 'In Transit' && <Truck className="w-4 h-4 text-purple-500" />}
                      {delivery.status === 'Delivered' && <Package className="w-4 h-4 text-green-500" />}
                      {delivery.status === 'Completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {delivery.status === 'Cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full shadow-md ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-20 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            getStatusProgress(delivery.status) === 100 
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                              : getStatusProgress(delivery.status) >= 50
                              ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                              : 'bg-gradient-to-r from-purple-500 to-blue-500'
                          }`}
                          style={{ width: `${getStatusProgress(delivery.status)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{getStatusProgress(delivery.status)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <button 
                      onClick={() => { setSelectedDelivery(delivery); setShowDetailsModal(true); }}
                      className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - Sales Management Style */}
        <div className="p-6 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Show entries:</span>
              <div className="flex gap-2">
                {[10, 20, 30].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setEntriesPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      entriesPerPage === size
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
      </div>

      {totalEntries === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No deliveries found</p>
          <p className="text-sm text-gray-500">{searchQuery ? 'Try adjusting your search criteria' : 'Deliveries will appear here once created'}</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Status</p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedDelivery.status)}`}>{selectedDelivery.status}</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="text-blue-500" size={20} />
                    Buyer Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-semibold">{selectedDelivery.buyers?.business_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-semibold">{selectedDelivery.buyer_contact}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="text-green-500" size={20} />
                    Farmer Information
                  </h3>
                  <div className="space-y-2">
                    {selectedDelivery.farmers && (
                      <div>
                        <p className="text-sm text-gray-600">Farmer Name</p>
                        <p className="font-semibold text-lg text-emerald-600">
                          {selectedDelivery.farmers.full_name}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Contact Number</p>
                      <p className="font-semibold">{selectedDelivery.farmer_contact}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="font-semibold">{selectedDelivery.pickup_location}</p>
                    </div>
                    {selectedDelivery.farmers && (
                      <div>
                        <p className="text-sm text-gray-600">Farmer Address</p>
                        <p className="font-semibold">{selectedDelivery.farmers.barangay}, {selectedDelivery.farmers.municipality}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Leaf className="text-emerald-500" size={20} />
                  Fiber Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Variety</p>
                    <p className="font-semibold">{selectedDelivery.variety}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity (kg)</p>
                    <p className="font-semibold">{selectedDelivery.quantity_kg} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-semibold">{selectedDelivery.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price/kg</p>
                    <p className="font-semibold">₱{selectedDelivery.price_per_kg}</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="text-purple-500" size={20} />
                  Delivery Information
                </h3>
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Delivery Date</p>
                      <p className="font-semibold">{new Date(selectedDelivery.delivery_date).toLocaleDateString()} {selectedDelivery.delivery_time && `at ${selectedDelivery.delivery_time}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Delivery Method</p>
                      <p className="font-semibold">{selectedDelivery.delivery_method}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Location</p>
                    <p className="font-semibold">{selectedDelivery.delivery_location}</p>
                  </div>
                </div>
              </div>
              {selectedDelivery.total_amount > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign className="text-indigo-500" size={20} />
                    Payment Information
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-lg text-indigo-600">₱{selectedDelivery.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-semibold">{selectedDelivery.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedDelivery.payment_status)}`}>{selectedDelivery.payment_status}</span>
                    </div>
                  </div>
                </div>
              )}
              {selectedDelivery.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingMonitor;
