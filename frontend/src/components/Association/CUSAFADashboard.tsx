import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Share2,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sprout,
  Layers,
  TrendingUp,
  Truck,
  Bell,
  Activity,
  CheckCircle
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
import AssociationInventory from './AssociationInventory';
import AssociationSeedlingDistribution from './AssociationSeedlingDistribution';
import CUSAFAInventory from '../MAO/CUSAFAInventory';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';
import CUSAFAFiberDeliveries from './CUSAFAFiberDeliveries';

type DashboardPage = 'overview' | 'inventory' | 'distribution' | 'fiber-inventory' | 'buyer-prices' | 'fiber-deliveries' | 'analytics';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<DashboardPage>('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  useEffect(() => {
    loadDashboardStats();
    loadNotifications();
    loadFiberDeliveryStats();
  }, []);

  // Load raw data only once on mount
  useEffect(() => {
    loadRawSeedlingData();
  }, []);

  // Transform cached data when view mode changes (instant)
  useEffect(() => {
    if (cachedDistributions.length > 0 || cachedReceivedSeedlings.length > 0) {
      transformAnalyticsData();
    }
  }, [viewMode, selectedYear, cachedDistributions, cachedReceivedSeedlings]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoadingStats(false);
        return;
      }

      const [associationRes, farmerRes] = await Promise.all([
        fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/farmer-distributions', {
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
        const sorted = [...farmerData].sort((a: any, b: any) =>
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

      const seedlingRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/farmer-distributions', {
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

      const response = await fetch('https://easyabaca-api.vercel.app/api/fiber-deliveries/all', {
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
        if (stats.completed > 0) chartData.push({ name: 'Completed', value: stats.completed, fill: '#10b981' });
        if (stats.delivered > 0) chartData.push({ name: 'Delivered', value: stats.delivered, fill: '#3b82f6' });
        if (stats.inTransit > 0) chartData.push({ name: 'In Transit', value: stats.inTransit, fill: '#f59e0b' });
        if (stats.cancelled > 0) chartData.push({ name: 'Cancelled', value: stats.cancelled, fill: '#ef4444' });
        
        if (chartData.length === 0) {
          chartData.push({ name: 'No Deliveries', value: 1, fill: '#e5e7eb' });
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
        const seedlingRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/farmer-distributions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (seedlingRes.ok) {
          seedlingData = await seedlingRes.json();
        }
      } catch (err) {
        console.warn('Failed to fetch farmer distributions:', err);
      }

      try {
        const receivedRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/association/received', {
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
        statusChartData.push({ name: 'Distributed', value: totalDistributed, fill: '#10b981' });
      }
      if (totalAvailable > 0) {
        statusChartData.push({ name: 'Available', value: totalAvailable, fill: '#8b5cf6' });
      }
      
      // Count planted seedlings
      const plantedCount = distributions.filter((d: any) => 
        d.status && d.status.toLowerCase().includes('plant')
      ).reduce((sum: number, d: any) => sum + (d.quantity_distributed || 0), 0);
      
      if (plantedCount > 0) {
        statusChartData.push({ name: 'Planted', value: plantedCount, fill: '#3b82f6' });
      }

      // If no data, show placeholder
      if (statusChartData.length === 0) {
        statusChartData.push({ name: 'No Data', value: 1, fill: '#e2e8f0' });
      }

      console.log('📊 Pie Chart Data:', statusChartData);
      setDeliveryStatusData(statusChartData);
  };

  const navItems: { id: DashboardPage; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Seedling Inventory', icon: Sprout },
    { id: 'distribution', label: 'Distribution', icon: Share2 },
    { id: 'fiber-inventory', label: 'Fiber Inventory', icon: Package },
    { id: 'fiber-deliveries', label: 'Fiber Deliveries', icon: Truck },
    { id: 'buyer-prices', label: 'Buyer Prices', icon: TrendingUp },
  ];

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-100">Performance Analytics</p>
            <h2 className="text-3xl font-bold mt-1">Data Insights & Trends</h2>
            <p className="mt-2 text-emerald-50 max-w-2xl">
              Track fiber deliveries, seedling distributions, and performance metrics over time
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${viewMode === 'monthly'
                ? 'bg-white text-emerald-600'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${viewMode === 'yearly'
                ? 'bg-white text-emerald-600'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              Yearly
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Truck className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 text-white/70" />
          </div>
          <p className="text-sm text-blue-100 uppercase tracking-wide">Total Fiber Deliveries</p>
          <p className="text-4xl font-bold mt-2">{totalFiberKg.toFixed(2)} kg</p>
          <p className="text-xs text-blue-100 mt-2">{totalDeliveries} deliveries</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Sprout className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 text-white/70" />
          </div>
          <p className="text-sm text-emerald-100 uppercase tracking-wide">Total Seedlings Distributed</p>
          <p className="text-4xl font-bold mt-2">{totalSeedlingsDistributed.toLocaleString()}</p>
          <p className="text-xs text-emerald-100 mt-2">To farmers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Activity className="w-8 h-8" />
            </div>
            <TrendingUp className="w-6 h-6 text-white/70" />
          </div>
          <p className="text-sm text-purple-100 uppercase tracking-wide">Active Period</p>
          <p className="text-4xl font-bold mt-2">{viewMode === 'monthly' ? selectedYear : '5 Years'}</p>
          <p className="text-xs text-purple-100 mt-2">{viewMode === 'monthly' ? '12 months' : 'Historical data'}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Fiber Deliveries (kg)</h3>
            <p className="text-sm text-gray-500">Track total fiber weight delivered over time</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analyticsData}>
            <defs>
              <linearGradient id="colorFiber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="period" stroke="#9ca3af" axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="fiberKg"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorFiber)"
              name="Fiber (kg)"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Seedling Distributions</h3>
            <p className="text-sm text-gray-500">Monitor seedling distribution to farmers</p>
          </div>
          <div className="p-3 bg-emerald-100 rounded-2xl">
            <Sprout className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="period" stroke="#9ca3af" axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="seedlings" fill="#10b981" name="Seedlings Distributed" radius={[8, 8, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Delivery Count</h3>
            <p className="text-sm text-gray-500">Number of fiber deliveries per period</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-2xl">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="period" stroke="#9ca3af" axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="deliveries"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="Deliveries"
              dot={{ fill: '#8b5cf6', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">

      {/* KPI Cards - 4 Cards in Row with Gradient Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Seedlings Received */}
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Seedlings Received</p>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalReceivedQuantity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">From MAO distributions</p>
        </div>

        {/* Card 2: Distributed */}
        <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-emerald-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Share2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Seedlings Distributed</p>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalDistributedQuantity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">To {stats.totalFarmerDistributions} farmers</p>
        </div>

        {/* Card 3: Inventory */}
        <div className="group bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-purple-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-6 h-6 text-white" />
            </div>
            {stats.totalAvailableQuantity === 0 ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Complete
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                Available
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Inventory Remaining</p>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats.totalAvailableQuantity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{stats.totalAvailableQuantity === 0 ? 'Fully distributed' : 'Ready for distribution'}</p>
        </div>

        {/* Card 4: Planting Progress */}
        <div className="group bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-teal-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-teal-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Sprout className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Planting Progress</p>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats.plantedQuantity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{stats.plantingRate.toFixed(1)}% planted</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {/* Seedling Distributions Bar Chart - 2 columns */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300">
        <div className="mb-4">
          {/* Header with title and buttons */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div className="flex-1">
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                Seedling Distributions
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Monthly distribution trends to farmers</p>
            </div>
            
            {/* Toggle buttons and icon */}
            <div className="flex items-center gap-3 ml-5 sm:ml-0">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all duration-200 ${viewMode === 'monthly'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setViewMode('yearly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all duration-200 ${viewMode === 'yearly'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yearly
                </button>
              </div>
              <div className="hidden md:block p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
                <Sprout className="text-emerald-600" size={28} />
              </div>
            </div>
          </div>

          {/* Data Insights Badges */}
          <div className="flex flex-wrap items-center gap-2 ml-5 md:ml-7">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-semibold text-emerald-700">Distributed</span>
              <span className="text-xs font-black text-emerald-900">
                {analyticsData.reduce((sum, d) => sum + d.seedlings, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-700">Received</span>
              <span className="text-xs font-black text-blue-900">
                {analyticsData.reduce((sum, d) => sum + d.received, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {loadingChart ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-sm font-medium text-gray-600">Loading {viewMode} data...</p>
          </div>
        ) : analyticsData && analyticsData.length > 0 ? (
          <div className="w-full">
            <div className="overflow-x-auto">
              <div style={{ minWidth: viewMode === 'monthly' ? '600px' : '100%', width: '100%' }}>
              <ResponsiveContainer width="100%" height={380}>
                <RechartsBarChart data={analyticsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="period"
                    stroke="#374151"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#374151"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="received" fill="#3b82f6" name="Seedlings Received" radius={[6, 6, 0, 0]} barSize={viewMode === 'monthly' ? 35 : 45} />
                  <Bar dataKey="seedlings" fill="#10b981" name="Seedlings Distributed" radius={[6, 6, 0, 0]} barSize={viewMode === 'monthly' ? 35 : 45} />
                </RechartsBarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="p-6 bg-gray-100 rounded-full mb-4">
              <Activity className="w-12 h-12 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No distribution data available</p>
            <p className="text-sm text-gray-400 mt-2">Distribution data will appear when seedlings are distributed</p>
          </div>
        )}
        </div>

        {/* Fiber Delivery Statistics Donut Chart - 1 column */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300">
          <div className="mb-6">
            <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
              <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              Delivery Status
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Track delivery status and performance</p>
          </div>

          {fiberDeliveryChartData && fiberDeliveryChartData.length > 0 && fiberDeliveryChartData[0].name !== 'No Deliveries' ? (
            <>
              {/* Donut Chart */}
              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <RechartsPieChart>
                    <Pie
                      data={fiberDeliveryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      cornerRadius={8}
                      strokeWidth={0}
                    >
                      {fiberDeliveryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px'
                      }}
                      formatter={(value: number) => {
                        const total = fiberDeliveryChartData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return [`${value} (${percentage}%)`, ''];
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
                  <div className="text-3xl font-bold text-blue-600">
                    {fiberDeliveryStats.total}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1">Total Deliveries</div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{fiberDeliveryStats.completed}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-gray-700">Delivered</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{fiberDeliveryStats.delivered}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium text-gray-700">In Transit</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">{fiberDeliveryStats.inTransit}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-medium text-gray-700">Cancelled</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{fiberDeliveryStats.cancelled}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border-t-2 border-purple-200">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-900">Total Fiber</span>
                  </div>
                  <span className="text-sm font-black text-purple-600">{fiberDeliveryStats.totalKg.toFixed(2)} kg</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <Truck className="w-12 h-12 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No delivery data available</p>
              <p className="text-sm text-gray-400 mt-2">Fiber deliveries will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
              Recent Distributions
            </h3>
            <p className="text-sm text-gray-600 mt-2 ml-5 font-medium">Latest activity logs</p>
          </div>
          <button 
            onClick={() => setCurrentPage('distribution')}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all hover:shadow-lg hover:scale-105 transform duration-200"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Farmer</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="text-left py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Variety</th>
                <th className="text-right py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="text-center py-4 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDistributions.map((dist: any, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-all duration-200 group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                        {dist.farmer_name ? dist.farmer_name.charAt(0).toUpperCase() : 'F'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">{dist.farmer_name || 'Unknown Farmer'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-700">
                    {new Date(dist.distribution_date || dist.date_distributed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                      {dist.variety || 'Abaca'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 font-black text-right">
                    {dist.quantity_distributed?.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                      dist.status?.toLowerCase().includes('planted') 
                        ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200'
                        : !dist.status || dist.status.includes('distributed')
                        ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {dist.status ? dist.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Distributed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );

  const renderContent = () => {
    if (currentPage === 'overview') {
      return loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500 mt-4">Loading dashboard insights...</span>
          </div>
        </div>
      ) : (
        renderOverview()
      );
    }

    if (currentPage === 'analytics') {
      return renderAnalytics();
    }

    if (currentPage === 'inventory') {
      return <AssociationInventory />;
    }

    if (currentPage === 'fiber-inventory') {
      return <CUSAFAInventory />;
    }

    if (currentPage === 'fiber-deliveries') {
      return <CUSAFAFiberDeliveries />;
    }

    if (currentPage === 'distribution') {
      return <AssociationSeedlingDistribution />;
    }

    if (currentPage === 'buyer-prices') {
      return <BuyerPriceListingsViewer userRole="cusafa" />;
    }

    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
        Reports & analytics coming soon.
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : sidebarOpen ? 'w-64' : 'w-20'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        bg-gradient-to-b from-slate-800 to-slate-900 text-white 
        transition-all duration-300 ease-in-out flex flex-col
        fixed md:static h-screen
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-700">
          <div className={`transition-all duration-300 ease-in-out ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>
            <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">Association Center</h1>
            <p className="text-xs text-slate-400 whitespace-nowrap">Seedling Distribution</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 flex-shrink-0 md:block hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 flex-shrink-0 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active ? 'bg-emerald-600' : 'hover:bg-slate-700'
                  } ${!sidebarOpen && 'justify-center'}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600 rounded-lg transition-all duration-200 ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold truncate">Association Dashboard</p>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 truncate">
                {currentPage === 'overview'
                  ? 'Overview'
                  : currentPage === 'analytics'
                    ? 'Analytics Dashboard'
                    : currentPage === 'inventory'
                      ? 'Seedling Inventory'
                      : currentPage === 'fiber-inventory'
                        ? 'Fiber Inventory'
                        : currentPage === 'fiber-deliveries'
                          ? 'Fiber Deliveries'
                          : currentPage === 'distribution'
                            ? 'Farmer Distribution'
                            : currentPage === 'buyer-prices'
                              ? 'Buyer Price Listings'
                              : 'Reports & Analytics'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="fixed sm:absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                      <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
                      <p className="text-xs text-gray-600">Recent activity updates</p>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.type === 'seedling' ? 'bg-emerald-100' :
                                notif.type === 'fiber' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                {notif.type === 'seedling' ? (
                                  <Sprout className={`w-5 h-5 ${notif.type === 'seedling' ? 'text-emerald-600' : ''
                                    }`} />
                                ) : notif.type === 'fiber' ? (
                                  <Truck className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Share2 className="w-5 h-5 text-purple-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                    {(user?.fullName || 'CU')
                      .split(' ')
                      .map((part: string) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'Association Officer'}</p>
                    <p className="text-xs text-gray-500">{user?.associationName || 'Central Union'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-900">{user?.fullName || 'Association Officer'}</p>
                      <p className="text-xs text-gray-600">{user?.associationName || 'Central Union'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CUSAFADashboard;
