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
  ZoomIn,
  Coins,
  ClipboardList
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
  const [selectedPriceType, setSelectedPriceType] = useState<{ [key: string]: 'class_a' | 'class_b' | 'class_c' }>({});
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

  // Get ranking for a specific listing and class type
  const getRankForListing = (listingId: string, classType: 'a' | 'b' | 'c'): number | null => {
    const classKey = `class_${classType}` as const;
    const enabledKey = `${classKey}_enabled` as const;
    const priceKey = `${classKey}_price` as const;

    const rankedListings = filteredListings
      .filter(l => l[enabledKey] && l[priceKey] && l[priceKey]! > 0)
      .sort((a, b) => (b[priceKey] || 0) - (a[priceKey] || 0));

    const rank = rankedListings.findIndex(l => l.listing_id === listingId);
    return rank >= 0 && rank < 3 ? rank + 1 : null;
  };

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
    <div className="space-y-8 p-6">
      {/* Top Buyers Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Class A Top Buyers */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900">Class A</h3>
                <p className="text-xs text-emerald-700 font-medium">Premium Fiber</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {topClassA.length > 0 ? (
              topClassA.map((buyer) => (
                <div key={buyer.rank} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md ${buyer.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                    buyer.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900'
                    }`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-emerald-600 font-semibold">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No buyers available</p>
            )}
          </div>
        </div>

        {/* Class B Top Buyers */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900">Class B</h3>
                <p className="text-xs text-blue-700 font-medium">Standard Fiber</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {topClassB.length > 0 ? (
              topClassB.map((buyer) => (
                <div key={buyer.rank} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md ${buyer.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                    buyer.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900'
                    }`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-blue-600 font-semibold">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No buyers available</p>
            )}
          </div>
        </div>

        {/* Class C Top Buyers */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-900">Class C</h3>
                <p className="text-xs text-amber-700 font-medium">Basic Fiber</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {topClassC.length > 0 ? (
              topClassC.map((buyer) => (
                <div key={buyer.rank} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-all">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md ${buyer.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900' :
                    buyer.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900'
                    }`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-amber-600 font-semibold">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No buyers available</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredListings.map((listing) => {
            // Get all available class types with their prices
            type ClassInfo = {
              type: 'a' | 'b' | 'c';
              typeKey: 'class_a' | 'class_b' | 'class_c';
              label: string;
              price: number | null;
              image: string | null;
              quality: string;
              bgColor: string;
              textColor: string;
              borderColor: string;
            };

            const classesInfo: ClassInfo[] = [
              listing.class_a_enabled ? {
                type: 'a',
                typeKey: 'class_a',
                label: 'Class A',
                price: listing.class_a_price,
                image: listing.class_a_image,
                quality: 'Premium Quality',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-700',
                borderColor: 'border-emerald-300'
              } : null,
              listing.class_b_enabled ? {
                type: 'b',
                typeKey: 'class_b',
                label: 'Class B',
                price: listing.class_b_price,
                image: listing.class_b_image,
                quality: 'Standard Quality',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-700',
                borderColor: 'border-blue-300'
              } : null,
              listing.class_c_enabled ? {
                type: 'c',
                typeKey: 'class_c',
                label: 'Class C',
                price: listing.class_c_price,
                image: listing.class_c_image,
                quality: 'Basic Quality',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-700',
                borderColor: 'border-amber-300'
              } : null
            ].filter((item): item is ClassInfo => item !== null && item.price !== null && item.price > 0);

            return (
              <div key={listing.listing_id} className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                        <Building className="text-white" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base md:text-lg font-bold text-white truncate">{listing.company_name}</h2>
                        <p className="text-xs md:text-sm text-blue-100 truncate">{listing.contact_person}</p>
                      </div>
                    </div>
                    {getAvailabilityBadge(listing.availability)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 md:p-5 space-y-4">
                  {/* Classes with Rankings */}
                  <div className="space-y-3">
                    {classesInfo.map((classInfo) => {
                      const rank = getRankForListing(listing.listing_id, classInfo.type);

                      return (
                        <div key={classInfo.typeKey} className={`relative ${classInfo.bgColor} ${classInfo.borderColor} border-2 rounded-xl p-3 md:p-4 transition-all hover:shadow-md`}>
                          {/* Ranking Badge */}
                          {rank && (
                            <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-10">
                              <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-black text-sm md:text-base shadow-lg ${rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-4 ring-yellow-200' :
                                rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-4 ring-gray-200' :
                                  'bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-4 ring-orange-200'
                                }`}>
                                {rank}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-bold ${classInfo.textColor} bg-white`}>
                                  {classInfo.label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{classInfo.quality}</p>
                              <p className={`text-xl md:text-3xl font-black ${classInfo.textColor}`}>
                                ₱{classInfo.price?.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">per kilogram</p>
                            </div>

                            {/* Image Thumbnail */}
                            {classInfo.image && (
                              <div
                                className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                                onClick={() => setImageModal({ isOpen: true, imageUrl: classInfo.image!, label: `${listing.company_name} - ${classInfo.label}` })}
                              >
                                <img
                                  src={classInfo.image}
                                  alt={classInfo.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Details Grid - 2 Column Layout */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Contact</p>
                        <p className="text-xs md:text-sm text-gray-900 font-semibold">{listing.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-xs md:text-sm text-gray-900 font-semibold">{listing.barangay}, {listing.municipality}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Coins size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Payment</p>
                        <p className="text-xs md:text-sm text-gray-900 font-semibold">{listing.payment_terms}</p>
                      </div>
                    </div>

                    {listing.requirements && (
                      <div className="flex items-start gap-2">
                        <ClipboardList size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Requirements</p>
                          <p className="text-xs md:text-sm text-gray-700 line-clamp-2">{listing.requirements}</p>
                        </div>
                      </div>
                    )}
                  </div>
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
