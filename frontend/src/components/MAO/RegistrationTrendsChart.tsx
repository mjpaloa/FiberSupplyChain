import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
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
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 transition-all duration-300 h-full flex flex-col">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">User Registration Trends</h2>
                    <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">Track new user registrations over time</p>
                </div>

                <div className="flex items-center flex-wrap gap-4">
                    {/* View Toggle Buttons - Enhanced */}
                    <div className="bg-gray-100/80 p-1.5 rounded-2xl flex items-center shadow-inner backdrop-blur-sm">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'monthly'
                                ? 'bg-white text-emerald-600 shadow-lg scale-105'
                                : 'text-gray-500 hover:text-gray-700 bg-transparent'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${viewMode === 'yearly'
                                ? 'bg-white text-emerald-600 shadow-lg scale-105'
                                : 'text-gray-500 hover:text-gray-700 bg-transparent'
                                }`}
                        >
                            <span className="text-base text-gray-600">📊</span>
                            Yearly
                        </button>
                    </div>

                    {/* Filter Dropdown - Enhanced */}
                    {viewMode === 'monthly' && (
                        <div className="relative group">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-emerald-50/50 border-2 border-emerald-100 text-emerald-700 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 block w-full pl-5 pr-12 py-2.5 transition-all outline-none shadow-sm cursor-pointer hover:bg-white"
                            >
                                <option value={0}>All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500 group-hover:scale-110 transition-transform">
                                <ChevronDown className="w-5 h-5 stroke-[3px]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend Section - Enhanced */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4 mb-10 px-2">
                {[
                    { label: 'Farmers', color: COLORS.farmers, gradient: 'from-emerald-400 to-emerald-600' },
                    { label: 'Buyers', color: COLORS.buyers, gradient: 'from-blue-400 to-blue-600' },
                    { label: 'CUSAFA', color: COLORS.cusafa, gradient: 'from-amber-400 to-amber-600' },
                    { label: 'MAO', color: COLORS.mao, gradient: 'from-rose-400 to-rose-600' },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 group cursor-default">
                        <div
                            className={`w-4 h-4 rounded-full shadow-lg bg-gradient-to-br ${item.gradient} group-hover:scale-125 transition-transform duration-300`}
                        />
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Bar Chart Section - LARGER & ENHANCED */}
            <div className="flex-1 min-h-[450px] w-full mt-2 bg-gradient-to-b from-gray-50/50 to-transparent rounded-3xl p-6 border border-gray-100/50 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                        barGap={8}
                    >
                        <defs>
                            <linearGradient id="farmersGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="buyersGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="cusafaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#d97706" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="maoGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e5e7eb"
                            className="opacity-40"
                        />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 800 }}
                            dy={15}
                            padding={{ left: 30, right: 30 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                            dx={-10}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.03)', radius: 12 }}
                        />
                        <Bar
                            dataKey="farmers"
                            name="Farmers"
                            fill="url(#farmersGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 24 : 36}
                            className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                        />
                        <Bar
                            dataKey="buyers"
                            name="Buyers"
                            fill="url(#buyersGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 24 : 36}
                            className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                        />
                        <Bar
                            dataKey="cusafa"
                            name="CUSAFA"
                            fill="url(#cusafaGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 24 : 36}
                            className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                        />
                        <Bar
                            dataKey="mao"
                            name="MAO"
                            fill="url(#maoGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={viewMode === 'monthly' ? 24 : 36}
                            className="hover:opacity-90 transition-all duration-300 cursor-pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RegistrationTrendsChart;
