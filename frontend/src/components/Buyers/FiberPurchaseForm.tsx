import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Package, CheckCircle, User, Leaf, Phone } from 'lucide-react';

interface PurchaseFormData {
  price: string;
  contactNumber: string;
  farmerName: string;
  fiberQuality: string;
  quantity: string;
  variety: string;
  totalPrice: number;
  imageFile: File | null;
}

const FiberPurchaseForm: React.FC = () => {
  const [formData, setFormData] = useState<PurchaseFormData>({
    price: '',
    contactNumber: '',
    farmerName: '',
    fiberQuality: '',
    quantity: '',
    variety: '',
    totalPrice: 0,
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fiberQualities = ['Class A', 'Class B', 'Class C'];

  // Calculate total price when price or quantity changes
  useEffect(() => {
    const price = parseFloat(formData.price) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    const total = price * quantity;
    setFormData(prev => ({ ...prev, totalPrice: total }));
  }, [formData.price, formData.quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageFile: null }));
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');

      // Prepare JSON data with correct field names for backend
      const purchaseData = {
        price: formData.price,
        contactNumber: formData.contactNumber,
        farmerName: formData.farmerName,
        fiberQuality: formData.fiberQuality,
        quantity: formData.quantity,
        variety: formData.variety,
        totalPrice: formData.totalPrice,
        imageUrl: null // TODO: Handle image upload separately if needed
      };

      const response = await fetch('https://easyabaca-api.vercel.app/api/buyer-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          price: '',
          contactNumber: '',
          farmerName: '',
          fiberQuality: '',
          quantity: '',
          variety: '',
          totalPrice: 0,
          imageFile: null
        });
        setImagePreview('');
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      alert('Failed to submit purchase request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Featured Card Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 mb-8 md:mb-10 shadow-2xl group transition-all duration-500 hover:shadow-blue-200/50 hover:scale-[1.01]">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -m-12 sm:-m-16 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <Package size={240} className="text-white rotate-12" />
          </div>
          <div className="absolute -bottom-8 -left-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <Leaf size={160} className="text-white -rotate-12" />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Purchase Abaca Fiber
            </h1>
          </div>

          {/* Bottom highlight bar */}
          <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-50"></div>
        </div>

        {/* Success Modal Pop-up (Custom Alert Style) */}
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1e1f1c] text-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 transform animate-in zoom-in slide-in-from-bottom-4 duration-300 border border-white/5">
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-200">localhost:5173 says</h3>
              </div>

              <div className="flex items-start gap-3 mb-10">
                <div className="mt-1 flex-shrink-0">
                  <span className="text-xl">✓</span>
                </div>
                <p className="text-lg leading-relaxed">
                  Transaction Added Successfully! Your purchase request has been recorded in our system.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="px-8 py-2.5 bg-[#a3e635] text-black rounded-2xl font-bold text-lg hover:bg-[#bef264] transition-colors shadow-lg active:scale-95"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Purchase Details Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Package className="text-white" size={20} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Purchase Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱/kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">₱</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline mr-1" size={16} />
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>

              {/* Farmer Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline mr-1" size={16} />
                  Farmer's Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="farmerName"
                    value={formData.farmerName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter farmer's name"
                  />
                </div>
              </div>

              {/* Fiber Quality */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Package className="inline mr-1" size={16} />
                  Abaca Fiber Quality *
                </label>
                <select
                  name="fiberQuality"
                  value={formData.fiberQuality}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                >
                  <option value="">Select quality</option>
                  {fiberQualities.map(quality => (
                    <option key={quality} value={quality}>{quality}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Package className="inline mr-1" size={16} />
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  placeholder="Enter quantity in kg"
                />
              </div>

              {/* Variety */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Leaf className="inline mr-1" size={16} />
                  Variety *
                </label>
                <div className="relative">
                  <Leaf className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="variety"
                    value={formData.variety}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter abaca variety"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Price Display Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 md:p-6 border-2 border-blue-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Total Price</p>
                  <p className="text-xs text-gray-500">Price × Quantity</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    ₱{formData.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {formData.price && formData.quantity && (
                    <p className="text-xs text-gray-600 mt-1">
                      ₱{formData.price} × {formData.quantity} kg
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Upload className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upload Image</h2>
                <p className="text-xs sm:text-sm text-gray-500">Optional - Add fiber image for reference</p>
              </div>
            </div>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-48 md:h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                <Upload className="text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" size={40} />
                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Click to upload image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 md:h-80 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 sm:px-8 py-3 sm:py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-300 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm sm:text-base"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Submit Purchase Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiberPurchaseForm;
