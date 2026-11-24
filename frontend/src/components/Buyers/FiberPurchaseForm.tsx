import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Package, CheckCircle, User, Leaf, Phone } from 'lucide-react';
import { EditorialCard } from '../Shared/EditorialUI';

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

      const response = await fetch('https://fibersupplychain.onrender.com/api/buyer-purchases', {
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
    <div className="w-full max-w-5xl space-y-6">
      {/* Success Modal Pop-up (Centered) */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px]"
            onClick={() => setShowSuccess(false)}
          />

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden relative z-10">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#EAF6F0] rounded-lg">
                  <CheckCircle className="text-[#047857]" size={18} />
                </div>
                <h3 className="font-serif text-lg font-bold text-gray-900">Purchase Recorded</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                Transaction added successfully. Your fiber purchase has been recorded in the system.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="px-6 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Details Card */}
        <EditorialCard
          title="Purchase Details"
          subtitle="Enter farmer details, fiber grade, quantity, and unit price"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Price (₱/kg) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full pl-8 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm tabular-nums"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Contact Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                  placeholder="09XX XXX XXXX"
                />
              </div>
            </div>

            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Farmer's Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="farmerName"
                  value={formData.farmerName}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                  placeholder="Enter farmer's name"
                />
              </div>
            </div>

            {/* Fiber Quality */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Abaca Fiber Quality <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  name="fiberQuality"
                  value={formData.fiberQuality}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                >
                  <option value="">Select quality</option>
                  {fiberQualities.map(quality => (
                    <option key={quality} value={quality}>{quality}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Quantity (kg) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                step="0.01"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm tabular-nums"
                placeholder="Enter quantity in kg"
              />
            </div>

            {/* Variety */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Variety <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Leaf className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="variety"
                  value={formData.variety}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                  placeholder="Enter abaca variety"
                />
              </div>
            </div>
          </div>
        </EditorialCard>

        {/* Total Price Display Card */}
        <EditorialCard>
          <div className="bg-[#EAF6F0] rounded-xl p-5 border border-[#CBEAD9] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#047857] mb-0.5">Total Purchase Price</p>
              <p className="text-xs text-gray-600">Unit price × Quantity</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
                ₱{formData.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {formData.price && formData.quantity && (
                <p className="text-xs text-gray-600 mt-0.5 tabular-nums">
                  ₱{formData.price} × {formData.quantity} kg
                </p>
              )}
            </div>
          </div>
        </EditorialCard>

        {/* Image Upload Card */}
        <EditorialCard
          title="Upload Image"
          subtitle="Optional — Add a fiber photo for reference"
        >
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-44 border border-dashed border-gray-300 rounded-xl cursor-pointer bg-[#FAFAFA] hover:bg-gray-50 transition-colors">
              <Upload className="text-gray-400 mb-2" size={32} />
              <p className="text-sm font-medium text-gray-700">Click to upload image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
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
                className="w-full h-64 md:h-80 object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-3 right-3 p-2 bg-white border border-gray-200 text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </EditorialCard>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Submit Purchase Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FiberPurchaseForm;
