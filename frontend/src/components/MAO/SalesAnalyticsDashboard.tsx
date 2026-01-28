import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, BarChart3 } from 'lucide-react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const PhilippinePeso = ({ className, size = 24 }: { className?: string; size?: number | string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
    >
        <text
            x="12"
            y="12"
            dy="1"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="20"
            fontWeight="bold"
            fill="currentColor"
        >
            ₱
        </text>
    </svg>
);

interface SalesPerformanceData {
    totalVolumeA: number;
    totalVolumeB: number;
    totalVolumeC: number;
    totalSalesA: number;
    totalSalesB: number;
    totalSalesC: number;
    totalVolume: number;
    totalSales: number;
    monthlyStatsByYear: {
        [year: number]: {
            volumeA: number[];
            volumeB: number[];
            volumeC: number[];
            salesA: number[];
            salesB: number[];
            salesC: number[];
            salesOther?: number[];
        };
    };
    yearlyStats: {
        [year: number]: {
            volumeA: number;
            volumeB: number;
            volumeC: number;
            salesA: number;
            salesB: number;
            salesC: number;
            salesOther?: number;
        };
    };
}

const SalesAnalyticsDashboard: React.FC = () => {
    const [data, setData] = useState<SalesPerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetchSalesPerformance();
    }, []);

    const fetchSalesPerformance = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const apiUrl = import.meta.env.VITE_API_URL || 'https://easyabaca-api.vercel.app';

            // Try the new specialized endpoint first
            try {
                const response = await fetch(`${apiUrl}/api/admin/sales-performance`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                    return;
                }
            } catch (err) {
                console.warn('Specialized endpoint failed, falling back to raw sales processing', err);
            }

            // Fallback: Fetch raw sales and process locally
            const rawRes = await fetch(`${apiUrl}/api/admin/sales-report`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (rawRes.ok) {
                const rawData = await rawRes.json();
                const sales = rawData.allSales || rawData.recentSales || [];

                // Process the data similar to how the backend would
                const monthlyStatsByYear: any = {};
                const yearlyStats: any = {};
                let totalVolumeA = 0, totalVolumeB = 0, totalVolumeC = 0;
                let totalSalesA = 0, totalSalesB = 0, totalSalesC = 0;

                sales.forEach((sale: any) => {
                    const date = new Date(sale.sale_date);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const qty = parseFloat(sale.quantity_sold || 0);
                    const amt = parseFloat(sale.total_amount || 0);
                    if (!monthlyStatsByYear[year]) {
                        monthlyStatsByYear[year] = {
                            volumeA: new Array(12).fill(0), volumeB: new Array(12).fill(0), volumeC: new Array(12).fill(0),
                            salesA: new Array(12).fill(0), salesB: new Array(12).fill(0), salesC: new Array(12).fill(0)
                        };
                    }
                    if (!yearlyStats[year]) {
                        yearlyStats[year] = { volumeA: 0, volumeB: 0, volumeC: 0, salesA: 0, salesB: 0, salesC: 0 };
                    }

                    const flavorType = (sale.abaca_type || sale.grade || sale.fiber_class || '').toLowerCase();

                    const ft = (sale.abaca_type || sale.grade || sale.fiber_class || '').toLowerCase();

                    if (ft.match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1/i)) {
                        monthlyStatsByYear[year].volumeA[month] += qty;
                        monthlyStatsByYear[year].salesA[month] += amt;
                        yearlyStats[year].volumeA += qty;
                        yearlyStats[year].salesA += amt;
                        totalVolumeA += qty;
                        totalSalesA += amt;
                    } else if (ft.match(/\bb\b|class[-_\s]*b|grade[-_\s]*b|fiber[-_\s]*b|grade\s*2/i)) {
                        monthlyStatsByYear[year].volumeB[month] += qty;
                        monthlyStatsByYear[year].salesB[month] += amt;
                        yearlyStats[year].volumeB += qty;
                        yearlyStats[year].salesB += amt;
                        totalVolumeB += qty;
                        totalSalesB += amt;
                    } else if (ft.match(/\bc\b|class[-_\s]*c|grade[-_\s]*c|fiber[-_\s]*c|grade\s*3/i)) {
                        monthlyStatsByYear[year].volumeC[month] += qty;
                        monthlyStatsByYear[year].salesC[month] += amt;
                        yearlyStats[year].volumeC += qty;
                        yearlyStats[year].salesC += amt;
                        totalVolumeC += qty;
                        totalSalesC += amt;
                    }
                });

                setData({
                    totalVolumeA, totalVolumeB, totalVolumeC,
                    totalSalesA, totalSalesB, totalSalesC,
                    totalVolume: totalVolumeA + totalVolumeB + totalVolumeC,
                    totalSales: totalSalesA + totalSalesB + totalSalesC,
                    monthlyStatsByYear,
                    yearlyStats
                });
            } else {
                console.error('Failed to fetch fallback data');
            }
        } catch (error) {
            console.error('Error fetching sales performance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">No sales performance data available</p>
            </div>
        );
    }

    // Prepare chart data
    const getChartData = () => {
        if (chartView === 'monthly') {
            const yearData = data.monthlyStatsByYear[selectedYear];
            if (!yearData) return [];

            return months.map((month, index) => ({
                month,
                'Fiber A (kg)': yearData.volumeA[index] || 0,
                'Fiber B (kg)': yearData.volumeB[index] || 0,
                'Fiber C (kg)': yearData.volumeC[index] || 0,
                'Sales A (₱)': yearData.salesA[index] || 0,
                'Sales B (₱)': yearData.salesB[index] || 0,
                'Sales C (₱)': yearData.salesC[index] || 0,
            }));
        } else {
            // Yearly view
            const years = Object.keys(data.yearlyStats || {}).sort();
            return years.map(year => ({
                year,
                'Sales A (₱)': data.yearlyStats[parseInt(year)].salesA || 0,
                'Sales B (₱)': data.yearlyStats[parseInt(year)].salesB || 0,
                'Sales C (₱)': data.yearlyStats[parseInt(year)].salesC || 0,
            }));
        }
    };

    const chartData = getChartData();
    const availableYears = Object.keys(data.monthlyStatsByYear || {}).map(Number).sort((a, b) => b - a);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        <BarChart3 className="w-10 h-10 text-blue-600" />
                        Sales Performance Analytics
                    </h1>
                    <p className="text-gray-600 text-lg">Fiber Sales (₱) by Class A, B, and C</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Fiber A Stats */}
                    <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1">Class A Sales</p>
                            <p className="text-3xl font-bold text-white">₱{data.totalSalesA.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Fiber B Stats */}
                    <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1">Class B Sales</p>
                            <p className="text-3xl font-bold text-white">₱{data.totalSalesB.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Fiber C Stats */}
                    <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-medium mb-1">Class C Sales</p>
                            <p className="text-3xl font-bold text-white">₱{data.totalSalesC.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-gray-900">Sales by Fiber Class</h2>

                        <div className="flex gap-3 items-center">
                            {/* Year Selector (for monthly view) */}
                            {chartView === 'monthly' && availableYears.length > 0 && (
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            )}

                            {/* View Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setChartView('monthly')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${chartView === 'monthly'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setChartView('yearly')}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${chartView === 'yearly'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Yearly
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sales Chart - Class A, B, C */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Sales by Fiber Class (₱)</h3>
                        <ResponsiveContainer width="100%" height={450}>
                            <RechartsBarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey={chartView === 'monthly' ? 'month' : 'year'}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                    formatter={(value: any) => `₱${Math.round(value).toLocaleString()}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Sales A (₱)" name="Class A" fill="#10b981" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Sales B (₱)" name="Class B" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Sales C (₱)" name="Class C" fill="#a855f7" radius={[8, 8, 0, 0]} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Total Sales Summary</h2>
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <PhilippinePeso className="w-10 h-10 text-green-600" />
                                <h3 className="text-2xl font-bold text-gray-900">Total Sales</h3>
                            </div>
                            <p className="text-5xl font-black text-green-600 mb-6">₱{data.totalSales.toLocaleString()}</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Class A:</span>
                                    <span className="font-black text-lg text-emerald-600">₱{data.totalSalesA.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Class B:</span>
                                    <span className="font-black text-lg text-blue-600">₱{data.totalSalesB.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Class C:</span>
                                    <span className="font-black text-lg text-purple-600">₱{data.totalSalesC.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalyticsDashboard;
