import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Eye,
  X,
  CheckCircle,
  Award,
  Search,
  Trash2,
  Edit,
  Download,
  User,
  Building2,
  FileText
} from 'lucide-react';
import {
  KpiStrip,
  EditorialCard,
  StatusPill,
  SegmentedToggle,
  EditorialCallout
} from '../Shared/EditorialUI';

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
    full_name: string;
    contact_number: string;
    municipality: string;
    barangay: string;
  };
  harvests?: {
    farmer_name: string;
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
      const response = await fetch(`https://fibersupplychain.onrender.com/api/fiber-deliveries/all${statusParam}`, {
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
        `https://fibersupplychain.onrender.com/api/fiber-deliveries/cusafa/${selectedDelivery.delivery_id}/status`,
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
        `https://fibersupplychain.onrender.com/api/fiber-deliveries/${selectedDelivery.delivery_id}`,
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

  const getStatusTone = (status: string): 'warning' | 'info' | 'success' | 'danger' | 'neutral' => {
    switch (status) {
      case 'In Transit':
        return 'warning';
      case 'Delivered':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Filter deliveries by search term
  const filteredDeliveries = deliveries.filter(delivery => {
    const searchLower = searchTerm.toLowerCase();
    const buyerName = delivery.buyers?.business_name?.toLowerCase() || '';
    const farmerName = (delivery.farmers?.full_name || delivery.harvests?.farmer_name || '').toLowerCase();
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
      d.farmers?.full_name || d.harvests?.farmer_name || 'N/A',
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <KpiStrip
        columns={5}
        items={[
          {
            label: 'Total Deliveries',
            value: stats.total.toLocaleString(),
            subtext: 'All deliveries',
          },
          {
            label: 'In Transit',
            value: stats.in_transit.toLocaleString(),
            subtext: 'On the way',
          },
          {
            label: 'Delivered',
            value: stats.delivered.toLocaleString(),
            subtext: 'Received',
          },
          {
            label: 'Completed',
            value: stats.completed.toLocaleString(),
            subtext: 'Processed',
          },
          {
            label: 'Total Fiber (kg)',
            value: stats.total_fiber_kg.toFixed(2),
            subtext: 'Delivered',
          },
        ]}
      />

      {/* Filters & Search Section */}
      <EditorialCard>
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto pb-1">
            <SegmentedToggle
              variant="amber"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Deliveries' },
                { value: 'In Transit', label: 'In Transit' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          {/* Search & Export */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search farmers, buyers, variety, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={downloadCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </EditorialCard>

      {/* Deliveries Table */}
      <EditorialCard noPadding>
        {totalEntries === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold text-base mb-1">No deliveries found</p>
            <p className="text-xs text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Deliveries will appear here once created'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="CUSAFA fiber deliveries">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:inline">Buyer / Farmer</span>
                      <span className="sm:hidden">Buyer</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variety</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedDeliveries.map((delivery) => {
                    const progress = getStatusProgress(delivery.status);
                    return (
                      <tr key={delivery.delivery_id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs flex-shrink-0">
                              {delivery.buyers?.business_name?.charAt(0) || 'B'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {delivery.buyers?.business_name || 'Buyer'}
                              </div>
                              {delivery.farmers && (
                                <div className="text-gray-500 text-xs truncate hidden sm:block">
                                  {delivery.farmers.full_name || delivery.harvests?.farmer_name || 'Farmer'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{delivery.variety}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Award size={12} className="text-[#E59500]" />
                              <span>{delivery.grade}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 tabular-nums">{delivery.quantity_kg} kg</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-600 tabular-nums">
                            <span className="hidden sm:inline">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                            <span className="sm:hidden">{new Date(delivery.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusPill tone={getStatusTone(delivery.status)}>
                            {delivery.status}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  progress === 100
                                    ? 'bg-[#047857]'
                                    : progress >= 50
                                      ? 'bg-[#E59500]'
                                      : 'bg-[#78350F]'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700 tabular-nums">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setSelectedDelivery(delivery); setShowDetailsModal(true); }}
                              className="p-2 border border-gray-200 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                              title="View Details"
                              aria-label="View details"
                            >
                              <Eye size={15} />
                            </button>
                            {delivery.status !== 'Completed' && delivery.status !== 'Cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDelivery(delivery);
                                  setNewStatus(delivery.status);
                                  setShowStatusModal(true);
                                }}
                                className="p-2 border border-gray-200 bg-white text-[#047857] rounded-xl hover:bg-[#EAF6F0] transition-colors hidden sm:inline-flex"
                                title="Update Status"
                                aria-label="Update status"
                              >
                                <Edit size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 border border-gray-200 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                              title="Delete"
                              aria-label="Delete delivery"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-[#FAFAFA]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Show entries:</span>
                  <div className="flex gap-1">
                    {[10, 20, 30].map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => {
                          setEntriesPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 text-xs rounded-xl font-semibold border transition-colors tabular-nums ${
                          entriesPerPage === size
                            ? 'bg-[#E59500] text-gray-900 border-[#E59500]'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 tabular-nums">
                    Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3.5 py-1.5 text-xs rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </EditorialCard>

      {/* Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Delivery Details</h2>
                <p className="text-xs text-gray-500 font-medium tabular-nums mt-0.5">#{selectedDelivery.delivery_id.slice(0, 12)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Delivery Summary Card */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 text-gray-900">
                  <Package size={16} className="text-[#047857]" />
                  <h3 className="font-serif text-base font-bold">Delivery Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.variety}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{selectedDelivery.quantity_kg?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date Created</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{new Date(selectedDelivery.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusPill tone={getStatusTone(selectedDelivery.status)}>
                      {selectedDelivery.status}
                    </StatusPill>
                  </div>
                </div>
              </div>

              {/* Farmer Information Card */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 text-gray-900">
                  <User size={16} className="text-[#047857]" />
                  <h3 className="font-serif text-base font-bold">Farmer Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedDelivery.farmers?.full_name || selectedDelivery.harvests?.farmer_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Contact Number</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{selectedDelivery.farmer_contact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Barangay</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.farmers?.barangay || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Municipality</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.farmers?.municipality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Information Card */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 text-gray-900">
                  <Building2 size={16} className="text-[#E59500]" />
                  <h3 className="font-serif text-base font-bold">Buyer Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Business Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.buyers?.business_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Contact Info</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{selectedDelivery.buyer_contact || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Address</p>
                    <p className="text-sm text-gray-700">{selectedDelivery.buyers?.business_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery & Logistics Card */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 text-gray-900">
                  <Truck size={16} className="text-[#047857]" />
                  <h3 className="font-serif text-base font-bold">Logistics Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {new Date(selectedDelivery.delivery_date).toLocaleDateString()}
                      {selectedDelivery.delivery_time && ` at ${selectedDelivery.delivery_time}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Method</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.delivery_method}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Pickup</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.pickup_location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Destination</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedDelivery.delivery_location}</p>
                  </div>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2 text-gray-900">
                    <FileText size={16} className="text-gray-500" />
                    <h3 className="font-serif text-base font-bold">Additional Notes</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedDelivery.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2.5 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl">
                <CheckCircle className="text-[#047857]" size={20} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900">Update Delivery Status</h2>
                <p className="text-xs text-gray-500">Change the status of this delivery</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-1.5 text-sm text-gray-700">
                <p>
                  <strong className="text-gray-900">Farmer:</strong> {selectedDelivery.farmers?.full_name || selectedDelivery.harvests?.farmer_name || 'N/A'}
                </p>
                <p>
                  <strong className="text-gray-900">Buyer:</strong> {selectedDelivery.buyers?.business_name}
                </p>
                <p>
                  <strong className="text-gray-900">Current Status:</strong> {selectedDelivery.status}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
                >
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this status change..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedDelivery(null);
                  setNewStatus('');
                  setStatusNotes('');
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <CheckCircle size={16} />
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900">Delete Delivery</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4 space-y-1.5 text-sm text-gray-700">
                <p>
                  <strong className="text-gray-900">Delivery ID:</strong> <span className="tabular-nums">{selectedDelivery.delivery_id}</span>
                </p>
                <p>
                  <strong className="text-gray-900">Buyer:</strong> {selectedDelivery.buyers?.business_name}
                </p>
                <p>
                  <strong className="text-gray-900">Quantity:</strong> <span className="tabular-nums">{selectedDelivery.quantity_kg} kg</span>
                </p>
              </div>

              <EditorialCallout tone="rose">
                Are you sure you want to delete this delivery? This will permanently remove the delivery record from the system.
              </EditorialCallout>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDelivery(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDelivery}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Trash2 size={15} />
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
