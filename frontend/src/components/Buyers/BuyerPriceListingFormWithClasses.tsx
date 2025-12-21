import React, { useState } from 'react';
import {
  DollarSign,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Building,
  Mail,
  Plus,
  Upload,
  X
} from 'lucide-react';

interface AbacaClass {
  enabled: boolean;
  price: string;
  image: string | null;
  imageFile: File | null;
}

interface PriceListing {
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  municipality: string;
  barangay: string;
  class_a: AbacaClass;
  class_b: AbacaClass;
  class_c: AbacaClass;
  payment_terms: string;
  requirements: string;
  availability: string;
}

const BuyerPriceListingFormWithClasses: React.FC = () => {
  const [formData, setFormData] = useState<PriceListing>({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    location: '',
    municipality: '',
    barangay: '',
    class_a: { enabled: false, price: '', image: null, imageFile: null },
    class_b: { enabled: false, price: '', image: null, imageFile: null },
    class_c: { enabled: false, price: '', image: null, imageFile: null },
    payment_terms: '',
    requirements: '',
    availability: 'Available'
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const handleClassToggle = (classType: 'class_a' | 'class_b' | 'class_c') => {
    setFormData(prev => ({
      ...prev,
      [classType]: {
        ...prev[classType],
        enabled: !prev[classType].enabled
      }
    }));
  };

  const handleClassChange = (classType: 'class_a' | 'class_b' | 'class_c', field: 'price', value: string) => {
    setFormData(prev => ({
      ...prev,
      [classType]: {
        ...prev[classType],
        [field]: value
      }
    }));
  };

  const handleImageUpload = (classType: 'class_a' | 'class_b' | 'class_c', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [classType]: {
          ...prev[classType],
          image: reader.result as string,
          imageFile: file
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (classType: 'class_a' | 'class_b' | 'class_c') => {
    setFormData(prev => ({
      ...prev,
      [classType]: {
        ...prev[classType],
        image: null,
        imageFile: null
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one class is enabled
    if (!formData.class_a.enabled && !formData.class_b.enabled && !formData.class_c.enabled) {
      setMessage({ type: 'error', text: 'Please enable at least one abaca class (Class A, B, or C)' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');

      // Transform data for API
      const apiData = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        municipality: formData.municipality,
        barangay: formData.barangay,
        class_a_enabled: formData.class_a.enabled,
        class_a_price: formData.class_a.enabled ? formData.class_a.price : null,
        class_a_image: formData.class_a.enabled ? formData.class_a.image : null,
        class_b_enabled: formData.class_b.enabled,
        class_b_price: formData.class_b.enabled ? formData.class_b.price : null,
        class_b_image: formData.class_b.enabled ? formData.class_b.image : null,
        class_c_enabled: formData.class_c.enabled,
        class_c_price: formData.class_c.enabled ? formData.class_c.price : null,
        class_c_image: formData.class_c.enabled ? formData.class_c.image : null,
        payment_terms: formData.payment_terms,
        requirements: formData.requirements,
        availability: formData.availability
      };

      const response = await fetch('https://easyabaca-api.vercel.app/api/buyer-listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Price listing created successfully! Farmers, MAO, associations, and CUSAFA can now see your offer.' });
        // Reset form
        setFormData({
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          location: '',
          municipality: '',
          barangay: '',
          class_a: { enabled: false, price: '', image: null, imageFile: null },
          class_b: { enabled: false, price: '', image: null, imageFile: null },
          class_c: { enabled: false, price: '', image: null, imageFile: null },
          payment_terms: '',
          requirements: '',
          availability: 'Available'
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

  const renderClassCard = (classType: 'class_a' | 'class_b' | 'class_c', label: string, description: string, color: string) => {
    const classData = formData[classType];

    return (
      <div className={`border-2 rounded-2xl p-5 transition-all ${classData.enabled
          ? `border-${color}-500 bg-${color}-50`
          : 'border-gray-200 bg-gray-50'
        }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleClassToggle(classType)}
              className={`p-2 rounded-xl transition-all ${classData.enabled
                  ? `bg-${color}-500 text-white`
                  : 'bg-gray-300 text-gray-600'
                }`}
            >
              {classData.enabled ? <CheckCircle size={20} /> : <Plus size={20} />}
            </button>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{label}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        {classData.enabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            {/* Price Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price per KG (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">₱</span>
                <input
                  type="number"
                  value={classData.price}
                  onChange={(e) => handleClassChange(classType, 'price', e.target.value)}
                  required={classData.enabled}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reference Image <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              {!classData.image ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload image</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(classType, file);
                    }}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={classData.image}
                    alt={`${label} reference`}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(classType)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Price Listing</h1>
        <p className="text-gray-600">Post your buying prices with reference images. This will be visible to all farmers, MAO, associations, and CUSAFA.</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-blue-900 font-semibold mb-1">Public Listing</p>
            <p className="text-blue-800 text-sm">
              Your price listing will be publicly visible to all farmers, associations, MAO officers, and CUSAFA.
              Upload reference images to help farmers identify the quality standards you're looking for.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter barangay"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complete Address/Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter complete address or landmark"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Abaca Classes Pricing Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Abaca Classes & Pricing</h2>
              <p className="text-sm text-gray-600">Enable and set prices for the abaca classes you want to buy. Upload reference images to show quality standards.</p>
            </div>
          </div>

          <div className="space-y-4">
            {renderClassCard('class_a', 'Class A', 'Premium quality abaca fiber', 'emerald')}
            {renderClassCard('class_b', 'Class B', 'Standard quality abaca fiber', 'blue')}
            {renderClassCard('class_c', 'Class C', 'Basic quality abaca fiber', 'amber')}
          </div>
        </div>

        {/* Payment & Terms Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="text-purple-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Terms & Requirements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Available">Available - Actively Buying</option>
                <option value="Limited">Limited - Low Demand</option>
                <option value="Not Buying">Not Buying - Temporarily Closed</option>
              </select>
            </div>


            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Requirements & Specifications
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter your specific requirements (e.g., moisture content, fiber length, color, packaging, delivery preferences, etc.)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
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

export default BuyerPriceListingFormWithClasses;
