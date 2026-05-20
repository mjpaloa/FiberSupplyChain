import React, { useState } from 'react';
import {
  DollarSign,
  Package,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building,
  Mail
} from 'lucide-react';

interface PriceListing {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  municipality: string;
  barangay: string;
  fiber_quality: string;
  price_per_kg: string;
  minimum_order: string;
  payment_terms: string;
  requirements: string;
  availability: string;
  valid_until: string;
}

const BuyerPriceListingForm: React.FC = () => {
  const [formData, setFormData] = useState<PriceListing>({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    location: '',
    municipality: '',
    barangay: '',
    fiber_quality: '',
    price_per_kg: '',
    minimum_order: '',
    payment_terms: '',
    requirements: '',
    availability: 'Available',
    valid_until: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fiberQualities = [
    'Class A (Premium)',
    'Class B (High Quality)',
    'Medium Grade',
    'Low Grade',
    'Mixed Quality'
  ];

  const paymentTermsOptions = [
    'Cash on Delivery',
    'Cash on Pickup',
    '7 Days',
    '15 Days',
    '30 Days',
    'Negotiable'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://server.easyabaca.site/api/buyer-listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Price listing created successfully! Farmers, MAO, and associations can now see your offer.' });
        // Reset form
        setFormData({
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          location: '',
          municipality: '',
          barangay: '',
          fiber_quality: '',
          price_per_kg: '',
          minimum_order: '',
          payment_terms: '',
          requirements: '',
          availability: 'Available',
          valid_until: ''
        });
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create listing. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-blue-900 font-bold mb-1.5 text-base">📢 Public Listing</p>
            <p className="text-blue-800 text-sm leading-relaxed">
              Your price listing will be publicly visible to all farmers, associations, and MAO officers.
              Make sure to provide accurate information and keep your contact details updated.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Information Card */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-7 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
              <Building className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Municipality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                placeholder="Enter municipality"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Barangay <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                placeholder="Enter barangay"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complete Address/Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-gray-50 hover:bg-white"
                  rows={2}
                  placeholder="Enter complete address or landmark"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Quality Card */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-7 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm">
              <DollarSign className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing & Quality Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Abaca Fiber Quality <span className="text-red-500">*</span>
              </label>
              <select
                name="fiber_quality"
                value={formData.fiber_quality}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
              >
                <option value="">Select fiber quality</option>
                {fiberQualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price per Kilogram (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">₱</span>
                <input
                  type="number"
                  name="price_per_kg"
                  value={formData.price_per_kg}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Order (KG) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  name="minimum_order"
                  value={formData.minimum_order}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
                  placeholder="Enter minimum order quantity"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Availability Status <span className="text-red-500">*</span>
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
              >
                <option value="Available">Available - Actively Buying</option>
                <option value="Limited">Limited - Low Demand</option>
                <option value="Not Buying">Not Buying - Temporarily Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Requirements & Specifications
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-gray-50 hover:bg-white resize-none"
                  rows={4}
                  placeholder="Enter your specific requirements (e.g., moisture content, fiber length, color, packaging, delivery preferences, etc.)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-10 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Listing...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Create Price Listing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuyerPriceListingForm;
