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
import { Calendar, ChevronDown, Info } from 'lucide-react';
import {
    EditorialCard,
    SegmentedToggle,
    EDITORIAL_CHART
} from '../Shared/EditorialUI';

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
    farmers: EDITORIAL_CHART.colors.emerald,
    buyers: EDITORIAL_CHART.colors.amber,
    cusafa: EDITORIAL_CHART.colors.espresso,
    mao: EDITORIAL_CHART.colors.mutedSlate,
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3.5 border border-gray-200 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-gray-900 mb-2.5 border-b border-gray-100 pb-1.5">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-xs font-medium text-gray-600">{entry.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900 tabular-nums">{Number(entry.value).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                    <Info size={12} className="text-gray-400" />
                    <span className="text-[11px] text-gray-500">System entry records</span>
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
        <EditorialCard
            title="User Registration Trends"
            subtitle="Monitoring platform adoption metrics across roles"
            className="h-full flex flex-col"
            bodyClassName="flex-1 flex flex-col"
            actions={
                <div className="flex flex-wrap items-center gap-2.5">
                    <SegmentedToggle
                        options={[
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'yearly', label: 'Yearly' },
                        ]}
                        value={viewMode}
                        onChange={(v) => setViewMode(v as 'monthly' | 'yearly')}
                    />

                    {viewMode === 'monthly' && availableYears.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                aria-label="Filter registration trends by year"
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl pl-8 pr-8 py-2 focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value={0}>All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    )}
                </div>
            }
        >
            <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.farmers }} />
                    Farmers
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.buyers }} />
                    Buyers
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.cusafa }} />
                    CUSAFA
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.mao }} />
                    MAO
                </span>
            </div>

            <div className="flex-1 min-h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={displayData}
                        margin={{ top: 10, right: 10, left: -16, bottom: 10 }}
                        barGap={6}
                    >
                        <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                        <XAxis
                            dataKey="month"
                            {...EDITORIAL_CHART.xAxisProps}
                            dy={10}
                        />
                        <YAxis
                            {...EDITORIAL_CHART.yAxisProps}
                            tickCount={6}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                        <Bar
                            dataKey="farmers"
                            name="Farmers"
                            fill={COLORS.farmers}
                            radius={[4, 4, 0, 0]}
                            barSize={viewMode === 'monthly' ? 16 : 32}
                        />
                        <Bar
                            dataKey="buyers"
                            name="Buyers"
                            fill={COLORS.buyers}
                            radius={[4, 4, 0, 0]}
                            barSize={viewMode === 'monthly' ? 16 : 32}
                        />
                        <Bar
                            dataKey="cusafa"
                            name="CUSAFA"
                            fill={COLORS.cusafa}
                            radius={[4, 4, 0, 0]}
                            barSize={viewMode === 'monthly' ? 16 : 32}
                        />
                        <Bar
                            dataKey="mao"
                            name="MAO"
                            fill={COLORS.mao}
                            radius={[4, 4, 0, 0]}
                            barSize={viewMode === 'monthly' ? 16 : 32}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </EditorialCard>
    );
};

export default RegistrationTrendsChart;
