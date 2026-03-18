import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Search,
  Eye,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  X,
  Download,
  TrendingUp,
  Camera
} from 'lucide-react';

interface PlantedSeedling {
  seedling_id: string;
  variety: string;
  quantity_distributed: number;
  planted_quantity?: number;
  damaged_quantity?: number;
  date_distributed: string;
  planting_date?: string;
  planting_location?: string;
  planting_notes?: string;
  planting_photo_1?: string;
  planting_photo_2?: string;
  planting_photo_3?: string;
  planted_at?: string;
  farmers?: {
    full_name: string;
    association_name?: string;
  };
}

const PlantingMonitor: React.FC = () => {
  const [plantedSeedlings, setPlantedSeedlings] = useState<PlantedSeedling[]>([]);
  const [filteredSeedlings, setFilteredSeedlings] = useState<PlantedSeedling[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeedling, setSelectedSeedling] = useState<PlantedSeedling | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    fetchPlantedSeedlings();
  }, []);

  useEffect(() => {
    filterSeedlings();
  }, [plantedSeedlings, searchTerm]);

  // Auto-rotate photos for all seedlings
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex(prev => {
        const updated = { ...prev };
        filteredSeedlings.forEach(seedling => {
          const photos = [
            seedling.planting_photo_1,
            seedling.planting_photo_2,
            seedling.planting_photo_3
          ].filter(Boolean);

          if (photos.length > 1) {
            const currentIdx = prev[seedling.seedling_id] || 0;
            updated[seedling.seedling_id] = (currentIdx + 1) % photos.length;
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [filteredSeedlings]);

  const fetchPlantedSeedlings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/seedlings/all?status=planted', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setPlantedSeedlings(data);
      } else {
        console.error('Invalid data format:', data);
        setPlantedSeedlings([]);
      }
    } catch (error) {
      console.error('Error fetching planted seedlings:', error);
      setPlantedSeedlings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSeedlings = () => {
    let filtered = plantedSeedlings;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        (s.variety?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.farmers?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.planting_location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSeedlings(filtered);
  };

  const stats = {
    totalReports: plantedSeedlings.length,
    totalPlantedUnits: plantedSeedlings.reduce((sum, s) => sum + (s.planted_quantity ?? s.quantity_distributed), 0),
    totalDamagedUnits: plantedSeedlings.reduce((sum, s) => sum + (s.damaged_quantity ?? 0), 0),
    totalDistributedUnits: plantedSeedlings.reduce((sum, s) => sum + (s.quantity_distributed ?? 0), 0),
    thisWeek: plantedSeedlings.filter(s => {
      if (!s.planted_at) return false;
      const plantedDate = new Date(s.planted_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return plantedDate >= weekAgo;
    }).length,
    withPhotos: plantedSeedlings.filter(s =>
      s.planting_photo_1 || s.planting_photo_2 || s.planting_photo_3
    ).length
  };

  const handleExportCSV = () => {
    if (filteredSeedlings.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Variety', 'Farmer', 'Association', 'Quantity', 'Planting Date', 'Location', 'Planting Method'];

    const rows = filteredSeedlings.map(s => [
      s.variety,
      s.farmers?.full_name || 'N/A',
      s.farmers?.association_name || 'N/A',
      s.planted_quantity || s.quantity_distributed,
      s.damaged_quantity || 0,
      s.planting_date ? new Date(s.planting_date).toLocaleDateString() : 'N/A',
      s.planting_location || 'N/A',
      s.planting_notes || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `planted_seedlings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-8">
      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="group relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Planted Units</p>
            <p className="text-4xl font-bold text-white">{stats.totalPlantedUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Total</span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Distributed</p>
            <p className="text-4xl font-bold text-white">{stats.totalDistributedUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">Recent</span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">This Week</p>
            <p className="text-4xl font-bold text-white">{stats.thisWeek}</p>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Losses/Damaged</p>
            <p className="text-4xl font-bold text-white">{stats.totalDamagedUnits.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Modern Search Bar with Export */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-green-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by variety, farmer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold whitespace-nowrap group"
            title="Export to CSV"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Planted Seedlings Grid */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading planted seedlings...</p>
          </div>
        ) : filteredSeedlings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No planted seedlings found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredSeedlings.map((seedling) => (
              <div key={seedling.seedling_id} className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-green-300 transition-all duration-300 hover:scale-105 bg-white">
                {/* Photo Carousel */}
                <div className="h-48 bg-gray-100 relative group">
                  {(() => {
                    const photos = [
                      seedling.planting_photo_1,
                      seedling.planting_photo_2,
                      seedling.planting_photo_3
                    ].filter(Boolean);

                    const currentIndex = currentPhotoIndex[seedling.seedling_id] || 0;
                    const currentPhoto = photos[currentIndex];

                    return currentPhoto ? (
                      <>
                        <img
                          src={currentPhoto}
                          alt={`Planting ${currentIndex + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => {
                            setSelectedImage(currentPhoto);
                            setShowImageModal(true);
                          }}
                        />
                        {/* Photo indicators */}
                        {photos.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                            {photos.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'
                                  }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sprout className="w-16 h-16 text-gray-300" />
                      </div>
                    );
                  })()}
                  <div className="absolute top-2 right-2">
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                      Planted
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{seedling.variety}</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{seedling.farmers?.full_name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Sprout className="w-4 h-4" />
                      <span>{seedling.planted_quantity ?? seedling.quantity_distributed} / {seedling.quantity_distributed} units planted</span>
                      {seedling.damaged_quantity !== undefined && seedling.damaged_quantity > 0 && (
                        <span className="text-red-500 font-medium ml-1">({seedling.damaged_quantity} loss)</span>
                      )}
                    </div>

                    {seedling.planting_date && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(seedling.planting_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {seedling.planting_location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{seedling.planting_location}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSeedling(seedling);
                      setShowViewModal(true);
                    }}
                    className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedSeedling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Planting Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Seedling Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-3">Seedling Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Variety:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.variety}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Quantity Distributed:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.quantity_distributed}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Actual Planted:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.planted_quantity ?? selectedSeedling.quantity_distributed} units</span>
                  </div>
                  {selectedSeedling.damaged_quantity !== undefined && selectedSeedling.damaged_quantity > 0 && (
                    <div>
                      <span className="text-red-700">Damaged/Losses:</span>
                      <span className="ml-2 font-medium text-red-900">{selectedSeedling.damaged_quantity} units</span>
                    </div>
                  )}
                  <div>
                    <span className="text-green-700">Farmer:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.farmers?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Association:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.farmers?.association_name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Planting Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Planting Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedSeedling.planting_date && (
                    <div>
                      <p className="text-sm text-gray-600">Planting Date</p>
                      <p className="font-medium text-gray-900">{new Date(selectedSeedling.planting_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedSeedling.planting_location && (
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{selectedSeedling.planting_location}</p>
                    </div>
                  )}
                  {selectedSeedling.planted_at && (
                    <div>
                      <p className="text-sm text-gray-600">Marked as Planted</p>
                      <p className="font-medium text-gray-900">{new Date(selectedSeedling.planted_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedSeedling.planting_notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Planting Method</p>
                      <p className="font-medium text-gray-900">{selectedSeedling.planting_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Planting Photos */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Planting Photos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <img
                        src={selectedSeedling.planting_photo_1}
                        alt="Planting 1"
                        className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                      />
                    )}
                    {selectedSeedling.planting_photo_2 && (
                      <img
                        src={selectedSeedling.planting_photo_2}
                        alt="Planting 2"
                        className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                      />
                    )}
                    {selectedSeedling.planting_photo_3 && (
                      <img
                        src={selectedSeedling.planting_photo_3}
                        alt="Planting 3"
                        className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Planting Photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantingMonitor;
