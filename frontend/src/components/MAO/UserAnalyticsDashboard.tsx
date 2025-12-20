import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Building2,
  RefreshCw
} from 'lucide-react';

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
      const response = await fetch(`/api/admin/users-report', {
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
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">User Registration Trends</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm"></div>
                <span className="font-semibold text-emerald-700">Farmers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-sm"></div>
                <span className="font-semibold text-blue-700">Buyers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm"></div>
                <span className="font-semibold text-amber-700">CUSAFA</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-sm"></div>
                <span className="font-semibold text-rose-700">MAO</span>
              </div>
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'monthly' | 'yearly')}
                className="text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="monthly">📅 Monthly View</option>
                <option value="yearly">📊 Yearly View</option>
              </select>
            </div>
          </div>

          {/* Year Filter Buttons - Only show in Monthly mode */}
          {viewMode === 'monthly' && (
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Select Year:</span>
              <button
                onClick={() => {
                  setMonthlyData(allMonthlyData);
                  setSelectedYear(0);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedYear === 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Months
              </button>
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedYear === year
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
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

          {/* Enhanced Bar Chart with SVG */}
          <div className="h-80 relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4">
            {(() => {
              const labels = viewMode === 'yearly' 
                ? displayData.map(d => d.year.toString())
                : displayData.map((d: any) => d.month || '');
              
              const dataFarmers = displayData.map(d => d.farmers);
              const dataBuyers = displayData.map(d => d.buyers);
              const dataCusafa = displayData.map(d => d.cusafa);
              const dataMao = displayData.map(d => d.mao);
              
              return (
                <>
                  {/* Empty state message */}
                  {displayData.every(d => d.farmers === 0 && d.buyers === 0 && d.cusafa === 0 && d.mao === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400 text-sm font-medium">No registration data available for the selected period</p>
                    </div>
                  )}

                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-400">
                    <span>{Math.round(maxValue)}</span>
                    <span>{Math.round(maxValue * 0.8)}</span>
                    <span>{Math.round(maxValue * 0.6)}</span>
                    <span>{Math.round(maxValue * 0.4)}</span>
                    <span>{Math.round(maxValue * 0.2)}</span>
                    <span>0</span>
                  </div>

                  {/* Chart Area */}
                  <div className="ml-8 h-full pb-8">
                    <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                      <defs>
                        {/* Gradients for bars */}
                        <linearGradient id="farmersBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id="buyersBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id="cusafaBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id="maoBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      <line x1="0" y1="60" x2="1000" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="0" y1="120" x2="1000" y2="120" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="0" y1="180" x2="1000" y2="180" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="0" y1="240" x2="1000" y2="240" stroke="#f3f4f6" strokeWidth="1" />
                      <line x1="0" y1="300" x2="1000" y2="300" stroke="#e5e7eb" strokeWidth="2" />

                      {/* Dynamic bars based on data */}
                      {labels.map((_, i) => {
                        const barWidth = 1000 / labels.length;
                        const groupX = i * barWidth;
                        const barSpacing = barWidth / 5.5;
                        
                        const farmersHeight = Math.max((dataFarmers[i] / maxValue) * 280, 0);
                        const buyersHeight = Math.max((dataBuyers[i] / maxValue) * 280, 0);
                        const cusafaHeight = Math.max((dataCusafa[i] / maxValue) * 280, 0);
                        const maoHeight = Math.max((dataMao[i] / maxValue) * 280, 0);
                        
                        return (
                          <g key={i}>
                            {/* Farmers bar */}
                            <rect 
                              x={groupX + barSpacing * 0.5} 
                              y={300 - farmersHeight} 
                              width={barSpacing * 0.9} 
                              height={farmersHeight} 
                              fill="url(#farmersBarGradient)" 
                              rx="8" 
                              className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                              style={{ 
                                animation: `barGrow 0.6s ease-out ${i * 0.08}s backwards`,
                                transformOrigin: 'bottom',
                                filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.2))'
                              }}
                            />
                            {dataFarmers[i] > 0 && (
                              <text 
                                x={groupX + barSpacing * 0.95} 
                                y={Math.max(300 - farmersHeight - 10, 15)} 
                                textAnchor="middle" 
                                className="text-xs font-bold fill-emerald-600"
                                style={{ fontSize: '10px' }}
                              >
                                {dataFarmers[i]}
                              </text>
                            )}

                            {/* Buyers bar */}
                            <rect 
                              x={groupX + barSpacing * 1.6} 
                              y={300 - buyersHeight} 
                              width={barSpacing * 0.9} 
                              height={buyersHeight} 
                              fill="url(#buyersBarGradient)" 
                              rx="8" 
                              className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                              style={{ 
                                animation: `barGrow 0.6s ease-out ${i * 0.08 + 0.1}s backwards`,
                                transformOrigin: 'bottom',
                                filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))'
                              }}
                            />
                            {dataBuyers[i] > 0 && (
                              <text 
                                x={groupX + barSpacing * 2.05} 
                                y={Math.max(300 - buyersHeight - 10, 15)} 
                                textAnchor="middle" 
                                className="text-xs font-bold fill-blue-600"
                                style={{ fontSize: '10px' }}
                              >
                                {dataBuyers[i]}
                              </text>
                            )}

                            {/* CUSAFA bar */}
                            <rect 
                              x={groupX + barSpacing * 2.7} 
                              y={300 - cusafaHeight} 
                              width={barSpacing * 0.9} 
                              height={cusafaHeight} 
                              fill="url(#cusafaBarGradient)" 
                              rx="8" 
                              className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                              style={{ 
                                animation: `barGrow 0.6s ease-out ${i * 0.08 + 0.2}s backwards`,
                                transformOrigin: 'bottom',
                                filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.2))'
                              }}
                            />
                            {dataCusafa[i] > 0 && (
                              <text 
                                x={groupX + barSpacing * 3.15} 
                                y={Math.max(300 - cusafaHeight - 10, 15)} 
                                textAnchor="middle" 
                                className="text-xs font-bold fill-amber-600"
                                style={{ fontSize: '10px' }}
                              >
                                {dataCusafa[i]}
                              </text>
                            )}

                            {/* MAO bar */}
                            <rect 
                              x={groupX + barSpacing * 3.8} 
                              y={300 - maoHeight} 
                              width={barSpacing * 0.9} 
                              height={maoHeight} 
                              fill="url(#maoBarGradient)" 
                              rx="8" 
                              className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                              style={{ 
                                animation: `barGrow 0.6s ease-out ${i * 0.08 + 0.3}s backwards`,
                                transformOrigin: 'bottom',
                                filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.2))'
                              }}
                            />
                            {dataMao[i] > 0 && (
                              <text 
                                x={groupX + barSpacing * 4.25} 
                                y={Math.max(300 - maoHeight - 10, 15)} 
                                textAnchor="middle" 
                                className="text-xs font-bold fill-rose-600"
                                style={{ fontSize: '10px' }}
                              >
                                {dataMao[i]}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* X-axis labels */}
                  <div className="ml-8 flex justify-between text-xs text-gray-600 font-medium mt-2">
                    {labels.map((label, i) => (
                      <span key={i} className="flex-1 text-center">
                        {viewMode === 'yearly' ? label : (
                          <>
                            <div className="font-semibold">{label}</div>
                            <div className="text-[10px] text-gray-400">{displayData[i]?.year}</div>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* User Composition Pie Chart */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-8">User Composition</h3>
          
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-64 h-64">
              {/* SVG Donut Chart - Enhanced to match Production Distribution */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="14"
                />
                
                {(() => {
                  const circumference = 251.2;
                  
                  // Calculate dash arrays
                  const farmersDash = (farmersPercentage / 100) * circumference;
                  const buyersDash = (buyersPercentage / 100) * circumference;
                  const cusafaDash = (cusafaPercentage / 100) * circumference;
                  const maoDash = (maoPercentage / 100) * circumference;
                  
                  return (
                    <>
                      {/* Farmers segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#farmersGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${farmersDash} ${circumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                      
                      {/* Buyers segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#buyersGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${buyersDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                      
                      {/* CUSAFA segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#cusafaGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${cusafaDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash + buyersDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                      
                      {/* MAO segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#maoGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${maoDash} ${circumference}`}
                        strokeDashoffset={`-${farmersDash + buyersDash + cusafaDash}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
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
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{totalUsersForPie}</div>
                <div className="text-sm font-semibold text-gray-500 mt-1">Total Users</div>
              </div>
            </div>
          </div>

          {/* Legend - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-md"></div>
                <span className="text-sm font-semibold text-gray-700">Farmers</span>
              </div>
              <span className="text-base font-bold text-emerald-600">{farmersPercentage}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-md"></div>
                <span className="text-sm font-semibold text-gray-700">Buyers</span>
              </div>
              <span className="text-base font-bold text-blue-600">{buyersPercentage}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-md"></div>
                <span className="text-sm font-semibold text-gray-700">CUSAFA</span>
              </div>
              <span className="text-base font-bold text-amber-600">{cusafaPercentage}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-md"></div>
                <span className="text-sm font-semibold text-gray-700">MAO</span>
              </div>
              <span className="text-base font-bold text-rose-600">{maoPercentage}%</span>
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
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                        user.role === 'farmer' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
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
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${
                      user.role === 'farmer' ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' :
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
