import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../utils/apiClient';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Package, 
  FileText, 
  Edit2, 
  Save, 
  X,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface BuyerInfo {
  buyer_id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  municipality: string;
  barangay: string;
  business_permit: string;
  requirements: string;
  payment_terms: string;
  created_at: string;
}

interface PriceInfo {
  quality: string;
  price_per_kg: number;
  minimum_order: number;
  availability: string;
}

const BuyerProfile: React.FC = () => {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [prices, setPrices] = useState<PriceInfo[]>([
    { quality: 'Class A (Premium)', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Class B (High Quality)', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Medium Grade', price_per_kg: 0, minimum_order: 0, availability: 'Available' },
    { quality: 'Low Grade', price_per_kg: 0, minimum_order: 0, availability: 'Available' }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBuyerProfile();
  }, []);

  const fetchBuyerProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await apiGet(`/api/buyers/profile/${user.user_id}`);
      
      if (response.ok) {
        const data = await response.json();
        setBuyerInfo(data.buyer);
        if (data.prices && data.prices.length > 0) {
          setPrices(data.prices);
        }
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('buyerInfo', JSON.stringify(buyerInfo));
      formData.append('prices', JSON.stringify(prices));

      const response = await apiPut('/api/buyers/update-profile', formData);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        fetchBuyerProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (index: number, field: keyof PriceInfo, value: any) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPrices(newPrices);
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer Profile & Pricing</h1>
          <p className="text-gray-600">Manage your company information and abaca fiber pricing</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <Edit2 size={20} />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-semibold"
              >
                <X size={20} />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.company_name || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, company_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Building size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.company_name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.contact_person || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, contact_person: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter contact person"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <User size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.contact_person || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={buyerInfo?.email || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Mail size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={buyerInfo?.phone || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+63 912 345 6789"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Phone size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Complete Address</label>
              {isEditing ? (
                <textarea
                  value={buyerInfo?.address || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter complete address"
                />
              ) : (
                <div className="flex items-start gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <MapPin size={18} className="text-gray-500 mt-1" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.address || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Municipality */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.municipality || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, municipality: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter municipality"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-900 font-medium">{buyerInfo?.municipality || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Barangay */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.barangay || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, barangay: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter barangay"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-900 font-medium">{buyerInfo?.barangay || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Business Permit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Permit No.</label>
              {isEditing ? (
                <input
                  type="text"
                  value={buyerInfo?.business_permit || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, business_permit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter business permit number"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <FileText size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.business_permit || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Terms</label>
              {isEditing ? (
                <select
                  value={buyerInfo?.payment_terms || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, payment_terms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select payment terms</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                  <Calendar size={18} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{buyerInfo?.payment_terms || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fiber Requirements & Specifications</label>
              {isEditing ? (
                <textarea
                  value={buyerInfo?.requirements || ''}
                  onChange={(e) => setBuyerInfo({ ...buyerInfo!, requirements: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter your specific requirements for abaca fiber (e.g., moisture content, length, color, etc.)"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-900 font-medium whitespace-pre-wrap">{buyerInfo?.requirements || 'No specific requirements set'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-xl font-bold">Verified Buyer</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Member Since</p>
              <p className="text-xl font-bold">
                {buyerInfo?.created_at ? new Date(buyerInfo.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-100 text-sm mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Active & Verified</span>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-100 text-sm mb-2">Visibility</p>
              <p className="text-sm">Your profile and pricing are visible to MAO, associations, and farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <DollarSign className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Abaca Fiber Pricing</h2>
            <p className="text-gray-600 text-sm">Set your buying prices for different fiber qualities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prices.map((price, index) => (
            <div key={index} className="border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{price.quality}</h3>
                <Package className="text-emerald-600" size={20} />
              </div>
              
              <div className="space-y-4">
                {/* Price per KG */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per KG (₱)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={price.price_per_kg}
                      onChange={(e) => handlePriceChange(index, 'price_per_kg', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-emerald-50 rounded-xl">
                      <span className="text-2xl font-bold text-emerald-700">₱{price.price_per_kg.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Minimum Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order (KG)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={price.minimum_order}
                      onChange={(e) => handlePriceChange(index, 'minimum_order', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-900 font-medium">{price.minimum_order} kg</span>
                    </div>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                  {isEditing ? (
                    <select
                      value={price.availability}
                      onChange={(e) => handlePriceChange(index, 'availability', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Not Buying">Not Buying</option>
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        price.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                        price.availability === 'Limited' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {price.availability}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-blue-900 font-semibold mb-1">Important Note</p>
              <p className="text-blue-800 text-sm">
                Your pricing information will be visible to all farmers, associations, and MAO officers. 
                Keep your prices updated to ensure accurate transactions and maintain trust in the marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;
