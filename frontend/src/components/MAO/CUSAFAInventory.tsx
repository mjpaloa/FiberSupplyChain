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
  DollarSign,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle
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
      const response = await fetch('http://localhost:3001/api/cusafa-inventory', {
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
      
      const response = await fetch('http://localhost:3001/api/buyers/all', {
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
      const response = await fetch('http://localhost:3001/api/fiber-deliveries/create', {
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
    return matchesSearch && matchesVariety;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Stock</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total.toFixed(2)} <span className="text-lg text-gray-600">kg</span></p>
          <p className="text-xs text-gray-500 mt-2">All fiber in inventory</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">In Stock</p>
          <p className="text-3xl font-bold text-gray-900">{stats.inStock.toFixed(2)} <span className="text-lg text-gray-600">kg</span></p>
          <p className="text-xs text-gray-500 mt-2">Available for delivery</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{stats.items} <span className="text-lg text-gray-600">records</span></p>
          <p className="text-xs text-gray-500 mt-2">Harvest entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search farmer or variety..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="processed">Processed</option>
          </select>
          <select
            value={varietyFilter}
            onChange={(e) => setVarietyFilter(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-gray-700"
          >
            <option value="all">All Varieties</option>
            {varieties.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Variety</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity (kg)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Harvest Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => (
                <tr key={item.harvest_id} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.farmers?.profile_picture ? (
                      <img 
                        src={item.farmers.profile_picture} 
                        alt={item.farmers?.full_name || item.farmer_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ display: item.farmers?.profile_picture ? 'none' : 'flex' }}
                    >
                      {(item.farmers?.full_name || item.farmer_name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.farmers?.full_name || item.farmer_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.barangay}, {item.municipality}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                    {item.abaca_variety}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-bold text-gray-900">{parseFloat(item.dry_fiber_output_kg?.toString() || '0').toFixed(2)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                    {item.fiber_grade || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(item.harvest_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold">
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {item.municipality}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={async () => {
                      setSelectedHarvest(item);
                      setShowDeliveryModal(true);
                      fetchBuyers();
                      
                      // Try to auto-fill farmer contact from multiple sources
                      try {
                        const token = localStorage.getItem('accessToken');
                        
                        // First, try to get from farmers table via harvest
                        const farmerResponse = await fetch(`http://localhost:3001/api/farmers/${item.farmer_id}`, {
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
                        // Clear the field if auto-fill fails
                        setFormData(prev => ({
                          ...prev,
                          farmer_contact: ''
                        }));
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                  >
                    <Truck size={16} />
                    Create Delivery
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
      </div>

      {showDeliveryModal && selectedHarvest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-8 flex justify-between items-center sticky top-0 z-10 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Truck className="text-white" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Create Fiber Delivery</h2>
                  <p className="text-emerald-50 text-sm mt-1">Schedule delivery from inventory to buyer</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedHarvest(null);
                }}
                className="p-3 hover:bg-white/20 rounded-xl transition-all text-white"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Harvest Details Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-blue-500 rounded-xl">
                    <Package className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Harvest Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Farmer</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedHarvest.farmers?.full_name || selectedHarvest.farmer_name}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Variety</p>
                    <p className="font-bold text-emerald-600 text-lg">{selectedHarvest.abaca_variety}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedHarvest.dry_fiber_output_kg} <span className="text-base text-gray-600">kg</span></p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Grade</p>
                    <p className="font-bold text-blue-600 text-lg">{selectedHarvest.fiber_grade}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedHarvest.barangay}, {selectedHarvest.municipality}</p>
                  </div>
                </div>
              </div>

              {/* Buyer Selection Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-6 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-xl">
                      <Building className="text-white" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Select Buyer</h3>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBuyers}
                    disabled={loadingBuyers}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md"
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
                  className="w-full px-5 py-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white hover:border-purple-300 disabled:bg-gray-100 font-medium text-gray-900"
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
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-emerald-500 rounded-xl">
                    <Calendar className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Delivery Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-500" />
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="delivery_date"
                      value={formData.delivery_date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium"
                    />
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Truck size={14} className="text-emerald-500" />
                      Delivery Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="delivery_method"
                      value={formData.delivery_method}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium"
                    >
                      <option value="CUSAFA Delivery">🚚 CUSAFA Delivery</option>
                      <option value="Buyer Pickup">🏢 Buyer Pickup</option>
                      <option value="Third-party">🚛 Third-party Courier</option>
                    </select>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Phone size={14} className="text-emerald-500" />
                      Farmer Contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="farmer_contact"
                      value={formData.farmer_contact}
                      onChange={handleInputChange}
                      placeholder="Enter farmer contact number"
                      required
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium"
                    />
                    {formData.farmer_contact && (
                      <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                        <CheckCircle size={12} />
                        Auto-filled from farmer profile
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" />
                      Delivery Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="delivery_location"
                      value={formData.delivery_location}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter delivery address"
                      className="w-full px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white hover:border-emerald-300 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-amber-500 rounded-xl">
                    <FileText className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Additional Notes</h3>
                </div>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Any special instructions or notes..."
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white hover:border-amber-300 resize-none font-medium"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-8 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeliveryModal(false);
                    setSelectedHarvest(null);
                  }}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
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
    </div>
  );
};

export default CUSAFAInventory;
