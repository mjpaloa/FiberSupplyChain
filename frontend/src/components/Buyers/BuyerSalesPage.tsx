import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, Calendar, X } from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

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
        `${API_BASE_URL}/api/buyer-purchases?quality=${qualityFilter}&date=${dateFilter}`,
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
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Gross Profit',
            value: `₱${totalStats.grossProfit.toLocaleString()}`,
            subtext: 'Before deductions',
          },
          {
            label: 'Net Profit',
            value: `₱${totalStats.netProfit.toLocaleString()}`,
            subtext: 'Realized earnings',
          },
          {
            label: 'Total Purchases',
            value: totalStats.totalPurchases,
            subtext: 'Completed orders',
          },
          {
            label: 'Total Quantity',
            value: `${totalStats.totalQuantity} kg`,
            subtext: 'Fiber volume acquired',
          },
        ]}
      />

      {/* Filters */}
      <EditorialCard>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by quality or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white text-gray-700"
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
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white text-gray-700"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </EditorialCard>

      {/* Purchases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPurchases.map((purchase) => {
          const statusTone =
            purchase.status === 'Completed' ? 'success' :
            purchase.status === 'Pending' ? 'warning' : 'neutral';

          return (
            <EditorialCard key={purchase.purchase_id} noPadding className="flex flex-col">
              {purchase.image_url && (
                <img
                  src={purchase.image_url}
                  alt="Fiber"
                  className="w-full h-44 object-cover border-b border-gray-100"
                />
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <StatusPill tone="success">{purchase.fiber_quality}</StatusPill>
                  <StatusPill tone={statusTone}>{purchase.status}</StatusPill>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-semibold text-gray-900 tabular-nums">₱{purchase.price}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{purchase.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-gray-900 tabular-nums">
                      ₱{(purchase.price * purchase.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profit</span>
                    <span className="font-bold text-[#047857] tabular-nums">
                      ₱{(purchase.profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{new Date(purchase.delivery_date || purchase.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      <span className="truncate">{purchase.location}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => viewReceipt(purchase)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
                >
                  <Eye size={16} />
                  <span>View Receipt</span>
                </button>
              </div>
            </EditorialCard>
          );
        })}
      </div>

      {filteredPurchases.length === 0 && (
        <EditorialCard className="text-center py-12">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No purchases found</p>
        </EditorialCard>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPurchase && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Purchase Receipt</h2>
                <p className="text-xs font-mono text-gray-500 mt-0.5">#{selectedPurchase.purchase_id.slice(0, 12)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction Details</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-gray-900">#{selectedPurchase.purchase_id.slice(0, 12)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900">{new Date(selectedPurchase.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fiber Quality</span>
                    <span className="font-semibold text-gray-900">{selectedPurchase.fiber_quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{selectedPurchase.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price per kg</span>
                    <span className="font-semibold text-gray-900 tabular-nums">₱{selectedPurchase.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-900">{selectedPurchase.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact</span>
                    <span className="text-gray-900">{selectedPurchase.contact_number}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl p-5">
                <h3 className="text-xs font-semibold text-[#047857] uppercase tracking-wider mb-3">Financial Summary</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      ₱{(selectedPurchase.price * selectedPurchase.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Profit</span>
                    <span className="font-semibold text-[#047857] tabular-nums">
                      ₱{(selectedPurchase.gross_profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Profit</span>
                    <span className="font-semibold text-[#047857] tabular-nums">
                      ₱{(selectedPurchase.net_profit || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#CBEAD9] flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-gray-900 text-xl tabular-nums">
                      ₱{(selectedPurchase.price * selectedPurchase.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedPurchase.description && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedPurchase.description}</p>
                </div>
              )}

              {selectedPurchase.requirements && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Requirements</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedPurchase.requirements}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl font-semibold text-sm transition-colors"
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
