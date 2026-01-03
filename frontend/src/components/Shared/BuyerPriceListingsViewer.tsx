import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  FileText, 
  Calendar,
  Building,
  Search,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Award,
  X,
  ZoomIn
} from 'lucide-react';

interface BuyerListing {
  listing_id: string;
  buyer_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  municipality: string;
  barangay: string;
  class_a_enabled: boolean;
  class_a_price: number | null;
  class_a_image: string | null;
  class_b_enabled: boolean;
  class_b_price: number | null;
  class_b_image: string | null;
  class_c_enabled: boolean;
  class_c_price: number | null;
  class_c_image: string | null;
  payment_terms: string;
  requirements: string | null;
  availability: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

interface BuyerPriceListingsViewerProps {
  userRole: 'association' | 'cusafa' | 'farmer' | 'mao';
}

const BuyerPriceListingsViewer: React.FC<BuyerPriceListingsViewerProps> = () => {
  const [listings, setListings] = useState<BuyerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMunicipality, setFilterMunicipality] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [selectedPriceType, setSelectedPriceType] = useState<{[key: string]: 'class_a' | 'class_b' | 'class_c'}>({});
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; imageUrl: string; label: string }>({ isOpen: false, imageUrl: '', label: '' });

  useEffect(() => {
    fetchListings();
  }, [filterType, filterMunicipality, filterAvailability]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterMunicipality !== 'all') params.append('municipality', filterMunicipality);
      if (filterAvailability !== 'all') params.append('availability', filterAvailability);

      const response = await fetch(`https://easyabaca-api.vercel.app/api/buyer-listings/all?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('📋 Buyer Listings Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Buyer Listings Data:', data);
        console.log('📋 Number of listings:', data.listings?.length || 0);
        setListings(data.listings || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch listings:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'Available':
        return (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">
            Available
          </span>
        );
      case 'Limited':
        return (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800">
            Limited
          </span>
        );
      case 'Not Buying':
        return (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-800">
            Not Buying
          </span>
        );
      default:
        return null;
    }
  };


  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.municipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const municipalities = Array.from(new Set(listings.map(l => l.municipality))).sort();

  const stats = {
    total: filteredListings.length,
    available: filteredListings.filter(l => l.availability === 'Available').length,
  };

  // Get top 3 buyers for each class based on price
  const getTopBuyersForClass = (classType: 'a' | 'b' | 'c') => {
    const classKey = `class_${classType}` as const;
    const enabledKey = `${classKey}_enabled` as const;
    const priceKey = `${classKey}_price` as const;
    
    return filteredListings
      .filter(l => l[enabledKey] && l[priceKey] && l[priceKey]! > 0)
      .sort((a, b) => (b[priceKey] || 0) - (a[priceKey] || 0))
      .slice(0, 3)
      .map((listing, index) => ({
        rank: index + 1,
        company: listing.company_name,
        price: listing[priceKey] || 0,
        location: listing.municipality
      }));
  };

  const topClassA = getTopBuyersForClass('a');
  const topClassB = getTopBuyersForClass('b');
  const topClassC = getTopBuyersForClass('c');

  // Handle price type navigation
  const handlePriceNavigation = (listingId: string, direction: 'next' | 'prev') => {
    const current = selectedPriceType[listingId] || 'class_a';
    const types: ('class_a' | 'class_b' | 'class_c')[] = ['class_a', 'class_b', 'class_c'];
    const currentIndex = types.indexOf(current);
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % types.length;
    } else {
      newIndex = (currentIndex - 1 + types.length) % types.length;
    }
    
    setSelectedPriceType(prev => ({
      ...prev,
      [listingId]: types[newIndex]
    }));
  };


  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.total}</p>
          <p className="text-sm opacity-90">Active Buyer Listings</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">₱{topClassA.length > 0 ? topClassA[0].price.toFixed(2) : '0.00'}</p>
          <p className="text-sm opacity-90">Best Class A Price</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{stats.available}</p>
          <p className="text-sm opacity-90">Available Buyers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search company, municipality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-gray-50 hover:bg-white"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-gray-50 hover:bg-white"
            >
              <option value="all">All Types</option>
              <option value="class_a">Class A</option>
              <option value="class_b">Class B</option>
              <option value="class_c">Class C</option>
            </select>

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-gray-50 hover:bg-white"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Not Buying">Not Buying</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Found</h3>
          <p className="text-gray-600">No buyer price listings match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const currentPriceType = selectedPriceType[listing.listing_id] || 'class_a';
            
            type PriceType = {
              type: 'class_a' | 'class_b' | 'class_c';
              price: number | null;
              image: string | null;
              label: string;
              quality: string;
              color: 'emerald' | 'blue' | 'purple';
              emoji: string;
              rank?: number;
            };
            
            const availableTypes: PriceType[] = [
              listing.class_a_enabled ? { type: 'class_a', price: listing.class_a_price, image: listing.class_a_image, label: 'Class A', quality: 'Premium Quality', color: 'emerald', emoji: '🏆' } : null,
              listing.class_b_enabled ? { type: 'class_b', price: listing.class_b_price, image: listing.class_b_image, label: 'Class B', quality: 'Standard Quality', color: 'blue', emoji: '⭐' } : null,
              listing.class_c_enabled ? { type: 'class_c', price: listing.class_c_price, image: listing.class_c_image, label: 'Class C', quality: 'Basic Quality', color: 'purple', emoji: '📦' } : null
            ].filter((item): item is PriceType => item !== null);

            // Rank prices within this listing (highest = rank 1)
            const rankedTypes = availableTypes
              .sort((a, b) => (b.price || 0) - (a.price || 0))
              .map((item, index) => ({ ...item, rank: index + 1 }));

            const currentPrice = rankedTypes.find(t => t.type === currentPriceType) || rankedTypes[0];

            return (
              <div key={listing.listing_id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-7 border border-gray-100">
                {/* Card Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm">
                    <Building className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{listing.company_name}</h2>
                    <p className="text-sm text-gray-600">{listing.contact_person}</p>
                  </div>
                  {getAvailabilityBadge(listing.availability)}
                </div>

                {/* Card Content */}
                <div className="space-y-4">
                  {/* Price Tabs */}
                  {availableTypes.length > 1 && (
                    <div className="flex gap-2 mb-4">
                      {availableTypes.map((type) => (
                        <button
                          key={type.type}
                          onClick={() => setSelectedPriceType(prev => ({ ...prev, [listing.listing_id]: type.type }))}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            currentPriceType === type.type
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price Display */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 mb-4">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Price per Kilogram - {currentPrice?.label}</p>
                    <p className="text-4xl font-bold text-indigo-600 mb-1">
                      ₱{currentPrice?.price ? currentPrice.price.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">{currentPrice?.quality}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Phone size={16} className="text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Contact</p>
                        <p className="text-sm text-gray-900 font-semibold">{listing.phone}</p>
                        <p className="text-sm text-gray-600">{listing.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm text-gray-900 font-semibold">{listing.barangay}, {listing.municipality}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Validity */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Payment Terms</p>
                      <p className="text-sm text-gray-900 font-semibold">{listing.payment_terms}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Valid Until</p>
                      <p className="text-sm text-gray-900 font-semibold">{new Date(listing.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {listing.requirements && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">Requirements</p>
                      <p className="text-sm text-gray-700">{listing.requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setImageModal({ isOpen: false, imageUrl: '', label: '' })}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
            onClick={() => setImageModal({ isOpen: false, imageUrl: '', label: '' })}
          >
            <X className="text-white" size={24} />
          </button>
          <div className="max-w-6xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-t-2xl p-4">
              <h3 className="text-lg font-bold text-gray-900">{imageModal.label}</h3>
            </div>
            <img 
              src={imageModal.imageUrl} 
              alt={imageModal.label}
              className="w-full h-auto max-h-[80vh] object-contain bg-gray-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerPriceListingsViewer;
