import React, { useState, useEffect } from 'react';
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
import MaintenanceToggle from './MaintenanceToggle';
import AssociationSeedlingManagement from './AssociationSeedlingManagement';
import PlantedSeedlings from './PlantedSeedlings';
import MonitoringPage from '../../pages/MonitoringPage';
import ArticleManagement from './ArticleManagement';
import TeamManagement from './TeamManagement';
import MAOHarvestVerificationPage from '../../pages/MAOHarvestVerificationPage';
import UnifiedSalesManagement from './UnifiedSalesManagement';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';
import DeliveryTrackingMonitor from './DeliveryTrackingMonitor';
import ActivityLogsManagement from './ActivityLogsManagement';
import UserAnalyticsDashboard from './UserAnalyticsDashboard';
import SalesAnalyticsDashboard from './SalesAnalyticsDashboard';


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
    monthlyStatsByYear: { [year: number]: { received: number[], distributed: number[], harvested: number[] } };
    yearlyReceived: { [year: number]: number };
    yearlyDistributed: { [year: number]: number };
    yearlyHarvest: { [year: number]: number };
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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'officers' | 'maintenance' | 'seedlings' | 'seedlings-overview' | 'monitoring' | 'content' | 'harvests' | 'sales-analytics' | 'sales-performance' | 'buyer-prices' | 'delivery-tracking' | 'activity-logs'>('dashboard');
  const [contentTab, setContentTab] = useState<'articles' | 'team'>('articles');
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/auth/me`, {
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

      const response = await fetch(`https://easyabaca-api.vercel.app/api/mao/complete-profile`, {
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
        const response = await fetch(`https://easyabaca-api.vercel.app/api/mao/complete-profile`, {
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
      const response = await fetch(`https://easyabaca-api.vercel.app/api/auth/change-password`, {
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

  // Modern Stats Card Component - Premium Design
  const StatsCard: React.FC<{
    title: string;
    value: string | number;
    subValue: string | React.ReactNode;
    icon: React.ReactNode;
    gradient: string;
    unit?: string;
  }> = ({ title, value, subValue, icon, gradient, unit }) => (
    <div className={`group relative bg-gradient-to-br ${gradient} rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-all">
            {icon}
          </div>
          <Activity size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">{title}</h3>
        <p className="text-3xl md:text-4xl font-black mb-1 drop-shadow-sm">
          {value} {unit && <span className="text-xl md:text-2xl font-bold opacity-80">{unit}</span>}
        </p>
        <div className="flex items-center gap-2 text-xs opacity-80 mt-1 font-medium">
          <Clock size={12} />
          <span>{subValue}</span>
        </div>
      </div>
    </div>
  );

  // Modern Animated Pie Chart Component - Same as Buyer Dashboard
  const AnimatedPieChart: React.FC<{
    data: { name: string; value: number; fill: string; percentage: number }[],
    centerLabel?: string,
    centerSubLabel?: string
  }> = ({ data, centerLabel, centerSubLabel }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    let currentAngle = -90;

    // Filter out items with 0 value to avoid display issues
    const validData = data.filter(item => item.value > 0);
    const total = validData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="relative w-full h-80 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-64 h-64 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))' }}>
          <defs>
            {validData.map((item, idx) => (
              <linearGradient key={`grad-${idx}`} id={`pie-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={item.fill} />
                <stop offset="100%" stopColor={`${item.fill}dd`} />
              </linearGradient>
            ))}
            <filter id="shadow-pie" x="-50%" y="-50%" width="200%" height="200%">
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
            <radialGradient id="gradient-center">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </radialGradient>
          </defs>

          {validData.length === 1 ? (
            // Full Circle special case
            <circle
              cx="120"
              cy="120"
              r={hoveredIndex === 0 ? 95 : 90}
              fill="url(#pie-grad-0)"
              filter="url(#shadow-pie)"
              onMouseEnter={() => setHoveredIndex(0)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-500 ease-out"
              style={{ transformOrigin: '120px 120px' }}
            />
          ) : (
            validData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              const midAngle = (startAngle + endAngle) / 2;
              currentAngle = endAngle;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const midRad = (midAngle * Math.PI) / 180;

              const radius = hoveredIndex === index ? 95 : 90;
              const x1 = 120 + radius * Math.cos(startRad);
              const y1 = 120 + radius * Math.sin(startRad);
              const x2 = 120 + radius * Math.cos(endRad);
              const y2 = 120 + radius * Math.sin(endRad);

              const labelRadius = 68;
              const labelX = 120 + labelRadius * Math.cos(midRad);
              const labelY = 120 + labelRadius * Math.sin(midRad);

              const largeArc = angle > 180 ? 1 : 0;

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer outline-none"
                >
                  <path
                    d={`M 120 120 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={`url(#pie-grad-${index})`}
                    filter="url(#shadow-pie)"
                    className="transition-all duration-500 ease-out"
                    style={{
                      transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: '120px 120px',
                      opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.7
                    }}
                  />
                  {percentage > 10 && (
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[10px] font-bold fill-white"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                    >
                      {percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Inner Circle for Donut Effect */}
          <circle cx="120" cy="120" r="58" fill="white" />
          <circle cx="120" cy="120" r="55" fill="url(#gradient-center)" className="shadow-inner" />
        </svg>

        {/* Center Label */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[100px] flex flex-col items-center justify-center">
          {hoveredIndex !== null && validData[hoveredIndex] ? (
            <>
              <p className="text-2xl font-black text-gray-900 leading-none">
                {((validData[hoveredIndex].value / total) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-1 break-words w-full">
                {validData[hoveredIndex].name}
              </p>
            </>
          ) : (
            <>
              <p className={`${(centerLabel?.length || 0) > 12 ? 'text-base' : (centerLabel?.length || 0) > 8 ? 'text-lg' : 'text-xl'} font-black text-gray-800 leading-tight mb-0.5 px-1`}>
                {centerLabel}
              </p>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight leading-tight break-words w-full">{centerSubLabel}</p>
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
      const productionRes = await fetch('https://easyabaca-api.vercel.app/api/admin/production-report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productionData = await productionRes.json();

      // Fetch sales data
      const salesRes = await fetch('https://easyabaca-api.vercel.app/api/admin/sales-report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const salesData = await salesRes.json();

      // Fetch users data
      const usersRes = await fetch('https://easyabaca-api.vercel.app/api/admin/users-report', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      // Fetch delivery data
      const deliveriesRes = await fetch('https://easyabaca-api.vercel.app/api/fiber-deliveries/all', {
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
      const monthlyStatsByYear: { [year: number]: { received: number[], distributed: number[], harvested: number[] } } = {};
      const yearlyReceived: { [year: number]: number } = {};
      const yearlyDistributed: { [year: number]: number } = {};
      const yearlyHarvest: { [year: number]: number } = {};

      const ensureYearInStats = (year: number) => {
        if (!monthlyStatsByYear[year]) {
          monthlyStatsByYear[year] = {
            received: new Array(12).fill(0),
            distributed: new Array(12).fill(0),
            harvested: new Array(12).fill(0)
          };
        }
        if (!yearlyReceived[year]) yearlyReceived[year] = 0;
        if (!yearlyDistributed[year]) yearlyDistributed[year] = 0;
        if (!yearlyHarvest[year]) yearlyHarvest[year] = 0;
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
        const associationDistRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/mao/associations', {
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
          const farmerDistRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/cusafa/all-distributions', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (farmerDistRes.ok) {
            const farmerDistData = await farmerDistRes.json();

            // Process farmer distributions (Distributed to farmers)
            const farmerDists = farmerDistData.farmer_distributions || [];
            console.log('🚜 Processing farmer distributions (Distributed):', farmerDists.length, 'records');

            farmerDists.forEach((dist: any) => {
              const dateStr = dist.date_distributed || dist.created_at;
              if (!dateStr) return;
              const date = new Date(dateStr);
              const year = date.getFullYear();
              const monthIndex = date.getMonth();
              const quantity = parseInt(dist.quantity_distributed || 0);

              ensureYearInStats(year);
              monthlyStatsByYear[year].distributed[monthIndex] += quantity;
              yearlyDistributed[year] += quantity;
            });
          }
        } catch (err) {
          console.log('Could not fetch distributed data:', err);
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
        const monitoringRes = await fetch('https://easyabaca-api.vercel.app/api/mao/monitoring', {
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
        const harvestsRes = await fetch('https://easyabaca-api.vercel.app/api/admin/harvests/all', {
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
          yearlyMonitoring: yearlyMonitoringData,
          yearlyHealthy: yearlyHealthyData,
          yearlyNeedsSupport: yearlyNeedsSupportData,
          yearlyDamaged: yearlyDamagedData,
          healthyFarms,
          needsSupportFarms,
          damagedFarms,
          totalMonitoringVisits: totalMonitoring || productionData.totalMonitoringVisits,
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

  // Load profile photo and dashboard data on component mount
  useEffect(() => {
    fetchOfficerProfile();
    fetchDashboardData();
    fetchNotifications();
  }, []);

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

      // Create notifications array
      const notifs: any[] = [];

      // Note: Notification fetching is disabled for now
      // Can be re-enabled by implementing proper notification endpoints

      setNotifications(notifs);
      setUnreadCount(0);
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : sidebarOpen ? 'w-64' : 'w-20'}
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        bg-gradient-to-b from-slate-800 to-slate-900 text-white 
        transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        md:relative md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-700">
          <div className={`transition-all duration-300 ease-in-out ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>
            <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">MAO Culiram</h1>
            <p className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
              {isSuperAdmin ? (
                <><Shield className="w-3 h-3" /> Super Admin Panel</>
              ) : (
                <><User className="w-3 h-3" /> Admin Panel</>
              )}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 flex-shrink-0 md:block hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 flex-shrink-0 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'dashboard' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentPage('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'users' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <UserCheck className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>User Management</span>
          </button>

          <button
            onClick={() => setCurrentPage('seedlings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'seedlings' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Sprout className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Seedling Distribution</span>
          </button>

          <button
            onClick={() => setCurrentPage('seedlings-overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'seedlings-overview' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Planted Seedlings</span>
          </button>

          <button
            onClick={() => setCurrentPage('monitoring')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'monitoring' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Field Monitoring</span>
          </button>

          <button
            onClick={() => setCurrentPage('harvests')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'harvests' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Harvest Verification</span>
          </button>

          <button
            onClick={() => setCurrentPage('sales-analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'sales-analytics' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Sales Management</span>
          </button>

          <button
            onClick={() => setCurrentPage('sales-performance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${currentPage === 'sales-performance' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Sales Performance</span>
          </button>

          <button
            onClick={() => setCurrentPage('buyer-prices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'buyer-prices' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Coins className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Buyer Price Listings</span>
          </button>

          <button
            onClick={() => setCurrentPage('delivery-tracking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'delivery-tracking' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Truck className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Delivery Tracking</span>
          </button>

          {/* Content Management - Available to all admins */}
          <button
            onClick={() => setCurrentPage('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'content' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Content Management</span>
          </button>

          {/* Staff Management - Super Admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentPage('officers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'officers' ? 'bg-emerald-600' : 'hover:bg-slate-700'
                } ${!sidebarOpen && 'justify-center'}`}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Staff Management</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setCurrentPage('activity-logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'activity-logs' ? 'bg-emerald-600' : 'hover:bg-slate-700'
                } ${!sidebarOpen && 'justify-center'}`}
            >
              <Activity className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Activity Logs</span>
            </button>
          )}

          {/* Maintenance Mode - Super Admin only */}
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentPage('maintenance')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'maintenance' ? 'bg-emerald-600' : 'hover:bg-slate-700'
                } ${!sidebarOpen && 'justify-center'}`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Maintenance Mode</span>
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600 rounded-lg transition-all duration-200 ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header - Always visible on all pages */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800">
                {currentPage === 'dashboard' ? 'Dashboard' :
                  currentPage === 'users' ? 'User Management' :
                    currentPage === 'seedlings' ? 'Seedling Distribution' :
                      currentPage === 'seedlings-overview' ? 'Planted Seedlings' :
                        currentPage === 'monitoring' ? 'Field Monitoring' :
                          currentPage === 'harvests' ? 'Harvest Management' :
                            currentPage === 'sales-analytics' ? 'Sales Management' :
                              currentPage === 'sales-performance' ? 'Sales Performance Analytics' :
                                currentPage === 'buyer-prices' ? 'Buyer Price Listings' :
                                  currentPage === 'delivery-tracking' ? 'Delivery Tracking Monitor' :
                                    currentPage === 'officers' ? 'Staff Management' :
                                      currentPage === 'activity-logs' ? 'Activity Logs & Security' :
                                        currentPage === 'maintenance' ? 'Maintenance Mode' :
                                          currentPage === 'content' ? 'Content Management' :
                                            'Dashboard'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                Welcome back, {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative mr-2 md:mr-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg transition relative"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  </>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">System Updates</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-white hover:bg-white/20 rounded-lg p-1 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-80">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No new updates</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${notif.color === 'blue' ? 'bg-blue-100' :
                                notif.color === 'green' ? 'bg-green-100' :
                                  notif.color === 'emerald' ? 'bg-emerald-100' :
                                    notif.color === 'teal' ? 'bg-teal-100' :
                                      notif.color === 'amber' ? 'bg-amber-100' :
                                        notif.color === 'purple' ? 'bg-purple-100' :
                                          notif.color === 'indigo' ? 'bg-indigo-100' :
                                            notif.color === 'cyan' ? 'bg-cyan-100' : 'bg-gray-100'
                                }`}>
                                {notif.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-600 mb-1">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notif.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                      <button
                        onClick={() => {
                          setUnreadCount(0);
                          setShowNotifications(false);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-50 rounded-xl p-2 transition-all duration-200"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.fullName || 'Coordinator'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isSuperAdmin ? (
                      <span className="text-amber-600 font-semibold flex items-center gap-1"><Shield className="w-3 h-3" /> Super Admin</span>
                    ) : (
                      <span className="text-blue-600 font-semibold flex items-center gap-1"><User className="w-3 h-3" /> Admin</span>
                    )}
                  </p>
                </div>
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm md:text-base">
                    {user?.fullName?.charAt(0) || 'A'}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setShowProfileModal(true);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(true);
                      setShowProfileModal(true);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        {currentPage === 'users' ? (
          <UserManagement />
        ) : currentPage === 'seedlings' ? (
          <AssociationSeedlingManagement />
        ) : currentPage === 'seedlings-overview' ? (
          <PlantedSeedlings />
        ) : currentPage === 'monitoring' ? (
          <MonitoringPage />
        ) : currentPage === 'harvests' ? (
          <MAOHarvestVerificationPage />
        ) : currentPage === 'sales-analytics' ? (
          <UnifiedSalesManagement />
        ) : currentPage === 'sales-performance' ? (
          <SalesAnalyticsDashboard />
        ) : currentPage === 'buyer-prices' ? (
          <BuyerPriceListingsViewer userRole="mao" />
        ) : currentPage === 'delivery-tracking' ? (
          <DeliveryTrackingMonitor />
        ) : currentPage === 'officers' ? (
          <OfficerManagement />
        ) : currentPage === 'activity-logs' ? (
          <ActivityLogsManagement />
        ) : currentPage === 'maintenance' ? (
          <MaintenanceToggle />
        ) : currentPage === 'content' ? (
          /* Content Management with Tabs */
          <div className="bg-gray-50 min-h-screen">
            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setContentTab('articles')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${contentTab === 'articles'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <BookOpen className="w-5 h-5" />
                  Articles & News
                </button>
                <button
                  onClick={() => setContentTab('team')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${contentTab === 'team'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Users className="w-5 h-5" />
                  Team Members
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {contentTab === 'articles' ? <ArticleManagement /> : <TeamManagement />}
          </div>
        ) : (
          /* Dashboard Content - Simple & Clean Design */
          <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Top Section - Title & Tabs */}
            <div className="mb-4 md:mb-8">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 w-full">
                  <button
                    onClick={() => setDashboardSection('production')}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${dashboardSection === 'production'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Abaca Production
                  </button>
                  <button
                    onClick={() => setDashboardSection('reports')}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${dashboardSection === 'reports'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <span className="hidden sm:inline">Sales & Delivery Reports</span>
                    <span className="sm:hidden">Sales & Delivery</span>
                  </button>
                  <button
                    onClick={() => setDashboardSection('users')}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${dashboardSection === 'users'
                      ? 'text-emerald-600 border-b-2 border-emerald-600'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <span className="hidden lg:inline">Users (MAO/CUSAFA/Farmers/Buyers)</span>
                    <span className="lg:hidden">Users</span>
                  </button>
                </div>
              </div>
            </div>

            {loadingDashboard ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <>
                {/* Abaca Production Section */}
                {dashboardSection === 'production' && (
                  <>
                    {/* 📊 SEEDLING ANALYTICS - Next-Gen Modern Design */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-900">Seedling Analytics</h2>
                        <button
                          onClick={fetchDashboardData}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-medium">Refresh Data</span>
                        </button>
                      </div>

                      {/* Top Stats Cards - Vibrant Gradient Design */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                        <StatsCard
                          title="Received Seedlings (Assoc)"
                          value={(dashboardData.production?.totalSeedlingsReceived || 0).toLocaleString()}
                          subValue="Total seedlings"
                          icon={<Package className="w-6 h-6 text-white" />}
                          gradient="from-orange-500 via-orange-600 to-orange-700"
                        />
                        <StatsCard
                          title="Completely Distributed"
                          value={(dashboardData.production?.totalSeedlingsDistributed || 0).toLocaleString()}
                          subValue="To farmers"
                          icon={<Truck className="w-6 h-6 text-white" />}
                          gradient="from-blue-500 via-blue-600 to-blue-700"
                        />
                        <StatsCard
                          title="Total Monitoring"
                          value={(dashboardData.production?.totalMonitoringVisits || 0).toLocaleString()}
                          subValue="Monitoring records"
                          icon={<Eye className="w-6 h-6 text-white" />}
                          gradient="from-indigo-500 via-indigo-600 to-indigo-700"
                        />
                        <StatsCard
                          title="Planted"
                          value={(dashboardData.production?.totalSeedlingsPlanted || 0).toLocaleString()}
                          subValue="Seedlings planted"
                          icon={<Sprout className="w-6 h-6 text-white" />}
                          gradient="from-purple-500 via-purple-600 to-purple-700"
                        />
                        <StatsCard
                          title="Area Planted"
                          value={(dashboardData.production?.totalAreaPlanted || 0).toLocaleString()}
                          subValue="Total hectares"
                          icon={<BarChart3 className="w-6 h-6 text-white" />}
                          gradient="from-emerald-500 via-emerald-600 to-emerald-700"
                          unit="ha"
                        />
                        <StatsCard
                          title="Harvest Fiber"
                          value={(dashboardData.production?.totalHarvestFiber || 0).toLocaleString()}
                          subValue="Total harvested"
                          icon={<Award className="w-6 h-6 text-white" />}
                          gradient="from-orange-500 via-orange-600 to-orange-700"
                          unit="kg"
                        />
                      </div>

                      {/* Charts Row - Line Chart & Donut Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Seedling Analytics Line Chart - Enhanced */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-10 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-200"></div>
                              <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Seedling Distribution Overview</h3>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">Monthly seedling distribution statistics</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {chartView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  value={seedlingMonthYear}
                                  onChange={(e) => setSeedlingMonthYear(parseInt(e.target.value))}
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
                              <div className="flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100">
                                <button
                                  onClick={() => setChartView('monthly')}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${chartView === 'monthly'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Monthly
                                </button>
                                <button
                                  onClick={() => setChartView('yearly')}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${chartView === 'yearly'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Yearly
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Premium Legend Badges with Icons */}
                          <div className="flex flex-wrap items-center gap-3 mb-8">
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <Package className="w-3.5 h-3.5 text-orange-600" />
                              <span className="text-xs font-black text-orange-700 uppercase tracking-wider">Received (Assoc)</span>
                            </div>
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Completely Distributed</span>
                            </div>
                          </div>

                          <div className="w-full">
                            {(() => {
                              let chartData: any[] = [];
                              const prodData: any = dashboardData.production;

                              if (chartView === 'yearly') {
                                const yearlyReceived = prodData.yearlyReceived || {};
                                const yearlyDistributed = prodData.yearlyDistributed || {};
                                const yearlyHarvest = prodData.yearlyHarvest || {};

                                // Get all unique years from all data sources
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
                                <div className="overflow-x-auto rounded-3xl bg-white/50 backdrop-blur-sm p-4 border border-white/60 shadow-inner">
                                  <div style={{ minWidth: chartView === 'monthly' ? '700px' : '100%', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={420}>
                                      <RechartsBarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                        barGap={6}
                                        barCategoryGap={chartData.length < 5 ? "30%" : "15%"}
                                      >
                                        <defs>
                                          <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#fb923c" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
                                          </linearGradient>
                                          <linearGradient id="distributedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                                        <XAxis
                                          dataKey="period"
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dy={10}
                                        />
                                        <YAxis
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dx={-5}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            backdropFilter: 'blur(10px)',
                                            border: 'none',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            fontWeight: 600
                                          }}
                                          itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                                          cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
                                        />
                                        <Bar
                                          dataKey="received"
                                          name="Received (Assoc)"
                                          fill="url(#receivedGradient)"
                                          radius={[8, 8, 0, 0]}
                                          barSize={chartData.length < 5 ? 60 : 35}
                                        />
                                        <Bar
                                          dataKey="distributed"
                                          name="Completely Distributed"
                                          fill="url(#distributedGradient)"
                                          radius={[8, 8, 0, 0]}
                                          barSize={chartData.length < 5 ? 60 : 35}
                                        />
                                      </RechartsBarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>


                        {/* Production Overview Donut Chart - Clean Design */}
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-black text-gray-900">Production Overview</h3>
                              <p className="text-xs text-gray-500 font-medium italic">Planted Units vs Harvested Kg</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-xl">
                              <TrendingUp className="text-emerald-500" size={24} />
                            </div>
                          </div>

                          {(() => {
                            const totalPlanted = dashboardData.production.totalSeedlingsPlanted || 0;
                            const totalHarvested = dashboardData.production.totalHarvestFiber || 0;
                            const total = totalPlanted + totalHarvested;

                            const chartData = [
                              { name: 'Planted', value: totalPlanted, fill: '#10b981', percentage: total > 0 ? (totalPlanted / total) * 100 : 0 },
                              { name: 'Harvested Total', value: totalHarvested, fill: '#fb923c', percentage: total > 0 ? (totalHarvested / total) * 100 : 0 }
                            ];

                            if (total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                                  <div className="p-6 bg-gray-50 rounded-full mb-4">
                                    <Activity className="w-12 h-12 text-gray-200" />
                                  </div>
                                  <p className="font-semibold text-gray-500">No production data</p>
                                </div>
                              );
                            }

                            return (
                              <div className="flex-1 flex flex-col items-center justify-center p-4">
                                <AnimatedPieChart
                                  data={chartData}
                                  centerLabel={totalHarvested.toLocaleString()}
                                  centerSubLabel="Total Production (kg)"
                                />

                                {/* Custom Legend */}
                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                  {chartData.map((item, idx) => (
                                    <div key={idx} className="flex flex-col p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.name}</span>
                                      </div>
                                      <div className="flex items-end justify-between">
                                        <span className="text-xl font-black text-gray-900">{item.value.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-gray-400 mb-0.5">{item.percentage.toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* FIELD MONITORING - Simple */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Field Monitoring</h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatsCard
                          title="Total Monitoring"
                          value={dashboardData.production.totalMonitoringVisits}
                          subValue="Monitoring records"
                          icon={<Activity className="w-6 h-6 text-white" />}
                          gradient="from-slate-500 via-slate-600 to-slate-700"
                        />
                        <StatsCard
                          title="Healthy Farms"
                          value={dashboardData.production.healthyFarms}
                          subValue="In good condition"
                          icon={<Sprout className="w-6 h-6 text-white" />}
                          gradient="from-emerald-500 via-emerald-600 to-emerald-700"
                        />
                        <StatsCard
                          title="Needs Support"
                          value={dashboardData.production.needsSupportFarms}
                          subValue="Requires attention"
                          icon={<AlertCircle className="w-6 h-6 text-white" />}
                          gradient="from-amber-500 via-amber-600 to-amber-700"
                        />
                        <StatsCard
                          title="Damaged Farms"
                          value={dashboardData.production.damagedFarms}
                          subValue="Critical condition"
                          icon={<X className="w-6 h-6 text-white" />}
                          gradient="from-red-500 via-red-600 to-red-700"
                        />
                      </div>

                      {/* Monitoring Bar Chart - Enhanced Modern Design */}
                      <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-xl p-6 sm:p-8 border border-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Monitoring Status Overview</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 ml-6 font-medium">Track farm health and monitoring visits</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {monitoringView === 'monthly' && (
                              <select
                                className="text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={monitoringMonthYear}
                                onChange={(e) => setMonitoringMonthYear(parseInt(e.target.value))}
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
                            <div className="flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-200">
                              <button
                                onClick={() => setMonitoringView('monthly')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${monitoringView === 'monthly'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }`}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setMonitoringView('yearly')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${monitoringView === 'yearly'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                  }`}
                              >
                                Yearly
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Legend Badges with Icons */}
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                          <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md group-hover:scale-110 transition-transform"></div>
                            <Activity className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-black text-blue-700">Total</span>
                          </div>
                          <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md group-hover:scale-110 transition-transform"></div>
                            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-700">Healthy</span>
                          </div>
                          <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md group-hover:scale-110 transition-transform"></div>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-black text-amber-700">Needs Support</span>
                          </div>
                          <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl border border-red-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md group-hover:scale-110 transition-transform"></div>
                            <X className="w-3.5 h-3.5 text-red-600" />
                            <span className="text-xs font-black text-red-700">Damaged</span>
                          </div>
                        </div>

                        <div className="w-full">
                          {(() => {
                            let chartData: any[] = [];

                            if (monitoringView === 'yearly') {
                              const yearlyMonitoring = (dashboardData.production as any).yearlyMonitoring || {};
                              const yearlyHealthy = (dashboardData.production as any).yearlyHealthy || {};
                              const yearlyNeedsSupport = (dashboardData.production as any).yearlyNeedsSupport || {};
                              const yearlyDamaged = (dashboardData.production as any).yearlyDamaged || {};

                              // Get all unique years from both stats sources
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
                              <div className="overflow-x-auto rounded-xl bg-white/50 backdrop-blur-sm p-4">
                                <div style={{ minWidth: monitoringView === 'monthly' ? '700px' : '100%', width: '100%' }}>
                                  <ResponsiveContainer width="100%" height={420}>
                                    <RechartsBarChart
                                      data={chartData}
                                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                      barGap={6}
                                      barCategoryGap={chartData.length < 5 ? "35%" : "15%"}
                                    >
                                      <defs>
                                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="healthyGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                          <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="supportGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                                        </linearGradient>
                                        <linearGradient id="damagedGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                                      <XAxis
                                        dataKey="period"
                                        stroke="#6b7280"
                                        style={{ fontSize: '13px', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                      />
                                      <YAxis
                                        stroke="#6b7280"
                                        style={{ fontSize: '13px', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-5}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                          border: 'none',
                                          borderRadius: '16px',
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                          padding: '12px 16px',
                                          backdropFilter: 'blur(10px)'
                                        }}
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                                        labelStyle={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}
                                      />

                                      <Bar
                                        dataKey="total"
                                        fill="url(#totalGradient)"
                                        name="Total Monitoring"
                                        radius={[8, 8, 0, 0]}
                                        barSize={chartData.length < 5 ? 55 : 24}
                                        animationDuration={800}
                                      />
                                      <Bar
                                        dataKey="healthy"
                                        fill="url(#healthyGradient)"
                                        name="Healthy Farms"
                                        radius={[8, 8, 0, 0]}
                                        barSize={chartData.length < 5 ? 55 : 24}
                                        animationDuration={1000}
                                      />
                                      <Bar
                                        dataKey="needsSupport"
                                        fill="url(#supportGradient)"
                                        name="Needs Support"
                                        radius={[8, 8, 0, 0]}
                                        barSize={chartData.length < 5 ? 55 : 24}
                                        animationDuration={1200}
                                      />
                                      <Bar
                                        dataKey="damaged"
                                        fill="url(#damagedGradient)"
                                        name="Damaged Farms"
                                        radius={[8, 8, 0, 0]}
                                        barSize={chartData.length < 5 ? 55 : 24}
                                        animationDuration={1400}
                                      />
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Sales & Delivery Reports Section */}
                {dashboardSection === 'reports' && (
                  <div className="space-y-6">
                    {/* Delivery Tracking Analytics Section - Simple */}
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Delivery Tracking Analytics</h2>

                      {/* Top Stats Cards - Delivery Tracking */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatsCard
                          title="Total Deliveries"
                          value={dashboardData.deliveries.totalDeliveries}
                          subValue="records (overall count)"
                          icon={<Package className="w-6 h-6 text-white" />}
                          gradient="from-blue-500 via-blue-600 to-blue-700"
                        />
                        <StatsCard
                          title="Abaca Delivered (kg)"
                          value={dashboardData.deliveries.deliveredFiberKg.toLocaleString()}
                          subValue="Total fiber successfully delivered"
                          icon={<CheckCircle className="w-6 h-6 text-white" />}
                          gradient="from-emerald-500 via-emerald-600 to-emerald-700"
                          unit="kg"
                        />
                        <StatsCard
                          title="Cancelled Deliveries"
                          value={dashboardData.deliveries.cancelled || 0}
                          subValue="total cancelled delivery transactions"
                          icon={<X className="w-6 h-6 text-white" />}
                          gradient="from-red-500 via-red-600 to-red-700"
                        />
                        <StatsCard
                          title="Delivery Completion Rate"
                          value={`${(((dashboardData.deliveries.completed || 0) + (dashboardData.deliveries.delivered || 0)) / (dashboardData.deliveries.totalDeliveries || 1) * 100).toFixed(0)}%`}
                          subValue={
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-white uppercase tracking-tighter text-[10px]">Completion Rate</span>
                              <span className="opacity-80 text-[10px] mt-0.5">{dashboardData.deliveries.cancelled || 0} cancelled records</span>
                            </div>
                          }
                          icon={<TrendingUp className="w-6 h-6 text-white" />}
                          gradient="from-amber-500 via-amber-600 to-amber-700"
                        />
                      </div>

                      {/* Charts Section - Enhanced */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Delivery Status - Modern Recharts Design */}
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-black text-gray-900">Delivery Status</h3>
                              <p className="text-xs text-gray-500 font-medium italic">Breakdown by current status</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {deliveryStatusView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={selectedMonth}
                                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                >
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                                    <option key={month} value={i}>{month}</option>
                                  ))}
                                </select>
                              )}
                              <select
                                className="text-gray-700 bg-gray-100 border-none rounded-lg px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                                value={deliveryMonthYear}
                                onChange={(e) => setDeliveryMonthYear(parseInt(e.target.value))}
                              >
                                {Array.from(new Set([
                                  new Date().getFullYear(),
                                  ...Object.keys(dashboardData.deliveries.rawDeliveries || {}).map(d => new Date((dashboardData.deliveries.rawDeliveries as any)[d].created_at).getFullYear())
                                ])).sort((a, b) => b - a).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                              <div className="p-2 bg-blue-50 rounded-xl">
                                <Truck className="text-blue-500" size={24} />
                              </div>
                            </div>
                          </div>

                          {(() => {
                            const rawDeliveries = dashboardData.deliveries.rawDeliveries || [];
                            const currentYear = new Date().getFullYear();
                            const filteredDeliveries = rawDeliveries.filter((d: any) => {
                              const deliveryDate = new Date(d.created_at || d.delivery_date);
                              if (deliveryStatusView === 'monthly') {
                                return deliveryDate.getMonth() === selectedMonth && deliveryDate.getFullYear() === deliveryMonthYear;
                              } else {
                                return deliveryDate.getFullYear() === deliveryMonthYear;
                              }
                            });

                            const completed = filteredDeliveries.filter((d: any) => d.status === 'Completed').length;
                            const cancelled = filteredDeliveries.filter((d: any) => d.status === 'Cancelled').length;
                            const total = completed + cancelled;

                            const chartData = [
                              { name: 'Completed', value: completed, fill: '#10b981', percentage: total > 0 ? (completed / total) * 100 : 0 },
                              { name: 'Cancelled', value: cancelled, fill: '#ef4444', percentage: total > 0 ? (cancelled / total) * 100 : 0 }
                            ];

                            if (chartData.length === 0 || total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                                  <div className="p-6 bg-gray-50 rounded-full mb-4">
                                    <Activity className="w-12 h-12 text-gray-200" />
                                  </div>
                                  <p className="font-semibold text-gray-500">No delivery data</p>
                                </div>
                              );
                            }

                            return (
                              <div className="flex-1 flex flex-col items-center justify-center p-4">
                                <AnimatedPieChart
                                  data={chartData}
                                  centerLabel={total.toLocaleString()}
                                  centerSubLabel="Total Deliveries"
                                />

                                {/* Custom Legend */}
                                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                                  {chartData.map((item, idx) => (
                                    <div key={idx} className="flex flex-col p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{item.name}</span>
                                      </div>
                                      <div className="flex items-end justify-between">
                                        <span className="text-xl font-black text-gray-900">{item.value.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-gray-400 mb-0.5">{item.percentage.toFixed(0)}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Fiber Delivery Analytics - Enhanced Bar Chart */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-white via-emerald-50/30 to-blue-50/30 rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-200"></div>
                              <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Delivery Analytics</h3>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">Fiber quantity (kg) over time</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {deliveryView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  value={deliveryMonthYear}
                                  onChange={(e) => setDeliveryMonthYear(parseInt(e.target.value))}
                                >
                                  {Array.from(new Set([
                                    new Date().getFullYear(),
                                    ...(dashboardData.deliveries?.rawDeliveries || []).map((d: any) => new Date(d.created_at || d.delivery_date).getFullYear())
                                  ])).filter(y => y > 2020).sort((a, b) => b - a).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              )}
                              <div className="flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100">
                                <button
                                  onClick={() => setDeliveryView('monthly')}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${deliveryView === 'monthly'
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Monthly
                                </button>
                                <button
                                  onClick={() => setDeliveryView('yearly')}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${deliveryView === 'yearly'
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Yearly
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Premium Legend Badges - Serving as Custom Legend */}
                          <div className="flex flex-wrap items-center gap-3 mb-8">
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Class A</span>
                            </div>
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Class B</span>
                            </div>
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Class C</span>
                            </div>
                          </div>

                          <div className="w-full">
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
                                  // Use consistent date parsing
                                  const date = new Date(d.created_at || d.delivery_date);
                                  if (date.getFullYear() === deliveryMonthYear) {
                                    const month = date.getMonth();
                                    const qty = parseFloat(d.quantity_kg || 0);

                                    // Aggregate by class
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

                                // Group by Year and Class
                                chartData = years.map(year => {
                                  const yearDeliveries = rawDists.filter((d: any) => new Date(d.created_at || d.delivery_date).getFullYear() === year);

                                  const classA = yearDeliveries.filter((d: any) => d.grade === 'Class A').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);
                                  const classB = yearDeliveries.filter((d: any) => d.grade === 'Class B').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);
                                  const classC = yearDeliveries.filter((d: any) => d.grade === 'Class C').reduce((sum: number, d: any) => sum + parseFloat(d.quantity_kg || 0), 0);

                                  return {
                                    period: year.toString(),
                                    classA,
                                    classB,
                                    classC
                                  };
                                });
                              }

                              return (
                                <div className="overflow-x-auto rounded-3xl bg-white/50 backdrop-blur-sm p-4 border border-white/60 shadow-inner">
                                  <div style={{ minWidth: deliveryView === 'monthly' ? '700px' : '100%', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={450}>
                                      <RechartsBarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                        barGap={6}
                                        barCategoryGap={chartData.length < 5 ? "35%" : "15%"}
                                      >
                                        <defs>
                                          <linearGradient id="classAGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                          </linearGradient>
                                          <linearGradient id="classBGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                                          </linearGradient>
                                          <linearGradient id="classCGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                                        <XAxis
                                          dataKey="period"
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dy={10}
                                        />
                                        <YAxis
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dx={-5}
                                          tickFormatter={(value) => `${value}`}
                                        />
                                        {/* Legend removed as requested, using custom badges above */}
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            backdropFilter: 'blur(10px)',
                                            border: 'none',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            fontWeight: 600
                                          }}
                                          itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                                          cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
                                          formatter={(value: any) => `${Math.round(value)} kg`}
                                        />
                                        <Bar
                                          dataKey="classA"
                                          name="Class A"
                                          fill="url(#classAGradient)"
                                          radius={[6, 6, 0, 0]}
                                          barSize={deliveryView === 'monthly' ? 24 : 40}
                                          animationDuration={1500}
                                        />
                                        <Bar
                                          dataKey="classB"
                                          name="Class B"
                                          fill="url(#classBGradient)"
                                          radius={[6, 6, 0, 0]}
                                          barSize={deliveryView === 'monthly' ? 24 : 40}
                                          animationDuration={1700}
                                        />
                                        <Bar
                                          dataKey="classC"
                                          name="Class C"
                                          fill="url(#classCGradient)"
                                          radius={[6, 6, 0, 0]}
                                          barSize={deliveryView === 'monthly' ? 24 : 40}
                                          animationDuration={1900}
                                        />
                                      </RechartsBarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Report Section - Bottom */}
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sales Analytics</h2>

                      {/* Stats Cards - Vibrant Gradient Design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatsCard
                          title="Sales"
                          value={`₱${(dashboardData.sales?.totalAmount || 0).toLocaleString()}`}
                          subValue="Total sales amount"
                          icon={<TrendingUp className="w-6 h-6 text-white" />}
                          gradient="from-purple-500 via-purple-600 to-purple-700"
                        />
                        <StatsCard
                          title="Active Farmers"
                          value={dashboardData.users.totalFarmers}
                          subValue="Registered farmers"
                          icon={<User className="w-6 h-6 text-white" />}
                          gradient="from-emerald-500 via-emerald-600 to-emerald-700"
                        />
                        <StatsCard
                          title="Abaca Sold"
                          value={(dashboardData.sales?.totalKgSold || 0).toLocaleString()}
                          subValue="Total fiber sold"
                          icon={<Package className="w-6 h-6 text-white" />}
                          gradient="from-blue-500 via-blue-600 to-blue-700"
                          unit="kg"
                        />
                        <StatsCard
                          title="Transactions"
                          value={dashboardData.sales?.recentSales?.length || 0}
                          subValue="Total sales records"
                          icon={<FileText className="w-6 h-6 text-white" />}
                          gradient="from-orange-500 via-orange-600 to-orange-700"
                        />
                      </div>

                      {/* Analytics Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Sales Overview Donut */}
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-black text-gray-900">Sales Status</h3>
                              <p className="text-xs text-gray-500 font-medium italic">Approval status distribution</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-xl">
                              <TrendingUp className="text-purple-500" size={24} />
                            </div>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center">
                            {(() => {
                              const approved = dashboardData.sales?.totalAmount || 0;
                              const pending = dashboardData.sales?.pendingAmount || 0;
                              const total = approved + pending;

                              const chartData = [
                                { name: 'Approved', value: approved, fill: '#10b981', percentage: total > 0 ? (approved / total) * 100 : 0 },
                                { name: 'Pending', value: pending, fill: '#fbbf24', percentage: total > 0 ? (pending / total) * 100 : 0 }
                              ];

                              if (total === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                                    <Activity className="w-12 h-12 text-gray-200 mb-2" />
                                    <p className="text-sm font-semibold">No sales data</p>
                                  </div>
                                );
                              }

                              return (
                                <div className="w-full flex-1 flex flex-col items-center">
                                  <AnimatedPieChart
                                    data={chartData}
                                    centerLabel={`₱${total.toLocaleString()}`}
                                    centerSubLabel="Total Sales Amount"
                                  />

                                  {/* Custom Legend */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                                    {chartData.map((item, idx) => (
                                      <div key={idx} className="flex flex-col p-4 bg-gray-50/50 rounded-2xl border border-gray-100/80 transition-all hover:bg-white hover:shadow-lg hover:border-purple-200 group">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.fill }}></div>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.name}</span>
                                          </div>
                                          <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                            {item.percentage.toFixed(0)}%
                                          </span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className={`${item.value > 1000000 ? 'text-lg' : 'text-xl'} font-black text-gray-900 tracking-tight`}>
                                            ₱{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Contribution Amount</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Unified Sales Performance Analytics - Redesigned */}
                        <div className="lg:col-span-2 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-3xl shadow-2xl p-6 border border-white/60 flex flex-col hover:shadow-purple-500/10 transition-all duration-500">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-10 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-200"></div>
                              <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Sales Performance Analytics</h3>
                                <p className="text-sm text-gray-500 font-medium mt-0.5">Fiber Sales (₱) by Class A, B, and C</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {abacaSoldView === 'monthly' && (
                                <select
                                  className="text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-xl px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 hover:border-purple-200 transition-colors"
                                  value={salesMonthYear}
                                  onChange={(e) => setSalesMonthYear(parseInt(e.target.value))}
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
                              <div className="flex gap-1 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100">
                                <button
                                  onClick={() => {
                                    setAbacaSoldView('monthly');
                                    setSalesChartView('monthly');
                                  }}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${abacaSoldView === 'monthly'
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Monthly
                                </button>
                                <button
                                  onClick={() => {
                                    setAbacaSoldView('yearly');
                                    setSalesChartView('yearly');
                                  }}
                                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all duration-300 ${abacaSoldView === 'yearly'
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                  Yearly
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Premium Legend Badges with Icons */}
                          <div className="flex flex-wrap items-center gap-3 mb-8">
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Class A</span>
                            </div>
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-blue-700 uppercase tracking-wider">Class B</span>
                            </div>
                            <div className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-md group-hover:scale-110 transition-transform"></div>
                              <span className="text-xs font-black text-purple-700 uppercase tracking-wider">Class C</span>
                            </div>
                          </div>

                          <div className="w-full">
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
                              let chartData = [];

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
                                ])).sort((a, b) => a - b);

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
                                <div className="overflow-x-auto rounded-3xl bg-white/50 backdrop-blur-sm p-4 border border-white/60 shadow-inner">
                                  <div style={{ minWidth: abacaSoldView === 'monthly' ? '700px' : '100%', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={450}>
                                      <RechartsBarChart
                                        data={chartData}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                        barGap={6}
                                        barCategoryGap={chartData.length < 5 ? "35%" : "15%"}
                                      >
                                        <defs>
                                          <linearGradient id="salesAGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                                          </linearGradient>
                                          <linearGradient id="salesBGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                                          </linearGradient>
                                          <linearGradient id="salesCGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#9333ea" stopOpacity={0.7} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.5} />
                                        <XAxis
                                          dataKey="period"
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dy={10}
                                        />
                                        <YAxis
                                          stroke="#6b7280"
                                          style={{ fontSize: '13px', fontWeight: 600 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dx={-5}
                                          tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                            backdropFilter: 'blur(10px)',
                                            border: 'none',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            fontWeight: 600
                                          }}
                                          itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                                          cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
                                          formatter={(value: any) => `₱${Math.round(value).toLocaleString()}`}
                                        />
                                        <Bar
                                          name="Class A"
                                          dataKey="salesA"
                                          fill="url(#salesAGradient)"
                                          radius={[6, 6, 0, 0]}
                                          animationDuration={1500}
                                          barSize={abacaSoldView === 'monthly' ? 20 : 35}
                                        />
                                        <Bar
                                          name="Class B"
                                          dataKey="salesB"
                                          fill="url(#salesBGradient)"
                                          radius={[6, 6, 0, 0]}
                                          animationDuration={1800}
                                          barSize={abacaSoldView === 'monthly' ? 20 : 35}
                                        />
                                        <Bar
                                          name="Class C"
                                          dataKey="salesC"
                                          fill="url(#salesCGradient)"
                                          radius={[6, 6, 0, 0]}
                                          animationDuration={2100}
                                          barSize={abacaSoldView === 'monthly' ? 20 : 35}
                                        />
                                      </RechartsBarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Recent Sales Table - Premium Style */}
                      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-white/60 hover:shadow-emerald-500/5 transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-200"></div>
                            <div>
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Sales Transactions</h3>
                              <p className="text-sm text-gray-500 font-medium">Detailed log of approved fiber sales</p>
                            </div>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-2xl">
                            <TrendingUp className="text-emerald-500 w-6 h-6" />
                          </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-gray-50/30">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-white/80">
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Farmer</th>
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Buyer</th>
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Amount</th>
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Quantity</th>
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Status</th>
                                <th className="text-left py-5 px-6 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(dashboardData.sales?.recentSales || []).map((sale: any, index: number) => (
                                <tr key={index} className="hover:bg-white transition-all duration-200 group">
                                  <td className="py-5 px-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-700 font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                        {sale.farmer_name?.charAt(0) || 'F'}
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">{sale.farmer_name || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="py-5 px-6">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{sale.buyer_company_name || sale.buyer_name || 'N/A'}</span>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Verified Buyer</span>
                                    </div>
                                  </td>
                                  <td className="py-5 px-6">
                                    <div className="flex flex-col">
                                      <span className="text-base font-black text-gray-900 tracking-tight">₱{sale.total_amount?.toLocaleString() || '0'}</span>
                                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Total Gross</span>
                                    </div>
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black shadow-sm border border-blue-100">
                                      {sale.quantity_sold || 0} kg
                                    </span>
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Approved
                                    </span>
                                  </td>
                                  <td className="py-5 px-6">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-700">{new Date(sale.sale_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">Sale Date</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dashboardSection === 'users' && (
                  <UserAnalyticsDashboard />
                )}
              </>
            )}
          </div>
        )
        }
      </main >

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isEditMode ? 'Edit Profile' : 'My Profile'}
                  </h2>
                  <p className="text-emerald-50 text-sm opacity-90">Manage your account information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditMode(false);
                }}
                className="text-white hover:bg-white/10 rounded-xl p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 bg-white overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {loadingProfile ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center mb-8 pb-8 border-b-2 border-gray-200">
                    <div className="relative">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-40 h-40 rounded-full object-cover border-4 border-emerald-500 shadow-2xl"
                        />
                      ) : (
                        <div className="w-40 h-40 rounded-full bg-emerald-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-gray-50 shadow-md">
                          {user?.fullName?.charAt(0) || 'A'}
                        </div>
                      )}
                      {isEditMode && (
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                          <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full transition-colors flex items-center justify-center shadow-lg">
                            <Upload className="w-5 h-5" />
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
                    <h3 className="text-2xl font-bold text-gray-800 mt-4">{editFormData.full_name || user?.fullName || 'MAO Coordinator'}</h3>
                    <p className="text-emerald-600 font-semibold">{editFormData.position || 'Municipal Agriculture Officer'}</p>
                    {uploadingPhoto && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        Uploading photo...
                      </p>
                    )}
                  </div>

                  {/* Profile Information Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      Personal & Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Full Name</label>
                        <input
                          type="text"
                          value={editFormData.full_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-700 font-medium transition-all"
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Email Address</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          disabled={true}
                          className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 font-medium"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Position / Role</label>
                        <input
                          type="text"
                          value={editFormData.position || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-700 font-medium transition-all"
                          placeholder="e.g., Municipal Agriculturist"
                        />
                      </div>

                      {/* Organization */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Organization</label>
                        <input
                          type="text"
                          value={editFormData.association_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, association_name: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-700 font-medium transition-all"
                          placeholder="e.g., Municipal Agriculture Office"
                        />
                      </div>

                      {/* Contact Number */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Contact Number</label>
                        <input
                          type="tel"
                          value={editFormData.contact_number || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                          disabled={!isEditMode}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-700 font-medium transition-all"
                          placeholder="e.g., 09171234567"
                        />
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Complete Address</label>
                        <textarea
                          value={editFormData.address || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          disabled={!isEditMode}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-700 font-medium resize-none transition-all"
                          placeholder="Enter your complete address (Purok, Barangay, Municipality)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-gray-200">
                    {!isEditMode && (
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-bold border border-amber-200 shadow-sm"
                      >
                        <Lock className="w-5 h-5" />
                        Change Password
                      </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                      {isEditMode ? (
                        <>
                          <button
                            onClick={() => {
                              setIsEditMode(false);
                              fetchOfficerProfile();
                            }}
                            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-bold shadow-md hover:shadow-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={_handleSaveProfile}
                            disabled={savingProfile}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingProfile ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                              </span>
                            ) : 'Save Changes'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-md"
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

      {
        showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-amber-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Lock className="w-5 h-5" />
                  <h3 className="text-xl font-bold">Change Password</h3>
                </div>
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={_handleChangePassword} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      required
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all pr-12"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={4}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all pr-12"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={4}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-md disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default MAODashboard;