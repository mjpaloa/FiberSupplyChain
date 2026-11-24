import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiGet, apiPut } from '../../utils/apiClient';
import {
  LayoutDashboard,
  Sprout,
  Package,
  Calendar,
  User,
  LogOut,
  X,
  Settings,
  FileText,
  Eye,
  CheckCircle,
  Camera,
  Mail,
  Users as UsersIcon,
  Search,
  Filter,
  Truck,
  Lock,
  Bell
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import {
  EditorialShell,
  EditorialNavItem,
  KpiStrip,
  EditorialCard,
  SegmentedToggle,
  StatusPill,
  KeepAlivePages,
  useCacheState,
  EDITORIAL_CHART
} from '../Shared/EditorialUI';

import FarmerMonitoringView from './FarmerMonitoringView';
import FarmerHarvestView from './FarmerHarvestView';
import SalesReportForm from './SalesReportForm';
import SalesReportsList from './SalesReportsList';
import FarmerDeliveryTracking from './FarmerDeliveryTracking';
import FarmerProfile from './FarmerProfile';
import EditFarmerProfile from './EditFarmerProfile';
import FarmerChangePassword from './FarmerChangePassword';

interface FarmerDashboardProps {
  onLogout: () => void;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'seedlings' | 'harvest' | 'harvest-submit' | 'monitoring' | 'sales-report' | 'track-deliveries' | 'analytics' | 'profile'>('dashboard');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [seedlings, setSeedlings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlantingModal, setShowPlantingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSeedling, setSelectedSeedling] = useState<any>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [plantingData, setPlantingData] = useState({
    planting_date: new Date().toISOString().split('T')[0],
    planting_quantity: '' as string | number,
    damaged_quantity: '' as string | number,
    planting_location: '',
    planting_notes: '',
    planting_photo_1: '',
    planting_photo_2: '',
    planting_photo_3: ''
  });

  // Profile states
  const [isEditMode, setIsEditMode] = useState(false);
  const [farmerData, setFarmerData] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Seedlings filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'distributed' | 'planted' | 'damaged'>('all');
  const [filteredSeedlings, setFilteredSeedlings] = useState<any[]>([]);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile navigation states
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Analytics state - separate view modes for each chart
  const [distributionViewMode, setDistributionViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [productionViewMode, setProductionViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [revenueViewMode, setRevenueViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [productionSelectedYear, setProductionSelectedYear] = useState(new Date().getFullYear());
  const [revenueSelectedYear, setRevenueSelectedYear] = useState(new Date().getFullYear());
  const [farmHealthData, setFarmHealthData] = useState<any[]>([]);
  const [productionData, setProductionData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [harvestStats, setHarvestStats] = useState({ totalFiberKg: 0, totalRevenue: 0 });
  const [hoveredPieSegment, setHoveredPieSegment] = useState<number | null>(null);
  const [farmStatusData, setFarmStatusData] = useState([
    { status: 'Healthy', percentage: 0, count: 0, color: { id: 'green', start: EDITORIAL_CHART.colors.emerald, end: EDITORIAL_CHART.colors.emerald } },
    { status: 'Action Needed', percentage: 0, count: 0, color: { id: 'yellow', start: EDITORIAL_CHART.colors.amber, end: EDITORIAL_CHART.colors.amber } },
    { status: 'Needs Support', percentage: 0, count: 0, color: { id: 'red', start: EDITORIAL_CHART.colors.danger, end: EDITORIAL_CHART.colors.danger } }
  ]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingProductionChart, setLoadingProductionChart] = useState(false);
  const [loadingRevenueChart, setLoadingRevenueChart] = useState(false);
  const [latestFarmStatus, setLatestFarmStatus] = useState<{ condition: string; date: string } | null>(null);
  const [latestDeliveryStatus, setLatestDeliveryStatus] = useState<{ status: string; count: number } | null>(null);

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const { version, manualTick } = useCacheState();
  const loadedSeedlingsVersionRef = useRef(-1);
  const loadedAnalyticsKeyRef = useRef('');
  const lastMetaVersionRef = useRef(version);
  const prevManualTickRef = useRef(manualTick);
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    const manualChanged = prevManualTickRef.current !== manualTick;
    if (manualChanged) {
      prevManualTickRef.current = manualTick;
      loadedSeedlingsVersionRef.current = -1;
      loadedAnalyticsKeyRef.current = '';
    }

    if (
      (currentPage === 'seedlings' || currentPage === 'dashboard') &&
      loadedSeedlingsVersionRef.current !== version
    ) {
      loadedSeedlingsVersionRef.current = version;
      fetchMySeedlings();
    }

    if (prevPageRef.current === 'profile' && currentPage !== 'profile') {
      setShowChangePassword(false);
    }
    prevPageRef.current = currentPage;

    if (lastMetaVersionRef.current !== version || manualChanged) {
      lastMetaVersionRef.current = version;
      fetchFarmerProfile();
      fetchNotifications();
      fetchLatestFarmStatus();
      fetchLatestDeliveryStatus();
    }
  }, [currentPage, version, manualTick]);

  // Load profile photo on mount
  useEffect(() => {
    fetchFarmerProfile();
    fetchNotifications();
    fetchLatestFarmStatus();
    fetchLatestDeliveryStatus();
  }, []);

  // Fetch notifications for farmer
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const notifs: any[] = [];

      // Fetch recent seedling distributions
      try {
        const seedlingsRes = await apiGet('https://fibersupplychain.onrender.com/api/association-seedlings/farmer/received');

        if (seedlingsRes.ok) {
          const seedlingsData = await seedlingsRes.json();

          // Add seedling notifications (last 5)
          if (Array.isArray(seedlingsData)) {
            seedlingsData.slice(0, 5).forEach((seedling: any) => {
              notifs.push({
                id: `seedling-${seedling.distribution_id}`,
                type: 'seedling',
                title: 'New Seedlings Received',
                message: `${seedling.quantity_distributed} ${seedling.variety} seedlings distributed to you`,
                date: seedling.distribution_date,
                icon: '🌱',
                color: 'green'
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch seedling notifications');
      }

      // Fetch recent monitoring records (using correct endpoint)
      try {
        const monitoringRes = await apiGet('https://fibersupplychain.onrender.com/api/farmers/monitoring');

        if (monitoringRes.ok) {
          const monitoringData = await monitoringRes.json();

          // Add monitoring notifications (last 5)
          if (Array.isArray(monitoringData)) {
            monitoringData.slice(0, 5).forEach((record: any) => {
              notifs.push({
                id: `monitoring-${record.monitoring_id}`,
                type: 'monitoring',
                title: 'Farm Monitoring Visit',
                message: `Your farm was monitored. Condition: ${record.farmCondition}`,
                date: record.dateOfVisit,
                icon: '📋',
                color: 'blue'
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch monitoring notifications');
      }

      // Sort by date (newest first)
      notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNotifications(notifs.slice(0, 10)); // Keep only 10 most recent
      setUnreadCount(notifs.length > 0 ? Math.min(notifs.length, 5) : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Generate analytics data once per cache version / view / year filter
  useEffect(() => {
    if (currentPage !== 'dashboard') return;
    const analyticsKey = `${version}:${manualTick}:${distributionViewMode}:${selectedYear}`;
    if (loadedAnalyticsKeyRef.current === analyticsKey) return;
    loadedAnalyticsKeyRef.current = analyticsKey;
    generateAnalyticsData();
    generateFarmStatusData();
  }, [currentPage, version, manualTick, distributionViewMode, selectedYear]);

  // Separate effect for Fiber Production chart
  useEffect(() => {
    if (currentPage === 'dashboard') {
      regenerateProductionData();
    }
  }, [productionViewMode, productionSelectedYear]);

  // Separate effect for Sales Revenue chart
  useEffect(() => {
    if (currentPage === 'dashboard') {
      regenerateRevenueData();
    }
  }, [revenueViewMode, revenueSelectedYear]);

  // Calculate seedling statistics
  const seedlingStats = useMemo(() => {
    const totalBatches = seedlings.length;
    const totalUnits = seedlings.reduce((sum, s) => sum + (s.quantity_distributed || 0), 0);

    // Planted units should come from planted_quantity field, but fallback to quantity_distributed if null for old records
    const plantedUnits = seedlings.reduce((sum, s) => {
      if (s.status === 'planted') {
        const val = (s.planted_quantity !== null && s.planted_quantity !== undefined)
          ? Number(s.planted_quantity)
          : Number(s.quantity_distributed) || 0;
        return sum + val;
      }
      return sum;
    }, 0);

    const damagedUnits = seedlings.reduce((sum, s) => sum + (Number(s.damaged_quantity) || 0), 0);
    const plantedBatches = seedlings.filter(s => s.status === 'planted').length;

    const notPlantedSeedlings = seedlings.filter(s => s.status !== 'planted');
    const notPlantedBatches = notPlantedSeedlings.length;

    // Remaining units to be planted: only those NOT marked as planted
    const notPlantedUnits = seedlings.reduce((sum, s) => {
      if (s.status !== 'planted') {
        return sum + (Number(s.quantity_distributed) || 0);
      }
      return sum;
    }, 0);

    const stats = {
      totalBatches,
      totalUnits,
      plantedBatches,
      plantedUnits,
      damagedUnits,
      notPlantedBatches,
      notPlantedUnits
    };

    console.log("📊 COMPUTED SEEDLING STATS:", stats);
    return stats;
  }, [seedlings]);

  // Filter seedlings based on search and status
  useEffect(() => {
    let filtered = seedlings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seedling =>
        seedling.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seedling.source_supplier && seedling.source_supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (seedling.remarks && seedling.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(seedling => seedling.status === statusFilter);
    }

    setFilteredSeedlings(filtered);
    setCurrentPageNum(1); // Reset to first page when filters change
  }, [seedlings, searchTerm, statusFilter]);

  const fetchMySeedlings = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/association-seedlings/farmer/received');
      const data = await response.json();
      console.log('📦 Fetched seedlings:', data);
      // Debug: Check photo fields
      if (data && data.length > 0) {
        console.log('🖼️ First seedling photo data:', {
          seedling_photo: data[0].seedling_photo,
          packaging_photo: data[0].packaging_photo,
          quality_photo: data[0].quality_photo,
          hasPhoto: !!(data[0].seedling_photo || data[0].packaging_photo || data[0].quality_photo)
        });
      }
      setSeedlings(data);
      generateAnnouncements(data);
    } catch (error) {
      console.error('Error fetching seedlings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnnouncements = (seedlingData: any[]) => {
    const recentDistributions = seedlingData
      .sort((a, b) => new Date(b.date_distributed).getTime() - new Date(a.date_distributed).getTime())
      .slice(0, 5);

    const newAnnouncements = recentDistributions.map(seedling => {
      const daysAgo = Math.floor((new Date().getTime() - new Date(seedling.date_distributed).getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

      return {
        id: seedling.distribution_id,
        title: '🌱 New Seedling Distribution',
        message: `You received ${seedling.quantity_distributed} ${seedling.variety} seedlings from ${user?.associationName || 'your association'}.`,
        date: timeText,
        type: 'distribution',
        color: 'blue'
      };
    });

    setAnnouncements(newAnnouncements);
  };

  const generateAnalyticsData = async () => {
    setLoadingCharts(true);
    try {
      console.log('🔄 Starting analytics generation...');
      console.log('📦 Current seedlings count:', seedlings.length);

      const healthData = generateFarmHealthData(productionViewMode);
      setFarmHealthData(healthData);

      // Fetch harvest stats first and WAIT for it
      await fetchHarvestStats();

      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate data for both Fiber Production and Sales Revenue charts
      const production = await generateRevenueData(productionViewMode);
      const revenue = await generateRevenueData(revenueViewMode);
      console.log('📊 Production data loaded:', production);
      console.log('📊 Revenue data loaded:', revenue);

      // Calculate totals before setting state
      const totalRev = revenue.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0);
      const totalFiber = revenue.reduce((sum: number, item: any) => sum + (item.fiberKg || 0), 0);
      console.log('💰 Totals calculated - Revenue:', totalRev, 'Fiber:', totalFiber, 'kg');

      setProductionData(production);
      setRevenueData(revenue);
      console.log('✅ Analytics data generation completed');
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchHarvestStats = async () => {
    try {
      const response = await apiGet('/api/harvests/farmer/harvests');

      if (!response.ok) {
        console.log('❌ Could not fetch harvests, status:', response.status);
        return;
      }

      const data = await response.json();
      const harvests = data.harvests || data; // Handle both response formats
      console.log('🌾 All harvests fetched:', harvests);

      if (!Array.isArray(harvests)) {
        console.log('⚠️ Harvests is not an array');
        return;
      }

      // Calculate totals from ALL non-rejected harvests
      const validHarvests = harvests.filter((h: any) =>
        h.status === 'Verified' || h.status === 'In Inventory' || h.status === 'Delivered' || h.status === 'Pending Verification' || h.status === 'Sold'
      );

      console.log('✅ Valid harvests for production:', validHarvests.length, 'out of', harvests.length);

      const totalFiberKg = validHarvests.reduce((sum: number, h: any) => {
        const kg = parseFloat(h.dry_fiber_output_kg) || 0;
        return sum + kg;
      }, 0);

      // Fetch sales for revenue using correct endpoint
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      // Check multiple possible farmer ID fields (same as SalesReportsList)
      const farmerId = currentUser?.farmer_id || currentUser?.id || currentUser?.user_id || currentUser?.farmerId;

      let totalRevenue = 0;
      if (farmerId) {
        const salesResponse = await apiGet(`https://fibersupplychain.onrender.com/api/sales/farmer-reports/${farmerId}`);

        if (salesResponse.ok) {
          const result = await salesResponse.json();
          console.log('💰 Sales API response:', result);

          if (result.success && Array.isArray(result.reports)) {
            const sales = result.reports;
            totalRevenue = sales.reduce((sum: number, s: any) => sum + (parseFloat(s.total_amount) || 0), 0);
            console.log('💵 Total revenue calculated:', totalRevenue, 'from', sales.length, 'reports');
          } else {
            console.log('⚠️ Sales response format unexpected:', result);
          }
        } else {
          console.log('⚠️ Sales API returned:', salesResponse.status);
        }
      } else {
        console.log('⚠️ No farmer ID available for sales fetch');
      }

      const stats = { totalFiberKg, totalRevenue };
      console.log('💎 Setting harvest stats:', stats);
      setHarvestStats(stats);

      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error('❌ Error fetching harvest stats:', error);
    }
  };

  const generateDistributionData = (viewMode: 'monthly' | 'yearly' = distributionViewMode) => {
    if (viewMode === 'monthly') {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
        seedlings: 0,
        planted: 0
      }));

      seedlings.forEach(seedling => {
        const date = new Date(seedling.date_distributed);
        if (date.getFullYear() === selectedYear) {
          const monthIndex = date.getMonth();
          monthlyData[monthIndex].seedlings += seedling.quantity_distributed;
          if (seedling.status === 'planted') {
            monthlyData[monthIndex].planted += seedling.quantity_distributed;
          }
        }
      });

      return monthlyData;
    } else {
      const yearlyData: any = {};
      const currentYear = new Date().getFullYear();

      // Initialize years - from 5 years ago to 3 years in future
      for (let i = -4; i <= 3; i++) {
        const year = currentYear + i;
        yearlyData[year] = { year, seedlings: 0, planted: 0 };
      }

      seedlings.forEach(seedling => {
        const year = new Date(seedling.date_distributed).getFullYear();
        if (yearlyData[year]) {
          yearlyData[year].seedlings += seedling.quantity_distributed;
          if (seedling.status === 'planted') {
            yearlyData[year].planted += seedling.quantity_distributed;
          }
        }
      });

      return Object.values(yearlyData).sort((a: any, b: any) => a.year - b.year);
    }
  };

  // Fetch farm status data from monitoring records (farmer's own farms only)
  const fetchLatestFarmStatus = async () => {
    try {
      const response = await apiGet('https://fibersupplychain.onrender.com/api/farmers/monitoring');

      if (response.ok) {
        const result = await response.json();
        const records = result.records || [];

        if (records.length > 0) {
          const sortedRecords = records.sort((a: any, b: any) =>
            new Date(b.dateOfVisit).getTime() - new Date(a.dateOfVisit).getTime()
          );
          const latest = sortedRecords[0];
          setLatestFarmStatus({
            condition: latest.farm_condition || 'Unknown',
            date: latest.dateOfVisit
          });
        }
      }
    } catch (error) {
      console.error('Error fetching latest farm status:', error);
    }
  };

  const fetchLatestDeliveryStatus = async () => {
    try {
      const response = await apiGet('https://fibersupplychain.onrender.com/api/fiber-deliveries/farmer/my-deliveries');

      if (response.ok) {
        const result = await response.json();
        const deliveries = result.deliveries || [];

        const activeDeliveries = deliveries.filter((d: any) =>
          d.status === 'In Transit' || d.status === 'Pending'
        );

        setLatestDeliveryStatus({
          status: activeDeliveries.length > 0 ? 'Active' : deliveries.length > 0 ? 'Completed' : 'No Deliveries',
          count: activeDeliveries.length
        });
      }
    } catch (error) {
      console.error('Error fetching delivery status:', error);
    }
  };

  const generateFarmStatusData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No token available for farm status');
        return;
      }

      const response = await apiGet('https://fibersupplychain.onrender.com/api/farmers/monitoring');

      if (response.ok) {
        const result = await response.json();
        const records = result.records || [];

        console.log('📊 Farmer monitoring records:', records);

        // Count farms by condition
        let healthyCount = 0;
        let actionNeededCount = 0;
        let needsSupportCount = 0;

        records.forEach((record: any) => {
          const condition = record.farm_condition;
          if (condition === 'Healthy') {
            healthyCount++;
          } else if (condition === 'Needs Support') {
            actionNeededCount++;
          } else if (condition === 'Damaged') {
            needsSupportCount++;
          }
        });

        const totalFarms = records.length;

        // Calculate percentages
        const healthyPercentage = totalFarms > 0 ? (healthyCount / totalFarms) * 100 : 0;
        const actionNeededPercentage = totalFarms > 0 ? (actionNeededCount / totalFarms) * 100 : 0;
        const needsSupportPercentage = totalFarms > 0 ? (needsSupportCount / totalFarms) * 100 : 0;

        setFarmStatusData([
          {
            status: 'Healthy',
            percentage: Math.round(healthyPercentage),
            count: healthyCount,
            color: { id: 'green', start: EDITORIAL_CHART.colors.emerald, end: EDITORIAL_CHART.colors.emerald }
          },
          {
            status: 'Action Needed',
            percentage: Math.round(actionNeededPercentage),
            count: actionNeededCount,
            color: { id: 'yellow', start: EDITORIAL_CHART.colors.amber, end: EDITORIAL_CHART.colors.amber }
          },
          {
            status: 'Needs Support',
            percentage: Math.round(needsSupportPercentage),
            count: needsSupportCount,
            color: { id: 'red', start: EDITORIAL_CHART.colors.danger, end: EDITORIAL_CHART.colors.danger }
          }
        ]);

        console.log('✅ Farm status calculated:', {
          total: totalFarms,
          healthy: healthyCount,
          actionNeeded: actionNeededCount,
          needsSupport: needsSupportCount
        });
      } else {
        console.error('Failed to fetch monitoring records:', response.status);
      }
    } catch (error) {
      console.error('Error fetching farm status:', error);
    }
  };

  const generateFarmHealthData = (viewMode: 'monthly' | 'yearly' = productionViewMode) => {
    if (viewMode === 'monthly') {
      return Array.from({ length: 12 }, (_, i) => ({
        month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
        health: Math.floor(Math.random() * 30) + 70,
        growth: Math.floor(Math.random() * 40) + 60,
        survival: Math.floor(Math.random() * 20) + 80
      }));
    } else {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => ({
        year: currentYear - 4 + i,
        health: Math.floor(Math.random() * 30) + 70,
        growth: Math.floor(Math.random() * 40) + 60,
        survival: Math.floor(Math.random() * 20) + 80
      }));
    }
  };

  const generateRevenueData = async (viewMode: 'monthly' | 'yearly' = revenueViewMode, yearToUse: number = selectedYear) => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      // Check multiple possible farmer ID fields (same as SalesReportsList)
      const farmerId = currentUser?.farmer_id || currentUser?.id || currentUser?.user_id || currentUser?.farmerId;

      if (!farmerId) {
        console.log('⚠️ No farmer ID available. User data:', currentUser);
        console.log('⚠️ Checked fields:', {
          farmer_id: currentUser?.farmer_id,
          id: currentUser?.id,
          user_id: currentUser?.user_id,
          farmerId: currentUser?.farmerId
        });
        return viewMode === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => ({
            month: new Date(yearToUse, i).toLocaleString('default', { month: 'short' }),
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }))
          : Array.from({ length: 5 }, (_, i) => ({
            year: new Date().getFullYear() - 4 + i,
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }));
      }

      // Fetch harvest data for fiber production (only verified harvests)
      const harvestResponse = await apiGet(`https://fibersupplychain.onrender.com/api/harvests/farmer/harvests`);

      if (!harvestResponse.ok) {
        console.log('No harvest data available');
        return viewMode === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => ({
            month: new Date(yearToUse, i).toLocaleString('default', { month: 'short' }),
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }))
          : Array.from({ length: 5 }, (_, i) => ({
            year: new Date().getFullYear() - 4 + i,
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }));
      }

      const harvestData = await harvestResponse.json();
      const harvests = harvestData.harvests || harvestData;
      console.log('🌾 Harvest data fetched for charts:', harvests);

      // Filter all valid harvests for production calculations
      const validHarvests = Array.isArray(harvests)
        ? harvests.filter((h: any) => h.status === 'Verified' || h.status === 'In Inventory' || h.status === 'Delivered' || h.status === 'Pending Verification' || h.status === 'Sold')
        : [];
      console.log('✅ Valid harvests for charts:', validHarvests.length, 'items', validHarvests.length > 0 ? { harvest_date: validHarvests[0].harvest_date, fiber: validHarvests[0].dry_fiber_output_kg } : 'no data');

      // Fetch sales data for revenue
      const salesResponse = await apiGet(`https://fibersupplychain.onrender.com/api/sales/farmer-reports/${farmerId}`);

      const salesResult = await salesResponse.json();
      const salesData = salesResult.success && Array.isArray(salesResult.reports) ? salesResult.reports : [];
      console.log('💰 Sales data for charts:', salesData.length, 'reports', salesData.length > 0 ? salesData[0] : 'no data');

      if (viewMode === 'monthly') {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(yearToUse, i).toLocaleString('default', { month: 'short' }),
          revenue: 0,
          profit: 0,
          fiberKg: 0
        }));

        // Add harvest data for fiber production (valid only)
        let totalFiber = 0;
        validHarvests.forEach((harvest: any) => {
          const harvestDate = new Date(harvest.harvest_date);
          if (harvestDate.getFullYear() === yearToUse) {
            const monthIndex = harvestDate.getMonth();
            const fiberKg = parseFloat(harvest.dry_fiber_output_kg) || 0;
            monthlyData[monthIndex].fiberKg += fiberKg;
            totalFiber += fiberKg;
          }
        });
        console.log(`📈 Monthly fiber data for ${yearToUse}:`, totalFiber, 'kg total');

        // Add sales data for revenue
        salesData.forEach((sale: any) => {
          const saleDate = new Date(sale.sale_date);
          if (saleDate.getFullYear() === yearToUse) {
            const monthIndex = saleDate.getMonth();
            const amount = parseFloat(sale.total_amount) || 0;
            monthlyData[monthIndex].revenue += amount;
            monthlyData[monthIndex].profit += amount * 0.7;
          }
        });

        console.log(`📈 Monthly revenue data for ${yearToUse}:`, monthlyData);

        return monthlyData;
      } else {
        const yearlyData: any = {};
        const currentYear = new Date().getFullYear();

        // Initialize years - from 5 years ago to 3 years in future (2022-2029 for 2026)
        for (let i = -4; i <= 3; i++) {
          const year = currentYear + i;
          yearlyData[year] = { year, revenue: 0, profit: 0, fiberKg: 0 };
        }

        // Add harvest data for fiber production (valid only)
        let totalFiber = 0;
        validHarvests.forEach((harvest: any) => {
          const year = new Date(harvest.harvest_date).getFullYear();
          if (yearlyData[year]) {
            const fiberKg = parseFloat(harvest.dry_fiber_output_kg) || 0;
            yearlyData[year].fiberKg += fiberKg;
            totalFiber += fiberKg;
          }
        });
        console.log('📈 Yearly fiber data:', totalFiber, 'kg total');

        // Add sales data for revenue
        if (Array.isArray(salesData)) {
          let totalRevProcessed = 0;
          salesData.forEach((sale: any) => {
            const year = new Date(sale.sale_date).getFullYear();
            const amount = parseFloat(sale.total_amount) || 0;
            if (yearlyData[year]) {
              yearlyData[year].revenue += amount;
              yearlyData[year].profit += amount * 0.7;
              totalRevProcessed += amount;
            }
          });
          console.log('📈 Yearly revenue processed:', totalRevProcessed, 'from', salesData.length, 'sales');
        }

        const result = Object.values(yearlyData);
        console.log('📊 Final yearly data:', result);
        return result;
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return viewMode === 'monthly'
        ? Array.from({ length: 12 }, (_, i) => ({
          month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          revenue: 0,
          profit: 0,
          fiberKg: 0
        }))
        : Array.from({ length: 5 }, (_, i) => ({
          year: new Date().getFullYear() - 4 + i,
          revenue: 0,
          profit: 0,
          fiberKg: 0
        }));
    }
  };

  const regenerateProductionData = async () => {
    setLoadingProductionChart(true);
    try {
      const production = await generateRevenueData(productionViewMode, productionSelectedYear);
      setProductionData(production);
    } catch (error) {
      console.error('Error regenerating production data:', error);
    } finally {
      setLoadingProductionChart(false);
    }
  };

  const regenerateRevenueData = async () => {
    setLoadingRevenueChart(true);
    try {
      const revenue = await generateRevenueData(revenueViewMode, revenueSelectedYear);
      setRevenueData(revenue);
    } catch (error) {
      console.error('Error regenerating revenue data:', error);
    } finally {
      setLoadingRevenueChart(false);
    }
  };

  const generateDealerStatusData = async (viewMode: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch delivery data for this farmer
      const deliveryResponse = await apiGet(`https://fibersupplychain.onrender.com/api/fiber-deliveries/farmer/my-deliveries`);

      if (!deliveryResponse.ok) {
        console.log('No delivery data available');
        return viewMode === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => ({
            month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
            delivered: 0,
            pending: 0,
            completed: 0
          }))
          : Array.from({ length: 5 }, (_, i) => ({
            year: new Date().getFullYear() - 4 + i,
            delivered: 0,
            pending: 0,
            completed: 0
          }));
      }

      const deliveryData = await deliveryResponse.json();
      const deliveries = deliveryData.deliveries || [];

      if (viewMode === 'monthly') {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          delivered: 0,
          pending: 0,
          completed: 0
        }));

        deliveries.forEach((delivery: any) => {
          const deliveryDate = new Date(delivery.delivery_date);
          if (deliveryDate.getFullYear() === selectedYear) {
            const monthIndex = deliveryDate.getMonth();
            if (delivery.status === 'Delivered') monthlyData[monthIndex].delivered++;
            else if (delivery.status === 'In Transit') monthlyData[monthIndex].pending++;
            else if (delivery.status === 'Completed') monthlyData[monthIndex].completed++;
          }
        });

        return monthlyData;
      } else {
        const yearlyData: any = {};
        const currentYear = new Date().getFullYear();

        // Initialize years
        for (let i = 0; i < 5; i++) {
          const year = currentYear - 4 + i;
          yearlyData[year] = { year, delivered: 0, pending: 0, completed: 0 };
        }

        deliveries.forEach((delivery: any) => {
          const year = new Date(delivery.delivery_date).getFullYear();
          if (yearlyData[year]) {
            if (delivery.status === 'Delivered') yearlyData[year].delivered++;
            else if (delivery.status === 'In Transit') yearlyData[year].pending++;
            else if (delivery.status === 'Completed') yearlyData[year].completed++;
          }
        });

        return Object.values(yearlyData);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      return viewMode === 'monthly'
        ? Array.from({ length: 12 }, (_, i) => ({
          month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          delivered: 0,
          pending: 0,
          completed: 0
        }))
        : Array.from({ length: 5 }, (_, i) => ({
          year: new Date().getFullYear() - 4 + i,
          delivered: 0,
          pending: 0,
          completed: 0
        }));
    }
  };

  const fetchFarmerProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await apiGet('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        console.log("📤 FRONTEND RECEIVED:", data); // Added console.log as per instruction
        console.log('✅ Farmer profile loaded:', data);
        setFarmerData(data);
        setEditFormData({
          full_name: data.full_name || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          sex: data.sex || '',
          age: data.age || '',
          barangay: data.barangay || '',
          municipality: data.municipality || '',
          association_name: data.association_name || ''
        });
        setProfilePhoto(data.profile_photo || null);
      }
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveFarmerProfile = async () => {
    setSavingProfile(true);
    try {
      const profileData = {
        ...editFormData,
        profilePhoto: profilePhoto
      };

      const response = await apiPut('/api/farmers/profile', profileData);

      if (response.ok) {
        alert('✅ Profile updated successfully!');
        setIsEditMode(false);
        await fetchFarmerProfile();
      } else {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        alert('❌ Failed to update profile: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('❌ Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoNum: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPlantingData({
        ...plantingData,
        [`planting_photo_${photoNum}`]: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsPlanted = async () => {
    if (!selectedSeedling) return;

    try {
      const response = await apiPut(`/api/association-seedlings/farmer/${selectedSeedling.distribution_id}/mark-planted`, {
        planting_date: plantingData.planting_date,
        planted_quantity: parseInt(plantingData.planting_quantity.toString()) || 0,
        damaged_quantity: parseInt(plantingData.damaged_quantity.toString()) || 0,
        planting_location: plantingData.planting_location,
        planting_notes: plantingData.planting_notes,
        planting_photo_1: plantingData.planting_photo_1,
        planting_photo_2: plantingData.planting_photo_2,
        planting_photo_3: plantingData.planting_photo_3
      });

      if (response.ok) {
        alert('Seedling marked as planted successfully! MAO has been notified.');
        setShowPlantingModal(false);
        setPlantingData({
          planting_date: new Date().toISOString().split('T')[0],
          planting_quantity: '',
          damaged_quantity: '',
          planting_location: '',
          planting_notes: '',
          planting_photo_1: '',
          planting_photo_2: '',
          planting_photo_3: ''
        });
        fetchMySeedlings();
      } else {
        alert('Failed to mark as planted');
      }
    } catch (error) {
      console.error('Error marking as planted:', error);
      alert('Failed to mark as planted');
    }
  };

  // Mock stats - replace with real API data
  const stats = {
    totalSeedlings: Array.isArray(seedlings) ? seedlings.reduce((sum, s) => sum + s.quantity_distributed, 0) : 0,
    activePlantings: Array.isArray(seedlings) ? seedlings.filter(s => s.status === 'planted').length : 0,
    farmArea: user?.farmAreaHectares || 0,
    nextHarvest: '2 weeks'
  };

  const navItems: EditorialNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', category: 'General', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'seedlings', label: 'My Seedlings', category: 'Farm Operations', icon: <Sprout className="w-[18px] h-[18px]" /> },
    { id: 'monitoring', label: 'Farm Monitoring', category: 'Farm Operations', icon: <Calendar className="w-[18px] h-[18px]" /> },
    { id: 'harvest', label: 'Harvest Records', category: 'Farm Operations', icon: <Package className="w-[18px] h-[18px]" /> },
    { id: 'track-deliveries', label: 'Track Deliveries', category: 'Deliveries & Sales', icon: <Truck className="w-[18px] h-[18px]" /> },
    { id: 'sales-report', label: 'Sales Reports', category: 'Deliveries & Sales', icon: <FileText className="w-[18px] h-[18px]" /> }
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: `Welcome back, ${user?.fullName || farmerData?.full_name || 'Farmer'}!`
    },
    seedlings: {
      title: 'My Seedlings',
      subtitle: 'Seedlings received from MAO distributions and planting progress'
    },
    monitoring: {
      title: 'Farm Monitoring',
      subtitle: 'Inspection history and recommendations from MAO visits'
    },
    harvest: {
      title: 'Harvest Records',
      subtitle: 'Track abaca harvests, verification status, and fiber yield'
    },
    'track-deliveries': {
      title: 'Track My Deliveries',
      subtitle: 'Monitor fiber deliveries and buyer fulfillment'
    },
    'sales-report': {
      title: showSalesForm ? 'Submit Sales Report' : 'Sales Reports',
      subtitle: 'Record and manage monthly abaca fiber sales'
    },
    profile: {
      title: showChangePassword ? 'Change Password' : showEditProfile ? 'Edit Profile' : 'My Profile',
      subtitle: 'Manage your farmer account, farm details, and security'
    }
  };

  const currentMeta = pageMeta[currentPage] || {
    title: 'Farmer Dashboard',
    subtitle: `Welcome back, ${user?.fullName || farmerData?.full_name || 'Farmer'}!`
  };

  const notificationContent = (
    <div>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-serif text-sm font-bold text-gray-900">Notifications</h3>
        <button
          type="button"
          onClick={() => setShowNotifications(false)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close notifications"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      notif.color === 'green'
                        ? 'bg-[#EAF6F0] text-[#047857]'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">{notif.title}</p>
                    <p className="text-xs text-gray-600 mb-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(notif.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={() => {
              setUnreadCount(0);
              setShowNotifications(false);
            }}
            className="w-full text-center text-xs font-semibold text-[#047857] hover:text-[#065F46] transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );

  const profileMenuContent = (
    <div className="divide-y divide-gray-100">
      <div className="px-3.5 py-2.5 bg-gray-50/60">
        <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName || farmerData?.full_name || 'Farmer'}</p>
        {user?.email && <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>}
      </div>
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            setCurrentPage('profile');
            setShowProfile(false);
            setShowEditProfile(false);
            setShowChangePassword(false);
            setShowProfileDropdown(false);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span>View Profile</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentPage('profile');
            setShowEditProfile(true);
            setShowProfile(false);
            setShowChangePassword(false);
            setShowProfileDropdown(false);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-gray-400" />
          <span>Edit Profile</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentPage('profile');
            setShowChangePassword(true);
            setShowProfile(false);
            setShowEditProfile(false);
            setShowProfileDropdown(false);
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <span>Change Password</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <EditorialShell
        brandTitle="Farmer Portal"
        brandSubtitle="Abaca producer"
        navItems={navItems}
        activeNavId={currentPage === 'profile' ? '' : currentPage}
        onSelectNav={(id) => {
          setCurrentPage(id as any);
          if (id === 'sales-report') {
            setShowSalesForm(false);
          }
          setShowNotifications(false);
          setShowProfileDropdown(false);
        }}
        pageTitle={currentMeta.title}
        pageSubtitle={currentMeta.subtitle}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={() => {
          setShowNotifications((prev) => !prev);
          setShowProfileDropdown(false);
        }}
        notificationContent={notificationContent}
        profileName={user?.fullName || farmerData?.full_name || 'Farmer'}
        profileRole={user?.associationName || farmerData?.association_name || 'Independent Farmer'}
        profileAvatar={profilePhoto}
        showProfileMenu={showProfileDropdown}
        onToggleProfileMenu={() => {
          setShowProfileDropdown((prev) => !prev);
          setShowNotifications(false);
        }}
        profileMenuContent={profileMenuContent}
        onLogout={onLogout}
        logoutLabel="Sign out"
      >
        <div className="space-y-6">
          <div
            className={currentPage === 'dashboard' ? 'space-y-6' : 'hidden'}
            aria-hidden={currentPage !== 'dashboard'}
          >
              {(() => {
                const distributionData = generateDistributionData();
                const totalDistributed = distributionData.reduce((sum: number, item: any) => sum + (item.seedlings || 0), 0);
                const totalPlanted = distributionData.reduce((sum: number, item: any) => sum + (item.planted || 0), 0);
                const totalRevenue = harvestStats.totalRevenue;
                const totalFiberKg = harvestStats.totalFiberKg;
                const condition = latestFarmStatus?.condition || 'No Data';
                const deliveryStatus = latestDeliveryStatus?.status || 'No Data';
                const deliveryCount = latestDeliveryStatus?.count || 0;

                const kpiItems = [
                  {
                    label: 'Seedlings received',
                    value: totalDistributed.toLocaleString(),
                    subtext: 'From MAO distributions'
                  },
                  {
                    label: 'Seedlings planted',
                    value: totalPlanted.toLocaleString(),
                    subtext: 'Successfully planted'
                  },
                  {
                    label: 'Fiber harvested',
                    value: `${totalFiberKg.toLocaleString()} kg`,
                    subtext: 'Total production output'
                  },
                  {
                    label: 'Total sales',
                    value: `₱${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'K' : totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    subtext: 'From approved sales'
                  },
                  {
                    label: 'Farm status',
                    value: condition,
                    subtext: 'Latest monitoring report'
                  },
                  {
                    label: 'Delivery status',
                    value: deliveryStatus === 'No Deliveries' ? 'None' : deliveryStatus,
                    subtext: deliveryStatus === 'Active' ? `${deliveryCount} active delivery` : 'Updated status'
                  }
                ];

                return (
                  <>
                    {/* 1. KPI Strip */}
                    <KpiStrip items={kpiItems} columns={6} />

                    {/* 2. Charts Section - 2x2 Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Seedling Distribution Trends */}
                      <EditorialCard
                        title="Seedling Distribution Trends"
                        subtitle="Distributed vs planted seedlings"
                        actions={
                          <div className="flex flex-wrap items-center gap-2">
                            <SegmentedToggle
                              options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' }
                              ]}
                              value={distributionViewMode}
                              onChange={(val) => setDistributionViewMode(val as 'monthly' | 'yearly')}
                            />
                            {distributionViewMode === 'monthly' && (
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                aria-label="Select seedling distribution year"
                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#047857]"
                              >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        }
                      >
                        <div className="flex items-center gap-4 text-xs mb-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }}
                            />
                            <span className="text-gray-600 font-medium">Distributed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: EDITORIAL_CHART.colors.amber }}
                            />
                            <span className="text-gray-600 font-medium">Planted</span>
                          </div>
                        </div>

                        <div className="w-full h-[320px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={distributionData}
                              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                              barSize={distributionViewMode === 'monthly' ? 20 : 32}
                            >
                              <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                              <XAxis
                                dataKey={distributionViewMode === 'monthly' ? 'month' : 'year'}
                                {...EDITORIAL_CHART.xAxisProps}
                              />
                              <YAxis
                                {...EDITORIAL_CHART.yAxisProps}
                                tickFormatter={(value) => Number(value).toLocaleString()}
                              />
                              <Tooltip
                                contentStyle={EDITORIAL_CHART.tooltipStyle}
                                labelStyle={{ fontWeight: 700, marginBottom: '6px', color: '#111827' }}
                                formatter={(value: unknown) => [Number(value || 0).toLocaleString(), undefined]}
                              />
                              <Bar
                                dataKey="seedlings"
                                fill={EDITORIAL_CHART.colors.emerald}
                                name="Distributed"
                                radius={[6, 6, 0, 0]}
                              />
                              <Bar
                                dataKey="planted"
                                fill={EDITORIAL_CHART.colors.amber}
                                name="Planted"
                                radius={[6, 6, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </EditorialCard>

                      {/* Farm Status Distribution Donut */}
                      <EditorialCard
                        title="Farm Status Distribution"
                        subtitle="Health status of your farms"
                      >
                        <div className="relative w-full h-56 flex items-center justify-center mb-5">
                          <svg viewBox="0 0 240 240" className="w-48 h-48">
                            {(() => {
                              let currentAngle = -90;
                              const visibleData = farmStatusData.filter((item) => item.percentage > 0);

                              if (visibleData.length === 0) {
                                return (
                                  <g>
                                    <circle cx="120" cy="120" r="88" fill="#F1F5F9" />
                                    <circle cx="120" cy="120" r="56" fill="#FFFFFF" />
                                  </g>
                                );
                              }

                              if (visibleData.length === 1) {
                                const singleItem = visibleData[0];
                                return (
                                  <g>
                                    <circle cx="120" cy="120" r="88" fill={singleItem.color.start} />
                                    <circle cx="120" cy="120" r="56" fill="#FFFFFF" />
                                  </g>
                                );
                              }

                              return (
                                <>
                                  {visibleData.map((item, index) => {
                                    const angle = (item.percentage / 100) * 360;
                                    const startAngle = currentAngle;
                                    const endAngle = currentAngle + angle;
                                    const midAngle = (startAngle + endAngle) / 2;
                                    currentAngle = endAngle;

                                    const startRad = (startAngle * Math.PI) / 180;
                                    const endRad = (endAngle * Math.PI) / 180;
                                    const midRad = (midAngle * Math.PI) / 180;

                                    const radius = hoveredPieSegment === index ? 92 : 88;
                                    const x1 = 120 + radius * Math.cos(startRad);
                                    const y1 = 120 + radius * Math.sin(startRad);
                                    const x2 = 120 + radius * Math.cos(endRad);
                                    const y2 = 120 + radius * Math.sin(endRad);

                                    const labelRadius = 72;
                                    const labelX = 120 + labelRadius * Math.cos(midRad);
                                    const labelY = 120 + labelRadius * Math.sin(midRad);

                                    const largeArc = angle > 180 ? 1 : 0;

                                    return (
                                      <g
                                        key={index}
                                        onMouseEnter={() => setHoveredPieSegment(index)}
                                        onMouseLeave={() => setHoveredPieSegment(null)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <path
                                          d={`M 120 120 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                          fill={item.color.start}
                                          stroke="#FFFFFF"
                                          strokeWidth="2"
                                          style={{
                                            opacity: hoveredPieSegment === null || hoveredPieSegment === index ? 1 : 0.55
                                          }}
                                        />
                                        {item.percentage > 10 && (
                                          <text
                                            x={labelX}
                                            y={labelY}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="text-[11px] font-semibold fill-white"
                                            style={{ pointerEvents: 'none' }}
                                          >
                                            {item.percentage.toFixed(0)}%
                                          </text>
                                        )}
                                      </g>
                                    );
                                  })}
                                  <circle cx="120" cy="120" r="56" fill="#FFFFFF" />
                                </>
                              );
                            })()}
                          </svg>

                          {(() => {
                            const visibleData = farmStatusData.filter((item) => item.percentage > 0);
                            const displayData =
                              hoveredPieSegment !== null && visibleData[hoveredPieSegment]
                                ? visibleData[hoveredPieSegment]
                                : visibleData.length === 1
                                  ? visibleData[0]
                                  : null;

                            if (!displayData && visibleData.length === 0) {
                              return (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                  <p className="text-sm font-semibold text-gray-500">No data</p>
                                </div>
                              );
                            }

                            return (
                              displayData && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                  <p className="text-xl font-bold text-gray-900 tabular-nums">
                                    {displayData.percentage.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-gray-600 font-medium">{displayData.status}</p>
                                  <p className="text-[11px] text-gray-400 tabular-nums">{displayData.count} farms</p>
                                </div>
                              )
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {farmStatusData.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/70 border border-gray-100 rounded-xl"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: item.color.start }}
                                />
                                <span className="text-sm font-medium text-gray-700">{item.status}</span>
                              </div>
                              <div className="flex items-baseline gap-2 tabular-nums">
                                <span className="text-sm font-bold text-gray-900">{item.percentage}%</span>
                                <span className="text-xs text-gray-500">({item.count} farms)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </EditorialCard>

                      {/* 3. Abaca Fiber Production Over Time */}
                      <EditorialCard
                        title="Abaca Fiber Production"
                        subtitle="Fiber harvest trends"
                        actions={
                          <div className="flex flex-wrap items-center gap-2">
                            <SegmentedToggle
                              options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' }
                              ]}
                              value={productionViewMode}
                              onChange={(val) => setProductionViewMode(val as 'monthly' | 'yearly')}
                            />
                            {productionViewMode === 'monthly' && (
                              <select
                                value={productionSelectedYear}
                                onChange={(e) => setProductionSelectedYear(Number(e.target.value))}
                                aria-label="Select fiber production year"
                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#047857]"
                              >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        }
                      >
                        <div className="flex items-center gap-2 text-xs mb-4">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: EDITORIAL_CHART.colors.amber }}
                          />
                          <span className="text-gray-600 font-medium">Dry fiber output (kg)</span>
                        </div>
                        {loadingProductionChart ? (
                          <div className="flex items-center justify-center h-[300px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#047857] border-t-transparent" />
                          </div>
                        ) : (
                          <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              {productionViewMode === 'monthly' ? (
                                <AreaChart data={productionData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                  <XAxis dataKey="month" {...EDITORIAL_CHART.xAxisProps} />
                                  <YAxis
                                    {...EDITORIAL_CHART.yAxisProps}
                                    tickFormatter={(value) => Number(value).toLocaleString()}
                                  />
                                  <Tooltip
                                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                                    labelStyle={{ fontWeight: 700, marginBottom: '6px', color: '#111827' }}
                                    formatter={(value: unknown) => [`${Number(value || 0).toLocaleString()} kg`, 'Fiber Production']}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="fiberKg"
                                    stroke={EDITORIAL_CHART.colors.amber}
                                    strokeWidth={2.5}
                                    fill={EDITORIAL_CHART.colors.amber}
                                    fillOpacity={0.14}
                                    name="Fiber Production"
                                  />
                                </AreaChart>
                              ) : (
                                <BarChart data={productionData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barSize={32}>
                                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                  <XAxis dataKey="year" {...EDITORIAL_CHART.xAxisProps} />
                                  <YAxis
                                    {...EDITORIAL_CHART.yAxisProps}
                                    tickFormatter={(value) => Number(value).toLocaleString()}
                                  />
                                  <Tooltip
                                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                                    labelStyle={{ fontWeight: 700, marginBottom: '6px', color: '#111827' }}
                                    formatter={(value: unknown) => [`${Number(value || 0).toLocaleString()} kg`, 'Fiber Production']}
                                  />
                                  <Bar
                                    dataKey="fiberKg"
                                    fill={EDITORIAL_CHART.colors.amber}
                                    name="Fiber Production"
                                    radius={[6, 6, 0, 0]}
                                  />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        )}
                      </EditorialCard>

                      {/* 4. Sales & Revenue Analytics */}
                      <EditorialCard
                        title="Sales"
                        subtitle="Sales performance"
                        badge={`₱${(totalRevenue / 1000).toFixed(1)}K`}
                        actions={
                          <div className="flex flex-wrap items-center gap-2">
                            <SegmentedToggle
                              options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' }
                              ]}
                              value={revenueViewMode}
                              onChange={(val) => setRevenueViewMode(val as 'monthly' | 'yearly')}
                            />
                            {revenueViewMode === 'monthly' && (
                              <select
                                value={revenueSelectedYear}
                                onChange={(e) => setRevenueSelectedYear(Number(e.target.value))}
                                aria-label="Select sales year"
                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:border-[#047857]"
                              >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        }
                      >
                        <div className="flex items-center gap-2 text-xs mb-4">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: EDITORIAL_CHART.colors.espresso }}
                          />
                          <span className="text-gray-600 font-medium">Sales revenue (PHP)</span>
                        </div>
                        {loadingRevenueChart ? (
                          <div className="flex items-center justify-center h-[300px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#047857] border-t-transparent" />
                          </div>
                        ) : (
                          <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              {revenueViewMode === 'monthly' ? (
                                <AreaChart data={revenueData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                  <XAxis dataKey="month" {...EDITORIAL_CHART.xAxisProps} />
                                  <YAxis
                                    {...EDITORIAL_CHART.yAxisProps}
                                    tickFormatter={(value) => `₱${(Number(value) / 1000).toFixed(0)}K`}
                                  />
                                  <Tooltip
                                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                                    labelStyle={{ fontWeight: 700, marginBottom: '6px', color: '#111827' }}
                                    formatter={(value: unknown) => [`₱${Number(value || 0).toLocaleString()}`, 'Sales']}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={EDITORIAL_CHART.colors.espresso}
                                    strokeWidth={2.5}
                                    fill={EDITORIAL_CHART.colors.espresso}
                                    fillOpacity={0.12}
                                    name="Sales"
                                  />
                                </AreaChart>
                              ) : (
                                <BarChart data={revenueData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} barSize={32}>
                                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                  <XAxis dataKey="year" {...EDITORIAL_CHART.xAxisProps} />
                                  <YAxis
                                    {...EDITORIAL_CHART.yAxisProps}
                                    tickFormatter={(value) => `₱${(Number(value) / 1000).toFixed(0)}K`}
                                  />
                                  <Tooltip
                                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                                    labelStyle={{ fontWeight: 700, marginBottom: '6px', color: '#111827' }}
                                    formatter={(value: unknown) => [`₱${Number(value || 0).toLocaleString()}`, 'Sales']}
                                  />
                                  <Bar
                                    dataKey="revenue"
                                    fill={EDITORIAL_CHART.colors.espresso}
                                    name="Sales"
                                    radius={[6, 6, 0, 0]}
                                  />
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        )}
                      </EditorialCard>
                    </div>
                  </>
                );
              })()}
            </div>

          <div
            className={currentPage === 'seedlings' ? 'space-y-6' : 'hidden'}
            aria-hidden={currentPage !== 'seedlings'}
          >
              {/* Seedlings Overview KPI Strip */}
              <KpiStrip
                columns={4}
                items={[
                  {
                    label: 'Total Seedlings',
                    value: `${seedlingStats.totalUnits.toLocaleString()} units`,
                    subtext: `${seedlingStats.totalBatches} distribution batches`
                  },
                  {
                    label: 'Damaged Seedlings',
                    value: `${seedlingStats.damagedUnits.toLocaleString()} units`,
                    subtext: 'Reported losses'
                  },
                  {
                    label: 'Planted',
                    value: `${seedlingStats.plantedUnits.toLocaleString()} units`,
                    subtext: `${seedlingStats.plantedBatches} completed batches`
                  },
                  {
                    label: 'Not Yet Planted',
                    value: `${seedlingStats.notPlantedUnits.toLocaleString()} units`,
                    subtext: `${seedlingStats.notPlantedBatches} pending batches`
                  }
                ]}
              />

              {/* Search & Filter Toolbar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by variety, source..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] placeholder:text-gray-400"
                    />
                  </div>

                  <div className="w-full md:w-56 relative">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full pl-10 pr-8 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] cursor-pointer font-medium text-gray-700"
                    >
                      <option value="all">All Status</option>
                      <option value="distributed">Distributed</option>
                      <option value="planted">Planted</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <EditorialCard>
                  <div className="py-12 text-center">
                    <div className="w-10 h-10 border-2 border-[#047857] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">Loading your seedlings...</p>
                  </div>
                </EditorialCard>
              ) : filteredSeedlings.length === 0 ? (
                <EditorialCard>
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sprout className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-gray-900 mb-1.5">No Records Found</h3>
                    <p className="text-sm text-gray-500">
                      {seedlings.length === 0
                        ? "You haven't received any seedlings from MAO Culiram yet"
                        : 'No seedlings match your search criteria'}
                    </p>
                    {seedlings.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Contact MAO Culiram for seedling distribution</p>
                    )}
                  </div>
                </EditorialCard>
              ) : (
                <EditorialCard noPadding>
                  <div className="table-wrapper" tabIndex={0} role="region" aria-label="My seedlings list">
                    <table className="w-full min-w-[960px]">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-gray-400" />
                              Photo
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Sprout className="w-3.5 h-3.5 text-gray-400" />
                              Variety & Date
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              Quantity
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                              Source
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-gray-400" />
                              Batch ID
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              Remarks
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                              Status
                            </div>
                          </th>
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredSeedlings
                          .slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage)
                          .map((seedling) => (
                            <tr key={seedling.distribution_id} className="hover:bg-gray-50/80 transition-colors">
                              {/* Photo */}
                              <td className="px-5 py-3.5">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#EAF6F0] border border-gray-200 flex-shrink-0">
                                  {(() => {
                                    const photoUrl = seedling.association_seedling_distributions?.seedling_photo ||
                                      seedling.association_seedling_distributions?.packaging_photo ||
                                      seedling.association_seedling_distributions?.quality_photo ||
                                      seedling.seedling_photo ||
                                      seedling.packaging_photo ||
                                      seedling.quality_photo;

                                    if (photoUrl && photoUrl.trim() !== '') {
                                      return (
                                        <img
                                          src={photoUrl}
                                          alt="Seedling"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-[#047857]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>';
                                            }
                                          }}
                                        />
                                      );
                                    }

                                    return (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Sprout className="w-5 h-5 text-[#047857]" />
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>

                              {/* Variety & Date */}
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-sm text-gray-900">{seedling.variety}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(seedling.date_distributed).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>

                              {/* Quantity */}
                              <td className="px-5 py-3.5 text-sm">
                                <div className="font-medium text-gray-900 tabular-nums">
                                  {seedling.status === 'planted'
                                    ? <>{seedling.planted_quantity ?? seedling.quantity_distributed} / {seedling.quantity_distributed} units</>
                                    : <>{seedling.quantity_distributed} units</>
                                  }
                                </div>
                                {seedling.damaged_quantity > 0 && (
                                  <div className="text-xs text-red-600 font-medium tabular-nums">
                                    ({seedling.damaged_quantity} loss)
                                  </div>
                                )}
                              </td>

                              {/* Source */}
                              <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">
                                {seedling.association_seedling_distributions?.source_supplier ||
                                  seedling.source_supplier ||
                                  seedling.association_officers?.association_name ||
                                  'MAO Culiram'}
                              </td>

                              {/* Batch ID */}
                              <td className="px-5 py-3.5 text-xs">
                                <span className="font-mono text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg inline-block">
                                  #{seedling.distribution_id?.slice(0, 8).toUpperCase() || 'N/A'}
                                </span>
                              </td>

                              {/* Remarks */}
                              <td className="px-5 py-3.5 text-sm text-gray-600">
                                {seedling.remarks || '-'}
                              </td>

                              {/* Status */}
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <StatusPill
                                  tone={
                                    seedling.status === 'planted'
                                      ? 'success'
                                      : seedling.status === 'distributed'
                                        ? 'info'
                                        : seedling.status === 'damaged'
                                          ? 'danger'
                                          : 'warning'
                                  }
                                >
                                  {seedling.status === 'planted'
                                    ? 'Complete'
                                    : seedling.status.charAt(0).toUpperCase() + seedling.status.slice(1)}
                                </StatusPill>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSeedling(seedling);
                                      setShowViewModal(true);
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {seedling.status === 'planted' ? (
                                    <span className="p-2 text-[#047857]" title="Already Planted">
                                      <CheckCircle className="w-4 h-4" />
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const defaultLocation = farmerData
                                          ? `${farmerData.barangay || ''}, ${farmerData.municipality || ''}`.trim().replace(/^, |, $/g, '')
                                          : '';
                                        setSelectedSeedling(seedling);
                                        setPlantingData({
                                          ...plantingData,
                                          planting_quantity: seedling.quantity_distributed,
                                          damaged_quantity: 0,
                                          planting_location: defaultLocation || ''
                                        });
                                        setShowPlantingModal(true);
                                      }}
                                      className="p-2 text-[#047857] hover:bg-[#EAF6F0] rounded-xl transition-colors"
                                      title="Mark as Planted"
                                    >
                                      <Sprout className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="border-t border-gray-100 px-5 py-4 bg-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-medium text-gray-500">Show entries:</span>
                        <div className="flex gap-1.5">
                          {[10, 20, 50].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setItemsPerPage(size);
                                setCurrentPageNum(1);
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

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="text-xs text-gray-500 tabular-nums">
                          Showing {((currentPageNum - 1) * itemsPerPage) + 1} to{' '}
                          {Math.min(currentPageNum * itemsPerPage, filteredSeedlings.length)} of{' '}
                          {filteredSeedlings.length}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCurrentPageNum((prev) => Math.max(1, prev - 1))}
                            disabled={currentPageNum === 1}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPageNum((prev) =>
                                Math.min(Math.ceil(filteredSeedlings.length / itemsPerPage), prev + 1)
                              )
                            }
                            disabled={currentPageNum >= Math.ceil(filteredSeedlings.length / itemsPerPage)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </EditorialCard>
              )}
            </div>

          <KeepAlivePages
            activeId={currentPage}
            noKeepAlive={['profile']}
            pages={{
              harvest: () => <FarmerHarvestView />,
              monitoring: () => <FarmerMonitoringView />,
              'sales-report': () =>
                showSalesForm ? (
                  <SalesReportForm
                    onSubmit={(report) => {
                      console.log('Sales report submitted:', report);
                      alert('Sales report submitted successfully!');
                      setShowSalesForm(false);
                    }}
                    onCancel={() => setShowSalesForm(false)}
                  />
                ) : (
                  <SalesReportsList onAddNewReport={() => setShowSalesForm(true)} />
                ),
              'track-deliveries': () => <FarmerDeliveryTracking />,
              profile: () =>
                showChangePassword ? (
                  <FarmerChangePassword onBack={() => setShowChangePassword(false)} />
                ) : showEditProfile ? (
                  <EditFarmerProfile onBack={() => setShowEditProfile(false)} />
                ) : (
                  <FarmerProfile
                    onBack={() => setCurrentPage('dashboard')}
                    onEditProfile={() => setShowEditProfile(true)}
                  />
                ),
            }}
          />
        </div>
      </EditorialShell>

      {/* Planting Modal */}
      {showPlantingModal && selectedSeedling && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Mark Seedlings as Planted</h2>
                <p className="text-xs text-gray-500 mt-0.5">Record planting date, quantities, and field photos</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPlantingModal(false);
                  setPlantingData({
                    planting_date: new Date().toISOString().split('T')[0],
                    planting_quantity: '',
                    damaged_quantity: '',
                    planting_location: '',
                    planting_notes: '',
                    planting_photo_1: '',
                    planting_photo_2: '',
                    planting_photo_3: ''
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close planting modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Seedling Info */}
              <div className="bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl p-4 mb-6">
                <h3 className="font-serif text-sm font-bold text-gray-900 mb-2">Seedling Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Variety:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedSeedling.variety}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-semibold text-gray-900 tabular-nums">
                      {selectedSeedling.quantity_distributed}
                    </span>
                  </div>
                </div>
              </div>

              {/* Planting Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleMarkAsPlanted(); }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Planting Date *</label>
                      <input
                        type="date"
                        required
                        value={plantingData.planting_date}
                        onChange={(e) => setPlantingData({ ...plantingData, planting_date: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Actual Planted *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={selectedSeedling.quantity_distributed}
                        value={plantingData.planting_quantity}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const val = valStr === '' ? '' : parseInt(valStr);
                          const numVal = typeof val === 'number' ? val : 0;

                          setPlantingData({
                            ...plantingData,
                            planting_quantity: val,
                            damaged_quantity: Math.max(0, selectedSeedling.quantity_distributed - numVal)
                          });
                        }}
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Damaged/Died</label>
                      <input
                        type="number"
                        min="0"
                        max={selectedSeedling.quantity_distributed}
                        value={plantingData.damaged_quantity}
                        onChange={(e) => {
                          const valStr = e.target.value;
                          const val = valStr === '' ? '' : parseInt(valStr);
                          const numVal = typeof val === 'number' ? val : 0;

                          setPlantingData({
                            ...plantingData,
                            damaged_quantity: val,
                            planting_quantity: Math.max(0, selectedSeedling.quantity_distributed - numVal)
                          });
                        }}
                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Planting Location</label>
                    <input
                      type="text"
                      value={plantingData.planting_location}
                      onChange={(e) => setPlantingData({ ...plantingData, planting_location: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      placeholder="e.g., Farm Section A, Near river"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Planting Method</label>
                    <textarea
                      rows={3}
                      value={plantingData.planting_notes}
                      onChange={(e) => setPlantingData({ ...plantingData, planting_notes: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                      placeholder="Describe the planting method used..."
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-serif text-sm font-bold text-gray-900 mb-3">Planting Photos (Optional)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <label className="block text-xs text-gray-600 mb-1.5">Photo {num}</label>
                          <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-[#047857] transition-colors">
                            {plantingData[`planting_photo_${num}` as keyof typeof plantingData] ? (
                              <div className="relative">
                                <img
                                  src={plantingData[`planting_photo_${num}` as keyof typeof plantingData] as string}
                                  alt={`Planting ${num}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPlantingData({ ...plantingData, [`planting_photo_${num}`]: '' })}
                                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block">
                                <Sprout className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, num)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB per photo</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlantingModal(false);
                      setPlantingData({
                        planting_date: new Date().toISOString().split('T')[0],
                        planting_quantity: 0,
                        damaged_quantity: 0,
                        planting_location: '',
                        planting_notes: '',
                        planting_photo_1: '',
                        planting_photo_2: '',
                        planting_photo_3: ''
                      });
                    }}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
                  >
                    Mark as Planted
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSeedling && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Seedling Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Distribution and planting summary</p>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                aria-label="Close seedling details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Distribution Information */}
              <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-5">
                <h3 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#047857]" />
                  Distribution Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Variety</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedSeedling.variety}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {selectedSeedling.quantity_distributed.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date Distributed</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(selectedSeedling.date_distributed).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedSeedling.source_supplier && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Source / Supplier</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSeedling.source_supplier}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <StatusPill
                      tone={
                        selectedSeedling.status === 'planted'
                          ? 'success'
                          : selectedSeedling.status === 'distributed'
                            ? 'info'
                            : selectedSeedling.status === 'damaged'
                              ? 'danger'
                              : 'warning'
                      }
                    >
                      {selectedSeedling.status}
                    </StatusPill>
                  </div>
                  {selectedSeedling.organization && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Distributed By</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSeedling.organization.full_name}</p>
                    </div>
                  )}
                  {selectedSeedling.remarks && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-0.5">Remarks</p>
                      <p className="text-sm font-medium text-gray-900">{selectedSeedling.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Distribution Photos */}
              {(selectedSeedling.seedling_photo || selectedSeedling.packaging_photo || selectedSeedling.quality_photo) && (
                <div className="pb-6 border-b border-gray-100">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-4">Distribution Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedSeedling.seedling_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Seedling Photo</p>
                        <img
                          src={selectedSeedling.seedling_photo}
                          alt="Seedling"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.packaging_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Distribution Photo</p>
                        <img
                          src={selectedSeedling.packaging_photo}
                          alt="Packaging"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.quality_photo && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Quality Photo</p>
                        <img
                          src={selectedSeedling.quality_photo}
                          alt="Quality"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Planting Information (if planted) */}
              {selectedSeedling.status === 'planted' && (
                <div>
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#047857]" />
                    Planting Information
                  </h3>
                  <div className="bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedSeedling.planting_date && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Planting Date</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(selectedSeedling.planting_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedSeedling.planted_quantity !== undefined && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Quantity Planted</p>
                          <p className="text-sm font-semibold text-gray-900 tabular-nums">
                            {selectedSeedling.planted_quantity ?? selectedSeedling.quantity_distributed} units
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Damaged Quantity</p>
                        <p className="text-sm font-semibold text-red-700 tabular-nums">
                          {selectedSeedling.damaged_quantity ?? 0} units
                        </p>
                      </div>
                      {selectedSeedling.planting_location && (
                        <div>
                          <p className="text-xs text-gray-600 mb-0.5">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedSeedling.planting_location}</p>
                        </div>
                      )}
                      {selectedSeedling.planting_notes && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-600 mb-0.5">Planting Method</p>
                          <p className="text-sm font-medium text-gray-900">{selectedSeedling.planting_notes}</p>
                        </div>
                      )}
                      {!selectedSeedling.planting_date && !selectedSeedling.planting_location && !selectedSeedling.planting_notes && (
                        <div className="sm:col-span-2 text-center py-3">
                          <p className="text-sm font-medium text-gray-900">Seedlings marked as planted</p>
                          <p className="text-xs text-gray-500 mt-1">Detailed planting information not yet recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Planting Photos (if planted) */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div>
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Your Planting Photos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Photo 1</p>
                        <img
                          src={selectedSeedling.planting_photo_1}
                          alt="Planting 1"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => {
                            setSelectedPhoto(selectedSeedling.planting_photo_1);
                            setShowPhotoModal(true);
                          }}
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_2 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Photo 2</p>
                        <img
                          src={selectedSeedling.planting_photo_2}
                          alt="Planting 2"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => {
                            setSelectedPhoto(selectedSeedling.planting_photo_2);
                            setShowPhotoModal(true);
                          }}
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_3 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1.5">Photo 3</p>
                        <img
                          src={selectedSeedling.planting_photo_3}
                          alt="Planting 3"
                          className="w-full h-44 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => {
                            setSelectedPhoto(selectedSeedling.planting_photo_3);
                            setShowPhotoModal(true);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div
          className="fixed inset-0 bg-gray-950/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <button
            type="button"
            onClick={() => setShowPhotoModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Close full screen photo"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full screen view"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default FarmerDashboard;
