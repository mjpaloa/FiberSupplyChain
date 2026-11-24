import React, { useState, useEffect } from 'react';
import {
  Phone,
  MapPin,
  Building,
  Search,
  TrendingUp,
  X,
  Coins,
  ClipboardList
} from 'lucide-react';
import { EditorialCard, KpiStrip, StatusPill } from './EditorialUI';

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

      const response = await fetch(`https://fibersupplychain.onrender.com/api/buyer-listings/all?${params}`, {
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
        return <StatusPill tone="success">Available</StatusPill>;
      case 'Limited':
        return <StatusPill tone="warning">Limited</StatusPill>;
      case 'Not Buying':
        return <StatusPill tone="danger">Not Buying</StatusPill>;
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


  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-[#E59500] text-gray-900';
    if (rank === 2) return 'bg-gray-200 text-gray-800';
    return 'bg-amber-100 text-[#78350F]';
  };

  return (
    <div className="space-y-6">
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Active Listings',
            value: stats.total,
            subtext: `${municipalities.length} municipalities`,
          },
          {
            label: 'Available Buyers',
            value: stats.available,
            accentSubtext: 'Currently purchasing',
          },
          {
            label: 'Top Class A Offer',
            value: topClassA[0] ? `₱${topClassA[0].price.toFixed(2)}` : '—',
            subtext: topClassA[0]?.company || 'No active offers',
          },
          {
            label: 'Top Class B Offer',
            value: topClassB[0] ? `₱${topClassB[0].price.toFixed(2)}` : '—',
            subtext: topClassB[0]?.company || 'No active offers',
          },
        ]}
      />

      {/* Top Buyers Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Class A Top Buyers */}
        <EditorialCard
          title="Class A"
          subtitle="Premium Fiber"
          actions={<TrendingUp className="w-4 h-4 text-[#047857]" />}
        >
          <div className="space-y-2.5">
            {topClassA.length > 0 ? (
              topClassA.map((buyer) => (
                <div
                  key={buyer.rank}
                  className="flex items-center gap-3 p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs tabular-nums flex-shrink-0 ${getRankBadgeClass(buyer.rank)}`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-[#047857] font-semibold tabular-nums">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No buyers available</p>
            )}
          </div>
        </EditorialCard>

        {/* Class B Top Buyers */}
        <EditorialCard
          title="Class B"
          subtitle="Standard Fiber"
          actions={<TrendingUp className="w-4 h-4 text-sky-700" />}
        >
          <div className="space-y-2.5">
            {topClassB.length > 0 ? (
              topClassB.map((buyer) => (
                <div
                  key={buyer.rank}
                  className="flex items-center gap-3 p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs tabular-nums flex-shrink-0 ${getRankBadgeClass(buyer.rank)}`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-sky-700 font-semibold tabular-nums">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No buyers available</p>
            )}
          </div>
        </EditorialCard>

        {/* Class C Top Buyers */}
        <EditorialCard
          title="Class C"
          subtitle="Basic Fiber"
          actions={<TrendingUp className="w-4 h-4 text-[#92400E]" />}
        >
          <div className="space-y-2.5">
            {topClassC.length > 0 ? (
              topClassC.map((buyer) => (
                <div
                  key={buyer.rank}
                  className="flex items-center gap-3 p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs tabular-nums flex-shrink-0 ${getRankBadgeClass(buyer.rank)}`}>
                    {buyer.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{buyer.company}</p>
                    <p className="text-xs text-[#92400E] font-semibold tabular-nums">₱{buyer.price.toFixed(2)}/kg</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No buyers available</p>
            )}
          </div>
        </EditorialCard>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search company, municipality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] transition-colors text-sm bg-white text-gray-900"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] transition-colors text-sm bg-white text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="class_a">Class A</option>
              <option value="class_b">Class B</option>
              <option value="class_c">Class C</option>
            </select>

            <select
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] transition-colors text-sm bg-white text-gray-700"
            >
              <option value="all">All Municipalities</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857] focus:border-[#047857] transition-colors text-sm bg-white text-gray-700"
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
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#047857] border-t-transparent"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Building className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No Listings Found</h3>
          <p className="text-sm text-gray-500">No buyer price listings match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                bgColor: 'bg-[#EAF6F0]/60',
                textColor: 'text-[#047857]',
                borderColor: 'border-[#CBEAD9]'
              } : null,
              listing.class_b_enabled ? {
                type: 'b',
                typeKey: 'class_b',
                label: 'Class B',
                price: listing.class_b_price,
                image: listing.class_b_image,
                quality: 'Standard Quality',
                bgColor: 'bg-sky-50/60',
                textColor: 'text-sky-800',
                borderColor: 'border-sky-200'
              } : null,
              listing.class_c_enabled ? {
                type: 'c',
                typeKey: 'class_c',
                label: 'Class C',
                price: listing.class_c_price,
                image: listing.class_c_image,
                quality: 'Basic Quality',
                bgColor: 'bg-[#FFFBEB]',
                textColor: 'text-[#92400E]',
                borderColor: 'border-[#FDE68A]'
              } : null
            ].filter((item): item is ClassInfo => item !== null && item.price !== null && item.price > 0);

            return (
              <div
                key={listing.listing_id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-white border-b border-gray-100 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gray-100 border border-gray-200 rounded-xl flex-shrink-0">
                        <Building className="text-gray-700" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-serif text-base md:text-lg font-bold text-gray-900 truncate">
                          {listing.company_name}
                        </h2>
                        <p className="text-xs text-gray-500 truncate">{listing.contact_person}</p>
                      </div>
                    </div>
                    {getAvailabilityBadge(listing.availability)}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Classes with Rankings */}
                  <div className="space-y-3">
                    {classesInfo.map((classInfo) => {
                      const rank = getRankForListing(listing.listing_id, classInfo.type);

                      return (
                        <div
                          key={classInfo.typeKey}
                          className={`relative ${classInfo.bgColor} ${classInfo.borderColor} border rounded-xl p-4`}
                        >
                          {/* Ranking Badge */}
                          {rank && (
                            <div className="absolute -top-2 -right-2 z-10">
                              <div
                                className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs tabular-nums border border-white ${getRankBadgeClass(rank)}`}
                              >
                                #{rank}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border border-gray-200 ${classInfo.textColor} bg-white`}>
                                  {classInfo.label}
                                </span>
                                <span className="text-xs text-gray-500">{classInfo.quality}</span>
                              </div>
                              <p className={`text-2xl font-bold tabular-nums ${classInfo.textColor}`}>
                                ₱{classInfo.price?.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">per kilogram</p>
                            </div>

                            {/* Image Thumbnail */}
                            {classInfo.image && (
                              <button
                                type="button"
                                className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 bg-white"
                                onClick={() => setImageModal({ isOpen: true, imageUrl: classInfo.image!, label: `${listing.company_name} - ${classInfo.label}` })}
                                aria-label={`View ${listing.company_name} ${classInfo.label} image`}
                              >
                                <img
                                  src={classInfo.image}
                                  alt={classInfo.label}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Details Grid - 2 Column Layout */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <Phone size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Contact</p>
                        <p className="text-xs md:text-sm text-gray-900 font-medium tabular-nums truncate">{listing.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Location</p>
                        <p className="text-xs md:text-sm text-gray-900 font-medium truncate">{listing.barangay}, {listing.municipality}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Coins size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-500 font-medium">Payment</p>
                        <p className="text-xs md:text-sm text-gray-900 font-medium truncate">{listing.payment_terms}</p>
                      </div>
                    </div>

                    {listing.requirements && (
                      <div className="flex items-start gap-2">
                        <ClipboardList size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-500 font-medium">Requirements</p>
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
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal({ isOpen: false, imageUrl: '', label: '' })}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <h3 className="font-serif text-lg font-bold text-gray-900 truncate">{imageModal.label}</h3>
              <button
                type="button"
                aria-label="Close image preview"
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                onClick={() => setImageModal({ isOpen: false, imageUrl: '', label: '' })}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-[#F8F9FA] flex items-center justify-center overflow-auto">
              <img
                src={imageModal.imageUrl}
                alt={imageModal.label}
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerPriceListingsViewer;
