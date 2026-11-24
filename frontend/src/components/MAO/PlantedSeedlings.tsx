/**
 * Planted Seedlings Component
 * Shows detailed planted records from farmers in table format
 */
import React, { useEffect, useState } from 'react';
import { Sprout, Calendar, MapPin, User, Search, Filter, Camera, Eye, X } from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface PlantedSeedling {
  distribution_id: string;
  variety: string;
  quantity_distributed: number;
  planted_quantity?: number;
  damaged_quantity?: number;
  planting_date: string;
  planting_location: string;
  planting_notes: string;
  planting_photo_1: string | null;
  planting_photo_2: string | null;
  planting_photo_3: string | null;
  planted_at: string;
  farmer_name: string;
  farmer_email: string;
  farmer_municipality: string;
  farmer_barangay: string;
  association_name: string;
  date_distributed: string;
}

const PlantedSeedlings: React.FC = () => {
  const [plantedSeedlings, setPlantedSeedlings] = useState<PlantedSeedling[]>([]);
  const [filteredSeedlings, setFilteredSeedlings] = useState<PlantedSeedling[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [varietyFilter, setVarietyFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [selectedSeedling, setSelectedSeedling] = useState<PlantedSeedling | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchPlantedSeedlings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/cusafa/all-distributions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const plantedOnly = result.farmer_distributions?.filter((d: any) => d.status === 'planted') || [];

      const transformedData = plantedOnly.map((d: any) => ({
        distribution_id: d.distribution_id,
        variety: d.variety,
        quantity_distributed: d.quantity_distributed,
        planted_quantity: d.planted_quantity,
        damaged_quantity: d.damaged_quantity,
        planting_date: d.planting_date,
        planting_location: d.planting_location,
        planting_notes: d.planting_notes,
        planting_photo_1: d.planting_photo_1,
        planting_photo_2: d.planting_photo_2,
        planting_photo_3: d.planting_photo_3,
        planted_at: d.planted_at,
        farmer_name: d.farmers?.full_name || 'Unknown',
        farmer_email: d.farmers?.email || '',
        farmer_municipality: d.farmers?.municipality || '',
        farmer_barangay: d.farmers?.barangay || '',
        association_name: d.association_officers?.association_name || '',
        date_distributed: d.date_distributed
      }));

      setPlantedSeedlings(transformedData);
      setFilteredSeedlings(transformedData);
    } catch (err) {
      console.error('Error fetching planted seedlings:', err);
      setError('Failed to load planted seedlings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantedSeedlings();
  }, []);

  // Filter seedlings
  useEffect(() => {
    let filtered = plantedSeedlings;

    if (searchTerm) {
      filtered = filtered.filter(s => {
      const matchesSearch = 
        (s.farmer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.variety?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.planting_location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.association_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    }

    if (varietyFilter !== 'all') {
      filtered = filtered.filter(s => s.variety === varietyFilter);
    }

    if (municipalityFilter !== 'all') {
      filtered = filtered.filter(s => s.farmer_municipality === municipalityFilter);
    }

    setFilteredSeedlings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, varietyFilter, municipalityFilter, plantedSeedlings]);

  const varieties = Array.from(new Set(plantedSeedlings.map(s => s.variety)));
  const municipalities = Array.from(new Set(plantedSeedlings.map(s => s.farmer_municipality)));

  const totalPlanted = filteredSeedlings.reduce((sum, s) => sum + (s.planted_quantity ?? s.quantity_distributed), 0);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSeedlings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSeedlings.length / itemsPerPage);

  if (loading) {
    return (
      <EditorialCard className="py-14 text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-[#047857] border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-600 font-medium">Loading planted seedlings...</p>
      </EditorialCard>
    );
  }

  if (error) {
    return (
      <EditorialCard className="py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-7 h-7 text-red-600" />
        </div>
        <p className="text-red-700 font-semibold text-sm mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchPlantedSeedlings}
          className="px-5 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </EditorialCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Total Planted Units',
            value: totalPlanted.toLocaleString(),
            subtext: 'Active planted seedlings',
          },
          {
            label: 'Total Records',
            value: filteredSeedlings.length.toLocaleString(),
            subtext: 'Planting submissions',
          },
          {
            label: 'Total Farmers',
            value: new Set(filteredSeedlings.map(s => s.farmer_name)).size.toLocaleString(),
            subtext: 'Participating growers',
          },
        ]}
      />

      {/* Filters */}
      <EditorialCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search farmer, variety, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
            />
          </div>

          {/* Variety Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <select
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
            >
              <option value="all">All Varieties</option>
              {varieties.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Municipality Filter */}
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
            <select
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
            >
              <option value="all">All Municipalities</option>
              {municipalities.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </EditorialCard>

      {/* Table Card */}
      <EditorialCard noPadding>
        {filteredSeedlings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
              <Sprout className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900">No planted seedlings found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Planted seedlings table">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Farmer</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Variety</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Planting Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Association</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Photos</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {currentItems.map((seedling) => (
                    <tr key={seedling.distribution_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{seedling.farmer_name}</p>
                          <p className="text-xs text-gray-500">{seedling.farmer_barangay}, {seedling.farmer_municipality}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusPill tone="success">{seedling.variety}</StatusPill>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap tabular-nums">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-gray-900">
                            {(seedling.planted_quantity ?? seedling.quantity_distributed).toLocaleString()} / {seedling.quantity_distributed.toLocaleString()}
                          </span>
                          {seedling.damaged_quantity !== undefined && seedling.damaged_quantity > 0 && (
                            <span className="text-xs text-red-600 font-medium">{seedling.damaged_quantity} units loss</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap tabular-nums">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{new Date(seedling.planting_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{seedling.planting_location || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{seedling.association_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center tabular-nums">
                        {(seedling.planting_photo_1 || seedling.planting_photo_2 || seedling.planting_photo_3) ? (
                          <div className="inline-flex items-center justify-center gap-1 text-[#047857]">
                            <Camera className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {[seedling.planting_photo_1, seedling.planting_photo_2, seedling.planting_photo_3].filter(Boolean).length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No photos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSeedling(seedling)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600">Show entries:</span>
                  <div className="flex gap-1.5">
                    {[10, 20, 50].map((size) => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${itemsPerPage === size
                          ? 'bg-[#E59500] text-gray-900'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-600 tabular-nums">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSeedlings.length)} of {filteredSeedlings.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </EditorialCard>

      {/* View Details Modal */}
      {selectedSeedling && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={() => setSelectedSeedling(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Planting Details</h2>
                <p className="text-gray-500 text-xs mt-0.5 tabular-nums">
                  {selectedSeedling.variety} — {(selectedSeedling.planted_quantity ?? selectedSeedling.quantity_distributed).toLocaleString()} / {selectedSeedling.quantity_distributed.toLocaleString()} planted
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeedling(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Farmer Name */}
              <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#EAF6F0] rounded-xl text-[#047857]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Farmer</p>
                    <p className="text-base font-bold text-gray-900">{selectedSeedling.farmer_name}</p>
                    <p className="text-xs text-gray-600">{selectedSeedling.farmer_barangay}, {selectedSeedling.farmer_municipality}</p>
                  </div>
                </div>
              </div>

              {/* Seedling Information */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4">Seedling Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Variety</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedSeedling.variety}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity Distributed</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedSeedling.quantity_distributed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Actual Planted</p>
                      <p className="font-semibold text-sm text-[#047857] tabular-nums">{(selectedSeedling.planted_quantity ?? selectedSeedling.quantity_distributed).toLocaleString()} units</p>
                    </div>
                  </div>

                  {selectedSeedling.damaged_quantity !== undefined && selectedSeedling.damaged_quantity > 0 && (
                    <div>
                      <p className="text-xs text-red-600 mb-1">Damaged/Losses</p>
                      <p className="font-semibold text-sm text-red-700 tabular-nums">{selectedSeedling.damaged_quantity} units</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Planting Date</p>
                      <p className="font-semibold text-sm text-gray-900 tabular-nums">{new Date(selectedSeedling.planting_date).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Planting Location</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedSeedling.planting_location || 'Not specified'}</p>
                    </div>
                  </div>

                  {selectedSeedling.planting_notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Planting Method</p>
                      <p className="font-medium text-sm text-gray-900">{selectedSeedling.planting_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div>
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    Planting Photos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_1)}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-[#047857] transition-colors"
                      >
                        <img
                          src={selectedSeedling.planting_photo_1}
                          alt="Planting Photo 1"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    {selectedSeedling.planting_photo_2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_2)}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-[#047857] transition-colors"
                      >
                        <img
                          src={selectedSeedling.planting_photo_2}
                          alt="Planting Photo 2"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    {selectedSeedling.planting_photo_3 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_3)}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-[#047857] transition-colors"
                      >
                        <img
                          src={selectedSeedling.planting_photo_3}
                          alt="Planting Photo 3"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-6xl max-h-[95vh] relative">
            <img
              src={selectedPhoto}
              alt="Planting Photo"
              className="max-w-full max-h-[95vh] object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2.5 hover:bg-gray-100 transition-colors shadow-lg"
              aria-label="Close photo"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantedSeedlings;
