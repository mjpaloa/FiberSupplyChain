import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Truck,
  X,
  Calendar,
  MapPin
} from 'lucide-react';
import {
  KpiStrip,
  EditorialCard,
  StatusPill,
  EditorialCallout
} from '../Shared/EditorialUI';

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

interface InventoryItem {
  harvest_id: string;
  farmer_id: string;
  farmer_name: string;
  abaca_variety: string;
  dry_fiber_output_kg: number;
  harvest_date: string;
  fiber_grade: string;
  status: string;
  municipality: string;
  barangay: string;
  remarks: string;
  created_at: string;
  farmers?: {
    full_name: string;
    municipality: string;
    barangay: string;
    profile_picture?: string;
  };
}

const CUSAFAInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [varietyFilter, setVarietyFilter] = useState('all');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState<InventoryItem | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    buyer_id: '',
    delivery_date: '',
    delivery_method: 'CUSAFA Delivery',
    delivery_location: '',
    farmer_contact: '',
    notes: ''
  });

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/cusafa-inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔍 Fetching buyers from API...');
      
      const response = await fetch(`${API_BASE_URL}/api/buyers/all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch buyers:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('✅ Buyers loaded:', data.buyers?.length || 0, 'buyers');
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
      const response = await fetch(`${API_BASE_URL}/api/fiber-deliveries/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          fiber_inventory_id: selectedHarvest?.harvest_id
        })
      });

      if (response.ok) {
        alert('✅ Delivery created successfully! Fiber moved from inventory to deliveries.');
        setShowDeliveryModal(false);
        setSelectedHarvest(null);
        fetchInventory(); // Refresh inventory
        // Reset form
        setFormData({
          buyer_id: '',
          delivery_date: '',
          delivery_method: 'CUSAFA Delivery',
          delivery_location: '',
          farmer_contact: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('Error creating delivery');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const farmerName = item.farmers?.full_name || item.farmer_name || '';
    const matchesSearch = farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.abaca_variety.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVariety = varietyFilter === 'all' || item.abaca_variety === varietyFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesVariety && matchesStatus;
  });

  // Pagination
  const totalEntries = filteredInventory.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, varietyFilter, searchTerm]);

  const stats = {
    total: inventory.reduce((sum, item) => sum + (parseFloat(item.dry_fiber_output_kg?.toString() || '0')), 0),
    inStock: inventory.reduce((sum, item) => sum + (parseFloat(item.dry_fiber_output_kg?.toString() || '0')), 0),
    items: inventory.length
  };

  const varieties = Array.from(new Set(inventory.map(i => i.abaca_variety)));

  const getStatusTone = (status: string): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'in_stock':
        return 'success';
      case 'sold':
        return 'info';
      case 'processed':
        return 'warning';
      default:
        return 'neutral';
    }
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
      {/* Stats Cards */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Total Stock',
            value: `${stats.total.toFixed(2)} kg`,
            subtext: 'All fiber in inventory',
          },
          {
            label: 'In Stock',
            value: `${stats.inStock.toFixed(2)} kg`,
            subtext: 'Available for delivery',
          },
          {
            label: 'Total Items',
            value: `${stats.items} records`,
            subtext: 'Harvest entries',
          },
        ]}
      />

      {/* Filters */}
      <EditorialCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search farmer or variety..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="processed">Processed</option>
          </select>
          <select
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            aria-label="Filter by variety"
            className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
          >
            <option value="all">All Varieties</option>
            {varieties.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Items per page"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </EditorialCard>

      {/* Table */}
      <EditorialCard noPadding>
        {filteredInventory.length === 0 ? (
          <div className="text-center py-14 px-4">
            <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold text-base">No inventory items found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="CUSAFA fiber inventory">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Farmer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Variety</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Qty (kg)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedInventory.map((item) => (
                    <tr key={item.harvest_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.farmers?.profile_picture ? (
                            <img
                              src={item.farmers.profile_picture}
                              alt={item.farmers?.full_name || item.farmer_name}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextEl) nextEl.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs flex-shrink-0"
                            style={{ display: item.farmers?.profile_picture ? 'none' : 'flex' }}
                          >
                            {(item.farmers?.full_name || item.farmer_name).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{item.farmers?.full_name || item.farmer_name}</p>
                            <p className="text-xs text-gray-500 items-center gap-1 hidden sm:flex">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="truncate">{item.barangay}, {item.municipality}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-200 rounded-full text-xs font-medium whitespace-nowrap">
                          {item.abaca_variety}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                          {parseFloat(item.dry_fiber_output_kg?.toString() || '0').toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium whitespace-nowrap">
                          {item.fiber_grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 tabular-nums whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="hidden sm:inline">{new Date(item.harvest_date).toLocaleDateString()}</span>
                          <span className="sm:hidden">{new Date(item.harvest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone={getStatusTone(item.status)}>
                          {item.status}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{item.municipality}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={async () => {
                            setSelectedHarvest(item);
                            setShowDeliveryModal(true);
                            fetchBuyers();

                            // Try to auto-fill farmer contact from multiple sources
                            try {
                              const token = localStorage.getItem('accessToken');

                              // First, try to get from farmers table via harvest
                              const farmerResponse = await fetch(`${API_BASE_URL}/api/farmers/${item.farmer_id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });

                              if (farmerResponse.ok) {
                                const farmerData = await farmerResponse.json();
                                console.log('✅ Farmer data:', farmerData);
                                const contact = farmerData.contact_number || farmerData.phone_number || '';

                                if (contact) {
                                  setFormData(prev => ({
                                    ...prev,
                                    farmer_contact: contact
                                  }));
                                  console.log('✅ Auto-filled farmer contact:', contact);
                                } else {
                                  console.warn('⚠️ No contact number found in farmer data');
                                }
                              } else {
                                console.error('❌ Failed to fetch farmer data:', farmerResponse.status);
                              }
                            } catch (error) {
                              console.error('❌ Error fetching farmer contact:', error);
                              setFormData(prev => ({
                                ...prev,
                                farmer_contact: ''
                              }));
                            }
                          }}
                          className="px-3.5 py-2 text-xs bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors inline-flex items-center gap-1.5 font-semibold whitespace-nowrap"
                        >
                          <Truck size={14} />
                          <span className="hidden sm:inline">Create Delivery</span>
                          <span className="sm:hidden">Deliver</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-[#FAFAFA]">
              <p className="text-xs text-gray-500 tabular-nums">
                Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </EditorialCard>

      {showDeliveryModal && selectedHarvest && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 rounded-t-2xl">
              <div className="min-w-0">
                <h2 className="font-serif text-xl font-bold text-gray-900 truncate">Create Fiber Delivery</h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">Schedule delivery from inventory to buyer</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedHarvest(null);
                }}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 flex-shrink-0 ml-2"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Harvest Details Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Harvest Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">Farmer</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.farmers?.full_name || selectedHarvest.farmer_name}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                    <p className="font-semibold text-sm text-[#047857]">{selectedHarvest.abaca_variety}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedHarvest.dry_fiber_output_kg} kg</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5">Grade</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.fiber_grade}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200 sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedHarvest.barangay}, {selectedHarvest.municipality}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Selection Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-serif text-base font-bold text-gray-900">Select Buyer</h3>
                  <button
                    type="button"
                    onClick={fetchBuyers}
                    disabled={loadingBuyers}
                    className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-xs font-semibold w-full sm:w-auto"
                  >
                    {loadingBuyers ? 'Loading...' : 'Reload Buyers'}
                  </button>
                </div>
                <select
                  name="buyer_id"
                  value={formData.buyer_id}
                  onChange={handleInputChange}
                  required
                  disabled={loadingBuyers}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                >
                  <option value="">
                    {loadingBuyers ? 'Loading buyers...' : buyers.length === 0 ? 'No buyers available' : 'Choose buyer...'}
                  </option>
                  {buyers.map(buyer => (
                    <option key={buyer.buyer_id} value={buyer.buyer_id}>
                      {buyer.business_name} ({buyer.owner_name}) {buyer.contact_number ? `- ${buyer.contact_number}` : ''}
                    </option>
                  ))}
                </select>
                {!loadingBuyers && buyers.length === 0 && (
                  <EditorialCallout tone="rose">
                    No buyers found. Click "Reload Buyers" or check console.
                  </EditorialCallout>
                )}
                {!loadingBuyers && buyers.length > 0 && (
                  <EditorialCallout tone="emerald">
                    {buyers.length} buyer(s) loaded successfully.
                  </EditorialCallout>
                )}
              </div>

              {/* Delivery Information Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Delivery Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="delivery_date"
                      value={formData.delivery_date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Delivery Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="delivery_method"
                      value={formData.delivery_method}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                    >
                      <option value="CUSAFA Delivery">CUSAFA Delivery</option>
                      <option value="Buyer Pickup">Buyer Pickup</option>
                      <option value="Third-party">Third-party Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Farmer Contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="farmer_contact"
                      value={formData.farmer_contact}
                      onChange={handleInputChange}
                      placeholder="09xxxxxxxxx"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                    />
                    {formData.farmer_contact && (
                      <p className="text-[11px] text-[#047857] mt-1 font-medium">
                        Auto-filled from farmer profile
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Delivery Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="delivery_location"
                      value={formData.delivery_location}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter delivery address"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-[#F8F9FA] rounded-xl p-4 sm:p-5 border border-gray-200">
                <label className="block font-serif text-base font-bold text-gray-900 mb-2">Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setSelectedHarvest(null);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm"
                >
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CUSAFAInventory;
