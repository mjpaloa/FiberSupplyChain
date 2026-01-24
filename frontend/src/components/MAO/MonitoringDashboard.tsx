import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  X,
  User,
  Leaf
} from 'lucide-react';
import { MonitoringRecord, MonitoringFilters } from '../../types/monitoring';
import {
  calculateStats,
  filterRecords,
  sortByDate,
  getUpcomingMonitoring,
  getOverdueMonitoring,
  formatDate,
  daysUntilMonitoring,
  getConditionColor,
  downloadCSV
} from '../../utils/monitoringHelpers';
import MonitoringForm from './MonitoringForm';

interface MonitoringDashboardProps {
  records: MonitoringRecord[];
  onAddRecord: (data: any) => Promise<void>;
  onUpdateRecord: (id: string, data: any) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  farmersList?: Array<{ id: string; name: string; association?: string }>;
  currentOfficer?: { name: string; role: string } | null;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  farmersList = [],
  currentOfficer = null
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonitoringRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MonitoringFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue' | 'completed' | 'done'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(() => calculateStats(records), [records]);

  const filteredRecords = useMemo(() => {
    console.log('📊 MAO Dashboard: Starting filter with', records.length, 'records');
    let filtered = filterRecords(records, filters);

    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.monitoredBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.monitoringId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'upcoming') {
      console.log('🔍 MAO: Filtering for upcoming...');
      filtered = getUpcomingMonitoring(filtered);
      console.log(`✅ MAO: Upcoming filtered records: ${filtered.length}`);
    } else if (activeTab === 'overdue') {
      console.log('🔍 MAO: Filtering for overdue...');
      filtered = getOverdueMonitoring(filtered);
      console.log(`✅ MAO: Overdue filtered records: ${filtered.length}`);
    } else if (activeTab === 'completed') {
      console.log('🔍 MAO: Filtering for completed...');
      filtered = filtered.filter(record => (record as any).status === 'Completed');
      filtered = sortByDate(filtered);
      console.log(`✅ MAO: Completed filtered records: ${filtered.length}`);
    } else if (activeTab === 'done') {
      console.log('🔍 MAO: Filtering for done monitoring...');
      filtered = filtered.filter(record => (record as any).status === 'Done Monitor');
      filtered = sortByDate(filtered);
      console.log(`✅ MAO: Done monitoring filtered records: ${filtered.length}`);
    } else {
      filtered = sortByDate(filtered);
    }

    return filtered;
  }, [records, filters, searchQuery, activeTab]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleFormSubmit = async (data: any) => {
    if (editingRecord) {
      await onUpdateRecord(editingRecord.monitoringId, data);
    } else {
      await onAddRecord(data);
    }
    setShowForm(false);
    setEditingRecord(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Modern Stats Cards with Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
        {/* Total Monitoring Card */}
        <div className="group relative bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">Total Monitoring</p>
            <p className="text-4xl font-bold text-white mb-1">{stats.totalMonitoring}</p>
            <p className="text-xs text-white/60">Monitoring records</p>
          </div>
        </div>

        {/* Healthy Farms Card */}
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Active
              </span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Healthy Farms</p>
            <p className="text-4xl font-bold text-white mb-1">{stats.healthyFarms}</p>
            <p className="text-xs text-white/70">In good condition</p>
          </div>
        </div>

        {/* Needs Support Card */}
        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Support
              </span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Needs Support</p>
            <p className="text-4xl font-bold text-white mb-1">{stats.needsSupport}</p>
            <p className="text-xs text-white/70">Requires attention</p>
          </div>
        </div>

        {/* Damaged Farms Card - NEW */}
        <div className="group relative bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <X className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-semibold">
                Critical
              </span>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Damaged Farms</p>
            <p className="text-4xl font-bold text-white mb-1">{stats.damagedFarms}</p>
            <p className="text-xs text-white/70">Critical condition</p>
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm font-medium mb-1">Upcoming Visits</p>
            <p className="text-4xl font-bold text-white mb-1">{stats.upcomingMonitoring}</p>
            <p className="text-xs text-white/70">Planned visits</p>
          </div>
        </div>
      </div>

      {/* Modern Filters with Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by farmer name, monitoring ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline">Filters</span>
          </button>
          <button
            onClick={() => downloadCSV(filteredRecords)}
            className="px-4 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">Export</span>
          </button>
          <button
            onClick={() => { setEditingRecord(null); setShowForm(true); }}
            className="px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Add New</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Farm Condition</label>
              <select
                value={filters.farmCondition || ''}
                onChange={(e) => setFilters({ ...filters, farmCondition: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              >
                <option value="">All Conditions</option>
                <option value="Healthy">Healthy</option>
                <option value="Needs Support">Needs Support</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modern Tabs with Glassmorphism */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'all'
            ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-xl shadow-slate-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-slate-100'
            }`}>
            <Activity className="w-5 h-5" />
          </div>
          <span>All Records ({records.length})</span>
          {activeTab === 'all' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'upcoming'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-white/20' : 'bg-emerald-50 group-hover:bg-emerald-100'
            }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span>Upcoming ({stats.upcomingMonitoring})</span>
          {activeTab === 'upcoming' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'overdue'
            ? 'bg-gradient-to-r from-amber-400 to-orange-600 text-white shadow-xl shadow-amber-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'overdue' ? 'bg-white/20' : 'bg-amber-50 group-hover:bg-amber-100'
            }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <span>Overdue ({stats.overdueMonitoring})</span>
          {activeTab === 'overdue' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'completed'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'completed' ? 'bg-white/20' : 'bg-green-50 group-hover:bg-green-100'
            }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <span>Completed ({records.filter(r => (r as any).status === 'Completed').length})</span>
          {activeTab === 'completed' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('done')}
          className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 text-sm sm:text-base ${activeTab === 'done'
            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl shadow-purple-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-2 rounded-lg transition-colors ${activeTab === 'done' ? 'bg-white/20' : 'bg-purple-50 group-hover:bg-purple-100'
            }`}>
            <Activity className="w-5 h-5" />
          </div>
          <span>Done ({records.filter(r => (r as any).status === 'Done Monitor').length})</span>
          {activeTab === 'done' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
      </div>

      {/* Compact Table with Pagination */}
      {filteredRecords.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 border-2 border-gray-200 rounded-3xl p-12 text-center shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No monitoring records found</h3>
          <p className="text-gray-600 mb-6">Start by creating your first monitoring record</p>
          <button
            onClick={() => { setEditingRecord(null); setShowForm(true); }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white rounded-2xl hover:shadow-lg transition-all font-semibold border-2 border-emerald-300"
          >
            Create First Record
          </button>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
          {/* Pagination Controls */}
          <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Show entries:</span>
                <div className="flex gap-2">
                  {[10, 20, 30].map((size) => (
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} entries
              </div>
            </div>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Farmer
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Visit Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Coordinator</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Condition
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Growth Stage</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Status
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Next Visit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-100">
                {currentRecords.map((record, index) => (
                  <tr key={record.monitoringId} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-blue-900 text-sm">{record.farmerName}</div>
                        {record.associationName && (
                          <div className="text-emerald-600 text-xs font-medium">{record.associationName}</div>
                        )}
                        <div className="text-purple-600 text-xs font-mono">{record.monitoringId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDate(record.dateOfVisit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.monitoredBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${getConditionColor(record.farmCondition)}`}>
                        {record.farmCondition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.growthStage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(record as any).status === 'Completed' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md bg-green-100 text-green-800 border border-green-300">
                          ✓ Completed
                        </span>
                      ) : (record as any).status === 'Done Monitor' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md bg-gray-100 text-gray-600 border border-gray-300">
                          ✓ Done Monitor
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-md bg-blue-100 text-blue-800 border border-blue-300">
                          🔄 Ongoing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(record as any).status === 'Done Monitor' ? (
                        // Show date only, no countdown for Done Monitor
                        record.nextMonitoringDate ? (
                          <div className="text-sm text-gray-600">{formatDate(record.nextMonitoringDate)}</div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No next visit</div>
                        )
                      ) : record.nextMonitoringDate ? (
                        // Show date + countdown for Ongoing/Completed
                        <>
                          <div className="text-sm font-semibold text-indigo-900">
                            {formatDate(record.nextMonitoringDate)}
                          </div>
                          <div className="text-xs text-indigo-600">
                            ({daysUntilMonitoring(record.nextMonitoringDate) >= 0
                              ? `in ${daysUntilMonitoring(record.nextMonitoringDate)} days`
                              : `${Math.abs(daysUntilMonitoring(record.nextMonitoringDate))} days overdue`})
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No next visit
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* View Button - Always show */}
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 hover:shadow-md transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button - Only for Ongoing records */}
                        {(record as any).status !== 'Completed' && (
                          <button
                            onClick={() => { setEditingRecord(record); setShowForm(true); }}
                            className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 hover:shadow-md transition-all duration-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button - Always show */}
                        <button
                          onClick={async () => {
                            if (confirm('⚠️ Delete this monitoring record?\n\nThis action cannot be undone.')) {
                              try {
                                await onDeleteRecord(record.monitoringId);
                                alert('✅ Monitoring record deleted successfully!');
                              } catch (error) {
                                console.error('Failed to delete:', error);
                              }
                            }
                          }}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <MonitoringForm
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
            initialData={editingRecord || undefined}
            farmersList={farmersList}
            currentOfficer={currentOfficer}
          />
        </div>
      )}

      {/* View Details Modal - Complete Information */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Monitoring Details</h2>
                  <p className="text-emerald-100 text-sm mt-1">Complete monitoring record information</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monitoring ID</p>
                    <p className="font-semibold text-gray-800 font-mono text-sm bg-white px-3 py-2 rounded border">{selectedRecord.monitoringId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date of Visit</p>
                    <p className="font-semibold text-gray-800">{formatDate(selectedRecord.dateOfVisit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Monitored By (Coordinator)</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.monitoredBy}</p>
                  </div>
                  {selectedRecord.monitoredByRole && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Coordinator Role</p>
                      <p className="font-semibold text-gray-800">{selectedRecord.monitoredByRole}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farmer Information */}
              <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Farmer Name</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.farmerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Association</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.associationName || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Farm Location</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.farmLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Farm Assessment */}
              <div className="bg-green-50 rounded-xl p-5 border-2 border-green-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-green-600" />
                  Farm Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Farm Condition</p>
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${getConditionColor(selectedRecord.farmCondition)}`}>
                      {selectedRecord.farmCondition}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Growth Stage</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.growthStage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Weather Condition</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.weatherCondition || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estimated Yield</p>
                    <p className="font-semibold text-gray-800">{selectedRecord.estimatedYield ? `${selectedRecord.estimatedYield} kg` : 'N/A'}</p>
                  </div>
                </div>

                {/* Issues Observed */}
                {selectedRecord.issuesObserved && selectedRecord.issuesObserved.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-gray-500 mb-2">Issues Observed</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.issuesObserved.map((issue, idx) => (
                        <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg font-medium border border-red-200">
                          {issue}
                        </span>
                      ))}
                    </div>
                    {selectedRecord.otherIssues && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 mb-1">Other Issues</p>
                        <p className="text-gray-700 bg-white px-3 py-2 rounded border">{selectedRecord.otherIssues}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions and Recommendations */}
              <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">

                  Actions & Recommendations
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-semibold">Actions Taken</p>
                    <p className="text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-lg border">{selectedRecord.actionsTaken}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2 font-semibold">Recommendations</p>
                    <p className="text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-lg border">{selectedRecord.recommendations}</p>
                  </div>
                  {selectedRecord.remarks && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2 font-semibold">Additional Remarks</p>
                      <p className="text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-lg border">{selectedRecord.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Monitoring */}
              <div className="bg-indigo-50 rounded-xl p-5 border-2 border-indigo-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  Next Monitoring Schedule
                </h3>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Next Monitoring Date</p>
                  <p className="text-lg font-bold text-indigo-900">
                    {formatDate(selectedRecord.nextMonitoringDate)}
                    <span className="ml-3 text-sm font-normal text-indigo-700">
                      ({daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0
                        ? `in ${daysUntilMonitoring(selectedRecord.nextMonitoringDate)} days`
                        : `${Math.abs(daysUntilMonitoring(selectedRecord.nextMonitoringDate))} days overdue`})
                    </span>
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-xl p-5 border">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {selectedRecord.createdAt && (
                    <div>
                      <p className="text-gray-500 mb-1">Created At</p>
                      <p className="text-gray-700 font-mono">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedRecord.updatedAt && (
                    <div>
                      <p className="text-gray-500 mb-1">Last Updated</p>
                      <p className="text-gray-700 font-mono">{new Date(selectedRecord.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
