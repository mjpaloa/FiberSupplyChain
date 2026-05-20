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
  purchasesByFiberType: { type: string; quantity: number; percentage: number; cost: number }[];
  monthlyTransactions: { month: string; count: number }[];
  yearlySpendingByYear: { year: string; amount: number }[];
  yearlySalesByYear: { year: string; amount: number }[];
  yearlyTransactionsByYear: { year: string; count: number }[];
  yearlyProfitByYear: { year: string; profit: number; margin: number; sales: number; spending: number }[];
  availableYears: string[];
  // Comparison Metrics
  spendingGrowth: number;
  salesGrowth: number;
  quantityGrowth: number;
  // Decision Support
  insights: { type: 'positive' | 'negative' | 'neutral', message: string, action: string }[];
}

const BuyerAnalytics: React.FC = () => {
  // Reusable Chart Insight Component
  const ChartInsight: React.FC<{ type: 'positive' | 'negative' | 'neutral', message: string }> = ({ type, message }) => {
    const colors = {
      positive: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'bg-emerald-100', text: 'text-emerald-700' },
      negative: { bg: 'bg-rose-50', border: 'border-rose-100', icon: 'bg-rose-100', text: 'text-rose-700' },
      neutral: { bg: 'bg-slate-50', border: 'border-slate-100', icon: 'bg-slate-100', text: 'text-slate-700' }
    };
    const c = colors[type];
    return (
      <div className={`mt-5 p-4 ${c.bg} border ${c.border} rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500`}>
        <div className={`${c.icon} p-2 rounded-full mt-0.5 shadow-sm`}>
          <Activity size={16} className={c.text} />
        </div>
        <div>
          <h4 className={`text-xs font-black ${c.text} uppercase tracking-wider mb-1`}>Analysis & Recommendation</h4>
          <p className="text-xs md:text-sm text-gray-700 font-medium leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
    );
  };

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
    purchasesByFiberType: [],
    monthlyTransactions: [],
    yearlySpendingByYear: [],
    yearlySalesByYear: [],
    yearlyTransactionsByYear: [],
    yearlyProfitByYear: [],
    availableYears: [],
    spendingGrowth: 0,
    salesGrowth: 0,
    quantityGrowth: 0,
    insights: []
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
        'https://server.easyabaca.site/api/buyer-purchases',
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
          'https://server.easyabaca.site/api/buyer-purchases/sales',
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

      // Calculate yearly profit & margin
      const yearlyProfitByYear = allYears.map(year => {
        const sales = yearlySalesMap[year] || 0;
        const spending = yearlySpendingMap[year] || 0;
        const profit = sales - spending;
        const margin = sales > 0 ? (profit / sales) * 100 : 0;
        return { year, profit, margin, sales, spending };
      });

      // Update available years based on data
      const availableYears = allYears.length > 0 ? allYears : [new Date().getFullYear().toString()];

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

      // Calculate sales by fiber type (Filtered by selected year)
      const salesByTypeMap: { [key: string]: { quantity: number; sales: number } } = {
        'Class A': { quantity: 0, sales: 0 },
        'Class B': { quantity: 0, sales: 0 },
        'Class C': { quantity: 0, sales: 0 }
      };

      filteredSales.forEach((s: any) => {
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

      // Calculate purchases by fiber type (Filtered by selected year)
      const purchasesByTypeMap: { [key: string]: { quantity: number; cost: number } } = {
        'Class A': { quantity: 0, cost: 0 },
        'Class B': { quantity: 0, cost: 0 },
        'Class C': { quantity: 0, cost: 0 }
      };

      filteredPurchases.forEach((p: any) => {
        let fiberClass = p.fiber_quality || p.grade || 'Class C';
        // Normalize class names just in case
        if (fiberClass.includes('A')) fiberClass = 'Class A';
        else if (fiberClass.includes('B')) fiberClass = 'Class B';
        else if (fiberClass.includes('C')) fiberClass = 'Class C';
        else fiberClass = 'Class C'; // Default

        if (purchasesByTypeMap[fiberClass]) {
          purchasesByTypeMap[fiberClass].quantity += parseFloat(p.quantity || 0);
          purchasesByTypeMap[fiberClass].cost += parseFloat(p.total_price || 0);
        }
      });

      const totalPurchaseQuantity = Object.values(purchasesByTypeMap).reduce((sum, v) => sum + v.quantity, 0);
      const purchasesByFiberType = Object.entries(purchasesByTypeMap)
        .map(([type, data]) => ({
          type,
          quantity: data.quantity,
          cost: data.cost,
          percentage: totalPurchaseQuantity > 0 ? (data.quantity / totalPurchaseQuantity) * 100 : 0
        }));




      // Calculate Comparison Metrics (This Month vs Last Month)
      const currentDate = new Date();
      const currentMonthIndex = currentDate.getMonth();
      const lastMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;

      const currentMonthSpending = monthlySpending[currentMonthIndex]?.amount || 0;
      const lastMonthSpending = monthlySpending[lastMonthIndex]?.amount || 0;
      let spendingGrowth = 0;
      if (lastMonthSpending > 0) {
        spendingGrowth = ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100;
      } else if (currentMonthSpending > 0) {
        spendingGrowth = 100;
      }

      const currentMonthSales = monthlySales[currentMonthIndex]?.amount || 0;
      const lastMonthSales = monthlySales[lastMonthIndex]?.amount || 0;
      let salesGrowth = 0;
      if (lastMonthSales > 0) {
        salesGrowth = ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100;
      } else if (currentMonthSales > 0) {
        salesGrowth = 100;
      }

      // Quantity Growth (using purchases as quantity source)
      // We need to calculate monthly quantities first
      const monthlyQuantityMap: { [key: string]: number } = {};
      filteredPurchases.forEach((p: any) => {
        const date = new Date(p.created_at);
        const monthName = months[date.getMonth()];
        monthlyQuantityMap[monthName] = (monthlyQuantityMap[monthName] || 0) + parseFloat(p.quantity || 0);
      });
      const currentMonthQuantity = monthlyQuantityMap[months[currentMonthIndex]] || 0;
      const lastMonthQuantity = monthlyQuantityMap[months[lastMonthIndex]] || 0;
      let quantityGrowth = 0;
      if (lastMonthQuantity > 0) {
        quantityGrowth = ((currentMonthQuantity - lastMonthQuantity) / lastMonthQuantity) * 100;
      } else if (currentMonthQuantity > 0) {
        quantityGrowth = 100; // New activity
      }


      // Decision Support / Insights - IMPROVED WITH CONTEXT
      const insights: { type: 'positive' | 'negative' | 'neutral', message: string, action: string }[] = [];

      // Get historical context
      const last3YearsProfit = yearlyProfitByYear.slice(-3);
      const currentYearData = yearlyProfitByYear.find(y => y.year === selectedYear.toString());
      const previousYearData = yearlyProfitByYear.find(y => y.year === (selectedYear - 1).toString());

      // Sales Trend Logic with Context
      if (salesGrowth > 15) {
        insights.push({
          type: 'positive',
          message: `Outstanding Sales Growth (+${salesGrowth.toFixed(1)}%)`,
          action: 'Demand is peaking. Secure more supply immediately to avoid stockouts and maintain this momentum.'
        });
      } else if (salesGrowth > 0) {
        insights.push({
          type: 'positive',
          message: 'Steady Sales Increase',
          action: 'Maintaining momentum. Great time to build loyalty with your current sellers and explore new markets.'
        });
      } else if (salesGrowth < -20) {
        // Improved Critical Sales Decline with context
        const yearOverYearGrowth = previousYearData && currentYearData
          ? ((currentYearData.sales - previousYearData.sales) / previousYearData.sales * 100).toFixed(1)
          : 'N/A';

        insights.push({
          type: 'negative',
          message: `Sales Alert: ${months[currentMonthIndex]} ${selectedYear} Performance`,
          action: `Recent drop: ${months[currentMonthIndex]} lower than ${months[lastMonthIndex]} peak\n\nThis is NORMAL - ${months[currentMonthIndex]} is historically a slow month\n\nWhat to do:\n1. Check with your top 3 customers if they need supply\n2. Verify you have enough Class A fiber in stock\n3. Monitor ${months[(currentMonthIndex + 1) % 12]} - if still low, consider promotions\n\nOverall business health: ${yearOverYearGrowth !== 'N/A' && parseFloat(yearOverYearGrowth) > 0 ? 'GOOD ✅' : 'MONITOR 📊'}\n${currentYearData ? `Profit margin: ${currentYearData.margin.toFixed(0)}%` : ''}`
        });
      } else if (salesGrowth < 0) {
        insights.push({
          type: 'neutral',
          message: 'Slight Dip in Sales',
          action: 'Market activity is slower this month. Normal seasonal variation. Consider reaching out to inactive buyers for the upcoming busy season.'
        });
      }

      // Spending & Profitability Logic
      if (currentMonthSpending > 0 && currentMonthSales === 0) {
        insights.push({ type: 'neutral', message: 'Investment Phase Detected', action: 'You are currently buying without selling. Ensure your storage is adequate for this inventory.' });
      } else if (currentMonthSpending > currentMonthSales * 2) {
        insights.push({ type: 'negative', message: 'High Burn Rate', action: 'Your spending is double your sales. Review if you are overpaying for certain fiber classes.' });
      }

      // Inventory & Volume Logic
      if (totalQuantity > 0 && totalQuantity < 500) {
        insights.push({ type: 'neutral', message: 'Low Stock Levels', action: 'Supply is dwindling. Check availability with your regular farmers before demand spikes.' });
      }

      // Default insight if none generated
      if (insights.length === 0) {
        if (allTimeTotalPurchases === 0) {
          insights.push({ type: 'neutral', message: 'Account Initialized', action: 'Start by recording your first purchase to generate real-time analytics.' });
        } else {
          insights.push({ type: 'neutral', message: 'Stable Market Position', action: 'No significant shifts detected this month. Continue standard operations.' });
        }
      }

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
        allTimeTotalQuantity, // Removed hardcoded value
        allTimeYearlyProfit,
        yearlyProfit,
        monthlySpending,
        monthlySales,
        recentTransactions: filteredPurchases.slice(0, 10),
        salesByFiberType,
        purchasesByFiberType,
        monthlyTransactions,
        yearlySpendingByYear,
        yearlySalesByYear,
        yearlyTransactionsByYear,
        yearlyProfitByYear,
        availableYears,
        spendingGrowth,
        salesGrowth,
        quantityGrowth,
        insights
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
        yearlyTransactionsByYear: [],
        yearlyProfitByYear: [],
        purchasesByFiberType: [],
        availableYears: [],
        spendingGrowth: 0,
        salesGrowth: 0,
        quantityGrowth: 0,
        insights: []
      });
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];


  // Modern Animated Pie Chart Component
  const PieChart: React.FC<{ data: { type: string; percentage: number; quantity: number }[] }> = ({ data }) => {
    const gradients = [
      { id: 'emerald', start: '#10b981', end: '#059669' },
      { id: 'blue', start: '#3b82f6', end: '#2563eb' },
      { id: 'amber', start: '#f59e0b', end: '#d97706' }
    ];
    let currentAngle = -90;

    // Filter out items with 0 percentage to avoid display issues
    const validData = data.filter(item => item.percentage > 0);

    return (
      <div className="relative w-full h-56 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-48 h-48 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.15))' }}>
          <defs>
            {gradients.map((grad, i) => (
              <linearGradient key={grad.id} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
                  fill={`url(#grad-${index})`}
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
        <div className="flex flex-col justify-between h-full pt-12 pb-6 sm:pb-8 md:pb-10 text-[10px] sm:text-xs text-gray-500 font-semibold min-w-[30px] sm:min-w-[35px] md:min-w-[40px]">
          {ticks.map((tick, i) => (
            <div key={i} className="h-0 flex items-center justify-end">
              {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
            </div>
          ))}
        </div>

        {/* Chart Area with Horizontal Scroll */}
        <div className="relative flex-1 h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Horizontal Grid Lines */}
          <div className="absolute inset-x-0 top-12 bottom-0 flex flex-col justify-between pb-6 sm:pb-8 md:pb-10">
            {ticks.map((_, i) => (
              <div key={i} className="border-b border-gray-200 w-full h-0"></div>
            ))}
          </div>

          {/* Bars */}
          <div className="relative h-full pt-12 flex items-end gap-1 sm:gap-2 pb-6 sm:pb-8 md:pb-10 px-1 sm:px-2" style={{ minWidth: data.length > 8 ? `${data.length * 60}px` : '100%' }}>
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative min-w-[20px] sm:min-w-[30px] md:min-w-[40px]">
                <div className="w-full flex items-end justify-center h-full relative max-w-[40px] sm:max-w-[50px] md:max-w-[60px] mx-auto">

                  {/* Bar 1 */}
                  <div className="relative flex-1 flex flex-col justify-end h-full">
                    {/* Floating Value Label */}
                    {item.value > 0 && (
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out mb-2">
                        <div className="bg-gray-800 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap relative">
                          {formatValue(item.value)}
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
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
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out mb-2">
                          <div className="bg-gray-800 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap relative">
                            {formatValue(item.value2)}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                          </div>
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
        {/* Dashboard Header with Year Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Performance Overview</h1>
            <p className="text-sm text-gray-500 font-medium">Real-time supply chain analytics and insights</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Year</span>
            <select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-gray-50 border-none text-gray-900 text-sm font-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1 md:p-1.5 cursor-pointer outline-none"
            >
              {analytics.availableYears.length > 0 ? (
                analytics.availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>
          </div>
        </div>

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
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                  {analytics.spendingGrowth >= 0 ? <ArrowUp size={14} className="text-emerald-300" /> : <ArrowDown size={14} className="text-red-300" />}
                  <span className={`text-xs font-bold ${analytics.spendingGrowth >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                    {Math.abs(analytics.spendingGrowth).toFixed(1)}%
                  </span>
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
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                  {analytics.salesGrowth >= 0 ? <ArrowUp size={14} className="text-emerald-300" /> : <ArrowDown size={14} className="text-red-300" />}
                  <span className={`text-xs font-bold ${analytics.salesGrowth >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                    {Math.abs(analytics.salesGrowth).toFixed(1)}%
                  </span>
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
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                  {analytics.quantityGrowth >= 0 ? <ArrowUp size={14} className="text-emerald-300" /> : <ArrowDown size={14} className="text-red-300" />}
                  <span className={`text-xs font-bold ${analytics.quantityGrowth >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                    {Math.abs(analytics.quantityGrowth).toFixed(1)}%
                  </span>
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
          {/* Fiber Type Analytics (Purchase & Sales) - Pie Chart */}
          {/* Fiber Type Analytics (Purchase & Sales) - Pie Chart */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                  Fiber Analytics
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Distribution by fiber class</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                <PieChartIcon className="text-blue-600" size={28} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchases Breakdown */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-bold text-gray-700 mb-2">My Purchases</h3>
                {analytics.purchasesByFiberType && analytics.purchasesByFiberType.length > 0 && analytics.purchasesByFiberType.some(item => item.quantity > 0) ? (
                  <>
                    <PieChart data={analytics.purchasesByFiberType} />
                    {/* Fiber Type Percentages */}
                    <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                      {analytics.purchasesByFiberType.filter(item => item.percentage > 0).map((item, index) => {
                        const colorClass = fiberColors[item.type as keyof typeof fiberColors];
                        return (
                          <div key={index} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${colorClass.bg} mb-1`}></div>
                            <p className="text-[10px] text-gray-600 font-medium mb-0.5">{item.type}</p>
                            <p className="text-sm font-black text-gray-900">{item.percentage.toFixed(0)}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-xs">No purchase data yet</p>
                  </div>
                )}
              </div>

              {/* Sales Breakdown */}
              <div className="flex flex-col items-center border-l border-gray-100 md:pl-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">My Sales</h3>
                {analytics.salesByFiberType && analytics.salesByFiberType.length > 0 && analytics.salesByFiberType.some(item => item.quantity > 0) ? (
                  <>
                    <PieChart data={analytics.salesByFiberType} />
                    {/* Fiber Type Percentages */}
                    <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                      {analytics.salesByFiberType.filter(item => item.percentage > 0).map((item, index) => {
                        const colorClass = fiberColors[item.type as keyof typeof fiberColors];
                        return (
                          <div key={index} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${colorClass.bg} mb-1`}></div>
                            <p className="text-[10px] text-gray-600 font-medium mb-0.5">{item.type}</p>
                            <p className="text-sm font-black text-gray-900">{item.percentage.toFixed(0)}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p className="text-xs">No sales data yet</p>
                  </div>
                )}
              </div>
            </div>
            {/* Fiber Insight */}
            <div className="col-span-1 md:col-span-2">
              <ChartInsight
                type={(() => {
                  if (analytics.purchasesByFiberType.length === 0) return 'neutral';
                  const dominant = analytics.purchasesByFiberType.reduce((prev, current) =>
                    (prev.percentage > current.percentage) ? prev : current
                  );
                  if (dominant.percentage > 70) return 'negative';
                  return 'positive';
                })()}
                message={(() => {
                  if (analytics.purchasesByFiberType.length === 0) {
                    return "No purchase data available yet. Start recording your fiber purchases to get intelligent insights on your sourcing strategy.";
                  }

                  const dominant = analytics.purchasesByFiberType.reduce((prev, current) =>
                    (prev.percentage > current.percentage) ? prev : current
                  );

                  const classA = analytics.purchasesByFiberType.find(p => p.type === 'Class A');
                  const classB = analytics.purchasesByFiberType.find(p => p.type === 'Class B');

                  // Critical dependency scenario
                  if (dominant.percentage > 70) {
                    return `⚠️ High Concentration Risk: ${dominant.percentage.toFixed(0)}% of your purchases are ${dominant.type}. If ${dominant.type} prices spike or supply becomes scarce, your entire operation is at risk. Recommendation: Diversify by sourcing at least 20-30% from other fiber classes to build resilience.`;
                  }

                  // Balanced portfolio scenario
                  if (classA && classB && classA.percentage > 0 && classB.percentage > 0) {
                    const balance = Math.abs(classA.percentage - classB.percentage);
                    if (balance < 30) {
                      return `✅ Well-Balanced Portfolio: Your ${classA.percentage.toFixed(0)}% Class A and ${classB.percentage.toFixed(0)}% Class B split shows smart risk management. This diversification protects you from price volatility in any single fiber grade. Continue this strategy to maintain stable profit margins.`;
                    }
                  }

                  // Default positive message
                  return `✅ Healthy Diversification: Your fiber sourcing is spread across multiple classes (${analytics.purchasesByFiberType.filter(p => p.percentage > 10).map(p => `${p.type}: ${p.percentage.toFixed(0)}%`).join(', ')}). This balanced approach minimizes supply chain risk and gives you flexibility to respond to market price changes.`;
                })()}
              />
            </div>
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
                <div className="flex gap-1 bg-gray-50 border border-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSpendingViewMode('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${spendingViewMode === 'monthly'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSpendingViewMode('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${spendingViewMode === 'yearly'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
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
            <ChartInsight
              type={analytics.spendingGrowth > 0 ? 'neutral' : analytics.spendingGrowth < 0 ? 'positive' : 'neutral'}
              message={spendingViewMode === 'monthly'
                ? (analytics.spendingGrowth > 0
                  ? `Monthly spending increased by ${analytics.spendingGrowth.toFixed(1)}% vs last month. Ensure your inventory turnover rate matches this increased investment to avoid cash flow issues.`
                  : analytics.spendingGrowth < 0
                    ? `Monthly spending decreased by ${Math.abs(analytics.spendingGrowth).toFixed(1)}%. This improved efficiency helps maintain better cash reserves for future bulk purchases.`
                    : `Monthly spending is stable (0% change). Consistent procurement pace strengthens supplier relationships and ensures predictable cash flow.`)
                : (analytics.yearlySpendingByYear.length >= 2
                  ? (() => {
                    const currentYear = analytics.yearlySpendingByYear[analytics.yearlySpendingByYear.length - 1];
                    const previousYear = analytics.yearlySpendingByYear[analytics.yearlySpendingByYear.length - 2];
                    const yearlyGrowth = previousYear.amount > 0
                      ? ((currentYear.amount - previousYear.amount) / previousYear.amount * 100)
                      : 0;
                    return yearlyGrowth > 10
                      ? `Year-over-year spending up ${yearlyGrowth.toFixed(1)}%. Scaling operations requires capital, but verify this aligns with proportional sales growth to maintain profitability.`
                      : yearlyGrowth < -10
                        ? `Year-over-year spending down ${Math.abs(yearlyGrowth).toFixed(1)}%. Strong cost control detected. Monitor if this affects your ability to meet customer demand.`
                        : `Year-over-year spending is stable (${yearlyGrowth.toFixed(1)}% change). Consistent annual procurement indicates mature business operations.`;
                  })()
                  : `Viewing yearly trends. Switch to monthly view for detailed month-to-month spending analysis.`)
              }
            />
          </div>
        </div>

        {/* Sales and Transactions Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Monthly Sales Bar Chart */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                  Sales
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Revenue from fiber sales</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-50 border border-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSalesViewMode('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${salesViewMode === 'monthly'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSalesViewMode('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${salesViewMode === 'yearly'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
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

            <div className="mt-auto">
              <ChartInsight
                type={analytics.salesGrowth > 0 ? 'positive' : analytics.salesGrowth < 0 ? 'negative' : 'neutral'}
                message={salesViewMode === 'monthly'
                  ? (analytics.salesGrowth > 0
                    ? `Strong Monthly Performance! Sales up ${analytics.salesGrowth.toFixed(1)}% vs last month. Reinvest this revenue into securing premium fiber inventory to capitalize on demand.`
                    : analytics.salesGrowth < 0
                      ? `Monthly sales dipped ${Math.abs(analytics.salesGrowth).toFixed(1)}%. Re-engage your top 5 customers and verify you have adequate Class A stock to meet their needs.`
                      : `Monthly sales stable (0% change). Consistent revenue stream enables predictable planning for long-term distribution contracts.`)
                  : (analytics.yearlySalesByYear.length >= 2
                    ? (() => {
                      const currentYear = analytics.yearlySalesByYear[analytics.yearlySalesByYear.length - 1];
                      const previousYear = analytics.yearlySalesByYear[analytics.yearlySalesByYear.length - 2];
                      const yearlyGrowth = previousYear.amount > 0
                        ? ((currentYear.amount - previousYear.amount) / previousYear.amount * 100)
                        : 0;
                      return yearlyGrowth > 15
                        ? `Exceptional year-over-year growth: +${yearlyGrowth.toFixed(1)}%! Your market position is strengthening. Consider expanding your buyer network to sustain this momentum.`
                        : yearlyGrowth > 0
                          ? `Solid annual growth: +${yearlyGrowth.toFixed(1)}%. Steady upward trajectory indicates healthy business expansion and strong customer retention.`
                          : yearlyGrowth < -10
                            ? `Year-over-year sales declined ${Math.abs(yearlyGrowth).toFixed(1)}%. Analyze if this is due to market conditions, pricing strategy, or customer churn. Action needed.`
                            : `Annual sales relatively flat (${yearlyGrowth.toFixed(1)}% change). Market maturity detected. Focus on margin optimization and customer loyalty programs.`;
                    })()
                    : `Viewing yearly trends. Switch to monthly view for detailed month-to-month sales performance analysis.`)
                }
              />
            </div>
          </div>

          {/* Monthly Transactions Bar Chart */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 border border-white/60 hover:shadow-3xl transition-shadow duration-300 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                  <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                  Transactions
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-2 ml-5 md:ml-7 font-medium">Number of purchases & sales</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-50 border border-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setTransactionsViewMode('monthly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${transactionsViewMode === 'monthly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTransactionsViewMode('yearly')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${transactionsViewMode === 'yearly'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900'
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

            <div className="mt-auto">
              <ChartInsight
                type="neutral"
                message={transactionsViewMode === 'monthly'
                  ? (() => {
                    const totalMonthlyCount = analytics.monthlyTransactions.reduce((acc, curr) => acc + curr.count, 0);
                    return totalMonthlyCount > 50
                      ? `⚙️ Smart Logistics Optimization: With ${totalMonthlyCount} transactions processed in ${selectedYear}, your operational tempo is high. Recommendation: Batch payments for repeat fiber loads to reduce administrative overhead and improve cash flow visibility.`
                      : `⚙️ Operational Efficiency: In ${selectedYear}, you processed ${totalMonthlyCount} transactions. Volume is stable. This is an ideal time to conduct quality audits on your incoming Class A supply to ensure your high-margin standards are being maintained.`;
                  })()
                  : (analytics.yearlyTransactionsByYear.length >= 2
                    ? (() => {
                      const currentYear = analytics.yearlyTransactionsByYear[analytics.yearlyTransactionsByYear.length - 1];
                      const previousYear = analytics.yearlyTransactionsByYear[analytics.yearlyTransactionsByYear.length - 2];
                      const growth = previousYear.count > 0 ? ((currentYear.count - previousYear.count) / previousYear.count * 100) : 0;
                      return growth > 15
                        ? `🚀 Strategic Scaling Analysis: Your annual transaction volume has expanded by ${growth.toFixed(1)}%. This indicates strong market penetration. Next Step: Formalize long-term fulfillment contracts with your top 5 suppliers to secure volume discounts.`
                        : `📊 Market Stability Report: Annual transaction volume is ${Math.abs(growth) < 5 ? 'highly consistent' : growth > 0 ? 'showing healthy organic growth' : 'in a consolidation phase'}. Recommendation: Focus on increasing the average value per load from existing suppliers rather than quantity.`
                    })()
                    : "📊 Supply Chain Connectivity: Your transaction patterns indicate a mature procurement network. Consistency in these cycles is the strongest predictor of long-term business stability.")
                }
              />
            </div>
          </div>
        </div>

        {/* Profit Overview Section */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 lg:p-8 border border-white/60 hover:shadow-3xl transition-shadow duration-300">
          <div className="flex items-center gap-2 md:gap-3 mb-6">
            <div className="w-1 md:w-1.5 h-8 md:h-10 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
            <div>
              <h2 className="text-lg md:text-2xl font-black text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-500" strokeWidth={3} size={24} />
                Profit & Margin Overview
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1 font-medium">Yearly profit analysis (Sales - Spending)</p>
            </div>
          </div>

          {analytics.yearlyProfitByYear && analytics.yearlyProfitByYear.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-xl bg-white">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="px-6 py-5 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Year</th>
                      <th className="px-6 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Sales Revenue</th>
                      <th className="px-6 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Op. Spending</th>
                      <th className="px-6 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Net Profit</th>
                      <th className="px-6 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Margin</th>
                      <th className="px-6 py-5 text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">YoY Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics.yearlyProfitByYear.map((yearData, index) => {
                      const previousYear = index > 0 ? analytics.yearlyProfitByYear[index - 1] : null;
                      const profitChange = previousYear
                        ? ((yearData.profit - previousYear.profit) / Math.abs(previousYear.profit) * 100)
                        : 0;
                      const isPositive = profitChange > 0;
                      const isNeutral = Math.abs(profitChange) < 5;
                      const currentYear = new Date().getFullYear();
                      const isCurrentYear = parseInt(yearData.year) === currentYear;
                      const isPartialYear = isCurrentYear && new Date().getMonth() < 11;

                      return (
                        <tr key={yearData.year} className="group hover:bg-blue-50/40 transition-all duration-200">
                          <td className="px-6 py-5 text-sm font-black text-slate-900">
                            <div className="flex items-center gap-2">
                              {yearData.year}
                              {isPartialYear && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded tracking-widest leading-none">
                                  YTD
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-600 text-right tabular-nums">
                            ₱{yearData.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-600 text-right tabular-nums">
                            ₱{yearData.spending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-5 text-sm font-black text-right tabular-nums">
                            <span className={`${yearData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ₱{yearData.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm font-black text-right tabular-nums">
                            <div className="flex justify-end">
                              <span className={`px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm border ${yearData.margin >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                yearData.margin >= 50 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  yearData.margin >= 30 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                {yearData.margin.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex justify-center">
                              {index === 0 ? (
                                <span className="text-slate-300 text-lg font-black tracking-widest">---</span>
                              ) : isNeutral ? (
                                <div title="Neutral growth" className="p-2 bg-slate-100 rounded-xl text-slate-500 shadow-sm border border-slate-200">
                                  <Activity size={12} strokeWidth={4} />
                                </div>
                              ) : isPositive ? (
                                <div title="Positive growth" className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm border border-emerald-200">
                                  <ArrowUp size={12} strokeWidth={4} />
                                </div>
                              ) : (
                                <div title="Negative growth" className="p-2 bg-rose-100 rounded-xl text-rose-600 shadow-sm border border-rose-200">
                                  <ArrowDown size={12} strokeWidth={4} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (

            <div className="text-center py-12">
              <div className="p-6 bg-emerald-50 rounded-full inline-block mb-4">
                <TrendingUp className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-gray-600 font-medium">No profit data available</p>
              <p className="text-gray-400 text-sm mt-2">Complete some sales to see your profit analysis</p>
            </div>
          )}
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
      </div >
    </div >
  );
};

export default BuyerAnalytics;
