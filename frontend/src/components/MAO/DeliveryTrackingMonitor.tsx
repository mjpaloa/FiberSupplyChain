import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  Truck, Package, User,
  Download, Search, Eye, Leaf, Award, X
} from 'lucide-react';
import { KpiStrip, EditorialCard, SegmentedToggle, StatusPill } from '../Shared/EditorialUI';

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
  harvests?: {
    farmer_name: string;
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
      const response = await fetch(`${API_BASE_URL}/api/fiber-deliveries/all${statusParam}`, {
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

  const getStatusTone = (status: string): 'info' | 'success' | 'danger' | 'neutral' => {
    const tones: Record<string, 'info' | 'success' | 'danger' | 'neutral'> = {
      'In Transit': 'info',
      'Delivered': 'success',
      'Completed': 'success',
      'Cancelled': 'danger',
    };
    return tones[status] || 'neutral';
  };

  const getStatusProgress = (status: string) => {
    const progress: { [key: string]: number } = {
      'In Transit': 33, 'Delivered': 66, 'Completed': 100, 'Cancelled': 0
    };
    return progress[status] || 0;
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const farmerName = (delivery.farmers?.full_name || delivery.harvests?.farmer_name || '').toLowerCase();
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Deliveries',
            value: stats.total,
            subtext: 'All time deliveries',
          },
          {
            label: 'In Transit',
            value: stats.in_transit,
            subtext: 'Currently shipping',
          },
          {
            label: 'Delivered',
            value: stats.delivered,
            accentSubtext: 'Successfully delivered',
          },
          {
            label: 'Total Fiber',
            value: `${stats.total_fiber_kg.toFixed(1)} kg`,
            subtext: 'Kilograms delivered',
          },
        ]}
      />

      {/* Filters & Search Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="overflow-x-auto scrollbar-hide">
            <SegmentedToggle
              variant="amber"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Deliveries' },
                { value: 'In Transit', label: 'In Transit' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farmers, buyers, variety, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857] transition-colors placeholder:text-gray-400 text-gray-900 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={downloadCSV}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <EditorialCard noPadding>
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Fiber delivery tracking table">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Buyer / Farmer
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variety & Grade</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Quantity
                  </div>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedDeliveries.map((delivery) => {
                const progress = getStatusProgress(delivery.status);
                return (
                  <tr
                    key={delivery.delivery_id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {delivery.buyers?.profile_photo ? (
                            <img
                              src={delivery.buyers.profile_photo}
                              alt={delivery.buyers.business_name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const sibling = target.nextElementSibling as HTMLDivElement;
                                if (sibling) sibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-10 h-10 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-center text-[#047857] font-bold text-sm"
                            style={{ display: delivery.buyers?.profile_photo ? 'none' : 'flex' }}
                          >
                            {delivery.buyers?.business_name?.charAt(0) || 'B'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">{delivery.buyers?.business_name || 'Buyer'}</div>
                          <div className="text-gray-500 text-xs">
                            Farmer: {delivery.farmers?.full_name || delivery.harvests?.farmer_name || 'Farmer'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{delivery.variety}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Award size={12} className="text-[#E59500]" />
                          {delivery.grade}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 tabular-nums">{delivery.quantity_kg} kg</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 tabular-nums">{new Date(delivery.delivery_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill tone={getStatusTone(delivery.status)}>{delivery.status}</StatusPill>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 w-20 overflow-hidden border border-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progress === 100
                                ? 'bg-[#047857]'
                                : progress >= 50
                                  ? 'bg-[#059669]'
                                  : progress > 0
                                    ? 'bg-[#E59500]'
                                    : 'bg-gray-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 tabular-nums">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => { setSelectedDelivery(delivery); setShowDetailsModal(true); }}
                        className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:text-[#047857] hover:border-[#047857] hover:bg-[#EAF6F0]/40 transition-colors"
                        title="View Details"
                        aria-label={`View delivery details for ${delivery.buyers?.business_name || 'delivery'}`}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-200 bg-[#FAFAFA]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-600">Show entries:</span>
              <div className="flex gap-1.5">
                {[10, 20, 30].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setEntriesPerPage(size);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${
                      entriesPerPage === size
                        ? 'bg-[#E59500] text-gray-900'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600 tabular-nums">
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    currentPage === totalPages || totalPages === 0
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </EditorialCard>

      {totalEntries === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-serif text-lg font-bold text-gray-900 mb-1">No deliveries found</p>
          <p className="text-sm text-gray-500">{searchQuery ? 'Try adjusting your search criteria' : 'Deliveries will appear here once created'}</p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-gray-200 flex justify-between items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl">
                    <Truck className="text-[#047857] w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">Delivery Details</h2>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 tabular-nums">
                  Tracking ID: <span className="text-gray-900 font-semibold">#{selectedDelivery.delivery_id.slice(0, 8)}</span>
                </p>
              </div>

              <button
                type="button"
                aria-label="Close delivery details"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Current Status</p>
                    <StatusPill tone={getStatusTone(selectedDelivery.status)}>{selectedDelivery.status}</StatusPill>
                  </div>
                  <div className="h-9 w-px bg-gray-200 hidden sm:block"></div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Date Created</p>
                    <p className="text-sm text-gray-900 font-semibold tabular-nums">{new Date(selectedDelivery.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 text-right hidden sm:block">Fulfillment<br />Progress</p>
                  <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-gray-200">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#047857] rounded-full transition-all duration-500"
                        style={{ width: `${getStatusProgress(selectedDelivery.status)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">{getStatusProgress(selectedDelivery.status)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Farmer Info */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-[#FAFAFA] px-5 py-3.5 flex items-center justify-between border-b border-gray-200">
                    <h3 className="font-serif font-bold text-gray-900 flex items-center gap-2 text-base">
                      <User size={18} className="text-[#047857]" />
                      Farmer Information
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Farmer Name</p>
                      <p className="font-semibold text-base text-gray-900 mt-0.5">
                        {selectedDelivery.farmers?.full_name || selectedDelivery.harvests?.farmer_name || 'N/A'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Contact</p>
                        <p className="text-sm font-medium text-gray-900 tabular-nums mt-0.5">{selectedDelivery.farmer_contact || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {selectedDelivery.farmers ? `${selectedDelivery.farmers.barangay}, ${selectedDelivery.farmers.municipality}` : selectedDelivery.pickup_location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="bg-[#FAFAFA] px-5 py-3.5 flex items-center justify-between border-b border-gray-200">
                    <h3 className="font-serif font-bold text-gray-900 flex items-center gap-2 text-base">
                      <Truck size={18} className="text-[#047857]" />
                      Buyer Information
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Business Name</p>
                      <p className="font-semibold text-base text-gray-900 mt-0.5">{selectedDelivery.buyers?.business_name || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Contact</p>
                        <p className="text-sm font-medium text-gray-900 tabular-nums mt-0.5">{selectedDelivery.buyer_contact || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900 truncate mt-0.5" title={selectedDelivery.buyers?.business_address}>
                          {selectedDelivery.buyers?.business_address || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-5">
                {/* Fiber Details */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-serif font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                    <Leaf size={18} className="text-[#047857]" />
                    Fiber Details
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">Variety</p>
                      <p className="text-lg font-bold text-gray-900">{selectedDelivery.variety}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">Weight</p>
                      <p className="text-lg font-bold text-[#047857] tabular-nums">{selectedDelivery.quantity_kg} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-1">Grade</p>
                      <p className="text-lg font-bold text-[#92400E]">{selectedDelivery.grade}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Logistics */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-serif font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Truck size={18} className="text-[#047857]" />
                    Logistics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Method</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedDelivery.delivery_method}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Date & Time</p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                        {new Date(selectedDelivery.delivery_date).toLocaleDateString()} at {selectedDelivery.delivery_time || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Delivery Location</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">{selectedDelivery.delivery_location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedDelivery.notes && (
                <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-200">
                  <h3 className="font-serif font-bold text-gray-900 text-base mb-2 flex items-center gap-2">
                    <Package size={16} className="text-gray-500" />
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingMonitor;
