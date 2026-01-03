import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  Share2,
  Sprout,
  Calendar,
  Layers,
  Edit,
  Trash2,
  X,
  Camera,
  Upload,
  Users
} from 'lucide-react';

interface AssociationDistribution {
  distribution_id: string;
  variety: string;
  source_supplier?: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_association_name: string;
  remarks?: string;
  status: string;
  seedling_photo?: string;
  packaging_photo?: string;
  quality_photo?: string;
  created_at: string;
  organization?: {
    officer_id: string;
    full_name: string;
  };
  distributed_to_farmers?: number;
  farmers_count?: number;
  remaining_quantity?: number;
}

interface Farmer {
  farmer_id: string;
  full_name: string;
  email?: string;
  contact_number?: string;
  municipality?: string;
  barangay?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

interface NewFarmerDistributionForm {
  farmer_id: string;
  quantity_distributed: number;
  remarks: string;
  seedling_photo?: string;
  packaging_photo?: string;
  quality_photo?: string;
}

const DISTRIBUTION_STATUSES = [
  { value: 'distributed_to_association', label: '📦 Received from MAO' },
  { value: 'partially_distributed_to_farmers', label: '🔄 Ongoing Distribution' },
  { value: 'fully_distributed_to_farmers', label: '✅ Fully Distributed' },
  { value: 'cancelled', label: '❌ Cancelled' }
];

const AssociationInventory: React.FC = () => {
  const [distributions, setDistributions] = useState<AssociationDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<AssociationDistribution | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [distributeSubmitting, setDistributeSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [distributeForm, setDistributeForm] = useState<NewFarmerDistributionForm>({
    farmer_id: '',
    quantity_distributed: 0,
    remarks: '',
    seedling_photo: '',
    packaging_photo: '',
    quality_photo: ''
  });
  const [editForm, setEditForm] = useState({
    remarks: '',
    status: DISTRIBUTION_STATUSES[0].value
  });

  useEffect(() => {
    fetchReceivedDistributions();
    fetchFarmers();
  }, []);

  const fetchReceivedDistributions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/received', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Backend already provides distributed_to_farmers and remaining_quantity
        // No need to recalculate on frontend
        console.log('📦 Received distributions:', data);
        setDistributions(data);
      } else {
        console.error('Invalid data format:', data);
        setDistributions([]);
      }
    } catch (error) {
      console.error('Error fetching received distributions:', error);
      setDistributions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/farmers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to fetch farmers');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setFarmers(data);
      } else if (Array.isArray(data?.farmers)) {
        setFarmers(data.farmers);
      } else {
        setFarmers([]);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setFarmers([]);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const getAvailableQuantity = (distribution: AssociationDistribution) => {
    if (typeof distribution.remaining_quantity === 'number') {
      return distribution.remaining_quantity;
    }
    const distributed = distribution.distributed_to_farmers || 0;
    return Math.max(distribution.quantity_distributed - distributed, 0);
  };

  const handleOpenEditModal = (distribution: AssociationDistribution) => {
    setSelectedDistribution(distribution);
    setEditForm({
      remarks: distribution.remarks || '',
      status: distribution.status
    });
    setShowEditModal(true);
  };

  const openDistributeModal = (distribution: AssociationDistribution) => {
    setSelectedDistribution(distribution);
    setDistributeForm({
      farmer_id: '',
      quantity_distributed: 0,
      remarks: '',
      seedling_photo: '',
      packaging_photo: '',
      quality_photo: ''
    });
    setShowDistributeModal(true);
    if (farmers.length === 0) {
      fetchFarmers();
    }
  };

  const closeDistributeModal = () => {
    setShowDistributeModal(false);
    setDistributeForm({ farmer_id: '', quantity_distributed: 0, remarks: '', seedling_photo: '', packaging_photo: '', quality_photo: '' });
    setSelectedDistribution(null);
  };

  // Helper function to convert image to base64
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'seedling_photo' | 'packaging_photo' | 'quality_photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDistributeForm(prev => ({
        ...prev,
        [photoType]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDistributeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDistribution) return;

    const available = getAvailableQuantity(selectedDistribution);
    if (!distributeForm.farmer_id) {
      alert('Please select a farmer.');
      return;
    }

    if (
      distributeForm.quantity_distributed <= 0 ||
      distributeForm.quantity_distributed > available
    ) {
      alert(`Quantity must be between 1 and ${available.toLocaleString()}.`);
      return;
    }

    try {
      setDistributeSubmitting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch(
        'https://easyabaca-api.vercel.app/api/association-seedlings/association/distribute-to-farmers',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            association_distribution_id: selectedDistribution.distribution_id,
            farmer_distributions: [distributeForm]
          })
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to distribute seedlings');
      }

      alert('✅ Seedlings distributed to farmer successfully!');
      closeDistributeModal();
      fetchReceivedDistributions();
    } catch (error) {
      console.error('Error distributing seedlings:', error);
      alert(error instanceof Error ? error.message : 'Failed to distribute seedlings');
    } finally {
      setDistributeSubmitting(false);
    }
  };

  const handleUpdateDistribution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDistribution) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch(
        `https://easyabaca-api.vercel.app/api/association-seedlings/association/received/${selectedDistribution.distribution_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            remarks: editForm.remarks,
            status: editForm.status
          })
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update distribution');
      }

      alert('✅ Distribution updated successfully!');
      setShowEditModal(false);
      setSelectedDistribution(null);
      fetchReceivedDistributions();
    } catch (error) {
      console.error('Error updating distribution:', error);
      alert(error instanceof Error ? error.message : 'Failed to update distribution');
    }
  };

  const filteredDistributions = distributions.filter(dist => {
    const matchesSearch = 
      dist.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dist.source_supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dist.organization?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || dist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalEntries = filteredDistributions.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDistributions = filteredDistributions.slice(startIndex, endIndex);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Calculate total stats
  const totalReceived = distributions.reduce((sum, d) => sum + d.quantity_distributed, 0);
  const totalDistributed = distributions.reduce((sum, d) => sum + (d.distributed_to_farmers || 0), 0);
  const totalRemaining = distributions.reduce((sum, d) => sum + (d.remaining_quantity ?? 0), 0);
  const verifiedFarmers = farmers.filter(f => f.is_verified && f.is_active);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'distributed_to_association':
        return 'bg-blue-100 text-blue-800';
      case 'partially_distributed_to_farmers':
        return 'bg-amber-100 text-amber-800';
      case 'fully_distributed_to_farmers':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">TOTAL RECEIVED</p>
          <p className="text-4xl font-black mb-3">{totalReceived.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Package size={16} />
            <span>Seedlings from MAO</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">DISTRIBUTED TO FARMERS</p>
          <p className="text-4xl font-black mb-3">{totalDistributed.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Users size={16} />
            <span>To {verifiedFarmers.length} farmers</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Layers size={24} />
            </div>
          </div>
          <p className="text-sm uppercase tracking-wider opacity-90 mb-2">REMAINING STOCK</p>
          <p className="text-4xl font-black mb-3">{totalRemaining.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <Layers size={16} />
            <span>Available for distribution</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-white/60 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by variety, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 md:py-4 text-sm border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50 font-medium transition-all"
            />
          </div>
          <div className="w-full sm:w-56">
            <div className="relative">
              <Filter className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-3 md:py-4 text-sm border-2 border-gray-200 rounded-xl md:rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50 appearance-none cursor-pointer font-medium transition-all"
              >
                <option value="all">All Status</option>
                <option value="distributed_to_association">📦 Received</option>
                <option value="partially_distributed_to_farmers">🔄 Ongoing Distribution</option>
                <option value="fully_distributed_to_farmers">✅ Fully Distributed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-2xl border border-white/60 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-2">No seedlings in inventory</p>
            <p className="text-sm text-gray-500">Contact MAO to receive seedling distributions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 rounded-t-xl">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Variety</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Distributed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Remaining</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedDistributions.map((dist) => {
                  const distributedQty = dist.distributed_to_farmers || 0;
                  // Use ?? instead of || to handle 0 correctly (0 is a valid remaining quantity)
                  const remainingQty = dist.remaining_quantity ?? (dist.quantity_distributed - distributedQty);

                  return (
                    <tr key={dist.distribution_id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                          {dist.seedling_photo ? (
                            <img src={dist.seedling_photo} alt="Seedling" className="w-full h-full object-cover" />
                          ) : (
                            <Sprout className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900">
                        {new Date(dist.date_distributed).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900">
                        <div className="font-semibold">{dist.variety}</div>
                        {dist.source_supplier && (
                          <div className="text-xs text-gray-500">{dist.source_supplier}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900 font-semibold">
                        {dist.quantity_distributed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900 font-semibold">
                        {distributedQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-900 font-semibold">
                        {remainingQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(dist.status)}`}>
                          {dist.status === 'distributed_to_association' ? '📦 Received' :
                           dist.status === 'partially_distributed_to_farmers' ? '🔄 Ongoing Distribution' :
                           dist.status === 'fully_distributed_to_farmers' ? '✅ Fully Distributed' :
                           '❌ Cancelled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowViewModal(true);
                            }}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              handleOpenEditModal(dist);
                            }}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-amber-100 text-amber-700 hover:bg-amber-200"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowDeleteModal(true);
                            }}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-red-100 text-red-700 hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openDistributeModal(dist)}
                            disabled={remainingQty === 0}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              remainingQty > 0
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={remainingQty > 0 ? 'Distribute to Farmers' : 'No remaining seedlings'}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {filteredDistributions.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Distribution Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDistribution(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Variety</p>
                  <p className="font-semibold text-gray-900">{selectedDistribution.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Source/Supplier</p>
                  <p className="font-semibold text-gray-900">{selectedDistribution.source_supplier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date Distributed</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedDistribution.date_distributed).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Distributed By</p>
                  <p className="font-semibold text-gray-900">
                    {selectedDistribution.organization?.full_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Received</p>
                  <p className="font-semibold text-blue-600 text-lg">
                    {selectedDistribution.quantity_distributed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Distributed to Farmers</p>
                  <p className="font-semibold text-purple-600 text-lg">
                    {(selectedDistribution.distributed_to_farmers || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Remaining Inventory</p>
                  <p className="font-semibold text-emerald-600 text-lg">
                    {(selectedDistribution.remaining_quantity ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDistribution.status)}`}>
                    {selectedDistribution.status === 'distributed_to_association' ? '📦 Received' :
                     selectedDistribution.status === 'partially_distributed_to_farmers' ? '🔄 Ongoing Distribution' :
                     selectedDistribution.status === 'fully_distributed_to_farmers' ? '✅ Fully Distributed' :
                     '❌ Cancelled'}
                  </span>
                </div>
              </div>

              {selectedDistribution.remarks && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">Remarks</p>
                  <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedDistribution.remarks}
                  </p>
                </div>
              )}

              {/* Photos */}
              {(selectedDistribution.seedling_photo || selectedDistribution.packaging_photo || selectedDistribution.quality_photo) && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Photos</p>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDistribution.seedling_photo && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Seedling Photo</p>
                        <img 
                          src={selectedDistribution.seedling_photo} 
                          alt="Seedling" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedDistribution.packaging_photo && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Distribution Photo</p>
                        <img 
                          src={selectedDistribution.packaging_photo} 
                          alt="Packaging" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedDistribution.quality_photo && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Quality Photo</p>
                        <img 
                          src={selectedDistribution.quality_photo} 
                          alt="Quality" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showDistributeModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Distribute to Farmer</h2>
                  <p className="text-sm text-gray-500">{selectedDistribution.variety}</p>
                </div>
              </div>
              <button onClick={closeDistributeModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleDistributeSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Received</p>
                  <p className="font-semibold text-blue-700">{selectedDistribution.quantity_distributed.toLocaleString()} seedlings</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distributed so far</p>
                  <p className="font-semibold text-purple-700">{(selectedDistribution.distributed_to_farmers || 0).toLocaleString()} seedlings</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="font-semibold text-emerald-700">{getAvailableQuantity(selectedDistribution).toLocaleString()} seedlings</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDistribution.status)}`}>
                    {selectedDistribution.status === 'distributed_to_association' ? '📦 Received' :
                     selectedDistribution.status === 'partially_distributed_to_farmers' ? '🔄 Partial' :
                     selectedDistribution.status === 'fully_distributed_to_farmers' ? '✅ Fully Distributed' :
                     '❌ Cancelled'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Farmer *</label>
                  {loadingFarmers ? (
                    <div className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      <span className="text-gray-600 text-sm">Loading farmers...</span>
                    </div>
                  ) : verifiedFarmers.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      No verified farmers available. <button type="button" className="font-semibold underline" onClick={fetchFarmers}>Refresh list</button>
                    </div>
                  ) : (
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={distributeForm.farmer_id}
                      onChange={(e) => setDistributeForm(prev => ({ ...prev, farmer_id: e.target.value }))}
                      required
                    >
                      <option value="">-- Select Farmer --</option>
                      {verifiedFarmers.map(farmer => (
                        <option key={farmer.farmer_id} value={farmer.farmer_id}>
                          {farmer.full_name} {farmer.municipality ? `- ${farmer.municipality}` : ''} {farmer.barangay ? `(${farmer.barangay})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{verifiedFarmers.length} verified & active farmers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    max={getAvailableQuantity(selectedDistribution)}
                    value={distributeForm.quantity_distributed || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                      setDistributeForm(prev => ({ ...prev, quantity_distributed: value }));
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Max {getAvailableQuantity(selectedDistribution).toLocaleString()} seedlings</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={distributeForm.remarks}
                    onChange={(e) => setDistributeForm(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Additional notes (optional)"
                  />
                </div>

                {/* Photo Upload Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Seedling Photos (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Seedling Photo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Seedling Photo</label>
                      <div className="relative">
                        {distributeForm.seedling_photo ? (
                          <div className="relative group">
                            <img 
                              src={distributeForm.seedling_photo} 
                              alt="Seedling" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() => setDistributeForm(prev => ({ ...prev, seedling_photo: '' }))}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Upload Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoChange(e, 'seedling_photo')}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Distribution Photo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Distribution Photo</label>
                      <div className="relative">
                        {distributeForm.packaging_photo ? (
                          <div className="relative group">
                            <img 
                              src={distributeForm.packaging_photo} 
                              alt="Packaging" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() => setDistributeForm(prev => ({ ...prev, packaging_photo: '' }))}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Upload Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoChange(e, 'packaging_photo')}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Quality Photo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Quality Photo</label>
                      <div className="relative">
                        {distributeForm.quality_photo ? (
                          <div className="relative group">
                            <img 
                              src={distributeForm.quality_photo} 
                              alt="Quality" 
                              className="w-full h-32 object-cover rounded-lg border-2 border-emerald-200"
                            />
                            <button
                              type="button"
                              onClick={() => setDistributeForm(prev => ({ ...prev, quality_photo: '' }))}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Upload Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoChange(e, 'quality_photo')}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">💡 Tip: Upload photos to help farmers identify the seedlings</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeDistributeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={distributeSubmitting || verifiedFarmers.length === 0}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {distributeSubmitting ? 'Distributing...' : 'Confirm Distribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Edit className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Distribution</h2>
                  <p className="text-sm text-gray-600">Update distribution remarks</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDistribution(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleUpdateDistribution} className="p-6 space-y-6">
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Variety</p>
                    <p className="font-semibold text-gray-900">{selectedDistribution.variety}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {selectedDistribution.quantity_distributed.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    ℹ️ Note: You can only update remarks. Quantity and other details are managed by MAO.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  rows={4}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Add any notes or remarks about this distribution..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {DISTRIBUTION_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDistribution(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Distribution</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the distribution of <strong>{selectedDistribution.quantity_distributed}</strong> {selectedDistribution.variety} seedlings?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ Warning: This will also delete all farmer distributions associated with this record.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDistribution(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                      `https://easyabaca-api.vercel.app/api/association-seedlings/association/received/${selectedDistribution.distribution_id}`,
                      {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                      }
                    );

                    if (response.ok) {
                      alert('✅ Distribution deleted successfully!');
                      setShowDeleteModal(false);
                      setSelectedDistribution(null);
                      fetchReceivedDistributions();
                    } else {
                      const errorData = await response.json();
                      alert(`❌ Failed to delete: ${errorData.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('Error deleting distribution:', error);
                    alert('❌ Failed to delete distribution');
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationInventory;

