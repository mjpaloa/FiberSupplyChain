import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  X,
  User,
  Leaf,
  History
} from 'lucide-react';
import { MonitoringRecord, MonitoringFilters, MonitoringFormData } from '../../types/monitoring';
import {
  calculateStats,
  filterRecords,
  sortByDate,
  isUpcoming,
  isOverdue,
  formatDate,
  daysUntilMonitoring,
  downloadCSV,
  partitionMonitoringRecords,
  getFarmerKey,
  getHistoryRecordCategory
} from '../../utils/monitoringHelpers';
import MonitoringForm from './MonitoringForm';
import { KpiStrip, EditorialCard, SegmentedToggle, StatusPill } from '../Shared/EditorialUI';

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
  const [prefillFarmer, setPrefillFarmer] = useState<Partial<MonitoringFormData> | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);
  const [historyFarmerRecord, setHistoryFarmerRecord] = useState<MonitoringRecord | null>(null);
  const TIMELINE_PAGE_SIZE = 20;
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineCondition, setTimelineCondition] = useState('');
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(TIMELINE_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MonitoringFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'overdue' | 'history' | 'all'>('active');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'done' | 'previous'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const stats = useMemo(() => calculateStats(records), [records]);
  const partition = useMemo(() => partitionMonitoringRecords(records), [records]);

  const historyCounts = useMemo(() => {
    let completed = 0;
    let done = 0;
    let previous = 0;
    partition.history.forEach((record) => {
      const category = getHistoryRecordCategory(record);
      if (category === 'completed') completed += 1;
      else if (category === 'done') done += 1;
      else previous += 1;
    });
    return {
      all: partition.history.length,
      completed,
      done,
      previous,
    };
  }, [partition.history]);

  useEffect(() => {
    if (!historyFarmerRecord && !selectedRecord) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedRecord) {
        setSelectedRecord(null);
      } else if (historyFarmerRecord) {
        setHistoryFarmerRecord(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [historyFarmerRecord, selectedRecord]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, activeTab, historyFilter]);

  useEffect(() => {
    setTimelineSearch('');
    setTimelineCondition('');
    setTimelineVisibleCount(TIMELINE_PAGE_SIZE);
  }, [historyFarmerRecord]);

  useEffect(() => {
    setTimelineVisibleCount(TIMELINE_PAGE_SIZE);
  }, [timelineSearch, timelineCondition]);

  const filteredRecords = useMemo(() => {
    let filtered = filterRecords(records, filters);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        (record.farmerName?.toLowerCase() || '').includes(q) ||
        (record.monitoredBy?.toLowerCase() || '').includes(q) ||
        (record.monitoringId?.toLowerCase() || '').includes(q)
      );
    }

    if (activeTab === 'active') {
      return sortByDate(filtered.filter(record => partition.activeIds.has(record.monitoringId)));
    }

    if (activeTab === 'upcoming') {
      return filtered
        .filter(
          record =>
            partition.activeIds.has(record.monitoringId) &&
            Boolean(record.nextMonitoringDate) &&
            isUpcoming(record.nextMonitoringDate)
        )
        .sort(
          (a, b) =>
            new Date(a.nextMonitoringDate).getTime() - new Date(b.nextMonitoringDate).getTime()
        );
    }

    if (activeTab === 'overdue') {
      return filtered
        .filter(
          record =>
            partition.activeIds.has(record.monitoringId) &&
            Boolean(record.nextMonitoringDate) &&
            isOverdue(record.nextMonitoringDate)
        )
        .sort(
          (a, b) =>
            new Date(a.nextMonitoringDate).getTime() - new Date(b.nextMonitoringDate).getTime()
        );
    }

    if (activeTab === 'history') {
      let historyRecords = filtered.filter(
        record => !partition.activeIds.has(record.monitoringId)
      );
      if (historyFilter !== 'all') {
        historyRecords = historyRecords.filter(
          record => getHistoryRecordCategory(record) === historyFilter
        );
      }
      return sortByDate(historyRecords);
    }

    return sortByDate(filtered);
  }, [records, filters, searchQuery, activeTab, historyFilter, partition.activeIds]);

  const farmerTimeline = useMemo(
    () =>
      historyFarmerRecord
        ? partition.byFarmer.get(getFarmerKey(historyFarmerRecord)) || []
        : [],
    [partition.byFarmer, historyFarmerRecord]
  );

  const filteredFarmerTimeline = useMemo(() => {
    const q = timelineSearch.trim().toLowerCase();
    if (!q && !timelineCondition) return farmerTimeline;
    return farmerTimeline.filter((visit) => {
      if (timelineCondition && visit.farmCondition !== timelineCondition) return false;
      if (!q) return true;
      return (
        (visit.monitoringId?.toLowerCase() || '').includes(q) ||
        (visit.monitoredBy?.toLowerCase() || '').includes(q) ||
        (visit.growthStage?.toLowerCase() || '').includes(q) ||
        (visit.actionsTaken?.toLowerCase() || '').includes(q) ||
        (visit.recommendations?.toLowerCase() || '').includes(q)
      );
    });
  }, [farmerTimeline, timelineSearch, timelineCondition]);

  const visibleFarmerTimeline = useMemo(
    () => filteredFarmerTimeline.slice(0, timelineVisibleCount),
    [filteredFarmerTimeline, timelineVisibleCount]
  );

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
    setPrefillFarmer(null);
  };

  const hasActiveSearchOrFilters = Boolean(
    searchQuery ||
    filters.farmCondition ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.farmerId ||
    filters.growthStage ||
    filters.monitoredBy
  );

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={5}
        items={[
          {
            label: 'Total Monitoring',
            value: stats.totalMonitoring.toLocaleString(),
            subtext: 'Monitoring records',
          },
          {
            label: 'Healthy Farms',
            value: stats.healthyFarms.toLocaleString(),
            subtext: 'In good condition',
          },
          {
            label: 'Needs Support',
            value: stats.needsSupport.toLocaleString(),
            accentSubtext: stats.needsSupport > 0 ? 'Requires attention' : undefined,
            subtext: stats.needsSupport === 0 ? 'None flagged' : undefined,
          },
          {
            label: 'Damaged Farms',
            value: stats.damagedFarms.toLocaleString(),
            accentSubtext: stats.damagedFarms > 0 ? 'Critical condition' : undefined,
            subtext: stats.damagedFarms === 0 ? 'None reported' : undefined,
          },
          {
            label: 'Upcoming Visits',
            value: stats.upcomingMonitoring.toLocaleString(),
            subtext: 'Planned visits',
          },
        ]}
      />

      {/* Search, Filters & Actions */}
      <EditorialCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by farmer name, monitoring ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border ${
                showFilters
                  ? 'bg-[#EAF6F0] border-[#047857] text-[#047857]'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline">Filters</span>
            </button>
            <button
              type="button"
              onClick={() => downloadCSV(filteredRecords)}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden md:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => { setEditingRecord(null); setPrefillFarmer(null); setShowForm(true); }}
              className="px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Add New</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Farm Condition</label>
              <select
                value={filters.farmCondition || ''}
                onChange={(e) => setFilters({ ...filters, farmCondition: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              >
                <option value="">All Conditions</option>
                <option value="Healthy">Healthy</option>
                <option value="Needs Support">Needs Support</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>
        )}
      </EditorialCard>

      {/* Filter Tabs */}
      <div className="space-y-3">
        <div className="overflow-x-auto pb-1">
          <SegmentedToggle
            variant="amber"
            size="md"
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val as 'active' | 'upcoming' | 'overdue' | 'history' | 'all');
              setCurrentPage(1);
            }}
            options={[
              { value: 'active', label: `Active (${partition.active.length})` },
              { value: 'upcoming', label: `Upcoming (${stats.upcomingMonitoring})` },
              { value: 'overdue', label: `Overdue (${stats.overdueMonitoring})` },
              { value: 'history', label: `History (${partition.history.length})` },
              { value: 'all', label: `All Records (${records.length})` },
            ]}
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All History (${historyCounts.all})` },
              { id: 'completed', label: `Completed (${historyCounts.completed})` },
              { id: 'done', label: `Done Monitor (${historyCounts.done})` },
              { id: 'previous', label: `Previous Visits (${historyCounts.previous})` },
            ].map((pill) => {
              const isSelected = historyFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setHistoryFilter(pill.id as 'all' | 'completed' | 'done' | 'previous');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${
                    isSelected
                      ? 'bg-[#E59500] text-gray-900'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Monitoring Records Table */}
      {filteredRecords.length === 0 ? (
        activeTab === 'active' && partition.history.length > 0 && !hasActiveSearchOrFilters ? (
          <EditorialCard className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-[#EAF6F0] border border-[#CBEAD9] rounded-full flex items-center justify-center">
              <History className="w-6 h-6 text-[#047857]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No active monitoring visits</h3>
            <p className="text-sm text-gray-500 mb-6">
              All existing records are saved in Monitoring History. Start a new visit or review past history.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setEditingRecord(null); setPrefillFarmer(null); setShowForm(true); }}
                className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Start Monitoring</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                <History className="w-4 h-4 text-gray-500" />
                <span>View History ({partition.history.length})</span>
              </button>
            </div>
          </EditorialCard>
        ) : (
          <EditorialCard className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No monitoring records found</h3>
            <p className="text-sm text-gray-500 mb-6">Start by creating your first monitoring record</p>
            <button
              type="button"
              onClick={() => { setEditingRecord(null); setPrefillFarmer(null); setShowForm(true); }}
              className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create First Record
            </button>
          </EditorialCard>
        )
      ) : (
        <EditorialCard noPadding>
          {/* Entries Controls */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-medium text-gray-600">Show entries:</span>
                <div className="flex gap-1.5">
                  {[10, 20, 30].map((size) => (
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
              <div className="text-xs text-gray-600 tabular-nums">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} entries
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {currentRecords.map((record) => {
              const isActiveRecord = partition.activeIds.has(record.monitoringId);
              const recordStatus = record.status || 'Ongoing';
              const farmerVisits = partition.byFarmer.get(getFarmerKey(record)) || [];

              return (
                <div key={record.monitoringId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{record.farmerName}</p>
                      {record.associationName && (
                        <p className="text-xs text-gray-600 truncate">{record.associationName}</p>
                      )}
                      <p className="text-[11px] font-mono text-gray-400 tabular-nums mt-0.5 truncate">
                        {record.monitoringId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusPill
                        tone={
                          record.farmCondition === 'Healthy'
                            ? 'success'
                            : record.farmCondition === 'Needs Support'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {record.farmCondition}
                      </StatusPill>
                      {recordStatus === 'Completed' ? (
                        <StatusPill tone="success">Completed</StatusPill>
                      ) : recordStatus === 'Done Monitor' ? (
                        <StatusPill tone="neutral">Done Monitor</StatusPill>
                      ) : !isActiveRecord ? (
                        <StatusPill tone="neutral">Previous Visit</StatusPill>
                      ) : (
                        <StatusPill tone="info">Ongoing</StatusPill>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs bg-[#F8F9FA] rounded-xl p-3 border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">Visit Date</span>
                      <span className="font-semibold text-gray-900 tabular-nums">{formatDate(record.dateOfVisit)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Growth Stage</span>
                      <span className="font-semibold text-gray-900">{record.growthStage}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Coordinator</span>
                      <span className="font-medium text-gray-800 truncate block">{record.monitoredBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Next Visit</span>
                      <span className="font-medium text-gray-800 tabular-nums">
                        {record.nextMonitoringDate ? formatDate(record.nextMonitoringDate) : 'No next visit'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    {farmerVisits.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setHistoryFarmerRecord(record)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-gray-500" />
                        <span>{farmerVisits.length} visits · History</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400">1 recorded visit</span>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                        aria-label={`View details for ${record.monitoringId}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setHistoryFarmerRecord(record)}
                        className="p-2 text-gray-600 hover:text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                        title="View Farmer History"
                        aria-label={`View monitoring history for ${record.farmerName}`}
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {recordStatus !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => { setPrefillFarmer(null); setEditingRecord(record); setShowForm(true); }}
                          className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                          aria-label={`Edit ${record.monitoringId}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
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
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        aria-label={`Delete ${record.monitoringId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block table-wrapper" tabIndex={0} role="region" aria-label="Field monitoring records table">
            <table className="w-full">
              <thead className="bg-[#FAFAFA] border-b border-gray-200">
                <tr>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Farmer</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Visit Date</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coordinator</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Condition</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Growth Stage</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Next Visit</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentRecords.map((record) => {
                  const isActiveRecord = partition.activeIds.has(record.monitoringId);
                  const recordStatus = record.status || 'Ongoing';
                  const farmerVisits = partition.byFarmer.get(getFarmerKey(record)) || [];

                  return (
                  <tr key={record.monitoringId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 xl:px-5 py-3.5">
                      <div className="min-w-[150px]">
                        <div className="font-semibold text-gray-900 text-sm">{record.farmerName}</div>
                        {record.associationName && (
                          <div className="text-gray-600 text-xs">{record.associationName}</div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-gray-400 text-xs font-mono tabular-nums">{record.monitoringId}</span>
                          {farmerVisits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setHistoryFarmerRecord(record)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition-colors"
                            >
                              <History className="w-3 h-3 text-gray-500" />
                              <span>{farmerVisits.length} visits · History</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 tabular-nums">
                        {formatDate(record.dateOfVisit)}
                      </div>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.monitoredBy}</div>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <StatusPill
                        tone={
                          record.farmCondition === 'Healthy'
                            ? 'success'
                            : record.farmCondition === 'Needs Support'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {record.farmCondition}
                      </StatusPill>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{record.growthStage}</div>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      {recordStatus === 'Completed' ? (
                        <StatusPill tone="success">Completed</StatusPill>
                      ) : recordStatus === 'Done Monitor' ? (
                        <StatusPill tone="neutral">Done Monitor</StatusPill>
                      ) : !isActiveRecord ? (
                        <StatusPill tone="neutral">Previous Visit</StatusPill>
                      ) : (
                        <StatusPill tone="info">Ongoing</StatusPill>
                      )}
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap tabular-nums">
                      {!isActiveRecord || recordStatus === 'Done Monitor' || recordStatus === 'Completed' ? (
                        record.nextMonitoringDate ? (
                          <div className="text-sm text-gray-600">{formatDate(record.nextMonitoringDate)}</div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No next visit</div>
                        )
                      ) : record.nextMonitoringDate ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(record.nextMonitoringDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({daysUntilMonitoring(record.nextMonitoringDate) >= 0
                              ? `in ${daysUntilMonitoring(record.nextMonitoringDate)} days`
                              : `${Math.abs(daysUntilMonitoring(record.nextMonitoringDate))} days overdue`})
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          No next visit
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                          aria-label={`View details for ${record.monitoringId}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setHistoryFarmerRecord(record)}
                          className="p-2 text-gray-600 hover:text-[#047857] hover:bg-[#EAF6F0] rounded-lg transition-colors"
                          title="View Farmer History"
                          aria-label={`View monitoring history for ${record.farmerName}`}
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {recordStatus !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => { setPrefillFarmer(null); setEditingRecord(record); setShowForm(true); }}
                            className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                            aria-label={`Edit ${record.monitoringId}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          aria-label={`Delete ${record.monitoringId}`}
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
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-wrap justify-center items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>

                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) pages.push(i);
                      pages.push('...');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1);
                      pages.push('...');
                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push('...');
                      pages.push(currentPage - 1);
                      pages.push(currentPage);
                      pages.push(currentPage + 1);
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-xs font-bold">...</span>
                    ) : (
                      <button
                        type="button"
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${currentPage === page
                          ? 'bg-[#E59500] text-gray-900'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ));
                })()}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </EditorialCard>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 overflow-y-auto">
          <MonitoringForm
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingRecord(null); setPrefillFarmer(null); }}
            initialData={editingRecord || prefillFarmer || undefined}
            farmersList={farmersList}
            currentOfficer={currentOfficer}
          />
        </div>
      )}

      {/* Per-Farmer Monitoring History Timeline Modal */}
      {historyFarmerRecord && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="farmer-history-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryFarmerRecord(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="farmer-history-title" className="font-serif text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {historyFarmerRecord.farmerName} — Monitoring History
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {historyFarmerRecord.associationName ? `${historyFarmerRecord.associationName} · ` : ''}
                  {farmerTimeline.length} recorded {farmerTimeline.length === 1 ? 'visit' : 'visits'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = historyFarmerRecord;
                    setHistoryFarmerRecord(null);
                    setEditingRecord(null);
                    setPrefillFarmer({
                      farmerId: target.farmerId,
                      farmerName: target.farmerName,
                      associationName: target.associationName,
                      farmLocation: target.farmLocation,
                    });
                    setShowForm(true);
                  }}
                  className="px-3.5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFarmerRecord(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close farmer history"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {farmerTimeline.length > 5 && (
              <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    placeholder="Filter visits by ID, coordinator, notes..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <select
                    value={timelineCondition}
                    onChange={(e) => setTimelineCondition(e.target.value)}
                    aria-label="Filter history by farm condition"
                    className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#047857]"
                  >
                    <option value="">All conditions</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Needs Support">Needs Support</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                  <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                    Showing {visibleFarmerTimeline.length} of {filteredFarmerTimeline.length}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 overflow-y-auto bg-[#F8F9FA] flex-1">
              {visibleFarmerTimeline.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No visits match your timeline filter.
                </div>
              ) : (
                <div className="relative pl-4 sm:pl-6 border-l border-gray-200 space-y-4">
                  {visibleFarmerTimeline.map((visit, index) => {
                    const isActiveVisit = partition.activeIds.has(visit.monitoringId);
                    const visitStatus = visit.status || 'Ongoing';
                    return (
                      <div
                        key={visit.monitoringId}
                        className="relative bg-white rounded-xl border border-gray-200 p-4 space-y-3"
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute -left-[21px] sm:-left-[29px] top-5 w-2.5 h-2.5 rounded-full ring-4 ring-[#F8F9FA] ${
                            isActiveVisit ? 'bg-[#047857]' : 'bg-gray-400'
                          }`}
                        />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                {formatDate(visit.dateOfVisit)}
                              </span>
                              {index === 0 && !timelineSearch && !timelineCondition && (
                                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-gray-400 tabular-nums mt-0.5">
                              {visit.monitoringId} · By {visit.monitoredBy}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusPill
                              tone={
                                visit.farmCondition === 'Healthy'
                                  ? 'success'
                                  : visit.farmCondition === 'Needs Support'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {visit.farmCondition}
                            </StatusPill>
                            {visitStatus === 'Completed' ? (
                              <StatusPill tone="success">Completed</StatusPill>
                            ) : visitStatus === 'Done Monitor' ? (
                              <StatusPill tone="neutral">Done Monitor</StatusPill>
                            ) : isActiveVisit ? (
                              <StatusPill tone="info">Active</StatusPill>
                            ) : (
                              <StatusPill tone="neutral">Previous Visit</StatusPill>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8F9FA] rounded-lg p-3 border border-gray-100">
                          <div>
                            <span className="text-gray-500">Growth Stage: </span>
                            <span className="font-semibold text-gray-900">{visit.growthStage}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Next Visit: </span>
                            <span className="font-semibold text-gray-900 tabular-nums">
                              {visit.nextMonitoringDate ? formatDate(visit.nextMonitoringDate) : 'No next visit'}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600 space-y-1">
                          {visit.actionsTaken && (
                            <p className="line-clamp-2">
                              <span className="font-semibold text-gray-800">Actions: </span>
                              {visit.actionsTaken}
                            </p>
                          )}
                          {visit.recommendations && (
                            <p className="line-clamp-2">
                              <span className="font-semibold text-gray-800">Recommendations: </span>
                              {visit.recommendations}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(visit)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {timelineVisibleCount < filteredFarmerTimeline.length && (
                <div className="pt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setTimelineVisibleCount((prev) => prev + TIMELINE_PAGE_SIZE)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold tabular-nums transition-colors"
                  >
                    Load more visits (showing {visibleFarmerTimeline.length} of {filteredFarmerTimeline.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-900">Monitoring Details</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Complete monitoring record information</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Information */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#047857]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monitoring ID</p>
                    <p className="font-semibold text-gray-900 font-mono text-xs bg-white px-3 py-2 rounded-lg border border-gray-200 tabular-nums">{selectedRecord.monitoringId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date of Visit</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{formatDate(selectedRecord.dateOfVisit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Monitored By (Coordinator)</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.monitoredBy}</p>
                  </div>
                  {selectedRecord.monitoredByRole && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Coordinator Role</p>
                      <p className="font-semibold text-sm text-gray-900">{selectedRecord.monitoredByRole}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farmer Information */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#047857]" />
                  Farmer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Farmer Name</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.farmerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Association</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.associationName || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Farm Location</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.farmLocation || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Farm Assessment */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#047857]" />
                  Farm Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Farm Condition</p>
                    <StatusPill
                      tone={
                        selectedRecord.farmCondition === 'Healthy'
                          ? 'success'
                          : selectedRecord.farmCondition === 'Needs Support'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {selectedRecord.farmCondition}
                    </StatusPill>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Growth Stage</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.growthStage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Weather Condition</p>
                    <p className="font-semibold text-sm text-gray-900">{selectedRecord.weatherCondition || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated Yield</p>
                    <p className="font-semibold text-sm text-gray-900 tabular-nums">{selectedRecord.estimatedYield ? `${selectedRecord.estimatedYield} kg` : 'N/A'}</p>
                  </div>
                </div>

                {/* Issues Observed */}
                {selectedRecord.issuesObserved && selectedRecord.issuesObserved.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Issues Observed</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.issuesObserved.map((issue, idx) => (
                        <StatusPill key={idx} tone="danger">{issue}</StatusPill>
                      ))}
                    </div>
                    {selectedRecord.otherIssues && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Other Issues</p>
                        <p className="text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">{selectedRecord.otherIssues}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions and Recommendations */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4">
                  Actions & Recommendations
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 font-semibold">Actions Taken</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-xl border border-gray-200">{selectedRecord.actionsTaken}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 font-semibold">Recommendations</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-xl border border-gray-200">{selectedRecord.recommendations}</p>
                  </div>
                  {selectedRecord.remarks && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5 font-semibold">Additional Remarks</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white px-4 py-3 rounded-xl border border-gray-200">{selectedRecord.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Monitoring */}
              <div className="bg-[#F8F9FA] rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#047857]" />
                  Next Monitoring Schedule
                </h3>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Next Monitoring Date</p>
                  <p className="text-base font-bold text-gray-900 tabular-nums">
                    {formatDate(selectedRecord.nextMonitoringDate)}
                    {selectedRecord.nextMonitoringDate && (
                      <span className="ml-2 text-xs font-medium text-gray-500">
                        ({daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0
                          ? `in ${daysUntilMonitoring(selectedRecord.nextMonitoringDate)} days`
                          : `${Math.abs(daysUntilMonitoring(selectedRecord.nextMonitoringDate))} days overdue`})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif text-sm font-bold text-gray-900 mb-3">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {selectedRecord.createdAt && (
                    <div>
                      <p className="text-gray-500 mb-1">Created At</p>
                      <p className="text-gray-700 font-mono tabular-nums">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedRecord.updatedAt && (
                    <div>
                      <p className="text-gray-500 mb-1">Last Updated</p>
                      <p className="text-gray-700 font-mono tabular-nums">{new Date(selectedRecord.updatedAt).toLocaleString()}</p>
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
