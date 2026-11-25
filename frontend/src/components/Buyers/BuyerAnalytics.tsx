import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  BarChart3,
  ArrowUp,
  ArrowDown,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  KpiStrip,
  EditorialCard,
  SegmentedToggle,
  StatusPill,
  EditorialCallout,
  EDITORIAL_CHART,
} from '../Shared/EditorialUI';

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
  spendingGrowth: number;
  salesGrowth: number;
  quantityGrowth: number;
  insights: { type: 'positive' | 'negative' | 'neutral', message: string, action: string }[];
}

const FIBER_CHART_COLORS: Record<string, string> = {
  'Class A': EDITORIAL_CHART.colors.emerald,
  'Class B': EDITORIAL_CHART.colors.amber,
  'Class C': EDITORIAL_CHART.colors.espresso,
};

const BuyerAnalytics: React.FC = () => {
  const ChartInsight: React.FC<{ type: 'positive' | 'negative' | 'neutral'; message: string }> = ({ type, message }) => {
    const tone = type === 'positive' ? 'emerald' : type === 'negative' ? 'rose' : 'amber';
    return (
      <EditorialCallout
        tone={tone}
        title="Analysis & Recommendation:"
        className="mt-5"
      >
        {message}
      </EditorialCallout>
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
  const [selectedMonth] = useState('all');
  const [spendingViewMode, setSpendingViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [salesViewMode, setSalesViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [transactionsViewMode, setTransactionsViewMode] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const purchasesResponse = await fetch(
        `${API_BASE_URL}/api/buyer-purchases`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!purchasesResponse.ok) {
        throw new Error(`HTTP error! status: ${purchasesResponse.status}`);
      }

      const purchasesData = await purchasesResponse.json();
      const purchases = purchasesData.purchases || [];

      let sales: any[] = [];
      try {
        const salesResponse = await fetch(
          `${API_BASE_URL}/api/buyer-purchases/sales`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          sales = salesData.sales || [];
        }
      } catch (err) {
        console.warn('Sales endpoint not available');
      }

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

      const yearlyProfitByYear = allYears.map(year => {
        const yearSales = yearlySalesMap[year] || 0;
        const spending = yearlySpendingMap[year] || 0;
        const profit = yearSales - spending;
        const margin = yearSales > 0 ? (profit / yearSales) * 100 : 0;
        return { year, profit, margin, sales: yearSales, spending };
      });

      const availableYears = allYears.length > 0 ? allYears : [new Date().getFullYear().toString()];

      const allTimeTotalSpent = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const allTimeTotalPurchases = purchases.length;
      const allTimeTotalQuantity = purchases.reduce((sum: number, p: any) => sum + parseFloat(p.quantity || 0), 0);
      const allTimeTotalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const allTimeTotalSales = sales.length;
      const allTimeYearlyProfit = allTimeTotalSalesAmount - allTimeTotalSpent;

      const filteredPurchases = purchases.filter((p: any) => {
        const date = new Date(p.created_at);
        return date.getFullYear() === selectedYear;
      });

      const filteredSales = sales.filter((s: any) => {
        const date = new Date(s.sale_date || s.created_at);
        return date.getFullYear() === selectedYear;
      });

      const totalSpent = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const totalPurchases = filteredPurchases.length;
      const totalQuantity = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.quantity || 0), 0);
      const yearlyFilteredSalesAmount = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalCost = filteredPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total_price || 0), 0);
      const yearlyProfit = yearlyFilteredSalesAmount - totalCost;

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

      const purchasesByTypeMap: { [key: string]: { quantity: number; cost: number } } = {
        'Class A': { quantity: 0, cost: 0 },
        'Class B': { quantity: 0, cost: 0 },
        'Class C': { quantity: 0, cost: 0 }
      };

      filteredPurchases.forEach((p: any) => {
        let fiberClass = p.fiber_quality || p.grade || 'Class C';
        if (fiberClass.includes('A')) fiberClass = 'Class A';
        else if (fiberClass.includes('B')) fiberClass = 'Class B';
        else if (fiberClass.includes('C')) fiberClass = 'Class C';
        else fiberClass = 'Class C';

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
        quantityGrowth = 100;
      }

      const insights: { type: 'positive' | 'negative' | 'neutral', message: string, action: string }[] = [];
      const currentYearData = yearlyProfitByYear.find(y => y.year === selectedYear.toString());
      const previousYearData = yearlyProfitByYear.find(y => y.year === (selectedYear - 1).toString());

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
        const yearOverYearGrowth = previousYearData && currentYearData
          ? ((currentYearData.sales - previousYearData.sales) / previousYearData.sales * 100).toFixed(1)
          : 'N/A';

        insights.push({
          type: 'negative',
          message: `Sales Alert: ${months[currentMonthIndex]} ${selectedYear} Performance`,
          action: `Recent drop: ${months[currentMonthIndex]} lower than ${months[lastMonthIndex]} peak. Overall business health: ${yearOverYearGrowth !== 'N/A' && parseFloat(yearOverYearGrowth) > 0 ? 'GOOD' : 'MONITOR'}`
        });
      } else if (salesGrowth < 0) {
        insights.push({
          type: 'neutral',
          message: 'Slight Dip in Sales',
          action: 'Market activity is slower this month. Normal seasonal variation. Consider reaching out to inactive buyers for the upcoming busy season.'
        });
      }

      if (currentMonthSpending > 0 && currentMonthSales === 0) {
        insights.push({ type: 'neutral', message: 'Investment Phase Detected', action: 'You are currently buying without selling. Ensure your storage is adequate for this inventory.' });
      } else if (currentMonthSpending > currentMonthSales * 2) {
        insights.push({ type: 'negative', message: 'High Burn Rate', action: 'Your spending is double your sales. Review if you are overpaying for certain fiber classes.' });
      }

      if (totalQuantity > 0 && totalQuantity < 500) {
        insights.push({ type: 'neutral', message: 'Low Stock Levels', action: 'Supply is dwindling. Check availability with your regular farmers before demand spikes.' });
      }

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
        allTimeTotalQuantity,
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

  const renderDonut = (data: { type: string; percentage: number; quantity: number }[], emptyLabel: string) => {
    const validData = data.filter(item => item.percentage > 0);
    if (validData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-52 text-gray-400">
          <PieChartIcon className="w-8 h-8 mb-2 text-gray-300" />
          <p className="text-xs">{emptyLabel}</p>
        </div>
      );
    }

    return (
      <>
        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={validData}
                dataKey="quantity"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={74}
                paddingAngle={2}
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {validData.map((entry, idx) => (
                  <Cell
                    key={entry.type || idx}
                    fill={FIBER_CHART_COLORS[entry.type] || EDITORIAL_CHART.colors.slate}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={EDITORIAL_CHART.tooltipStyle}
                formatter={(value: unknown, name: unknown) => [
                  `${Number(value ?? 0).toLocaleString()} kg`,
                  String(name ?? ''),
                ]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 w-full">
          {validData.map((item) => (
            <div key={item.type} className="flex flex-col items-center p-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: FIBER_CHART_COLORS[item.type] || EDITORIAL_CHART.colors.slate }}
                />
                <span className="text-[11px] text-gray-600 font-medium">{item.type}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{item.percentage.toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  const spendingChartData = spendingViewMode === 'monthly'
    ? analytics.monthlySpending.map(item => ({ label: item.month, value: item.amount }))
    : analytics.yearlySpendingByYear.map(item => ({ label: item.year, value: item.amount }));

  const salesChartData = salesViewMode === 'monthly'
    ? analytics.monthlySales.map(item => ({ label: item.month, value: item.amount, transactions: item.transactions }))
    : analytics.yearlySalesByYear.map(item => ({ label: item.year, value: item.amount, transactions: 0 }));

  const transactionsChartData = transactionsViewMode === 'monthly'
    ? analytics.monthlyTransactions.map(item => ({ label: item.month, value: item.count }))
    : analytics.yearlyTransactionsByYear.map(item => ({ label: item.year, value: item.count }));

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Sub-header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Performance Overview</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Real-time supply chain analytics and insights</p>
        </div>
        <div className="inline-flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-gray-200 self-start sm:self-auto">
          <label htmlFor="buyer-analytics-year" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Year
          </label>
          <select
            id="buyer-analytics-year"
            value={String(selectedYear)}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent text-gray-900 text-sm font-semibold cursor-pointer outline-none tabular-nums"
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

      {/* KPI Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Spent (All Time)',
            value: `₱${(analytics.allTimeTotalSpent || 0).toLocaleString()}`,
            subtext: `${analytics.allTimeTotalPurchases} purchases`,
            accentSubtext: `${analytics.spendingGrowth >= 0 ? '+' : ''}${analytics.spendingGrowth.toFixed(1)}% MoM`,
          },
          {
            label: 'Total Sales Revenue',
            value: analytics.allTimeTotalSales > 0 || analytics.allTimeTotalSalesAmount > 0
              ? `₱${(analytics.allTimeTotalSalesAmount || 0).toLocaleString()}`
              : '₱0',
            subtext: `${analytics.allTimeTotalSales} sales`,
            accentSubtext: `${analytics.salesGrowth >= 0 ? '+' : ''}${analytics.salesGrowth.toFixed(1)}% MoM`,
          },
          {
            label: 'Total Fiber Volume',
            value: `${(analytics.allTimeTotalQuantity || 0).toLocaleString()} kg`,
            subtext: 'Purchased volume',
            accentSubtext: `${analytics.quantityGrowth >= 0 ? '+' : ''}${analytics.quantityGrowth.toFixed(1)}% MoM`,
          },
          {
            label: 'Net Profit',
            value: analytics.allTimeTotalSales > 0 || analytics.allTimeTotalSalesAmount > 0
              ? `${analytics.allTimeYearlyProfit < 0 ? '-' : ''}₱${Math.abs(analytics.allTimeYearlyProfit || 0).toLocaleString()}`
              : 'No sales yet',
            subtext: 'Sales minus purchases',
          },
        ]}
      />

      {/* Charts Row 1: Fiber Analytics + Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fiber Analytics Donut Card */}
        <EditorialCard
          title="Fiber Analytics"
          subtitle="Distribution by fiber class"
          actions={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <PieChartIcon className="w-4 h-4 text-[#047857]" />
              {selectedYear}
            </span>
          }
          className="h-full flex flex-col"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">My Purchases</h3>
              {renderDonut(analytics.purchasesByFiberType || [], 'No purchase data yet')}
            </div>

            <div className="flex flex-col items-center md:border-l md:border-gray-100 md:pl-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">My Sales</h3>
              {renderDonut(analytics.salesByFiberType || [], 'No sales data yet')}
            </div>
          </div>

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
                return 'No purchase data available yet. Start recording your fiber purchases to get intelligent insights on your sourcing strategy.';
              }

              const dominant = analytics.purchasesByFiberType.reduce((prev, current) =>
                (prev.percentage > current.percentage) ? prev : current
              );

              const classA = analytics.purchasesByFiberType.find(p => p.type === 'Class A');
              const classB = analytics.purchasesByFiberType.find(p => p.type === 'Class B');

              if (dominant.percentage > 70) {
                return `High Concentration Risk: ${dominant.percentage.toFixed(0)}% of your purchases are ${dominant.type}. Diversify by sourcing at least 20–30% from other fiber classes to build resilience against price spikes.`;
              }

              if (classA && classB && classA.percentage > 0 && classB.percentage > 0) {
                const balance = Math.abs(classA.percentage - classB.percentage);
                if (balance < 30) {
                  return `Well-Balanced Portfolio: Your ${classA.percentage.toFixed(0)}% Class A and ${classB.percentage.toFixed(0)}% Class B split shows disciplined risk management against price volatility.`;
                }
              }

              return `Healthy Diversification: Fiber sourcing is spread across multiple classes (${analytics.purchasesByFiberType.filter(p => p.percentage > 10).map(p => `${p.type}: ${p.percentage.toFixed(0)}%`).join(', ')}).`;
            })()}
          />
        </EditorialCard>

        {/* Spending Bar Chart Card */}
        <EditorialCard
          title="Spending"
          subtitle="Purchase expenses over time"
          actions={
            <SegmentedToggle
              value={spendingViewMode}
              onChange={(val) => setSpendingViewMode(val as 'monthly' | 'yearly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          }
          className="h-full flex flex-col"
        >
          {spendingChartData.length > 0 ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={spendingChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                  <XAxis dataKey="label" {...EDITORIAL_CHART.xAxisProps} />
                  <YAxis
                    {...EDITORIAL_CHART.yAxisProps}
                    tickFormatter={(val: unknown) => {
                      const n = Number(val ?? 0);
                      return n >= 1000 ? `₱${(n / 1000).toFixed(0)}k` : `₱${n}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                    formatter={(value: unknown) => [`₱${Number(value ?? 0).toLocaleString()}`, 'Spending']}
                  />
                  <Bar
                    dataKey="value"
                    fill={EDITORIAL_CHART.colors.amber}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <BarChart3 size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No spending data available</p>
              <p className="text-xs text-gray-400 mt-1">Your purchase history will appear here</p>
            </div>
          )}

          <ChartInsight
            type={analytics.spendingGrowth > 0 ? 'neutral' : analytics.spendingGrowth < 0 ? 'positive' : 'neutral'}
            message={spendingViewMode === 'monthly'
              ? (analytics.spendingGrowth > 0
                ? `Monthly spending increased by ${analytics.spendingGrowth.toFixed(1)}% vs last month. Ensure your inventory turnover rate matches this increased investment.`
                : analytics.spendingGrowth < 0
                  ? `Monthly spending decreased by ${Math.abs(analytics.spendingGrowth).toFixed(1)}%. This improved efficiency helps maintain better cash reserves for bulk purchases.`
                  : 'Monthly spending is stable (0% change). Consistent procurement pace strengthens supplier relationships.')
              : (analytics.yearlySpendingByYear.length >= 2
                ? (() => {
                  const currentYear = analytics.yearlySpendingByYear[analytics.yearlySpendingByYear.length - 1];
                  const previousYear = analytics.yearlySpendingByYear[analytics.yearlySpendingByYear.length - 2];
                  const yearlyGrowth = previousYear.amount > 0
                    ? ((currentYear.amount - previousYear.amount) / previousYear.amount * 100)
                    : 0;
                  return yearlyGrowth > 10
                    ? `Year-over-year spending up ${yearlyGrowth.toFixed(1)}%. Verify this aligns with proportional sales growth to maintain profitability.`
                    : yearlyGrowth < -10
                      ? `Year-over-year spending down ${Math.abs(yearlyGrowth).toFixed(1)}%. Strong cost control detected; monitor customer demand fulfillment.`
                      : `Year-over-year spending is stable (${yearlyGrowth.toFixed(1)}% change). Consistent annual procurement indicates mature operations.`;
                })()
                : 'Viewing yearly trends. Switch to monthly view for month-to-month spending analysis.')
            }
          />
        </EditorialCard>
      </div>

      {/* Charts Row 2: Sales (ComposedChart + Line) + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales ComposedChart Card */}
        <EditorialCard
          title="Sales"
          subtitle="Revenue and order velocity from fiber sales"
          actions={
            <SegmentedToggle
              value={salesViewMode}
              onChange={(val) => setSalesViewMode(val as 'monthly' | 'yearly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          }
          className="h-full flex flex-col"
        >
          {salesChartData.length > 0 ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                  <XAxis dataKey="label" {...EDITORIAL_CHART.xAxisProps} />
                  <YAxis
                    yAxisId="left"
                    {...EDITORIAL_CHART.yAxisProps}
                    tickFormatter={(val: unknown) => {
                      const n = Number(val ?? 0);
                      return n >= 1000 ? `₱${(n / 1000).toFixed(0)}k` : `₱${n}`;
                    }}
                  />
                  {salesViewMode === 'monthly' && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      {...EDITORIAL_CHART.yAxisProps}
                      allowDecimals={false}
                    />
                  )}
                  <Tooltip
                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                    formatter={(value: unknown, name: unknown) => {
                      const label = String(name ?? '');
                      if (label === 'transactions') {
                        return [Number(value ?? 0).toLocaleString(), 'Orders'];
                      }
                      return [`₱${Number(value ?? 0).toLocaleString()}`, 'Sales Revenue'];
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="value"
                    fill={EDITORIAL_CHART.colors.emerald}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  {salesViewMode === 'monthly' && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="transactions"
                      stroke={EDITORIAL_CHART.colors.espresso}
                      strokeWidth={2}
                      dot={{ r: 3, fill: EDITORIAL_CHART.colors.espresso }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <TrendingUp size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No sales data available</p>
              <p className="text-xs text-gray-400 mt-1">Sales revenue will be displayed here</p>
            </div>
          )}

          <ChartInsight
            type={analytics.salesGrowth > 0 ? 'positive' : analytics.salesGrowth < 0 ? 'negative' : 'neutral'}
            message={salesViewMode === 'monthly'
              ? (analytics.salesGrowth > 0
                ? `Sales up ${analytics.salesGrowth.toFixed(1)}% vs last month. Reinvest this revenue into securing premium fiber inventory to capitalize on demand.`
                : analytics.salesGrowth < 0
                  ? `Monthly sales dipped ${Math.abs(analytics.salesGrowth).toFixed(1)}%. Re-engage your top 5 customers and verify adequate Class A stock.`
                  : 'Monthly sales stable (0% change). Consistent revenue stream enables predictable planning for long-term contracts.')
              : (analytics.yearlySalesByYear.length >= 2
                ? (() => {
                  const currentYear = analytics.yearlySalesByYear[analytics.yearlySalesByYear.length - 1];
                  const previousYear = analytics.yearlySalesByYear[analytics.yearlySalesByYear.length - 2];
                  const yearlyGrowth = previousYear.amount > 0
                    ? ((currentYear.amount - previousYear.amount) / previousYear.amount * 100)
                    : 0;
                  return yearlyGrowth > 15
                    ? `Year-over-year growth: +${yearlyGrowth.toFixed(1)}%. Consider expanding your buyer network to sustain this momentum.`
                    : yearlyGrowth > 0
                      ? `Solid annual growth: +${yearlyGrowth.toFixed(1)}%. Steady upward trajectory indicates healthy business expansion.`
                      : yearlyGrowth < -10
                        ? `Year-over-year sales declined ${Math.abs(yearlyGrowth).toFixed(1)}%. Review pricing strategy and customer retention.`
                        : `Annual sales flat (${yearlyGrowth.toFixed(1)}% change). Focus on margin optimization and customer loyalty.`;
                })()
                : 'Viewing yearly trends. Switch to monthly view for month-to-month sales performance analysis.')
            }
          />
        </EditorialCard>

        {/* Transactions Bar Chart Card */}
        <EditorialCard
          title="Transactions"
          subtitle="Number of purchases & sales"
          actions={
            <SegmentedToggle
              value={transactionsViewMode}
              onChange={(val) => setTransactionsViewMode(val as 'monthly' | 'yearly')}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          }
          className="h-full flex flex-col"
        >
          {transactionsChartData.length > 0 ? (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={transactionsChartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                  <XAxis dataKey="label" {...EDITORIAL_CHART.xAxisProps} />
                  <YAxis {...EDITORIAL_CHART.yAxisProps} allowDecimals={false} />
                  <Tooltip
                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                    formatter={(value: unknown) => [Number(value ?? 0).toLocaleString(), 'Transactions']}
                  />
                  <Bar
                    dataKey="value"
                    fill={EDITORIAL_CHART.colors.espresso}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400">
              <Activity size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No transaction data available</p>
              <p className="text-xs text-gray-400 mt-1">Transaction history will be shown here</p>
            </div>
          )}

          <ChartInsight
            type="neutral"
            message={transactionsViewMode === 'monthly'
              ? (() => {
                const totalMonthlyCount = analytics.monthlyTransactions.reduce((acc, curr) => acc + curr.count, 0);
                return totalMonthlyCount > 50
                  ? `Smart Logistics Optimization: With ${totalMonthlyCount} transactions processed in ${selectedYear}, batch payments for repeat fiber loads to reduce overhead.`
                  : `Operational Efficiency: In ${selectedYear}, you processed ${totalMonthlyCount} transactions. Volume is stable—ideal for quality audits on incoming Class A supply.`;
              })()
              : (analytics.yearlyTransactionsByYear.length >= 2
                ? (() => {
                  const currentYear = analytics.yearlyTransactionsByYear[analytics.yearlyTransactionsByYear.length - 1];
                  const previousYear = analytics.yearlyTransactionsByYear[analytics.yearlyTransactionsByYear.length - 2];
                  const growth = previousYear.count > 0 ? ((currentYear.count - previousYear.count) / previousYear.count * 100) : 0;
                  return growth > 15
                    ? `Strategic Scaling: Annual transaction volume expanded by ${growth.toFixed(1)}%. Formalize long-term fulfillment contracts with top suppliers.`
                    : `Market Stability: Annual transaction volume is ${Math.abs(growth) < 5 ? 'consistent' : growth > 0 ? 'growing organically' : 'consolidating'}. Focus on higher average load value.`;
                })()
                : 'Supply Chain Connectivity: Your transaction patterns indicate a steady procurement cycle.')
            }
          />
        </EditorialCard>
      </div>

      {/* Profit & Margin Overview */}
      <EditorialCard
        title="Profit & Margin Overview"
        subtitle="Yearly profit analysis (Sales minus Spending)"
        noPadding
      >
        {analytics.yearlyProfitByYear && analytics.yearlyProfitByYear.length > 0 ? (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Profit and margin overview">
            <table>
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5 text-left">Year</th>
                  <th className="px-6 py-3.5 text-right">Sales Revenue</th>
                  <th className="px-6 py-3.5 text-right">Op. Spending</th>
                  <th className="px-6 py-3.5 text-right">Net Profit</th>
                  <th className="px-6 py-3.5 text-right">Margin</th>
                  <th className="px-6 py-3.5 text-center">YoY Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.yearlyProfitByYear.map((yearData, index) => {
                  const previousYear = index > 0 ? analytics.yearlyProfitByYear[index - 1] : null;
                  const profitChange = previousYear && previousYear.profit !== 0
                    ? ((yearData.profit - previousYear.profit) / Math.abs(previousYear.profit) * 100)
                    : 0;
                  const isPositive = profitChange > 0;
                  const isNeutral = Math.abs(profitChange) < 5;
                  const currentYear = new Date().getFullYear();
                  const isCurrentYear = parseInt(yearData.year) === currentYear;
                  const isPartialYear = isCurrentYear && new Date().getMonth() < 11;

                  const marginTone =
                    yearData.margin >= 70 ? 'success' :
                    yearData.margin >= 50 ? 'info' :
                    yearData.margin >= 30 ? 'warning' : 'danger';

                  return (
                    <tr key={yearData.year} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{yearData.year}</span>
                          {isPartialYear && <StatusPill tone="info">YTD</StatusPill>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">
                        ₱{yearData.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">
                        ₱{yearData.spending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right tabular-nums">
                        <span className={yearData.profit >= 0 ? 'text-[#047857]' : 'text-red-700'}>
                          ₱{yearData.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusPill tone={marginTone}>{yearData.margin.toFixed(1)}%</StatusPill>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {index === 0 ? (
                            <span className="text-gray-300 text-sm">—</span>
                          ) : isNeutral ? (
                            <span title="Neutral growth" className="inline-flex p-1.5 bg-gray-100 rounded-lg text-gray-500">
                              <Activity size={14} />
                            </span>
                          ) : isPositive ? (
                            <span title="Positive growth" className="inline-flex p-1.5 bg-[#EAF6F0] rounded-lg text-[#047857]">
                              <ArrowUp size={14} />
                            </span>
                          ) : (
                            <span title="Negative growth" className="inline-flex p-1.5 bg-[#FEE2E2] rounded-lg text-[#991B1B]">
                              <ArrowDown size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No profit data available</p>
            <p className="text-xs text-gray-400 mt-1">Complete some sales to see your profit analysis</p>
          </div>
        )}
      </EditorialCard>

      {/* Recent Transactions Table */}
      <EditorialCard
        title="Recent Transactions"
        subtitle={`Latest purchases in ${selectedYear}`}
        noPadding
      >
        {(analytics.recentTransactions || []).length > 0 ? (
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Recent buyer transactions">
            <table>
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5 text-left">ID</th>
                  <th className="px-6 py-3.5 text-left">Date</th>
                  <th className="px-6 py-3.5 text-left">Quality</th>
                  <th className="px-6 py-3.5 text-right">Quantity</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-left">Variety</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(analytics.recentTransactions || []).slice(0, 10).map((transaction, index) => {
                  const date = new Date(transaction.created_at);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const sequentialNum = String(index + 1).padStart(4, '0');
                  const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;

                  const qualityTone =
                    transaction.fiber_quality?.includes('A') ? 'success' :
                    transaction.fiber_quality?.includes('B') ? 'info' :
                    transaction.fiber_quality?.includes('C') ? 'warning' : 'neutral';

                  return (
                    <tr key={transaction.purchase_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-xs sm:text-sm font-mono font-semibold text-gray-900">
                        {transactionId}
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill tone={qualityTone}>{transaction.fiber_quality}</StatusPill>
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm text-gray-900 font-semibold text-right tabular-nums">
                        {transaction.quantity} kg
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm font-bold text-gray-900 text-right tabular-nums">
                        ₱{transaction.total_price?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill tone="neutral">{transaction.variety || 'Standard'}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Your purchase history will appear here</p>
          </div>
        )}
      </EditorialCard>
    </div>
  );
};

export default BuyerAnalytics;
