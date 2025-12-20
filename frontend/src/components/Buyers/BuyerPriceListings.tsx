import React, { useState, useEffect } from 'react';
import { apiGet, apiDelete } from '../../utils/apiClient';
import { 
  DollarSign, 
  Package, 
  Phone, 
  MapPin, 
  Mail,
  Calendar,
  CheckCircle,
  Edit2,
  Trash2,
  Building,
  FileText,
  Search
} from 'lucide-react';

interface PriceListing {
  listing_id: string;
  buyer_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  municipality: string;
  barangay: string;
  fiber_quality: string;
  price_per_kg: number;
  minimum_order: number;
  payment_terms: string;
  requirements: string;
  availability: string;
  valid_until: string;
  created_at: string;
}

const BuyerPriceListings: React.FC = () => {
  const [listings, setListings] = useState<PriceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await apiGet('/api/buyer-listings');
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await apiDelete(`/api/buyer-listings/${listingId}`);

      if (response.ok) {
        fetchListings();
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      (listing.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.fiber_quality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.municipality || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQuality = qualityFilter === 'all' || listing.fiber_quality === qualityFilter;
    const matchesAvailability = availabilityFilter === 'all' || listing.availability === availabilityFilter;

    return matchesSearch && matchesQuality && matchesAvailability;
  });

  const qualities = Array.from(new Set(listings.map(l => l.fiber_quality).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Price Listings</h1>
        <p className="text-gray-600">Manage your active price listings visible to farmers, MAO, and associations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search company, quality, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Qualities</option>
            {qualities.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Limited">Limited</option>
            <option value="Not Buying">Not Buying</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredListings.map((listing) => (
          <div key={listing.listing_id} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building size={20} />
                    <h3 className="text-xl font-bold">{listing.company_name || 'Unknown Company'}</h3>
                  </div>
                  <p className="text-blue-100 text-sm">{listing.contact_person || 'N/A'}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  listing.availability === 'Available' ? 'bg-emerald-500' :
                  listing.availability === 'Limited' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {listing.availability}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Quality & Price */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div>
                  <p className="text-sm text-emerald-700 font-medium mb-1">Fiber Quality</p>
                  <p className="text-lg font-bold text-emerald-900">{listing.fiber_quality || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Price per KG</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₱{listing.price_per_kg ? Number(listing.price_per_kg).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="text-gray-500" size={16} />
                  <div>
                    <p className="text-gray-600">Min. Order</p>
                    <p className="font-semibold text-gray-900">{listing.minimum_order || 0} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-gray-500" size={16} />
                  <div>
                    <p className="text-gray-600">Payment</p>
                    <p className="font-semibold text-gray-900">{listing.payment_terms || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-gray-500" size={16} />
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{listing.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-gray-500" size={16} />
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900 truncate">{listing.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                <MapPin className="text-gray-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-sm">
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{listing.location || 'N/A'}</p>
                  <p className="text-gray-600 text-xs mt-1">{listing.barangay || 'N/A'}, {listing.municipality || 'N/A'}</p>
                </div>
              </div>

              {/* Requirements */}
              {listing.requirements && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                  <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm">
                    <p className="text-blue-700 font-medium mb-1">Requirements</p>
                    <p className="text-blue-900">{listing.requirements}</p>
                  </div>
                </div>
              )}

              {/* Valid Until */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} />
                  <span>Valid until: {new Date(listing.valid_until).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={14} />
                  <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                  <Edit2 size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(listing.listing_id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No price listings found</h3>
          <p className="text-gray-600">Create your first price listing to start connecting with farmers</p>
        </div>
      )}
    </div>
  );
};

export default BuyerPriceListings;
