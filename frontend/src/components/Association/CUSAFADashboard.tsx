import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  User,
  Users,
  Edit,
  KeyRound,
  Package,
  Share2,
  Sprout,
  TrendingUp,
  Truck,
  Bell,
  Activity,
  X
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart as RechartsPieChart,
  Pie,
  Cell
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
import AssociationInventory from './AssociationInventory';
import AssociationSeedlingDistribution from './AssociationSeedlingDistribution';
import CUSAFAInventory from '../MAO/CUSAFAInventory';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';
import CUSAFAFiberDeliveries from './CUSAFAFiberDeliveries';
import AssociationProfile from './AssociationProfile';
import EditAssociationProfile from './EditAssociationProfile';
import ChangePassword from './ChangePassword';

type DashboardPage = 'overview' | 'inventory' | 'distribution' | 'fiber-inventory' | 'buyer-prices' | 'fiber-deliveries' | 'analytics' | 'profile' | 'edit-profile' | 'change-password';

interface DashboardStats {
  totalReceivedCount: number;
  totalFarmerDistributions: number;
  totalReceivedQuantity: number;
  totalDistributedQuantity: number;
  totalAvailableQuantity: number;
  plantedQuantity: number;
  plantingRate: number;
}

interface Notification {
  id: string;
  type: 'seedling' | 'fiber' | 'distribution';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

interface AnalyticsData {
  period: string;
  seedlings: number;
  deliveries: number;
  received: number;
  fiberKg: number;
}

interface CUSAFADashboardProps {
  onLogout: () => void;
}

interface DeliveryStatusData {
  name: string;
  value: number;
  fill: string;
  [key: string]: string | number;
}

const CUSAFADashboard: React.FC<CUSAFADashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [officerProfile, setOfficerProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalReceivedCount: 0,
    totalFarmerDistributions: 0,
    totalReceivedQuantity: 0,
    totalDistributedQuantity: 0,
    totalAvailableQuantity: 0,
    plantedQuantity: 0,
    plantingRate: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [cachedDistributions, setCachedDistributions] = useState<any[]>([]);
  const [cachedReceivedSeedlings, setCachedReceivedSeedlings] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([
    // Initial test data to verify chart works
    { period: 'Jan', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Feb', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Mar', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Apr', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'May', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Jun', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Jul', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Aug', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Sep', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Oct', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Nov', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 },
    { period: 'Dec', seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 }
  ]);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const [deliveryStatusData, setDeliveryStatusData] = useState<DeliveryStatusData[]>([]);

  const [totalSeedlingsDistributed, setTotalSeedlingsDistributed] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [totalFiberKg, setTotalFiberKg] = useState(0);
  const [fiberDeliveryStats, setFiberDeliveryStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    totalKg: 0
  });
  const [fiberDeliveryChartData, setFiberDeliveryChartData] = useState<DeliveryStatusData[]>([]);

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  const { version, manualTick } = useCacheState();
  const lastOverviewVersionRef = useRef(version);
  const prevManualTickRef = useRef(manualTick);

  useEffect(() => {
    loadDashboardStats();
    fetchOfficerProfile();
    loadNotifications();
    loadFiberDeliveryStats();
  }, []);

  // Load raw data only once on mount
  useEffect(() => {
    loadRawSeedlingData();
  }, []);

  // Refresh overview/analytics metrics only when cache invalidates
  useEffect(() => {
    const manualChanged = prevManualTickRef.current !== manualTick;
    if (manualChanged) {
      prevManualTickRef.current = manualTick;
      lastOverviewVersionRef.current = version;
      loadDashboardStats();
      loadRawSeedlingData();
      loadNotifications();
      loadFiberDeliveryStats();
      fetchOfficerProfile();
      return;
    }

    if (
      (currentPage === 'overview' || currentPage === 'analytics') &&
      lastOverviewVersionRef.current !== version
    ) {
      lastOverviewVersionRef.current = version;
      loadDashboardStats();
      loadRawSeedlingData();
      loadNotifications();
      loadFiberDeliveryStats();
      fetchOfficerProfile();
    }
  }, [currentPage, version, manualTick]);

  // Transform cached data when view mode changes (instant)
  useEffect(() => {
    if (cachedDistributions.length > 0 || cachedReceivedSeedlings.length > 0) {
      transformAnalyticsData();
    }
  }, [viewMode, selectedYear, cachedDistributions, cachedReceivedSeedlings]);

  const fetchOfficerProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://fibersupplychain.onrender.com/api/association/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOfficerProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching officer profile:', error);
    }
  };

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoadingStats(false);
        return;
      }

      const [associationRes, farmerRes] = await Promise.all([
        fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/farmer-distributions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!associationRes.ok || !farmerRes.ok) {
        setLoadingStats(false);
        return;
      }

      const associationData = await associationRes.json();
      const farmerData = await farmerRes.json();

      const totalReceivedQuantity = Array.isArray(associationData)
        ? associationData.reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const totalDistributedQuantity = Array.isArray(farmerData)
        ? farmerData.reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const plantedQuantity = Array.isArray(farmerData)
        ? farmerData
          .filter((item: any) => item.status === 'planted')
          .reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const plantingRate = totalDistributedQuantity > 0
        ? (plantedQuantity / totalDistributedQuantity) * 100
        : 0;

      setStats({
        totalReceivedCount: Array.isArray(associationData) ? associationData.length : 0,
        totalFarmerDistributions: Array.isArray(farmerData) ? farmerData.length : 0,
        totalReceivedQuantity,
        totalDistributedQuantity,
        totalAvailableQuantity: Math.max(totalReceivedQuantity - totalDistributedQuantity, 0),
        plantedQuantity,
        plantingRate,
      });

      setTotalSeedlingsDistributed(totalDistributedQuantity);

      // Set recent distributions (sort by date descending)
      if (Array.isArray(farmerData)) {
        // Map farmer data to include farmer_name from nested farmers object
        const mappedData = farmerData.map((dist: any) => ({
          ...dist,
          farmer_name: dist.farmers?.full_name || dist.farmer_name || null
        }));
        
        const sorted = [...mappedData].sort((a: any, b: any) =>
          new Date(b.date_distributed || b.distribution_date).getTime() - new Date(a.date_distributed || a.distribution_date).getTime()
        );
        setRecentDistributions(sorted.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading CUSAFA stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const notifs: Notification[] = [];

      const seedlingRes = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/farmer-distributions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (seedlingRes.ok) {
        const seedlingData = await seedlingRes.json();
        if (Array.isArray(seedlingData)) {
          seedlingData.slice(0, 10).forEach((dist: any) => {
            notifs.push({
              id: `seedling-${dist.distribution_id}`,
              type: 'seedling',
              title: 'Seedling Distribution',
              message: `${dist.quantity_distributed} ${dist.variety} distributed to ${dist.farmer_name}`,
              date: dist.distribution_date || dist.date_distributed,
              read: false
            });
          });
        }
      }

      notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadFiberDeliveryStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('https://fibersupplychain.onrender.com/api/fiber-deliveries/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const deliveries = data.deliveries || [];

        // Calculate statistics
        const stats = {
          total: deliveries.length,
          inTransit: deliveries.filter((d: any) => d.status === 'In Transit').length,
          delivered: deliveries.filter((d: any) => d.status === 'Delivered').length,
          completed: deliveries.filter((d: any) => d.status === 'Completed').length,
          cancelled: deliveries.filter((d: any) => d.status === 'Cancelled').length,
          totalKg: deliveries.reduce((sum: number, d: any) => sum + (parseFloat(d.quantity_kg) || 0), 0)
        };

        setFiberDeliveryStats(stats);

        // Create chart data
        const chartData: DeliveryStatusData[] = [];
        if (stats.completed > 0) chartData.push({ name: 'Completed', value: stats.completed, fill: EDITORIAL_CHART.colors.emerald });
        if (stats.delivered > 0) chartData.push({ name: 'Delivered', value: stats.delivered, fill: EDITORIAL_CHART.colors.amber });
        if (stats.inTransit > 0) chartData.push({ name: 'In Transit', value: stats.inTransit, fill: EDITORIAL_CHART.colors.espresso });
        if (stats.cancelled > 0) chartData.push({ name: 'Cancelled', value: stats.cancelled, fill: EDITORIAL_CHART.colors.mutedSlate });
        
        if (chartData.length === 0) {
          chartData.push({ name: 'No Deliveries', value: 1, fill: EDITORIAL_CHART.colors.slate });
        }

        setFiberDeliveryChartData(chartData);
        console.log('📦 Fiber Delivery Stats:', stats);
      }
    } catch (error) {
      console.error('Error loading fiber delivery stats:', error);
    }
  };

  // Load raw data from API (called only once)
  const loadRawSeedlingData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      setLoadingChart(true);
      let seedlingData: any = [];
      let receivedData: any = [];

      try {
        const seedlingRes = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/farmer-distributions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (seedlingRes.ok) {
          seedlingData = await seedlingRes.json();
        }
      } catch (err) {
        console.warn('Failed to fetch farmer distributions:', err);
      }

      try {
        const receivedRes = await fetch('https://fibersupplychain.onrender.com/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (receivedRes.ok) {
          receivedData = await receivedRes.json();
        }
      } catch (err) {
        console.warn('Failed to fetch received seedlings:', err);
      }

      let distributions = Array.isArray(seedlingData) ? seedlingData : [];
      let receivedSeedlings = Array.isArray(receivedData) ? receivedData : [];
      
      // Handle nested response structure
      if (seedlingData && seedlingData.distributions) {
        distributions = Array.isArray(seedlingData.distributions) ? seedlingData.distributions : [];
      }
      if (receivedData && receivedData.distributions) {
        receivedSeedlings = Array.isArray(receivedData.distributions) ? receivedData.distributions : [];
      }

      console.log('📊 Raw API Data Loaded:', { 
        distributions: distributions.length,
        received: receivedSeedlings.length 
      });

      // Cache the raw data
      setCachedDistributions(distributions);
      setCachedReceivedSeedlings(receivedSeedlings);
      setLoadingChart(false);
    } catch (error) {
      console.error('Error loading raw seedling data:', error);
      setLoadingChart(false);
    }
  };

  // Transform cached data based on view mode (instant - no API calls)
  const transformAnalyticsData = () => {
    const distributions = cachedDistributions;
    const receivedSeedlings = cachedReceivedSeedlings;

      if (viewMode === 'monthly') {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          period: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          seedlings: 0,
          deliveries: 0,
          received: 0,
          fiberKg: 0
        }));

        distributions.forEach((dist: any) => {
          const date = new Date(dist.distribution_date || dist.date_distributed);
          if (date.getFullYear() === selectedYear) {
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].seedlings += dist.quantity_distributed || 0;
          }
        });

        receivedSeedlings.forEach((received: any) => {
          const dateStr = received.date_distributed || received.distribution_date || received.date_received;
          const date = new Date(dateStr);
          if (date.getFullYear() === selectedYear) {
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].received += received.quantity_distributed || 0;
          }
        });


        console.log('📊 Monthly Analytics Data:', monthlyData.filter(d => d.seedlings > 0 || d.received > 0));
        setAnalyticsData(monthlyData);
      } else {
        const yearlyData: any = {};
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < 5; i++) {
          const year = currentYear - 4 + i;
          yearlyData[year] = { period: year.toString(), seedlings: 0, deliveries: 0, received: 0, fiberKg: 0 };
        }

        distributions.forEach((dist: any) => {
          const year = new Date(dist.distribution_date || dist.date_distributed).getFullYear();
          if (yearlyData[year]) {
            yearlyData[year].seedlings += dist.quantity_distributed || 0;
          }
        });

        receivedSeedlings.forEach((received: any) => {
          const dateStr = received.date_distributed || received.distribution_date || received.date_received;
          const year = new Date(dateStr).getFullYear();
          if (yearlyData[year]) {
            yearlyData[year].received += received.quantity_distributed || 0;
          }
        });


        const yearlyArray = Object.values(yearlyData) as AnalyticsData[];
        console.log('📊 Yearly Analytics Data:', yearlyArray);
        setAnalyticsData(yearlyArray);
      }

      setTotalDeliveries(distributions.length);
      setTotalFiberKg(0);

      // Calculate Distribution Status for Pie Chart (from Seedling Distributions)
      const totalReceived = stats.totalReceivedQuantity || receivedSeedlings.reduce((sum: number, r: any) => sum + (r.quantity_distributed || 0), 0);
      const totalDistributed = stats.totalDistributedQuantity || distributions.reduce((sum: number, d: any) => sum + (d.quantity_distributed || 0), 0);
      const totalAvailable = Math.max(totalReceived - totalDistributed, 0);

      console.log('📊 Status Calculation:', { totalReceived, totalDistributed, totalAvailable });

      const statusChartData: DeliveryStatusData[] = [];
      
      if (totalDistributed > 0) {
        statusChartData.push({ name: 'Distributed', value: totalDistributed, fill: EDITORIAL_CHART.colors.emerald });
      }
      if (totalAvailable > 0) {
        statusChartData.push({ name: 'Available', value: totalAvailable, fill: EDITORIAL_CHART.colors.amber });
      }
      
      // Count planted seedlings
      const plantedCount = distributions.filter((d: any) => 
        d.status && d.status.toLowerCase().includes('plant')
      ).reduce((sum: number, d: any) => sum + (d.quantity_distributed || 0), 0);
      
      if (plantedCount > 0) {
        statusChartData.push({ name: 'Planted', value: plantedCount, fill: EDITORIAL_CHART.colors.espresso });
      }

      // If no data, show placeholder
      if (statusChartData.length === 0) {
        statusChartData.push({ name: 'No Data', value: 1, fill: EDITORIAL_CHART.colors.slate });
      }

      console.log('📊 Pie Chart Data:', statusChartData);
      setDeliveryStatusData(statusChartData);
  };

  const editorialNavItems: EditorialNavItem[] = [
    { id: 'overview', label: 'Overview', category: 'General', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'inventory', label: 'Seedling Inventory', category: 'Seedlings', icon: <Sprout className="w-[18px] h-[18px]" /> },
    { id: 'distribution', label: 'Distribution', category: 'Seedlings', icon: <Share2 className="w-[18px] h-[18px]" /> },
    { id: 'fiber-inventory', label: 'Fiber Inventory', category: 'Fiber & Market', icon: <Package className="w-[18px] h-[18px]" /> },
    { id: 'fiber-deliveries', label: 'Fiber Deliveries', category: 'Fiber & Market', icon: <Truck className="w-[18px] h-[18px]" /> },
    { id: 'buyer-prices', label: 'Buyer Prices', category: 'Fiber & Market', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
  ];

  const getDistributionTone = (status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' => {
    const s = (status || '').toLowerCase();
    if (s.includes('plant')) return 'info';
    if (s.includes('damaged') || s.includes('lost') || s.includes('cancel')) return 'danger';
    if (s.includes('replant')) return 'warning';
    if (!status || s.includes('distributed')) return 'success';
    return 'neutral';
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <EditorialCard
        title="Data Insights & Trends"
        subtitle="Track fiber deliveries, seedling distributions, and performance metrics over time"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {viewMode === 'monthly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                aria-label="Select analytics year"
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-[#047857]"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
            <SegmentedToggle
              variant="amber"
              value={viewMode}
              onChange={(val) => setViewMode(val as 'monthly' | 'yearly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>
        }
      >
        <div className="text-xs text-gray-500">
          Performance analytics for {viewMode === 'monthly' ? `calendar year ${selectedYear}` : 'the past 5 years'}.
        </div>
      </EditorialCard>

      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Total Fiber Deliveries',
            value: `${totalFiberKg.toFixed(2)} kg`,
            subtext: `${totalDeliveries} deliveries`,
          },
          {
            label: 'Total Seedlings Distributed',
            value: totalSeedlingsDistributed.toLocaleString(),
            subtext: 'To farmers',
          },
          {
            label: 'Active Period',
            value: viewMode === 'monthly' ? selectedYear : '5 Years',
            subtext: viewMode === 'monthly' ? '12 months' : 'Historical data',
          },
        ]}
      />

      <EditorialCard
        title="Fiber Deliveries (kg)"
        subtitle="Track total fiber weight delivered over time"
        actions={
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
            <span>Fiber (kg)</span>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analyticsData}>
            <CartesianGrid {...EDITORIAL_CHART.gridProps} />
            <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} />
            <YAxis {...EDITORIAL_CHART.yAxisProps} />
            <Tooltip
              contentStyle={EDITORIAL_CHART.tooltipStyle}
              formatter={(value: unknown) => [`${Number(value ?? 0).toLocaleString()} kg`, 'Fiber']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="fiberKg"
              stroke={EDITORIAL_CHART.colors.amber}
              fill={EDITORIAL_CHART.colors.amber}
              fillOpacity={0.14}
              name="Fiber (kg)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </EditorialCard>

      <EditorialCard
        title="Seedling Distributions"
        subtitle="Monitor seedling distribution to farmers"
        actions={
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
            <span>Seedlings Distributed</span>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={analyticsData}>
            <CartesianGrid {...EDITORIAL_CHART.gridProps} />
            <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} />
            <YAxis {...EDITORIAL_CHART.yAxisProps} />
            <Tooltip
              contentStyle={EDITORIAL_CHART.tooltipStyle}
              cursor={{ fill: '#F8F9FA' }}
              formatter={(value: unknown) => [Number(value ?? 0).toLocaleString(), 'Seedlings Distributed']}
            />
            <Legend />
            <Bar
              dataKey="seedlings"
              fill={EDITORIAL_CHART.colors.emerald}
              name="Seedlings Distributed"
              radius={[6, 6, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </EditorialCard>

      <EditorialCard
        title="Delivery Count"
        subtitle="Number of fiber deliveries per period"
        actions={
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.espresso }} />
            <span>Deliveries</span>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={analyticsData}>
            <CartesianGrid {...EDITORIAL_CHART.gridProps} />
            <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} />
            <YAxis {...EDITORIAL_CHART.yAxisProps} />
            <Tooltip
              contentStyle={EDITORIAL_CHART.tooltipStyle}
              formatter={(value: unknown) => [Number(value ?? 0).toLocaleString(), 'Deliveries']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="deliveries"
              stroke={EDITORIAL_CHART.colors.espresso}
              strokeWidth={2.5}
              name="Deliveries"
              dot={{ fill: EDITORIAL_CHART.colors.espresso, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </EditorialCard>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Seedlings Received',
            value: stats.totalReceivedQuantity.toLocaleString(),
            subtext: 'From MAO distributions',
          },
          {
            label: 'Seedlings Distributed',
            value: stats.totalDistributedQuantity.toLocaleString(),
            subtext: `To ${stats.totalFarmerDistributions} farmers`,
          },
          {
            label: 'Inventory Remaining',
            value: stats.totalAvailableQuantity.toLocaleString(),
            subtext: stats.totalAvailableQuantity === 0 ? 'Fully distributed' : 'Ready for distribution',
          },
          {
            label: 'Planting Progress',
            value: stats.plantedQuantity.toLocaleString(),
            accentSubtext: `${stats.plantingRate.toFixed(1)}% planted`,
          },
        ]}
      />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seedling Distributions Bar Chart - 2 columns */}
        <EditorialCard
          className="lg:col-span-2"
          title="Seedling Distributions"
          subtitle="Monthly distribution trends to farmers"
          actions={
            <SegmentedToggle
              variant="amber"
              value={viewMode}
              onChange={(val) => setViewMode(val as 'monthly' | 'yearly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          }
        >
          {/* Inline Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
              <span className="font-medium text-gray-600">Received</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {analyticsData.reduce((sum, d) => sum + d.received, 0).toLocaleString()}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-gray-200 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
              <span className="font-medium text-gray-600">Distributed</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {analyticsData.reduce((sum, d) => sum + d.seedlings, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {loadingChart ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#047857] mb-3"></div>
              <p className="text-xs font-medium text-gray-500">Loading {viewMode} data...</p>
            </div>
          ) : analyticsData && analyticsData.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: viewMode === 'monthly' ? '560px' : '100%', width: '100%' }}>
                <ResponsiveContainer width="100%" height={340}>
                  <RechartsBarChart data={analyticsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                    <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={5} />
                    <YAxis {...EDITORIAL_CHART.yAxisProps} />
                    <Tooltip
                      contentStyle={EDITORIAL_CHART.tooltipStyle}
                      cursor={{ fill: '#F8F9FA' }}
                      formatter={(value: unknown, name: unknown) => [Number(value ?? 0).toLocaleString(), String(name ?? '')]}
                    />
                    <Bar
                      dataKey="received"
                      fill={EDITORIAL_CHART.colors.amber}
                      name="Seedlings Received"
                      radius={[6, 6, 0, 0]}
                      barSize={viewMode === 'monthly' ? 28 : 40}
                    />
                    <Bar
                      dataKey="seedlings"
                      fill={EDITORIAL_CHART.colors.emerald}
                      name="Seedlings Distributed"
                      radius={[6, 6, 0, 0]}
                      barSize={viewMode === 'monthly' ? 28 : 40}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-full mb-3">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-sm text-gray-600">No distribution data available</p>
              <p className="text-xs text-gray-500 mt-1">Distribution data will appear when seedlings are distributed</p>
            </div>
          )}
        </EditorialCard>

        {/* Fiber Delivery Statistics Donut Chart - 1 column */}
        <EditorialCard
          title="Delivery Status"
          subtitle="Track delivery status and performance"
        >
          {fiberDeliveryChartData && fiberDeliveryChartData.length > 0 && fiberDeliveryChartData[0].name !== 'No Deliveries' ? (
            <>
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie
                      data={fiberDeliveryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={4}
                      dataKey="value"
                      cornerRadius={6}
                      strokeWidth={0}
                    >
                      {fiberDeliveryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={EDITORIAL_CHART.tooltipStyle}
                      formatter={(value: unknown) => {
                        const num = Number(value ?? 0);
                        const total = fiberDeliveryChartData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = total > 0 ? ((num / total) * 100).toFixed(1) : '0.0';
                        return [`${num} (${percentage}%)`, 'Deliveries'];
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                    {fiberDeliveryStats.total}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium mt-1">Total Deliveries</div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                    <span className="text-xs font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{fiberDeliveryStats.completed}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                    <span className="text-xs font-medium text-gray-700">Delivered</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{fiberDeliveryStats.delivered}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.espresso }} />
                    <span className="text-xs font-medium text-gray-700">In Transit</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{fiberDeliveryStats.inTransit}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.mutedSlate }} />
                    <span className="text-xs font-medium text-gray-700">Cancelled</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 tabular-nums">{fiberDeliveryStats.cancelled}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#EAF6F0] border border-[#CBEAD9]">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#047857]" />
                    <span className="text-xs font-semibold text-gray-900">Total Fiber</span>
                  </div>
                  <span className="text-xs font-bold text-[#047857] tabular-nums">{fiberDeliveryStats.totalKg.toFixed(2)} kg</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-full mb-3">
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-sm text-gray-600">No delivery data available</p>
              <p className="text-xs text-gray-500 mt-1">Fiber deliveries will appear here</p>
            </div>
          )}
        </EditorialCard>
      </div>

      {/* Recent Activity Table */}
      <EditorialCard
        title="Recent Distributions"
        subtitle="Latest activity logs"
        noPadding
        actions={
          <button
            type="button"
            onClick={() => setCurrentPage('distribution')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] rounded-xl transition-colors"
          >
            View All
          </button>
        }
      >
        {recentDistributions.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">No recent distributions found</p>
          </div>
        ) : (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Recent farmer seedling distributions">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Farmer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Variety</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Quantity</th>
                  <th className="text-center py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentDistributions.map((dist: any, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs flex-shrink-0">
                          {dist.farmer_name ? dist.farmer_name.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">{dist.farmer_name || 'Unknown Farmer'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap tabular-nums">
                      {new Date(dist.distribution_date || dist.date_distributed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 whitespace-nowrap">
                        {dist.variety || 'Abaca'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-gray-900 font-semibold text-right whitespace-nowrap tabular-nums">
                      {dist.quantity_distributed?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <StatusPill tone={getDistributionTone(dist.status)}>
                        {dist.status ? dist.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Distributed'}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </EditorialCard>
    </div>
  );

  const cusafaPages = {
    analytics: () => renderAnalytics(),
    inventory: () => <AssociationInventory />,
    'fiber-inventory': () => <CUSAFAInventory />,
    'fiber-deliveries': () => <CUSAFAFiberDeliveries />,
    distribution: () => <AssociationSeedlingDistribution />,
    'buyer-prices': () => <BuyerPriceListingsViewer userRole="cusafa" />,
    profile: () => (
      <AssociationProfile
        onBack={() => setCurrentPage('overview')}
        onEditProfile={() => setCurrentPage('edit-profile')}
      />
    ),
    'edit-profile': () => (
      <EditAssociationProfile onBack={() => setCurrentPage('profile')} />
    ),
    'change-password': () => (
      <ChangePassword onBack={() => setCurrentPage('profile')} />
    ),
  };

  const renderContent = () => (
    <>
      <div
        className={currentPage === 'overview' ? 'block' : 'hidden'}
        aria-hidden={currentPage !== 'overview'}
      >
        {loadingStats ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-2 border-gray-200 border-t-[#047857] rounded-full animate-spin" />
              <span className="text-sm text-gray-500 mt-3">Loading dashboard insights...</span>
            </div>
          </div>
        ) : (
          renderOverview()
        )}
      </div>
      <KeepAlivePages
        activeId={currentPage}
        noKeepAlive={['edit-profile', 'change-password']}
        pages={cusafaPages}
      />
    </>
  );

  const pageMeta: Record<DashboardPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Overview',
      subtitle: 'Monitor seedling inventory, farmer distributions, and fiber deliveries.',
    },
    analytics: {
      title: 'Analytics Dashboard',
      subtitle: 'Track fiber deliveries, seedling distributions, and performance metrics over time.',
    },
    inventory: {
      title: 'Seedling Inventory',
      subtitle: 'Manage seedling allocations received from MAO and distribute to farmers.',
    },
    distribution: {
      title: 'Farmer Distribution',
      subtitle: 'Track seedling distributions and planting status across member farmers.',
    },
    'fiber-inventory': {
      title: 'Fiber Inventory',
      subtitle: 'Review harvested dry fiber stock ready for buyer delivery.',
    },
    'fiber-deliveries': {
      title: 'Fiber Deliveries',
      subtitle: 'Monitor active, delivered, and completed fiber shipments.',
    },
    'buyer-prices': {
      title: 'Buyer Price Listings',
      subtitle: 'Current buying prices published by registered fiber buyers.',
    },
    profile: {
      title: 'Association Profile',
      subtitle: 'Officer credentials and association membership details.',
    },
    'edit-profile': {
      title: 'Edit Profile',
      subtitle: 'Update officer details, profile photo, and valid ID.',
    },
    'change-password': {
      title: 'Change Password',
      subtitle: 'Update your account password and security settings.',
    },
  };

  const activeMeta = pageMeta[currentPage] || pageMeta.overview;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <EditorialShell
      brandTitle="CUSAFA Association"
      brandSubtitle="Association portal"
      navItems={editorialNavItems}
      activeNavId={currentPage}
      onSelectNav={(id) => {
        setCurrentPage(id as DashboardPage);
        setShowProfileDropdown(false);
        setShowNotifications(false);
      }}
      pageTitle={activeMeta.title}
      pageSubtitle={activeMeta.subtitle}
      unreadCount={unreadNotificationsCount}
      showNotifications={showNotifications}
      onToggleNotifications={() => setShowNotifications(!showNotifications)}
      notificationContent={
        <div>
          <div className="px-4 py-3 border-b border-gray-200 bg-[#FAFAFA] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <p className="text-[11px] text-gray-500">Recent activity updates</p>
            </div>
            <button
              type="button"
              onClick={() => setShowNotifications(false)}
              aria-label="Close notifications"
              className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {notif.type === 'seedling' ? (
                          <Sprout className="w-4 h-4 text-[#047857]" />
                        ) : notif.type === 'fiber' ? (
                          <Truck className="w-4 h-4 text-[#E59500]" />
                        ) : (
                          <Share2 className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
      profileName={officerProfile?.full_name || user?.fullName || 'Association Officer'}
      profileRole={officerProfile?.association_name || officerProfile?.position || user?.associationName || 'CUSAFA Officer'}
      profileAvatar={officerProfile?.profile_picture || null}
      showProfileMenu={showProfileDropdown}
      onToggleProfileMenu={() => setShowProfileDropdown(!showProfileDropdown)}
      profileMenuContent={
        <div className="py-1.5">
          <div className="px-3.5 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {officerProfile?.full_name || user?.fullName || 'Association Officer'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {officerProfile?.position || 'Officer'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProfileDropdown(false);
              setCurrentPage('profile');
            }}
            className="w-full px-3.5 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 text-xs font-medium text-gray-700"
          >
            <User className="w-3.5 h-3.5 text-gray-500" />
            View Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setShowProfileDropdown(false);
              setCurrentPage('edit-profile');
            }}
            className="w-full px-3.5 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 text-xs font-medium text-gray-700"
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setShowProfileDropdown(false);
              setCurrentPage('change-password');
            }}
            className="w-full px-3.5 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 text-xs font-medium text-gray-700"
          >
            <KeyRound className="w-3.5 h-3.5 text-gray-500" />
            Change Password
          </button>
        </div>
      }
      onLogout={onLogout}
      logoutLabel="Sign out"
    >
      {renderContent()}
    </EditorialShell>
  );
};

export default CUSAFADashboard;
