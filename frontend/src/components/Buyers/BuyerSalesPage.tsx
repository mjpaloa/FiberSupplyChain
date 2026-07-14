import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface Purchase {
  purchase_id: string;
  price: number;
  contact_number: string;
  farmer_name: string;
  fiber_quality: string;
  quantity: number;
  variety: string;
  total_price: number;
  image_url: string;
  created_at: string;
  location: string;
  status: string;
  gross_profit?: number;
  net_profit?: number;
  profit?: number;
  delivery_date?: string;
  description?: string;
  requirements?: string;
}

const BuyerSalesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, [qualityFilter, dateFilter]);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://fibersupplychain.onrender.com/api/buyer-purchases?quality=${qualityFilter}&date=${dateFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.fiber_quality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    grossProfit: purchases.reduce((sum, p) => sum + (p.gross_profit || 0), 0),
    netProfit: purchases.reduce((sum, p) => sum + (p.net_profit || 0), 0),
    totalPurchases: purchases.length,
    totalQuantity: purchases.reduce((sum, p) => sum + p.quantity, 0)
  };

  const viewReceipt = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowReceiptModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Fiber Purchases</h1>
        <p className="text-gray-600">Track your fiber purchases and profits</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <TrendingUp size={20} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Gross Profit</h3>
          <p className="text-2xl font-bold mt-1">₱{totalStats.grossProfit.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <TrendingUp size={20} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Net Profit</h3>
          <p className="text-2xl font-bold mt-1">₱{totalStats.netProfit.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Purchases</h3>
          <p className="text-2xl font-bold mt-1">{totalStats.totalPurchases}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Quantity</h3>
          <p className="text-2xl font-bold mt-1">{totalStats.totalQuantity} kg</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by quality or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Qualities</option>
            <option value="Class A">Class A</option>
            <option value="Class B">Class B</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Purchases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPurchases.map((purchase) => (
          <div key={purchase.purchase_id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
            {/* Image */}
            {purchase.image_url && (
              <img
                src={purchase.image_url}
                alt="Fiber"
                className="w-full h-48 object-cover"
              />
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {purchase.fiber_quality}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${purchase.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    purchase.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                  }`}>
                  {purchase.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-gray-900">₱{purchase.price}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-semibold text-gray-900">{purchase.quantity} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-blue-600">₱{(purchase.price * purchase.quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit:</span>
                  <span className="font-bold text-emerald-600">₱{(purchase.profit || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={16} />
                  <span>{new Date(purchase.delivery_date || purchase.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Package size={16} />
                  <span>{purchase.location}</span>
                </div>
              </div>

              <button
                onClick={() => viewReceipt(purchase)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye size={16} />
                <span>View Receipt</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPurchases.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No purchases found</p>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Purchase Receipt</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Receipt Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Transaction Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-gray-900">#{selectedPurchase.purchase_id.slice(0, 12)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-gray-900">{new Date(selectedPurchase.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fiber Quality:</span>
                    <span className="font-semibold text-gray-900">{selectedPurchase.fiber_quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-semibold text-gray-900">{selectedPurchase.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per kg:</span>
                    <span className="font-semibold text-gray-900">₱{selectedPurchase.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{selectedPurchase.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="text-gray-900">{selectedPurchase.contact_number}</span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₱{(selectedPurchase.price * selectedPurchase.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Profit:</span>
                    <span className="font-semibold text-emerald-600">
                      ₱{(selectedPurchase.gross_profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Profit:</span>
                    <span className="font-semibold text-emerald-600">
                      ₱{(selectedPurchase.net_profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900">Total Amount:</span>
                      <span className="font-bold text-blue-600 text-xl">
                        ₱{(selectedPurchase.price * selectedPurchase.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedPurchase.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedPurchase.description}</p>
                </div>
              )}

              {/* Requirements */}
              {selectedPurchase.requirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                  <p className="text-gray-600">{selectedPurchase.requirements}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => window.print()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerSalesPage;
