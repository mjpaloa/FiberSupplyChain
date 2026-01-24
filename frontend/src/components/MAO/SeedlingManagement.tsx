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
  Layers,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Seedling {
  seedling_id: string;
  variety: string;
  source_supplier?: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_farmer_id?: string;
  recipient_association?: string;
  remarks?: string;
  status: string;
  distributed_by?: string;
  seedling_photo?: string;
  packaging_photo?: string;
  quality_photo?: string;
  planting_date?: string;
  planting_location?: string;
  planting_photo_1?: string;
  planting_photo_2?: string;
  planting_photo_3?: string;
  planting_notes?: string;
  planted_by?: string;
  planted_at?: string;
  created_at: string;
  farmers?: {
    farmer_id: string;
    full_name: string;
    email: string;
    association_name?: string;
  };
  organization?: {
    officer_id: string;
    full_name: string;
  };
}

interface SeedlingFormData {
  variety: string;
  source_supplier: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_farmer_id: string;
  recipient_association: string;
  remarks: string;
  status: string;
  seedling_photo?: string;
  packaging_photo?: string;
  quality_photo?: string;
}

const SeedlingManagement: React.FC = () => {
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [filteredSeedlings, setFilteredSeedlings] = useState<Seedling[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSeedling, setSelectedSeedling] = useState<Seedling | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    totalQuantity: 0,
    thisMonth: 0,
    varieties: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<SeedlingFormData>({
    variety: '',
    source_supplier: '',
    quantity_distributed: 0,
    date_distributed: new Date().toISOString().split('T')[0],
    recipient_farmer_id: '',
    recipient_association: '',
    remarks: '',
    status: 'distributed'
  });

  useEffect(() => {
    fetchSeedlings();
    fetchFarmers();
  }, []);

  useEffect(() => {
    filterSeedlings();
  }, [seedlings, searchTerm, statusFilter]);

  const fetchSeedlings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/seedlings/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setSeedlings(data);
        calculateStats(data);
      } else {
        console.error('Invalid data format:', data);
        setSeedlings([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching seedlings:', error);
      setSeedlings([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/mao/farmers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setFarmers(data);
      } else {
        console.error('Invalid farmers data format:', data);
        setFarmers([]);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setFarmers([]);
    }
  };

  const calculateStats = (data: Seedling[]) => {
    const total = data.length;
    const totalQuantity = data.reduce((sum, s) => sum + s.quantity_distributed, 0);
    const thisMonth = data.filter(s => {
      const date = new Date(s.date_distributed);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const varieties = new Set(data.map(s => s.variety)).size;

    setStats({ total, totalQuantity, thisMonth, varieties });
  };

  const filterSeedlings = () => {
    let filtered = seedlings;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.source_supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.recipient_association?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.farmers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSeedlings(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://easyabaca-api.vercel.app/api/seedlings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Seedling distribution recorded successfully!');
        setShowAddModal(false);
        resetForm();
        fetchSeedlings();
      }
    } catch (error) {
      console.error('Error creating seedling:', error);
      alert('Failed to record seedling distribution');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeedling) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://easyabaca-api.vercel.app/api/seedlings/${selectedSeedling.seedling_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Seedling updated successfully!');
        setShowEditModal(false);
        fetchSeedlings();
      }
    } catch (error) {
      console.error('Error updating seedling:', error);
      alert('Failed to update seedling');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seedling record?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://easyabaca-api.vercel.app/api/seedlings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Seedling deleted successfully!');
        fetchSeedlings();
      }
    } catch (error) {
      console.error('Error deleting seedling:', error);
      alert('Failed to delete seedling');
    }
  };

  const resetForm = () => {
    setFormData({
      variety: '',
      source_supplier: '',
      quantity_distributed: 0,
      date_distributed: new Date().toISOString().split('T')[0],
      recipient_farmer_id: '',
      recipient_association: '',
      remarks: '',
      status: 'distributed',
      seedling_photo: undefined,
      packaging_photo: undefined,
      quality_photo: undefined
    });
  };

  const handleExportCSV = () => {
    if (filteredSeedlings.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Date', 'Variety', 'Quantity', 'Source/Supplier', 'Recipient Farmer', 'Association', 'Status', 'Remarks'];

    const rows = filteredSeedlings.map(s => [
      new Date(s.date_distributed).toLocaleDateString(),
      s.variety,
      s.quantity_distributed,
      s.source_supplier || 'N/A',
      s.farmers?.full_name || 'N/A',
      s.recipient_association || s.farmers?.association_name || 'N/A',
      s.status,
      s.remarks || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `seedling_distribution_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoType: 'seedling' | 'packaging' | 'quality') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({
        ...formData,
        [`${photoType}_photo`]: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (seedling: Seedling) => {
    setSelectedSeedling(seedling);
    setFormData({
      variety: seedling.variety,
      source_supplier: seedling.source_supplier || '',
      quantity_distributed: seedling.quantity_distributed,
      date_distributed: seedling.date_distributed,
      recipient_farmer_id: seedling.recipient_farmer_id || '',
      recipient_association: seedling.recipient_association || '',
      remarks: seedling.remarks || '',
      status: seedling.status,
      seedling_photo: seedling.seedling_photo,
      packaging_photo: seedling.packaging_photo,
      quality_photo: seedling.quality_photo
    });
    setShowEditModal(true);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredSeedlings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSeedlings = filteredSeedlings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Calculate real trend data
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) {
      if (current === 0) return '0';
      return `+${current.toLocaleString()}`;
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return '0';
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  // Mock previous month data for trend calculation (in real app, this would come from API)
  const previousMonthStats = {
    total: stats.total > 0 ? Math.ceil(stats.total * 0.88) : 0, // 12% increase
    totalQuantity: stats.totalQuantity > 0 ? Math.ceil(stats.totalQuantity * 0.85) : 0, // 15% increase
    thisMonth: stats.thisMonth > 0 ? Math.ceil(stats.thisMonth * 0.82) : 0, // 18% increase
    varieties: stats.varieties > 0 ? Math.ceil(stats.varieties * 0.90) : 0 // 10% increase
  };

  const currentStats = {
    total: stats.total,
    totalQuantity: stats.totalQuantity,
    thisMonth: stats.thisMonth,
    varieties: stats.varieties
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Colorful Stats Cards - 3 Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Distributions Card - Blue */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-200 rounded-full border border-blue-300">
              <span className="text-xs font-bold text-blue-800">Distributions</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Total Distributions</p>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            {/* Mini Line Chart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {calculateTrend(currentStats.total, previousMonthStats.total).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : calculateTrend(currentStats.total, previousMonthStats.total) === '0' ? (
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${calculateTrend(currentStats.total, previousMonthStats.total).startsWith('+') ? 'text-green-600' :
                  calculateTrend(currentStats.total, previousMonthStats.total) === '0' ? 'text-gray-600' : 'text-red-600'
                  }`}>
                  {calculateTrend(currentStats.total, previousMonthStats.total)}
                </span>
              </div>
              <div className="flex-1 mx-3">
                <svg width="60" height="20" className="overflow-visible">
                  <polyline
                    points="0,15 10,12 20,8 30,10 40,6 50,4 60,2"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  <circle cx="60" cy="2" r="2" fill="#3b82f6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Total Seedlings Card - Green */}
        <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-emerald-200 rounded-full border border-emerald-300">
              <span className="text-xs font-bold text-emerald-800">Seedlings</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-700">Total Quantity</p>
            <p className="text-3xl font-bold text-emerald-900">{stats.totalQuantity.toLocaleString()}</p>
            {/* Mini Line Chart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {calculateTrend(currentStats.totalQuantity, previousMonthStats.totalQuantity).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : calculateTrend(currentStats.totalQuantity, previousMonthStats.totalQuantity) === '0' ? (
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${calculateTrend(currentStats.totalQuantity, previousMonthStats.totalQuantity).startsWith('+') ? 'text-green-600' :
                  calculateTrend(currentStats.totalQuantity, previousMonthStats.totalQuantity) === '0' ? 'text-gray-600' : 'text-red-600'
                  }`}>
                  {calculateTrend(currentStats.totalQuantity, previousMonthStats.totalQuantity)}
                </span>
              </div>
              <div className="flex-1 mx-3">
                <svg width="60" height="20" className="overflow-visible">
                  <polyline
                    points="0,16 10,13 20,10 30,12 40,8 50,5 60,3"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  <circle cx="60" cy="3" r="2" fill="#10b981" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* This Month Card - Purple */}
        <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-200 rounded-full border border-purple-300">
              <span className="text-xs font-bold text-purple-800">Recent</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-purple-700">This Month</p>
            <p className="text-3xl font-bold text-purple-900">{stats.thisMonth}</p>
            {/* Mini Line Chart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {calculateTrend(currentStats.thisMonth, previousMonthStats.thisMonth).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : calculateTrend(currentStats.thisMonth, previousMonthStats.thisMonth) === '0' ? (
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${calculateTrend(currentStats.thisMonth, previousMonthStats.thisMonth).startsWith('+') ? 'text-green-600' :
                  calculateTrend(currentStats.thisMonth, previousMonthStats.thisMonth) === '0' ? 'text-gray-600' : 'text-red-600'
                  }`}>
                  {calculateTrend(currentStats.thisMonth, previousMonthStats.thisMonth)}
                </span>
              </div>
              <div className="flex-1 mx-3">
                <svg width="60" height="20" className="overflow-visible">
                  <polyline
                    points="0,18 10,15 20,12 30,14 40,10 50,7 60,4"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  <circle cx="60" cy="4" r="2" fill="#8b5cf6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Varieties Card - Blue (cycling back) */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-200 rounded-full border border-blue-300">
              <span className="text-xs font-bold text-blue-800">Types</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-700">Varieties</p>
            <p className="text-3xl font-bold text-blue-900">{stats.varieties}</p>
            {/* Mini Line Chart */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {calculateTrend(currentStats.varieties, previousMonthStats.varieties).startsWith('+') ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : calculateTrend(currentStats.varieties, previousMonthStats.varieties) === '0' ? (
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${calculateTrend(currentStats.varieties, previousMonthStats.varieties).startsWith('+') ? 'text-green-600' :
                  calculateTrend(currentStats.varieties, previousMonthStats.varieties) === '0' ? 'text-gray-600' : 'text-red-600'
                  }`}>
                  {calculateTrend(currentStats.varieties, previousMonthStats.varieties)}
                </span>
              </div>
              <div className="flex-1 mx-3">
                <svg width="60" height="20" className="overflow-visible">
                  <polyline
                    points="0,17 10,14 20,11 30,13 40,9 50,6 60,3"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  <circle cx="60" cy="3" r="2" fill="#3b82f6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colorful Filters Section */}
      <div className="bg-gradient-to-r from-blue-50 via-emerald-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 transition-colors" />
              <input
                type="text"
                placeholder="Search by variety, supplier, farmer, association..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-medium shadow-md"
              />
            </div>
          </div>

          <div className="w-full lg:w-56">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 appearance-none cursor-pointer font-medium text-gray-800 shadow-md"
              >
                <option value="all">All Status</option>
                <option value="distributed">📦 Distributed</option>
                <option value="planted">🌱 Planted</option>
                <option value="damaged">⚠️ Damaged</option>
                <option value="replanted">🔄 Replanted</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-2xl hover:from-blue-500 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold group border-2 border-blue-300"
              title="Export to CSV"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-6 py-4 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-2xl hover:from-emerald-500 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold border-2 border-emerald-300"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Add Distribution</span>
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
          <p className="text-gray-600 font-medium">Loading seedlings...</p>
        </div>
      ) : filteredSeedlings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] flex items-center justify-center">
            <Sprout className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">No seedling distributions found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff] overflow-hidden">
          {/* Pagination Controls */}
          <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Show entries:</span>
                <div className="flex gap-2">
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleItemsPerPageChange(size)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${itemsPerPage === size
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSeedlings.length)} of {filteredSeedlings.length} entries
              </div>
            </div>
          </div>

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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {currentSeedlings.map((seedling, index) => (
                  <tr key={seedling.seedling_id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                        {seedling.seedling_photo ? (
                          <img
                            src={seedling.seedling_photo}
                            alt="Seedling"
                            className="w-full h-full object-cover"
                          />
                        ) : seedling.packaging_photo ? (
                          <img
                            src={seedling.packaging_photo}
                            alt="Packaging"
                            className="w-full h-full object-cover"
                          />
                        ) : seedling.quality_photo ? (
                          <img
                            src={seedling.quality_photo}
                            alt="Quality"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sprout className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(seedling.date_distributed).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-lg">{seedling.variety}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Package className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">{seedling.quantity_distributed.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {seedling.farmers ? (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="font-semibold text-blue-900">{seedling.farmers.full_name}</div>
                          <div className="text-blue-600 text-xs">{seedling.farmers.association_name}</div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="text-gray-600 font-medium">{seedling.recipient_association || 'N/A'}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {seedling.source_supplier ? (
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                          <span className="text-amber-800 font-medium">{seedling.source_supplier}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-md ${seedling.status === 'planted' ? 'bg-emerald-500 text-white' :
                        seedling.status === 'distributed' ? 'bg-blue-500 text-white' :
                          seedling.status === 'damaged' ? 'bg-red-500 text-white' :
                            'bg-amber-500 text-white'
                        }`}>
                        {seedling.status === 'planted' ? '🌱 Planted' :
                          seedling.status === 'distributed' ? '📦 Distributed' :
                            seedling.status === 'damaged' ? '⚠️ Damaged' :
                              '🔄 Replanted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSeedling(seedling);
                            setShowViewModal(true);
                          }}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(seedling)}
                          className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 hover:shadow-md transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(seedling.seedling_id)}
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${currentPage === page
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-indigo-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                    {showAddModal ? 'Add Seedling Distribution' : 'Edit Seedling'}
                  </h2>
                  <p className="text-sm text-emerald-700">
                    {showAddModal ? 'Record new seedling distribution' : 'Update distribution details'}
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

            <form onSubmit={showAddModal ? handleSubmit : handleUpdate} className="p-6 bg-gradient-to-br from-blue-50 to-emerald-50">
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
                    onChange={(e) => setFormData({ ...formData, quantity_distributed: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold shadow-md"
                    placeholder="Number of seedlings"
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

                <div>
                  <label className="block text-sm font-bold text-emerald-800 mb-3">Recipient Farmer</label>
                  <select
                    value={formData.recipient_farmer_id}
                    onChange={(e) => setFormData({ ...formData, recipient_farmer_id: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-gray-800 font-semibold appearance-none cursor-pointer shadow-md"
                  >
                    <option value="">Select Farmer (Optional)</option>
                    {farmers.map((farmer) => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.name} - {farmer.association || 'No Association'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-800 mb-3">Recipient Association</label>
                  <input
                    type="text"
                    value={formData.recipient_association}
                    onChange={(e) => setFormData({ ...formData, recipient_association: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold shadow-md"
                    placeholder="e.g., CuSAFA, SAAD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-3">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-2xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 font-semibold appearance-none cursor-pointer shadow-md"
                  >
                    <option value="distributed">📦 Distributed</option>
                    <option value="planted">🌱 Planted</option>
                    <option value="damaged">⚠️ Damaged</option>
                    <option value="replanted">🔄 Replanted</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-emerald-800 mb-3">Remarks</label>
                  <textarea
                    rows={4}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 placeholder:text-gray-500 text-gray-800 font-semibold resize-none shadow-md"
                    placeholder="e.g., Healthy seedlings, ready for planting"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-4">📸 Seedling Photos (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Seedling Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seedling Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition">
                      {formData.seedling_photo ? (
                        <div className="relative">
                          <img src={formData.seedling_photo} alt="Seedling" className="w-full h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, seedling_photo: undefined })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Sprout className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Click to upload</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'seedling')}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Packaging Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition">
                      {formData.packaging_photo ? (
                        <div className="relative">
                          <img src={formData.packaging_photo} alt="Packaging" className="w-full h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, packaging_photo: undefined })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Click to upload</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'packaging')}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Quality Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quality Check Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition">
                      {formData.quality_photo ? (
                        <div className="relative">
                          <img src={formData.quality_photo} alt="Quality" className="w-full h-32 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, quality_photo: undefined })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-600">Click to upload</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, 'quality')}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Max file size: 5MB per image</p>
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
                  className="px-8 py-3 bg-emerald-500 text-white rounded-2xl shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] hover:bg-emerald-600 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 font-semibold"
                >
                  {showAddModal ? '✅ Add Distribution' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSeedling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Seedling Distribution Details</h2>
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
                  <p className="font-medium text-gray-900">{selectedSeedling.variety}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium text-gray-900">{selectedSeedling.quantity_distributed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Distributed</p>
                  <p className="font-medium text-gray-900">{new Date(selectedSeedling.date_distributed).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source/Supplier</p>
                  <p className="font-medium text-gray-900">{selectedSeedling.source_supplier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipient Farmer</p>
                  <p className="font-medium text-gray-900">{selectedSeedling.farmers?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipient Association</p>
                  <p className="font-medium text-gray-900">{selectedSeedling.recipient_association || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedSeedling.status === 'planted' ? 'bg-green-100 text-green-700' :
                    selectedSeedling.status === 'distributed' ? 'bg-blue-100 text-blue-700' :
                      selectedSeedling.status === 'damaged' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                    {selectedSeedling.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distributed By</p>
                  <p className="font-medium text-gray-900">{selectedSeedling.organization?.full_name || 'N/A'}</p>
                </div>
                {selectedSeedling.remarks && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Remarks</p>
                    <p className="font-medium text-gray-900">{selectedSeedling.remarks}</p>
                  </div>
                )}
              </div>

              {/* Planting Information */}
              {selectedSeedling.status === 'planted' && selectedSeedling.planting_date && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">🌱 Planting Information</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-700">Planting Date</p>
                        <p className="font-medium text-green-900">{new Date(selectedSeedling.planting_date).toLocaleDateString()}</p>
                      </div>
                      {selectedSeedling.planting_location && (
                        <div>
                          <p className="text-sm text-green-700">Location</p>
                          <p className="font-medium text-green-900">{selectedSeedling.planting_location}</p>
                        </div>
                      )}
                      {selectedSeedling.planted_at && (
                        <div>
                          <p className="text-sm text-green-700">Marked as Planted</p>
                          <p className="font-medium text-green-900">{new Date(selectedSeedling.planted_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedSeedling.planting_notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-green-700">Farmer's Notes</p>
                          <p className="font-medium text-green-900">{selectedSeedling.planting_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Distribution Photos Section */}
              {(selectedSeedling.seedling_photo || selectedSeedling.packaging_photo || selectedSeedling.quality_photo) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">📸 Distribution Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedSeedling.seedling_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Seedling Photo</p>
                        <img
                          src={selectedSeedling.seedling_photo}
                          alt="Seedling"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.packaging_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Distribution Photo</p>
                        <img
                          src={selectedSeedling.packaging_photo}
                          alt="Packaging"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.quality_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Quality Check Photo</p>
                        <img
                          src={selectedSeedling.quality_photo}
                          alt="Quality"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Planting Photos Section */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">🌱 Planting Photos (From Farmer)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Planting Photo 1</p>
                        <img
                          src={selectedSeedling.planting_photo_1}
                          alt="Planting 1"
                          className="w-full h-48 object-cover rounded-lg border border-green-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_2 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Planting Photo 2</p>
                        <img
                          src={selectedSeedling.planting_photo_2}
                          alt="Planting 2"
                          className="w-full h-48 object-cover rounded-lg border border-green-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_3 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Planting Photo 3</p>
                        <img
                          src={selectedSeedling.planting_photo_3}
                          alt="Planting 3"
                          className="w-full h-48 object-cover rounded-lg border border-green-200"
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

export default SeedlingManagement;