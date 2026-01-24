import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Building2,
  RefreshCw,
  Activity,
  Clock,
  User,
  Shield,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
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

  // Modern Stats Card Component - Premium Design
  const StatsCard: React.FC<{
    title: string;
    value: string | number;
    subValue: string;
    icon: React.ReactNode;
    gradient: string;
  }> = ({ title, value, subValue, icon, gradient }) => (
    <div className={`group relative bg-gradient-to-br ${gradient} rounded-2xl md:rounded-3xl shadow-xl p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-all">
            {icon}
          </div>
          <Activity size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-xs font-semibold opacity-90 mb-2 tracking-wide uppercase">{title}</h3>
        <p className="text-3xl font-black mb-1 drop-shadow-sm">
          {value}
        </p>
        <div className="flex items-center gap-2 text-xs opacity-80 mt-1 font-medium">
          <Clock size={12} />
          <span>{subValue}</span>
        </div>
      </div>
    </div>
  );

  // Modern Animated Pie Chart Component
  const AnimatedPieChart: React.FC<{
    data: { name: string; value: number; fill: string; percentage: number }[],
    centerLabel?: string,
    centerSubLabel?: string
  }> = ({ data, centerLabel, centerSubLabel }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    let currentAngle = -90;

    const validData = data.filter(item => item.value > 0);
    const total = validData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="relative w-full h-80 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-64 h-64 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }}>
          <defs>
            {validData.map((item, idx) => (
              <linearGradient key={`grad-${idx}`} id={`pie-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.fill} />
                <stop offset="100%" stopColor={`${item.fill}dd`} />
              </linearGradient>
            ))}
            <filter id="shadow-pie" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="4" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="gradient-center">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </radialGradient>
          </defs>

          {validData.length === 1 ? (
            <circle
              cx="120"
              cy="120"
              r={hoveredIndex === 0 ? 95 : 90}
              fill="url(#pie-grad-0)"
              filter="url(#shadow-pie)"
              onMouseEnter={() => setHoveredIndex(0)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-500 ease-out"
              style={{ transformOrigin: '120px 120px' }}
            />
          ) : (
            validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              const midAngle = (startAngle + endAngle) / 2;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const midRad = (midAngle * Math.PI) / 180;

              const radius = hoveredIndex === index ? 95 : 90;
              const x1 = 120 + radius * Math.cos(startRad);
              const y1 = 120 + radius * Math.sin(startRad);
              const x2 = 120 + radius * Math.cos(endRad);
              const y2 = 120 + radius * Math.sin(endRad);
              const labelRadius = 68;
              const labelX = 120 + labelRadius * Math.cos(midRad);
              const labelY = 120 + labelRadius * Math.sin(midRad);
              const largeArc = angle > 180 ? 1 : 0;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer outline-none"
                >
                  <path
                    d={`M 120 120 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={`url(#pie-grad-${index})`}
                    filter="url(#shadow-pie)"
                    className="transition-all duration-500 ease-out"
                    style={{
                      transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: '120px 120px',
                      opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.7
                    }}
                  />
                  {percentage > 10 && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[11px] font-bold fill-white"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                    >
                      {percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })
          )}

          <circle cx="120" cy="120" r="58" fill="white" />
          <circle cx="120" cy="120" r="55" fill="url(#gradient-center)" className="shadow-inner" />
        </svg>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[110px] flex flex-col items-center justify-center">
          {hoveredIndex !== null && validData[hoveredIndex] ? (
            <>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {((validData[hoveredIndex].value / total) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-1 break-words w-full">
                {validData[hoveredIndex].name}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-gray-800 leading-none mb-1">{centerLabel}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-tight break-words w-full">{centerSubLabel}</p>
            </>
          )}
        </div>
      </div>
    );
  };

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

  const roleChartData = [
    { name: 'Farmers', value: stats.totalFarmers, fill: '#10b981', percentage: totalUsersForPie > 0 ? (stats.totalFarmers / totalUsersForPie) * 100 : 0 },
    { name: 'Buyers', value: stats.totalBuyers, fill: '#3b82f6', percentage: totalUsersForPie > 0 ? (stats.totalBuyers / totalUsersForPie) * 100 : 0 },
    { name: 'CUSAFA', value: stats.totalCusafa, fill: '#f59e0b', percentage: totalUsersForPie > 0 ? (stats.totalCusafa / totalUsersForPie) * 100 : 0 },
    { name: 'MAO', value: stats.totalMao, fill: '#f43f5e', percentage: totalUsersForPie > 0 ? (stats.totalMao / totalUsersForPie) * 100 : 0 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section with modern design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Users Analytics</h2>
          <p className="text-gray-500 font-medium mt-1">Overview of system users and registration trends</p>
        </div>
        <button
          onClick={fetchUserStats}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md group active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-indigo-500 group-hover:rotate-180 transition-transform duration-500" />
          Refresh Registry
        </button>
      </div>

      {/* Stats Cards - Premium Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers || 0}
          subValue="All registered users"
          icon={<Users className="text-white" size={24} />}
          gradient="from-slate-700 to-slate-900"
        />
        <StatsCard
          title="Farmers"
          value={stats.totalFarmers || 0}
          subValue="Registered farmers"
          icon={<UserPlus className="text-white" size={24} />}
          gradient="from-emerald-500 to-emerald-700"
        />
        <StatsCard
          title="Buyers"
          value={stats.totalBuyers || 0}
          subValue="Active buyers"
          icon={<ShoppingCart className="text-white" size={24} />}
          gradient="from-blue-500 to-blue-700"
        />
        <StatsCard
          title="CUSAFA"
          value={stats.totalCusafa || 0}
          subValue="Association coordinators"
          icon={<Building2 className="text-white" size={24} />}
          gradient="from-amber-500 to-amber-700"
        />
        <StatsCard
          title="MAO"
          value={stats.totalMao || 0}
          subValue="Municipal coordinators"
          icon={<Shield className="text-white" size={24} />}
          gradient="from-rose-500 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Chart */}
        <div className="lg:col-span-2">
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

        {/* Improved Composition Pie Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900">User Composition</h3>
              <p className="text-xs text-gray-500 font-medium italic mt-0.5">Breakdown by user roles</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Users className="text-indigo-500" size={24} />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatedPieChart
              data={roleChartData}
              centerLabel={totalUsersForPie.toString()}
              centerSubLabel="Total Users"
            />

            {/* Premium Legend Grid */}
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              {roleChartData.map((item, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-gray-900">{item.value}</span>
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">{item.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations Redesign */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Recent Registrations</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Latest system memberships</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold ring-1 ring-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Live Updates
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/40">
                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Role & Access</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Registry Date</th>
                <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(stats.recentUsers || []).map((user, index) => (
                <tr key={index} className="group hover:bg-gray-50/80 transition-all duration-300">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${user.role === 'farmer' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                          user.role === 'buyer' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                            user.role === 'officer' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                              'bg-gradient-to-br from-rose-400 to-rose-600'
                        }`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-base font-black text-gray-900 leading-tight">{user.full_name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: #REG-{index + 1000}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'farmer' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' :
                        user.role === 'buyer' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100' :
                          user.role === 'officer' ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' :
                            'bg-rose-50 text-rose-600 ring-1 ring-rose-100'
                      }`}>
                      {user.role === 'officer' ? <Shield size={10} /> : <User size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                        {user.email}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                        Registered at {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center">
          <button className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700 transition-colors">
            View Full Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
