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
import { Calendar, ChevronDown, Activity, Info } from 'lucide-react';

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
    farmers: '#10b981',
    buyers: '#3b82f6',
    cusafa: '#f59e0b',
    mao: '#f43f5e',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-5 shadow-2xl border border-gray-100 rounded-3xl animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-black text-gray-900 mb-4 border-b border-gray-50 pb-2">{label}</p>
                <div className="space-y-3">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-3 h-3 rounded-full shadow-md"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{entry.name}</span>
                            </div>
                            <span className="text-sm font-black text-gray-900">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                    <Info size={12} className="text-gray-400" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">System Entry Records</span>
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
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 transition-all duration-300 h-full flex flex-col">
            {/* Header section - Enhanced */}
            <div className="flex flex-col sm:flex-row items-start justify-between mb-10 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                        <Activity className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">User Registration Trends</h2>
                        <p className="text-sm text-gray-500 font-medium">Monitoring platform adoption metrics</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'monthly' | 'yearly')}
                            className="w-full appearance-none bg-gray-50 border-none text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl pl-5 pr-10 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:bg-gray-100 transition-all shadow-sm"
                        >
                            <option value="monthly">Monthly View</option>
                            <option value="yearly">Yearly Stats</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>

                    {viewMode === 'monthly' && availableYears.length > 0 && (
                        <div className="relative flex-1 sm:flex-initial">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full appearance-none bg-indigo-50 border-none text-indigo-700 text-xs font-black uppercase tracking-widest rounded-xl pl-10 pr-10 py-3 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer hover:bg-indigo-100 transition-all shadow-sm"
                            >
                                <option value={0}>All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart Section - Premium Styling */}
            <div className="flex-1 min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '11px', fontWeight: 800, fill: '#64748b', textTransform: 'uppercase' }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            style={{ fontSize: '11px', fontWeight: 600, fill: '#94a3b8' }}
                            tickCount={6}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 10 }} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            height={50}
                            iconType="circle"
                            wrapperStyle={{
                                paddingBottom: '40px',
                                fontSize: '11px',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                color: '#475569',
                                letterSpacing: '0.05em'
                            }}
                        />
                        <Bar
                            dataKey="farmers"
                            name="Farmers"
                            fill="url(#farmersGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 20 : 40}
                            animationDuration={2000}
                        />
                        <Bar
                            dataKey="buyers"
                            name="Buyers"
                            fill="url(#buyersGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 20 : 40}
                            animationDuration={2000}
                        />
                        <Bar
                            dataKey="cusafa"
                            name="CUSAFA"
                            fill="url(#cusafaGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 20 : 40}
                            animationDuration={2000}
                        />
                        <Bar
                            dataKey="mao"
                            name="MAO"
                            fill="url(#maoGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 20 : 40}
                            animationDuration={2000}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RegistrationTrendsChart;
