import React, { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
} from 'lucide-react';
import { getApiUrl } from '../../config/api';

import RegistrationTrendsChart from './RegistrationTrendsChart';
import {
  EditorialCard,
  KpiStrip,
  StatusPill,
  EDITORIAL_CHART,
} from '../Shared/EditorialUI';

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

  // Flat Editorial Donut Chart Component
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
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56">
          {validData.length === 1 ? (
            <circle
              cx="120"
              cy="120"
              r={hoveredIndex === 0 ? 92 : 88}
              fill={validData[0].fill}
              onMouseEnter={() => setHoveredIndex(0)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-200"
            />
          ) : (
            validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const radius = hoveredIndex === index ? 92 : 88;
              const x1 = 120 + radius * Math.cos(startRad);
              const y1 = 120 + radius * Math.sin(startRad);
              const x2 = 120 + radius * Math.cos(endRad);
              const y2 = 120 + radius * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 120 120 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={item.fill}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.65
                  }}
                />
              );
            })
          )}

          <circle cx="120" cy="120" r="56" fill="#FFFFFF" />
        </svg>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[104px] flex flex-col items-center justify-center">
          {hoveredIndex !== null && validData[hoveredIndex] ? (
            <>
              <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">
                {((validData[hoveredIndex].value / total) * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-1 break-words w-full">
                {validData[hoveredIndex].name}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none mb-1">{centerLabel}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight break-words w-full">{centerSubLabel}</p>
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

  // Calculate percentages for the pie chart
  const totalUsersForPie = (stats?.totalFarmers || 0) + (stats?.totalBuyers || 0) + (stats?.totalCusafa || 0) + (stats?.totalMao || 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EditorialCard className="py-12 text-center">
        <div className="p-4 bg-red-50 rounded-full inline-flex mb-4">
          <Users className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Unable to load user statistics</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{error || 'Unable to load user statistics at this time.'}</p>
        <button
          onClick={fetchUserStats}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#047857] text-white rounded-xl text-sm font-semibold hover:bg-[#065F46] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </EditorialCard>
    );
  }

  const roleChartData = [
    { name: 'Farmers', value: stats.totalFarmers, fill: EDITORIAL_CHART.colors.emerald, percentage: totalUsersForPie > 0 ? (stats.totalFarmers / totalUsersForPie) * 100 : 0 },
    { name: 'Buyers', value: stats.totalBuyers, fill: EDITORIAL_CHART.colors.amber, percentage: totalUsersForPie > 0 ? (stats.totalBuyers / totalUsersForPie) * 100 : 0 },
    { name: 'CUSAFA', value: stats.totalCusafa, fill: EDITORIAL_CHART.colors.espresso, percentage: totalUsersForPie > 0 ? (stats.totalCusafa / totalUsersForPie) * 100 : 0 },
    { name: 'MAO', value: stats.totalMao, fill: EDITORIAL_CHART.colors.mutedSlate, percentage: totalUsersForPie > 0 ? (stats.totalMao / totalUsersForPie) * 100 : 0 }
  ];

  const getRoleTone = (role: string): 'success' | 'warning' | 'info' | 'neutral' => {
    if (role === 'farmer') return 'success';
    if (role === 'buyer') return 'info';
    if (role === 'officer') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-gray-900">Users Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">Overview of system users and registration trends</p>
        </div>
        <button
          type="button"
          onClick={fetchUserStats}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          Refresh Registry
        </button>
      </div>

      <KpiStrip
        columns={5}
        items={[
          { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), subtext: 'All registered accounts' },
          { label: 'Farmers', value: (stats.totalFarmers || 0).toLocaleString(), subtext: 'Registered farmers' },
          { label: 'Buyers', value: (stats.totalBuyers || 0).toLocaleString(), subtext: 'Active buyers' },
          { label: 'CUSAFA', value: (stats.totalCusafa || 0).toLocaleString(), subtext: 'Association officers' },
          { label: 'MAO', value: (stats.totalMao || 0).toLocaleString(), subtext: 'Municipal coordinators' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <EditorialCard
          title="User Composition"
          subtitle="Breakdown by user roles"
          className="h-full flex flex-col"
          bodyClassName="flex-1 flex flex-col items-center justify-center"
        >
          <AnimatedPieChart
            data={roleChartData}
            centerLabel={totalUsersForPie.toLocaleString()}
            centerSubLabel="Total Users"
          />

          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            {roleChartData.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs font-medium text-gray-600">{item.name}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-gray-900 tabular-nums">{item.value}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>

      <EditorialCard
        title="Recent Registrations"
        subtitle="Latest system memberships across all roles"
        badge={(stats.recentUsers || []).length}
        noPadding
      >
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Recent user registrations">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500">User Profile</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500">Role</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500">Contact Email</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500">Registry Date</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.recentUsers || []).map((user, index) => (
                <tr key={index} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                        <div className="text-xs text-gray-500 tabular-nums">#REG-{index + 1000}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusPill tone={getRoleTone(user.role)}>
                      <span className="capitalize">{user.role}</span>
                    </StatusPill>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusPill tone="success">Active</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
};

export default UserAnalyticsDashboard;
