import React, { useState, useEffect } from 'react';
import { apiGet, apiDelete } from '../../utils/apiClient';
import { 
  Package, 
  Phone, 
  Mail,
  Edit2,
  Trash2,
  Building,
  Search,
  Eye,
  X,
  Plus
} from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';
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
      
      const response = await fetch(`https://fibersupplychain.onrender.com/api/buyer-listings/${editModal.listing_id}`, {
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
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
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

  const formatRange = (range: { min: number; max: number }, count: number) => {
    if (count === 0) return 'No listings';
    return range.min === range.max
      ? `₱${range.min.toFixed(2)}`
      : `₱${range.min.toFixed(2)} – ₱${range.max.toFixed(2)}`;
  };

  return (
    <div className="w-full max-w-full space-y-6">
      {/* KPI Summary Strip */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Class A · Premium Quality',
            value: formatRange(classARanges, classAListings.length),
            subtext: classAListings.length > 0
              ? `Avg ₱${avgClassAPrice.toFixed(2)}/kg (${classAListings.length} active)`
              : 'No active listings',
          },
          {
            label: 'Class B · Standard Quality',
            value: formatRange(classBRanges, classBListings.length),
            subtext: classBListings.length > 0
              ? `Avg ₱${avgClassBPrice.toFixed(2)}/kg (${classBListings.length} active)`
              : 'No active listings',
          },
          {
            label: 'Class C · Basic Quality',
            value: formatRange(classCRanges, classCListings.length),
            subtext: classCListings.length > 0
              ? `Avg ₱${avgClassCPrice.toFixed(2)}/kg (${classCListings.length} active)`
              : 'No active listings',
          },
        ]}
      />

      {/* Filters & Actions */}
      <EditorialCard
        title="My Price Listings"
        subtitle="Manage active buying rates visible to farmers and associations"
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm"
          >
            <Plus size={16} />
            <span>Create New Listing</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search company, quality, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
            />
          </div>

          <select
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm text-gray-700"
          >
            <option value="all">All Qualities</option>
            {qualities.map(q => <option key={q} value={q}>{q}</option>)}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Limited">Limited</option>
            <option value="Not Buying">Not Buying</option>
          </select>
        </div>
      </EditorialCard>

      {/* Listings Table */}
      <EditorialCard noPadding>
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Buyer price listings table">
          <table>
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 sm:px-6 py-3.5 text-left">Company</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Class & Price</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Contact</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Location</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredListings.map((listing, index) => {
                const classTone =
                  listing.class_type === 'Class A' ? 'success' :
                  listing.class_type === 'Class B' ? 'info' :
                  listing.class_type === 'Class C' ? 'warning' : 'neutral';

                const statusTone =
                  listing.availability === 'Available' ? 'success' :
                  listing.availability === 'Limited' ? 'warning' : 'danger';

                return (
                  <tr key={`${listing.listing_id}-${listing.class_key}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
                          <Building size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">{listing.company_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{listing.contact_person || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="space-y-1">
                        <StatusPill tone={classTone}>{listing.class_type || 'N/A'}</StatusPill>
                        <p className="text-xs sm:text-sm font-bold text-[#047857] tabular-nums">
                          ₱{listing.current_price ? Number(listing.current_price).toFixed(2) : '0.00'}/kg
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Phone size={12} className="text-gray-400" />
                          <span>{listing.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Mail size={12} className="text-gray-400" />
                          <span className="truncate max-w-[160px]">{listing.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-xs">
                        <p className="font-semibold text-gray-900">{listing.municipality || 'N/A'}</p>
                        <p className="text-gray-500">{listing.barangay || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <StatusPill tone={statusTone}>{listing.availability}</StatusPill>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewModal(listing)}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(listing)}
                          className="p-2 text-gray-500 hover:text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(listing.listing_id)}
                          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredListings.length === 0 && (
          <div className="text-center py-14 px-6">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No price listings found</h3>
            <p className="text-xs sm:text-sm text-gray-500">Create your first price listing to start connecting with farmers</p>
          </div>
        )}
      </EditorialCard>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Listing Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">{viewModal.company_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewModal(null)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Company Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Company Name</p>
                    <p className="font-semibold text-gray-900">{viewModal.company_name}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Contact Person</p>
                    <p className="font-semibold text-gray-900">{viewModal.contact_person}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900">{viewModal.phone}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 break-all">{viewModal.email}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pricing Details</h3>
                <div className="space-y-2.5 mb-3">
                  {viewModal.class_a_enabled && viewModal.class_a_price && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                        <StatusPill tone="success">Class A</StatusPill>
                        <span className="text-xs font-medium text-gray-600">Premium Quality</span>
                      </div>
                      <p className="text-lg font-bold text-[#047857] tabular-nums">₱{Number(viewModal.class_a_price).toFixed(2)}/kg</p>
                    </div>
                  )}

                  {viewModal.class_b_enabled && viewModal.class_b_price && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                        <StatusPill tone="info">Class B</StatusPill>
                        <span className="text-xs font-medium text-gray-600">Standard Quality</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">₱{Number(viewModal.class_b_price).toFixed(2)}/kg</p>
                    </div>
                  )}

                  {viewModal.class_c_enabled && viewModal.class_c_price && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center gap-3">
                        <StatusPill tone="warning">Class C</StatusPill>
                        <span className="text-xs font-medium text-gray-600">Basic Quality</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">₱{Number(viewModal.class_c_price).toFixed(2)}/kg</p>
                    </div>
                  )}

                  {!viewModal.class_a_enabled && !viewModal.class_b_enabled && !viewModal.class_c_enabled && viewModal.fiber_quality && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white">
                      <span className="text-sm font-semibold text-gray-900">{viewModal.fiber_quality}</span>
                      <p className="text-lg font-bold text-[#047857] tabular-nums">
                        ₱{viewModal.price_per_kg ? Number(viewModal.price_per_kg).toFixed(2) : '0.00'}/kg
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Payment Terms</p>
                    <p className="font-semibold text-gray-900">{viewModal.payment_terms}</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Availability</p>
                    <p className="font-semibold text-gray-900">{viewModal.availability}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Location</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-[11px] font-medium text-gray-500 mb-1">Complete Address</p>
                    <p className="font-semibold text-gray-900">{viewModal.location}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                      <p className="text-[11px] font-medium text-gray-500 mb-1">Barangay</p>
                      <p className="font-semibold text-gray-900">{viewModal.barangay}</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                      <p className="text-[11px] font-medium text-gray-500 mb-1">Municipality</p>
                      <p className="font-semibold text-gray-900">{viewModal.municipality}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              {viewModal.requirements && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requirements</h3>
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <p className="text-sm text-gray-700 leading-relaxed">{viewModal.requirements}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                  <p className="text-[11px] font-medium text-gray-500 mb-1">Valid Until</p>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{new Date(viewModal.valid_until).toLocaleDateString()}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                  <p className="text-[11px] font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{new Date(viewModal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end">
              <button
                type="button"
                onClick={() => setViewModal(null)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Edit Listing</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update your price listing information</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Company Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={editModal.company_name}
                      onChange={(e) => setEditModal({ ...editModal, company_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Person</label>
                    <input
                      type="text"
                      value={editModal.contact_person}
                      onChange={(e) => setEditModal({ ...editModal, contact_person: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={editModal.phone}
                      onChange={(e) => setEditModal({ ...editModal, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={editModal.email}
                      onChange={(e) => setEditModal({ ...editModal, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Class Pricing */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Class Pricing (₱/kg)</h3>
                <div className="space-y-3">
                  {editModal.class_a_enabled && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                      <div className="sm:w-28"><StatusPill tone="success">Class A</StatusPill></div>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_a_price || ''}
                        onChange={(e) => setEditModal({ ...editModal, class_a_price: Number(e.target.value) })}
                        className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white font-semibold text-sm tabular-nums"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}

                  {editModal.class_b_enabled && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                      <div className="sm:w-28"><StatusPill tone="info">Class B</StatusPill></div>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_b_price || ''}
                        onChange={(e) => setEditModal({ ...editModal, class_b_price: Number(e.target.value) })}
                        className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white font-semibold text-sm tabular-nums"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}

                  {editModal.class_c_enabled && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                      <div className="sm:w-28"><StatusPill tone="warning">Class C</StatusPill></div>
                      <input
                        type="number"
                        step="0.01"
                        value={editModal.class_c_price || ''}
                        onChange={(e) => setEditModal({ ...editModal, class_c_price: Number(e.target.value) })}
                        className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white font-semibold text-sm tabular-nums"
                        placeholder="₱ 0.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Terms & Requirements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Terms</label>
                    <select
                      value={editModal.payment_terms}
                      onChange={(e) => setEditModal({ ...editModal, payment_terms: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Availability</label>
                    <select
                      value={editModal.availability}
                      onChange={(e) => setEditModal({ ...editModal, availability: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm"
                    >
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Not Buying">Not Buying</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Requirements</label>
                  <textarea
                    value={editModal.requirements}
                    onChange={(e) => setEditModal({ ...editModal, requirements: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm resize-none"
                    placeholder="Enter specific requirements..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex gap-3">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Create Price Listing</h2>
                <p className="text-xs text-gray-500 mt-0.5">Post your buying price and requirements</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA]">
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
  );
};

export default BuyerPriceListings;
