import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/apiClient';
import {
  Download, Search, Package, TrendingUp, MapPin, CheckCircle, Eye, Truck, Calendar,
  X, Edit, Trash2, XCircle, AlertTriangle, Building, Phone, FileText, User, Leaf, Award, Building2
} from 'lucide-react';

interface Buyer {
  buyer_id: string;
  business_name: string;
  owner_name: string;
  business_address: string | null;
  contact_number: string | null;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  verification_status: string;
}

interface FiberInventoryItem {
  inventory_id: string;
  harvest_id: string;
  abaca_variety: string;
  dry_fiber_output_kg: number;
  fiber_grade: string;
  harvest_date: string;
  municipality: string;
  barangay: string;
}

const PhilippinePeso = ({ className, size = 24 }: { className?: string; size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <text
      x="12"
      y="12"
      dy="1"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="20"
      fontWeight="bold"
      fill="currentColor"
    >
      ₱
    </text>
  </svg>
);

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
  delivery_proof_image: string;
  receipt_image: string;
  created_at: string;
  harvest_id: string;
  buyers?: {
    business_name: string;
    contact_number: string;
    business_address: string;
  };
  farmers?: {
    full_name: string;
    contact_number: string;
    municipality: string;
    barangay: string;
  };
  harvests?: {
    farmer_name: string;
  };
}

interface DeliveryFormData {
  buyer_id: string;
  fiber_inventory_id: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method: string;
  delivery_location: string;
  farmer_contact: string;
  notes: string;
}

const FiberDeliveryManager: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [fiberInventory, setFiberInventory] = useState<FiberInventoryItem[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState<DeliveryFormData>({
    buyer_id: '',
    fiber_inventory_id: '',
    delivery_date: '',
    delivery_time: '',
    delivery_method: 'Self-delivery',
    delivery_location: '',
    farmer_contact: '',
    notes: ''
  });

  useEffect(() => {
    fetchDeliveries();
    fetchFiberInventory();
    fetchBuyers();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await apiGet(`/api/fiber-deliveries/farmer/my-deliveries${statusParam}`);
      const data = await response.json();
      setDeliveries(data.deliveries || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiberInventory = async () => {
    try {
      const response = await apiGet('/api/cusafa-inventory');
      const data = await response.json();
      setFiberInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching fiber inventory:', error);
    }
  };

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      console.log('🔍 Fetching buyers from API...');

      const response = await apiGet('/api/buyers/all');

      if (!response.ok) {
        console.error('❌ Failed to fetch buyers:', response.status);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error details:', errorData);
        return;
      }

      const data = await response.json();
      console.log('✅ Buyers loaded:', data.buyers?.length || 0, 'buyers');

      if (data.buyers && data.buyers.length > 0) {
        console.log('First buyer:', data.buyers[0].business_name);
      }

      setBuyers(data.buyers || []);
    } catch (error) {
      console.error('❌ Error fetching buyers:', error);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const url = isEditMode && selectedDelivery
        ? `https://server.easyabaca.site/api/fiber-deliveries/farmer/${selectedDelivery.delivery_id}`
        : 'https://server.easyabaca.site/api/fiber-deliveries/create';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(isEditMode ? 'Delivery updated successfully!' : 'Delivery scheduled successfully! Fiber moved from inventory to deliveries.');
        setShowCreateModal(false);
        setShowEditModal(false);
        setIsEditMode(false);
        fetchDeliveries();
        fetchFiberInventory(); // Refresh inventory to show updated list
        // Reset form
        setFormData({
          buyer_id: '',
          fiber_inventory_id: '',
          delivery_date: '',
          delivery_time: '',
          delivery_method: 'Self-delivery',
          delivery_location: '',
          farmer_contact: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving delivery:', error);
      alert('Error saving delivery');
    }
  };

  const handleEdit = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsEditMode(true);
    setFormData({
      buyer_id: '',
      fiber_inventory_id: '',
      delivery_date: delivery.delivery_date.split('T')[0],
      delivery_time: delivery.delivery_time || '',
      delivery_method: delivery.delivery_method,
      delivery_location: delivery.delivery_location || '',
      farmer_contact: delivery.farmer_contact,
      notes: delivery.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedDelivery) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://server.easyabaca.site/api/fiber-delivery/farmer/${selectedDelivery.delivery_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('Delivery deleted successfully!');
        setShowDeleteModal(false);
        setSelectedDelivery(null);
        fetchDeliveries();
        fetchFiberInventory();
      } else {
        const error = await response.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Error deleting delivery');
    }
  };

  const handleCancel = async () => {
    if (!selectedDelivery || !cancellationReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://server.easyabaca.site/api/fiber-deliveries/farmer/${selectedDelivery.delivery_id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cancellation_reason: cancellationReason })
        }
      );

      if (response.ok) {
        alert('Delivery cancelled successfully!');
        setShowCancelModal(false);
        setSelectedDelivery(null);
        setCancellationReason('');
        fetchDeliveries();
      } else {
        const error = await response.json();
        alert(`Failed to cancel: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      alert('Error cancelling delivery');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Confirmed': 'bg-blue-100 text-blue-800',
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

  const stats = {
    total: deliveries.length,
    in_transit: deliveries.filter(d => d.status === 'In Transit').length,
    delivered: deliveries.filter(d => d.status === 'Delivered').length,
    completed: deliveries.filter(d => d.status === 'Completed').length,
    total_revenue: deliveries
      .filter(d => d.payment_status === 'Paid')
      .reduce((sum, d) => sum + parseFloat(d.total_amount.toString()), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Fiber Deliveries</h1>
            <p className="text-sm sm:text-base text-gray-600">Monitor your fiber deliveries managed by CUSAFA</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
          >
            <Package size={18} />
            <span className="hidden sm:inline">Create Delivery</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
        <div className="p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Note:</strong> CUSAFA handles all delivery logistics and status updates. You can monitor your deliveries here.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border-l-4 border-blue-500">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Deliveries</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border-l-4 border-purple-500">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">In Transit</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.in_transit}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border-l-4 border-blue-500">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Delivered</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border-l-4 border-green-500">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border-l-4 border-emerald-500">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">₱{stats.total_revenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {['all', 'In Transit', 'Delivered', 'Completed', 'Cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors ${statusFilter === status
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {deliveries.map(delivery => (
          <div key={delivery.delivery_id} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-emerald-100 rounded-lg sm:rounded-xl">
                  <Truck className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{delivery.buyers?.business_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{delivery.variety} - {delivery.grade}</p>
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(delivery.payment_status)}`}>
                  {delivery.payment_status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Calendar className="text-gray-400" size={14} />
                <span className="text-gray-700">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Package className="text-gray-400" size={14} />
                <span className="text-gray-700">{delivery.quantity_kg} kg</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <PhilippinePeso className="text-gray-400" size={14} />
                <span className="text-gray-700">₱{delivery.price_per_kg}/kg</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <TrendingUp className="text-gray-400" size={14} />
                <span className="font-bold text-emerald-600">₱{delivery.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 sm:pt-4 border-t">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <MapPin size={14} />
                <span>{delivery.delivery_method}</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {/* View Button - Always visible */}
                <button
                  onClick={() => {
                    setSelectedDelivery(delivery);
                    setShowDetailsModal(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 sm:gap-2"
                >
                  <Eye size={14} />
                  View
                </button>

                {/* Edit Button - Only for In Transit */}
                {delivery.status === 'In Transit' && (
                  <button
                    onClick={() => handleEdit(delivery)}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1.5 sm:gap-2"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                )}

                {/* Cancel Button - For In Transit and Delivered */}
                {(delivery.status === 'In Transit' || delivery.status === 'Delivered') && (
                  <button
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setShowCancelModal(true);
                    }}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1.5 sm:gap-2"
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                )}

                {/* Delete Button - Only for Cancelled */}
                {delivery.status === 'Cancelled' && (
                  <button
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setShowDeleteModal(true);
                    }}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1.5 sm:gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {deliveries.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No deliveries found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Schedule Your First Delivery
          </button>
        </div>
      )}

      {/* Create Delivery Modal - Enhanced Design */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 flex justify-between items-center sticky top-0 z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Truck className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Create Fiber Delivery</h2>
                  <p className="text-emerald-50 text-sm">Schedule delivery from your inventory</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Harvest Details Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-emerald-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Harvest Details</h3>
                </div>

                <div className="space-y-4">
                  {/* Fiber Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Truck size={16} className="text-gray-500" />
                      Select Fiber from Inventory <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fiber_inventory_id"
                      value={formData.fiber_inventory_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white"
                    >
                      <option value="">Choose fiber...</option>
                      {fiberInventory.map(item => (
                        <option key={item.inventory_id} value={item.inventory_id}>
                          🌿 {item.abaca_variety} - {item.fiber_grade} - {item.dry_fiber_output_kg} kg
                        </option>
                      ))}
                    </select>
                    {fiberInventory.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        No fiber available in inventory
                      </p>
                    )}
                  </div>

                  {/* Select Buyer */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building size={16} className="text-gray-500" />
                        Select Buyer <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={fetchBuyers}
                        disabled={loadingBuyers}
                        className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {loadingBuyers ? '⏳' : '🔄'} Reload
                      </button>
                    </div>
                    <select
                      name="buyer_id"
                      value={formData.buyer_id}
                      onChange={handleInputChange}
                      required
                      disabled={loadingBuyers}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingBuyers ? '⏳ Loading buyers...' : buyers.length === 0 ? '❌ No buyers available' : 'Choose buyer...'}
                      </option>
                      {buyers.map(buyer => (
                        <option key={buyer.buyer_id} value={buyer.buyer_id}>
                          🏢 {buyer.business_name} ({buyer.owner_name}) {buyer.contact_number ? `📞 ${buyer.contact_number}` : ''}
                        </option>
                      ))}
                    </select>
                    {!loadingBuyers && buyers.length === 0 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <XCircle size={12} />
                        No buyers found. Click "Reload" or check console for errors.
                      </p>
                    )}
                    {!loadingBuyers && buyers.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle size={12} />
                        {buyers.length} buyer(s) loaded successfully
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Information Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Delivery Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="delivery_date"
                      value={formData.delivery_date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                    />
                  </div>

                  {/* Delivery Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Truck size={16} className="text-gray-500" />
                      Delivery Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="delivery_method"
                      value={formData.delivery_method}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                    >
                      <option value="Self-delivery">🚗 Self-delivery</option>
                      <option value="Buyer Pickup">🏢 Buyer Pickup</option>
                      <option value="Third-party">🚚 Third-party</option>
                    </select>
                  </div>

                  {/* Farmer Contact */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      Your Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="farmer_contact"
                      value={formData.farmer_contact}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" />
                    Delivery Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="delivery_location"
                    value={formData.delivery_location}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter delivery address"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Additional Notes Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-purple-600" size={20} />
                  <h3 className="text-lg font-bold text-gray-900">Additional Notes</h3>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 hover:bg-white resize-none"
                  placeholder="Any special instructions, delivery preferences, or notes for the buyer..."
                />
                <p className="text-xs text-gray-500 mt-2">Optional: Add any special requirements or instructions</p>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center gap-2 shadow-sm"
                >
                  <X size={20} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-semibold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle size={20} />
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[1.5rem] max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Delivery Details</h2>
                <p className="text-sm text-gray-500 font-medium">#{selectedDelivery.delivery_id.slice(0, 12)}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Delivery Summary Card */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4 text-blue-700">
                  <Package size={20} />
                  <h3 className="font-bold">Delivery Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Variety</p>
                    <p className="text-base font-bold text-slate-800">{selectedDelivery.variety}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Quantity</p>
                    <p className="text-base font-bold text-slate-800">{selectedDelivery.quantity_kg?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Date Created</p>
                    <p className="text-base font-bold text-slate-800">{new Date(selectedDelivery.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${getStatusColor(selectedDelivery.status)}`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-20"></span>
                      {selectedDelivery.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Farmer Information Card */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4 text-emerald-700">
                  <User size={20} />
                  <h3 className="font-bold">Farmer Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="col-span-2">
                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Name</p>
                    <p className="text-base font-bold text-slate-800">
                      {selectedDelivery.farmers?.full_name || selectedDelivery.harvests?.farmer_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Contact Number</p>
                    <p className="text-base font-bold text-slate-800">{selectedDelivery.farmer_contact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium mb-0.5">Location</p>
                    <p className="text-base font-bold text-slate-800">
                      {selectedDelivery.farmers ? `${selectedDelivery.farmers.barangay}, ${selectedDelivery.farmers.municipality}` : selectedDelivery.pickup_location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buyer Information Card */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4 text-slate-700">
                  <Building2 size={20} />
                  <h3 className="font-bold">Buyer Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Business Name</p>
                    <p className="text-base font-bold text-slate-800">{selectedDelivery.buyers?.business_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Contact Info</p>
                    <p className="text-base font-bold text-slate-800">{selectedDelivery.buyer_contact || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Address</p>
                    <p className="text-sm font-semibold text-slate-700">{selectedDelivery.buyers?.business_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Logistics & Payment Card */}
              <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4 text-purple-700">
                  <Truck size={20} />
                  <h3 className="font-bold">Logistics & Payment</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-0.5">Date & Time</p>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                      {selectedDelivery.delivery_time && ` at ${selectedDelivery.delivery_time}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-0.5">Method</p>
                    <p className="text-sm font-bold text-slate-800">{selectedDelivery.delivery_method}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-0.5">Destination</p>
                    <p className="text-sm font-bold text-slate-800">{selectedDelivery.delivery_location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-0.5">Total Amount</p>
                    <p className="text-base font-black text-purple-700">₱{selectedDelivery.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2 text-gray-700">
                    <FileText size={18} />
                    <h3 className="font-bold text-sm">Additional Notes</h3>
                  </div>
                  <p className="text-sm text-gray-600 italic leading-relaxed whitespace-pre-wrap">
                    {selectedDelivery.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-md active:scale-95 text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Edit Delivery</h2>
              <button onClick={() => {
                setShowEditModal(false);
                setIsEditMode(false);
              }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Farmer Contact */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="farmer_contact"
                    value={formData.farmer_contact}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="delivery_method"
                    value={formData.delivery_method}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Self-delivery">Self-delivery</option>
                    <option value="Buyer Pickup">Buyer Pickup</option>
                    <option value="Third-party">Third-party</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setIsEditMode(false);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  Update Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Delivery</h2>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Delivery to:</strong> {selectedDelivery.buyers?.business_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Variety:</strong> {selectedDelivery.variety} - {selectedDelivery.grade}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Quantity:</strong> {selectedDelivery.quantity_kg} kg
              </p>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this delivery? This will permanently remove it from your records.
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
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Delivery Modal */}
      {showCancelModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <XCircle className="text-orange-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cancel Delivery</h2>
                <p className="text-sm text-gray-600">Please provide a reason</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Delivery to:</strong> {selectedDelivery.buyers?.business_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Variety:</strong> {selectedDelivery.variety} - {selectedDelivery.grade}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> {selectedDelivery.status}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                placeholder="Please explain why you're cancelling this delivery..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedDelivery(null);
                  setCancellationReason('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Cancel Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiberDeliveryManager;
