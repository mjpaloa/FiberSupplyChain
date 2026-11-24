import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Sprout,
  Calendar,
  CheckCircle,
  Package,
  Truck,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  Activity,
  FileText,
  BookOpen,
  Users,
  Award,
  Eye,
  AlertCircle,
  Clock,
  Bell,
  Coins,
  Upload,
  Lock,
  EyeOff,
  History
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

// Add CSS animations for charts
const chartAnimations = `
  @keyframes barGrow {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = chartAnimations;
  document.head.appendChild(styleSheet);
}

import UserManagement from './UserManagement';
import OfficerManagement from './OfficerManagement';
import AdminUserManual from './AdminUserManual';
import AssociationSeedlingManagement from './AssociationSeedlingManagement';
import PlantedSeedlings from './PlantedSeedlings';
import MonitoringPage from '../../pages/MonitoringPage';
import MAOHarvestVerificationPage from '../../pages/MAOHarvestVerificationPage';
import UnifiedSalesManagement from './UnifiedSalesManagement';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';
import DeliveryTrackingMonitor from './DeliveryTrackingMonitor';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';
import SalesAnalyticsDashboard from './SalesAnalyticsDashboard';
import {
  EditorialShell,
  EditorialNavItem,
  KpiStrip,
  EditorialCard,
  SegmentedToggle,
  StatusPill,
  KeepAlivePages,
  useCacheState,
  EDITORIAL_CHART,
} from '../Shared/EditorialUI';


interface MAODashboardProps {
  onLogout: () => void;
}

interface DashboardState {
  production: {
    totalSeedlingsReceived: number;
    totalSeedlingsDistributed: number;
    totalSeedlingsPlanted: number;
    totalAreaPlanted: number;
    totalHarvestFiber: number;
    actualHarvested: number;
    averageQualityGrade: string;
    totalMonitoringVisits: number;
    farmsMonitored: number;
    recentMonitoringVisits: number;
    healthyFarms: number;
    needsSupportFarms: number;
    damagedFarms: number;
    monthlyMonitoring: number[];
    monthlyHealthy: number[];
    monthlyNeedsSupport: number[];
    monthlyDamaged: number[];
    monthlyReceived: number[];
    monthlyDistributed: number[];
    monthlyHarvest?: number[]; // Added for compatibility
    monthlyStatsByYear: { [year: number]: { received: number[], distributed: number[], harvested: number[], planted: number[], unplanted: number[] } };
    yearlyReceived: { [year: number]: number };
    yearlyDistributed: { [year: number]: number };
    yearlyHarvest: { [year: number]: number };
    yearlyPlanted: { [year: number]: number };
    yearlyUnplanted: { [year: number]: number };
    yearlyMonitoring: { [year: number]: number };
    yearlyHealthy: { [year: number]: number };
    yearlyNeedsSupport: { [year: number]: number };
    yearlyDamaged: { [year: number]: number };
    monitoringStatsByYear: { [year: number]: { total: number[], healthy: number[], needsSupport: number[], damaged: number[] } };
  };
  sales: any;
  users: any;
  deliveries: {
    totalDeliveries: number;
    inTransit: number;
    delivered: number;
    completed: number;
    cancelled: number;
    totalFiberKg: number;
    deliveredFiberKg: number;
    cancelledFiberKg: number;
    classA_Kg: number;
    classB_Kg: number;
    classC_Kg: number;
    totalValue: number;
    rawDeliveries: any[];
  };
}

const MAODashboard: React.FC<MAODashboardProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'manual' | 'users' | 'officers' | 'seedlings' | 'seedlings-overview' | 'monitoring' | 'harvests' | 'sales-analytics' | 'sales-performance' | 'buyer-prices' | 'delivery-tracking'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [officerData, setOfficerData] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({
    email: '',
    contact_number: '',
    address: '',
    position: '',
    association_name: '',
    full_name: ''
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Change Password states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isSuperAdmin = user?.isSuperAdmin === true;

  // Debug: Log user info
  console.log('🔍 MAO Dashboard - User Info:', {
    email: user?.email,
    isSuperAdmin: user?.isSuperAdmin,
    fullName: user?.fullName,
    position: user?.position
  });

  // Note: Maintenance and Activity Logs are restricted to Super Admin only

  // Fetch officer profile data
  const fetchOfficerProfile = async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile data loaded:', data);
        console.log('📧 Email:', data.email);
        console.log('📞 Contact:', data.contact_number);
        console.log('📍 Address:', data.address);
        console.log('💼 Position:', data.position);
        console.log('🏢 Association:', data.association_name);

        // Ensure all fields are properly set
        const officerInfo = {
          ...data,
          email: data.email || user?.email || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          position: data.position || user?.position || '',
          association_name: data.association_name || '',
          full_name: data.full_name || user?.fullName || ''
        };

        console.log('🔍 Officer data being set:', officerInfo);
        setOfficerData(officerInfo);

        // Set form data with proper fallbacks
        const formData = {
          email: data.email || user?.email || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          position: data.position || user?.position || '',
          association_name: data.association_name || data.office_name || '',
          full_name: data.full_name || user?.fullName || ''
        };
        console.log('📝 Setting form data:', formData);
        setEditFormData(formData);
        setProfilePhoto(data.profile_picture || null);
      } else {
        console.error('❌ Failed to fetch profile, status:', response.status);
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const _handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('accessToken');

      console.log('💾 Saving profile data:', {
        position: editFormData.position,
        associationName: editFormData.association_name,
        contactNumber: editFormData.contact_number,
        address: editFormData.address,
        profilePicture: profilePhoto
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mao/complete-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editFormData.full_name,
          position: editFormData.position || '',
          officeName: editFormData.association_name || '', // Using officeName as expected by backend
          contactNumber: editFormData.contact_number || '',
          address: editFormData.address || '',
          termStartDate: null,
          termEndDate: null,
          farmersUnderSupervision: 0,
          profilePicture: profilePhoto || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile saved:', result);
        setOfficerData(result.officer);
        setIsEditMode(false);
        alert('✅ Profile updated successfully!');
        // Refresh profile data to update everywhere including header
        await fetchOfficerProfile();
      } else {
        const errorData = await response.json();
        console.error('❌ Save failed:', errorData);
        alert('❌ Failed to update profile: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const _handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfilePhoto(base64String);

        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mao/complete-profile`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profilePicture: base64String,
            fullName: editFormData.full_name,
            position: editFormData.position || user?.position,
            officeName: editFormData.association_name,
            contactNumber: editFormData.contact_number,
            address: editFormData.address,
          }),
        });

        if (response.ok) {
          alert('✅ Profile picture updated!');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('❌ Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const _handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('❌ New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('✅ Password changed successfully!');
        setShowChangePasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        alert('❌ Failed to change password: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('❌ Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Dashboard data states
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    production: {
      totalSeedlingsReceived: 0,
      totalSeedlingsDistributed: 0,
      totalSeedlingsPlanted: 0,
      totalAreaPlanted: 0,
      totalHarvestFiber: 0,
      actualHarvested: 0,
      averageQualityGrade: 'N/A',
      totalMonitoringVisits: 0,
      farmsMonitored: 0,
      recentMonitoringVisits: 0,
      healthyFarms: 0,
      needsSupportFarms: 0,
      damagedFarms: 0,
      monthlyMonitoring: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyHealthy: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyNeedsSupport: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyDamaged: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyReceived: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyDistributed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyHarvest: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyStatsByYear: {},
      yearlyReceived: {},
      yearlyDistributed: {},
      yearlyHarvest: {},
      yearlyPlanted: {},
      yearlyUnplanted: {},
      yearlyMonitoring: {},
      yearlyHealthy: {},
      yearlyNeedsSupport: {},
      yearlyDamaged: {},
      monitoringStatsByYear: {}
    },
    sales: {
      totalKgSold: 0,
      totalAmount: 0,
      pendingKgSold: 0,
      pendingAmount: 0,
      averagePricePerKg: 0,
      numberOfBuyers: 0,
      recentSales: []
    },
    users: {
      totalUsers: 0,
      totalFarmers: 0,
      totalOfficers: 0,
      totalAdmins: 0,
      recentUsers: []
    },
    deliveries: {
      totalDeliveries: 0,
      inTransit: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      totalFiberKg: 0,
      deliveredFiberKg: 0,
      cancelledFiberKg: 0,
      classA_Kg: 0,
      classB_Kg: 0,
      classC_Kg: 0,
      totalValue: 0,
      rawDeliveries: []
    }
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardSection, setDashboardSection] = useState<'production' | 'sales' | 'users' | 'reports'>('production');
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
  const [seedlingMonthYear, setSeedlingMonthYear] = useState(new Date().getFullYear());
  const [monitoringMonthYear, setMonitoringMonthYear] = useState(new Date().getFullYear());
  const [deliveryMonthYear, setDeliveryMonthYear] = useState(new Date().getFullYear());
  const [monitoringView, setMonitoringView] = useState<'monthly' | 'yearly'>('monthly');
  const [deliveryView, setDeliveryView] = useState<'monthly' | 'yearly'>('monthly');
  const [abacaSoldView, setAbacaSoldView] = useState<'monthly' | 'yearly'>('monthly');
  const [salesMonthYear, setSalesMonthYear] = useState(new Date().getFullYear());
  const [salesChartView, setSalesChartView] = useState<'monthly' | 'yearly'>('yearly');
  const [deliveryStatusView, setDeliveryStatusView] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [trendsView, setTrendsView] = useState<'monthly' | 'yearly'>('monthly');
  const [trendsYear, setTrendsYear] = useState(new Date().getFullYear());

  // Insight Modal States
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<{
    title: string;
    insights: string[];
    view: 'monthly' | 'yearly';
  } | null>(null);

  // Insight Modal Component
  const InsightModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    insights: string[];
    view: 'monthly' | 'yearly';
  }> = ({ isOpen, onClose, title, insights, view }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[1px]" onClick={onClose}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EAF6F0] rounded-xl text-[#047857]">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500 font-medium">
                  {view === 'monthly' ? 'Monthly' : 'Yearly'} Insights
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex gap-3.5 p-4 bg-[#F8F9FA] rounded-xl border border-gray-200"
              >
                <div className="flex-shrink-0 w-7 h-7 bg-[#EAF6F0] border border-[#CBEAD9] rounded-full flex items-center justify-center text-[#047857] font-bold text-xs tabular-nums">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">
                  {insight}
                </p>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#047857] text-white text-sm font-semibold rounded-xl hover:bg-[#065F46] transition-colors"
            >
              Close Insights
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper functions to generate insights
  const generateSeedlingInsights = (view: 'monthly' | 'yearly', year?: number): string[] => {
    const insights: string[] = [];
    const prodData = dashboardData.production;

    if (view === 'monthly' && year) {
      const stats = prodData.monthlyStatsByYear?.[year] || { received: new Array(12).fill(0), distributed: new Array(12).fill(0) };
      const totalReceived = stats.received.reduce((a, b) => a + b, 0);
      const totalDistributed = stats.distributed.reduce((a, b) => a + b, 0);
      const maxReceivedMonth = stats.received.indexOf(Math.max(...stats.received));
      const maxDistributedMonth = stats.distributed.indexOf(Math.max(...stats.distributed));
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      // Summary Statistics
      insights.push(`📊 SUMMARY: In ${year}, you received ${totalReceived.toLocaleString()} seedlings and distributed ${totalDistributed.toLocaleString()} seedlings to farmers.`);

      // Distribution Efficiency with Performance Rating
      const distributionRate = totalReceived > 0 ? ((totalDistributed / totalReceived) * 100).toFixed(1) : '0';
      const remaining = totalReceived - totalDistributed;
      if (parseFloat(distributionRate) >= 90) {
        insights.push(`✅ EXCELLENT: ${distributionRate}% distribution efficiency! Outstanding job getting seedlings to farmers.`);
      } else if (parseFloat(distributionRate) >= 70) {
        insights.push(`⚠️ GOOD: ${distributionRate}% efficiency. ${remaining.toLocaleString()} seedlings still available for distribution.`);
      } else if (totalReceived > 0) {
        insights.push(`🔴 ATTENTION NEEDED: Only ${distributionRate}% distributed. ${remaining.toLocaleString()} seedlings need urgent distribution.`);
      }

      // Peak Performance Analysis
      if (totalReceived > 0) {
        const peakReceived = stats.received[maxReceivedMonth];
        const avgReceived = totalReceived / 12;
        const peakVsAvg = ((peakReceived / avgReceived - 1) * 100).toFixed(0);
        insights.push(`📈 PEAK RECEIVING: ${months[maxReceivedMonth]} - ${peakReceived.toLocaleString()} seedlings (${peakVsAvg}% above average).`);
      }

      if (totalDistributed > 0) {
        insights.push(`🚚 PEAK DISTRIBUTION: ${months[maxDistributedMonth]} with ${stats.distributed[maxDistributedMonth].toLocaleString()} seedlings.`);
      }

      // Trend Analysis
      const firstHalf = stats.distributed.slice(0, 6).reduce((a: number, b: number) => a + b, 0);
      const secondHalf = stats.distributed.slice(6, 12).reduce((a: number, b: number) => a + b, 0);
      if (secondHalf > firstHalf && firstHalf > 0) {
        const growth = ((secondHalf / firstHalf - 1) * 100).toFixed(1);
        insights.push(`📊 POSITIVE TREND: Distribution increased ${growth}% in H2. Keep the momentum!`);
      } else if (firstHalf > secondHalf && secondHalf > 0) {
        const decline = ((1 - secondHalf / firstHalf) * 100).toFixed(1);
        insights.push(`⚠️ DECLINING TREND: Distribution decreased ${decline}% in H2. Review strategies.`);
      }

      // Recommendations
      if (remaining > 0) {
        insights.push(`💡 ACTION: Prioritize distributing ${remaining.toLocaleString()} remaining seedlings to maximize farmer support.`);
      }
    } else {
      const yearlyReceived = prodData.yearlyReceived || {};
      const yearlyDistributed = prodData.yearlyDistributed || {};
      const years = Object.keys(yearlyReceived).map(Number).sort((a, b) => b - a);

      if (years.length > 0) {
        const latestYear = years[0];
        const latestReceived = yearlyReceived[latestYear] || 0;
        const latestDistributed = yearlyDistributed[latestYear] || 0;

        insights.push(`📊 ${latestYear}: Received ${latestReceived.toLocaleString()} seedlings, distributed ${latestDistributed.toLocaleString()}.`);

        // Year-over-Year Comparison
        if (years.length > 1) {
          const prevYear = years[1];
          const prevReceived = yearlyReceived[prevYear] || 0;
          const prevDistributed = yearlyDistributed[prevYear] || 0;

          const receivedGrowth = prevReceived > 0 ? ((latestReceived - prevReceived) / prevReceived * 100).toFixed(1) : '0';
          const distributedGrowth = prevDistributed > 0 ? ((latestDistributed - prevDistributed) / prevDistributed * 100).toFixed(1) : '0';

          if (parseFloat(receivedGrowth) > 0) {
            insights.push(`📈 RECEIVING: +${receivedGrowth}% vs ${prevYear} (+${(latestReceived - prevReceived).toLocaleString()} seedlings).`);
          } else if (parseFloat(receivedGrowth) < 0) {
            insights.push(`📉 RECEIVING: ${receivedGrowth}% vs ${prevYear}. Consider increasing procurement.`);
          }

          if (parseFloat(distributedGrowth) > 0) {
            insights.push(`✅ DISTRIBUTION: +${distributedGrowth}% vs ${prevYear}. Excellent farmer support growth!`);
          } else if (parseFloat(distributedGrowth) < 0) {
            insights.push(`⚠️ DISTRIBUTION: ${distributedGrowth}% vs ${prevYear}. Review distribution strategies.`);
          }
        }

        // Historical Performance
        const totalAllYears = Object.values(yearlyReceived).reduce((a: number, b: number) => a + b, 0) as number;
        const totalDistributedAllYears = Object.values(yearlyDistributed).reduce((a: number, b: number) => a + b, 0) as number;
        const overallEfficiency = totalAllYears > 0 ? ((totalDistributedAllYears / totalAllYears) * 100).toFixed(1) : '0';

        insights.push(`📊 HISTORICAL: ${totalAllYears.toLocaleString()} total seedlings across ${years.length} year(s), ${overallEfficiency}% efficiency.`);

        // Best Year
        const bestYearEntries = Object.entries(yearlyDistributed).sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number));
        if (bestYearEntries.length > 0) {
          const bestYear = bestYearEntries[0];
          insights.push(`🏆 BEST YEAR: ${bestYear[0]} with ${(bestYear[1] as number).toLocaleString()} seedlings distributed!`);
        }

        // Projection
        if (years.length >= 2) {
          const avgGrowth = years.slice(0, -1).reduce((sum, year, idx) => {
            const nextYear = years[idx + 1];
            if (nextYear && yearlyReceived[nextYear] > 0) {
              return sum + ((yearlyReceived[year] - yearlyReceived[nextYear]) / yearlyReceived[nextYear]);
            }
            return sum;
          }, 0) / (years.length - 1);

          if (avgGrowth > 0) {
            const projected = Math.round(latestReceived * (1 + avgGrowth));
            insights.push(`🔮 PROJECTION: Expect ~${projected.toLocaleString()} seedlings next year (${(avgGrowth * 100).toFixed(1)}% growth).`);
          }
        }
      } else {
        insights.push('📊 No yearly data available. Start tracking to see insights!');
      }
    }

    return insights.length > 0 ? insights : ['No data available for insights'];
  };

  const generateProductionTrendsInsights = (view: 'monthly' | 'yearly', year?: number): string[] => {
    const insights: string[] = [];
    const prodData = dashboardData.production;

    if (view === 'monthly' && year) {
      const stats = prodData.monthlyStatsByYear?.[year] || { planted: new Array(12).fill(0), harvested: new Array(12).fill(0), unplanted: new Array(12).fill(0) };
      const totalPlanted = stats.planted?.reduce((a: number, b: any) => a + Number(b || 0), 0) || 0;
      const totalHarvested = stats.harvested?.reduce((a: number, b: any) => a + Number(b || 0), 0) || 0;
      const totalUnplanted = stats.unplanted?.reduce((a: number, b: any) => a + Number(b || 0), 0) || 0;

      insights.push(`Total planted in ${year}: ${totalPlanted.toLocaleString()} seedlings`);
      insights.push(`Total harvested in ${year}: ${totalHarvested.toLocaleString()} kg`);

      if (totalUnplanted > 0) {
        insights.push(`Unplanted or damaged units in ${year}: ${totalUnplanted.toLocaleString()}`);
      }

      if (totalPlanted > 0 && totalHarvested > 0) {
        const yieldPerSeedling = (totalHarvested / totalPlanted).toFixed(2);
        insights.push(`Average yield: ${yieldPerSeedling} kg per seedling planted`);
      }
    } else {
      const yearlyPlanted = prodData.yearlyPlanted || {};
      const yearlyHarvest = prodData.yearlyHarvest || {};
      const years = Object.keys(yearlyHarvest).map(Number).sort((a: number, b: number) => b - a);

      if (years.length > 0) {
        const latestYear = years[0];
        insights.push(`Latest year (${latestYear}): ${(yearlyHarvest[latestYear] || 0).toLocaleString()} kg harvested`);

        const totalHarvest = Object.values(yearlyHarvest).reduce((a: number, b: any) => a + Number(b || 0), 0);
        const totalPlanted = Object.values(yearlyPlanted).reduce((a: number, b: any) => a + Number(b || 0), 0);
        const totalUnplanted = Object.values(prodData.yearlyUnplanted || {}).reduce((a: number, b: any) => a + Number(b || 0), 0);

        insights.push(`Total harvest across all years: ${totalHarvest.toLocaleString()} kg`);
        insights.push(`Total seedlings planted: ${totalPlanted.toLocaleString()}`);
        if (totalUnplanted > 0) {
          insights.push(`Total unplanted/losses: ${totalUnplanted.toLocaleString()}`);
        }
      }
    }

    return insights.length > 0 ? insights : ['No data available for insights'];
  };

  const generateMonitoringInsights = (view: 'monthly' | 'yearly', year?: number): string[] => {
    const insights: string[] = [];
    const prodData = dashboardData.production as any;

    if (view === 'monthly' && year) {
      const stats = prodData.monitoringStatsByYear?.[year] || { total: new Array(12).fill(0), healthy: new Array(12).fill(0), needsSupport: new Array(12).fill(0), damaged: new Array(12).fill(0) };
      const totalMonitoring = stats.total.reduce((a: number, b: number) => a + b, 0);
      const totalHealthy = stats.healthy.reduce((a: number, b: number) => a + b, 0);
      const totalNeedsSupport = stats.needsSupport.reduce((a: number, b: number) => a + b, 0);
      const totalDamaged = stats.damaged.reduce((a: number, b: number) => a + b, 0);

      insights.push(`Total monitoring visits in ${year}: ${totalMonitoring.toLocaleString()}`);
      if (totalMonitoring > 0) {
        const healthyPercent = ((totalHealthy / totalMonitoring) * 100).toFixed(1);
        insights.push(`Healthy farms: ${healthyPercent}% (${totalHealthy} visits)`);
        insights.push(`Farms needing support: ${totalNeedsSupport} visits`);
        insights.push(`Damaged farms: ${totalDamaged} visits`);
      }
    } else {
      const yearlyMonitoring = prodData.yearlyMonitoring || {};
      const yearlyHealthy = prodData.yearlyHealthy || {};
      const years = Object.keys(yearlyMonitoring).map(Number).sort((a, b) => b - a);

      if (years.length > 0) {
        const latestYear = years[0];
        const total = yearlyMonitoring[latestYear] || 0;
        const healthy = yearlyHealthy[latestYear] || 0;
        insights.push(`Latest year (${latestYear}): ${total.toLocaleString()} monitoring visits`);
        if (total > 0) {
          const healthyPercent = ((healthy / total) * 100).toFixed(1);
          insights.push(`Farm health rate: ${healthyPercent}% healthy`);
        }
      }
    }

    return insights.length > 0 ? insights : ['No data available for insights'];
  };

  const generateDeliveryInsights = (view: 'monthly' | 'yearly', year?: number): string[] => {
    const insights: string[] = [];
    const rawDeliveries = dashboardData.deliveries?.rawDeliveries || [];

    if (view === 'monthly' && year) {
      const yearDeliveries = rawDeliveries.filter((d: any) => new Date(d.created_at || d.delivery_date).getFullYear() === year);
      const totalKg = yearDeliveries.reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);
      const classAKg = yearDeliveries.filter((d: any) => d.grade === 'Class A').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);
      const classBKg = yearDeliveries.filter((d: any) => d.grade === 'Class B').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);
      const classCKg = yearDeliveries.filter((d: any) => d.grade === 'Class C').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);

      insights.push(`Total fiber delivered in ${year}: ${totalKg.toLocaleString()} kg`);
      insights.push(`Class A: ${classAKg.toLocaleString()} kg (${totalKg > 0 ? ((classAKg / totalKg) * 100).toFixed(1) : 0}%)`);
      insights.push(`Class B: ${classBKg.toLocaleString()} kg (${totalKg > 0 ? ((classBKg / totalKg) * 100).toFixed(1) : 0}%)`);
      insights.push(`Class C: ${classCKg.toLocaleString()} kg (${totalKg > 0 ? ((classCKg / totalKg) * 100).toFixed(1) : 0}%)`);
    } else {
      const yearlyData: { [year: number]: { total: number, classA: number, classB: number, classC: number } } = {};
      rawDeliveries.forEach((d: any) => {
        const year = new Date(d.created_at || d.delivery_date).getFullYear();
        if (!yearlyData[year]) yearlyData[year] = { total: 0, classA: 0, classB: 0, classC: 0 };
        const kg = parseFloat(d.quantity_kg || 0);
        yearlyData[year].total += kg;
        if (d.grade === 'Class A') yearlyData[year].classA += kg;
        else if (d.grade === 'Class B') yearlyData[year].classB += kg;
        else if (d.grade === 'Class C') yearlyData[year].classC += kg;
      });

      const years = Object.keys(yearlyData).map(Number).sort((a, b) => b - a);
      if (years.length > 0) {
        const latestYear = years[0];
        const data = yearlyData[latestYear];
        insights.push(`Latest year (${latestYear}): ${data.total.toLocaleString()} kg delivered`);
        insights.push(`Quality distribution: Class A ${((data.classA / data.total) * 100).toFixed(1)}%, Class B ${((data.classB / data.total) * 100).toFixed(1)}%, Class C ${((data.classC / data.total) * 100).toFixed(1)}%`);
      }
    }

    return insights.length > 0 ? insights : ['No data available for insights'];
  };

  const generateSalesPerformanceInsights = (view: 'monthly' | 'yearly', year?: number): string[] => {
    const insights: string[] = [];
    // Combine sales and completed deliveries
    const allSales = [
      ...(dashboardData.sales?.allSales || dashboardData.sales?.recentSales || []),
      ...(dashboardData.deliveries?.rawDeliveries?.filter((d: any) => d.status === 'Completed' || d.status === 'Delivered') || []).map((d: any) => ({
        ...d,
        sale_date: d.delivery_date,
        total_amount: d.total_amount || (parseFloat(d.quantity_kg || 0) * (d.grade === 'Class A' ? 550 : d.grade === 'Class B' ? 450 : 350))
      }))
    ];

    if (view === 'monthly' && year) {
      const yearlySales = allSales.filter((s: any) => new Date(s.sale_date).getFullYear() === year);
      const totalSales = yearlySales.reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);

      const classASales = yearlySales.filter((s: any) => s.grade === 'Class A').reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);
      const classBSales = yearlySales.filter((s: any) => s.grade === 'Class B').reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);
      const classCSales = yearlySales.filter((s: any) => s.grade === 'Class C').reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0);

      insights.push(`📊 SUMMARY: In ${year}, total fiber sales generated ₱${totalSales.toLocaleString()}.`);

      if (totalSales > 0) {
        const topClass = classASales > classBSales && classASales > classCSales ? 'Class A' : classBSales > classCSales ? 'Class B' : 'Class C';
        const topAmount = Math.max(classASales, classBSales, classCSales);
        const topPercent = ((topAmount / totalSales) * 100).toFixed(1);

        insights.push(`🏆 TOP PERFORMER: ${topClass} contributed ₱${topAmount.toLocaleString()} (${topPercent}% of total sales).`);

        insights.push(`💰 Class A: ₱${classASales.toLocaleString()} (${((classASales / totalSales) * 100).toFixed(1)}%)`);
        insights.push(`💰 Class B: ₱${classBSales.toLocaleString()} (${((classBSales / totalSales) * 100).toFixed(1)}%)`);
        insights.push(`💰 Class C: ₱${classCSales.toLocaleString()} (${((classCSales / totalSales) * 100).toFixed(1)}%)`);
      }

      // Monthly Trend
      const salesByMonth = new Array(12).fill(0);
      yearlySales.forEach((s: any) => {
        const month = new Date(s.sale_date).getMonth();
        salesByMonth[month] += parseFloat(s.total_amount || 0);
      });

      const maxMonthIdx = salesByMonth.indexOf(Math.max(...salesByMonth));
      if (salesByMonth[maxMonthIdx] > 0) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        insights.push(`📈 PEAK MONTH: ${months[maxMonthIdx]} generated the highest sales of ₱${salesByMonth[maxMonthIdx].toLocaleString()}.`);
      }

    } else {
      const salesByYear: { [key: number]: number } = {};
      const classAByYear: { [key: number]: number } = {};

      allSales.forEach((s: any) => {
        const y = new Date(s.sale_date).getFullYear();
        const amount = parseFloat(s.total_amount || 0);
        salesByYear[y] = (salesByYear[y] || 0) + amount;
        if (s.grade === 'Class A') classAByYear[y] = (classAByYear[y] || 0) + amount;
      });

      const years = Object.keys(salesByYear).map(Number).sort((a, b) => b - a);

      if (years.length > 0) {
        const latestYear = years[0];
        const latestTotal = salesByYear[latestYear];

        insights.push(`📊 ${latestYear}: Total sales reached ₱${latestTotal.toLocaleString()}.`);

        if (years.length > 1) {
          const prevYear = years[1];
          const growth = latestTotal - salesByYear[prevYear];
          const growthPercent = ((growth / salesByYear[prevYear]) * 100).toFixed(1);

          if (growth > 0) {
            insights.push(`📈 GROWTH: Sales increased by ${growthPercent}% (+₱${growth.toLocaleString()}) compared to ${prevYear}.`);
          } else {
            insights.push(`📉 DECLINE: Sales decreased by ${Math.abs(parseFloat(growthPercent))}% compared to ${prevYear}.`);
          }
        }

        const totalAllTime = Object.values(salesByYear).reduce((a, b) => a + b, 0);
        insights.push(`💰 LIFETIME SALES: ₱${totalAllTime.toLocaleString()} generated across all years.`);
      }
    }

    return insights.length > 0 ? insights : ['No data available for insights'];
  };

  // Flat Editorial Donut Chart Component
  const AnimatedPieChart: React.FC<{
    data: { name: string; value: number; fill: string; percentage: number }[],
    centerLabel?: string,
    centerSubLabel?: string
  }> = ({ data, centerLabel, centerSubLabel }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    let currentAngle = -90;

    const validData = data.filter(item => item.value > 0);
    const total = validData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56">
          {validData.length === 1 ? (
            <circle
              cx="120"
              cy="120"
              r={hoveredIndex === 0 ? 92 : 88}
              fill={validData[0].fill}
              onMouseEnter={() => setHoveredIndex(0)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-200"
            />
          ) : (
            validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const radius = hoveredIndex === index ? 92 : 88;
              const x1 = 120 + radius * Math.cos(startRad);
              const y1 = 120 + radius * Math.sin(startRad);
              const x2 = 120 + radius * Math.cos(endRad);
              const y2 = 120 + radius * Math.sin(endRad);

              const largeArc = angle > 180 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 120 120 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={item.fill}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.65
                  }}
                />
              );
            })
          )}

          <circle cx="120" cy="120" r="56" fill="#FFFFFF" />
        </svg>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[104px] flex flex-col items-center justify-center">
          {hoveredIndex !== null && validData[hoveredIndex] ? (
            <>
              <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">
                {((validData[hoveredIndex].value / total) * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-1 break-words w-full">
                {validData[hoveredIndex].name}
              </p>
            </>
          ) : (
            <>
              <p className={`${(centerLabel?.length || 0) > 12 ? 'text-sm' : (centerLabel?.length || 0) > 8 ? 'text-base' : 'text-xl'} font-bold text-gray-900 tabular-nums leading-tight mb-0.5 px-1`}>
                {centerLabel}
              </p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight break-words w-full">{centerSubLabel}</p>
            </>
          )}
        </div>
      </div>
    );
  };
  // Dashboard data loading helpers
  // (State removal of duplicates below)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch production data
      const productionRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/production-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productionData = await productionRes.json();

      // Fetch sales data
      const salesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/sales-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesData = await salesRes.json();

      // Fetch users data
      const usersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      // Fetch delivery data
      const deliveriesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/fiber-deliveries/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const deliveriesData = await deliveriesRes.json();
      const deliveries = deliveriesData.deliveries || [];

      const deliveryStats = {
        totalDeliveries: deliveries.length,
        inTransit: deliveries.filter((d: any) => d.status === 'In Transit').length,
        delivered: deliveries.filter((d: any) => d.status === 'Delivered').length,
        completed: deliveries.filter((d: any) => d.status === 'Completed').length,
        cancelled: deliveries.filter((d: any) => d.status === 'Cancelled').length,
        totalFiberKg: deliveries.reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        deliveredFiberKg: deliveries.filter((d: any) => ['Delivered', 'Completed'].includes(d.status)).reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        cancelledFiberKg: deliveries.filter((d: any) => d.status === 'Cancelled').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        classA_Kg: deliveries.filter((d: any) => ['Delivered', 'Completed'].includes(d.status) && (d.grade || '').match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1|superior/i)).reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        classB_Kg: deliveries.filter((d: any) => ['Delivered', 'Completed'].includes(d.status) && (d.grade || '').match(/\bb\b|class[-_\s]*b|grade[-_\s]*b|fiber[-_\s]*b|grade\s*2/i)).reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        classC_Kg: deliveries.filter((d: any) => ['Delivered', 'Completed'].includes(d.status) && (d.grade || '').match(/\bc\b|class[-_\s]*c|grade[-_\s]*c|fiber[-_\s]*c|grade\s*3/i)).reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
        totalValue: deliveries.filter((d: any) => d.status === 'Completed' || d.status === 'Delivered').reduce((sum: number, d: any) => sum + parseFloat(d.total_amount || 0), 0),
        rawDeliveries: deliveries // Store raw deliveries for filtering
      };

      // Calculate monthly data from actual database dates
      const currentYear = new Date().getFullYear();
      let monthlyReceived = new Array(12).fill(0);
      let monthlyDistributed = new Array(12).fill(0);
      let monthlyHarvest = new Array(12).fill(0);

      // Seedling / Production maps
      const monthlyStatsByYear: { [year: number]: { received: number[], distributed: number[], harvested: number[], planted: number[], unplanted: number[] } } = {};
      const yearlyReceived: { [year: number]: number } = {};
      const yearlyDistributed: { [year: number]: number } = {};
      const yearlyHarvest: { [year: number]: number } = {};
      const yearlyPlanted: { [year: number]: number } = {};
      const yearlyUnplanted: { [year: number]: number } = {};

      const ensureYearInStats = (year: number) => {
        if (!monthlyStatsByYear[year]) {
          monthlyStatsByYear[year] = {
            received: new Array(12).fill(0),
            distributed: new Array(12).fill(0),
            harvested: new Array(12).fill(0),
            planted: new Array(12).fill(0),
            unplanted: new Array(12).fill(0)
          };
        }
        if (!yearlyReceived[year]) yearlyReceived[year] = 0;
        if (!yearlyDistributed[year]) yearlyDistributed[year] = 0;
        if (!yearlyHarvest[year]) yearlyHarvest[year] = 0;
        if (!yearlyPlanted[year]) yearlyPlanted[year] = 0;
        if (!yearlyUnplanted[year]) yearlyUnplanted[year] = 0;
      };

      // Process deliveries for monthly harvest (production)
      deliveries.forEach((d: any) => {
        const date = new Date(d.created_at || d.delivery_date);
        if (d.status === 'Completed' || d.status === 'Delivered') {
          const year = date.getFullYear();
          const monthIndex = date.getMonth();
          const quantity = parseFloat(d.quantity_kg || 0);

          ensureYearInStats(year);
          monthlyStatsByYear[year].harvested[monthIndex] += quantity;
          yearlyHarvest[year] += quantity;
        }
      });

      try {
        // Fetch seedling distributions for monthly data
        const associationDistRes = await fetch(`${import.meta.env.VITE_API_URL}/api/association-seedlings/mao/associations`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (associationDistRes.ok) {
          const associationDist = await associationDistRes.json();

          // Process association distributions (Received)
          const distributions = associationDist.distributions || associationDist || [];
          console.log('📦 Processing association distributions (Received):', distributions.length, 'records');

          distributions.forEach((dist: any) => {
            const dateStr = dist.date_distributed || dist.created_at;
            if (!dateStr) return;
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const monthIndex = date.getMonth();
            const quantity = parseInt(dist.quantity_distributed || 0);

            ensureYearInStats(year);
            monthlyStatsByYear[year].received[monthIndex] += quantity;
            yearlyReceived[year] += quantity;
          });
        }

        // For distributed data, fetch from CUSAFA endpoint which has all farmer distributions
        try {
          const farmerDistRes = await fetch(`${import.meta.env.VITE_API_URL}/api/association-seedlings/cusafa/all-distributions`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (farmerDistRes.ok) {
            const farmerDistData = await farmerDistRes.json();

            // Process farmer distributions (Distributed to farmers)
            const farmerDists = farmerDistData.farmer_distributions || [];
            console.log('🚜 Processing farmer distributions (Distributed):', farmerDists.length, 'records');

            farmerDists.forEach((dist: any) => {
              // Process Distributed
              const dateStr = dist.date_distributed || dist.created_at;
              if (dateStr) {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const monthIndex = date.getMonth();
                const quantity = parseInt(dist.quantity_distributed || 0);

                ensureYearInStats(year);
                monthlyStatsByYear[year].distributed[monthIndex] += quantity;
                yearlyDistributed[year] += quantity;

                // Process Unplanted/Damage (Combined losses and pending)
                // If planted, unplanted/damage is the diff between distributed and planted qty
                // If not planted yet, everything counts as unplanted/damage until planted
                const pQuantity = dist.status === 'planted' ? parseInt(dist.planted_quantity ?? dist.quantity_distributed ?? 0) : 0;
                const unplantedQty = Math.max(0, quantity - pQuantity);

                if (unplantedQty > 0) {
                  monthlyStatsByYear[year].unplanted[monthIndex] += unplantedQty;
                  yearlyUnplanted[year] += unplantedQty;
                }
              }

              // Process Planted (Only if status is planted)
              if (dist.status === 'planted') {
                const plantingDateStr = dist.planting_date || dist.planted_at || dist.date_distributed || dist.created_at;
                const plantingDate = new Date(plantingDateStr);
                const pYear = plantingDate.getFullYear();
                const pMonth = plantingDate.getMonth();
                const pQuantity = parseInt(dist.planted_quantity ?? dist.quantity_distributed ?? 0);

                ensureYearInStats(pYear);
                monthlyStatsByYear[pYear].planted[pMonth] += pQuantity;
                yearlyPlanted[pYear] += pQuantity;
              }
            });
          }
        } catch (err) {
          console.log('Could not fetch distributed data:', err);
        }

        // NEW: Fetch direct MAO distributions (from the 'seedlings' table)
        try {
          const directSeedlingsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/seedlings/all`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (directSeedlingsRes.ok) {
            const directSeedlings = await directSeedlingsRes.json();
            const seedlingsList = Array.isArray(directSeedlings) ? directSeedlings : (directSeedlings.data || []);
            console.log('🌱 Processing direct MAO distributions:', seedlingsList.length, 'records');

            seedlingsList.forEach((dist: any) => {
              const dateStr = dist.date_distributed || dist.created_at;
              if (dateStr) {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const monthIndex = date.getMonth();
                const quantity = parseInt(dist.quantity_distributed || 0);

                ensureYearInStats(year);
                // Also counts as received and distributed for the overview
                monthlyStatsByYear[year].received[monthIndex] += quantity;
                monthlyStatsByYear[year].distributed[monthIndex] += quantity;
                yearlyReceived[year] += quantity;
                yearlyDistributed[year] += quantity;

                // Process Planted status
                if (dist.status === 'planted' || dist.status === 'harvested' || (dist.planted_at && !dist.status?.includes('cancelled'))) {
                  const pDateStr = dist.planting_date || dist.planted_at || dateStr;
                  const pDate = new Date(pDateStr);
                  const pYear = pDate.getFullYear();
                  const pMonth = pDate.getMonth();
                  const pQuantity = parseInt(dist.planted_quantity ?? dist.quantity_distributed ?? 0);

                  ensureYearInStats(pYear);
                  monthlyStatsByYear[pYear].planted[pMonth] += pQuantity;
                  yearlyPlanted[pYear] += pQuantity;
                } else {
                  // If not planted, it's pending/unplanted
                  monthlyStatsByYear[year].unplanted[monthIndex] += quantity;
                  yearlyUnplanted[year] += quantity;
                }
              }
            });
          }
        } catch (err) {
          console.log('Could not fetch direct seedling data:', err);
        }
      } catch (err) {
        console.log('Using fallback monthly data calculation', err);
      }

      // Fetch monitoring records for real data
      let monthlyMonitoring = new Array(12).fill(0);
      let monthlyHealthy = new Array(12).fill(0);
      let monthlyNeedsSupport = new Array(12).fill(0);
      let monthlyDamaged = new Array(12).fill(0);
      let healthyFarms = 0;
      let needsSupportFarms = 0;
      let damagedFarms = 0;
      let totalMonitoring = 0;

      // Yearly aggregation objects
      const yearlyMonitoringData: { [year: number]: number } = {};
      const yearlyHealthyData: { [year: number]: number } = {};
      const yearlyNeedsSupportData: { [year: number]: number } = {};
      const yearlyDamagedData: { [year: number]: number } = {};

      try {
        const monitoringRes = await fetch(`${import.meta.env.VITE_API_URL}/api/mao/monitoring`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (monitoringRes.ok) {
          const monitoringData = await monitoringRes.json();
          const records = Array.isArray(monitoringData) ? monitoringData : (monitoringData.records || monitoringData.data || []);

          // Monitoring maps
          const monitoringStatsByYear: { [year: number]: { total: number[], healthy: number[], needsSupport: number[], damaged: number[] } } = {};

          const ensureYearInMonitoring = (year: number) => {
            if (!monitoringStatsByYear[year]) {
              monitoringStatsByYear[year] = {
                total: new Array(12).fill(0),
                healthy: new Array(12).fill(0),
                needsSupport: new Array(12).fill(0),
                damaged: new Array(12).fill(0)
              };
            }
            if (!yearlyMonitoringData[year]) {
              yearlyMonitoringData[year] = 0;
              yearlyHealthyData[year] = 0;
              yearlyNeedsSupportData[year] = 0;
              yearlyDamagedData[year] = 0;
            }
          };

          records.forEach((record: any) => {
            const dateStr = record.date_of_visit || record.created_at;
            if (!dateStr) return;
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const monthIndex = date.getMonth();
            totalMonitoring++;

            ensureYearInMonitoring(year);

            // Aggregate yearly totals
            yearlyMonitoringData[year]++;
            monitoringStatsByYear[year].total[monthIndex]++;

            if (record.farm_condition === 'Healthy') {
              yearlyHealthyData[year]++;
              monitoringStatsByYear[year].healthy[monthIndex]++;
              healthyFarms++;
            } else if (record.farm_condition === 'Needs Support') {
              yearlyNeedsSupportData[year]++;
              monitoringStatsByYear[year].needsSupport[monthIndex]++;
              needsSupportFarms++;
            } else if (record.farm_condition === 'Damaged') {
              yearlyDamagedData[year]++;
              monitoringStatsByYear[year].damaged[monthIndex]++;
              damagedFarms++;
            }
          });

          // Pass monitoring results back to production object
          productionData.monitoringStatsByYear = monitoringStatsByYear;

          // Update current year monthly variables for fallback/backward compat
          if (monitoringStatsByYear[currentYear]) {
            monthlyMonitoring = monitoringStatsByYear[currentYear].total;
            monthlyHealthy = monitoringStatsByYear[currentYear].healthy;
            monthlyNeedsSupport = monitoringStatsByYear[currentYear].needsSupport;
            monthlyDamaged = monitoringStatsByYear[currentYear].damaged;
          }
        }
      } catch (err) {
        console.log('Could not fetch monitoring data', err);
      }

      // ---------------------------------------------------------
      // FETCH RAW HARVESTS AND APPLY FALLBACKS
      // ---------------------------------------------------------

      // 1. Try to fetch raw harvest data for accurate monthly breakdown
      try {
        const harvestsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/harvests/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (harvestsRes.ok) {
          const harvestsData = await harvestsRes.json();
          // Normalize data structure (array vs {data: []})
          const harvests = Array.isArray(harvestsData) ? harvestsData : (harvestsData.data || []);

          if (harvests.length > 0) {
            console.log('🌾 Processing harvest data:', harvests.length, 'records');
            // Reset to fill with real data
            monthlyHarvest = new Array(12).fill(0);
            harvests.forEach((h: any) => {
              const dateStr = h.harvest_date || h.created_at;
              if (!dateStr) return;

              const date = new Date(dateStr);
              const year = date.getFullYear();
              const monthIndex = date.getMonth();
              const quantity = parseFloat(h.dry_fiber_output_kg || 0);

              ensureYearInStats(year);
              monthlyStatsByYear[year].harvested[monthIndex] += quantity;
              yearlyHarvest[year] += quantity;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch harvest breakdown:', e);
      }

      // Sync monthly variables with current year stats map
      if (monthlyStatsByYear[currentYear]) {
        monthlyReceived = monthlyStatsByYear[currentYear].received;
        monthlyDistributed = monthlyStatsByYear[currentYear].distributed;
        monthlyHarvest = monthlyStatsByYear[currentYear].harvested;
      }

      // 2. Apply "Dump in Jan" Fallbacks if arrays are empty but totals exist
      // This ensures the Bar Chart shows SOMETHING (Total) instead of 0

      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

      // Check Received
      if (sum(monthlyReceived) === 0 && (productionData.totalSeedlingsReceived || 0) > 0) {
        monthlyReceived[0] = productionData.totalSeedlingsReceived;
      }

      // Check Distributed
      if (sum(monthlyDistributed) === 0 && (productionData.totalSeedlingsDistributed || 0) > 0) {
        monthlyDistributed[0] = productionData.totalSeedlingsDistributed;
      }

      // Check Harvest
      if (sum(monthlyHarvest) === 0 && (productionData.totalHarvestFiber || 0) > 0) {
        monthlyHarvest[0] = productionData.totalHarvestFiber;
      }

      setDashboardData({
        production: {
          ...productionData,
          monthlyStatsByYear,
          yearlyReceived,
          yearlyDistributed,
          yearlyHarvest,
          yearlyPlanted,
          yearlyUnplanted,
          yearlyMonitoring: yearlyMonitoringData,
          yearlyHealthy: yearlyHealthyData,
          yearlyNeedsSupport: yearlyNeedsSupportData,
          yearlyDamaged: yearlyDamagedData,
          healthyFarms,
          needsSupportFarms,
          damagedFarms,
          totalMonitoringVisits: totalMonitoring || productionData.totalMonitoringVisits,
          // Use calculated total planted for more accuracy
          totalSeedlingsPlanted: Object.values(yearlyPlanted).reduce((a, b) => a + b, 0) || productionData.totalSeedlingsPlanted,
          totalHarvestFiber: Object.values(yearlyHarvest).reduce((a, b) => a + b, 0) || productionData.totalHarvestFiber,
          // Support old variables for backward compatibility if needed, but using currentYear
          monthlyReceived: monthlyStatsByYear[currentYear]?.received || new Array(12).fill(0),
          monthlyDistributed: monthlyStatsByYear[currentYear]?.distributed || new Array(12).fill(0),
          monthlyHarvest: monthlyStatsByYear[currentYear]?.harvested || new Array(12).fill(0),
          monthlyMonitoring: (productionData.monitoringStatsByYear as any)?.[currentYear]?.total || new Array(12).fill(0),
          monthlyHealthy: (productionData.monitoringStatsByYear as any)?.[currentYear]?.healthy || new Array(12).fill(0),
          monthlyNeedsSupport: (productionData.monitoringStatsByYear as any)?.[currentYear]?.needsSupport || new Array(12).fill(0),
          monthlyDamaged: (productionData.monitoringStatsByYear as any)?.[currentYear]?.damaged || new Array(12).fill(0)
        },
        sales: salesData,
        users: usersData,
        deliveries: deliveryStats
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const { version, manualTick } = useCacheState();
  const lastDashboardVersionRef = useRef(version);
  const prevManualTickRef = useRef(manualTick);

  // Load profile photo and dashboard data on component mount
  useEffect(() => {
    fetchOfficerProfile();
    fetchDashboardData();
    fetchNotifications();
  }, []);

  // Re-fetch overview dashboard & notifications only when cache invalidates (mutation / manual refresh)
  useEffect(() => {
    const manualChanged = prevManualTickRef.current !== manualTick;
    if (manualChanged) {
      prevManualTickRef.current = manualTick;
      lastDashboardVersionRef.current = version;
      fetchOfficerProfile();
      fetchNotifications();
      if (currentPage === 'dashboard') {
        fetchDashboardData();
      }
      return;
    }

    if (currentPage === 'dashboard' && lastDashboardVersionRef.current !== version) {
      lastDashboardVersionRef.current = version;
      fetchDashboardData();
      fetchNotifications();
      fetchOfficerProfile();
    }
  }, [currentPage, version, manualTick]);

  // Sync selected years to latest available data when dashboard data loads
  useEffect(() => {
    if (!loadingDashboard && dashboardData) {
      // 1. Seedlings / Production latest year
      const prodYears = Object.keys(dashboardData.production.monthlyStatsByYear || {}).map(Number);
      if (prodYears.length > 0) {
        const latest = Math.max(...prodYears);
        setSeedlingMonthYear(latest);
      }

      // 2. Monitoring latest year
      const monYears = Object.keys((dashboardData.production as any).monitoringStatsByYear || {}).map(Number);
      if (monYears.length > 0) {
        const latest = Math.max(...monYears);
        setMonitoringMonthYear(latest);
      }

      // 3. Sales & Deliveries latest year
      const allSalesData = [
        ...(dashboardData.sales?.allSales || dashboardData.sales?.recentSales || []),
        ...(dashboardData.deliveries?.rawDeliveries || []).filter((d: any) => d.status === 'Completed' || d.status === 'Delivered')
      ];

      const salesYears = Array.from(new Set(
        allSalesData.map((s: any) => new Date(s.sale_date || s.delivery_date || s.created_at).getFullYear())
      )).filter(y => !isNaN(y) && y > 2000);

      if (salesYears.length > 0) {
        const latest = Math.max(...salesYears);
        setSalesMonthYear(latest);
        setDeliveryMonthYear(latest);
      }
    }
  }, [loadingDashboard]);

  // Fetch notifications for MAO officer
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mao/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();

        // Get the last time the user checked notifications
        const lastRead = localStorage.getItem('mao_last_read_at');
        const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);

        // Mark as unread only if the notification is newer than lastRead
        const notificationsWithStatus = (data || []).map((n: any) => ({
          ...n,
          unread: new Date(n.date) > lastReadDate
        }));

        const count = notificationsWithStatus.filter((n: any) => n.unread).length;
        setNotifications(notificationsWithStatus);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showProfileModal) {
      fetchOfficerProfile();
    } else {
      // Reset states when modal closes (but keep profilePhoto)
      setIsEditMode(false);
      setOfficerData(null);
      setEditFormData({});
    }
  }, [showProfileModal]);

  const maoNavItems: EditorialNavItem[] = [
    { id: 'dashboard', label: 'Overview', category: 'General', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'manual', label: 'User Manual', category: 'General', icon: <BookOpen className="w-[18px] h-[18px]" /> },
    { id: 'users', label: 'User Management', category: 'Field Operations', icon: <UserCheck className="w-[18px] h-[18px]" /> },
    { id: 'seedlings', label: 'Seedling Distribution', category: 'Field Operations', icon: <Sprout className="w-[18px] h-[18px]" /> },
    { id: 'seedlings-overview', label: 'Planted Seedlings', category: 'Field Operations', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
    { id: 'monitoring', label: 'Field Monitoring', category: 'Field Operations', icon: <Calendar className="w-[18px] h-[18px]" /> },
    { id: 'harvests', label: 'Harvest Verification', category: 'Field Operations', icon: <CheckCircle className="w-[18px] h-[18px]" /> },
    { id: 'sales-analytics', label: 'Sales Management', category: 'Market & Logistics', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
    { id: 'buyer-prices', label: 'Buyer Price Listings', category: 'Market & Logistics', icon: <Coins className="w-[18px] h-[18px]" /> },
    { id: 'delivery-tracking', label: 'Delivery Tracking', category: 'Market & Logistics', icon: <Truck className="w-[18px] h-[18px]" /> },
    { id: 'officers', label: 'Staff Management', category: 'Administration', icon: <Shield className="w-[18px] h-[18px]" />, hidden: !isSuperAdmin },
  ];

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Reports & Analytics', subtitle: 'Production, field monitoring, deliveries, and sales for MAO Culiram.' },
    users: { title: 'User Management', subtitle: 'Manage farmers, buyers, and association coordinator accounts.' },
    seedlings: { title: 'Seedling Distribution', subtitle: 'Track seedling batches allocated and distributed to associations.' },
    'seedlings-overview': { title: 'Planted Seedlings', subtitle: 'Monitor farmer planting progress and area coverage.' },
    monitoring: { title: 'Field Monitoring', subtitle: 'Field visit logs, farm conditions, and support tracking.' },
    harvests: { title: 'Harvest Verification', subtitle: 'Review and verify submitted farmer abaca fiber harvests.' },
    'sales-analytics': { title: 'Sales Management', subtitle: 'Review, verify, and manage farmer abaca sales reports.' },
    'sales-performance': { title: 'Sales Performance Analytics', subtitle: 'Fiber sales breakdown by classification and period.' },
    'buyer-prices': { title: 'Buyer Price Listings', subtitle: 'Current buying prices published by registered fiber buyers.' },
    'delivery-tracking': { title: 'Delivery Tracking Monitor', subtitle: 'Track active and completed fiber deliveries across associations.' },
    officers: { title: 'Staff Management', subtitle: 'Manage MAO administrator and coordinator accounts.' },
    manual: { title: 'User Manual', subtitle: 'Step-by-step guide sa admin portal, may mga larawan at paliwanag.' },
  };

  const activeMeta = pageMeta[currentPage] || pageMeta.dashboard;

  return (
    <>
      <EditorialShell
        brandTitle="MAO Culiram"
        brandSubtitle={isSuperAdmin ? 'Super Admin panel' : 'Admin panel'}
        navItems={maoNavItems}
        activeNavId={currentPage}
        onSelectNav={(id) => setCurrentPage(id as any)}
        pageTitle={activeMeta.title}
        pageSubtitle={activeMeta.subtitle}
        headerActions={
          currentPage === 'dashboard' ? (
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold"
            >
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              Refresh data
            </button>
          ) : undefined
        }
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        onToggleNotifications={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
            localStorage.setItem('mao_last_read_at', new Date().toISOString());
          }
        }}
        notificationContent={
          <div>
            <div className="px-4 py-3 border-b border-gray-200 bg-[#FAFAFA] flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">System Updates</h3>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No new updates</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm flex-shrink-0">
                          {notif.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-gray-900 leading-tight">{notif.title}</p>
                            {notif.unread && <span className="w-2 h-2 bg-emerald-600 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-2.5 bg-[#FAFAFA]">
                <button
                  type="button"
                  onClick={() => {
                    setUnreadCount(0);
                    setShowNotifications(false);
                  }}
                  className="text-xs text-[#047857] hover:text-[#065F46] font-semibold"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        }
        profileName={user?.fullName || 'Coordinator'}
        profileRole={isSuperAdmin ? 'Superadmin' : 'MAO Admin'}
        profileAvatar={profilePhoto}
        showProfileMenu={showProfileDropdown}
        onToggleProfileMenu={() => setShowProfileDropdown(!showProfileDropdown)}
        profileMenuContent={
          <div className="py-1.5">
            <div className="px-3.5 py-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setShowProfileModal(true);
                setShowProfileDropdown(false);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 text-xs font-medium text-gray-700"
            >
              <User className="w-3.5 h-3.5 text-gray-500" />
              View Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditMode(true);
                setShowProfileModal(true);
                setShowProfileDropdown(false);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2.5 text-xs font-medium text-gray-700"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              Edit Profile
            </button>
          </div>
        }
        onLogout={onLogout}
      >
        {/* Page Content */}
        <KeepAlivePages
          activeId={currentPage}
          pages={{
            users: () => <UserManagement />,
            seedlings: () => <AssociationSeedlingManagement />,
            'seedlings-overview': () => <PlantedSeedlings />,
            monitoring: () => <MonitoringPage />,
            harvests: () => <MAOHarvestVerificationPage />,
            'sales-analytics': () => <UnifiedSalesManagement />,
            'sales-performance': () => <SalesAnalyticsDashboard />,
            'buyer-prices': () => <BuyerPriceListingsViewer userRole="mao" />,
            'delivery-tracking': () => <DeliveryTrackingMonitor />,
            officers: () => <OfficerManagement />,
            manual: () => <AdminUserManual />,
          }}
        />
        <div
          className={currentPage === 'dashboard' ? 'space-y-6' : 'hidden'}
          aria-hidden={currentPage !== 'dashboard'}
        >
            {/* Accessible Dashboard Section Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
              <div role="tablist" aria-label="Analytics sections" className="flex items-center gap-6 min-w-max">
                <button
                  type="button"
                  role="tab"
                  aria-selected={dashboardSection === 'production'}
                  onClick={() => setDashboardSection('production')}
                  className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${dashboardSection === 'production'
                    ? 'text-[#047857] font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Abaca Production
                  {dashboardSection === 'production' && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#047857] rounded-full" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={dashboardSection === 'reports'}
                  onClick={() => setDashboardSection('reports')}
                  className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${dashboardSection === 'reports'
                    ? 'text-[#047857] font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Sales & Delivery
                  {dashboardSection === 'reports' && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#047857] rounded-full" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={dashboardSection === 'users'}
                  onClick={() => setDashboardSection('users')}
                  className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${dashboardSection === 'users'
                    ? 'text-[#047857] font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  <span className="hidden lg:inline">Users (MAO / CUSAFA / Farmers / Buyers)</span>
                  <span className="lg:hidden">Users</span>
                  {dashboardSection === 'users' && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#047857] rounded-full" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {loadingDashboard ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
              </div>
            ) : (
              <>
                {/* Abaca Production Section */}
                {dashboardSection === 'production' && (
                  <div className="space-y-6">
                    <KpiStrip
                      columns={6}
                      items={[
                        {
                          label: 'Received Seedlings (Assoc)',
                          value: (dashboardData.production?.totalSeedlingsReceived || 0).toLocaleString(),
                          subtext: 'Total seedlings',
                        },
                        {
                          label: 'Completely Distributed',
                          value: (dashboardData.production?.totalSeedlingsDistributed || 0).toLocaleString(),
                          subtext: 'To farmers',
                        },
                        {
                          label: 'Total Monitoring',
                          value: (dashboardData.production?.totalMonitoringVisits || 0).toLocaleString(),
                          subtext: 'Monitoring records',
                        },
                        {
                          label: 'Planted Seedlings',
                          value: (dashboardData.production?.totalSeedlingsPlanted || 0).toLocaleString(),
                          subtext: 'Successfully planted',
                        },
                        {
                          label: 'Area Planted',
                          value: `${(dashboardData.production?.totalAreaPlanted || 0).toLocaleString()} ha`,
                          subtext: 'Total hectares',
                        },
                        {
                          label: 'Harvest Fiber',
                          value: `${(dashboardData.production?.totalHarvestFiber || 0).toLocaleString()} kg`,
                          subtext: 'Total harvested',
                        },
                      ]}
                    />

                    {/* Charts Row - Bar Chart & Donut Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <EditorialCard
                        className="lg:col-span-2 flex flex-col"
                        title="Seedling Distribution Overview"
                        subtitle="Received vs. completely distributed seedlings"
                        actions={
                          <div className="flex flex-wrap items-center gap-2">
                            {chartView === 'monthly' && (
                              <select
                                className="text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                                value={seedlingMonthYear}
                                onChange={(e) => setSeedlingMonthYear(parseInt(e.target.value))}
                                aria-label="Seedling year"
                              >
                                {Array.from(new Set([
                                  new Date().getFullYear(),
                                  ...Object.keys(dashboardData.production.monthlyStatsByYear || {}).map(Number),
                                  ...Object.keys(dashboardData.production.yearlyReceived || {}).map(Number),
                                  ...Object.keys(dashboardData.production.yearlyDistributed || {}).map(Number)
                                ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
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
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentInsight({
                                  title: 'Seedling Distribution Overview',
                                  insights: generateSeedlingInsights(chartView, chartView === 'monthly' ? seedlingMonthYear : undefined),
                                  view: chartView
                                });
                                setShowInsightModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              Insights
                            </button>
                          </div>
                        }
                      >
                        <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                            Received (Assoc)
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                            Completely Distributed
                          </span>
                        </div>

                        {(() => {
                          let chartData: any[] = [];
                          const prodData: any = dashboardData.production;

                          if (chartView === 'yearly') {
                            const yearlyReceived = prodData.yearlyReceived || {};
                            const yearlyDistributed = prodData.yearlyDistributed || {};
                            const yearlyHarvest = prodData.yearlyHarvest || {};
                            const years = Array.from(new Set([
                              new Date().getFullYear(),
                              ...Object.keys(yearlyReceived || {}).map(Number),
                              ...Object.keys(yearlyDistributed || {}).map(Number),
                              ...Object.keys(yearlyHarvest || {}).map(Number),
                              ...Object.keys(prodData.monthlyStatsByYear || {}).map(Number)
                            ])).filter(y => y > 2000).sort((a, b) => a - b);

                            chartData = years.map(year => ({
                              period: year.toString(),
                              received: yearlyReceived[year] || 0,
                              distributed: yearlyDistributed[year] || 0
                            }));
                          } else {
                            const stats = prodData.monthlyStatsByYear?.[seedlingMonthYear] || {
                              received: new Array(12).fill(0),
                              distributed: new Array(12).fill(0)
                            };
                            const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            chartData = labels.map((label, i) => ({
                              period: label,
                              received: stats.received[i],
                              distributed: stats.distributed[i]
                            }));
                          }

                          return (
                            <div className="overflow-x-auto">
                              <div style={{ minWidth: chartView === 'monthly' ? '640px' : '100%', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={360}>
                                  <RechartsBarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                                    barGap={chartView === 'monthly' ? 8 : 4}
                                    barCategoryGap={chartData.length < 5 ? '30%' : '20%'}
                                  >
                                    <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                    <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={8} />
                                    <YAxis {...EDITORIAL_CHART.yAxisProps} />
                                    <Tooltip
                                      contentStyle={EDITORIAL_CHART.tooltipStyle}
                                      cursor={{ fill: '#F9FAFB' }}
                                      formatter={(value: any) => `${Math.round(Number(value)).toLocaleString()} seedlings`}
                                    />
                                    <Bar
                                      dataKey="received"
                                      name="Received (Assoc)"
                                      fill={EDITORIAL_CHART.colors.amber}
                                      radius={[4, 4, 0, 0]}
                                      barSize={chartView === 'monthly' ? 22 : 40}
                                    />
                                    <Bar
                                      dataKey="distributed"
                                      name="Completely Distributed"
                                      fill={EDITORIAL_CHART.colors.emerald}
                                      radius={[4, 4, 0, 0]}
                                      barSize={chartView === 'monthly' ? 22 : 40}
                                    />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })()}
                      </EditorialCard>

                      <EditorialCard
                        title="Production Overview"
                        subtitle="Planted units vs. harvested kg"
                        className="flex flex-col h-full"
                        bodyClassName="flex-1 flex flex-col justify-center"
                      >
                        {(() => {
                          const totalPlanted = dashboardData.production.totalSeedlingsPlanted || 0;
                          const totalHarvested = dashboardData.production.totalHarvestFiber || 0;
                          const total = totalPlanted + totalHarvested;

                          const chartData = [
                            { name: 'Planted', value: totalPlanted, fill: EDITORIAL_CHART.colors.emerald, percentage: total > 0 ? (totalPlanted / total) * 100 : 0 },
                            { name: 'Harvested Total', value: totalHarvested, fill: EDITORIAL_CHART.colors.amber, percentage: total > 0 ? (totalHarvested / total) * 100 : 0 }
                          ];

                          if (total === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Activity className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-sm font-medium text-gray-500">No production data</p>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col items-center">
                              <AnimatedPieChart
                                data={chartData}
                                centerLabel={totalHarvested.toLocaleString()}
                                centerSubLabel="Fiber Harvested (kg)"
                              />
                              <div className="grid grid-cols-1 gap-2.5 w-full mt-4">
                                {chartData.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                      <div>
                                        <span className="text-xs font-medium text-gray-500 block">{item.name}</span>
                                        <span className="text-base font-bold text-gray-900 tabular-nums">{item.value.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                                      {item.name === 'Planted' ? 'seedlings' : 'kg fiber'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </EditorialCard>
                    </div>

                    {/* Production Trends */}
                    <EditorialCard
                      title="Production Trends"
                      subtitle="Planted vs. harvested and unplanted comparison"
                      actions={
                        <div className="flex flex-wrap items-center gap-2">
                          {trendsView === 'monthly' && (
                            <select
                              className="text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                              value={trendsYear}
                              onChange={(e) => setTrendsYear(parseInt(e.target.value))}
                              aria-label="Production trends year"
                            >
                              {Array.from(new Set([
                                new Date().getFullYear(),
                                ...Object.keys(dashboardData.production.monthlyStatsByYear || {}).map(Number),
                                ...Object.keys(dashboardData.production.yearlyDistributed || {}).map(Number)
                              ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          )}
                          <SegmentedToggle
                            options={[
                              { value: 'monthly', label: 'Monthly' },
                              { value: 'yearly', label: 'Yearly' },
                            ]}
                            value={trendsView}
                            onChange={(v) => setTrendsView(v as 'monthly' | 'yearly')}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentInsight({
                                title: 'Production Trends',
                                insights: generateProductionTrendsInsights(trendsView, trendsView === 'monthly' ? trendsYear : undefined),
                                view: trendsView
                              });
                              setShowInsightModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            Insights
                          </button>
                        </div>
                      }
                    >
                      <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                          Planted
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                          Harvested
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.slate }} />
                          Unplanted / Damage
                        </span>
                      </div>

                      {(() => {
                        let chartData: any[] = [];
                        const prodData: any = dashboardData.production;

                        if (trendsView === 'yearly') {
                          const yearlyPlanted = prodData.yearlyPlanted || {};
                          const yearlyHarvest = prodData.yearlyHarvest || {};
                          const years = Array.from(new Set([
                            new Date().getFullYear(),
                            ...Object.keys(yearlyPlanted || {}).map(Number),
                            ...Object.keys(yearlyHarvest || {}).map(Number)
                          ])).filter(y => y > 2000).sort((a, b) => a - b);

                          chartData = years.map(year => ({
                            period: year.toString(),
                            planted: yearlyPlanted[year] || 0,
                            harvested: yearlyHarvest[year] || 0,
                            unplanted: prodData.yearlyUnplanted?.[year] || 0
                          }));
                        } else {
                          const stats = prodData.monthlyStatsByYear?.[trendsYear] || {
                            planted: new Array(12).fill(0),
                            harvested: new Array(12).fill(0),
                            unplanted: new Array(12).fill(0)
                          };
                          const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          chartData = labels.map((label, i) => ({
                            period: label,
                            planted: stats.planted ? stats.planted[i] : (stats.distributed ? stats.distributed[i] : 0),
                            harvested: stats.harvested[i],
                            unplanted: stats.unplanted ? stats.unplanted[i] : 0
                          }));
                        }

                        return (
                          <div className="overflow-x-auto">
                            <div style={{ minWidth: trendsView === 'monthly' ? '700px' : '100%', width: '100%' }}>
                              <ResponsiveContainer width="100%" height={360}>
                                <RechartsBarChart
                                  data={chartData}
                                  margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                                  barGap={6}
                                  barCategoryGap={chartData.length < 5 ? '30%' : '18%'}
                                >
                                  <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                  <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={8} />
                                  <YAxis {...EDITORIAL_CHART.yAxisProps} />
                                  <Tooltip
                                    contentStyle={EDITORIAL_CHART.tooltipStyle}
                                    cursor={{ fill: '#F9FAFB' }}
                                    formatter={(value: any, name: string) => {
                                      const formattedValue = Math.round(Number(value)).toLocaleString();
                                      if (name === 'Planted' || name === 'Unplanted/Damage') return `${formattedValue} seedlings`;
                                      if (name === 'Harvested') return `${formattedValue} kg`;
                                      return formattedValue;
                                    }}
                                  />
                                  <Bar dataKey="planted" name="Planted" fill={EDITORIAL_CHART.colors.emerald} radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 42 : 20} />
                                  <Bar dataKey="harvested" name="Harvested" fill={EDITORIAL_CHART.colors.amber} radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 42 : 20} />
                                  <Bar dataKey="unplanted" name="Unplanted/Damage" fill={EDITORIAL_CHART.colors.slate} radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 42 : 20} />
                                </RechartsBarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        );
                      })()}
                    </EditorialCard>

                    {/* Field Monitoring */}
                    <div className="space-y-4">
                      <h2 className="font-serif text-xl font-bold text-gray-900">Field Monitoring</h2>
                      <KpiStrip
                        columns={4}
                        items={[
                          { label: 'Total Monitoring', value: dashboardData.production.totalMonitoringVisits.toLocaleString(), subtext: 'Monitoring records' },
                          { label: 'Healthy Farms', value: dashboardData.production.healthyFarms.toLocaleString(), subtext: 'In good condition' },
                          { label: 'Needs Support', value: dashboardData.production.needsSupportFarms.toLocaleString(), subtext: 'Requires attention' },
                          { label: 'Damaged Farms', value: dashboardData.production.damagedFarms.toLocaleString(), subtext: 'Critical condition' },
                        ]}
                      />

                      <EditorialCard
                        title="Monitoring Status Overview"
                        subtitle="Track farm health and monitoring visits over time"
                        actions={
                          <div className="flex flex-wrap items-center gap-2">
                            {monitoringView === 'monthly' && (
                              <select
                                className="text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                                value={monitoringMonthYear}
                                onChange={(e) => setMonitoringMonthYear(parseInt(e.target.value))}
                                aria-label="Monitoring year"
                              >
                                {Array.from(new Set([
                                  new Date().getFullYear(),
                                  ...Object.keys((dashboardData.production as any).monitoringStatsByYear || {}).map(Number),
                                  ...Object.keys((dashboardData.production as any).yearlyMonitoring || {}).map(Number)
                                ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            )}
                            <SegmentedToggle
                              options={[
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'yearly', label: 'Yearly' },
                              ]}
                              value={monitoringView}
                              onChange={(v) => setMonitoringView(v as 'monthly' | 'yearly')}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentInsight({
                                  title: 'Monitoring Status Overview',
                                  insights: generateMonitoringInsights(monitoringView, monitoringView === 'monthly' ? monitoringMonthYear : undefined),
                                  view: monitoringView
                                });
                                setShowInsightModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              Insights
                            </button>
                          </div>
                        }
                      >
                        <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.mutedSlate }} />
                            Total
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                            Healthy
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                            Needs Support
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.danger }} />
                            Damaged
                          </span>
                        </div>

                        {(() => {
                          let chartData: any[] = [];

                          if (monitoringView === 'yearly') {
                            const yearlyMonitoring = (dashboardData.production as any).yearlyMonitoring || {};
                            const yearlyHealthy = (dashboardData.production as any).yearlyHealthy || {};
                            const yearlyNeedsSupport = (dashboardData.production as any).yearlyNeedsSupport || {};
                            const yearlyDamaged = (dashboardData.production as any).yearlyDamaged || {};

                            const years = Array.from(new Set([
                              new Date().getFullYear(),
                              ...Object.keys(yearlyMonitoring || {}).map(Number),
                              ...Object.keys((dashboardData.production as any).monitoringStatsByYear || {}).map(Number)
                            ])).filter(y => y > 2000).sort((a, b) => a - b);

                            chartData = years.map(year => ({
                              period: year.toString(),
                              total: yearlyMonitoring[year] || 0,
                              healthy: yearlyHealthy[year] || 0,
                              needsSupport: yearlyNeedsSupport[year] || 0,
                              damaged: yearlyDamaged[year] || 0
                            }));
                          } else {
                            const stats = ((dashboardData.production as any).monitoringStatsByYear)?.[monitoringMonthYear] || {
                              total: new Array(12).fill(0),
                              healthy: new Array(12).fill(0),
                              needsSupport: new Array(12).fill(0),
                              damaged: new Array(12).fill(0)
                            };
                            const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            chartData = labels.map((label, i) => ({
                              period: label,
                              total: stats.total[i],
                              healthy: stats.healthy[i],
                              needsSupport: stats.needsSupport[i],
                              damaged: stats.damaged[i]
                            }));
                          }

                          return (
                            <div className="overflow-x-auto">
                              <div style={{ minWidth: monitoringView === 'monthly' ? '640px' : '100%', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={360}>
                                  <RechartsBarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                                    barGap={4}
                                    barCategoryGap={chartData.length < 5 ? '30%' : '18%'}
                                  >
                                    <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                    <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={8} />
                                    <YAxis {...EDITORIAL_CHART.yAxisProps} />
                                    <Tooltip
                                      contentStyle={EDITORIAL_CHART.tooltipStyle}
                                      cursor={{ fill: '#F9FAFB' }}
                                      formatter={(value: any) => Math.round(Number(value)).toLocaleString()}
                                    />
                                    <Bar dataKey="total" fill={EDITORIAL_CHART.colors.mutedSlate} name="Total Monitoring" radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 32 : 16} />
                                    <Bar dataKey="healthy" fill={EDITORIAL_CHART.colors.emerald} name="Healthy Farms" radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 32 : 16} />
                                    <Bar dataKey="needsSupport" fill={EDITORIAL_CHART.colors.amber} name="Needs Support" radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 32 : 16} />
                                    <Bar dataKey="damaged" fill={EDITORIAL_CHART.colors.danger} name="Damaged Farms" radius={[4, 4, 0, 0]} barSize={chartData.length < 5 ? 32 : 16} />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })()}
                      </EditorialCard>
                    </div>
                  </div>
                )}

                {/* Sales & Delivery Reports Section */}
                {dashboardSection === 'reports' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="font-serif text-xl font-bold text-gray-900">Delivery Tracking Analytics</h2>

                      <KpiStrip
                        columns={4}
                        items={[
                          { label: 'Total Deliveries', value: dashboardData.deliveries.totalDeliveries.toLocaleString(), subtext: 'Overall delivery records' },
                          { label: 'Abaca Delivered', value: `${dashboardData.deliveries.deliveredFiberKg.toLocaleString()} kg`, subtext: 'Successfully delivered' },
                          { label: 'Cancelled Deliveries', value: (dashboardData.deliveries.cancelled || 0).toLocaleString(), subtext: 'Cancelled records' },
                          {
                            label: 'Completion Rate',
                            value: `${(((dashboardData.deliveries.completed || 0) + (dashboardData.deliveries.delivered || 0)) / (dashboardData.deliveries.totalDeliveries || 1) * 100).toFixed(0)}%`,
                            subtext: `${dashboardData.deliveries.cancelled || 0} cancelled`,
                          },
                        ]}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <EditorialCard
                          title="Delivery Status"
                          subtitle="Breakdown by completion status"
                          className="flex flex-col h-full"
                          bodyClassName="flex-1 flex flex-col justify-center"
                          actions={
                            <div className="flex items-center gap-1.5">
                              {deliveryStatusView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                                  value={selectedMonth}
                                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                  aria-label="Delivery month"
                                >
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                                    <option key={month} value={i}>{month}</option>
                                  ))}
                                </select>
                              )}
                              <select
                                className="text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold"
                                value={deliveryMonthYear}
                                onChange={(e) => setDeliveryMonthYear(parseInt(e.target.value))}
                                aria-label="Delivery status year"
                              >
                                {Array.from(new Set([
                                  new Date().getFullYear(),
                                  ...Object.keys(dashboardData.deliveries.rawDeliveries || {}).map(d => new Date((dashboardData.deliveries.rawDeliveries as any)[d].created_at).getFullYear())
                                ])).sort((a, b) => b - a).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          }
                        >
                          {(() => {
                            const rawDeliveries = dashboardData.deliveries.rawDeliveries || [];
                            const filteredDeliveries = rawDeliveries.filter((d: any) => {
                              const deliveryDate = new Date(d.created_at || d.delivery_date);
                              if (deliveryStatusView === 'monthly') {
                                return deliveryDate.getMonth() === selectedMonth && deliveryDate.getFullYear() === deliveryMonthYear;
                              }
                              return deliveryDate.getFullYear() === deliveryMonthYear;
                            });

                            const completed = filteredDeliveries.filter((d: any) => d.status === 'Completed').length;
                            const cancelled = filteredDeliveries.filter((d: any) => d.status === 'Cancelled').length;
                            const total = completed + cancelled;

                            const chartData = [
                              { name: 'Completed', value: completed, fill: EDITORIAL_CHART.colors.emerald, percentage: total > 0 ? (completed / total) * 100 : 0 },
                              { name: 'Cancelled', value: cancelled, fill: EDITORIAL_CHART.colors.danger, percentage: total > 0 ? (cancelled / total) * 100 : 0 }
                            ];

                            if (total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                  <Activity className="w-10 h-10 text-gray-300 mb-2" />
                                  <p className="text-sm font-medium text-gray-500">No delivery data</p>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col items-center">
                                <AnimatedPieChart
                                  data={chartData}
                                  centerLabel={total.toLocaleString()}
                                  centerSubLabel="Total Deliveries"
                                />
                                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                  {chartData.map((item, idx) => (
                                    <div key={idx} className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                        <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                      </div>
                                      <div className="flex items-baseline justify-between">
                                        <span className="text-lg font-bold text-gray-900 tabular-nums">{item.value.toLocaleString()}</span>
                                        <span className="text-xs text-gray-500 tabular-nums">{item.percentage.toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </EditorialCard>

                        <EditorialCard
                          className="lg:col-span-2 flex flex-col"
                          title="Delivery Analytics"
                          subtitle="Fiber quantity (kg) by grade over time"
                          actions={
                            <div className="flex flex-wrap items-center gap-2">
                              {deliveryView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                                  value={deliveryMonthYear}
                                  onChange={(e) => setDeliveryMonthYear(parseInt(e.target.value))}
                                  aria-label="Delivery analytics year"
                                >
                                  {Array.from(new Set([
                                    new Date().getFullYear(),
                                    ...(dashboardData.deliveries?.rawDeliveries || []).map((d: any) => new Date(d.created_at || d.delivery_date).getFullYear())
                                  ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              )}
                              <SegmentedToggle
                                options={[
                                  { value: 'monthly', label: 'Monthly' },
                                  { value: 'yearly', label: 'Yearly' },
                                ]}
                                value={deliveryView}
                                onChange={(v) => setDeliveryView(v as 'monthly' | 'yearly')}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentInsight({
                                    title: 'Delivery Analytics',
                                    insights: generateDeliveryInsights(deliveryView, deliveryView === 'monthly' ? deliveryMonthYear : undefined),
                                    view: deliveryView
                                  });
                                  setShowInsightModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-500" />
                                Insights
                              </button>
                            </div>
                          }
                        >
                          <div className="flex flex-wrap items-center justify-end gap-4 text-xs text-gray-600 mb-4">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.emerald }} />
                              Class A
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.amber }} />
                              Class B
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EDITORIAL_CHART.colors.espresso }} />
                              Class C
                            </span>
                          </div>

                          {(() => {
                            const currentYear = new Date().getFullYear();
                            let chartData: any[] = [];
                            const rawDists = dashboardData.deliveries?.rawDeliveries || [];

                            if (deliveryView === 'monthly') {
                              const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              const monthlyA = new Array(12).fill(0);
                              const monthlyB = new Array(12).fill(0);
                              const monthlyC = new Array(12).fill(0);

                              rawDists.forEach((d: any) => {
                                const date = new Date(d.created_at || d.delivery_date);
                                if (date.getFullYear() === deliveryMonthYear) {
                                  const month = date.getMonth();
                                  const qty = parseFloat(d.quantity_kg || 0);
                                  if (d.grade === 'Class A') monthlyA[month] += qty;
                                  else if (d.grade === 'Class B') monthlyB[month] += qty;
                                  else if (d.grade === 'Class C') monthlyC[month] += qty;
                                }
                              });

                              chartData = labels.map((label, i) => ({
                                period: label,
                                classA: monthlyA[i],
                                classB: monthlyB[i],
                                classC: monthlyC[i]
                              }));
                            } else {
                              const years = Array.from(new Set([
                                currentYear,
                                ...rawDists.map((d: any) => new Date(d.created_at || d.delivery_date).getFullYear())
                              ])).sort((a, b) => a - b);

                              chartData = years.map(year => {
                                const yearDeliveries = rawDists.filter((d: any) => new Date(d.created_at || d.delivery_date).getFullYear() === year);
                                return {
                                  period: year.toString(),
                                  classA: yearDeliveries.filter((d: any) => d.grade === 'Class A').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
                                  classB: yearDeliveries.filter((d: any) => d.grade === 'Class B').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0),
                                  classC: yearDeliveries.filter((d: any) => d.grade === 'Class C').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0)
                                };
                              });
                            }

                            return (
                              <div className="overflow-x-auto">
                                <div style={{ minWidth: deliveryView === 'monthly' ? '640px' : '100%', width: '100%' }}>
                                  <ResponsiveContainer width="100%" height={360}>
                                    <RechartsBarChart
                                      data={chartData}
                                      margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                                      barGap={6}
                                      barCategoryGap={chartData.length < 5 ? '30%' : '18%'}
                                    >
                                      <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                      <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={8} />
                                      <YAxis {...EDITORIAL_CHART.yAxisProps} />
                                      <Tooltip
                                        contentStyle={EDITORIAL_CHART.tooltipStyle}
                                        cursor={{ fill: '#F9FAFB' }}
                                        formatter={(value: any) => `${Math.round(Number(value))} kg`}
                                      />
                                      <Bar dataKey="classA" name="Class A" fill={EDITORIAL_CHART.colors.emerald} radius={[4, 4, 0, 0]} barSize={deliveryView === 'monthly' ? 20 : 38} />
                                      <Bar dataKey="classB" name="Class B" fill={EDITORIAL_CHART.colors.amber} radius={[4, 4, 0, 0]} barSize={deliveryView === 'monthly' ? 20 : 38} />
                                      <Bar dataKey="classC" name="Class C" fill={EDITORIAL_CHART.colors.espresso} radius={[4, 4, 0, 0]} barSize={deliveryView === 'monthly' ? 20 : 38} />
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            );
                          })()}
                        </EditorialCard>
                      </div>
                    </div>

                    {/* Sales Report Section */}
                    <div className="space-y-4">
                      <h2 className="font-serif text-xl font-bold text-gray-900">Sales Analytics</h2>

                      <KpiStrip
                        columns={4}
                        items={[
                          { label: 'Total Sales', value: `₱${(dashboardData.sales?.totalAmount || 0).toLocaleString()}`, subtext: 'Approved revenue' },
                          { label: 'Active Farmers', value: (dashboardData.users.totalFarmers || 0).toLocaleString(), subtext: 'Registered farmers' },
                          { label: 'Abaca Sold', value: `${(dashboardData.sales?.totalKgSold || 0).toLocaleString()} kg`, subtext: 'Total fiber sold' },
                          { label: 'Transactions', value: (dashboardData.sales?.recentSales?.length || 0).toLocaleString(), subtext: 'Recent sales records' },
                        ]}
                      />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <EditorialCard
                          title="Sales Status"
                          subtitle="Approval status distribution"
                          className="flex flex-col h-full"
                          bodyClassName="flex-1 flex flex-col justify-center"
                        >
                          {(() => {
                            const approved = dashboardData.sales?.totalAmount || 0;
                            const pending = dashboardData.sales?.pendingAmount || 0;
                            const total = approved + pending;

                            const chartData = [
                              { name: 'Approved', value: approved, fill: EDITORIAL_CHART.colors.emerald, percentage: total > 0 ? (approved / total) * 100 : 0 },
                              { name: 'Pending', value: pending, fill: EDITORIAL_CHART.colors.amber, percentage: total > 0 ? (pending / total) * 100 : 0 }
                            ];

                            if (total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                  <Activity className="w-10 h-10 text-gray-300 mb-2" />
                                  <p className="text-sm font-medium text-gray-500">No sales data</p>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col items-center">
                                <AnimatedPieChart
                                  data={chartData}
                                  centerLabel={`₱${total.toLocaleString()}`}
                                  centerSubLabel="Total Sales Amount"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                                  {chartData.map((item, idx) => (
                                    <div key={idx} className="p-3.5 bg-[#F8F9FA] rounded-xl border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                          <span className="text-xs font-medium text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 tabular-nums">{item.percentage.toFixed(0)}%</span>
                                      </div>
                                      <p className="text-base font-bold text-gray-900 tabular-nums">
                                        ₱{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </EditorialCard>

                        <EditorialCard
                          className="lg:col-span-2 flex flex-col"
                          title="Sales Performance Analytics"
                          subtitle="Fiber sales (₱) by Class A, B, and C"
                          actions={
                            <div className="flex flex-wrap items-center gap-2">
                              {abacaSoldView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857]"
                                  value={salesMonthYear}
                                  onChange={(e) => setSalesMonthYear(parseInt(e.target.value))}
                                  aria-label="Sales analytics year"
                                >
                                  {Array.from(new Set([
                                    new Date().getFullYear(),
                                    ...(dashboardData.sales?.allSales || dashboardData.sales?.recentSales || []).map((s: any) => new Date(s.sale_date).getFullYear()),
                                    ...(dashboardData.deliveries?.rawDeliveries || []).filter((d: any) => d.status === 'Completed' || d.status === 'Delivered').map((d: any) => new Date(d.delivery_date).getFullYear())
                                  ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              )}
                              <SegmentedToggle
                                options={[
                                  { value: 'monthly', label: 'Monthly' },
                                  { value: 'yearly', label: 'Yearly' },
                                ]}
                                value={abacaSoldView}
                                onChange={(v) => {
                                  const mode = v as 'monthly' | 'yearly';
                                  setAbacaSoldView(mode);
                                  setSalesChartView(mode);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentInsight({
                                    title: 'Sales Performance Analytics',
                                    insights: generateSalesPerformanceInsights(salesChartView, salesChartView === 'monthly' ? salesMonthYear : undefined),
                                    view: salesChartView
                                  });
                                  setShowInsightModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-500" />
                                Insights
                              </button>
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

                          {(() => {
                            const allSales = [
                              ...(dashboardData.sales?.allSales || dashboardData.sales?.recentSales || []),
                              ...(dashboardData.deliveries?.rawDeliveries?.filter((d: any) => d.status === 'Completed' || d.status === 'Delivered') || []).map((d: any) => ({
                                ...d,
                                sale_date: d.delivery_date,
                                total_amount: parseFloat(d.total_amount || 0),
                                abaca_type: d.grade || d.fiber_class
                              }))
                            ];
                            const currentYear = new Date().getFullYear();
                            let chartData: any[] = [];

                            if (abacaSoldView === 'monthly') {
                              const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              const salesA = Array(12).fill(0);
                              const salesB = Array(12).fill(0);
                              const salesC = Array(12).fill(0);

                              allSales.forEach((sale: any) => {
                                const saleDate = new Date(sale.sale_date);
                                if (saleDate.getFullYear() === salesMonthYear) {
                                  const month = saleDate.getMonth();
                                  const amount = (sale.total_amount || 0);
                                  const ft = (sale.abaca_type || sale.grade || sale.fiber_class || '').toLowerCase();
                                  if (ft.match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1|superior/i)) salesA[month] += amount;
                                  else if (ft.match(/\bb\b|class[-_\s]*b|grade[-_\s]*b|fiber[-_\s]*b|grade\s*2/i)) salesB[month] += amount;
                                  else if (ft.match(/\bc\b|class[-_\s]*c|grade[-_\s]*c|fiber[-_\s]*c|grade\s*3/i)) salesC[month] += amount;
                                }
                              });

                              chartData = labels.map((l, i) => ({
                                period: l,
                                salesA: salesA[i],
                                salesB: salesB[i],
                                salesC: salesC[i]
                              }));
                            } else {
                              const years = Array.from(new Set([
                                currentYear,
                                ...allSales.map((s: any) => new Date(s.sale_date).getFullYear())
                              ])).filter(y => y > 2020 && !isNaN(y)).sort((a, b) => a - b);

                              const salesA = Array(years.length).fill(0);
                              const salesB = Array(years.length).fill(0);
                              const salesC = Array(years.length).fill(0);

                              allSales.forEach((sale: any) => {
                                const saleDate = new Date(sale.sale_date);
                                const yearIdx = years.indexOf(saleDate.getFullYear());
                                if (yearIdx !== -1) {
                                  const amount = (sale.total_amount || 0);
                                  const ft = (sale.abaca_type || sale.grade || sale.fiber_class || '').toLowerCase();
                                  if (ft.match(/\ba\b|class[-_\s]*a|grade[-_\s]*a|fiber[-_\s]*a|grade\s*1|superior/i)) salesA[yearIdx] += amount;
                                  else if (ft.match(/\bb\b|class[-_\s]*b|grade[-_\s]*b|fiber[-_\s]*b|grade\s*2/i)) salesB[yearIdx] += amount;
                                  else if (ft.match(/\bc\b|class[-_\s]*c|grade[-_\s]*c|fiber[-_\s]*c|grade\s*3/i)) salesC[yearIdx] += amount;
                                }
                              });

                              chartData = years.map((y, i) => ({
                                period: y.toString(),
                                salesA: salesA[i],
                                salesB: salesB[i],
                                salesC: salesC[i]
                              }));
                            }

                            return (
                              <div className="overflow-x-auto">
                                <div style={{ minWidth: abacaSoldView === 'monthly' ? '640px' : '100%', width: '100%' }}>
                                  <ResponsiveContainer width="100%" height={360}>
                                    <RechartsBarChart
                                      data={chartData}
                                      margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                                      barGap={6}
                                      barCategoryGap={chartData.length < 5 ? '30%' : '18%'}
                                    >
                                      <CartesianGrid {...EDITORIAL_CHART.gridProps} />
                                      <XAxis dataKey="period" {...EDITORIAL_CHART.xAxisProps} dy={8} />
                                      <YAxis
                                        {...EDITORIAL_CHART.yAxisProps}
                                        tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                                      />
                                      <Tooltip
                                        contentStyle={EDITORIAL_CHART.tooltipStyle}
                                        cursor={{ fill: '#F9FAFB' }}
                                        formatter={(value: any) => `₱${Math.round(Number(value)).toLocaleString()}`}
                                      />
                                      <Bar name="Class A" dataKey="salesA" fill={EDITORIAL_CHART.colors.amber} radius={[4, 4, 0, 0]} barSize={abacaSoldView === 'monthly' ? 20 : 38} />
                                      <Bar name="Class B" dataKey="salesB" fill={EDITORIAL_CHART.colors.emerald} radius={[4, 4, 0, 0]} barSize={abacaSoldView === 'monthly' ? 20 : 38} />
                                      <Bar name="Class C" dataKey="salesC" fill={EDITORIAL_CHART.colors.espresso} radius={[4, 4, 0, 0]} barSize={abacaSoldView === 'monthly' ? 20 : 38} />
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            );
                          })()}
                        </EditorialCard>
                      </div>

                      <EditorialCard
                        title="Recent Sales Transactions"
                        subtitle="Detailed log of approved fiber sales"
                        badge={(dashboardData.sales?.recentSales || []).length}
                        noPadding
                      >
                        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Recent sales transactions">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Farmer</th>
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Buyer</th>
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Amount</th>
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Quantity</th>
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Status</th>
                                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {(dashboardData.sales?.recentSales || []).map((sale: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="py-4 px-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs">
                                        {sale.farmer_name?.charAt(0) || 'F'}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900">{sale.farmer_name || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-5 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{sale.buyer_company_name || sale.buyer_name || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">Verified Buyer</div>
                                  </td>
                                  <td className="py-4 px-5 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900 tabular-nums">₱{sale.total_amount?.toLocaleString() || '0'}</div>
                                    <div className="text-xs text-gray-500">Total gross</div>
                                  </td>
                                  <td className="py-4 px-5 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                                    {sale.quantity_sold || 0} kg
                                  </td>
                                  <td className="py-4 px-5 whitespace-nowrap">
                                    <StatusPill tone="success">Approved</StatusPill>
                                  </td>
                                  <td className="py-4 px-5 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(sale.sale_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </EditorialCard>
                    </div>
                  </div>
                )}

                {dashboardSection === 'users' && (
                  <UserAnalyticsDashboard key={version} />
                )}
              </>
            )}
          </div>
      </EditorialShell>

      {showProfileModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#EAF6F0] rounded-xl text-[#047857]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Profile' : 'My Profile'}
                  </h2>
                  <p className="text-gray-500 text-xs">Manage your account information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditMode(false);
                }}
                className="text-gray-500 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 bg-white overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {loadingProfile ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center pb-6 border-b border-gray-200">
                    <div className="relative">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-28 h-28 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-3xl font-bold">
                          {user?.fullName?.charAt(0) || 'A'}
                        </div>
                      )}
                      {isEditMode && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border border-gray-200">
                          <label className="cursor-pointer bg-[#047857] hover:bg-[#065F46] text-white p-2 rounded-full transition-colors flex items-center justify-center">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={_handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-bold text-gray-900 mt-3">{editFormData.full_name || user?.fullName || 'MAO Coordinator'}</h3>
                    <p className="text-xs text-[#047857] font-semibold mt-0.5">{editFormData.position || 'Municipal Agriculture Officer'}</p>
                    {uploadingPhoto && (
                      <p className="text-xs text-[#047857] mt-2 flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#047857]"></span>
                        Uploading photo...
                      </p>
                    )}
                  </div>

                  {/* Profile Information Section */}
                  <div>
                    <h4 className="font-serif text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#047857]" />
                      Personal & Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={editFormData.full_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-gray-50 disabled:text-gray-600 text-sm outline-none"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          disabled={true}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Position / Role</label>
                        <input
                          type="text"
                          value={editFormData.position || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-gray-50 disabled:text-gray-600 text-sm outline-none"
                          placeholder="e.g., Municipal Agriculturist"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organization</label>
                        <input
                          type="text"
                          value={editFormData.association_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, association_name: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-gray-50 disabled:text-gray-600 text-sm outline-none"
                          placeholder="e.g., Municipal Agriculture Office"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Number</label>
                        <input
                          type="tel"
                          value={editFormData.contact_number || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-gray-50 disabled:text-gray-600 text-sm outline-none"
                          placeholder="e.g., 09171234567"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Complete Address</label>
                        <textarea
                          value={editFormData.address || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          disabled={!isEditMode}
                          rows={3}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] disabled:bg-gray-50 disabled:text-gray-600 text-sm resize-none outline-none"
                          placeholder="Enter your complete address (Purok, Barangay, Municipality)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-5 border-t border-gray-200">
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => setShowChangePasswordModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-xl hover:bg-[#FDE68A]/70 transition-colors text-xs font-semibold"
                      >
                        <Lock className="w-4 h-4" />
                        Change Password
                      </button>
                    )}
                    <div className="flex gap-2.5 ml-auto">
                      {isEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditMode(false);
                              fetchOfficerProfile();
                            }}
                            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={_handleSaveProfile}
                            disabled={savingProfile}
                            className="px-5 py-2 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditMode(true)}
                          className="px-5 py-2 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] transition-colors text-sm font-semibold"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-gray-900">
                <Lock className="w-4 h-4 text-[#92400E]" />
                <h3 className="font-serif text-lg font-bold">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="text-gray-500 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={_handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none pr-11 text-sm"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={4}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none pr-11 text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={4}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none pr-11 text-sm"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2.5 bg-[#047857] text-white rounded-xl text-sm font-semibold hover:bg-[#065F46] transition-colors disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insight Modal */}
      {currentInsight && (
        <InsightModal
          isOpen={showInsightModal}
          onClose={() => {
            setShowInsightModal(false);
            setCurrentInsight(null);
          }}
          title={currentInsight.title}
          insights={currentInsight.insights}
          view={currentInsight.view}
        />
      )}
    </>
  );
};

export default MAODashboard;