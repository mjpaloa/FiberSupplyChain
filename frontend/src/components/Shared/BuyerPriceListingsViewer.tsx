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
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
            <CheckCircle size={14} />
            Available
          </span>
        );
      case 'Limited':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
            <Clock size={14} />
            Limited
          </span>
        );
      case 'Not Buying':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
            <XCircle size={14} />
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards - Compact Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Listings Card */}
        <div className="bg-blue-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-blue-200 rounded-xl">
              <Building className="text-blue-700" size={20} />
            </div>
            <div>
              <p className="text-blue-700 text-sm font-semibold">Active Listings</p>
            </div>
          </div>
          <div className="bg-blue-200/50 rounded-xl p-5">
            <p className="text-blue-600 text-xs font-medium mb-2 uppercase tracking-wide">Total Count</p>
            <p className="text-6xl font-black text-blue-800">{stats.total}</p>
          </div>
        </div>

        {/* Top Class A Buyers */}
        <div className="bg-emerald-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-200 rounded-xl">
                <Award className="text-emerald-700" size={20} />
              </div>
              <span className="text-emerald-800 font-bold text-base">Class A</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-200 px-3 py-1.5 rounded-full">Premium</span>
          </div>
          <p className="text-emerald-700 text-xs font-semibold mb-3 uppercase tracking-wide">Top 3 Buyers</p>
          <div className="space-y-2">
            {topClassA.length > 0 ? topClassA.map((buyer) => (
              <div key={buyer.rank} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">#{buyer.rank}</span>
                    <span className="text-emerald-900 text-sm font-semibold truncate">{buyer.company}</span>
                  </div>
                  <span className="text-emerald-800 font-bold text-base ml-3">₱{buyer.price.toFixed(2)}</span>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-emerald-400 text-xs">No Class A listings</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Class B Buyers */}
        <div className="bg-blue-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-200 rounded-xl">
                <TrendingUp className="text-blue-700" size={20} />
              </div>
              <span className="text-blue-800 font-bold text-base">Class B</span>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-3 py-1.5 rounded-full">Standard</span>
          </div>
          <p className="text-blue-700 text-xs font-semibold mb-3 uppercase tracking-wide">Top 3 Buyers</p>
          <div className="space-y-2">
            {topClassB.length > 0 ? topClassB.map((buyer) => (
              <div key={buyer.rank} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">#{buyer.rank}</span>
                    <span className="text-blue-900 text-sm font-semibold truncate">{buyer.company}</span>
                  </div>
                  <span className="text-blue-800 font-bold text-base ml-3">₱{buyer.price.toFixed(2)}</span>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-blue-400 text-xs">No Class B listings</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Class C Buyers */}
        <div className="bg-purple-100 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-purple-200 rounded-xl">
                <Activity className="text-purple-700" size={20} />
              </div>
              <span className="text-purple-800 font-bold text-base">Class C</span>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-3 py-1.5 rounded-full">Basic</span>
          </div>
          <p className="text-purple-700 text-xs font-semibold mb-3 uppercase tracking-wide">Top 3 Buyers</p>
          <div className="space-y-2">
            {topClassC.length > 0 ? topClassC.map((buyer) => (
              <div key={buyer.rank} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">#{buyer.rank}</span>
                    <span className="text-purple-900 text-sm font-semibold truncate">{buyer.company}</span>
                  </div>
                  <span className="text-purple-800 font-bold text-base ml-3">₱{buyer.price.toFixed(2)}</span>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-purple-400 text-xs">No Class C listings</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search company, municipality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 placeholder-gray-400"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 font-medium"
          >
            <option value="all">All Types</option>
            <option value="class_a">🏆 Class A</option>
            <option value="class_b">⭐ Class B</option>
            <option value="class_c">📦 Class C</option>
          </select>

          <select
            value={filterMunicipality}
            onChange={(e) => setFilterMunicipality(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 font-medium"
          >
            <option value="all">All Municipalities</option>
            {municipalities.map(mun => (
              <option key={mun} value={mun}>{mun}</option>
            ))}
          </select>

          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-900 font-medium"
          >
            <option value="all">All Status</option>
            <option value="Available">✅ Available</option>
            <option value="Limited">⚠️ Limited</option>
            <option value="Not Buying">❌ Not Buying</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-gray-900">{filteredListings.length}</span> of <span className="font-bold text-gray-900">{listings.length}</span> listings
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
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
              <div key={listing.listing_id} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
                {/* Header with Gradient */}
                <div className={`bg-gradient-to-br ${
                  currentPrice?.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                  currentPrice?.color === 'blue' ? 'from-blue-400 to-blue-600' :
                  'from-purple-400 to-pink-400'
                } p-4 text-white relative`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building size={18} />
                        <h3 className="text-lg font-bold">{listing.company_name}</h3>
                      </div>
                      <p className="text-white/90 text-xs">{listing.contact_person}</p>
                    </div>
                    {getAvailabilityBadge(listing.availability)}
                  </div>
                  
                  {/* Swipeable Price Display */}
                  {availableTypes.length > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                      <button
                        onClick={() => handlePriceNavigation(listing.listing_id, 'prev')}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      <div className="text-center flex-1">
                        <p className="text-lg font-bold mb-1 text-white">
                          {currentPrice?.label}
                        </p>
                        <p className="text-sm font-medium text-white/90">{currentPrice?.quality}</p>
                      </div>
                      
                      <button
                        onClick={() => handlePriceNavigation(listing.listing_id, 'next')}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Fiber Image */}
                  {currentPrice?.image && (
                    <div 
                      className="mb-4 rounded-xl overflow-hidden shadow-md bg-gray-100 cursor-pointer group relative"
                      onClick={() => setImageModal({ isOpen: true, imageUrl: currentPrice.image || '', label: `${listing.company_name} - ${currentPrice.label}` })}
                    >
                      <img 
                        src={currentPrice.image} 
                        alt={`${currentPrice.label} fiber sample`}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image Available%3C/text%3E%3C/svg%3E';
                          target.onerror = null;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <ZoomIn className="text-white" size={32} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Display */}
                  <div className={`bg-gradient-to-br ${
                    currentPrice?.color === 'emerald' ? 'from-emerald-50 to-teal-50 border-emerald-200' :
                    currentPrice?.color === 'blue' ? 'from-blue-50 to-indigo-50 border-blue-200' :
                    'from-purple-50 to-pink-50 border-purple-200'
                  } rounded-2xl p-5 mb-4 border-2 shadow-sm hover:shadow-md transition-all duration-200`}>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 font-semibold mb-2 uppercase tracking-wide">Price per Kilogram</p>
                      <p className={`text-4xl font-black mb-1 ${
                        currentPrice?.color === 'emerald' ? 'text-emerald-600' :
                        currentPrice?.color === 'blue' ? 'text-blue-600' :
                        'text-purple-600'
                      }`}>
                        ₱{currentPrice?.price ? currentPrice.price.toFixed(2) : '0.00'}
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        {rankedTypes.map((type, idx) => (
                          <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              type?.type === currentPriceType ? 'w-8 bg-gray-800' : 'w-2 bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <Phone size={14} className="text-gray-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 font-semibold truncate">{listing.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <MapPin size={14} className="text-gray-500" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-900 font-semibold">{listing.barangay}, {listing.municipality}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Validity */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs font-bold text-gray-500">₱</span>
                        <p className="text-xs text-gray-500 font-medium">Payment</p>
                      </div>
                      <p className="text-xs text-gray-900 font-semibold">{listing.payment_terms}</p>
                    </div>

                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar size={12} className="text-gray-500" />
                        <p className="text-xs text-gray-500 font-medium">Valid Until</p>
                      </div>
                      <p className="text-xs text-gray-900 font-semibold">{new Date(listing.valid_until).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  {listing.requirements && (
                    <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText size={12} className="text-gray-500" />
                        <p className="text-xs font-bold text-gray-900">Requirements</p>
                      </div>
                      <p className="text-xs text-gray-700">{listing.requirements}</p>
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
