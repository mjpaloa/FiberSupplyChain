import React, { useState, useEffect } from 'react';
import { Package, DollarSign, TrendingUp, ShoppingCart, X } from 'lucide-react';

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

const BuyerInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/buyer-purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('📦 Purchases data:', data);
      
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
      const response = await fetch('https://easyabaca-api.vercel.app/api/buyer-purchases/inventory/sell', {
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

  const getClassColor = (fiberClass: string) => {
    switch (fiberClass) {
      case 'Class A': return 'from-emerald-500 to-green-600';
      case 'Class B': return 'from-blue-500 to-indigo-600';
      case 'Class C': return 'from-orange-500 to-amber-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getClassBadgeColor = (fiberClass: string) => {
    switch (fiberClass) {
      case 'Class A': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'Class B': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Class C': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalKg = inventory.reduce((sum, item) => sum + item.total_kg, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_kg * item.avg_purchase_price), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            My Fiber Inventory
          </h1>
          <p className="text-gray-600 mt-2">Track and manage your abaca fiber stock by class</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Stock</p>
              <p className="text-3xl font-bold mt-2">{totalKg.toFixed(2)} kg</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Value</p>
              <p className="text-3xl font-bold mt-2">₱{totalValue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Fiber Classes</p>
              <p className="text-3xl font-bold mt-2">{inventory.filter(i => i.total_kg > 0).length}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {inventory.map((item) => (
          <div key={item.fiber_class} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className={`bg-gradient-to-r ${getClassColor(item.fiber_class)} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{item.fiber_class}</h3>
                  <p className="text-sm opacity-90 mt-1">Abaca Fiber</p>
                </div>
                <Package className="w-10 h-10 opacity-80" />
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Quantity */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Available Stock</span>
                <span className="text-2xl font-bold text-gray-900">{item.total_kg.toFixed(2)} kg</span>
              </div>

              {/* Purchase Count */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Purchases</span>
                <span className="text-lg font-semibold text-gray-700">{item.purchase_count}</span>
              </div>

              {/* Avg Price */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Avg. Purchase Price</span>
                <span className="text-lg font-semibold text-gray-700">₱{item.avg_purchase_price.toFixed(2)}/kg</span>
              </div>

              {/* Total Value */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Total Value</span>
                <span className="text-lg font-bold text-emerald-600">₱{(item.total_kg * item.avg_purchase_price).toFixed(2)}</span>
              </div>

              {/* Sell Button */}
              <button
                onClick={() => openSaleModal(item)}
                disabled={item.total_kg === 0}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                  item.total_kg > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                Sell Fiber
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sale Modal */}
      {showSaleModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className={`bg-gradient-to-r ${getClassColor(selectedClass.fiber_class)} p-6 text-white flex justify-between items-center`}>
              <div>
                <h2 className="text-2xl font-bold">Sell {selectedClass.fiber_class}</h2>
                <p className="text-sm opacity-90 mt-1">Available: {selectedClass.total_kg.toFixed(2)} kg</p>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quantity (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedClass.total_kg}
                  required
                  value={saleFormData.quantity_kg || ''}
                  onChange={(e) => setSaleFormData({ ...saleFormData, quantity_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter quantity in kg"
                />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedClass.total_kg.toFixed(2)} kg</p>
              </div>

              {/* Price Per Kg */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Price per kg (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={saleFormData.price_per_kg || ''}
                  onChange={(e) => setSaleFormData({ ...saleFormData, price_per_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter selling price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Avg. purchase: ₱{selectedClass.avg_purchase_price.toFixed(2)}/kg
                </p>
              </div>

              {/* Buyer Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Buyer Name *</label>
                <input
                  type="text"
                  required
                  value={saleFormData.buyer_name}
                  onChange={(e) => setSaleFormData({ ...saleFormData, buyer_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter buyer name"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={saleFormData.notes}
                  onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-bold">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    ₱{(saleFormData.quantity_kg * saleFormData.price_per_kg).toFixed(2)}
                  </span>
                </div>
                {saleFormData.quantity_kg > 0 && (
                  <p className="text-xs text-gray-600 mt-2">
                    Profit: ₱{((saleFormData.price_per_kg - selectedClass.avg_purchase_price) * saleFormData.quantity_kg).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Complete Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerInventory;
