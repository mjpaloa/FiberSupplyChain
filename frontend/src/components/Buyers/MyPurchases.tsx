import React, { useState, useEffect } from 'react';
import { Package, Search, Eye, Edit, Trash2, X, DollarSign, User, Leaf } from 'lucide-react';

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
}

const MyPurchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('all');
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    price: '',
    contact_number: '',
    farmer_name: '',
    fiber_quality: '',
    quantity: '',
    variety: ''
  });

  useEffect(() => {
    fetchPurchases();
  }, [qualityFilter]);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://fibersupplychain.onrender.com/api/buyer-purchases?quality=${qualityFilter}`,
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

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsModal(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setEditFormData({
      price: purchase.price.toString(),
      contact_number: purchase.contact_number,
      farmer_name: purchase.farmer_name,
      fiber_quality: purchase.fiber_quality,
      quantity: purchase.quantity.toString(),
      variety: purchase.variety
    });
    setShowEditModal(true);
  };

  const handleDelete = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDeleteModal(true);
  };

  const submitEdit = async () => {
    if (!selectedPurchase) return;

    try {
      const token = localStorage.getItem('accessToken');
      const totalPrice = parseFloat(editFormData.price) * parseFloat(editFormData.quantity);
      
      const response = await fetch(
        `https://fibersupplychain.onrender.com/api/buyer-purchases/${selectedPurchase.purchase_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...editFormData,
            price: parseFloat(editFormData.price),
            quantity: parseFloat(editFormData.quantity),
            totalPrice: totalPrice
          })
        }
      );

      if (response.ok) {
        alert('✅ Purchase updated successfully!');
        setShowEditModal(false);
        fetchPurchases();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating purchase:', error);
      alert('Error updating purchase');
    }
  };

  const confirmDelete = async () => {
    if (!selectedPurchase) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://fibersupplychain.onrender.com/api/buyer-purchases/${selectedPurchase.purchase_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✅ Purchase deleted successfully!');
        setShowDeleteModal(false);
        fetchPurchases();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Error deleting purchase');
    }
  };

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.farmer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (purchase.fiber_quality?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (purchase.variety?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const totalStats = {
    totalSpent: purchases.reduce((sum, p) => sum + p.total_price, 0),
    totalPurchases: purchases.length,
    totalQuantity: purchases.reduce((sum, p) => sum + p.quantity, 0)
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
        <p className="text-gray-600">Manage your abaca fiber purchases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Spent</h3>
          <p className="text-2xl font-bold mt-1">₱{totalStats.totalSpent.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Purchases</h3>
          <p className="text-2xl font-bold mt-1">{totalStats.totalPurchases}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Quantity</h3>
          <p className="text-2xl font-bold mt-1">{totalStats.totalQuantity} kg</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by farmer, quality, or variety..."
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
            <option value="Class C">Class C</option>
          </select>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          Showing <span className="font-semibold text-blue-600">{filteredPurchases.length}</span> of {purchases.length} purchases
        </p>
      </div>

      {/* Purchases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPurchases.map((purchase) => (
          <div key={purchase.purchase_id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{purchase.farmer_name}</h3>
                <p className="text-sm text-gray-600">{new Date(purchase.created_at).toLocaleDateString()}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {purchase.fiber_quality}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Variety:</span>
                <span className="font-medium">{purchase.variety}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{purchase.quantity} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price/kg:</span>
                <span className="font-medium">₱{purchase.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600 font-semibold">Total:</span>
                <span className="font-bold text-blue-600">₱{purchase.total_price.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleView(purchase)}
                className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={16} />
                View
              </button>
              <button
                onClick={() => handleEdit(purchase)}
                className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(purchase)}
                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPurchases.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No purchases found</p>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Purchase Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Farmer Name</p>
                  <p className="font-semibold">{selectedPurchase.farmer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact Number</p>
                  <p className="font-semibold">{selectedPurchase.contact_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fiber Quality</p>
                  <p className="font-semibold">{selectedPurchase.fiber_quality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Variety</p>
                  <p className="font-semibold">{selectedPurchase.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold">{selectedPurchase.quantity} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per kg</p>
                  <p className="font-semibold">₱{selectedPurchase.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Price</p>
                  <p className="font-bold text-blue-600 text-lg">₱{selectedPurchase.total_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchase Date</p>
                  <p className="font-semibold">{new Date(selectedPurchase.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Purchase</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Farmer Name</label>
                  <input
                    type="text"
                    value={editFormData.farmer_name}
                    onChange={(e) => setEditFormData({...editFormData, farmer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={editFormData.contact_number}
                    onChange={(e) => setEditFormData({...editFormData, contact_number: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fiber Quality</label>
                  <select
                    value={editFormData.fiber_quality}
                    onChange={(e) => setEditFormData({...editFormData, fiber_quality: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Variety</label>
                  <input
                    type="text"
                    value={editFormData.variety}
                    onChange={(e) => setEditFormData({...editFormData, variety: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per kg (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{((parseFloat(editFormData.price) || 0) * (parseFloat(editFormData.quantity) || 0)).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={submitEdit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Purchase</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Farmer:</strong> {selectedPurchase.farmer_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Quantity:</strong> {selectedPurchase.quantity} kg
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total:</strong> ₱{selectedPurchase.total_price.toLocaleString()}
              </p>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this purchase record?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurchases;
