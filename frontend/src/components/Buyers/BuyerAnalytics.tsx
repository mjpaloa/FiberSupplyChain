import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  totalSpent: number;
  totalPurchases: number;
  totalSales: number;
  totalSalesAmount: number;
  totalQuantity: number;
  allTimeTotalSpent: number;
  allTimeTotalPurchases: number;
  allTimeTotalSales: number;
  allTimeTotalSalesAmount: number;
  allTimeTotalQuantity: number;
  allTimeYearlyProfit: number;
  monthlySpending: { month: string; amount: number }[];
  monthlySales: { month: string; amount: number; transactions: number }[];
  recentTransactions: any[];
  yearlyProfit: number;
  salesByFiberType: { type: string; quantity: number; percentage: number; sales: number }[];
  monthlyTransactions: { month: string; count: number }[];
  yearlySpendingByYear: { year: string; amount: number }[];
  yearlySalesByYear: { year: string; amount: number }[];
  yearlyTransactionsByYear: { year: string; count: number }[];
}

const BuyerAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSpent: 0,
    totalPurchases: 0,
    totalSales: 0,
    totalSalesAmount: 0,
    totalQuantity: 0,
    allTimeTotalSpent: 0,
    allTimeTotalPurchases: 0,
    allTimeTotalSales: 0,
    allTimeTotalSalesAmount: 0,
    allTimeTotalQuantity: 0,
    allTimeYearlyProfit: 0,
    monthlySpending: [],
    monthlySales: [],
    recentTransactions: [],
    yearlyProfit: 0,
    salesByFiberType: [],
    monthlyTransactions: [],
    yearlySpendingByYear: [],
    yearlySalesByYear: [],
    yearlyTransactionsByYear: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [spendingViewMode, setSpendingViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [salesViewMode, setSalesViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [transactionsViewMode, setTransactionsViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPieSegment, setHoveredPieSegment] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch purchases data
      const purchasesResponse = await fetch(
        'https://easyabaca-api.vercel.app/api/buyer-purchases',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!purchasesResponse.ok) {
        throw new Error(`HTTP error! status: ${purchasesResponse.status}`);
      }

      const purchasesData = await purchasesResponse.json();
      const purchases = purchasesData.purchases || [];

      // Fetch sales data
      let sales: any[] = [];
      let totalSalesAmount = 0;
      try {
        const salesResponse = await fetch(
          'https://easyabaca-api.vercel.app/api/buyer-purchases/sales',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          sales = salesData.sales || [];
          totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        }
      } catch (err) {
        console.warn('Sales endpoint not available');
      }

      // Calculate yearly totals grouped by year (for yearly view)
      const yearlySpendingMap: { [year: string]: number } = {};
      purchases.forEach((p: any) => {
        const year = new Date(p.created_at).getFullYear().toString();
        yearlySpendingMap[year] = (yearlySpendingMap[year] || 0) + parseFloat(p.total_price || 0);
      });

      const yearlySalesMap: { [year: string]: number } = {};
      sales.forEach((s: any) => {
        const year = new Date(s.sale_date || s.created_at).getFullYear().toString();
        yearlySalesMap[year] = (yearlySalesMap[year] || 0) + (s.total_amount || 0);
      });

      const yearlyTransactionsMap: { [year: string]: number } = {};
      [...purchases, ...sales].forEach((t: any) => {
        const year = new Date(t.created_at || t.sale_date).getFullYear().toString();
        yearlyTransactionsMap[year] = (yearlyTransactionsMap[year] || 0) + 1;
      });

      // Get all unique years and sort them
      const allYears = Array.from(new Set([
        ...Object.keys(yearlySpendingMap),
        ...Object.keys(yearlySalesMap),
        ...Object.keys(yearlyTransactionsMap)
      ])).sort();

      const yearlySpendingByYear = allYears.map(year => ({
        year,
        amount: yearlySpendingMap[year] || 0
      }));

      const yearlySalesByYear = allYears.map(year => ({
        year,
        amount: yearlySalesMap[year] || 0
      }));

      const yearlyTransactionsByYear = allYears.map(year => ({
        year,
        count: yearlyTransactionsMap[year] || 0
      }));

      // Calculate ALL-TIME totals (across all years) for KPI cards
      const allTimeTotalSpent = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const allTimeTotalPurchases = purchases.length;
      const allTimeTotalQuantity = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.quantity || 0), 0);
      const allTimeTotalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const allTimeTotalSales = sales.length;
      const allTimeYearlyProfit = allTimeTotalSalesAmount - allTimeTotalSpent;

      // Filter data by selected year (for monthly view and charts)
      const filteredPurchases = purchases.filter((p: any) => {
        const date = new Date(p.created_at);
        return date.getFullYear() === selectedYear;
      });

      const filteredSales = sales.filter((s: any) => {
        const date = new Date(s.sale_date || s.created_at);
        return date.getFullYear() === selectedYear;
      });

      // Calculate totals for selected year (for charts only)
      const totalSpent = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const totalPurchases = filteredPurchases.length;
      const totalQuantity = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.quantity || 0), 0);

      // Calculate yearly sales amount for selected year
      const yearlyFilteredSalesAmount = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      // Calculate profit (sales - cost) for selected year
      const totalCost = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const yearlyProfit = yearlyFilteredSalesAmount - totalCost;

      // Process monthly spending for selected year
      const monthlySpendingMap: { [key: string]: number } = {};
      filteredPurchases.forEach((p: any) => {
        const date = new Date(p.created_at);
        const monthName = months[date.getMonth()];
        monthlySpendingMap[monthName] = (monthlySpendingMap[monthName] || 0) + parseFloat(p.total_price || 0);
      });

      const monthlySpending = months.map(month => ({
        month,
        amount: monthlySpendingMap[month] || 0
      }));

      // Process monthly sales for selected year
      const monthlySalesMap: { [key: string]: { amount: number; transactions: number } } = {};
      filteredSales.forEach((s: any) => {
        const date = new Date(s.sale_date || s.created_at);
        const monthName = months[date.getMonth()];
        if (!monthlySalesMap[monthName]) {
          monthlySalesMap[monthName] = { amount: 0, transactions: 0 };
        }
        monthlySalesMap[monthName].amount += s.total_amount || 0;
        monthlySalesMap[monthName].transactions += 1;
      });

      const monthlySales = months.map(month => ({
        month,
        amount: monthlySalesMap[month]?.amount || 0,
        transactions: monthlySalesMap[month]?.transactions || 0
      }));

      // Process monthly transactions count for selected year
      const monthlyTransactionsMap: { [key: string]: number } = {};
      [...filteredPurchases, ...filteredSales].forEach((t: any) => {
        const date = new Date(t.created_at || t.sale_date);
        const monthName = months[date.getMonth()];
        monthlyTransactionsMap[monthName] = (monthlyTransactionsMap[monthName] || 0) + 1;
      });

      const monthlyTransactions = months.map(month => ({
        month,
        count: monthlyTransactionsMap[month] || 0
      }));

      // Calculate sales by fiber type (ALL TIME - not filtered by year)
      const salesByTypeMap: { [key: string]: { quantity: number; sales: number } } = {
        'Class A': { quantity: 0, sales: 0 },
        'Class B': { quantity: 0, sales: 0 },
        'Class C': { quantity: 0, sales: 0 }
      };

      sales.forEach((s: any) => {
        const fiberClass = s.fiber_class || 'Class C';
        if (salesByTypeMap[fiberClass]) {
          salesByTypeMap[fiberClass].quantity += s.quantity_kg || 0;
          salesByTypeMap[fiberClass].sales += s.total_amount || 0;
        }
      });

      const totalSoldQuantity = Object.values(salesByTypeMap).reduce((sum, v) => sum + v.quantity, 0);
      const salesByFiberType = Object.entries(salesByTypeMap)
        .map(([type, data]) => ({
          type,
          quantity: data.quantity,
          sales: data.sales,
          percentage: totalSoldQuantity > 0 ? (data.quantity / totalSoldQuantity) * 100 : 0
        }));

      setAnalytics({
        totalSpent,
        totalPurchases,
        totalSales: filteredSales.length,
        totalSalesAmount: yearlyFilteredSalesAmount,
        totalQuantity,
        allTimeTotalSpent,
        allTimeTotalPurchases,
        allTimeTotalSales,
        allTimeTotalSalesAmount,
        allTimeTotalQuantity,
        allTimeYearlyProfit,
        yearlyProfit,
        monthlySpending,
        monthlySales,
        recentTransactions: filteredPurchases.slice(0, 10),
        salesByFiberType,
        monthlyTransactions,
        yearlySpendingByYear,
        yearlySalesByYear,
        yearlyTransactionsByYear
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        totalSpent: 0,
        totalPurchases: 0,
        totalSales: 0,
        totalSalesAmount: 0,
        totalQuantity: 0,
        allTimeTotalSpent: 0,
        allTimeTotalPurchases: 0,
        allTimeTotalSales: 0,
        allTimeTotalSalesAmount: 0,
        allTimeTotalQuantity: 0,
        allTimeYearlyProfit: 0,
        monthlySpending: [],
        monthlySales: [],
        recentTransactions: [],
        yearlyProfit: 0,
        salesByFiberType: [],
        monthlyTransactions: [],
        yearlySpendingByYear: [],
        yearlySalesByYear: [],
        yearlyTransactionsByYear: []
      });
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Modern Animated Pie Chart Component
  const PieChart: React.FC<{ data: { type: string; percentage: number; quantity: number; sales: number }[] }> = ({ data }) => {
    const gradients = [
      { id: 'emerald', start: '#10b981', end: '#059669' },
      { id: 'blue', start: '#3b82f6', end: '#2563eb' },
      { id: 'amber', start: '#f59e0b', end: '#d97706' }
    ];
    let currentAngle = -90;

    // Filter out items with 0 percentage to avoid display issues
    const validData = data.filter(item => item.percentage > 0);

    return (
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))' }}>
          <defs>
            {gradients.map((grad) => (
              <linearGradient key={grad.id} id={grad.id} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={grad.start} />
                <stop offset="100%" stopColor={grad.end} />
              </linearGradient>
            ))}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
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
          </defs>
          {validData.map((item, index) => {
            const angle = (item.percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            const midAngle = (startAngle + endAngle) / 2;
            currentAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const midRad = (midAngle * Math.PI) / 180;

            const radius = hoveredPieSegment === index ? 95 : 90;
            const x1 = 120 + radius * Math.cos(startRad);
            const y1 = 120 + radius * Math.sin(startRad);
            const x2 = 120 + radius * Math.cos(endRad);
            const y2 = 120 + radius * Math.sin(endRad);

            const labelRadius = 65;
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
                  fill={`url(#${gradients[index].id})`}
                  filter="url(#shadow)"
                  className="transition-all duration-300"
                  style={{
                    transform: hoveredPieSegment === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: '120px 120px',
                    opacity: hoveredPieSegment === null || hoveredPieSegment === index ? 1 : 0.6
                  }}
                />
                {item.percentage > 8 && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-white"
                    style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                  >
                    {item.percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}
          <circle cx="120" cy="120" r="55" fill="white" />
          <circle cx="120" cy="120" r="52" fill="url(#gradient-center)" />
          <defs>
            <radialGradient id="gradient-center">
              <stop offset="0%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </radialGradient>
          </defs>
        </svg>
        
        {hoveredPieSegment !== null && validData[hoveredPieSegment] && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-2xl font-bold text-gray-800">{validData[hoveredPieSegment].percentage.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 font-semibold">{validData[hoveredPieSegment].type}</p>
            <p className="text-xs text-gray-500">{validData[hoveredPieSegment].quantity.toLocaleString()} kg</p>
          </div>
        )}
      </div>
    );
  };

  // Bar Chart Component
  const BarChart: React.FC<{
    data: { label: string; value: number; value2?: number }[];
    color?: string;
    color2?: string;
    showDual?: boolean;
    formatValue?: (val: number) => string;
  }> = ({ data, color = '#3b82f6', color2 = '#10b981', showDual = false, formatValue = (v) => v.toLocaleString() }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.value, d.value2 || 0)));
    const effectiveMax = maxValue > 0 ? maxValue : 10;

    const ticks = [0, 1, 2, 3, 4].map(i => {
      const val = (effectiveMax / 4) * i;
      return Math.round(val);
    }).reverse();

    return (
      <div className="w-full h-64 sm:h-72 md:h-96 flex gap-1 sm:gap-2 md:gap-4">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-full pb-6 sm:pb-8 md:pb-10 text-[10px] sm:text-xs text-gray-500 font-semibold min-w-[30px] sm:min-w-[35px] md:min-w-[40px]">
          {ticks.map((tick, i) => (
            <div key={i} className="h-0 flex items-center justify-end">
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </div>
          ))}
        </div>

        {/* Chart Area with Horizontal Scroll */}
        <div className="relative flex-1 h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pb-6 sm:pb-8 md:pb-10">
            {ticks.map((_, i) => (
              <div key={i} className="border-b border-gray-200 w-full h-0"></div>
            ))}
          </div>

          {/* Bars */}
          <div className="relative h-full flex items-end gap-1 sm:gap-2 pb-6 sm:pb-8 md:pb-10 px-1 sm:px-2" style={{ minWidth: data.length > 8 ? `${data.length * 60}px` : '100%' }}>
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[20px] sm:min-w-[30px] md:min-w-[40px]">
                <div className="w-full flex items-end justify-center h-full relative max-w-[40px] sm:max-w-[50px] md:max-w-[60px] mx-auto">

                  {/* Bar 1 */}
                  <div className="relative flex-1 flex flex-col justify-end h-full">
                    {/* Floating Value Label */}
                    {item.value > 0 && (
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs font-bold text-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {formatValue(item.value)}
                      </div>
                    )}

                    <div
                      className="w-full rounded-t-lg sm:rounded-t-xl transition-all duration-500 ease-out group-hover:brightness-110"
                      style={{
                        height: `${(item.value / effectiveMax) * 100}%`,
                        background: `linear-gradient(to top, ${color}, ${color}dd)`,
                        minHeight: item.value > 0 ? '6px' : '0',
                        boxShadow: item.value > 0 ? '0 4px 12px -2px rgba(0, 0, 0, 0.15)' : 'none'
                      }}
                    >
                    </div>
                  </div>

                  {/* Bar 2 (Optional) */}
                  {showDual && item.value2 !== undefined && (
                    <div className="relative flex-1 flex flex-col justify-end h-full ml-1">
                      {item.value2 > 0 && (
                        <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs font-bold text-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {formatValue(item.value2)}
                        </div>
                      )}
                      <div
                        className="w-full rounded-t-lg sm:rounded-t-xl transition-all duration-500 ease-out group-hover:brightness-110"
                        style={{
                          height: `${(item.value2 / effectiveMax) * 100}%`,
                          background: `linear-gradient(to top, ${color2}, ${color2}dd)`,
                          minHeight: item.value2 > 0 ? '6px' : '0',
                          boxShadow: item.value2 > 0 ? '0 4px 12px -2px rgba(0, 0, 0, 0.15)' : 'none'
                        }}
                      >
                      </div>
                    </div>
                  )}
                </div>
                {/* X-Axis Label */}
                <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const fiberColors = {
    'Class A': { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    'Class B': { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    'Class C': { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' }
  };

  return (
    <div className="w-full max-w-full">
      <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Total Spent */}
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-2xl font-bold">₱</span>
            </div>
          </div>
          <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Spent</h3>
          <p className="text-3xl md:text-4xl font-black mb-1">₱{(analytics.allTimeTotalSpent || 0).toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs opacity-80">
            <span className="text-sm font-bold">₱</span>
            <span>Total Purchases</span>
          </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Sales</h3>
          {analytics.allTimeTotalSales > 0 || analytics.allTimeTotalSalesAmount > 0 ? (
            <p className="text-3xl md:text-4xl font-black mb-1">₱{(analytics.allTimeTotalSalesAmount || 0).toLocaleString()}</p>
          ) : (
            <p className="text-xl md:text-2xl font-medium mb-1 opacity-70">No sales yet</p>
          )}
          <div className="flex items-center gap-1 text-xs opacity-80">
            <span className="text-sm font-bold">₱</span>
            <span>Sales Revenue</span>
          </div>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Package size={24} />
            </div>
          </div>
          <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Quantity</h3>
          <p className="text-3xl md:text-4xl font-black mb-1">{(analytics.allTimeTotalQuantity || 0).toLocaleString()} <span className="text-xl md:text-2xl">kg</span></p>
          <div className="flex items-center gap-2 text-xs opacity-80">
            <Package size={14} />
            <span>Fiber Volume</span>
          </div>
          </div>
        </div>

        {/* Yearly Profit (from sales) */}
        <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Net Profit</h3>
          {analytics.allTimeTotalSales > 0 || analytics.allTimeTotalSalesAmount > 0 ? (
            <p className="text-3xl md:text-4xl font-black mb-1">₱{Math.abs(analytics.allTimeYearlyProfit || 0).toLocaleString()}</p>
          ) : (
            <p className="text-xl md:text-2xl font-medium mb-1 opacity-70">No sales yet</p>
          )}
          <div className="flex items-center gap-2 text-xs opacity-80">
            <TrendingUp size={14} />
            <span>Sales Minus Purchases</span>
          </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
        {/* Fiber Type Sales Distribution - Pie Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                Sales by Fiber Type
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Distribution of sold fiber classes</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
              <PieChartIcon className="text-blue-600" size={28} />
            </div>
          </div>

          {analytics.salesByFiberType && analytics.salesByFiberType.length > 0 && analytics.salesByFiberType.some(item => item.quantity > 0) ? (
            <>
              <PieChart data={analytics.salesByFiberType} />
              {/* Fiber Type Percentages */}
              <div className="mt-8 grid grid-cols-3 gap-3">
                {analytics.salesByFiberType.filter(item => item.percentage > 0).map((item, index) => {
                  const colorClass = fiberColors[item.type as keyof typeof fiberColors];
                  return (
                    <div key={index} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                      <div className={`w-4 h-4 rounded-full ${colorClass.bg} mb-2`}></div>
                      <p className="text-xs text-gray-600 font-medium mb-1">{item.type}</p>
                      <p className="text-2xl font-black text-gray-900">{item.percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <PieChartIcon size={48} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No sales data available</p>
              <p className="text-sm text-gray-400 mt-2">Sales data will appear here once you make sales</p>
            </div>
          )}
        </div>

        {/* Monthly Spending Bar Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                Spending
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Purchase expenses over time</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSpendingViewMode('monthly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${spendingViewMode === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSpendingViewMode('yearly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${spendingViewMode === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yearly
                </button>
              </div>
              <div className="hidden md:block p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <BarChart3 className="text-blue-600" size={28} />
              </div>
            </div>
          </div>

          {analytics.monthlySpending && analytics.monthlySpending.length > 0 ? (
            <BarChart
              data={spendingViewMode === 'monthly' 
                ? analytics.monthlySpending.map(item => ({
                    label: item.month,
                    value: item.amount
                  }))
                : analytics.yearlySpendingByYear.map(item => ({
                    label: item.year,
                    value: item.amount
                  }))
              }
              color="#3b82f6"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <BarChart3 size={48} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No spending data available</p>
              <p className="text-sm text-gray-400 mt-2">Your purchase history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Sales and Transactions Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4 items-start">
        {/* Monthly Sales Bar Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 self-start">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                Sales
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Revenue from fiber sales</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setSalesViewMode('monthly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${salesViewMode === 'monthly'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSalesViewMode('yearly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${salesViewMode === 'yearly'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yearly
                </button>
              </div>
              <div className="hidden md:block p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
                <TrendingUp className="text-emerald-600" size={28} />
              </div>
            </div>
          </div>

          {analytics.monthlySales && analytics.monthlySales.length > 0 ? (
            <BarChart
              data={salesViewMode === 'monthly'
                ? analytics.monthlySales.map(item => ({
                    label: item.month,
                    value: item.amount
                  }))
                : analytics.yearlySalesByYear.map(item => ({
                    label: item.year,
                    value: item.amount
                  }))
              }
              color="#10b981"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <TrendingUp size={48} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No sales data available</p>
              <p className="text-sm text-gray-400 mt-2">Sales revenue will be displayed here</p>
            </div>
          )}
        </div>

        {/* Monthly Transactions Bar Chart */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 self-start">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                Transactions
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Number of purchases & sales</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setTransactionsViewMode('monthly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${transactionsViewMode === 'monthly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTransactionsViewMode('yearly')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${transactionsViewMode === 'yearly'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Yearly
                </button>
              </div>
              <div className="hidden md:block p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl">
                <Activity className="text-purple-600" size={28} />
              </div>
            </div>
          </div>

          {analytics.monthlyTransactions && analytics.monthlyTransactions.length > 0 ? (
            <BarChart
              data={transactionsViewMode === 'monthly'
                ? analytics.monthlyTransactions.map(item => ({
                    label: item.month,
                    value: item.count
                  }))
                : analytics.yearlyTransactionsByYear.map(item => ({
                    label: item.year,
                    value: item.count
                  }))
              }
              color="#a855f7"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <div className="p-6 bg-gray-100 rounded-full mb-4">
                <Activity size={48} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No transaction data available</p>
              <p className="text-sm text-gray-400 mt-2">Transaction history will be shown here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 lg:p-8 border border-white/60">
        <div className="flex items-center gap-2 md:gap-3 mb-6 md:mb-8">
          <div className="w-1 md:w-1.5 h-8 md:h-10 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full"></div>
          <h2 className="text-lg md:text-2xl font-black text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">ID</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Quality</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase tracking-wider">Variety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(analytics.recentTransactions || []).slice(0, 10).map((transaction, index) => {
                const date = new Date(transaction.created_at);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const sequentialNum = String(index + 1).padStart(4, '0');
                const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;
                
                return (
                <tr key={transaction.purchase_id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-100">
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-[10px] sm:text-xs md:text-sm font-bold text-gray-900">
                    {transactionId}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs md:text-sm font-medium ${fiberColors[transaction.fiber_quality as keyof typeof fiberColors]?.light || 'bg-gray-100'
                      } ${fiberColors[transaction.fiber_quality as keyof typeof fiberColors]?.text || 'text-gray-700'
                      }`}>
                      {transaction.fiber_quality}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-[10px] sm:text-xs md:text-sm text-gray-900 font-bold">
                    {transaction.quantity} kg
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5 text-[10px] sm:text-xs md:text-sm font-black text-gray-900">
                    ₱{transaction.total_price?.toLocaleString() || '0'}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-5">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] sm:text-xs md:text-sm font-medium">
                      {transaction.variety}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {(analytics.recentTransactions || []).length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-2">Your purchase history will appear here</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
