import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Calendar,
  Eye,
  X,
  MapPin,
  CheckCircle,
  Leaf,
  Award,
  Search,
  Trash2
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

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await fetch(`http://localhost:3001/api/fiber-deliveries/all${statusParam}`, {
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
        `http://localhost:3001/api/fiber-deliveries/cusafa/${selectedDelivery.delivery_id}/status`,
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
        `http://localhost:3001/api/fiber-deliveries/${selectedDelivery.delivery_id}`,
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

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Unpaid': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter deliveries by search term
  const filteredDeliveries = deliveries.filter(delivery => {
    const searchLower = searchTerm.toLowerCase();
    const buyerName = delivery.buyers?.business_name?.toLowerCase() || '';
    const variety = delivery.variety?.toLowerCase() || '';
    const deliveryId = delivery.delivery_id?.toLowerCase() || '';
    const location = delivery.delivery_location?.toLowerCase() || '';
    
    return buyerName.includes(searchLower) ||
           variety.includes(searchLower) ||
           deliveryId.includes(searchLower) ||
           location.includes(searchLower);
  });

  const stats = {
    total: deliveries.length,
    in_transit: deliveries.filter(d => d.status === 'In Transit').length,
    delivered: deliveries.filter(d => d.status === 'Delivered').length,
    completed: deliveries.filter(d => d.status === 'Completed').length,
    total_fiber_kg: deliveries.reduce((sum, d) => sum + parseFloat(d.quantity_kg.toString()), 0)
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
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/20 rounded-2xl">
            <Truck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fiber Deliveries</h1>
            <p className="text-emerald-50 mt-1">Monitor and manage all fiber deliveries from farmers to buyers</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total Deliveries</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">In Transit</p>
          <p className="text-2xl font-bold text-gray-900">{stats.in_transit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Delivered</p>
          <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-emerald-500">
          <p className="text-sm text-gray-600 mb-1">Total Fiber (kg)</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.total_fiber_kg.toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by buyer, variety, delivery ID, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
        
        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'In Transit', 'Delivered', 'Completed', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
        
        {/* Results Count */}
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-emerald-600">{filteredDeliveries.length}</span> of {deliveries.length} deliveries
        </p>
      </div>

      {/* Deliveries List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDeliveries.map(delivery => (
          <div key={delivery.delivery_id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Truck className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {delivery.farmers?.first_name} {delivery.farmers?.last_name} → {delivery.buyers?.business_name}
                  </h3>
                  <p className="text-sm text-gray-600">{delivery.variety} - {delivery.grade}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-gray-400" size={16} />
                <span className="text-gray-700">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Leaf className="text-gray-400" size={16} />
                <div>
                  <p className="text-xs text-gray-500">Variety</p>
                  <p className="text-gray-700 font-medium">{delivery.variety}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="text-gray-400" size={16} />
                <div>
                  <p className="text-xs text-gray-500">Fiber (kg)</p>
                  <p className="text-gray-700 font-medium">{delivery.quantity_kg} kg</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="text-gray-400" size={16} />
                <div>
                  <p className="text-xs text-gray-500">Grade</p>
                  <p className="text-gray-700 font-medium">{delivery.grade}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} />
                <span>{delivery.delivery_method}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setShowDetailsModal(true);
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <Eye size={16} />
                  View
                </button>
                {delivery.status !== 'Completed' && delivery.status !== 'Cancelled' && (
                  <button
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setNewStatus(delivery.status);
                      setShowStatusModal(true);
                    }}
                    className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Update Status
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDeliveries.length === 0 && deliveries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No deliveries match your search</p>
        </div>
      )}

      {deliveries.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No deliveries found</p>
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
