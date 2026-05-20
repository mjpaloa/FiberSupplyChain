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
  Search,
  Eye,
  X,
  AlertCircle,
  Plus,
  ArrowLeft
} from 'lucide-react';
import BuyerPriceListingFormWithClasses from './BuyerPriceListingFormWithClasses';

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
  class_a_enabled?: boolean;
  class_a_price?: number;
  class_b_enabled?: boolean;
  class_b_price?: number;
  class_c_enabled?: boolean;
  class_c_price?: number;
}

const BuyerPriceListings: React.FC = () => {
  const [listings, setListings] = useState<PriceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [viewModal, setViewModal] = useState<PriceListing | null>(null);
  const [editModal, setEditModal] = useState<PriceListing | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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

  const handleEdit = async (listing: PriceListing) => {
    setEditModal(listing);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;

    setEditLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Prepare clean payload with only updatable fields
      const updatePayload = {
        company_name: editModal.company_name,
        contact_person: editModal.contact_person,
        phone: editModal.phone,
        email: editModal.email,
        payment_terms: editModal.payment_terms,
        availability: editModal.availability,
        requirements: editModal.requirements,
        // Only include class prices if they're enabled
        ...(editModal.class_a_enabled && { class_a_price: editModal.class_a_price }),
        ...(editModal.class_b_enabled && { class_b_price: editModal.class_b_price }),
        ...(editModal.class_c_enabled && { class_c_price: editModal.class_c_price })
      };
      
      const response = await fetch(`https://server.easyabaca.site/api/buyer-listings/${editModal.listing_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        await fetchListings(); // Wait for listings to refresh
        setEditModal(null);
      } else {
        const errorData = await response.json();
        alert(`Failed to update listing: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Expand listings to show each class as a separate row
  const expandedListings = listings.flatMap(listing => {
    const rows = [];
    
    if (listing.class_a_enabled && listing.class_a_price) {
      rows.push({
        ...listing,
        class_type: 'Class A',
        current_price: listing.class_a_price,
        class_key: 'class_a'
      });
    }
    
    if (listing.class_b_enabled && listing.class_b_price) {
      rows.push({
        ...listing,
        class_type: 'Class B',
        current_price: listing.class_b_price,
        class_key: 'class_b'
      });
    }
    
    if (listing.class_c_enabled && listing.class_c_price) {
      rows.push({
        ...listing,
        class_type: 'Class C',
        current_price: listing.class_c_price,
        class_key: 'class_c'
      });
    }
    
    // Fallback for old listings without class structure
    if (rows.length === 0 && listing.fiber_quality && listing.price_per_kg) {
      rows.push({
        ...listing,
        class_type: listing.fiber_quality,
        current_price: listing.price_per_kg,
        class_key: 'default'
      });
    }
    
    return rows;
  });

  const filteredListings = expandedListings.filter(listing => {
    const matchesSearch = 
      (listing.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.class_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.municipality || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesQuality = qualityFilter === 'all' || listing.class_type === qualityFilter;
    const matchesAvailability = availabilityFilter === 'all' || listing.availability === availabilityFilter;

    return matchesSearch && matchesQuality && matchesAvailability;
  });

  const qualities = Array.from(new Set(expandedListings.map(l => l.class_type).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate summary statistics for each class
  const classAListings = expandedListings.filter(l => l.class_type === 'Class A');
  const classBListings = expandedListings.filter(l => l.class_type === 'Class B');
  const classCListings = expandedListings.filter(l => l.class_type === 'Class C');
  
  const avgClassAPrice = classAListings.length > 0 
    ? classAListings.reduce((sum, l) => sum + (l.current_price || 0), 0) / classAListings.length 
    : 0;
  const avgClassBPrice = classBListings.length > 0 
    ? classBListings.reduce((sum, l) => sum + (l.current_price || 0), 0) / classBListings.length 
    : 0;
  const avgClassCPrice = classCListings.length > 0 
    ? classCListings.reduce((sum, l) => sum + (l.current_price || 0), 0) / classCListings.length 
    : 0;

  // Get min and max prices for each class to show ranges
  const getClassPriceRange = (listings: typeof expandedListings) => {
    if (listings.length === 0) return { min: 0, max: 0 };
    const prices = listings.map(l => l.current_price || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const classARanges = getClassPriceRange(classAListings);
  const classBRanges = getClassPriceRange(classBListings);
  const classCRanges = getClassPriceRange(classCListings);


  return (
    <div className="w-full max-w-full">
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Class A Card */}
        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl font-black">₱</span>
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-lg text-xs font-black backdrop-blur-sm">Class A</span>
            </div>
            <h3 className="text-sm md:text-base font-semibold opacity-90 mb-2 tracking-wide">Premium Quality</h3>
            {classAListings.length > 0 ? (
              <p className="text-3xl md:text-4xl font-black">
                {classARanges.min === classARanges.max 
                  ? `₱${classARanges.min.toFixed(2)}`
                  : `₱${classARanges.min.toFixed(2)} - ₱${classARanges.max.toFixed(2)}`
                }
              </p>
            ) : (
              <p className="text-lg opacity-80">No listings</p>
            )}
          </div>
        </div>

        {/* Class B Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl font-black">₱</span>
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-lg text-xs font-black backdrop-blur-sm">Class B</span>
            </div>
            <h3 className="text-sm md:text-base font-semibold opacity-90 mb-2 tracking-wide">Standard Quality</h3>
            {classBListings.length > 0 ? (
              <p className="text-3xl md:text-4xl font-black">
                {classBRanges.min === classBRanges.max 
                  ? `₱${classBRanges.min.toFixed(2)}`
                  : `₱${classBRanges.min.toFixed(2)} - ₱${classBRanges.max.toFixed(2)}`
                }
              </p>
            ) : (
              <p className="text-lg opacity-80">No listings</p>
            )}
          </div>
        </div>

        {/* Class C Card */}
        <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl font-black">₱</span>
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-lg text-xs font-black backdrop-blur-sm">Class C</span>
            </div>
            <h3 className="text-sm md:text-base font-semibold opacity-90 mb-2 tracking-wide">Basic Quality</h3>
            {classCListings.length > 0 ? (
              <p className="text-3xl md:text-4xl font-black">
                {classCRanges.min === classCRanges.max 
                  ? `₱${classCRanges.min.toFixed(2)}`
                  : `₱${classCRanges.min.toFixed(2)} - ₱${classCRanges.max.toFixed(2)}`
                }
              </p>
            ) : (
              <p className="text-lg opacity-80">No listings</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-white/60">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Price Listings</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg transition-all duration-200 font-semibold"
          >
            <Plus size={20} />
            Create New Listing
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search company, quality, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base"
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          >
            <option value="all">All Qualities</option>
            {qualities.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Limited">Limited</option>
            <option value="Not Buying">Not Buying</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-white/60">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Company</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Class/Price</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-center text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredListings.map((listing, index) => (
                <tr key={`${listing.listing_id}-${listing.class_key}-${index}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[10px] sm:text-xs md:text-sm">{listing.company_name || 'Unknown'}</p>
                        <p className="text-[9px] sm:text-xs text-gray-500">{listing.contact_person || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div>
                      <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold ${
                        listing.class_type === 'Class A' ? 'bg-emerald-100 text-emerald-700' :
                        listing.class_type === 'Class B' ? 'bg-blue-100 text-blue-700' :
                        listing.class_type === 'Class C' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.class_type || 'N/A'}
                      </span>
                      <p className="text-[10px] sm:text-xs md:text-sm font-black text-emerald-600 mt-1">₱{listing.current_price ? Number(listing.current_price).toFixed(2) : '0.00'}/kg</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div className="text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1 text-gray-700 mb-1 font-medium">
                        <Phone size={12} />
                        <span>{listing.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Mail size={12} />
                        <span className="truncate max-w-[150px]">{listing.email || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div className="text-[10px] sm:text-xs text-gray-700">
                      <p className="font-bold">{listing.municipality || 'N/A'}</p>
                      <p className="text-gray-500">{listing.barangay || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold ${
                      listing.availability === 'Available' ? 'bg-emerald-100 text-emerald-700' :
                      listing.availability === 'Limited' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {listing.availability}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => setViewModal(listing)}
                        className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(listing)}
                        className="p-1.5 sm:p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} className="text-emerald-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.listing_id)}
                        className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
          <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border-2 sm:border-4 border-white/60">
            {/* Fixed Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Building size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black">Listing Details</h2>
                  <p className="text-xs sm:text-sm opacity-90">Complete information</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal(null)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Company Info */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-blue-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg text-white">
                    <Building size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Company Name</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.company_name}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Contact Person</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.contact_person}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Phone</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.phone}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Email</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm break-all">{viewModal.email}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-emerald-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg text-white flex items-center justify-center text-xl sm:text-2xl font-bold">
                    ₱
                  </div>
                  Pricing Details
                </h3>
                
                {/* Show all enabled classes */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  {viewModal.class_a_enabled && viewModal.class_a_price && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-emerald-200 shadow-sm gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">
                          Class A
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Premium Quality</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600">₱{Number(viewModal.class_a_price).toFixed(2)}/kg</p>
                    </div>
                  )}
                  
                  {viewModal.class_b_enabled && viewModal.class_b_price && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-blue-200 shadow-sm gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
                          Class B
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Standard Quality</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-blue-600">₱{Number(viewModal.class_b_price).toFixed(2)}/kg</p>
                    </div>
                  )}
                  
                  {viewModal.class_c_enabled && viewModal.class_c_price && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-amber-200 shadow-sm gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                          Class C
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700">Basic Quality</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-amber-600">₱{Number(viewModal.class_c_price).toFixed(2)}/kg</p>
                    </div>
                  )}
                  
                  {/* Fallback for old listings */}
                  {!viewModal.class_a_enabled && !viewModal.class_b_enabled && !viewModal.class_c_enabled && viewModal.fiber_quality && (
                    <div className="flex items-center justify-between p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl">
                      <span className="text-xs sm:text-sm font-black text-gray-900">{viewModal.fiber_quality}</span>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600">₱{viewModal.price_per_kg ? Number(viewModal.price_per_kg).toFixed(2) : '0.00'}/kg</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm pt-2 sm:pt-3 border-t-2 border-emerald-300">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Payment Terms</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.payment_terms}</p>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-gray-600 text-[10px] sm:text-xs font-semibold mb-1">Availability</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.availability}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-purple-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-purple-600 rounded-lg text-white">
                    <MapPin size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  Location
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Complete Address</p>
                    <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.location}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Barangay</p>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.barangay}</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 sm:p-3">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-600 mb-1">Municipality</p>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm">{viewModal.municipality}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {viewModal.requirements && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-amber-200 shadow-lg">
                  <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-1.5 sm:p-2 bg-amber-600 rounded-lg text-white">
                      <FileText size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    Requirements
                  </h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">{viewModal.requirements}</p>
                  </div>
                </div>
              )}

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-pink-200 shadow-md">
                  <p className="text-[10px] sm:text-xs font-black text-pink-700 mb-1 sm:mb-2 uppercase tracking-wide">Valid Until</p>
                  <p className="text-base sm:text-lg font-black text-pink-900">{new Date(viewModal.valid_until).toLocaleDateString()}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-cyan-200 shadow-md">
                  <p className="text-[10px] sm:text-xs font-black text-cyan-700 mb-1 sm:mb-2 uppercase tracking-wide">Created</p>
                  <p className="text-base sm:text-lg font-black text-cyan-900">{new Date(viewModal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-2 sm:p-4">
          <div className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border-2 sm:border-4 border-white/60">
            {/* Fixed Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Edit2 size={20} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black">Edit Listing</h2>
                  <p className="text-xs sm:text-sm opacity-90">Update your price listing information</p>
                </div>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Company Info Section */}
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-blue-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg text-white">
                    <Building size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  Company Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      value={editModal.company_name}
                      onChange={(e) => setEditModal({...editModal, company_name: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Contact Person</label>
                    <input
                      type="text"
                      value={editModal.contact_person}
                      onChange={(e) => setEditModal({...editModal, contact_person: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Phone</label>
                    <input
                      type="tel"
                      value={editModal.phone}
                      onChange={(e) => setEditModal({...editModal, phone: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-semibold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={editModal.email}
                      onChange={(e) => setEditModal({...editModal, email: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-semibold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Class Pricing Section */}
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-emerald-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg text-white flex items-center justify-center text-xl sm:text-2xl font-bold">
                    ₱
                  </div>
                  Class Pricing
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {editModal.class_a_enabled && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-emerald-200 shadow-sm">
                      <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md sm:w-24">
                        Class A
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_a_price || ''}
                        onChange={(e) => setEditModal({...editModal, class_a_price: Number(e.target.value)})}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-emerald-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-base sm:text-lg"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}
                  
                  {editModal.class_b_enabled && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-blue-200 shadow-sm">
                      <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md sm:w-24">
                        Class B
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_b_price || ''}
                        onChange={(e) => setEditModal({...editModal, class_b_price: Number(e.target.value)})}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-blue-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-base sm:text-lg"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}
                  
                  {editModal.class_c_enabled && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/70 backdrop-blur-sm rounded-lg sm:rounded-xl border-2 border-amber-200 shadow-sm">
                      <span className="inline-flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md sm:w-24">
                        Class C
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_c_price || ''}
                        onChange={(e) => setEditModal({...editModal, class_c_price: Number(e.target.value)})}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-amber-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-bold text-base sm:text-lg"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Terms Section */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 border-purple-200 shadow-lg">
                <h3 className="font-black text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                  <div className="p-1.5 sm:p-2 bg-purple-600 rounded-lg text-white">
                    <FileText size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  Terms & Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Payment Terms</label>
                    <select
                      value={editModal.payment_terms}
                      onChange={(e) => setEditModal({...editModal, payment_terms: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm font-semibold text-sm"
                    >
                      <option value="Cash on Delivery">Cash on Delivery</option>
                      <option value="Cash on Pickup">Cash on Pickup</option>
                      <option value="7 Days">7 Days</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Availability</label>
                    <select
                      value={editModal.availability}
                      onChange={(e) => setEditModal({...editModal, availability: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm font-semibold text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Not Buying">Not Buying</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-black text-gray-700 mb-1.5 sm:mb-2 uppercase tracking-wider">Requirements</label>
                  <textarea
                    value={editModal.requirements}
                    onChange={(e) => setEditModal({...editModal, requirements: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm font-medium text-sm"
                    placeholder="Enter specific requirements..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg sm:rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl font-black text-base sm:text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-black text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>💾 Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create Price Listing</h2>
                  <p className="text-sm opacity-90">Post your buying price and requirements</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <BuyerPriceListingFormWithClasses 
                onSuccess={async () => {
                  await fetchListings();
                  setShowCreateModal(false);
                }}
                onCancel={() => setShowCreateModal(false)}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BuyerPriceListings;
