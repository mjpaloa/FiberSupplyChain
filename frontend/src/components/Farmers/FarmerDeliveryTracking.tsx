import React, { useState, useEffect } from 'react';
import {
  Truck, Package, XCircle, User,
  Download, Search, Eye, Leaf, Award,
  MapPin, Calendar, Phone, Building2
} from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

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

const FarmerDeliveryTracking: React.FC = () => {
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
      // Use farmer-specific endpoint to get only their deliveries
      const response = await fetch(`https://fibersupplychain.onrender.com/api/fiber-deliveries/farmer/my-deliveries${statusParam}`, {
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
      'Cancelled': 'danger'
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
    const matchesSearch =
      delivery.buyers?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.delivery_location.toLowerCase().includes(searchQuery.toLowerCase());
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
    const headers = ['Delivery ID', 'Buyer', 'Variety', 'Quantity (kg)', 'Grade', 'Status', 'Delivery Date', 'Location', 'Payment Status'];
    const rows = filteredDeliveries.map(d => [
      d.delivery_id,
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
    a.download = `my-deliveries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <EditorialCard>
        <div className="flex flex-col justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent mb-3" />
          <p className="text-sm text-gray-600 font-medium">Loading deliveries...</p>
        </div>
      </EditorialCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          { label: 'Total Deliveries', value: stats.total, subtext: 'All time deliveries' },
          { label: 'In Transit', value: stats.in_transit, subtext: 'Currently shipping' },
          { label: 'Delivered', value: stats.delivered, subtext: 'Successfully delivered' },
          { label: 'Total Fiber', value: `${stats.total_fiber_kg.toFixed(1)} kg`, subtext: 'Kilograms delivered' }
        ]}
      />

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search buyers, variety..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] placeholder:text-gray-400 text-gray-900"
            />
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold whitespace-nowrap gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'In Transit', 'Delivered', 'Completed', 'Cancelled'].map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={active}
                className={`px-3.5 py-2 text-xs sm:text-sm rounded-xl transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#E59500] text-gray-900 font-semibold'
                    : 'bg-white text-gray-600 font-medium border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deliveries Table */}
      {totalEntries === 0 ? (
        <EditorialCard>
          <div className="py-12 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-serif text-lg font-bold text-gray-900 mb-1">No deliveries found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Your fiber deliveries will appear here once CUSAFA creates them from your inventory'}
            </p>
          </div>
        </EditorialCard>
      ) : (
        <EditorialCard noPadding>
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Fiber deliveries table">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Buyer
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Variety & Grade
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      Quantity
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedDeliveries.map((delivery) => {
                  const progress = getStatusProgress(delivery.status);
                  return (
                    <tr key={delivery.delivery_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {delivery.buyers?.profile_photo ? (
                              <img
                                src={delivery.buyers.profile_photo}
                                alt={delivery.buyers.business_name}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const sibling = target.nextElementSibling as HTMLDivElement;
                                  if (sibling) sibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-9 h-9 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-center text-[#047857] font-bold text-xs"
                              style={{ display: delivery.buyers?.profile_photo ? 'none' : 'flex' }}
                            >
                              {delivery.buyers?.business_name?.charAt(0) || 'B'}
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {delivery.buyers?.business_name || 'Buyer'}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{delivery.variety}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Award size={12} className="text-[#E59500]" />
                          {delivery.grade}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 tabular-nums">{delivery.quantity_kg} kg</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{new Date(delivery.delivery_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusPill tone={getStatusTone(delivery.status)}>{delivery.status}</StatusPill>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 w-20 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                progress === 100
                                  ? 'bg-[#047857]'
                                  : progress > 0
                                    ? 'bg-[#E59500]'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 tabular-nums">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          title="View Details"
                          aria-label={`View delivery ${delivery.delivery_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-gray-500">Show entries:</span>
                <div className="flex gap-1.5">
                  {[10, 20, 30].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setEntriesPerPage(size);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        entriesPerPage === size
                          ? 'bg-[#E59500] text-gray-900'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs text-gray-500 tabular-nums">
                  Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </EditorialCard>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl">
                  <Package className="w-5 h-5 text-[#047857]" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-900">Delivery Details</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Complete delivery information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close delivery details"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between bg-gray-50/70 border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Status</span>
                <StatusPill tone={getStatusTone(selectedDelivery.status)}>{selectedDelivery.status}</StatusPill>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {/* Buyer Information Card */}
                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-4 h-4 text-[#047857]" />
                    <h3 className="font-serif font-bold text-gray-900 text-base">Buyer Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Business Name</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDelivery.buyers?.business_name || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDelivery.buyer_contact}</p>
                    </div>
                  </div>
                </div>

                {/* Farmer Information Card */}
                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-[#047857]" />
                    <h3 className="font-serif font-bold text-gray-900 text-base">Farmer Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Farmer Name</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDelivery.farmers?.full_name || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Contact Number
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{selectedDelivery.farmer_contact}</p>
                    </div>
                    {selectedDelivery.pickup_location && (
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Pickup Location
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{selectedDelivery.pickup_location}</p>
                      </div>
                    )}
                    {selectedDelivery.farmers?.barangay && (
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Farmer Address
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedDelivery.farmers.barangay}, {selectedDelivery.farmers.municipality}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fiber Details Card */}
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="w-4 h-4 text-[#047857]" />
                  <h3 className="font-serif font-bold text-gray-900 text-base">Fiber Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Variety</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.variety}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Quantity (kg)</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{selectedDelivery.quantity_kg} kg</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Grade</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.grade}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information Card */}
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-4 h-4 text-[#E59500]" />
                  <h3 className="font-serif font-bold text-gray-900 text-base">Delivery Information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Delivery Date
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                      {selectedDelivery.delivery_time && ` at ${selectedDelivery.delivery_time}`}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Delivery Method</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.delivery_method}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200 md:col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Delivery Location
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.delivery_location}</p>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              {selectedDelivery.notes && (
                <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-serif font-bold text-gray-900 mb-3 text-base">Notes</h3>
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedDelivery.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDeliveryTracking;
