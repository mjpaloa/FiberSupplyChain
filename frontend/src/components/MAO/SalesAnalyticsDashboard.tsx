import React, { useState, useEffect } from 'react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    EditorialCard,
    KpiStrip,
    SegmentedToggle,
    EDITORIAL_CHART
} from '../Shared/EditorialUI';

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
            const apiUrl = import.meta.env.VITE_API_URL || 'https://fibersupplychain.onrender.com';

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

                    if (ft.match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1|superior/i)) {
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
        <div className="space-y-6">
            <KpiStrip
                columns={4}
                items={[
                    {
                        label: 'Total Fiber Sales',
                        value: `₱${data.totalSales.toLocaleString()}`,
                        subtext: `${data.totalVolume.toLocaleString()} kg total volume`,
                    },
                    {
                        label: 'Class A Sales',
                        value: `₱${data.totalSalesA.toLocaleString()}`,
                        subtext: `${data.totalVolumeA.toLocaleString()} kg sold`,
                    },
                    {
                        label: 'Class B Sales',
                        value: `₱${data.totalSalesB.toLocaleString()}`,
                        subtext: `${data.totalVolumeB.toLocaleString()} kg sold`,
                    },
                    {
                        label: 'Class C Sales',
                        value: `₱${data.totalSalesC.toLocaleString()}`,
                        subtext: `${data.totalVolumeC.toLocaleString()} kg sold`,
                    },
                ]}
            />

            <EditorialCard
                title="Sales by Fiber Class"
                subtitle="Fiber revenue (₱) across Class A, B, and C"
                actions={
                    <div className="flex flex-wrap items-center gap-2.5">
                        {chartView === 'monthly' && availableYears.length > 0 && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                aria-label="Select year"
                                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        )}
                        <SegmentedToggle
                            options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' },
                            ]}
                            value={chartView}
                            onChange={(v) => setChartView(v as 'monthly' | 'yearly')}
                        />
                    </div>
                }
            >
                <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                        Class A
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                        Class B
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.espresso }} />
                        Class C
                    </span>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                        <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                        <XAxis
                            dataKey={chartView === 'monthly' ? 'month' : 'year'}
                            {...EDITORIAL_CHART.xAxisProps}
                        />
                        <YAxis
                            {...EDITORIAL_CHART.yAxisProps}
                            tickFormatter={(value) => `₱${Number(value).toLocaleString()}`}
                        />
                        <Tooltip
                            contentStyle={EDITORIAL_CHART.tooltipStyle}
                            cursor={{ fill: '#F9FAFB' }}
                            formatter={(value: unknown) => `₱${Math.round(Number(value ?? 0)).toLocaleString()}`}
                        />
                        <Bar dataKey="Sales A (₱)" name="Class A" fill={EDITORIAL_CHART.colors.amber} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Sales B (₱)" name="Class B" fill={EDITORIAL_CHART.colors.emerald} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Sales C (₱)" name="Class C" fill={EDITORIAL_CHART.colors.espresso} radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </EditorialCard>

            <EditorialCard title="Total Sales Summary" subtitle="Breakdown by fiber classification">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-1 p-5 rounded-xl bg-[#F8F9FA] border border-gray-200">
                        <p className="text-xs font-medium text-gray-500">All-Class Total</p>
                        <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1.5">
                            ₱{data.totalSales.toLocaleString()}
                        </p>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl border border-gray-200 bg-white">
                            <span className="text-xs font-medium text-gray-500">Class A</span>
                            <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">₱{data.totalSalesA.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-white">
                            <span className="text-xs font-medium text-gray-500">Class B</span>
                            <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">₱{data.totalSalesB.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-white">
                            <span className="text-xs font-medium text-gray-500">Class C</span>
                            <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">₱{data.totalSalesC.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </EditorialCard>
        </div>
    );
};

export default SalesAnalyticsDashboard;
