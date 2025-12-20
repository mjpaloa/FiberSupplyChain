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

      const response = await fetch(`/api/buyer-purchases', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
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
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting purchase:', error);
      alert('Failed to submit purchase request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Abaca Fiber</h1>
          <p className="text-gray-600">Fill out the form to create a new purchase request</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <p className="font-semibold text-green-900">Purchase request submitted successfully!</p>
              <p className="text-sm text-green-700">Your request has been added to the marketplace.</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₱/kg) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter price per kg"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline mr-1" size={16} />
                Contact Number *
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="09XX XXX XXXX"
              />
            </div>

            {/* Farmer Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="inline mr-1" size={16} />
                Farmer's Name *
              </label>
              <input
                type="text"
                name="farmerName"
                value={formData.farmerName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter farmer's name"
              />
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity in kg"
              />
            </div>

            {/* Variety */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Leaf className="inline mr-1" size={16} />
                Variety *
              </label>
              <input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter abaca variety"
              />
            </div>
          </div>

          {/* Total Price Display */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Price</p>
                <p className="text-xs text-gray-500">Price × Quantity</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
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

          {/* Image Upload */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Upload className="inline mr-1" size={16} />
              Upload Image of Fiber (Optional)
            </label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">Click to upload image</p>
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
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
