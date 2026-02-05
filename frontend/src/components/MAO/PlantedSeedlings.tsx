/**
 * Planted Seedlings Component
 * Shows detailed planted records from farmers in table format
 */
import React, { useEffect, useState } from 'react';
import { Sprout, Calendar, MapPin, User, Search, Filter, Camera, Eye, X } from 'lucide-react';

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
      const response = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/cusafa/all-distributions', {
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
      filtered = filtered.filter(s =>
        s.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.planting_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.association_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const totalPlanted = filteredSeedlings.reduce((sum, s) => sum + (s.planted_quantity || s.quantity_distributed), 0);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSeedlings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSeedlings.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-600 font-medium">Loading planted seedlings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Sprout className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-red-600 font-semibold mb-2">{error}</p>
        <button
          onClick={fetchPlantedSeedlings}
          className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Stats Cards - No Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Active
              </span>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Planted</p>
            <p className="text-4xl font-bold text-white">{totalPlanted.toLocaleString()}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Records</p>
            <p className="text-4xl font-bold text-white">{filteredSeedlings.length}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Farmers</p>
            <p className="text-4xl font-bold text-white">{new Set(filteredSeedlings.map(s => s.farmer_name)).size}</p>
          </div>
        </div>
      </div>

      {/* Modern Filters with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search farmer, variety, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Variety Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={varietyFilter}
              onChange={(e) => setVarietyFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Varieties</option>
              {varieties.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Municipality Filter */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Municipalities</option>
              {municipalities.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">

        {/* Table */}
        {filteredSeedlings.length === 0 ? (
          <div className="bg-white rounded-b-2xl shadow-lg p-12 text-center">
            <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No planted seedlings found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="bg-white/90 backdrop-blur-sm shadow-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Farmer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Variety</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Planting Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Association</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Photos</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((seedling) => (
                    <tr key={seedling.distribution_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{seedling.farmer_name}</p>
                          <p className="text-sm text-gray-600">{seedling.farmer_barangay}, {seedling.farmer_municipality}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                          {seedling.variety}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{seedling.planted_quantity || seedling.quantity_distributed} / {seedling.quantity_distributed}</span>
                          {seedling.damaged_quantity !== undefined && seedling.damaged_quantity > 0 && (
                            <span className="text-xs text-red-500 font-medium">{seedling.damaged_quantity} loss</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(seedling.planting_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {seedling.planting_location || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{seedling.association_name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {(seedling.planting_photo_1 || seedling.planting_photo_2 || seedling.planting_photo_3) ? (
                          <div className="flex items-center justify-center gap-1">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-600 font-medium">
                              {[seedling.planting_photo_1, seedling.planting_photo_2, seedling.planting_photo_3].filter(Boolean).length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No photos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedSeedling(seedling)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer - Matching User Management */}
            <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Show entries:</span>
                  <div className="flex gap-2">
                    {[10, 20, 50].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${itemsPerPage === size
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-emerald-50 border border-gray-200'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page info and navigation */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSeedlings.length)} of {filteredSeedlings.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
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
      </div>

      {/* View Details Modal */}
      {selectedSeedling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSeedling(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Planting Details</h2>
                <p className="text-emerald-100 text-sm mt-1">{selectedSeedling.variety} - {selectedSeedling.planted_quantity || selectedSeedling.quantity_distributed} / {selectedSeedling.quantity_distributed} planted</p>
              </div>
              <button
                onClick={() => setSelectedSeedling(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Farmer Name */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="text-lg font-bold text-gray-900">{selectedSeedling.farmer_name}</p>
                    <p className="text-sm text-gray-600">{selectedSeedling.farmer_barangay}, {selectedSeedling.farmer_municipality}</p>
                  </div>
                </div>
              </div>

              {/* Seedling Information (matching farmer form) */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seedling Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Variety</p>
                      <p className="font-semibold text-gray-900">{selectedSeedling.variety}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantity Distributed</p>
                      <p className="font-semibold text-gray-900">{selectedSeedling.quantity_distributed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Actual Planted</p>
                      <p className="font-semibold text-gray-900 text-emerald-600">{selectedSeedling.planted_quantity || selectedSeedling.quantity_distributed}</p>
                    </div>
                  </div>

                  {selectedSeedling.damaged_quantity !== undefined && selectedSeedling.damaged_quantity > 0 && (
                    <div>
                      <p className="text-sm text-red-600 mb-1">Damaged/Died</p>
                      <p className="font-semibold text-red-600">{selectedSeedling.damaged_quantity}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Planting Date</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedSeedling.planting_date).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Planting Location</p>
                    <p className="font-semibold text-gray-900">{selectedSeedling.planting_location || 'Not specified'}</p>
                  </div>

                  {selectedSeedling.planting_notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Planting Method</p>
                      <p className="font-semibold text-gray-900">{selectedSeedling.planting_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-gray-600" />
                    Planting Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <button
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_1)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-colors"
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
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_2)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-colors"
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
                        onClick={() => setSelectedPhoto(selectedSeedling.planting_photo_3)}
                        className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-colors"
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
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-6xl max-h-[95vh] relative">
            <img
              src={selectedPhoto}
              alt="Planting Photo"
              className="max-w-full max-h-[95vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-3 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantedSeedlings;
