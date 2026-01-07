import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Package,
  Users,
  X,
  Download,
  Building2,
  Layers
} from 'lucide-react';

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
      const response = await fetch('https://easyabaca-api.vercel.app/api/mao/associations', {
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
      const response = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/mao/associations', {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/association-seedlings/mao/associations/${id}`, {
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
      
      const response = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/mao/distribute-to-association', {
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
      
      const response = await fetch(`https://easyabaca-api.vercel.app/api/association-seedlings/mao/associations/${selectedDistribution.distribution_id}`, {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Stats Cards - Matching User Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        {/* Total Distributions Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Distributions</p>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </div>
        </div>

        {/* Total Seedlings Card */}
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Sprout className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Total Quantity</p>
            <p className="text-4xl font-bold text-white">{stats.totalQuantity.toLocaleString()}</p>
          </div>
        </div>

        {/* This Month Card */}
        <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">This Month</p>
            <p className="text-4xl font-bold text-white">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Varieties Card */}
        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Varieties</p>
            <p className="text-4xl font-bold text-white">{stats.varieties}</p>
          </div>
        </div>
      </div>

      {/* Modern Filters with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by variety, supplier, association..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="w-full lg:w-56">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="distributed_to_association">📦 Distributed to Association</option>
                <option value="partially_distributed_to_farmers">🔄 Ongoing Distribution</option>
                <option value="fully_distributed_to_farmers">✅ Fully to Farmers</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
              title="Export to CSV"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Distribute to Association</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Card-Based Data Display */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-12 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading distributions...</p>
        </div>
      ) : filteredDistributions.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
            <Sprout className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">No seedling distributions found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4" />
                      Variety
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Recipient
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Source
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {currentDistributions.map((distribution, index) => (
                  <tr key={distribution.distribution_id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                    index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                        {distribution.seedling_photo ? (
                          <img
                            src={distribution.seedling_photo.startsWith('data:') ? distribution.seedling_photo : `https://easyabaca-api.vercel.app${distribution.seedling_photo}`}
                            alt="Seedling"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            }}
                          />
                        ) : distribution.packaging_photo ? (
                          <img
                            src={distribution.packaging_photo.startsWith('data:') ? distribution.packaging_photo : `https://easyabaca-api.vercel.app${distribution.packaging_photo}`}
                            alt="Packaging"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            }}
                          />
                        ) : distribution.quality_photo ? (
                          <img
                            src={distribution.quality_photo.startsWith('data:') ? distribution.quality_photo : `https://easyabaca-api.vercel.app${distribution.quality_photo}`}
                            alt="Quality"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            }}
                          />
                        ) : (
                          <Sprout className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(distribution.date_distributed).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-lg">{distribution.variety}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">{distribution.quantity_distributed.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="font-semibold text-blue-900">{distribution.recipient_association_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {distribution.organization?.full_name || distribution.source_supplier ? (
                        <div className="p-2 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="font-semibold text-purple-900">{distribution.organization?.full_name || distribution.source_supplier}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 ${
                        distribution.status === 'distributed_to_association' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        distribution.status === 'partially_distributed_to_farmers' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        distribution.status === 'fully_distributed_to_farmers' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {distribution.status === 'distributed_to_association' ? '📦 Distributed to Association' :
                         distribution.status === 'partially_distributed_to_farmers' ? '🔄 Ongoing Distribution' :
                         distribution.status === 'fully_distributed_to_farmers' ? '✅ Fully to Farmers' :
                         '❌ Cancelled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {distribution.status !== 'distributed_to_association' && distribution.status !== 'cancelled' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ 
                                width: `${((distribution.quantity_distributed - (distribution.remaining_quantity || 0)) / distribution.quantity_distributed) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">
                            {Math.round(((distribution.quantity_distributed - (distribution.remaining_quantity || 0)) / distribution.quantity_distributed) * 100)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDistribution(distribution);
                            setShowViewModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(distribution)}
                          className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 hover:shadow-md transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(distribution.distribution_id)}
                          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 hover:shadow-md transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                      onClick={() => handleItemsPerPageChange(size)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        itemsPerPage === size
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDistributions.length)} of {filteredDistributions.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      currentPage === totalPages
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
        </div>
      )}

      {/* Colorful Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b-2 border-blue-200 flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-100 to-emerald-100 z-10 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    {showAddModal ? 'Distribute to Association' : 'Edit Distribution'}
                  </h2>
                  <p className="text-sm text-emerald-700">
                    {showAddModal ? 'Distribute seedlings to an association' : 'Update distribution details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="w-10 h-10 bg-purple-400 hover:bg-purple-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSubmitWithPhotos : handleUpdateWithPhotos} className="p-6 bg-gradient-to-br from-blue-50 to-emerald-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">Variety *</label>
                  <input
                    type="text"
                    required
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold shadow-md"
                    placeholder="e.g., Musa Textilis, Tangongon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-emerald-800 mb-3">Source/Supplier</label>
                  <input
                    type="text"
                    value={formData.source_supplier}
                    onChange={(e) => setFormData({ ...formData, source_supplier: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold shadow-md"
                    placeholder="e.g., PhilFIDA Nursery"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-800 mb-3">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity_distributed}
                    onChange={handleQuantityChange}
                    className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">Date Distributed *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_distributed}
                    onChange={(e) => setFormData({ ...formData, date_distributed: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 font-semibold shadow-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-emerald-800 mb-3">Recipient Association *</label>
                  <select
                    required
                    value={formData.recipient_association_id}
                    onChange={handleAssociationChange}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-gray-800 font-semibold appearance-none cursor-pointer shadow-md"
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
                  <label className="block text-sm font-bold text-blue-800 mb-3">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 font-semibold appearance-none cursor-pointer shadow-md"
                  >
                    <option value="distributed_to_association">📦 Distributed to Association</option>
                    <option value="partially_distributed_to_farmers">🔄 Ongoing Distribution</option>
                    <option value="fully_distributed_to_farmers">✅ Fully Distributed to Farmers</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-emerald-800 mb-3">Remarks</label>
                  <textarea
                    rows={4}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold resize-none shadow-md"
                    placeholder="e.g., Healthy seedlings, ready for distribution to farmers"
                  />
                </div>

                {/* Photo Documentation Section */}
                <div className="md:col-span-2 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📸 Photo Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-blue-800 mb-2">Seedling Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'seedling_photo')}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 font-semibold shadow-md"
                      />
                      {formData.seedling_photo && (
                        <div className="mt-2 text-xs text-gray-600 truncate">Selected: {
                          typeof formData.seedling_photo === 'string' 
                            ? 'Photo uploaded' 
                            : formData.seedling_photo.name
                        }</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-purple-800 mb-2">Distribution Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'packaging_photo')}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-gray-800 font-semibold shadow-md"
                      />
                      {formData.packaging_photo && (
                        <div className="mt-2 text-xs text-gray-600 truncate">Selected: {
                          typeof formData.packaging_photo === 'string' 
                            ? 'Photo uploaded' 
                            : formData.packaging_photo.name
                        }</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-amber-800 mb-2">Quality Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'quality_photo')}
                        className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-2xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200 text-gray-800 font-semibold shadow-md"
                      />
                      {formData.quality_photo && (
                        <div className="mt-2 text-xs text-gray-600 truncate">Selected: {
                          typeof formData.quality_photo === 'string' 
                            ? 'Photo uploaded' 
                            : formData.quality_photo.name
                        }</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-8 py-3 bg-white rounded-2xl shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d5db,inset_-2px_-2px_4px_#ffffff] transition-all duration-200 text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-2xl shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] hover:bg-emerald-600 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{showAddModal ? 'Distributing...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>{showAddModal ? '✅ Distribute' : '💾 Save Changes'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDistribution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Distribution Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Variety</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.quantity_distributed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Distributed</p>
                  <p className="font-medium text-gray-900">{new Date(selectedDistribution.date_distributed).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source/Supplier</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.source_supplier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipient Association</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.recipient_association_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipient Officer</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.association_officers?.full_name || selectedDistribution.recipient_association_name || <span className="text-gray-400 italic">Not specified</span>}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedDistribution.status === 'distributed_to_association' ? 'bg-blue-100 text-blue-700' :
                    selectedDistribution.status === 'partially_distributed_to_farmers' ? 'bg-amber-100 text-amber-700' :
                    selectedDistribution.status === 'fully_distributed_to_farmers' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedDistribution.status === 'distributed_to_association' ? '📦 Distributed to Association' :
                     selectedDistribution.status === 'partially_distributed_to_farmers' ? '🔄 Ongoing Distribution' :
                     selectedDistribution.status === 'fully_distributed_to_farmers' ? '✅ Fully to Farmers' :
                     '❌ Cancelled'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distributed By</p>
                  <p className="font-medium text-gray-900">{selectedDistribution.organization?.full_name || <span className="text-gray-400 italic">MAO System</span>}</p>
                </div>
                {selectedDistribution.remarks && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Remarks</p>
                    <p className="font-medium text-gray-900">{selectedDistribution.remarks}</p>
                  </div>
                )}
              </div>

              {/* Progress Information */}
              {selectedDistribution.status !== 'distributed_to_association' && selectedDistribution.status !== 'cancelled' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">📊 Distribution Progress</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-blue-700">Progress to Farmers</span>
                      <span className="text-sm font-bold text-blue-900">
                        {Math.round(((selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)) / selectedDistribution.quantity_distributed) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ 
                          width: `${((selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)) / selectedDistribution.quantity_distributed) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="font-bold text-gray-900">{selectedDistribution.quantity_distributed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Distributed</p>
                        <p className="font-bold text-gray-900">{selectedDistribution.quantity_distributed - (selectedDistribution.remaining_quantity || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Remaining</p>
                        <p className="font-bold text-gray-900">{selectedDistribution.remaining_quantity || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Photos Section */}
              {(selectedDistribution.seedling_photo || selectedDistribution.packaging_photo || selectedDistribution.quality_photo) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">📸 Distribution Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedDistribution.seedling_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Seedling Photo</p>
                        <img
                          src={selectedDistribution.seedling_photo.startsWith('data:') ? selectedDistribution.seedling_photo : `https://easyabaca-api.vercel.app${selectedDistribution.seedling_photo}`}
                          alt="Seedling"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    {selectedDistribution.packaging_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Distribution Photo</p>
                        <img
                          src={selectedDistribution.packaging_photo.startsWith('data:') ? selectedDistribution.packaging_photo : `https://easyabaca-api.vercel.app${selectedDistribution.packaging_photo}`}
                          alt="Packaging"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="Arial" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                    {selectedDistribution.quality_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Quality Check Photo</p>
                        <img
                          src={selectedDistribution.quality_photo.startsWith('data:') ? selectedDistribution.quality_photo : `https://easyabaca-api.vercel.app${selectedDistribution.quality_photo}`}
                          alt="Quality"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
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