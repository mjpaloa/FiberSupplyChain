/**
 * Monitoring Helper Functions
 * Utility functions for monitoring operations
 */

import type { MonitoringRecord, MonitoringStats, MonitoringFilters } from '../types/monitoring';

/**
 * Generate unique monitoring ID
 */
export const generateMonitoringId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MON-${timestamp}-${random}`;
};

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return LONG_DATE_FORMATTER.format(date);
};

/**
 * Format date for input field
 */
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Calculate days until next monitoring
 */
export const daysUntilMonitoring = (nextDate: string): number => {
  const next = new Date(nextDate);
  const today = new Date();
  
  // Normalize both dates to start of day for accurate comparison
  next.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = next.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if monitoring is overdue
 */
export const isOverdue = (nextDate: string | null | undefined): boolean => {
  if (!nextDate) return false;
  const days = daysUntilMonitoring(nextDate);
  return days < 0;
};

/**
 * Check if monitoring is upcoming (within 30 days and not overdue)
 */
export const isUpcoming = (nextDate: string | null | undefined): boolean => {
  if (!nextDate) return false;
  const days = daysUntilMonitoring(nextDate);
  return days >= 0;
};

/**
 * Get status badge color based on farm condition
 */
export const getConditionColor = (condition: string): string => {
  switch (condition) {
    case 'Healthy':
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'Needs Support':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'Damaged':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

/**
 * Get status badge color based on growth stage
 */
export const getGrowthStageColor = (stage: string): string => {
  switch (stage) {
    case 'Land Preparation':
    case 'Planting':
      return 'bg-blue-100 text-blue-700';
    case 'Seedling':
    case 'Vegetative':
      return 'bg-green-100 text-green-700';
    case 'Mature':
    case 'Ready for Harvest':
      return 'bg-purple-100 text-purple-700';
    case 'Harvesting':
    case 'Post-Harvest':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

/**
 * Calculate monitoring statistics
 * Uses latest record per farmer for upcoming/overdue counts
 */
export const calculateStats = (records: MonitoringRecord[]): MonitoringStats => {
  // Get latest Ongoing records per farmer for accurate upcoming/overdue counts
  const latestRecords = getLatestRecordPerFarmer(records);
  
  const stats: MonitoringStats = {
    totalMonitoring: records.length,
    healthyFarms: 0,
    needsSupport: 0,
    damagedFarms: 0,
    upcomingMonitoring: 0,
    overdueMonitoring: 0
  };

  // Count conditions from latest records only
  latestRecords.forEach(record => {
    if (record.farmCondition === 'Healthy') stats.healthyFarms++;
    if (record.farmCondition === 'Needs Support') stats.needsSupport++;
    if (record.farmCondition === 'Damaged') stats.damagedFarms++;
  });

  // Count upcoming and overdue from latest records only
  stats.upcomingMonitoring = getUpcomingMonitoring(records).length;
  stats.overdueMonitoring = getOverdueMonitoring(records).length;

  return stats;
};

/**
 * Filter monitoring records
 */
export const filterRecords = (
  records: MonitoringRecord[],
  filters: MonitoringFilters
): MonitoringRecord[] => {
  return records.filter(record => {
    // Date range filter
    if (filters.dateFrom && record.dateOfVisit < filters.dateFrom) return false;
    if (filters.dateTo && record.dateOfVisit > filters.dateTo) return false;

    // Farmer filter
    if (filters.farmerId && record.farmerId !== filters.farmerId) return false;

    // Condition filter
    if (filters.farmCondition && record.farmCondition !== filters.farmCondition) return false;

    // Growth stage filter
    if (filters.growthStage && record.growthStage !== filters.growthStage) return false;

    // Monitored by filter
    if (filters.monitoredBy && record.monitoredBy !== filters.monitoredBy) return false;

    return true;
  });
};

/**
 * Build a stable grouping key per farmer (falls back to normalized name if ID is missing)
 */
export const getFarmerKey = (record: MonitoringRecord): string => {
  if (record.farmerId) return String(record.farmerId);
  return `name:${(record.farmerName || '').trim().toLowerCase()}`;
};

/**
 * Deterministic comparator: newest visit date first, then createdAt, then monitoringId
 */
export const compareMonitoringRecordsDesc = (a: MonitoringRecord, b: MonitoringRecord): number => {
  const visitDiff = Date.parse(b.dateOfVisit) - Date.parse(a.dateOfVisit);
  if (!Number.isNaN(visitDiff) && visitDiff !== 0) return visitDiff;

  const createdDiff = Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
  if (!Number.isNaN(createdDiff) && createdDiff !== 0) return createdDiff;

  return (b.monitoringId || '').localeCompare(a.monitoringId || '');
};

/**
 * Sort records by date (newest first)
 */
export const sortByDate = (records: MonitoringRecord[]): MonitoringRecord[] => {
  return [...records].sort(compareMonitoringRecordsDesc);
};

export interface PartitionedMonitoringRecords {
  active: MonitoringRecord[];
  history: MonitoringRecord[];
  activeIds: Set<string>;
  byFarmer: Map<string, MonitoringRecord[]>;
}

/**
 * Partition monitoring records into current Active cycles vs History.
 * - A farmer's newest record is Active only if its status is 'Ongoing' (or unset).
 * - Earlier 'Ongoing' visits superseded by a newer visit, plus all 'Completed' and
 *   'Done Monitor' records, belong in History.
 */
export const partitionMonitoringRecords = (
  records: MonitoringRecord[]
): PartitionedMonitoringRecords => {
  const byFarmer = new Map<string, MonitoringRecord[]>();

  records.forEach((record) => {
    const key = getFarmerKey(record);
    const list = byFarmer.get(key);
    if (list) {
      list.push(record);
    } else {
      byFarmer.set(key, [record]);
    }
  });

  const active: MonitoringRecord[] = [];
  const history: MonitoringRecord[] = [];
  const activeIds = new Set<string>();

  byFarmer.forEach((farmerRecords, key) => {
    const sorted = [...farmerRecords].sort(compareMonitoringRecordsDesc);
    byFarmer.set(key, sorted);

    const [latest, ...older] = sorted;
    if (!latest) return;

    const latestStatus = latest.status || 'Ongoing';
    if (latestStatus === 'Ongoing') {
      active.push(latest);
      activeIds.add(latest.monitoringId);
      history.push(...older);
    } else {
      history.push(...sorted);
    }
  });

  return {
    active: sortByDate(active),
    history: sortByDate(history),
    activeIds,
    byFarmer,
  };
};

export const getActiveMonitoring = (records: MonitoringRecord[]): MonitoringRecord[] =>
  partitionMonitoringRecords(records).active;

export const getHistoryMonitoring = (records: MonitoringRecord[]): MonitoringRecord[] =>
  partitionMonitoringRecords(records).history;

export const getFarmerMonitoringHistory = (
  records: MonitoringRecord[],
  target: MonitoringRecord
): MonitoringRecord[] => {
  const targetKey = getFarmerKey(target);
  return records.filter((r) => getFarmerKey(r) === targetKey).sort(compareMonitoringRecordsDesc);
};

export const getHistoryRecordCategory = (
  record: MonitoringRecord
): 'completed' | 'done' | 'previous' => {
  if (record.status === 'Completed') return 'completed';
  if (record.status === 'Done Monitor') return 'done';
  return 'previous';
};

/**
 * Get latest active Ongoing monitoring record per farmer
 */
export const getLatestRecordPerFarmer = (records: MonitoringRecord[]): MonitoringRecord[] => {
  return getActiveMonitoring(records);
};

/**
 * Get upcoming monitoring records
 * Only shows the latest Ongoing record per farmer with future next_monitoring_date
 */
export const getUpcomingMonitoring = (records: MonitoringRecord[]): MonitoringRecord[] => {
  const latestRecords = getLatestRecordPerFarmer(records);

  return latestRecords
    .filter(record => {
      return Boolean(record.nextMonitoringDate) && isUpcoming(record.nextMonitoringDate);
    })
    .sort((a, b) => Date.parse(a.nextMonitoringDate) - Date.parse(b.nextMonitoringDate));
};

/**
 * Get overdue monitoring records
 * Only shows the latest Ongoing record per farmer that is overdue
 */
export const getOverdueMonitoring = (records: MonitoringRecord[]): MonitoringRecord[] => {
  const latestRecords = getLatestRecordPerFarmer(records);

  return latestRecords
    .filter(record => {
      return Boolean(record.nextMonitoringDate) && isOverdue(record.nextMonitoringDate);
    })
    .sort((a, b) => Date.parse(a.nextMonitoringDate) - Date.parse(b.nextMonitoringDate));
};

/**
 * Validate monitoring form data
 */
export const validateMonitoringForm = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.dateOfVisit) errors.push('Date of visit is required');
  if (!data.monitoredBy) errors.push('Monitored by is required');
  if (!data.farmerName) errors.push('Farmer name is required');
  if (!data.farmCondition) errors.push('Farm condition is required');
  if (!data.growthStage) errors.push('Growth stage is required');
  if (!data.actionsTaken || data.actionsTaken.trim() === '') {
    errors.push('Actions taken is required');
  }
  if (!data.recommendations || data.recommendations.trim() === '') {
    errors.push('Recommendations is required');
  }
  
  // Only require next monitoring date if status is not Completed (i.e., not a final visit)
  if (data.status !== 'Completed' && !data.nextMonitoringDate) {
    errors.push('Next monitoring date is required');
  }

  // Validate date logic only if next monitoring date is provided
  if (data.dateOfVisit && data.nextMonitoringDate) {
    const visitDate = new Date(data.dateOfVisit);
    const nextDate = new Date(data.nextMonitoringDate);
    if (nextDate <= visitDate) {
      errors.push('Next monitoring date must be after the visit date');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Export monitoring records to CSV
 */
export const exportToCSV = (records: MonitoringRecord[]): string => {
  const headers = [
    'Monitoring ID',
    'Date of Visit',
    'Monitored By',
    'Farmer Name',
    'Association',
    'Farm Condition',
    'Growth Stage',
    'Issues Observed',
    'Actions Taken',
    'Recommendations',
    'Next Monitoring Date'
  ];

  const rows = records.map(record => [
    record.monitoringId,
    formatDate(record.dateOfVisit),
    record.monitoredBy,
    record.farmerName,
    record.associationName || 'N/A',
    record.farmCondition,
    record.growthStage,
    record.issuesObserved.join('; '),
    record.actionsTaken,
    record.recommendations,
    formatDate(record.nextMonitoringDate)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (records: MonitoringRecord[], filename: string = 'monitoring-records.csv'): void => {
  const csv = exportToCSV(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
