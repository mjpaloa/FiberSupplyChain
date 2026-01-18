import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';

interface RegistrationData {
    month: string;
    year: number;
    farmers: number;
    buyers: number;
    cusafa: number;
    mao: number;
}

interface RegistrationTrendsChartProps {
    data: RegistrationData[];
    availableYears: number[];
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    viewMode: 'monthly' | 'yearly';
    setViewMode: (mode: 'monthly' | 'yearly') => void;
    yearlyData: any[];
}

const COLORS = {
    farmers: '#10b981', // Emerald for Farmers to match the previous design better
    buyers: '#3b82f6', // Blue for Buyers
    cusafa: '#f59e0b', // Amber for CUSAFA
    mao: '#f43f5e',   // Rose for MAO
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-2xl animate-in fade-in zoom-in duration-200">
                <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between space-x-6">
                            <div className="flex items-center">
                                <div
                                    className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium text-gray-600 capitalize">{entry.name}:</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const RegistrationTrendsChart: React.FC<RegistrationTrendsChartProps> = ({
    data,
    availableYears,
    selectedYear,
    setSelectedYear,
    viewMode,
    setViewMode,
    yearlyData
}) => {
    const displayData = viewMode === 'yearly' ? yearlyData.map(d => ({ ...d, month: d.year.toString() })) : data;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 h-full flex flex-col">
            {/* Header section */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">User Registration Trends</h2>
                    <p className="text-sm text-gray-500 font-medium">New registrations over time</p>
                </div>

                <div className="relative">
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'monthly' | 'yearly')}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg pl-4 pr-10 py-1.5 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Bar Chart Section */}
            <div className="flex-1 min-h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                        barGap={12}
                    >
                        <defs>
                            <linearGradient id="farmersGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="buyersGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="cusafaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={1} />
                                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="maoGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={1} />
                                <stop offset="95%" stopColor="#fb7185" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '13px', fontWeight: 500, fill: '#64748b' }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '13px', fontWeight: 500, fill: '#64748b' }}
                            tickCount={8}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                            }}
                            cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            height={40}
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '30px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}
                        />
                        <Bar
                            dataKey="farmers"
                            name="Farmers"
                            fill="url(#farmersGradient)"
                            radius={[10, 10, 0, 0]}
                            barSize={viewMode === 'monthly' ? 25 : 50}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="buyers"
                            name="Buyers"
                            fill="url(#buyersGradient)"
                            radius={[10, 10, 0, 0]}
                            barSize={viewMode === 'monthly' ? 25 : 50}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="cusafa"
                            name="CUSAFA"
                            fill="url(#cusafaGradient)"
                            radius={[10, 10, 0, 0]}
                            barSize={viewMode === 'monthly' ? 25 : 50}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="mao"
                            name="MAO"
                            fill="url(#maoGradient)"
                            radius={[10, 10, 0, 0]}
                            barSize={viewMode === 'monthly' ? 25 : 50}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RegistrationTrendsChart;
