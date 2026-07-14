import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  TrendingUp, 
  Archive, 
  Truck, 
  X, 
  Building,
  Calendar,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle
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
      const response = await fetch('https://fibersupplychain.onrender.com/api/cusafa-inventory', {
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
      
      const response = await fetch('https://fibersupplychain.onrender.com/api/buyers/all', {
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
      const response = await fetch('https://fibersupplychain.onrender.com/api/fiber-deliveries/create', {
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

  if (loading) {
    return <div className="flex justify-center items-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">TOTAL STOCK</p>
          <p className="text-4xl font-black mb-3">{stats.total.toFixed(2)} <span className="text-lg">kg</span></p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Package size={16} />
            <span>All fiber in inventory</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Archive size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">IN STOCK</p>
          <p className="text-4xl font-black mb-3">{stats.inStock.toFixed(2)} <span className="text-lg">kg</span></p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Archive size={16} />
            <span>Available for delivery</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">TOTAL ITEMS</p>
          <p className="text-4xl font-black mb-3">{stats.items} <span className="text-lg">records</span></p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Package size={16} />
            <span>Harvest entries</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search farmer or variety..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="processed">Processed</option>
          </select>
          <select
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-700"
          >
            <option value="all">All Varieties</option>
            {varieties.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-700 bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Farmer</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Variety</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Qty (kg)</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Grade</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Location</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-left text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInventory.map((item) => (
                <tr key={item.harvest_id} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <div className="flex items-center gap-2 sm:gap-2 md:gap-3">
                    {item.farmers?.profile_picture ? (
                      <img 
                        src={item.farmers.profile_picture} 
                        alt={item.farmers?.full_name || item.farmer_name}
                        className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextEl) nextEl.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-10 h-10 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-sm md:text-lg shadow-md"
                      style={{ display: item.farmers?.profile_picture ? 'none' : 'flex' }}
                    >
                      {(item.farmers?.full_name || item.farmer_name).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-sm md:text-base truncate">{item.farmers?.full_name || item.farmer_name}</p>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-500 flex items-center gap-1 hidden sm:flex">
                        <MapPin className="w-3 h-3 sm:w-3 sm:h-3" />
                        <span className="truncate">{item.barangay}, {item.municipality}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <span className="px-2.5 sm:px-2.5 md:px-3 py-1.5 sm:py-1 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-lg text-sm sm:text-sm md:text-sm font-semibold whitespace-nowrap">
                    {item.abaca_variety}
                  </span>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <span className="text-base sm:text-base md:text-lg font-bold text-gray-900">{parseFloat(item.dry_fiber_output_kg?.toString() || '0').toFixed(2)}</span>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <span className="px-2.5 sm:px-2.5 md:px-3 py-1.5 sm:py-1 md:py-1.5 bg-blue-100 text-blue-700 rounded-lg sm:rounded-lg text-sm sm:text-sm md:text-sm font-semibold whitespace-nowrap">
                    {item.fiber_grade || 'N/A'}
                  </span>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-sm md:text-sm text-gray-600">
                    <Calendar className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="hidden sm:inline">{new Date(item.harvest_date).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(item.harvest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <span className="inline-block px-2.5 sm:px-2.5 md:px-3 py-1.5 sm:py-1 md:py-1.5 bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-lg text-sm sm:text-sm md:text-sm font-semibold whitespace-nowrap">
                    {item.status}
                  </span>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 hidden sm:table-cell">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="truncate">{item.municipality}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-3 md:py-4">
                  <button
                    onClick={async () => {
                      setSelectedHarvest(item);
                      setShowDeliveryModal(true);
                      fetchBuyers();
                      
                      // Try to auto-fill farmer contact from multiple sources
                      try {
                        const token = localStorage.getItem('accessToken');
                        
                        // First, try to get from farmers table via harvest
                        const farmerResponse = await fetch(`https://fibersupplychain.onrender.com/api/farmers/${item.farmer_id}`, {
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
                    className="px-3 sm:px-3 md:px-4 py-2 sm:py-2 text-sm sm:text-sm md:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 sm:gap-2 font-semibold whitespace-nowrap"
                  >
                    <Truck size={16} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Create Delivery</span>
                    <span className="sm:hidden">Deliver</span>
                  </button>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredInventory.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No inventory items found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
        
        {/* Pagination Footer */}
        {filteredInventory.length > 0 && (
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeliveryModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-4 sm:p-6 md:p-8 flex justify-between items-center sticky top-0 z-10 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="p-2 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
                  <Truck className="text-white" size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white truncate">Create Fiber Delivery</h2>
                  <p className="text-emerald-50 text-xs sm:text-sm mt-1 truncate hidden sm:block">Schedule delivery from inventory to buyer</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedHarvest(null);
                }}
                className="p-2 sm:p-3 hover:bg-white/20 rounded-xl transition-all text-white flex-shrink-0 ml-2"
              >
                <X size={20} className="sm:w-7 sm:h-7" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Harvest Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg sm:rounded-xl">
                    <Package className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Harvest Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Farmer</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{selectedHarvest.farmers?.full_name || selectedHarvest.farmer_name}</p>
                  </div>
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Variety</p>
                    <p className="font-bold text-emerald-600 text-sm sm:text-base md:text-lg">{selectedHarvest.abaca_variety}</p>
                  </div>
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{selectedHarvest.dry_fiber_output_kg} <span className="text-sm sm:text-base text-gray-600">kg</span></p>
                  </div>
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                    <p className="font-bold text-blue-600 text-sm sm:text-base md:text-lg">{selectedHarvest.fiber_grade}</p>
                  </div>
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm sm:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{selectedHarvest.barangay}, {selectedHarvest.municipality}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Selection Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-purple-500 rounded-lg sm:rounded-xl">
                      <Building className="text-white" size={18} />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Select Buyer</h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBuyers}
                    disabled={loadingBuyers}
                    className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg sm:rounded-xl hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md text-sm sm:text-base w-full sm:w-auto justify-center"
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
                  className="w-full px-3 sm:px-5 py-3 sm:py-4 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white hover:border-purple-300 disabled:bg-gray-100 font-medium text-gray-900 text-sm sm:text-base"
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
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <XCircle size={16} className="text-red-500" />
                    <p className="text-sm text-red-600 font-medium">No buyers found. Click "Reload" or check console.</p>
                  </div>
                )}
                {!loadingBuyers && buyers.length > 0 && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">{buyers.length} buyer(s) loaded successfully</p>
                  </div>
                )}
              </div>

              {/* Delivery Information Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg sm:rounded-xl">
                    <Calendar className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Delivery Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                      <Calendar size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" />
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="delivery_date"
                      value={formData.delivery_date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-emerald-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium text-sm sm:text-base"
                    />
                  </div>

                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                      <Truck size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" />
                      Delivery Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="delivery_method"
                      value={formData.delivery_method}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-emerald-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium text-sm sm:text-base"
                    >
                      <option value="CUSAFA Delivery">🚚 CUSAFA Delivery</option>
                      <option value="Buyer Pickup">🏢 Buyer Pickup</option>
                      <option value="Third-party">🚛 Third-party Courier</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                      <Phone size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" />
                      Farmer Contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="farmer_contact"
                      value={formData.farmer_contact}
                      onChange={handleInputChange}
                      placeholder="09xxxxxxxxx"
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-emerald-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium text-sm sm:text-base"
                    />
                    {formData.farmer_contact && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Auto-filled from farmer profile
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                      <MapPin size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" />
                      Delivery Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="delivery_location"
                      value={formData.delivery_location}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter delivery address"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-emerald-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                  <div className="p-1.5 sm:p-2 bg-amber-500 rounded-lg sm:rounded-xl">
                    <FileText className="text-white" size={18} />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Additional Notes</h3>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white hover:border-amber-300 resize-none font-medium text-sm sm:text-base"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setSelectedHarvest(null);
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                >
                  <CheckCircle size={18} />
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
