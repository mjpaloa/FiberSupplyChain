import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  totalSpent: number;
  totalPurchases: number;
  totalQuantity: number;
  monthlySpending: { month: string; amount: number }[];
  recentTransactions: any[];
  yearlyProfit: number;
  monthlyComparison: { month: string; current: number; previous: number }[];
}

const BuyerAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSpent: 0,
    totalPurchases: 0,
    totalQuantity: 0,
    monthlySpending: [],
    recentTransactions: [],
    yearlyProfit: 0,
    monthlyComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `https://easyabaca-api.vercel.app/api/buyer-purchases/analytics?year=${selectedYear}&month=${selectedMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure all required fields exist with defaults
      setAnalytics({
        totalSpent: data.totalSpent || 0,
        totalPurchases: data.totalPurchases || 0,
        totalQuantity: data.totalQuantity || 0,
        yearlyProfit: data.yearlyProfit || 0,
        monthlySpending: data.monthlySpending || [],
        recentTransactions: data.recentTransactions || [],
        monthlyComparison: data.monthlyComparison || []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty defaults on error
      setAnalytics({
        totalSpent: 0,
        totalPurchases: 0,
        totalQuantity: 0,
        monthlySpending: [],
        recentTransactions: [],
        yearlyProfit: 0,
        monthlyComparison: []
      });
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your fiber purchases and spending</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Months</option>
            {months.map((month, idx) => (
              <option key={month} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Spent */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp size={16} />
              <span>12%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Spent</h3>
          <p className="text-3xl font-bold">₱{(analytics.totalSpent || 0).toLocaleString()}</p>
        </div>

        {/* Total Purchases */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShoppingCart size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp size={16} />
              <span>8%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Purchases</h3>
          <p className="text-3xl font-bold">{analytics.totalPurchases || 0}</p>
        </div>

        {/* Total Quantity */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUp size={16} />
              <span>15%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Quantity</h3>
          <p className="text-3xl font-bold">{(analytics.totalQuantity || 0).toLocaleString()} kg</p>
        </div>

        {/* Yearly Profit */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowDown size={16} />
              <span>3%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Yearly Profit</h3>
          <p className="text-3xl font-bold">₱{(analytics.yearlyProfit || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Spending Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Monthly Spending</h2>
            <BarChart3 className="text-blue-500" size={24} />
          </div>
          <div className="space-y-4">
            {(analytics.monthlySpending || []).slice(0, 6).map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{item.month}</span>
                  <span className="font-semibold text-gray-900">₱{item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(item.amount / Math.max(...(analytics.monthlySpending || []).map(m => m.amount), 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Month Comparison</h2>
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
          <div className="space-y-4">
            {(analytics.monthlyComparison || []).slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-24">{item.month}</span>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1">
                    <div className="w-full bg-blue-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(item.current / Math.max(item.current, item.previous)) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">₱{item.current.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-gray-400 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(item.previous / Math.max(item.current, item.previous)) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">₱{item.previous.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span className="text-gray-600">Previous</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Purchase ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Quality</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Variety</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(analytics.recentTransactions || []).slice(0, 10).map((transaction) => (
                <tr key={transaction.purchase_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{transaction.purchase_id?.slice(0, 8) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      {transaction.fiber_quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {transaction.quantity} kg
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₱{transaction.total_price?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {transaction.variety}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(analytics.recentTransactions || []).length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
