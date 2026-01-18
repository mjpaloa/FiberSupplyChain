import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Building2,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { getApiUrl } from '../../config/api';

import RegistrationTrendsChart from './RegistrationTrendsChart';

// Add CSS animations for charts
const chartAnimations = `
  @keyframes barGrow {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = chartAnimations;
  document.head.appendChild(styleSheet);
}

interface UserStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  totalCusafa: number;
  totalMao: number;
  recentUsers: Array<{
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
}


interface MonthlyData {
  month: string;
  year: number;
  farmers: number;
  buyers: number;
  cusafa: number;
  mao: number;
}

const UserAnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [allMonthlyData, setAllMonthlyData] = useState<MonthlyData[]>([]); // Store all data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchUserStats();
  }, []);

  // Filter data when selectedYear changes
  useEffect(() => {
    if (allMonthlyData.length > 0) {
      if (selectedYear === 0) {
        // Show all years
        setMonthlyData(allMonthlyData);
      } else {
        // Filter by specific year
        const filteredData = allMonthlyData.filter(d => d.year === selectedYear);
        setMonthlyData(filteredData);
      }
    }
  }, [selectedYear, allMonthlyData]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(getApiUrl('/api/admin/users-report'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User stats data received:', data);
        setStats(data);

        // Use monthly trends data from backend
        if (data.monthlyTrends && Array.isArray(data.monthlyTrends)) {
          console.log('📊 Monthly trends data received:', data.monthlyTrends);
          const trendsData = data.monthlyTrends as MonthlyData[];
          setAllMonthlyData(trendsData);

          // Extract unique years and sort
          const yearValues = trendsData.map(d => d.year);
          const uniqueYears = new Set<number>(yearValues);
          const years = Array.from(uniqueYears).sort((a, b) => b - a);
          setAvailableYears(years);

          // Filter by selected year
          const filteredData = trendsData.filter(d => d.year === selectedYear);
          setMonthlyData(filteredData);
        } else {
          // Fallback: Generate empty monthly data if backend doesn't provide it
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const currentYear = new Date().getFullYear();
          const monthlyStats = months.map((month) => ({
            month,
            year: currentYear,
            farmers: 0,
            buyers: 0,
            cusafa: 0,
            mao: 0,
          }));
          setMonthlyData(monthlyStats);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Failed to fetch user statistics (Status ${response.status})`);
        console.error('❌ Failed to fetch user stats:', response.status, errData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching user stats:', error);
      setError(error.message || 'An unexpected error occurred while loading statistics.');
    } finally {
      setLoading(false);
    }
  };

  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  // Aggregate data by year for yearly view
  const yearlyData = React.useMemo(() => {
    const yearlyAgg: { [key: number]: { year: number; farmers: number; buyers: number; cusafa: number; mao: number } } = {};

    allMonthlyData.forEach(d => {
      if (!yearlyAgg[d.year]) {
        yearlyAgg[d.year] = { year: d.year, farmers: 0, buyers: 0, cusafa: 0, mao: 0 };
      }
      yearlyAgg[d.year].farmers += d.farmers;
      yearlyAgg[d.year].buyers += d.buyers;
      yearlyAgg[d.year].cusafa += d.cusafa;
      yearlyAgg[d.year].mao += d.mao;
    });

    return Object.values(yearlyAgg).sort((a, b) => a.year - b.year);
  }, [allMonthlyData]);

  // Get the appropriate data based on view mode
  const displayData = viewMode === 'yearly' ? yearlyData : monthlyData;

  // Calculate percentages for the pie chart
  const totalUsersForPie = (stats?.totalFarmers || 0) + (stats?.totalBuyers || 0) + (stats?.totalCusafa || 0) + (stats?.totalMao || 0);
  const farmersPercentage = totalUsersForPie > 0 ? Math.round(((stats?.totalFarmers || 0) / totalUsersForPie) * 100) : 0;
  const buyersPercentage = totalUsersForPie > 0 ? Math.round(((stats?.totalBuyers || 0) / totalUsersForPie) * 100) : 0;
  const cusafaPercentage = totalUsersForPie > 0 ? Math.round(((stats?.totalCusafa || 0) / totalUsersForPie) * 100) : 0;
  const maoPercentage = totalUsersForPie > 0 ? Math.round(((stats?.totalMao || 0) / totalUsersForPie) * 100) : 0;

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
        <div className="p-6 bg-red-50 rounded-full mb-6">
          <Users className="w-12 h-12 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-500 mb-8 max-w-md text-center">{error || 'Unable to load user statistics at this time.'}</p>
        <button
          onClick={fetchUserStats}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Users Analytics</h2>
          <p className="text-gray-600">Overview of system users and registration trends</p>
        </div>
        <button
          onClick={fetchUserStats}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Total Users</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalUsers || 0}</p>
          <p className="text-white/70 text-xs">All registered users</p>
        </div>

        {/* Farmers */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <UserPlus className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Farmers</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalFarmers || 0}</p>
          <p className="text-white/70 text-xs">Registered farmers</p>
        </div>

        {/* Buyers */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShoppingCart className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">Buyers</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalBuyers || 0}</p>
          <p className="text-white/70 text-xs">Active buyers</p>
        </div>

        {/* CUSAFA Coordinators */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">CUSAFA</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalCusafa || 0}</p>
          <p className="text-white/70 text-xs">Association coordinators</p>
        </div>

        {/* MAO Coordinators */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">MAO</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalMao || 0}</p>
          <p className="text-white/70 text-xs">Municipal coordinators</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Monthly Registration Chart - Now using Recharts */}
        <div className="lg:col-span-2 h-full">
          <RegistrationTrendsChart
            data={monthlyData}
            availableYears={availableYears}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            viewMode={viewMode}
            setViewMode={setViewMode}
            yearlyData={yearlyData}
          />
        </div>

        {/* User Composition Pie Chart - Enhanced to match height */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 flex flex-col h-full transition-all duration-300">
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">User Composition</h3>
            <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Breakdown by user roles</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center min-h-[350px]">
            {/* Enhanced Pie Chart with SVG */}
            <div className="relative w-80 h-80 group">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                {(() => {
                  const circumference = 2 * Math.PI * 40;
                  const total = (stats.totalFarmers || 0) + (stats.totalBuyers || 0) + (stats.totalCusafa || 0) + (stats.totalMao || 0);

                  if (total === 0) return <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="16" />;

                  const farmersPercent = (stats.totalFarmers / total) * 100;
                  const buyersPercent = (stats.totalBuyers / total) * 100;
                  const cusafaPercent = (stats.totalCusafa / total) * 100;
                  const maoPercent = (stats.totalMao / total) * 100;

                  const farmersDash = (farmersPercent / 100) * circumference;
                  const buyersDash = (buyersPercent / 100) * circumference;
                  const cusafaDash = (cusafaPercent / 100) * circumference;
                  const maoDash = (maoPercent / 100) * circumference;

                  return (
                    <>
                      {/* Farmers segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#farmersGradient)"
                        strokeWidth="16"
                        strokeDasharray={`${farmersDash} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* Buyers segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#buyersGradient)"
                        strokeWidth="16"
                        strokeDasharray={`${buyersDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* CUSAFA segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#cusafaGradient)"
                        strokeWidth="16"
                        strokeDasharray={`${cusafaDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash + buyersDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* MAO segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#maoGradient)"
                        strokeWidth="16"
                        strokeDasharray={`${maoDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash + buyersDash + cusafaDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* Gradients */}
                      <defs>
                        <linearGradient id="farmersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="buyersGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="cusafaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                        <linearGradient id="maoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fb7185" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>

              {/* Center text - Enhanced */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-black bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">{totalUsersForPie}</div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">Total Users</div>
              </div>
            </div>
          </div>

          {/* Legend - Enhanced */}
          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="flex flex-col p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:bg-white hover:scale-105 transition-all duration-300">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Farmers</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-900">{farmersPercentage}%</span>
                <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{stats.totalFarmers}</span>
              </div>
            </div>
            <div className="flex flex-col p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:bg-white hover:scale-105 transition-all duration-300">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Buyers</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-blue-900">{buyersPercentage}%</span>
                <span className="text-xs font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{stats.totalBuyers}</span>
              </div>
            </div>
            <div className="flex flex-col p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:bg-white hover:scale-105 transition-all duration-300">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">CUSAFA</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-900">{cusafaPercentage}%</span>
                <span className="text-xs font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{stats.totalCusafa}</span>
              </div>
            </div>
            <div className="flex flex-col p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:bg-white hover:scale-105 transition-all duration-300">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">MAO</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-rose-900">{maoPercentage}%</span>
                <span className="text-xs font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full shadow-sm">{stats.totalMao}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table - Enhanced */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-bold text-gray-900">Recent Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(stats.recentUsers || []).map((user, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${user.role === 'farmer' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                        user.role === 'buyer' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          user.role === 'officer' ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-gradient-to-br from-purple-400 to-purple-600'
                        }`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${user.role === 'farmer' ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' :
                      user.role === 'buyer' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                        user.role === 'officer' ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800' : 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800'
                      }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm bg-gradient-to-r from-green-100 to-emerald-200 text-green-800">
                      Active
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
};

export default UserAnalyticsDashboard;
