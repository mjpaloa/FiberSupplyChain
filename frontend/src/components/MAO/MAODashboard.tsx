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
  Clock,
  Bell,
  Coins,
  Upload,
  Lock,
  EyeOff
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

interface MAODashboardProps {
  onLogout: () => void;
}

const MAODashboard: React.FC<MAODashboardProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'users' | 'officers' | 'maintenance' | 'seedlings' | 'seedlings-overview' | 'monitoring' | 'content' | 'harvests' | 'sales-analytics' | 'buyer-prices' | 'delivery-tracking' | 'activity-logs'>('dashboard');
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
  const [dashboardData, setDashboardData] = useState({
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
      monthlyDistributed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
      totalValue: 0,
      rawDeliveries: [] as any[]
    }
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [,] = useState<'production' | 'sales' | 'users'>('production');
  const [,] = useState('');
  const [,] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<{ month: string, received: number, distributed: number, x: number, y: number } | null>(null);
  const [hoveredMonitoring, setHoveredMonitoring] = useState<{ month: string, total: number, healthy: number, needsSupport: number, x: number, y: number } | null>(null);
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');
  const [monitoringView, setMonitoringView] = useState<'monthly' | 'yearly'>('monthly');
  const [deliveryView, setDeliveryView] = useState<'monthly' | 'yearly'>('monthly');
  const [abacaSoldView, setAbacaSoldView] = useState<'monthly' | 'yearly'>('monthly');
  const [salesChartView, setSalesChartView] = useState<'monthly' | 'yearly'>('yearly');
  const [deliveryStatusView, setDeliveryStatusView] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [dashboardSection, setDashboardSection] = useState<'production' | 'reports' | 'users'>('production');

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
        totalValue: deliveries.filter((d: any) => d.status === 'Completed').reduce((sum: number, d: any) => sum + parseFloat(d.total_amount || 0), 0),
        rawDeliveries: deliveries // Store raw deliveries for filtering
      };

      // Calculate monthly data from actual database dates
      const currentYear = new Date().getFullYear();
      let monthlyReceived = new Array(12).fill(0);
      let monthlyDistributed = new Array(12).fill(0);
      let monthlyHarvest = new Array(12).fill(0);

      // Process deliveries for monthly harvest (production)
      deliveries.forEach((d: any) => {
        const date = new Date(d.created_at);
        if (date.getFullYear() === currentYear && (d.status === 'Completed' || d.status === 'Delivered')) {
          const monthIndex = date.getMonth();
          monthlyHarvest[monthIndex] += parseFloat(d.quantity_kg || 0);
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
            const date = new Date(dist.date_distributed);
            if (date.getFullYear() === currentYear) {
              const monthIndex = date.getMonth();
              const quantity = parseInt(dist.quantity_distributed || 0);
              monthlyReceived[monthIndex] += quantity;
            }
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
              const date = new Date(dist.date_distributed);
              if (date.getFullYear() === currentYear) {
                const monthIndex = date.getMonth();
                const quantity = parseInt(dist.quantity_distributed || 0);
                monthlyDistributed[monthIndex] += quantity;
              }
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

      try {
        const monitoringRes = await fetch('https://easyabaca-api.vercel.app/api/mao/monitoring', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (monitoringRes.ok) {
          const monitoringData = await monitoringRes.json();
          const records = Array.isArray(monitoringData) ? monitoringData : (monitoringData.records || monitoringData.data || []);

          records.forEach((record: any) => {
            const date = new Date(record.date_of_visit);
            totalMonitoring++;

            // Count for current year monthly data
            if (date.getFullYear() === currentYear) {
              const monthIndex = date.getMonth();
              monthlyMonitoring[monthIndex]++;

              if (record.farm_condition === 'Healthy') {
                monthlyHealthy[monthIndex]++;
              } else if (record.farm_condition === 'Needs Support') {
                monthlyNeedsSupport[monthIndex]++;
              } else if (record.farm_condition === 'Damaged') {
                monthlyDamaged[monthIndex]++;
              }
            }

            // Count overall totals (not just current year)
            if (record.farm_condition === 'Healthy') {
              healthyFarms++;
            } else if (record.farm_condition === 'Needs Support') {
              needsSupportFarms++;
            } else if (record.farm_condition === 'Damaged') {
              damagedFarms++;
            }
          });
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
              // Use harvest_date or created_at
              const dateStr = h.harvest_date || h.created_at;
              if (!dateStr) return;

              const date = new Date(dateStr);
              if (date.getFullYear() === currentYear) {
                // Sum up dry fiber output
                monthlyHarvest[date.getMonth()] += parseFloat(h.dry_fiber_output_kg || 0);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch harvest breakdown:', e);
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
          monthlyReceived,
          monthlyDistributed,
          monthlyHarvest, // Add monthly harvest data
          healthyFarms,
          needsSupportFarms,
          damagedFarms,
          totalMonitoringVisits: totalMonitoring || productionData.totalMonitoringVisits,
          monthlyMonitoring,
          monthlyHealthy,
          monthlyNeedsSupport,
          monthlyDamaged
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
        />
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
                    {/* ?? SEEDLING ANALYTICS - Next-Gen Modern Design */}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                        {/* Received - Orange Gradient */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Received Seedlings (Association)</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalSeedlingsReceived || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/70">Total seedlings</p>
                        </div>

                        {/* Distributed - Blue Gradient */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Truck className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Distributed Seedlings (Farmers)</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalSeedlingsDistributed || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/70">To farmers</p>
                        </div>

                        {/* Total Monitoring - Blue/Indigo Gradient */}
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Total Monitoring Visits</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalMonitoringVisits || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/70">Monitoring records</p>
                        </div>

                        {/* Planted - Purple Gradient */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Sprout className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Planted</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalSeedlingsPlanted || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/70">Seedlings planted</p>
                        </div>

                        {/* Area Planted - Green Gradient */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Area Planted</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalAreaPlanted || 0).toLocaleString()} <span className="text-xl">ha</span></p>
                          <p className="text-xs text-white/70">Total hectares</p>
                        </div>

                        {/* Harvest Fiber - Orange Gradient */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Harvest Fiber</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.production?.totalHarvestFiber || 0).toLocaleString()} <span className="text-xl">kg</span></p>
                          <p className="text-xs text-white/70">Total harvested</p>
                        </div>
                      </div>

                      {/* Charts Row - Line Chart & Donut Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Seedling Analytics Line Chart - Enhanced */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Seedling Distribution Overview</h3>
                              <p className="text-sm text-gray-500 font-normal mt-1">Monthly seedling distribution statistics</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#fb923c]"></div>
                                <span className="text-gray-600">Received (Assoc)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                                <span className="text-gray-600">Distributed (Farmers)</span>
                              </div>

                              <select
                                className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                value={chartView}
                                onChange={(e) => setChartView(e.target.value as 'monthly' | 'yearly')}
                              >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                          </div>

                          <div className="w-full">
                            {(() => {
                              let chartData: any[] = [];
                              const prodData: any = dashboardData.production;

                              if (chartView === 'yearly') {
                                const currentYear = new Date().getFullYear();
                                const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                                const yearlyTotal = prodData.totalSeedlingsReceived || 0;
                                const yearlyDistTotal = prodData.totalSeedlingsDistributed || 0;
                                const yearlyHarvestTotal = prodData.totalHarvestFiber || 0;

                                chartData = years.map(year => ({
                                  period: year.toString(),
                                  received: year === currentYear ? yearlyTotal : 0,
                                  distributed: year === currentYear ? yearlyDistTotal : 0,
                                  harvested: year === currentYear ? yearlyHarvestTotal : 0
                                }));
                              } else {
                                const dataReceived = prodData.monthlyReceived || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                const dataDistributed = prodData.monthlyDistributed || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                const dataHarvested = prodData.monthlyHarvest || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                                chartData = labels.map((label, i) => ({
                                  period: label,
                                  received: dataReceived[i],
                                  distributed: dataDistributed[i],
                                  harvested: dataHarvested[i]
                                }));
                              }

                              return (
                                <div className="overflow-x-auto">
                                  <div style={{ minWidth: chartView === 'monthly' ? '600px' : '100%', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={380}>
                                      <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barGap={8}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis
                                          dataKey="period"
                                          stroke="#374151"
                                          style={{ fontSize: '12px', fontWeight: 500 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dy={5}
                                        />
                                        <YAxis
                                          stroke="#374151"
                                          style={{ fontSize: '12px', fontWeight: 500 }}
                                          axisLine={false}
                                          tickLine={false}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                          }}
                                          cursor={{ fill: '#f9fafb' }}
                                        />

                                        <Bar
                                          dataKey="received"
                                          fill="#fb923c"
                                          name="Received (Association)"
                                          radius={[4, 4, 0, 0]}
                                          barSize={chartView === 'monthly' ? 20 : 30}
                                        />
                                        <Bar
                                          dataKey="distributed"
                                          fill="#3b82f6"
                                          name="Distributed (Farmers)"
                                          radius={[4, 4, 0, 0]}
                                          barSize={chartView === 'monthly' ? 20 : 30}
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
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Production Overview</h3>
                          <p className="text-xs text-gray-500 mb-6">Planted vs Harvest</p>

                          {(() => {
                            // Planted (Units) vs Harvested (Kg)
                            const totalPlanted = dashboardData.production.totalSeedlingsPlanted || 0;
                            const totalHarvested = dashboardData.production.totalHarvestFiber || 0;

                            // Planted = Growing in field
                            const planted = totalPlanted;

                            // Pending Planting = Distributed to farmers but not yet planted


                            // In Stock = Received by Association but not yet distributed to farmers


                            // Create chart data array
                            const chartData: { name: string; value: number; fill: string }[] = [];

                            if (totalPlanted > 0) {
                              chartData.push({ name: 'Planted', value: totalPlanted, fill: '#10b981' });
                            }
                            if (totalHarvested > 0) {
                              chartData.push({ name: 'Harvested Total', value: totalHarvested, fill: '#f97316' });
                            }

                            // Calculate total
                            const total = totalPlanted + totalHarvested;

                            // Show empty state if no data
                            if (chartData.length === 0 || total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                  <div className="p-6 bg-gray-100 rounded-full mb-4">
                                    <Activity className="w-12 h-12 text-gray-300" />
                                  </div>
                                  <p className="font-semibold text-gray-500">No data available</p>
                                  <p className="text-sm text-gray-400 mt-2">Seedling data will appear here</p>
                                </div>
                              );
                            }

                            return (
                              <>
                                {/* Donut Chart - Balanced Size */}
                                <div className="relative">
                                  <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        cornerRadius={10}
                                        strokeWidth={0}
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: 'none',
                                          borderRadius: '12px',
                                          fontSize: '12px',
                                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                          padding: '8px 12px'
                                        }}
                                        formatter={(value: number) => {
                                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                          return [`${value.toLocaleString()} (${percentage}%)`, ''];
                                        }}
                                      />
                                    </RechartsPieChart>
                                  </ResponsiveContainer>

                                  {/* Center Label */}
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
                                    <div className="text-4xl font-black text-gray-900">
                                      {totalHarvested.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">Total Production (kg)</div>
                                  </div>
                                </div>

                                {/* Legend Grid - 2x2 Layout */}
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                  {/* Planted */}
                                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Planted</span>
                                    </div>
                                    <div className="text-2xl font-black text-green-600">{total > 0 ? ((totalPlanted / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{totalPlanted.toLocaleString()}</div>
                                  </div>

                                  {/* Harvested */}
                                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                      <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Harvested Total</span>
                                    </div>
                                    <div className="text-2xl font-black text-orange-600">{total > 0 ? ((totalHarvested / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{totalHarvested.toLocaleString()}</div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* FIELD MONITORING - Simple */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Field Monitoring</h2>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {/* Total Monitoring - Blue Gradient */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Total Monitoring</p>
                          <p className="text-5xl font-bold text-white mb-1">{dashboardData.production.totalMonitoringVisits}</p>
                          <p className="text-xs text-white/70">Monitoring records</p>
                        </div>

                        {/* Healthy Farms - Green Gradient */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Healthy Farms</p>
                          <p className="text-5xl font-bold text-white mb-1">{dashboardData.production.healthyFarms}</p>
                          <p className="text-xs text-white/70">In good condition</p>
                        </div>

                        {/* Needs Support - Orange Gradient */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Needs Support</p>
                          <p className="text-5xl font-bold text-white mb-1">{dashboardData.production.needsSupportFarms}</p>
                          <p className="text-xs text-white/70">Requires attention</p>
                        </div>

                        {/* Damaged Farms - Red Gradient */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <X className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Damaged Farms</p>
                          <p className="text-5xl font-bold text-white mb-1">{dashboardData.production.damagedFarms}</p>
                          <p className="text-xs text-white/70">Critical condition</p>
                        </div>
                      </div>

                      {/* Monitoring Bar Chart - Modern Recharts Design */}
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Monitoring Status Overview</h3>
                            <p className="text-xs text-gray-500 mt-1">Track farm health and monitoring visits</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                              <button
                                onClick={() => setMonitoringView('monthly')}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${monitoringView === 'monthly'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                Monthly
                              </button>
                              <button
                                onClick={() => setMonitoringView('yearly')}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${monitoringView === 'yearly'
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:text-gray-900'
                                  }`}
                              >
                                Yearly
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Data Insights Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-6">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-semibold text-blue-700">Total</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-semibold text-green-700">Healthy</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-xs font-semibold text-amber-700">Needs Support</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs font-semibold text-red-700">Damaged</span>
                          </div>
                        </div>

                        <div className="w-full">
                          {(() => {
                            let chartData: any[] = [];

                            if (monitoringView === 'yearly') {
                              const currentYear = new Date().getFullYear();
                              const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                              const yearlyTotal = dashboardData.production.totalMonitoringVisits || 0;
                              const yearlyHealthy = dashboardData.production.healthyFarms || 0;
                              const yearlyNeeds = dashboardData.production.needsSupportFarms || 0;
                              const yearlyDamaged = dashboardData.production.damagedFarms || 0;

                              chartData = years.map(year => ({
                                period: year.toString(),
                                total: year === currentYear ? yearlyTotal : 0,
                                healthy: year === currentYear ? yearlyHealthy : 0,
                                needsSupport: year === currentYear ? yearlyNeeds : 0,
                                damaged: year === currentYear ? yearlyDamaged : 0
                              }));
                            } else {
                              const dataTotal = dashboardData.production.monthlyMonitoring || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              const dataHealthy = dashboardData.production.monthlyHealthy || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              const dataNeedsSupport = dashboardData.production.monthlyNeedsSupport || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              const dataDamaged = dashboardData.production.monthlyDamaged || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                              chartData = labels.map((label, i) => ({
                                period: label,
                                total: dataTotal[i],
                                healthy: dataHealthy[i],
                                needsSupport: dataNeedsSupport[i],
                                damaged: dataDamaged[i]
                              }));
                            }

                            return (
                              <div className="overflow-x-auto">
                                <div style={{ minWidth: monitoringView === 'monthly' ? '600px' : '100%', width: '100%' }}>
                                  <ResponsiveContainer width="100%" height={380}>
                                    <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                      <XAxis
                                        dataKey="period"
                                        stroke="#374151"
                                        style={{ fontSize: '12px', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={5}
                                      />
                                      <YAxis
                                        stroke="#374151"
                                        style={{ fontSize: '12px', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: 'none',
                                          borderRadius: '12px',
                                          fontSize: '12px',
                                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        cursor={{ fill: '#f9fafb' }}
                                      />

                                      <Bar
                                        dataKey="total"
                                        fill="#3b82f6"
                                        name="Total Monitoring"
                                        radius={[6, 6, 0, 0]}
                                        barSize={monitoringView === 'monthly' ? 20 : 30}
                                      />
                                      <Bar
                                        dataKey="healthy"
                                        fill="#10b981"
                                        name="Healthy Farms"
                                        radius={[6, 6, 0, 0]}
                                        barSize={monitoringView === 'monthly' ? 20 : 30}
                                      />
                                      <Bar
                                        dataKey="needsSupport"
                                        fill="#f59e0b"
                                        name="Needs Support"
                                        radius={[6, 6, 0, 0]}
                                        barSize={monitoringView === 'monthly' ? 20 : 30}
                                      />
                                      <Bar
                                        dataKey="damaged"
                                        fill="#ef4444"
                                        name="Damaged Farms"
                                        radius={[6, 6, 0, 0]}
                                        barSize={monitoringView === 'monthly' ? 20 : 30}
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

                      {/* Top Statistics Cards - Vibrant Gradient Design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* In Transit Card - Blue Gradient */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Truck className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">In Transit</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.deliveries.inTransit}</p>
                          <p className="text-xs text-white/70">Currently shipping</p>
                        </div>

                        {/* Delivered Card - Green Gradient */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Delivered</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.deliveries.delivered}</p>
                          <p className="text-xs text-white/70">Successfully delivered</p>
                        </div>

                        {/* Completed Card - Purple Gradient */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Completed</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.deliveries.completed}</p>
                          <p className="text-xs text-white/70">Fully completed</p>
                        </div>

                        {/* Cancelled Card - Red Gradient */}
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <X className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Cancelled</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.deliveries.cancelled || 0}</p>
                          <p className="text-xs text-white/70">Cancelled orders</p>
                        </div>
                      </div>

                      {/* Charts Section - Enhanced */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Delivery Status - Modern Recharts Design */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Delivery Status</h3>
                          <p className="text-xs text-gray-500 font-normal mt-1">Breakdown by current status</p>

                          {(() => {
                            const rawDeliveries = dashboardData.deliveries.rawDeliveries || [];
                            const currentYear = new Date().getFullYear();
                            const filteredDeliveries = rawDeliveries.filter((d: any) => {
                              const deliveryDate = new Date(d.created_at || d.delivery_date);
                              if (deliveryStatusView === 'monthly') {
                                return deliveryDate.getMonth() === selectedMonth && deliveryDate.getFullYear() === currentYear;
                              } else {
                                return deliveryDate.getFullYear() === currentYear;
                              }
                            });

                            const inTransit = filteredDeliveries.filter((d: any) => d.status === 'In Transit').length;
                            const delivered = filteredDeliveries.filter((d: any) => d.status === 'Delivered').length;
                            const completed = filteredDeliveries.filter((d: any) => d.status === 'Completed').length;
                            const cancelled = filteredDeliveries.filter((d: any) => d.status === 'Cancelled').length;
                            const total = inTransit + delivered + completed + cancelled;

                            // Create chart data array
                            const chartData: { name: string; value: number; fill: string }[] = [];

                            if (inTransit > 0) {
                              chartData.push({ name: 'In Transit', value: inTransit, fill: '#3b82f6' });
                            }
                            if (delivered > 0) {
                              chartData.push({ name: 'Delivered', value: delivered, fill: '#10b981' });
                            }
                            if (completed > 0) {
                              chartData.push({ name: 'Completed', value: completed, fill: '#8b5cf6' });
                            }
                            if (cancelled > 0) {
                              chartData.push({ name: 'Cancelled', value: cancelled, fill: '#ef4444' });
                            }

                            // Show empty state if no data
                            if (chartData.length === 0 || total === 0) {
                              return (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                  <div className="p-6 bg-gray-100 rounded-full mb-4">
                                    <Activity className="w-12 h-12 text-gray-300" />
                                  </div>
                                  <p className="font-semibold text-gray-500">No delivery data</p>
                                  <p className="text-sm text-gray-400 mt-2">Delivery data will appear here</p>
                                </div>
                              );
                            }

                            return (
                              <>
                                {/* Donut Chart - Balanced Size */}
                                <div className="relative">
                                  <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cornerRadius={8}
                                        strokeWidth={0}
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: '#fff',
                                          border: 'none',
                                          borderRadius: '12px',
                                          fontSize: '12px',
                                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                          padding: '8px 12px'
                                        }}
                                        formatter={(value: number) => {
                                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                          return [`${value.toLocaleString()} (${percentage}%)`, ''];
                                        }}
                                      />
                                    </RechartsPieChart>
                                  </ResponsiveContainer>

                                  {/* Center Label */}
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <div className="text-4xl font-black text-gray-900 leading-tight">
                                      {total}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Deliveries</div>
                                  </div>
                                </div>

                                {/* Legend Grid - 2x2 Layout */}
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                  {/* In Transit */}
                                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">In Transit</span>
                                    </div>
                                    <div className="text-2xl font-black text-blue-600">{total > 0 ? ((inTransit / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{inTransit.toLocaleString()}</div>
                                  </div>

                                  {/* Delivered */}
                                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Delivered</span>
                                    </div>
                                    <div className="text-2xl font-black text-green-600">{total > 0 ? ((delivered / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{delivered.toLocaleString()}</div>
                                  </div>

                                  {/* Completed */}
                                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                      <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Completed</span>
                                    </div>
                                    <div className="text-2xl font-black text-purple-600">{total > 0 ? ((completed / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{completed.toLocaleString()}</div>
                                  </div>

                                  {/* Cancelled */}
                                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                      <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Cancelled</span>
                                    </div>
                                    <div className="text-2xl font-black text-red-600">{total > 0 ? ((cancelled / total) * 100).toFixed(0) : '0'}%</div>
                                    <div className="text-xs text-gray-500 mt-1">{cancelled.toLocaleString()}</div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* Fiber Delivery Analytics - Enhanced Bar Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Delivery Analytics</h3>
                              <p className="text-xs text-gray-500 font-normal mt-1">Fiber quantity (kg) over time</p>
                            </div>
                            <select
                              value={deliveryView}
                              onChange={(e) => setDeliveryView(e.target.value as 'monthly' | 'yearly')}
                              className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          <div className="w-full">
                            {(() => {
                              const currentYear = new Date().getFullYear();
                              let chartData: any[] = [];
                              const rawDists = dashboardData.deliveries?.rawDeliveries || [];

                              if (deliveryView === 'monthly') {
                                const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const monthlyData = new Array(12).fill(0);

                                rawDists.forEach((d: any) => {
                                  const date = new Date(d.created_at);
                                  if (date.getFullYear() === currentYear) {
                                    monthlyData[date.getMonth()] += parseFloat(d.quantity_kg || 0);
                                  }
                                });

                                // Fallback: If all months are 0 but we have total, put it in current month
                                const totalFromRaw = monthlyData.reduce((a, b) => a + b, 0);
                                if (totalFromRaw === 0 && (dashboardData.deliveries?.totalFiberKg || 0) > 0) {
                                  monthlyData[new Date().getMonth()] = dashboardData.deliveries.totalFiberKg;
                                }

                                chartData = labels.map((label, i) => ({
                                  period: label,
                                  quantity: monthlyData[i]
                                }));
                              } else {
                                const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                                const yearlyData = new Array(5).fill(0);

                                rawDists.forEach((d: any) => {
                                  const date = new Date(d.created_at);
                                  const year = date.getFullYear();
                                  const index = years.indexOf(year);
                                  if (index !== -1) {
                                    yearlyData[index] += parseFloat(d.quantity_kg || 0);
                                  }
                                });

                                // Fallback
                                const totalFromRaw = yearlyData.reduce((a, b) => a + b, 0);
                                if (totalFromRaw === 0 && (dashboardData.deliveries?.totalFiberKg || 0) > 0) {
                                  yearlyData[4] = dashboardData.deliveries.totalFiberKg;
                                }

                                chartData = years.map((year, i) => ({
                                  period: year.toString(),
                                  quantity: yearlyData[i]
                                }));
                              }

                              return (
                                <div className="overflow-x-auto">
                                  <div style={{ minWidth: deliveryView === 'monthly' ? '600px' : '100%', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={500}>
                                      <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                        <defs>
                                          <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.8} />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e1e8ed" vertical={false} />
                                        <XAxis
                                          dataKey="period"
                                          stroke="#64748b"
                                          style={{ fontSize: '11px', fontWeight: 500 }}
                                          axisLine={false}
                                          tickLine={false}
                                          dy={10}
                                        />
                                        <YAxis
                                          stroke="#64748b"
                                          style={{ fontSize: '11px', fontWeight: 500 }}
                                          axisLine={false}
                                          tickLine={false}
                                          tickCount={8}
                                          tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            backgroundColor: '#fff',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            padding: '8px 12px'
                                          }}
                                          cursor={{ fill: '#f8fafc' }}
                                          formatter={(value: number) => [`${value.toFixed(2)} kg`, 'Fiber Delivered']}
                                        />
                                        <Bar
                                          dataKey="quantity"
                                          fill="url(#deliveryGradient)"
                                          radius={[6, 6, 0, 0]}
                                          barSize={deliveryView === 'monthly' ? 30 : 60}
                                          animationDuration={1500}
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
                        {/* Sales Card - Purple Gradient */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Sales</p>
                          <p className="text-4xl font-bold text-white mb-1">₱{(dashboardData.sales?.totalAmount || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/70">Total sales amount</p>
                        </div>

                        {/* Active Farmers Card - Green Gradient */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Active Farmers</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.users.totalFarmers}</p>
                          <p className="text-xs text-white/70">Registered farmers</p>
                        </div>

                        {/* Abaca Sold Card - Blue Gradient */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Abaca Sold</p>
                          <p className="text-4xl font-bold text-white mb-1">{(dashboardData.sales?.totalKgSold || 0).toLocaleString()} <span className="text-xl">kg</span></p>
                          <p className="text-xs text-white/70">Total fiber sold</p>
                        </div>

                        {/* Transactions Card - Orange Gradient */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                          <div className="flex items-center mb-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-white/90 mb-2">Transactions</p>
                          <p className="text-4xl font-bold text-white mb-1">{dashboardData.sales?.recentSales?.length || 0}</p>
                          <p className="text-xs text-white/70">Total sales records</p>
                        </div>
                      </div>

                      {/* Analytics Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Sales Overview Donut */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col">
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Sales Status</h3>
                            <p className="text-xs text-gray-500 font-normal mt-1">Status of all sales transactions</p>
                          </div>
                          <div className="flex-1 flex flex-col justify-center items-center">
                            {(() => {
                              const approved = dashboardData.sales?.totalAmount || 0;
                              const pending = dashboardData.sales?.pendingAmount || 0;
                              const total = approved + pending;

                              const chartData = [
                                { name: 'Approved', value: approved, fill: '#10b981' },
                                { name: 'Pending', value: pending, fill: '#fbbf24' }
                              ];

                              if (total === 0) {
                                return (
                                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Activity className="w-12 h-12 text-gray-200 mb-2" />
                                    <p className="text-sm">No sales data</p>
                                  </div>
                                );
                              }

                              return (
                                <>
                                  <div className="relative w-full">
                                    <ResponsiveContainer width="100%" height={380}>
                                      <RechartsPieChart>
                                        <Pie
                                          data={chartData}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={75}
                                          outerRadius={135}
                                          paddingAngle={5}
                                          dataKey="value"
                                          cornerRadius={10}
                                          strokeWidth={0}
                                        >
                                          {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                          ))}
                                        </Pie>
                                        <Tooltip
                                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                          formatter={(value: number) => [`₱${value.toLocaleString()}`, '']}
                                        />
                                      </RechartsPieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                      <div className="text-3xl font-black text-gray-900">₱{Math.round(total / 1000)}k</div>
                                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total</div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 w-full mt-8">
                                    <div className="flex flex-col p-3 bg-emerald-50 rounded-xl border border-emerald-100 transition-all hover:shadow-sm">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Approved</span>
                                      </div>
                                      <span className="text-lg font-black text-emerald-700">₱{approved.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col p-3 bg-amber-50 rounded-xl border border-amber-100 transition-all hover:shadow-sm">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Pending</span>
                                      </div>
                                      <span className="text-lg font-black text-amber-700">₱{pending.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Unified Sales Performance Analytics */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">Sales Performance Analytics</h3>
                              <p className="text-sm text-gray-500 font-normal mt-1">Comparison of Abaca Volume (kg) vs Sales (₱)</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={abacaSoldView}
                                onChange={(e) => {
                                  const val = e.target.value as 'monthly' | 'yearly';
                                  setAbacaSoldView(val);
                                  setSalesChartView(val);
                                }}
                                className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <option value="monthly">Monthly Overview</option>
                                <option value="yearly">Yearly Overview</option>
                              </select>
                            </div>
                          </div>

                          <div className="w-full">
                            {(() => {
                              const recentSales = dashboardData.sales?.recentSales || [];
                              const currentYear = new Date().getFullYear();
                              let chartData = [];

                              if (abacaSoldView === 'monthly') {
                                const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const volData = Array(12).fill(0);
                                const revData = Array(12).fill(0);

                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  if (saleDate.getFullYear() === currentYear) {
                                    volData[saleDate.getMonth()] += (sale.quantity_sold || 0);
                                    revData[saleDate.getMonth()] += (sale.total_amount || 0);
                                  }
                                });

                                chartData = labels.map((l, i) => ({
                                  period: l,
                                  volume: volData[i],
                                  revenue: revData[i]
                                }));
                              } else {
                                const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
                                const volData = Array(5).fill(0);
                                const revData = Array(5).fill(0);

                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  const yearIdx = years.indexOf(saleDate.getFullYear());
                                  if (yearIdx !== -1) {
                                    volData[yearIdx] += (sale.quantity_sold || 0);
                                    revData[yearIdx] += (sale.total_amount || 0);
                                  }
                                });

                                chartData = years.map((y, i) => ({
                                  period: y.toString(),
                                  volume: volData[i],
                                  revenue: revData[i]
                                }));
                              }

                              return (
                                <ResponsiveContainer width="100%" height={450}>
                                  <RechartsBarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                                    barGap={18}
                                    barCategoryGap="25%"
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                      dataKey="period"
                                      axisLine={false}
                                      tickLine={false}
                                      style={{ fontSize: '12px', fontWeight: 500, fill: '#64748b' }}
                                      dy={15}
                                    />
                                    {/* Primary Y-Axis (Volume) */}
                                    <YAxis
                                      yAxisId="left"
                                      orientation="left"
                                      axisLine={false}
                                      tickLine={false}
                                      style={{ fontSize: '11px', fontWeight: 500, fill: '#8b5cf6' }}
                                      tickFormatter={(value) => `${value}kg`}
                                    />
                                    {/* Secondary Y-Axis (Sales) */}
                                    <YAxis
                                      yAxisId="right"
                                      orientation="right"
                                      axisLine={false}
                                      tickLine={false}
                                      style={{ fontSize: '11px', fontWeight: 500, fill: '#3b82f6' }}
                                      tickFormatter={(value) => `₱${Math.round(value / 1000)}k`}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        padding: '12px'
                                      }}
                                      cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Legend
                                      verticalAlign="top"
                                      align="right"
                                      height={50}
                                      iconType="circle"
                                      wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
                                    />
                                    <Bar
                                      yAxisId="left"
                                      name="Abaca Volume (kg)"
                                      dataKey="volume"
                                      fill="#8b5cf6"
                                      radius={[6, 6, 0, 0]}
                                      animationDuration={1500}
                                      barSize={abacaSoldView === 'monthly' ? 24 : 48}
                                    />
                                    <Bar
                                      yAxisId="right"
                                      name="Sales (₱)"
                                      dataKey="revenue"
                                      fill="#3b82f6"
                                      radius={[6, 6, 0, 0]}
                                      animationDuration={2000}
                                      barSize={abacaSoldView === 'monthly' ? 24 : 48}
                                    />
                                  </RechartsBarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Sales Table */}
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Farmer</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Buyer</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(dashboardData.sales?.recentSales || []).map((sale: any, index: number) => (
                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{sale.farmer_name || 'N/A'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-600">{sale.buyer_company_name || sale.buyer_name || 'N/A'}</td>
                                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">₱{sale.total_amount?.toLocaleString() || '0'}</td>
                                  <td className="py-3 px-4 text-sm text-gray-600">{sale.quantity_sold || 0} kg</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                                      Approved
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(sale.sale_date).toLocaleDateString()}</td>
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
          </div >
        )}
      </main >

      {/* Profile Modal - Enhanced Professional Design */}
      {
        showProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header - Enhanced */}
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
                    {/* Profile Picture Section - Enhanced */}
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

                    {/* Action Buttons - Enhanced */}
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
        )
      }

      {/* Change Password Modal */}
      {showChangePasswordModal && (
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
    </div >
  );
};

export default MAODashboard;