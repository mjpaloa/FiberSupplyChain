import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Eye,
  Leaf,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  User,
  History
} from 'lucide-react';
import { MonitoringRecord } from '../../types/monitoring';
import {
  formatDate,
  daysUntilMonitoring,
  partitionMonitoringRecords,
  getHistoryRecordCategory,
  isUpcoming,
  isOverdue,
  sortByDate
} from '../../utils/monitoringHelpers';
import {
  KpiStrip,
  EditorialCard,
  StatusPill,
  EditorialCallout
} from '../Shared/EditorialUI';

/**
 * Farmer Monitoring View
 * Allows farmers to view their own monitoring records from MAO visits
 */

const FarmerMonitoringView: React.FC = () => {
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const TIMELINE_PAGE_SIZE = 20;
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineCondition, setTimelineCondition] = useState('');
  const [timelineVisibleCount, setTimelineVisibleCount] = useState(TIMELINE_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'overdue' | 'history' | 'all'>('active');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'done' | 'previous'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMyMonitoringRecords();
  }, []);

  useEffect(() => {
    if (!showTimelineModal && !selectedRecord) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedRecord) {
        setSelectedRecord(null);
      } else if (showTimelineModal) {
        setShowTimelineModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTimelineModal, selectedRecord]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, historyFilter]);

  useEffect(() => {
    setTimelineSearch('');
    setTimelineCondition('');
    setTimelineVisibleCount(TIMELINE_PAGE_SIZE);
  }, [showTimelineModal]);

  useEffect(() => {
    setTimelineVisibleCount(TIMELINE_PAGE_SIZE);
  }, [timelineSearch, timelineCondition]);

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

  // Calculate stats
  const stats = useMemo(() => {
    const upcoming = partition.active.filter(
      (r) => Boolean(r.nextMonitoringDate) && isUpcoming(r.nextMonitoringDate)
    ).length;

    const overdue = partition.active.filter(
      (r) => Boolean(r.nextMonitoringDate) && isOverdue(r.nextMonitoringDate)
    ).length;

    const sortedActive = sortByDate(partition.active);
    const nextVisitDate = sortedActive[0]?.nextMonitoringDate || null;

    const completed = records.filter(r => r.status === 'Completed').length;
    const doneMonitor = records.filter(r => r.status === 'Done Monitor').length;

    const healthyFarms = records.filter(r => r.farmCondition === 'Healthy').length;
    const needsSupport = records.filter(r => r.farmCondition === 'Needs Support').length;
    const damagedFarms = records.filter(r => r.farmCondition === 'Damaged').length;

    return {
      upcoming,
      nextVisitDate,
      overdue,
      completed,
      doneMonitor,
      healthyFarms,
      needsSupport,
      damagedFarms,
      activeCount: partition.active.length,
      historyCount: partition.history.length,
    };
  }, [records, partition.active, partition.history]);

  // Filter and search records
  const filteredRecords = useMemo(() => {
    let filtered = sortByDate(records);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.monitoredBy.toLowerCase().includes(q) ||
        record.monitoringId.toLowerCase().includes(q) ||
        record.farmCondition.toLowerCase().includes(q)
      );
    }

    if (activeTab === 'active') {
      filtered = filtered.filter(record => partition.activeIds.has(record.monitoringId));
    } else if (activeTab === 'upcoming') {
      filtered = filtered.filter(
        record =>
          partition.activeIds.has(record.monitoringId) &&
          Boolean(record.nextMonitoringDate) &&
          isUpcoming(record.nextMonitoringDate)
      );
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(
        record =>
          partition.activeIds.has(record.monitoringId) &&
          Boolean(record.nextMonitoringDate) &&
          isOverdue(record.nextMonitoringDate)
      );
    } else if (activeTab === 'history') {
      filtered = filtered.filter(record => !partition.activeIds.has(record.monitoringId));
      if (historyFilter !== 'all') {
        filtered = filtered.filter(record => getHistoryRecordCategory(record) === historyFilter);
      }
    }

    return filtered;
  }, [records, searchQuery, activeTab, historyFilter, partition.activeIds]);

  const timelineRecords = useMemo(() => sortByDate(records), [records]);

  const filteredTimelineRecords = useMemo(() => {
    const q = timelineSearch.trim().toLowerCase();
    if (!q && !timelineCondition) return timelineRecords;
    return timelineRecords.filter((visit) => {
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
  }, [timelineRecords, timelineSearch, timelineCondition]);

  const visibleTimelineRecords = useMemo(
    () => filteredTimelineRecords.slice(0, timelineVisibleCount),
    [filteredTimelineRecords, timelineVisibleCount]
  );

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
      <EditorialCard>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#047857] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">Loading monitoring records...</p>
          </div>
        </div>
      </EditorialCard>
    );
  }

  const getConditionTone = (condition: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (condition === 'Healthy') return 'success';
    if (condition === 'Needs Support') return 'warning';
    if (condition === 'Damaged') return 'danger';
    return 'neutral';
  };

  const tabs: Array<{
    id: 'active' | 'upcoming' | 'overdue' | 'history' | 'all';
    label: string;
    shortLabel: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    { id: 'active', label: 'Active', shortLabel: 'Active', count: stats.activeCount, icon: <Activity className="w-4 h-4" /> },
    { id: 'upcoming', label: 'Upcoming', shortLabel: 'Up', count: stats.upcoming, icon: <Calendar className="w-4 h-4" /> },
    { id: 'overdue', label: 'Overdue', shortLabel: 'Over', count: stats.overdue, icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'history', label: 'History', shortLabel: 'Hist', count: stats.historyCount, icon: <History className="w-4 h-4" /> },
    { id: 'all', label: 'All Records', shortLabel: 'All', count: records.length, icon: <CheckCircle className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <KpiStrip
        columns={5}
        items={[
          { label: 'Total Monitoring', value: records.length, subtext: 'Monitoring records' },
          { label: 'Healthy Farms', value: stats.healthyFarms, subtext: 'In good condition' },
          { label: 'Needs Support', value: stats.needsSupport, subtext: 'Requires attention' },
          { label: 'Damaged Farms', value: stats.damagedFarms, subtext: 'Critical condition' },
          { label: 'Upcoming Visits', value: stats.upcoming, subtext: 'Planned visits' }
        ]}
      />

      {/* Tab Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-colors ${
                  active
                    ? 'bg-[#E59500] text-gray-900 font-semibold'
                    : 'bg-white border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">
                  {tab.label} ({tab.count})
                </span>
                <span className="sm:hidden">
                  {tab.shortLabel} ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === 'history' && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
            {[
              { id: 'all', label: `All History (${historyCounts.all})` },
              { id: 'completed', label: `Completed (${historyCounts.completed})` },
              { id: 'done', label: `Done Monitor (${historyCounts.done})` },
              { id: 'previous', label: `Previous Visits (${historyCounts.previous})` }
            ].map((pill) => {
              const selected = historyFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setHistoryFilter(pill.id as 'all' | 'completed' | 'done' | 'previous');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${
                    selected
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

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by officer, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] placeholder:text-gray-400"
            />
          </div>
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTimelineModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <History className="w-4 h-4 text-[#047857]" />
              <span>Visit Timeline</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredRecords.length === 0 ? (
        activeTab === 'active' && partition.history.length > 0 && !searchQuery ? (
          <EditorialCard>
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-center">
                <History className="w-6 h-6 text-[#047857]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No active monitoring visits</h3>
              <p className="text-sm text-gray-500 mb-5">
                All completed and previous monitoring visits are saved in your Monitoring History.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
              >
                <History className="w-4 h-4 text-gray-500" />
                <span>View Monitoring History ({partition.history.length})</span>
              </button>
            </div>
          </EditorialCard>
        ) : (
          <EditorialCard>
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">No records found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
            </div>
          </EditorialCard>
        )
      ) : (
        <EditorialCard noPadding>
          {/* Pagination Top */}
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-gray-500">Show entries:</span>
                <div className="flex gap-1.5">
                  {[10, 20, 30].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        itemsPerPage === size
                          ? 'bg-[#E59500] text-gray-900'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500 tabular-nums">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 bg-white">
            {currentRecords.map((record) => {
              const isActiveRecord = partition.activeIds.has(record.monitoringId);
              const recordStatus = record.status || 'Ongoing';

              return (
                <div key={record.monitoringId} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-gray-800 truncate">{record.monitoringId}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums">{formatDate(record.dateOfVisit)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusPill tone={getConditionTone(record.farmCondition)}>
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
                      <span className="text-gray-500 block">Coordinator</span>
                      <span className="font-semibold text-gray-900 truncate block">{record.monitoredBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Growth Stage</span>
                      <span className="font-semibold text-gray-900">{record.growthStage}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Next Visit</span>
                      <span className="font-medium text-gray-800 tabular-nums">
                        {record.nextMonitoringDate ? formatDate(record.nextMonitoringDate) : 'No next visit'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(record)}
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

          {/* Desktop Table */}
          <div className="hidden md:block table-wrapper" tabIndex={0} role="region" aria-label="Farm monitoring records table">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Record ID</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Visit Date</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coordinator</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Condition</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Growth Stage</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Next Visit</th>
                  <th className="px-4 xl:px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {currentRecords.map((record) => {
                  const isActiveRecord = partition.activeIds.has(record.monitoringId);
                  const recordStatus = record.status || 'Ongoing';
                  return (
                  <tr key={record.monitoringId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-mono text-gray-700">{record.monitoringId}</span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 tabular-nums">{formatDate(record.dateOfVisit)}</span>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{record.monitoredBy}</span>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <StatusPill tone={getConditionTone(record.farmCondition)}>
                        {record.farmCondition}
                      </StatusPill>
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{record.growthStage}</span>
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
                          <div className="text-sm text-gray-700">{formatDate(record.nextMonitoringDate)}</div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">No next visit</div>
                        )
                      ) : record.nextMonitoringDate ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{formatDate(record.nextMonitoringDate)}</div>
                          <div
                            className={`text-xs tabular-nums ${
                              daysUntilMonitoring(record.nextMonitoringDate) >= 0
                                ? 'text-[#047857]'
                                : 'text-red-600'
                            }`}
                          >
                            {daysUntilMonitoring(record.nextMonitoringDate) >= 0
                              ? `in ${daysUntilMonitoring(record.nextMonitoringDate)} days`
                              : `${Math.abs(daysUntilMonitoring(record.nextMonitoringDate))} days overdue`}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 italic">No next visit</div>
                      )}
                    </td>
                    <td className="px-4 xl:px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                        title="View Details"
                        aria-label={`View details for ${record.monitoringId}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bottom */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex justify-center items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                {(() => {
                  const pages: Array<number | '...'> = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else if (currentPage <= 4) {
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

                  return pages.map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-xs font-bold">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${page}`}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${
                          currentPage === page
                            ? 'bg-[#E59500] text-gray-900'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  );
                })()}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </EditorialCard>
      )}

      {/* Farmer Visit Timeline Modal */}
      {showTimelineModal && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="farmer-visit-timeline-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTimelineModal(false);
          }}
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between gap-3">
              <div>
                <h2 id="farmer-visit-timeline-title" className="font-serif text-lg sm:text-xl font-bold text-gray-900">
                  Monitoring History Timeline
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  All {timelineRecords.length} farm monitoring {timelineRecords.length === 1 ? 'visit' : 'visits'} recorded by MAO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTimelineModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close monitoring timeline"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {timelineRecords.length > 5 && (
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
                    aria-label="Filter timeline by condition"
                    className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#047857]"
                  >
                    <option value="">All conditions</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Needs Support">Needs Support</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                  <span className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                    Showing {visibleTimelineRecords.length} of {filteredTimelineRecords.length}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 sm:p-6 overflow-y-auto bg-[#F8F9FA] flex-1">
              {visibleTimelineRecords.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No visits match your timeline filter.
                </div>
              ) : (
                <div className="relative pl-4 sm:pl-6 border-l border-gray-200 space-y-4">
                  {visibleTimelineRecords.map((visit, index) => {
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
                            <StatusPill tone={getConditionTone(visit.farmCondition)}>
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

              {timelineVisibleCount < filteredTimelineRecords.length && (
                <div className="pt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setTimelineVisibleCount((prev) => prev + TIMELINE_PAGE_SIZE)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold tabular-nums transition-colors"
                  >
                    Load more visits (showing {visibleTimelineRecords.length} of {filteredTimelineRecords.length})
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 z-10 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Complete Monitoring Report</h2>
                <p className="text-xs text-gray-500 mt-0.5">Full details of farm visit</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close monitoring report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Basic Information */}
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center text-base">
                  <Calendar className="w-4 h-4 mr-2 text-[#047857]" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Monitoring ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">{selectedRecord.monitoringId}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Date of Visit</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedRecord.dateOfVisit)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Monitored By (Coordinator)</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRecord.monitoredBy}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Farmer Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRecord.farmerName}</p>
                  </div>
                  {selectedRecord.associationName && (
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Association</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecord.associationName}</p>
                    </div>
                  )}
                  {selectedRecord.farmLocation && (
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-0.5 font-medium">Farm Location</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRecord.farmLocation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Farm Assessment */}
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center text-base">
                  <Leaf className="w-4 h-4 mr-2 text-[#047857]" />
                  Farm Assessment
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Farm Condition</p>
                    <StatusPill tone={getConditionTone(selectedRecord.farmCondition)}>
                      {selectedRecord.farmCondition}
                    </StatusPill>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Growth Stage</p>
                    <StatusPill tone="neutral">{selectedRecord.growthStage}</StatusPill>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Weather Condition</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRecord.weatherCondition || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Estimated Yield</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {selectedRecord.estimatedYield ? `${selectedRecord.estimatedYield} kg` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Issues Observed */}
                {selectedRecord.issuesObserved && selectedRecord.issuesObserved.length > 0 && (
                  <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-xs text-rose-800 font-bold uppercase tracking-wider mb-2.5 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      Issues Observed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.issuesObserved.map((issue, idx) => (
                        <StatusPill key={idx} tone="danger">
                          {issue}
                        </StatusPill>
                      ))}
                    </div>
                    {selectedRecord.otherIssues && (
                      <div className="mt-3 bg-white rounded-xl p-3 border border-rose-200">
                        <p className="text-xs text-rose-700 font-semibold mb-0.5">Other Issues</p>
                        <p className="text-sm text-gray-800">{selectedRecord.otherIssues}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions and Recommendations */}
              <div className="bg-[#EAF6F0] rounded-xl p-5 border border-[#CBEAD9]">
                <h3 className="font-serif font-bold text-gray-900 mb-4 flex items-center text-base">
                  <CheckCircle className="w-4 h-4 mr-2 text-[#047857]" />
                  Actions & Recommendations
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-[#CBEAD9]">
                    <p className="text-xs font-semibold text-[#047857] uppercase tracking-wider mb-1.5">Actions Taken</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.actionsTaken}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#CBEAD9]">
                    <p className="text-xs font-semibold text-[#047857] uppercase tracking-wider mb-1.5">Recommendations</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.recommendations}</p>
                  </div>
                  {selectedRecord.remarks && (
                    <div className="bg-white rounded-xl p-4 border border-[#CBEAD9]">
                      <p className="text-xs font-semibold text-[#047857] uppercase tracking-wider mb-1.5">Additional Remarks</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRecord.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Monitoring */}
              {selectedRecord.nextMonitoringDate && (
                <EditorialCallout
                  tone={daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0 ? 'amber' : 'rose'}
                  title="Next Monitoring Schedule:"
                  action={
                    <StatusPill tone={daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0 ? 'warning' : 'danger'}>
                      {daysUntilMonitoring(selectedRecord.nextMonitoringDate) >= 0
                        ? `In ${daysUntilMonitoring(selectedRecord.nextMonitoringDate)} days`
                        : `${Math.abs(daysUntilMonitoring(selectedRecord.nextMonitoringDate))} days overdue`}
                    </StatusPill>
                  }
                >
                  Scheduled for {formatDate(selectedRecord.nextMonitoringDate)}
                </EditorialCallout>
              )}

              {/* Timestamps */}
              {(selectedRecord.createdAt || selectedRecord.updatedAt) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="font-serif font-bold text-gray-800 mb-3 text-sm">Record Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {selectedRecord.createdAt && (
                      <div>
                        <p className="text-gray-500 mb-0.5">Created At</p>
                        <p className="text-gray-700 font-mono">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedRecord.updatedAt && (
                      <div>
                        <p className="text-gray-500 mb-0.5">Last Updated</p>
                        <p className="text-gray-700 font-mono">{new Date(selectedRecord.updatedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerMonitoringView;
