import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Share2,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sprout,
  Layers,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShieldCheck,
  Truck,
  Bell,
  LineChart,
  Activity,
  Users,
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

type DashboardPage = 'overview' | 'inventory' | 'distribution' | 'reports' | 'fiber-inventory' | 'buyer-prices' | 'fiber-deliveries' | 'analytics';

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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const [deliveryStatusData, setDeliveryStatusData] = useState<DeliveryStatusData[]>([]);

  const [totalFiberKg, setTotalFiberKg] = useState(0);
  const [totalSeedlingsDistributed, setTotalSeedlingsDistributed] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    loadDashboardStats();
    loadNotifications();
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [viewMode, selectedYear]);

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
        fetch('http://localhost:3001/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/association-seedlings/association/farmer-distributions', {
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

      const seedlingRes = await fetch('http://localhost:3001/api/association-seedlings/association/farmer-distributions', {
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

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const [seedlingRes, receivedRes] = await Promise.all([
        fetch('http://localhost:3001/api/association-seedlings/association/farmer-distributions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const seedlingData = seedlingRes.ok ? await seedlingRes.json() : [];
      const receivedData = receivedRes.ok ? await receivedRes.json() : [];

      const distributions = Array.isArray(seedlingData) ? seedlingData : [];
      const receivedSeedlings = Array.isArray(receivedData) ? receivedData : [];

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

        setAnalyticsData(Object.values(yearlyData));
      }

      setTotalDeliveries(distributions.length);

      // Calculate Distribution Status for Pie Chart (Seedlings)
      const totalReceived = stats.totalReceivedQuantity;
      const totalDistributed = stats.totalDistributedQuantity;
      const totalAvailable = stats.totalAvailableQuantity;

      const statusChartData: DeliveryStatusData[] = [
        { name: 'Distributed', value: totalDistributed, fill: '#8b5cf6' },
        { name: 'Available', value: totalAvailable, fill: '#10b981' },
        { name: 'Received', value: totalReceived - totalDistributed - totalAvailable, fill: '#f59e0b' },
      ].filter(item => item.value > 0);

      // If no data, show placeholder
      if (statusChartData.length === 0 || totalReceived === 0) {
        statusChartData.push({ name: 'No Data', value: 1, fill: '#e2e8f0' });
      }

      setDeliveryStatusData(statusChartData);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const navItems: { id: DashboardPage; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Seedling Inventory', icon: Sprout },
    { id: 'fiber-inventory', label: 'Fiber Inventory', icon: Package },
    { id: 'fiber-deliveries', label: 'Fiber Deliveries', icon: Truck },
    { id: 'distribution', label: 'Distribution', icon: Share2 },
    { id: 'buyer-prices', label: 'Buyer Prices', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
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
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-100 bg-white/10 w-fit px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              <Sprout className="w-3 h-3" />
              <span>CUSAFA Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {user?.fullName || 'Officer'}</h1>
            <p className="mt-2 text-emerald-50 max-w-xl text-lg opacity-90">
              Here's what's happening in your fiber supply chain today.
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl"></div>
      </div>

      {/* KPI Cards - 4 Cards in Row with Gradient Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Seedlings Received */}
        <div className="group bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-blue-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +{stats.totalReceivedCount}
            </span>
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
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +{stats.totalFarmerDistributions}
            </span>
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
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {stats.plantingRate.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Planting Progress</p>
          <p className="text-4xl font-bold text-gray-900 mb-1">{stats.plantedQuantity.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{stats.plantingRate.toFixed(1)}% planted</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Seedling Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Seedling Distributions</h3>
              <p className="text-sm text-gray-500 mt-1">Monthly distribution trends to farmers</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${viewMode === 'monthly' ? 'text-white bg-emerald-600 shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${viewMode === 'yearly' ? 'text-white bg-emerald-600 shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RechartsBarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '11px' }}
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
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="received" fill="#3b82f6" name="Seedlings Received" radius={[6, 6, 0, 0]} barSize={20} />
              <Bar dataKey="seedlings" fill="#10b981" name="Seedlings Distributed" radius={[6, 6, 0, 0]} barSize={20} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Column - Distribution Status Pie Chart */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Distribution Status</h3>
            <p className="text-sm text-gray-500 mt-1">Seedling distribution breakdown</p>
          </div>
          
          {/* Pie Chart with Center Label */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={240}>
              <RechartsPieChart>
                <Pie
                  data={deliveryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={8}
                  strokeWidth={0}
                >
                  {deliveryStatusData.map((entry, index) => (
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
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
              <div className="text-4xl font-bold text-purple-600">
                {stats.totalReceivedQuantity.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1">Total Seedlings</div>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="mt-6 space-y-3">
            {deliveryStatusData.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-gray-50"
                style={{ backgroundColor: `${item.fill}10` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: item.fill }}>
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Distributions</h3>
            <p className="text-sm text-gray-500 mt-1">Latest activity logs</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Farmer</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Variety</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Quantity</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDistributions.length > 0 ? (
                recentDistributions.map((dist: any, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          {dist.farmer_name ? dist.farmer_name.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{dist.farmer_name || 'Unknown Farmer'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(dist.distribution_date || dist.date_distributed).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {dist.variety || 'Abaca'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-semibold text-right">
                      {dist.quantity_distributed}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${!dist.status || dist.status.includes('distributed')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {dist.status ? dist.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Distributed'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No recent distributions found
                  </td>
                </tr>
              )}
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
            <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">CUSAFA Center</h1>
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
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">CUSAFA Dashboard</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">
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
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-y-auto">
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                    {(user?.fullName || 'CU')
                      .split(' ')
                      .map((part: string) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'CUSAFA Officer'}</p>
                    <p className="text-xs text-gray-500">{user?.associationName || 'Central Union'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-900">{user?.fullName || 'CUSAFA Officer'}</p>
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
