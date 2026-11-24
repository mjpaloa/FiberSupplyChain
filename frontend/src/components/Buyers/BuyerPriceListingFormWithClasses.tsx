import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Mail,
  Plus,
  Upload,
  X
} from 'lucide-react';
import { EditorialCard, EditorialCallout, StatusPill } from '../Shared/EditorialUI';

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

interface BuyerPriceListingFormWithClassesProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BuyerPriceListingFormWithClasses: React.FC<BuyerPriceListingFormWithClassesProps> = ({ onSuccess, onCancel }) => {
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

      const response = await fetch('https://fibersupplychain.onrender.com/api/buyer-listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Price listing created successfully! Farmers, MAO, associations, and CUSAFA can now see your offer.' });
        
        // Call onSuccess callback if provided (to close modal and refresh)
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500); // Show success message briefly before closing
        }
        
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

  const renderClassCard = (classType: 'class_a' | 'class_b' | 'class_c', label: string, description: string, tone: 'success' | 'info' | 'warning') => {
    const classData = formData[classType];

    return (
      <div className={`border rounded-2xl p-5 transition-colors ${classData.enabled
          ? 'border-[#047857] bg-[#EAF6F0]/40'
          : 'border-gray-200 bg-[#FAFAFA]'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleClassToggle(classType)}
              className={`p-2 rounded-xl transition-colors ${classData.enabled
                  ? 'bg-[#047857] text-white'
                  : 'bg-white border border-gray-300 text-gray-500 hover:text-gray-900'
                }`}
              aria-label={`Toggle ${label}`}
            >
              {classData.enabled ? <CheckCircle size={18} /> : <Plus size={18} />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 font-sans">{label}</h3>
                <StatusPill tone={tone}>{classData.enabled ? 'Enabled' : 'Disabled'}</StatusPill>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        {classData.enabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            {/* Price Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Price per KG (₱) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  value={classData.price}
                  onChange={(e) => handleClassChange(classType, 'price', e.target.value)}
                  required={classData.enabled}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm tabular-nums"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Reference Image <span className="text-gray-400 font-normal normal-case">(Optional)</span>
              </label>
              {!classData.image ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="w-6 h-6 mb-1.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-600">Click to upload image</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
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
                    className="w-full h-48 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(classType)}
                    className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 text-red-600 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <X size={15} />
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
    <div className="w-full max-w-full space-y-6">
      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[#EAF6F0] text-[#047857] border-[#CBEAD9]'
            : 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Banner */}
      <EditorialCallout tone="amber" title="Public Listing:">
        Your price listing will be publicly visible to all farmers, associations, MAO officers, and CUSAFA. Upload reference images to help farmers identify the quality standards you're looking for.
      </EditorialCallout>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information Card */}
        <EditorialCard
          title="Company Information"
          subtitle="Contact details displayed on your public buying offer"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Company Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Contact Person <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                  placeholder="+63 912 345 6789"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Municipality <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="municipality"
                value={formData.municipality}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                placeholder="Enter municipality"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Barangay <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
                placeholder="Enter barangay"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Complete Address / Location <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white resize-none"
                  rows={2}
                  placeholder="Enter complete address or landmark"
                />
              </div>
            </div>
          </div>
        </EditorialCard>

        {/* Abaca Classes Pricing Card */}
        <EditorialCard
          title="Abaca Classes & Pricing"
          subtitle="Enable and set prices for the abaca classes you want to buy"
        >
          <div className="space-y-4">
            {renderClassCard('class_a', 'Class A', 'Premium quality abaca fiber', 'success')}
            {renderClassCard('class_b', 'Class B', 'Standard quality abaca fiber', 'info')}
            {renderClassCard('class_c', 'Class C', 'Basic quality abaca fiber', 'warning')}
          </div>
        </EditorialCard>

        {/* Payment & Terms Card */}
        <EditorialCard
          title="Payment Terms & Requirements"
          subtitle="Set availability and quality specifications"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Payment Terms <span className="text-red-600">*</span>
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Availability Status <span className="text-red-600">*</span>
              </label>
              <select
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white"
              >
                <option value="Available">Available - Actively Buying</option>
                <option value="Limited">Limited - Low Demand</option>
                <option value="Not Buying">Not Buying - Temporarily Closed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Requirements & Specifications
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm bg-white resize-none"
                  rows={4}
                  placeholder="Enter your specific requirements (e.g., moisture content, fiber length, color, packaging, delivery preferences, etc.)"
                />
              </div>
            </div>
          </div>
        </EditorialCard>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onCancel ? onCancel() : window.location.reload()}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Listing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Create Price Listing</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuyerPriceListingFormWithClasses;
