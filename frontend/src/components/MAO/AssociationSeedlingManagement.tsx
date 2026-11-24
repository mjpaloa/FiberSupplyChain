import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  Download
} from 'lucide-react';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

interface Association {
  officer_id: string;
  full_name: string;
  association_name: string;
  contact_number: string;
}

interface AssociationDistribution {
  distribution_id: string;
  variety: string;
  source_supplier?: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_association_id: string;
  recipient_association_name: string;
  remarks?: string;
  status: string;
  created_at: string;
  seedling_photo?: string;
  packaging_photo?: string;
  quality_photo?: string;
  organization?: {
    officer_id: string;
    full_name: string;
  };
  association_officers?: {
    officer_id: string;
    full_name: string;
    association_name: string;
    contact_number?: string;
  };
  distributed_to_farmers?: number;
  farmers_count?: number;
  remaining_quantity?: number;
}

interface DistributionFormData {
  variety: string;
  source_supplier: string;
  quantity_distributed: string | number;
  date_distributed: string;
  recipient_association_id: string;
  remarks: string;
  status: string;
  seedling_photo?: File | null;
  packaging_photo?: File | null;
  quality_photo?: File | null;
}

// Interface for submission data (after base64 conversion)
interface DistributionSubmissionData {
  variety: string;
  source_supplier: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_association_id: string;
  remarks: string;
  status: string;
  seedling_photo?: string | null;
  packaging_photo?: string | null;
  quality_photo?: string | null;
}

const AssociationSeedlingManagement: React.FC = () => {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [distributions, setDistributions] = useState<AssociationDistribution[]>([]);
  const [filteredDistributions, setFilteredDistributions] = useState<AssociationDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<AssociationDistribution | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    totalQuantity: 0,
    thisMonth: 0,
    varieties: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<DistributionFormData>({
    variety: '',
    source_supplier: '',
    quantity_distributed: '',
    date_distributed: new Date().toISOString().split('T')[0],
    recipient_association_id: '',
    remarks: '',
    status: 'distributed_to_association',
    seedling_photo: null,
    packaging_photo: null,
    quality_photo: null
  });

  useEffect(() => {
    fetchAssociations();
    fetchDistributions();
  }, []);

  useEffect(() => {
    filterDistributions();
  }, [distributions, searchTerm, statusFilter]);

  const fetchAssociations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/associations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setAssociations(data);
      } else {
        console.error('Invalid associations data format:', data);
        setAssociations([]);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
      setAssociations([]);
    }
  };

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/mao/associations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setDistributions(data);
        calculateStats(data);
      } else {
        console.error('Invalid data format:', data);
        setDistributions([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching distributions:', error);
      setDistributions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: AssociationDistribution[]) => {
    const total = data.length;
    const totalQuantity = data.reduce((sum, d) => sum + d.quantity_distributed, 0);
    const thisMonth = data.filter(d => {
      const date = new Date(d.date_distributed);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const varieties = new Set(data.map(d => d.variety)).size;

    setStats({ total, totalQuantity, thisMonth, varieties });
  };

  const filterDistributions = () => {
    let filtered = distributions;

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.source_supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.recipient_association_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.association_officers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    setFilteredDistributions(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this distribution record?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://fibersupplychain.onrender.com/api/association-seedlings/mao/associations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Distribution deleted successfully!');
        fetchDistributions();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete distribution: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting distribution:', error);
      alert('Failed to delete distribution');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, photoType: 'seedling_photo' | 'packaging_photo' | 'quality_photo') => {
    const file = e.target.files?.[0] || null;
    setFormData({
      ...formData,
      [photoType]: file
    });
  };

  // Handle association change
  const handleAssociationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const associationId = e.target.value;
    setFormData({
      ...formData,
      recipient_association_id: associationId
    });
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = e.target.value;
    setFormData({
      ...formData,
      quantity_distributed: newQuantity
    });
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Convert all photo files to base64 before submission
  const prepareFormDataForSubmission = async (): Promise<DistributionSubmissionData> => {
    const data: DistributionSubmissionData = {
      variety: formData.variety,
      source_supplier: formData.source_supplier,
      quantity_distributed: typeof formData.quantity_distributed === 'string' ? parseInt(formData.quantity_distributed) || 0 : formData.quantity_distributed,
      date_distributed: formData.date_distributed,
      recipient_association_id: formData.recipient_association_id,
      remarks: formData.remarks,
      status: formData.status,
      seedling_photo: null,
      packaging_photo: null,
      quality_photo: null
    };

    if (formData.seedling_photo && formData.seedling_photo instanceof File) {
      try {
        data.seedling_photo = await fileToBase64(formData.seedling_photo);
      } catch (error) {
        console.error('Error converting seedling photo:', error);
      }
    } else if (typeof formData.seedling_photo === 'string') {
      data.seedling_photo = formData.seedling_photo;
    }

    if (formData.packaging_photo && formData.packaging_photo instanceof File) {
      try {
        data.packaging_photo = await fileToBase64(formData.packaging_photo);
      } catch (error) {
        console.error('Error converting distribution photo:', error);
      }
    } else if (typeof formData.packaging_photo === 'string') {
      data.packaging_photo = formData.packaging_photo;
    }

    if (formData.quality_photo && formData.quality_photo instanceof File) {
      try {
        data.quality_photo = await fileToBase64(formData.quality_photo);
      } catch (error) {
        console.error('Error converting quality photo:', error);
      }
    } else if (typeof formData.quality_photo === 'string') {
      data.quality_photo = formData.quality_photo;
    }

    return data;
  };

  // Override handleSubmit to handle photo uploads
  const handleSubmitWithPhotos = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const data = await prepareFormDataForSubmission();

      const response = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/mao/distribute-to-association', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('✅ Seedlings distributed to association successfully!');
        setShowAddModal(false);
        resetForm();
        fetchDistributions();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to distribute seedlings: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating distribution:', error);
      alert('❌ Failed to distribute seedlings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Override handleUpdate to handle photo uploads
  const handleUpdateWithPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistribution) return;

    // Prevent double submission
    if (submitting) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const data = await prepareFormDataForSubmission();

      const response = await fetch(`https://fibersupplychain.onrender.com/api/association-seedlings/mao/associations/${selectedDistribution.distribution_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('✅ Distribution updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchDistributions();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to update distribution: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating distribution:', error);
      alert('❌ Failed to update distribution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      variety: '',
      source_supplier: '',
      quantity_distributed: '',
      date_distributed: new Date().toISOString().split('T')[0],
      recipient_association_id: '',
      remarks: '',
      status: 'distributed_to_association',
      seedling_photo: null,
      packaging_photo: null,
      quality_photo: null
    });
  };

  const handleExportCSV = () => {
    if (filteredDistributions.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Variety', 'Quantity', 'Source/Supplier', 'Recipient Association', 'Status', 'Remarks'];

    const rows = filteredDistributions.map(d => [
      new Date(d.date_distributed).toLocaleDateString(),
      d.variety,
      d.quantity_distributed,
      d.source_supplier || 'N/A',
      d.recipient_association_name || 'N/A',
      d.status,
      d.remarks || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `association_seedling_distribution_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditModal = (distribution: AssociationDistribution) => {
    setSelectedDistribution(distribution);
    setFormData({
      variety: distribution.variety,
      source_supplier: distribution.source_supplier || '',
      quantity_distributed: distribution.quantity_distributed.toString(),
      date_distributed: distribution.date_distributed,
      recipient_association_id: distribution.recipient_association_id,
      remarks: distribution.remarks || '',
      status: distribution.status,
      seedling_photo: null,
      packaging_photo: null,
      quality_photo: null
    });
    setShowEditModal(true);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredDistributions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDistributions = filteredDistributions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Distributions',
            value: stats.total.toLocaleString(),
            subtext: 'All recorded batches',
          },
          {
            label: 'Total Quantity',
            value: stats.totalQuantity.toLocaleString(),
            subtext: 'Seedlings distributed',
          },
          {
            label: 'This Month',
            value: stats.thisMonth.toLocaleString(),
            subtext: 'Current month batches',
          },
          {
            label: 'Varieties',
            value: stats.varieties.toLocaleString(),
            subtext: 'Distinct varieties',
          },
        ]}
      />

      {/* Filters & Actions */}
      <EditorialCard>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by variety, supplier, association..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>

          <div className="w-full lg:w-56">
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
              >
                <option value="all">All Status</option>
                <option value="distributed_to_association">Distributed to Association</option>
                <option value="partially_distributed_to_farmers">Ongoing Distribution</option>
                <option value="fully_distributed_to_farmers">Completely Distributed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Export to CSV"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Distribute to Association</span>
            </button>
          </div>
        </div>
      </EditorialCard>

      {/* Distributions Table */}
      <EditorialCard noPadding>
        {loading ? (
          <div className="p-12 text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#047857] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Loading distributions...</p>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
              <Sprout className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">No seedling distributions found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper" tabIndex={0} role="region" aria-label="Association seedling distributions table">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Variety</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentDistributions.map((distribution) => {
                    const statusKey = distribution.status?.toLowerCase();
                    const pillTone =
                      statusKey === 'distributed_to_association' || !distribution.status
                        ? 'info'
                        : statusKey === 'partially_distributed_to_farmers' || statusKey === 'partially_planted'
                          ? 'warning'
                          : statusKey === 'fully_distributed_to_farmers' || statusKey === 'fully_planted'
                            ? 'success'
                            : statusKey === 'cancelled'
                              ? 'danger'
                              : 'neutral';
                    const statusLabel =
                      statusKey === 'distributed_to_association' || !distribution.status
                        ? 'Distributed to Association'
                        : statusKey === 'partially_distributed_to_farmers' || statusKey === 'partially_planted'
                          ? 'Ongoing Distribution'
                          : statusKey === 'fully_distributed_to_farmers' || statusKey === 'fully_planted'
                            ? 'Completely Distributed'
                            : statusKey === 'cancelled'
                              ? 'Cancelled'
                              : distribution.status;
                    const isCompleted = statusKey === 'fully_distributed_to_farmers' || statusKey === 'fully_planted';

                    return (
                      <tr key={distribution.distribution_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                            {distribution.seedling_photo ? (
                              <img
                                src={distribution.seedling_photo.startsWith('data:') ? distribution.seedling_photo : `https://fibersupplychain.onrender.com${distribution.seedling_photo}`}
                                alt="Seedling"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                }}
                              />
                            ) : distribution.packaging_photo ? (
                              <img
                                src={distribution.packaging_photo.startsWith('data:') ? distribution.packaging_photo : `https://fibersupplychain.onrender.com${distribution.packaging_photo}`}
                                alt="Packaging"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                }}
                              />
                            ) : distribution.quality_photo ? (
                              <img
                                src={distribution.quality_photo.startsWith('data:') ? distribution.quality_photo : `https://fibersupplychain.onrender.com${distribution.quality_photo}`}
                                alt="Quality"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                }}
                              />
                            ) : (
                              <Sprout className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 tabular-nums">
                          {new Date(distribution.date_distributed).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-sm text-gray-900">{distribution.variety}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-sm text-gray-900 tabular-nums">
                            {distribution.quantity_distributed.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="font-medium text-gray-900">{distribution.recipient_association_name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {distribution.organization?.full_name || distribution.source_supplier ? (
                            <span className="text-gray-700 font-medium">
                              {distribution.organization?.full_name || distribution.source_supplier}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusPill tone={pillTone}>{statusLabel}</StatusPill>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {distribution.status !== 'distributed_to_association' && distribution.status !== 'cancelled' ? (
                            <div className="flex items-center gap-2 min-w-[110px]">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#047857] h-2 rounded-full"
                                  style={{
                                    width: `${((distribution.quantity_distributed - (distribution.remaining_quantity || 0)) / distribution.quantity_distributed) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-700 tabular-nums">
                                {Math.round(((distribution.quantity_distributed - (distribution.remaining_quantity || 0)) / distribution.quantity_distributed) * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDistribution(distribution);
                                setShowViewModal(true);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(distribution)}
                              disabled={isCompleted}
                              className={`p-2 rounded-lg transition-colors ${isCompleted
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-amber-700 hover:bg-amber-50'}`}
                              title={isCompleted ? 'Completed records cannot be modified' : 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(distribution.distribution_id)}
                              disabled={isCompleted}
                              className={`p-2 rounded-lg transition-colors ${isCompleted
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:bg-red-50'}`}
                              title={isCompleted ? 'Completed records cannot be modified' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                        onClick={() => handleItemsPerPageChange(size)}
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
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredDistributions.length)} of {filteredDistributions.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EAF6F0] text-[#047857] rounded-xl flex items-center justify-center">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-900">
                    {showAddModal ? 'Distribute to Association' : 'Edit Distribution'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {showAddModal ? 'Distribute seedlings to an association' : 'Update distribution details'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSubmitWithPhotos : handleUpdateWithPhotos} className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Variety *</label>
                  <input
                    type="text"
                    required
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                    placeholder="e.g., Musa Textilis, Tangongon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Source/Supplier</label>
                  <input
                    type="text"
                    value={formData.source_supplier}
                    onChange={(e) => setFormData({ ...formData, source_supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                    placeholder="e.g., PhilFIDA Nursery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity_distributed}
                    onChange={handleQuantityChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Distributed *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_distributed}
                    onChange={(e) => setFormData({ ...formData, date_distributed: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient Association *</label>
                  <select
                    required
                    value={formData.recipient_association_id}
                    onChange={handleAssociationChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
                  >
                    <option value="">Select Association</option>
                    {associations.map((association) => (
                      <option key={association.officer_id} value={association.officer_id}>
                        {association.association_name} - {association.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer transition-colors"
                  >
                    <option value="distributed_to_association">Distributed to Association</option>
                    <option value="partially_distributed_to_farmers">Ongoing Distribution</option>
                    <option value="fully_distributed_to_farmers">Completely Distributed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] resize-none transition-colors"
                    placeholder="e.g., Healthy seedlings, ready for distribution to farmers"
                  />
                </div>

                {/* Photo Documentation Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-5">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Photo Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Seedling Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'seedling_photo')}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      />
                      {formData.seedling_photo && (
                        <div className="mt-1.5 text-xs text-gray-500 truncate">Selected: {
                          typeof formData.seedling_photo === 'string'
                            ? 'Photo uploaded'
                            : formData.seedling_photo.name
                        }</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Distribution Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'packaging_photo')}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      />
                      {formData.packaging_photo && (
                        <div className="mt-1.5 text-xs text-gray-500 truncate">Selected: {
                          typeof formData.packaging_photo === 'string'
                            ? 'Photo uploaded'
                            : formData.packaging_photo.name
                        }</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quality Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'quality_photo')}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      />
                      {formData.quality_photo && (
                        <div className="mt-1.5 text-xs text-gray-500 truncate">Selected: {
                          typeof formData.quality_photo === 'string'
                            ? 'Photo uploaded'
                            : formData.quality_photo.name
                        }</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{showAddModal ? 'Distributing...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{showAddModal ? 'Distribute Seedlings' : 'Save Changes'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-serif text-xl font-bold text-gray-900">Distribution Details</h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Variety</p>
                  <p className="font-semibold text-sm text-gray-900 mt-0.5">{selectedDistribution.variety}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="font-semibold text-sm text-gray-900 tabular-nums mt-0.5">{selectedDistribution.quantity_distributed.toLocaleString()}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Date Distributed</p>
                  <p className="font-semibold text-sm text-gray-900 tabular-nums mt-0.5">{new Date(selectedDistribution.date_distributed).toLocaleDateString()}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Source/Supplier</p>
                  <p className="font-semibold text-sm text-gray-900 mt-0.5">{selectedDistribution.source_supplier || 'N/A'}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Recipient Association</p>
                  <p className="font-semibold text-sm text-gray-900 mt-0.5">{selectedDistribution.recipient_association_name}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Recipient Coordinator</p>
                  <p className="font-semibold text-sm text-gray-900 mt-0.5">{selectedDistribution.association_officers?.full_name || selectedDistribution.recipient_association_name || <span className="text-gray-400 italic">Not specified</span>}</p>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusPill
                    tone={
                      selectedDistribution.status?.toLowerCase() === 'distributed_to_association' || !selectedDistribution.status
                        ? 'info'
                        : selectedDistribution.status?.toLowerCase() === 'partially_distributed_to_farmers' || selectedDistribution.status?.toLowerCase() === 'partially_planted'
                          ? 'warning'
                          : selectedDistribution.status?.toLowerCase() === 'fully_distributed_to_farmers' || selectedDistribution.status?.toLowerCase() === 'fully_planted'
                            ? 'success'
                            : selectedDistribution.status?.toLowerCase() === 'cancelled'
                              ? 'danger'
                              : 'neutral'
                    }
                  >
                    {selectedDistribution.status?.toLowerCase() === 'distributed_to_association' || !selectedDistribution.status
                      ? 'Distributed to Association'
                      : selectedDistribution.status?.toLowerCase() === 'partially_distributed_to_farmers' || selectedDistribution.status?.toLowerCase() === 'partially_planted'
                        ? 'Ongoing Distribution'
                        : selectedDistribution.status?.toLowerCase() === 'fully_distributed_to_farmers' || selectedDistribution.status?.toLowerCase() === 'fully_planted'
                          ? 'Completely Distributed'
                          : selectedDistribution.status?.toLowerCase() === 'cancelled'
                            ? 'Cancelled'
                            : selectedDistribution.status}
                  </StatusPill>
                </div>
                <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500">Distributed By</p>
                  <p className="font-semibold text-sm text-gray-900 mt-0.5">{selectedDistribution.organization?.full_name || <span className="text-gray-400 italic">MAO System</span>}</p>
                </div>
                {selectedDistribution.remarks && (
                  <div className="sm:col-span-2 bg-[#F8F9FA] border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs text-gray-500">Remarks</p>
                    <p className="font-medium text-sm text-gray-900 mt-0.5">{selectedDistribution.remarks}</p>
                  </div>
                )}
              </div>

              {/* Progress Information */}
              {selectedDistribution.status !== 'distributed_to_association' && selectedDistribution.status !== 'cancelled' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-serif text-base font-bold text-gray-900 mb-3">Distribution Progress</h4>
                  <div className="bg-[#F8F9FA] border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-600">Progress to Farmers</span>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">
                        {Math.round(((selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)) / selectedDistribution.quantity_distributed) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div
                        className="bg-[#047857] h-2.5 rounded-full"
                        style={{
                          width: `${((selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)) / selectedDistribution.quantity_distributed) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold text-gray-900 tabular-nums">{selectedDistribution.quantity_distributed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Distributed</p>
                        <p className="font-bold text-gray-900 tabular-nums">{(selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Remaining</p>
                        <p className="font-bold text-gray-900 tabular-nums">{(selectedDistribution.remaining_quantity || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Photos Section */}
              {(selectedDistribution.seedling_photo || selectedDistribution.packaging_photo || selectedDistribution.quality_photo) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-serif text-base font-bold text-gray-900 mb-3">Distribution Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedDistribution.seedling_photo && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Seedling Photo</p>
                        <img
                          src={selectedDistribution.seedling_photo.startsWith('data:') ? selectedDistribution.seedling_photo : `https://fibersupplychain.onrender.com${selectedDistribution.seedling_photo}`}
                          alt="Seedling"
                          className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    {selectedDistribution.packaging_photo && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Distribution Photo</p>
                        <img
                          src={selectedDistribution.packaging_photo.startsWith('data:') ? selectedDistribution.packaging_photo : `https://fibersupplychain.onrender.com${selectedDistribution.packaging_photo}`}
                          alt="Packaging"
                          className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    {selectedDistribution.quality_photo && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">Quality Check Photo</p>
                        <img
                          src={selectedDistribution.quality_photo.startsWith('data:') ? selectedDistribution.quality_photo : `https://fibersupplychain.onrender.com${selectedDistribution.quality_photo}`}
                          alt="Quality"
                          className="w-full h-48 object-cover rounded-xl border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
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
    </div>
  );
};

export default AssociationSeedlingManagement;