/**
 * Monitoring System Types
 * Type definitions for field monitoring and farmer activity tracking
 */

export type FarmCondition = 'Healthy' | 'Needs Support' | 'Damaged';

export type GrowthStage = 
  | 'Land Preparation'
  | 'Planting'
  | 'Seedling'
  | 'Vegetative'
  | 'Mature'
  | 'Ready for Harvest'
  | 'Harvesting'
  | 'Post-Harvest';

export interface MonitoringRecord {
  monitoringId: string;
  dateOfVisit: string;
  monitoredBy: string;
  monitoredByRole?: string;
  farmerId: string;
  farmerName: string;
  associationName?: string;
  farmLocation?: string;
  farmCondition: FarmCondition;
  growthStage: GrowthStage;
  issuesObserved: string[];
  otherIssues?: string;
  actionsTaken: string;
  recommendations: string;
  nextMonitoringDate: string;
  photos?: string[];
  weatherCondition?: string;
  estimatedYield?: number;
  remarks?: string;
  status?: 'Ongoing' | 'Completed' | 'Done Monitor' | string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringFormData {
  dateOfVisit: string;
  monitoredBy: string;
  farmerId: string;
  farmerName: string;
  associationName?: string;
  farmLocation?: string;
  farmCondition: FarmCondition;
  growthStage: GrowthStage;
  issuesObserved: string[];
  otherIssues?: string;
  actionsTaken: string;
  recommendations: string;
  nextMonitoringDate: string;
  weatherCondition?: string;
  estimatedYield?: number;
  remarks?: string;
}

export interface MonitoringFilters {
  dateFrom?: string;
  dateTo?: string;
  farmerId?: string;
  farmCondition?: FarmCondition;
  growthStage?: GrowthStage;
  monitoredBy?: string;
}

export interface MonitoringStats {
  totalMonitoring: number;
  healthyFarms: number;
  needsSupport: number;
  damagedFarms: number;
  upcomingMonitoring: number;
  overdueMonitoring: number;
}

export const COMMON_ISSUES = [
  'No Issues',
  'Pest Infestation',
  'Disease',
  'Flood Damage',
  'Drought',
  'Low Yield',
  'Soil Issues',
  'Weed Overgrowth',
  'Nutrient Deficiency',
  'Poor Drainage',
  'Weather Damage',
  'Equipment Issues',
  'Labor Shortage',
  'Other'
] as const;

export const FARM_CONDITIONS: FarmCondition[] = ['Healthy', 'Needs Support', 'Damaged'];

export const GROWTH_STAGES: GrowthStage[] = [
  'Land Preparation',
  'Planting',
  'Seedling',
  'Vegetative',
  'Mature',
  'Ready for Harvest',
  'Harvesting',
  'Post-Harvest'
];
