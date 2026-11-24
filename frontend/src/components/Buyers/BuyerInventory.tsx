import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, X } from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface InventoryItem {
  fiber_class: string;
  total_kg: number;
  purchase_count: number;
  avg_purchase_price: number;
}

interface SaleFormData {
  fiber_class: string;
  quantity_kg: number;
  price_per_kg: number;
  buyer_name: string;
  notes: string;
}

interface Purchase {
  id: string;
  farmer_name: string;
  fiber_quality: string;
  quantity: string;
  price: string;
  created_at: string;
  variety?: string;
}

interface Sale {
  id: string;
  buyer_name: string;
  fiber_class: string;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  sale_date: string;
  notes?: string;
}

const BuyerInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<InventoryItem | null>(null);
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    fiber_class: '',
    quantity_kg: 0,
    price_per_kg: 0,
    buyer_name: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/buyer-purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      console.log('📦 Purchases data:', data);

      // Store purchases
      setPurchases(data.purchases || []);

      // Fetch sales data with error handling
      try {
        const salesResponse = await fetch('https://fibersupplychain.onrender.com/api/buyer-purchases/sales', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          console.log('💰 Sales data:', salesData);

          setSales(salesData.sales || []);

          // Calculate total sales amount
          const salesTotal = (salesData.sales || []).reduce((sum: number, sale: Sale) => sum + sale.total_amount, 0);
          setTotalSales(salesTotal);
        } else {
          console.warn('Sales endpoint not available yet');
          setSales([]);
          setTotalSales(0);
        }
      } catch (salesError) {
        console.warn('Error fetching sales (endpoint may not exist yet):', salesError);
        setSales([]);
        setTotalSales(0);
      }

      // Group purchases by fiber class
      const inventoryMap: { [key: string]: InventoryItem } = {
        'Class A': { fiber_class: 'Class A', total_kg: 0, purchase_count: 0, avg_purchase_price: 0 },
        'Class B': { fiber_class: 'Class B', total_kg: 0, purchase_count: 0, avg_purchase_price: 0 },
        'Class C': { fiber_class: 'Class C', total_kg: 0, purchase_count: 0, avg_purchase_price: 0 }
      };

      if (data.purchases && Array.isArray(data.purchases)) {
        data.purchases.forEach((purchase: any) => {
          const fiberClass = purchase.fiber_quality || purchase.quality || 'Class C';
          if (inventoryMap[fiberClass]) {
            inventoryMap[fiberClass].total_kg += parseFloat(purchase.quantity || 0);
            inventoryMap[fiberClass].purchase_count++;
            inventoryMap[fiberClass].avg_purchase_price += parseFloat(purchase.price || 0);
          }
        });

        // Calculate average prices
        Object.values(inventoryMap).forEach(item => {
          if (item.purchase_count > 0) {
            item.avg_purchase_price = item.avg_purchase_price / item.purchase_count;
          }
        });

        // Deduct sold quantities
        const soldByClass = data.sold_by_class || {};
        console.log('💰 Sold by class:', soldByClass);

        Object.keys(inventoryMap).forEach(fiberClass => {
          const soldQty = soldByClass[fiberClass] || 0;
          inventoryMap[fiberClass].total_kg -= soldQty;
          // Ensure no negative values
          if (inventoryMap[fiberClass].total_kg < 0) {
            inventoryMap[fiberClass].total_kg = 0;
          }
        });
      }

      console.log('📊 Net Inventory after sales:', Object.values(inventoryMap));
      setInventory(Object.values(inventoryMap));
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSaleModal = (item: InventoryItem) => {
    setSelectedClass(item);
    setSaleFormData({
      fiber_class: item.fiber_class,
      quantity_kg: 0,
      price_per_kg: item.avg_purchase_price * 1.2, // Suggest 20% markup
      buyer_name: '',
      notes: ''
    });
    setShowSaleModal(true);
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass || saleFormData.quantity_kg <= 0 || saleFormData.quantity_kg > selectedClass.total_kg) {
      alert(`Invalid quantity. Available: ${selectedClass?.total_kg || 0} kg`);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/buyer-purchases/inventory/sell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiber_class: saleFormData.fiber_class,
          quantity_kg: saleFormData.quantity_kg,
          price_per_kg: saleFormData.price_per_kg,
          total_amount: saleFormData.quantity_kg * saleFormData.price_per_kg,
          buyer_name: saleFormData.buyer_name,
          notes: saleFormData.notes
        })
      });

      if (response.ok) {
        alert('✅ Sale recorded successfully!');
        setShowSaleModal(false);
        fetchInventory(); // Refresh inventory
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || 'Failed to record sale'}`);
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('❌ Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const getClassTone = (fiberClass: string): 'success' | 'info' | 'warning' | 'neutral' => {
    switch (fiberClass) {
      case 'Class A': return 'success';
      case 'Class B': return 'info';
      case 'Class C': return 'warning';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  const totalKg = inventory.reduce((sum, item) => sum + item.total_kg, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_kg * item.avg_purchase_price), 0);
  const totalPurchaseCount = purchases.length;
  const totalSalesCount = sales.length;

  return (
    <div className="w-full max-w-full space-y-6">
      {/* KPI Summary Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Stock',
            value: `${totalKg.toFixed(2)} kg`,
            subtext: `${totalPurchaseCount} purchases recorded`,
          },
          {
            label: 'Inventory Worth',
            value: `₱${totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtext: 'Estimated stock valuation',
          },
          {
            label: 'Total Sales Revenue',
            value: `₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtext: `${totalSalesCount} completed sales`,
          },
          {
            label: 'Active Classes',
            value: inventory.filter(i => i.total_kg > 0).length,
            subtext: 'Classes currently in stock',
          },
        ]}
      />

      {/* Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <EditorialCard
            key={item.fiber_class}
            noPadding
            className="flex flex-col"
          >
            <div className="px-6 py-5 border-b border-gray-100 bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <StatusPill tone={getClassTone(item.fiber_class)}>{item.fiber_class}</StatusPill>
                <p className="text-xs text-gray-500 mt-2 font-medium">Abaca Fiber Grade</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1 flex flex-col">
              {/* Available Stock */}
              <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] p-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Available Stock</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {item.total_kg.toFixed(2)} <span className="text-sm font-medium text-gray-500">kg</span>
                </p>
                {item.total_kg === 0 && (
                  <p className="text-xs text-red-700 font-semibold mt-2">OUT OF STOCK</p>
                )}
              </div>

              {/* Stats Grid */}
              {item.total_kg > 0 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Purchases</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">{item.purchase_count}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Avg. Price</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">₱{item.avg_purchase_price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#EAF6F0] border border-[#CBEAD9] p-4">
                    <p className="text-[11px] font-semibold text-[#047857] uppercase tracking-wider mb-1">Estimated Value</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">
                      ₱{(item.total_kg * item.avg_purchase_price).toFixed(2)}
                    </p>
                  </div>
                </>
              )}

              {/* Sell Button */}
              <div className="mt-auto pt-2">
                <button
                  type="button"
                  onClick={() => openSaleModal(item)}
                  disabled={item.total_kg === 0}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                    item.total_kg > 0
                      ? 'bg-[#047857] hover:bg-[#065F46] text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{item.total_kg > 0 ? 'Sell Fiber' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          </EditorialCard>
        ))}
      </div>

      {/* Sale Modal */}
      {showSaleModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Sell {selectedClass.fiber_class}</h2>
                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  Available: {selectedClass.total_kg.toFixed(2)} kg
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaleModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedClass.total_kg}
                  required
                  value={saleFormData.quantity_kg || ''}
                  onChange={(e) => setSaleFormData({ ...saleFormData, quantity_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter quantity in kg"
                />
                <p className="text-xs text-gray-500 mt-1 tabular-nums">Max: {selectedClass.total_kg.toFixed(2)} kg</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Price per kg (₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={saleFormData.price_per_kg || ''}
                  onChange={(e) => setSaleFormData({ ...saleFormData, price_per_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter selling price"
                />
                <p className="text-xs text-gray-500 mt-1 tabular-nums">
                  Avg. purchase: ₱{selectedClass.avg_purchase_price.toFixed(2)}/kg
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Buyer Name *
                </label>
                <input
                  type="text"
                  required
                  value={saleFormData.buyer_name}
                  onChange={(e) => setSaleFormData({ ...saleFormData, buyer_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm"
                  placeholder="Enter buyer name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={saleFormData.notes}
                  onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 outline-none text-sm resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    ₱{(saleFormData.quantity_kg * saleFormData.price_per_kg).toFixed(2)}
                  </span>
                </div>
                {saleFormData.quantity_kg > 0 && (
                  <p className="text-xs text-gray-700 mt-1.5 tabular-nums">
                    Estimated Profit: ₱{((saleFormData.price_per_kg - selectedClass.avg_purchase_price) * saleFormData.quantity_kg).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#047857] hover:bg-[#065F46] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerInventory;
