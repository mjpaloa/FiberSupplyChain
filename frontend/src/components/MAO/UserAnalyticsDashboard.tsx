import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Building2,
  RefreshCw
} from 'lucide-react';

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
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/admin/users-report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
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
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
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

  // Calculate max value for chart scaling (use 1 as minimum to avoid division by zero)
  const maxValue = Math.max(1, ...displayData.map(d => d.farmers + d.buyers + d.cusafa + d.mao));

  // Calculate percentages for pie chart
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

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Unable to load user statistics</p>
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

        {/* CUSAFA Officers */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">CUSAFA</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalCusafa || 0}</p>
          <p className="text-white/70 text-xs">Association officers</p>
        </div>

        {/* MAO Officers */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="text-white" size={24} />
            </div>
          </div>
          <p className="text-white/90 text-sm font-medium mb-1">MAO</p>
          <p className="text-4xl font-bold text-white mb-2">{stats.totalMao || 0}</p>
          <p className="text-white/70 text-xs">Municipal officers</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Registration Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">User Registration Trends</h3>
            <div className="flex gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">Farmers</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">Buyers</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">CUSAFA</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-gray-600">MAO</span>
              </div>
            </div>
          </div>
          
          {/* View Mode Selector */}
          <div className="mb-4 flex items-center gap-4 flex-wrap border-b border-gray-200 pb-4">
            <span className="text-sm font-semibold text-gray-700">View:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'monthly'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                📅 Monthly
              </button>
              <button
                onClick={() => setViewMode('yearly')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'yearly'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                📊 Yearly
              </button>
            </div>
          </div>

          {/* Year Filter Buttons - Only show in Monthly mode */}
          {viewMode === 'monthly' && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Select Year:</span>
              <button
                onClick={() => {
                  setMonthlyData(allMonthlyData);
                  setSelectedYear(0);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedYear === 0
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Months
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedYear === year
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {year}
                </button>
              ))}
              {availableYears.length === 0 && (
                <span className="text-sm text-gray-400">No data available</span>
              )}
            </div>
          )}

          {/* Bar Chart */}
          <div className="relative h-64">
            {/* Empty state message */}
            {displayData.every(d => d.farmers === 0 && d.buyers === 0 && d.cusafa === 0 && d.mao === 0) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No registration data available for the selected period</p>
              </div>
            )}
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {displayData.map((data, index) => {
                const total = data.farmers + data.buyers + data.cusafa + data.mao;
                // Ensure minimum height of 8% when there's data, otherwise scale normally
                const scaledHeight = (total / maxValue) * 100;
                const totalHeight = total > 0 ? Math.max(scaledHeight, 8) : 0;
                const farmersHeight = total > 0 ? (data.farmers / total) * 100 : 0;
                const buyersHeight = total > 0 ? (data.buyers / total) * 100 : 0;
                const cusafaHeight = total > 0 ? (data.cusafa / total) * 100 : 0;
                const maoHeight = total > 0 ? (data.mao / total) * 100 : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full rounded-t-lg overflow-hidden relative group cursor-pointer"
                      style={{ height: `${totalHeight}%`, minHeight: total > 0 ? '20px' : '0' }}
                    >
                      {/* Stacked bars - 4 categories */}
                      <div 
                        className="absolute bottom-0 w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                        style={{ height: `${farmersHeight}%` }}
                        title={`Farmers: ${data.farmers}`}
                      ></div>
                      <div 
                        className="absolute w-full bg-blue-500 hover:bg-blue-600 transition-colors"
                        style={{ bottom: `${farmersHeight}%`, height: `${buyersHeight}%` }}
                        title={`Buyers: ${data.buyers}`}
                      ></div>
                      <div 
                        className="absolute w-full bg-amber-500 hover:bg-amber-600 transition-colors"
                        style={{ bottom: `${farmersHeight + buyersHeight}%`, height: `${cusafaHeight}%` }}
                        title={`CUSAFA: ${data.cusafa}`}
                      ></div>
                      <div 
                        className="absolute top-0 w-full bg-rose-500 hover:bg-rose-600 transition-colors"
                        style={{ height: `${maoHeight}%` }}
                        title={`MAO: ${data.mao}`}
                      ></div>
                      
                      {/* Tooltip on hover */}
                      {total > 0 && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {total}
                        </div>
                      )}
                    </div>
                    {/* Label - shows differently based on view mode */}
                    <div className="flex flex-col items-center">
                      {viewMode === 'yearly' ? (
                        <span className="text-sm text-gray-700 font-bold">{data.year}</span>
                      ) : (
                        <>
                          <span className="text-xs text-gray-700 font-semibold">{(data as any).month || ''}</span>
                          <span className="text-[11px] text-gray-500 font-medium">{data.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Composition Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-6">User Composition</h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              {/* SVG Donut Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="20"
                />
                
                {/* Farmers segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray={`${farmersPercentage * 2.51} 251`}
                  strokeDashoffset="0"
                />
                
                {/* Buyers segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="20"
                  strokeDasharray={`${buyersPercentage * 2.51} 251`}
                  strokeDashoffset={`-${farmersPercentage * 2.51}`}
                />
                
                {/* CUSAFA segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray={`${cusafaPercentage * 2.51} 251`}
                  strokeDashoffset={`-${(farmersPercentage + buyersPercentage) * 2.51}`}
                />
                
                {/* MAO segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="20"
                  strokeDasharray={`${maoPercentage * 2.51} 251`}
                  strokeDashoffset={`-${(farmersPercentage + buyersPercentage + cusafaPercentage) * 2.51}`}
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-800">{totalUsersForPie}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">Farmers</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{farmersPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Buyers</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{buyersPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-600">CUSAFA</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{cusafaPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-gray-600">MAO</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{maoPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Recent Registrations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(stats.recentUsers || []).map((user, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        user.role === 'farmer' ? 'bg-emerald-500' :
                        user.role === 'buyer' ? 'bg-blue-500' :
                        user.role === 'officer' ? 'bg-amber-500' : 'bg-purple-500'
                      }`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'farmer' ? 'bg-emerald-100 text-emerald-800' :
                      user.role === 'buyer' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'officer' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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
