import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  Share2,
  Sprout,
  Edit,
  Trash2,
  X,
  Users
} from 'lucide-react';
import {
  KpiStrip,
  EditorialCard,
  StatusPill,
  EditorialCallout
} from '../Shared/EditorialUI';

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
  { value: 'partially_distributed_to_farmers', label: '🔄 Distributed to Farmers (Ongoing)' },
  { value: 'fully_distributed_to_farmers', label: '✅ Distributed to Farmers (Complete)' },
  { value: 'partially_planted', label: '🌱 Partially Planted' },
  { value: 'fully_planted', label: '🌳 Fully Planted' },
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
      const response = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/received', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        // Backend already provides distributed_to_farmers and remaining_quantity
        // No need to recalculate on frontend
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

      const response = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/farmers', {
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
        'https://fibersupplychain.onrender.com/api/association-seedlings/association/distribute-to-farmers',
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
        `https://fibersupplychain.onrender.com/api/association-seedlings/association/received/${selectedDistribution.distribution_id}`,
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

  const getStatusTone = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'distributed_to_association':
        return 'info';
      case 'partially_distributed_to_farmers':
      case 'partially_planted':
        return 'warning';
      case 'fully_distributed_to_farmers':
      case 'fully_planted':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'distributed_to_association':
        return 'Received';
      case 'partially_distributed_to_farmers':
      case 'partially_planted':
        return 'Ongoing Distribution';
      case 'fully_distributed_to_farmers':
      case 'fully_planted':
        return 'Completely Distributed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Total Received',
            value: totalReceived.toLocaleString(),
            subtext: 'Seedlings from MAO',
          },
          {
            label: 'Completely Distributed',
            value: totalDistributed.toLocaleString(),
            subtext: `To ${verifiedFarmers.length} farmers`,
          },
          {
            label: 'Remaining Stock',
            value: totalRemaining.toLocaleString(),
            subtext: 'Available for distribution',
          },
        ]}
      />

      {/* Filters */}
      <EditorialCard>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by variety, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
            />
          </div>
          <div className="w-full sm:w-64">
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter inventory by status"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] cursor-pointer transition-colors"
              >
                <option value="all">All Status</option>
                <option value="distributed_to_association">Received</option>
                <option value="partially_distributed_to_farmers">Ongoing Distribution</option>
                <option value="fully_distributed_to_farmers">Completely Distributed</option>
                <option value="partially_planted">Partially Planted</option>
                <option value="fully_planted">Fully Planted</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </EditorialCard>

      {/* Inventory Table */}
      <EditorialCard noPadding>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#047857]"></div>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold text-base mb-1">No seedlings in inventory</p>
            <p className="text-xs text-gray-500">Contact MAO to receive seedling distributions</p>
          </div>
        ) : (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Association seedling inventory">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variety</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Distributed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Remaining</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedDistributions.map((dist) => {
                  const distributedQty = dist.distributed_to_farmers || 0;
                  const remainingQty = dist.remaining_quantity ?? (dist.quantity_distributed - distributedQty);
                  const isCompleted = dist.status === 'fully_distributed_to_farmers' || dist.status === 'fully_planted';

                  return (
                    <tr key={dist.distribution_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          {dist.seedling_photo ? (
                            <img src={dist.seedling_photo} alt="Seedling" className="w-full h-full object-cover" />
                          ) : (
                            <Sprout className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-600 tabular-nums whitespace-nowrap">
                        <span className="hidden sm:inline">{new Date(dist.date_distributed).toLocaleDateString()}</span>
                        <span className="sm:hidden">{new Date(dist.date_distributed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-900">
                        <div className="font-semibold">{dist.variety}</div>
                        {dist.source_supplier && (
                          <div className="text-xs text-gray-500 hidden sm:block">{dist.source_supplier}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-900 font-semibold tabular-nums">
                        {dist.quantity_distributed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-900 font-semibold tabular-nums hidden sm:table-cell">
                        {distributedQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-xs sm:text-sm text-gray-900 font-semibold tabular-nums hidden sm:table-cell">
                        {remainingQty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone={getStatusTone(dist.status)}>
                          {getStatusLabel(dist.status)}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowViewModal(true);
                            }}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            title="View Details"
                            aria-label="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(dist)}
                            disabled={isCompleted}
                            className={`p-2 rounded-xl border transition-colors ${
                              isCompleted
                                ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            title={isCompleted ? 'Completed records cannot be modified' : 'Edit'}
                            aria-label="Edit distribution"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDistribution(dist);
                              setShowDeleteModal(true);
                            }}
                            disabled={isCompleted}
                            className={`p-2 rounded-xl border transition-colors ${
                              isCompleted
                                ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 bg-white text-red-600 hover:bg-red-50'
                            }`}
                            title={isCompleted ? 'Completed records cannot be modified' : 'Delete'}
                            aria-label="Delete distribution"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDistributeModal(dist)}
                            disabled={remainingQty === 0}
                            className={`p-2 rounded-xl transition-colors ${
                              remainingQty > 0
                                ? 'bg-[#047857] text-white hover:bg-[#065F46]'
                                : 'border border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                            }`}
                            title={remainingQty > 0 ? 'Distribute to Farmers' : 'No remaining seedlings'}
                            aria-label="Distribute to farmers"
                          >
                            <Share2 size={15} />
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-[#FAFAFA]">
            <p className="text-xs text-gray-500 tabular-nums">
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalEntries)} of {totalEntries} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </EditorialCard>

      {/* View Modal */}
      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-serif text-xl font-bold text-gray-900">Distribution Details</h2>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedDistribution(null);
                }}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Variety</p>
                  <p className="font-semibold text-sm text-gray-900">{selectedDistribution.variety}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Source/Supplier</p>
                  <p className="font-semibold text-sm text-gray-900">{selectedDistribution.source_supplier || 'N/A'}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Date Distributed</p>
                  <p className="font-semibold text-sm text-gray-900 tabular-nums">
                    {new Date(selectedDistribution.date_distributed).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Total Received</p>
                  <p className="font-bold text-gray-900 text-lg tabular-nums">
                    {selectedDistribution.quantity_distributed.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Completely Distributed</p>
                  <p className="font-bold text-gray-900 text-lg tabular-nums">
                    {(selectedDistribution.distributed_to_farmers || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#EAF6F0] border border-[#CBEAD9] p-4 rounded-xl">
                  <p className="text-xs text-[#047857] mb-1 font-medium">Remaining Inventory</p>
                  <p className="font-bold text-[#047857] text-lg tabular-nums">
                    {(selectedDistribution.remaining_quantity ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl col-span-1 sm:col-span-2">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Status</p>
                  <StatusPill tone={getStatusTone(selectedDistribution.status)}>
                    {getStatusLabel(selectedDistribution.status)}
                  </StatusPill>
                </div>
              </div>

              {selectedDistribution.remarks && (
                <div className="mb-6">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Remarks</p>
                  <p className="text-sm text-gray-900 bg-[#F8F9FA] border border-gray-200 p-3.5 rounded-xl">
                    {selectedDistribution.remarks}
                  </p>
                </div>
              )}

              {/* Photos */}
              {(selectedDistribution.seedling_photo || selectedDistribution.packaging_photo || selectedDistribution.quality_photo) && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Photos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedDistribution.seedling_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Seedling Photo</p>
                        <img
                          src={selectedDistribution.seedling_photo}
                          alt="Seedling"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedDistribution.packaging_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Distribution Photo</p>
                        <img
                          src={selectedDistribution.packaging_photo}
                          alt="Packaging"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedDistribution.quality_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Quality Photo</p>
                        <img
                          src={selectedDistribution.quality_photo}
                          alt="Quality"
                          className="w-full h-32 object-cover rounded-xl border border-gray-200"
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Distribute to Farmer</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedDistribution.variety}</p>
              </div>
              <button
                type="button"
                onClick={closeDistributeModal}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleDistributeSubmit} className="p-6 space-y-6">
                {/* Summary Cards Section */}
                <div className="bg-[#F8F9FA] rounded-xl p-4 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">
                    Distribution Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Total Received</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">{selectedDistribution.quantity_distributed.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Distributed</p>
                      <p className="text-lg font-bold text-gray-900 tabular-nums">{(selectedDistribution.distributed_to_farmers || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-[#EAF6F0] rounded-xl p-3 border border-[#CBEAD9]">
                      <p className="text-[11px] text-[#047857] font-medium mb-1">Available</p>
                      <p className="text-lg font-bold text-[#047857] tabular-nums">{getAvailableQuantity(selectedDistribution).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200 flex flex-col justify-center">
                      <p className="text-[11px] text-gray-500 font-medium mb-1">Status</p>
                      <div>
                        <StatusPill tone={getStatusTone(selectedDistribution.status)}>
                          {getStatusLabel(selectedDistribution.status)}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distribution Details Section */}
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-gray-900 pb-2 border-b border-gray-200">
                    Distribution Details
                  </h3>

                  {/* Farmer Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Select Farmer <span className="text-red-500">*</span>
                    </label>
                    {loadingFarmers ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-[#047857]"></div>
                        <span className="text-gray-600 text-xs">Loading farmers...</span>
                      </div>
                    ) : verifiedFarmers.length === 0 ? (
                      <EditorialCallout
                        tone="amber"
                        action={
                          <button type="button" className="text-xs font-semibold underline text-gray-900" onClick={fetchFarmers}>
                            Refresh list
                          </button>
                        }
                      >
                        No verified farmers available.
                      </EditorialCallout>
                    ) : (
                      <select
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
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
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {verifiedFarmers.length} verified & active farmers
                    </p>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={getAvailableQuantity(selectedDistribution)}
                      value={distributeForm.quantity_distributed || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                        setDistributeForm(prev => ({ ...prev, quantity_distributed: value }));
                      }}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors"
                      placeholder="Enter quantity"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Maximum available: <span className="font-semibold text-[#047857] tabular-nums">{getAvailableQuantity(selectedDistribution).toLocaleString()} seedlings</span>
                    </p>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Remarks</label>
                    <textarea
                      rows={3}
                      value={distributeForm.remarks}
                      onChange={(e) => setDistributeForm(prev => ({ ...prev, remarks: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857] transition-colors resize-none"
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="sticky bottom-0 bg-[#FAFAFA] border-t border-gray-200 px-6 py-4 rounded-b-2xl flex-shrink-0">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeDistributeModal}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleDistributeSubmit}
                  disabled={distributeSubmitting || verifiedFarmers.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {distributeSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
                      Distributing...
                    </span>
                  ) : (
                    'Confirm Distribution'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDistribution && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Edit Distribution</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update distribution remarks and status</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDistribution(null);
                }}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDistribution} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-[#F8F9FA] border border-gray-200 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                  <p className="font-semibold text-sm text-gray-900">{selectedDistribution.variety}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                  <p className="font-semibold text-sm text-gray-900 tabular-nums">
                    {selectedDistribution.quantity_distributed.toLocaleString()}
                  </p>
                </div>
              </div>

              <EditorialCallout tone="neutral">
                You can only update remarks and status. Quantity and source details are managed by MAO.
              </EditorialCallout>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Remarks
                </label>
                <textarea
                  rows={4}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
                  placeholder="Add any notes or remarks about this distribution..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
                >
                  {DISTRIBUTION_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDistribution(null);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900">Delete Distribution</h2>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the distribution of <strong className="tabular-nums">{selectedDistribution.quantity_distributed}</strong> {selectedDistribution.variety} seedlings?
              </p>
              <EditorialCallout tone="rose">
                This will also delete all farmer distributions associated with this record.
              </EditorialCallout>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDistribution(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('accessToken');
                    const response = await fetch(
                      `https://fibersupplychain.onrender.com/api/association-seedlings/association/received/${selectedDistribution.distribution_id}`,
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
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold"
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

