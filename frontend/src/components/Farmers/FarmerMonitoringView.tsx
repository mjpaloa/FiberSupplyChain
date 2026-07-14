import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Eye,
  Leaf,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  X,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { MonitoringRecord } from '../../types/monitoring';
import {
  formatDate,
  daysUntilMonitoring,
  getConditionColor,
  getGrowthStageColor
} from '../../utils/monitoringHelpers';

/**
 * Farmer Monitoring View
 * Allows farmers to view their own monitoring records from MAO visits
 */

const FarmerMonitoringView: React.FC = () => {
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue' | 'completed' | 'done'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMyMonitoringRecords();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    console.log('📊 Calculating stats from records:', records.length);

    // Count all Ongoing records with upcoming dates (future dates)
    const upcoming = records.filter(r => {
      const status = (r as any).status;
      if (status !== 'Ongoing') return false;
      if (!r.nextMonitoringDate) return false;

      const days = daysUntilMonitoring(r.nextMonitoringDate);
      const isUpcoming = days >= 0;
      console.log(`Record ${r.monitoringId}: status=${status}, nextDate=${r.nextMonitoringDate}, days=${days}, isUpcoming=${isUpcoming}`);
      return isUpcoming;
    }).length;

    // Count all Ongoing records with overdue dates (past dates)
    const overdue = records.filter(r => {
      const status = (r as any).status;
      if (status !== 'Ongoing') return false;
      if (!r.nextMonitoringDate) return false;

      const days = daysUntilMonitoring(r.nextMonitoringDate);
      return days < 0;
    }).length;

    // Get the latest Ongoing record's next visit date for display
    const ongoingRecords = records.filter(r => (r as any).status === 'Ongoing');
    const sortedOngoing = [...ongoingRecords].sort((a, b) =>
      new Date(b.dateOfVisit).getTime() - new Date(a.dateOfVisit).getTime()
    );
    const nextVisitDate = sortedOngoing[0]?.nextMonitoringDate || null;

    const completed = records.filter(r => (r as any).status === 'Completed').length;
    const doneMonitor = records.filter(r => (r as any).status === 'Done Monitor').length;

    // Count healthy, needs support, and damaged farms separately
    const healthyFarms = records.filter(r =>
      r.farmCondition === 'Healthy'
    ).length;
    const needsSupport = records.filter(r =>
      r.farmCondition === 'Needs Support'
    ).length;
    const damagedFarms = records.filter(r =>
      r.farmCondition === 'Damaged'
    ).length;

    console.log('📈 Stats calculated:', { upcoming, overdue, completed, doneMonitor, healthyFarms, needsSupport, damagedFarms, nextVisitDate });
    return { upcoming, nextVisitDate, overdue, completed, doneMonitor, healthyFarms, needsSupport, damagedFarms };
  }, [records]);

  // Filter and search records
  const filteredRecords = useMemo(() => {
    let filtered = [...records].sort((a, b) =>
      new Date(b.dateOfVisit).getTime() - new Date(a.dateOfVisit).getTime()
    );

    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.monitoredBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.monitoringId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.farmCondition.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'upcoming') {
      console.log('🔍 Filtering for upcoming tab...');
      // Show all Ongoing records with upcoming next_monitoring_date
      filtered = filtered.filter(record => {
        const status = (record as any).status;
        console.log(`Checking record ${record.monitoringId}: status=${status}, nextDate=${record.nextMonitoringDate}`);

        if (status !== 'Ongoing') {
          console.log(`  ❌ Not Ongoing`);
          return false;
        }
        if (!record.nextMonitoringDate) {
          console.log(`  ❌ No next monitoring date`);
          return false;
        }

        const days = daysUntilMonitoring(record.nextMonitoringDate);
        const isUpcoming = days >= 0;
        console.log(`  Days until monitoring: ${days}, isUpcoming: ${isUpcoming}`);
        return isUpcoming;
      });
      console.log(`✅ Upcoming filtered records: ${filtered.length}`);
    } else if (activeTab === 'overdue') {
      console.log('🔍 Filtering for overdue tab...');
      // Show all Ongoing records with overdue next_monitoring_date
      filtered = filtered.filter(record => {
        const status = (record as any).status;
        if (status !== 'Ongoing') return false;
        if (!record.nextMonitoringDate) return false;

        const days = daysUntilMonitoring(record.nextMonitoringDate);
        return days < 0;
      });
      console.log(`✅ Overdue filtered records: ${filtered.length}`);
    } else if (activeTab === 'completed') {
      console.log('🔍 Filtering for completed tab...');
      filtered = filtered.filter(r => (r as any).status === 'Completed');
      console.log(`✅ Completed filtered records: ${filtered.length}`);
    } else if (activeTab === 'done') {
      console.log('🔍 Filtering for done monitor tab...');
      filtered = filtered.filter(r => (r as any).status === 'Done Monitor');
      console.log(`✅ Done monitor filtered records: ${filtered.length}`);
    }

    return filtered;
  }, [records, searchQuery, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchMyMonitoringRecords = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/farmers/monitoring', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring records');
      }

      const data = await response.json();
      console.log('Farmer monitoring records loaded:', data);

      // Map API response to MonitoringRecord format
      const mappedRecords: MonitoringRecord[] = data.records?.map((record: any) => ({
        monitoringId: record.monitoring_id,
        dateOfVisit: record.date_of_visit,
        monitoredBy: record.monitored_by,
        monitoredByRole: record.monitored_by_role,
        farmerId: record.farmer_id,
        farmerName: record.farmer_name,
        associationName: record.association_name,
        farmLocation: record.farm_location,
        farmCondition: record.farm_condition,
        growthStage: record.growth_stage,
        issuesObserved: record.issues_observed || [],
        otherIssues: record.other_issues,
        actionsTaken: record.actions_taken,
        recommendations: record.recommendations,
        nextMonitoringDate: record.next_monitoring_date,
        weatherCondition: record.weather_condition,
        estimatedYield: record.estimated_yield,
        remarks: record.remarks,
        photoUrls: record.photo_urls,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        status: record.status || 'Ongoing' // Add status field
      } as any)) || [];

      setRecords(mappedRecords);
    } catch (error) {
      console.error('Error fetching monitoring records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Match MAO Dashboard Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
        {/* Total Monitoring Card */}
        <div className="relative bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-xs font-medium mb-1">Total Monitoring</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{records.length}</p>
            <p className="text-[10px] text-white/60">Monitoring records</p>
          </div>
        </div>

        {/* Healthy Farms Card */}
        <div className="group relative bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-102 sm:hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-semibold">
                Active
              </span>
            </div>
            <p className="text-white/90 text-xs font-medium mb-1">Healthy Farms</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.healthyFarms}</p>
            <p className="text-[10px] text-white/70">In good condition</p>
          </div>
        </div>

        {/* Needs Support Card */}
        <div className="group relative bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-102 sm:hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-semibold">
                Support
              </span>
            </div>
            <p className="text-white/90 text-xs font-medium mb-1">Needs Support</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.needsSupport}</p>
            <p className="text-[10px] text-white/70">Requires attention</p>
          </div>
        </div>

        {/* Damaged Farms Card */}
        <div className="group relative bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-102 sm:hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <X className="w-5 h-5 text-white" />
              </div>
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-semibold">
                Critical
              </span>
            </div>
            <p className="text-white/90 text-xs font-medium mb-1">Damaged Farms</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.damagedFarms}</p>
            <p className="text-[10px] text-white/70">Critical condition</p>
          </div>
        </div>

        {/* Upcoming Visits Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-102 sm:hover:scale-105 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-xs font-medium mb-1">Upcoming Visits</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{stats.upcoming}</p>
            <p className="text-[10px] text-white/70">Planned visits</p>
          </div>
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${activeTab === 'all'
            ? 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-xl shadow-slate-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-slate-100'
            }`}>
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden sm:inline">All Records ({records.length})</span>
          <span className="sm:hidden">All ({records.length})</span>
          {activeTab === 'all' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('upcoming'); setCurrentPage(1); }}
          className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${activeTab === 'upcoming'
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-white/20' : 'bg-emerald-50 group-hover:bg-emerald-100'
            }`}>
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden sm:inline">Upcoming ({stats.upcoming})</span>
          <span className="sm:hidden">Up ({stats.upcoming})</span>
          {activeTab === 'upcoming' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('overdue'); setCurrentPage(1); }}
          className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${activeTab === 'overdue'
            ? 'bg-gradient-to-r from-amber-400 to-orange-600 text-white shadow-xl shadow-amber-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-colors ${activeTab === 'overdue' ? 'bg-white/20' : 'bg-amber-50 group-hover:bg-amber-100'
            }`}>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden sm:inline">Overdue ({stats.overdue})</span>
          <span className="sm:hidden">Over ({stats.overdue})</span>
          {activeTab === 'overdue' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('done'); setCurrentPage(1); }}
          className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${activeTab === 'done'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-colors ${activeTab === 'done' ? 'bg-white/20' : 'bg-green-50 group-hover:bg-green-100'
            }`}>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden sm:inline">Done ({stats.doneMonitor})</span>
          <span className="sm:hidden">Done ({stats.doneMonitor})</span>
          {activeTab === 'done' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
          className={`group relative flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 lg:py-4 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${activeTab === 'completed'
            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl shadow-purple-500/50 scale-105'
            : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-lg border border-gray-200'
            }`}
        >
          <div className={`p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg transition-colors ${activeTab === 'completed' ? 'bg-white/20' : 'bg-purple-50 group-hover:bg-purple-100'
            }`}>
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="hidden sm:inline">Complete ({stats.completed})</span>
          <span className="sm:hidden">Done ({stats.completed})</span>
          {activeTab === 'completed' && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by officer, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 md:p-20 text-center">
          <Calendar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No records found</h3>
          <p className="text-sm sm:text-base text-gray-500">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg overflow-hidden">
          {/* Pagination Top */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Show entries:</span>
                <div className="flex gap-1 sm:gap-2">
                  {[10, 20, 30].map((size) => (
                    <button
                      key={size}
                      onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
                      className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${itemsPerPage === size
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-emerald-50'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-emerald-100 to-teal-100">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Farmer</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Visit Date</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Coordinator</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Condition</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Growth Stage</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Next Visit</th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.map((record, index) => (
                  <tr key={record.monitoringId} className={`hover:bg-emerald-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="text-sm font-mono text-gray-500">{record.monitoringId}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">{formatDate(record.dateOfVisit)}</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{record.monitoredBy}</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${getConditionColor(record.farmCondition)}`}>
                        {record.farmCondition}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{record.growthStage}</div>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {(record as any).status === 'Completed' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      ) : (record as any).status === 'Done Monitor' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                          ✓ Done Monitor
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
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
                          <div className="text-sm font-semibold text-gray-900">{formatDate(record.nextMonitoringDate)}</div>
                          <div className="text-xs text-emerald-600">
                            ({daysUntilMonitoring(record.nextMonitoringDate) >= 0
                              ? `in ${daysUntilMonitoring(record.nextMonitoringDate)} days`
                              : `${Math.abs(daysUntilMonitoring(record.nextMonitoringDate))} days overdue`})
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No next visit</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bottom */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === page
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Details Modal - Complete Information */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Complete Monitoring Report</h2>
                  <p className="text-emerald-100 text-sm">Full details of farm visit</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Monitoring ID</p>
                    <p className="font-mono text-sm font-bold text-gray-900">{selectedRecord.monitoringId}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Date of Visit</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedRecord.dateOfVisit)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Monitored By (Coordinator)</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRecord.monitoredBy}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Farmer Name</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRecord.farmerName}</p>
                  </div>
                  {selectedRecord.associationName && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">Association</p>
                      <p className="text-sm font-bold text-gray-900">{selectedRecord.associationName}</p>
                    </div>
                  )}
                  {selectedRecord.farmLocation && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 font-semibold">Farm Location</p>
                      <p className="text-sm font-bold text-gray-900">{selectedRecord.farmLocation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farm Assessment */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                  <Leaf className="w-5 h-5 mr-2 text-green-600" />
                  Farm Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">Farm Condition</p>
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${getConditionColor(selectedRecord.farmCondition)}`}>
                      {selectedRecord.farmCondition}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">Growth Stage</p>
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${getGrowthStageColor(selectedRecord.growthStage)}`}>
                      {selectedRecord.growthStage}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Weather Condition</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRecord.weatherCondition || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-1 font-semibold">Estimated Yield</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRecord.estimatedYield ? `${selectedRecord.estimatedYield} kg` : 'N/A'}</p>
                  </div>
                </div>

                {/* Issues Observed */}
                {selectedRecord.issuesObserved && selectedRecord.issuesObserved.length > 0 && (
                  <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-bold mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Issues Observed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.issuesObserved.map((issue, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-lg border border-red-300">
                          {issue}
                        </span>
                      ))}
                    </div>
                    {selectedRecord.otherIssues && (
                      <div className="mt-3 bg-white rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-red-700 font-semibold mb-1">Other Issues</p>
                        <p className="text-sm text-gray-800">{selectedRecord.otherIssues}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions and Recommendations */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-5 shadow-lg">
                <h3 className="font-bold text-white mb-4 flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Actions & Recommendations
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-emerald-700 font-bold mb-2">Actions Taken</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.actionsTaken}</p>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm text-emerald-700 font-bold mb-2">Recommendations</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.recommendations}</p>
                  </div>
                  {selectedRecord.remarks && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-sm text-emerald-700 font-bold mb-2">Additional Remarks</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Monitoring */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 shadow-lg">
                <h3 className="font-bold text-white mb-3 flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Next Monitoring Schedule
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100 mb-1">Scheduled Date</p>
                    <p className="text-2xl font-bold text-white">{formatDate(selectedRecord.nextMonitoringDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-bold">
                      {daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0
                        ? `In ${daysUntilMonitoring(selectedRecord.nextMonitoringDate)} days`
                        : `${Math.abs(daysUntilMonitoring(selectedRecord.nextMonitoringDate))} days overdue`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {(selectedRecord.createdAt || selectedRecord.updatedAt) && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm">Record Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
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
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerMonitoringView;
