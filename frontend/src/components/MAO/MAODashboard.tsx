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
  Upload
} from 'lucide-react';

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

  // Note: All features are now available to both admin and super admin

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
          association_name: data.association_name || '',
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
          position: editFormData.position || '',
          associationName: editFormData.association_name || '',
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
            position: editFormData.position || user?.position,
            associationName: editFormData.association_name,
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
      monthlyMonitoring: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyHealthy: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      monthlyNeedsSupport: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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

      try {
        // Fetch seedling distributions for monthly data
        const associationDistRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/mao/associations', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (associationDistRes.ok) {
          const associationDist = await associationDistRes.json();

          // Process association distributions (Received)
          const distributions = associationDist.distributions || associationDist || [];
          console.log('?? Processing association distributions (Received):', distributions.length, 'records');

          distributions.forEach((dist: any) => {
            const date = new Date(dist.date_distributed);
            if (date.getFullYear() === currentYear) {
              const monthIndex = date.getMonth();
              const quantity = parseInt(dist.quantity_distributed || 0);
              monthlyReceived[monthIndex] += quantity;
              console.log(`  Month ${monthIndex + 1}: +${quantity} (Total now: ${monthlyReceived[monthIndex]})`);
            }
          });

          const totalReceived = monthlyReceived.reduce((a, b) => a + b, 0);
          console.log('? Total Received from database:', totalReceived);
          console.log('📅 Monthly Received:', monthlyReceived);
        }

        // For distributed data, fetch from CUSAFA endpoint which has all farmer distributions
        try {
          const farmerDistRes = await fetch('https://easyabaca-api.vercel.app/api/association-seedlings/cusafa/all-distributions', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (farmerDistRes.ok) {
            const farmerDistData = await farmerDistRes.json();
            console.log('?? CUSAFA distributions data:', farmerDistData);

            // Process farmer distributions (Distributed to farmers)
            const farmerDists = farmerDistData.farmer_distributions || [];
            console.log('?? Processing farmer distributions (Distributed):', farmerDists.length, 'records');

            farmerDists.forEach((dist: any) => {
              const date = new Date(dist.date_distributed);
              if (date.getFullYear() === currentYear) {
                const monthIndex = date.getMonth();
                const quantity = parseInt(dist.quantity_distributed || 0);
                monthlyDistributed[monthIndex] += quantity;
                console.log(`  Month ${monthIndex + 1}: +${quantity} (Total now: ${monthlyDistributed[monthIndex]})`);
              }
            });

            const totalDistributed = monthlyDistributed.reduce((a, b) => a + b, 0);
            console.log('? Total Distributed from database:', totalDistributed);
            console.log('📅 Monthly Distributed:', monthlyDistributed);
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
      let healthyFarms = 0;
      let needsSupportFarms = 0;
      let totalMonitoring = 0;

      try {
        const monitoringRes = await fetch('https://easyabaca-api.vercel.app/api/mao/monitoring', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (monitoringRes.ok) {
          const monitoringData = await monitoringRes.json();
          const records = Array.isArray(monitoringData) ? monitoringData : (monitoringData.records || monitoringData.data || []);

          console.log('Monitoring records fetched:', records.length);
          console.log('Sample record:', records[0]); // Debug first record

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
                // Count damaged as needs support for simplicity
                monthlyNeedsSupport[monthIndex]++;
              }
            }

            // Count overall totals (not just current year)
            if (record.farm_condition === 'Healthy') {
              healthyFarms++;
            } else if (record.farm_condition === 'Needs Support' || record.farm_condition === 'Damaged') {
              needsSupportFarms++;
            }
          });

          console.log('Monitoring stats - Total:', totalMonitoring, 'Healthy:', healthyFarms, 'Needs Support:', needsSupportFarms);
          console.log('Monthly monitoring:', monthlyMonitoring);
          console.log('Monthly healthy:', monthlyHealthy);
          console.log('Monthly needs support:', monthlyNeedsSupport);
        }
      } catch (err) {
        console.log('Could not fetch monitoring data', err);
      }

      // Use zeros if no monitoring data found
      if (totalMonitoring === 0) {
        monthlyMonitoring = Array(12).fill(0);
        monthlyHealthy = Array(12).fill(0);
        monthlyNeedsSupport = Array(12).fill(0);
        totalMonitoring = 0;
        healthyFarms = 0;
        needsSupportFarms = 0;
      }

      // Log the current state of monthly data
      console.log('Monthly Received data:', monthlyReceived);
      console.log('Monthly Distributed data:', monthlyDistributed);

      // Check monthly data totals
      const totalReceivedFromMonthly = monthlyReceived.reduce((a, b) => a + b, 0);
      const totalDistributedFromMonthly = monthlyDistributed.reduce((a, b) => a + b, 0);

      console.log('=== MONTHLY DATA FROM DATABASE ===');
      console.log('Received monthly breakdown:', monthlyReceived);
      console.log('Received total from monthly:', totalReceivedFromMonthly);
      console.log('Distributed monthly breakdown:', monthlyDistributed);
      console.log('Distributed total from monthly:', totalDistributedFromMonthly);

      // Don't adjust - use actual database numbers as-is
      // The line chart will show EXACTLY what's in the database

      // Use zeros if no received data found
      if (totalReceivedFromMonthly === 0) {
        monthlyReceived = Array(12).fill(0);
      }

      // For distributed data - if no data from database, leave it as zeros
      // Don't calculate or estimate - only show real data from database
      if (totalDistributedFromMonthly === 0) {
        console.log('?? No distributed data found in database');
        console.log('?? Distributed will show as 0 (no data recorded yet)');
        // monthlyDistributed stays as [0,0,0,0,0,0,0,0,0,0,0,0]
      }

      console.log('Final Monthly Received:', monthlyReceived);
      console.log('Final Monthly Distributed:', monthlyDistributed);

      setDashboardData({
        production: {
          ...productionData,
          monthlyReceived,
          monthlyDistributed,
          healthyFarms,
          needsSupportFarms,
          totalMonitoringVisits: totalMonitoring || productionData.totalMonitoringVisits,
          monthlyMonitoring,
          monthlyHealthy,
          monthlyNeedsSupport
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

          {/* Officer Management - Available to all admins */}
          <button
            onClick={() => setCurrentPage('officers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'officers' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Officer Management</span>
          </button>

          <button
            onClick={() => setCurrentPage('activity-logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'activity-logs' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Activity Logs</span>
          </button>

          {/* Maintenance Mode - Available to all admins */}
          <button
            onClick={() => setCurrentPage('maintenance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === 'maintenance' ? 'bg-emerald-600' : 'hover:bg-slate-700'
              } ${!sidebarOpen && 'justify-center'}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Maintenance Mode</span>
          </button>
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
                                  currentPage === 'officers' ? 'Officer Management' :
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
                    {user?.fullName || 'Officer'}
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

                      {/* Top Stats Cards - Simple Design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        {/* Received */}
                        <div className="bg-[#fff7ed] rounded-xl shadow-sm p-5 border border-orange-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#fb923c] rounded-lg shadow-sm">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              +10%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Received</p>
                          <p className="text-4xl font-bold text-gray-900 mb-1">{(dashboardData.production?.totalSeedlingsReceived || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">+10% this week</p>
                        </div>

                        {/* Distributed */}
                        <div className="bg-[#eff6ff] rounded-xl shadow-sm p-5 border border-blue-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#3b82f6] rounded-lg shadow-sm">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              +14.6%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Distributed</p>
                          <p className="text-4xl font-bold text-gray-900 mb-1">{(dashboardData.production?.totalSeedlingsDistributed || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">+14.6% this week</p>
                        </div>

                        {/* Planted */}
                        <div className="bg-[#f5f3ff] rounded-xl shadow-sm p-5 border border-purple-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#8b5cf6] rounded-lg shadow-sm">
                              <Sprout className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3 rotate-180" />
                              -0.9%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Planted</p>
                          <p className="text-4xl font-bold text-gray-900 mb-1">{(dashboardData.production?.totalSeedlingsPlanted || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">-0.9% this week</p>
                        </div>

                        {/* Area Planted */}
                        <div className="bg-[#ecfdf5] rounded-xl shadow-sm p-5 border border-emerald-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#10b981] rounded-lg shadow-sm">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              +1.3%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Area Planted</p>
                          <p className="text-4xl font-bold text-gray-900 mb-1">{(dashboardData.production?.totalAreaPlanted || 0).toLocaleString()} <span className="text-xl">ha</span></p>
                          <p className="text-xs text-gray-500">+1.3% this week</p>
                        </div>

                        {/* Harvest Fiber */}
                        <div className="bg-[#fff7ed] rounded-xl shadow-sm p-5 border border-orange-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#f97316] rounded-lg shadow-sm">
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              +10%
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Harvest Fiber</p>
                          <p className="text-4xl font-bold text-gray-900 mb-1">{(dashboardData.production?.totalHarvestFiber || 0).toLocaleString()} <span className="text-xl">kg</span></p>
                          <p className="text-xs text-gray-500">+10% this week</p>
                        </div>
                      </div>

                      {/* Charts Row - Line Chart & Donut Chart */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Seedling Analytics Line Chart - Enhanced */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-semibold text-gray-900">Seedling Distribution Trends</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#fb923c]"></div>
                                <span className="text-gray-600">Received</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                                <span className="text-gray-600">Distributed</span>
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

                          <div className="h-80 relative bg-white">
                            {(() => {
                              let dataReceived, dataDistributed, labels;

                              if (chartView === 'yearly') {
                                const currentYear = new Date().getFullYear();
                                const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                                labels = years.map(y => y.toString());
                                const yearlyTotal = dashboardData.production.totalSeedlingsReceived || 0;
                                const yearlyDistTotal = dashboardData.production.totalSeedlingsDistributed || 0;

                                dataReceived = years.map(year => year === currentYear ? yearlyTotal : 0);
                                dataDistributed = years.map(year => year === currentYear ? yearlyDistTotal : 0);
                              } else {
                                dataReceived = dashboardData.production.monthlyReceived || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                dataDistributed = dashboardData.production.monthlyDistributed || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              }

                              const maxValue = Math.max(...dataReceived, ...dataDistributed, 100) * 1.1;

                              return (
                                <>
                                  <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 w-12 pt-1">
                                    <span>{Math.round(maxValue).toLocaleString()}</span>
                                    <span>{Math.round(maxValue * 0.5).toLocaleString()}</span>
                                    <span>0</span>
                                  </div>

                                  <div className="ml-12 h-full">
                                    <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                      {/* Grid lines */}
                                      <line x1="0" y1="0" x2="1000" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                                      <line x1="0" y1="150" x2="1000" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                                      <line x1="0" y1="300" x2="1000" y2="300" stroke="#e5e7eb" strokeWidth="1" />

                                      {labels.map((label, i) => {
                                        const groupWidth = 1000 / labels.length;
                                        const barWidth = groupWidth * 0.35;
                                        const spacing = groupWidth * 0.1;
                                        const xBase = i * groupWidth + (groupWidth - (barWidth * 2 + spacing)) / 2;

                                        const hReceived = (dataReceived[i] / maxValue) * 300;
                                        const hDistributed = (dataDistributed[i] / maxValue) * 300;

                                        return (
                                          <g key={i}>
                                            <rect
                                              x={xBase}
                                              y={300 - hReceived}
                                              width={barWidth}
                                              height={hReceived}
                                              fill="#fb923c"
                                              rx="2"
                                              className="hover:opacity-80 transition-opacity cursor-pointer"
                                              onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredPoint({
                                                  month: labels[i],
                                                  received: dataReceived[i],
                                                  distributed: dataDistributed[i],
                                                  x: rect.left + rect.width / 2,
                                                  y: rect.top
                                                });
                                              }}
                                              onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                            <rect
                                              x={xBase + barWidth + spacing}
                                              y={300 - hDistributed}
                                              width={barWidth}
                                              height={hDistributed}
                                              fill="#3b82f6"
                                              rx="2"
                                              className="hover:opacity-80 transition-opacity cursor-pointer"
                                              onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setHoveredPoint({
                                                  month: labels[i],
                                                  received: dataReceived[i],
                                                  distributed: dataDistributed[i],
                                                  x: rect.left + rect.width / 2,
                                                  y: rect.top
                                                });
                                              }}
                                              onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                          </g>
                                        );
                                      })}
                                    </svg>

                                    <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                                      {labels.map((label, i) => (
                                        <span key={i} className="flex-1 text-center">{label}</span>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}

                            {hoveredPoint && (
                              <div
                                className="fixed bg-white shadow-lg rounded-lg px-3 py-2 text-xs border border-gray-200 z-50 pointer-events-none"
                                style={{
                                  left: `${hoveredPoint.x}px`,
                                  top: `${hoveredPoint.y - 60}px`,
                                  transform: 'translateX(-50%)'
                                }}
                              >
                                <div className="font-semibold text-gray-900 mb-1">{hoveredPoint.month}</div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="w-2 h-2 rounded-full bg-[#fb923c]"></div>
                                  <span>Received: {hoveredPoint.received.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                  <span>Distributed: {hoveredPoint.distributed.toLocaleString()}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Production Distribution Donut Chart - Simple */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-8">Production Distribution</h3>

                          {/* Simple Donut Chart */}
                          <div className="relative w-64 h-64 mx-auto mb-8">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />

                              {(() => {
                                const total = (dashboardData.production.totalSeedlingsPlanted || 0) + (dashboardData.production.totalAreaPlanted || 0) + (dashboardData.production.totalHarvestFiber || 0);
                                const circumference = 251.2;

                                const plantedPercent = total > 0 ? (dashboardData.production.totalSeedlingsPlanted / total) * 100 : 33;
                                const areaPercent = total > 0 ? (dashboardData.production.totalAreaPlanted / total) * 100 : 33;
                                const harvestPercent = total > 0 ? (dashboardData.production.totalHarvestFiber / total) * 100 : 34;

                                const plantedDash = (plantedPercent / 100) * circumference;
                                const areaDash = (areaPercent / 100) * circumference;
                                const harvestDash = (harvestPercent / 100) * circumference;

                                return (
                                  <>
                                    <circle
                                      cx="50" cy="50" r="40" fill="none"
                                      stroke="#8b5cf6" strokeWidth="12"
                                      strokeDasharray={`${plantedDash} ${circumference}`}
                                      strokeDashoffset="0"
                                      className="transition-all duration-500"
                                    />
                                    <circle
                                      cx="50" cy="50" r="40" fill="none"
                                      stroke="#10b981" strokeWidth="12"
                                      strokeDasharray={`${areaDash} ${circumference}`}
                                      strokeDashoffset={`-${plantedDash}`}
                                      className="transition-all duration-500"
                                    />
                                    <circle
                                      cx="50" cy="50" r="40" fill="none"
                                      stroke="#f97316" strokeWidth="12"
                                      strokeDasharray={`${harvestDash} ${circumference}`}
                                      strokeDashoffset={`-${plantedDash + areaDash}`}
                                      className="transition-all duration-500"
                                    />
                                  </>
                                );
                              })()}
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold text-gray-900">{(dashboardData.production.totalSeedlingsPlanted + dashboardData.production.totalAreaPlanted + dashboardData.production.totalHarvestFiber).toLocaleString()}</div>
                              <div className="text-xs font-medium text-gray-500">Total</div>
                            </div>
                          </div>

                          {/* Simple Legend */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></div>
                                <span className="text-sm text-gray-600">Planted</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{dashboardData.production.totalSeedlingsPlanted.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                                <span className="text-sm text-gray-600">Area (ha)</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{dashboardData.production.totalAreaPlanted.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div>
                                <span className="text-sm text-gray-600">Harvest (kg)</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{dashboardData.production.totalHarvestFiber.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FIELD MONITORING - Simple */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Field Monitoring</h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Total Monitoring */}
                        <div className="bg-[#eff6ff] rounded-xl shadow-sm p-5 border border-blue-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#3b82f6] rounded-lg shadow-sm">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Records</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Total Monitoring</p>
                          <p className="text-5xl font-bold text-gray-900">{dashboardData.production.totalMonitoringVisits}</p>
                        </div>

                        {/* Healthy Farms */}
                        <div className="bg-[#ecfdf5] rounded-xl shadow-sm p-5 border border-green-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#10b981] rounded-lg shadow-sm">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Excellent</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Healthy Farms</p>
                          <p className="text-5xl font-bold text-gray-900">{dashboardData.production.healthyFarms}</p>
                        </div>

                        {/* Needs Support */}
                        <div className="bg-[#fffbeb] rounded-xl shadow-sm p-5 border border-amber-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#f59e0b] rounded-lg shadow-sm">
                              <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Action Needed</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Needs Support</p>
                          <p className="text-5xl font-bold text-gray-900">{dashboardData.production.needsSupportFarms}</p>
                        </div>
                      </div>

                      {/* Monitoring Bar Chart - Enhanced */}
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-lg font-semibold text-gray-900">Monitoring Status Overview</h3>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                              <span className="text-gray-600">Total</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                              <span className="text-gray-600">Healthy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                              <span className="text-gray-600">Needs Support</span>
                            </div>
                            <select
                              className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              value={monitoringView}
                              onChange={(e) => setMonitoringView(e.target.value as 'monthly' | 'yearly')}
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                        </div>

                        <div className="h-80 relative bg-white">
                          {(() => {
                            let dataTotal, dataHealthy, dataNeedsSupport, labels;

                            if (monitoringView === 'yearly') {
                              const currentYear = new Date().getFullYear();
                              const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                              labels = years.map(y => y.toString());
                              const yearlyTotal = dashboardData.production.totalMonitoringVisits || 0;
                              const yearlyHealthy = dashboardData.production.healthyFarms || 0;
                              const yearlyNeeds = dashboardData.production.needsSupportFarms || 0;

                              dataTotal = years.map(year => year === currentYear ? yearlyTotal : 0);
                              dataHealthy = years.map(year => year === currentYear ? yearlyHealthy : 0);
                              dataNeedsSupport = years.map(year => year === currentYear ? yearlyNeeds : 0);
                            } else {
                              dataTotal = dashboardData.production.monthlyMonitoring || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              dataHealthy = dashboardData.production.monthlyHealthy || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              dataNeedsSupport = dashboardData.production.monthlyNeedsSupport || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                              labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            }

                            const maxValue = Math.max(...dataTotal, 10) * 1.1;

                            return (
                              <>
                                <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-400 w-10">
                                  <span>{Math.round(maxValue)}</span>
                                  <span>{Math.round(maxValue * 0.5)}</span>
                                  <span>0</span>
                                </div>

                                <div className="ml-10 h-full pb-8">
                                  <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                    <line x1="0" y1="0" x2="1000" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                                    <line x1="0" y1="150" x2="1000" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                                    <line x1="0" y1="300" x2="1000" y2="300" stroke="#e5e7eb" strokeWidth="1" />

                                    {labels.map((_, i) => {
                                      const groupWidth = 1000 / labels.length;
                                      const barWidth = groupWidth * 0.25;
                                      const spacing = groupWidth * 0.05;
                                      const groupX = i * groupWidth + (groupWidth - (barWidth * 3 + spacing * 2)) / 2;

                                      const hTotal = (dataTotal[i] / maxValue) * 300;
                                      const hHealthy = (dataHealthy[i] / maxValue) * 300;
                                      const hNeeds = (dataNeedsSupport[i] / maxValue) * 300;

                                      return (
                                        <g key={i}>
                                          <rect
                                            x={groupX}
                                            y={300 - hTotal}
                                            width={barWidth}
                                            height={hTotal}
                                            fill="#3b82f6"
                                            rx="2"
                                            className="hover:opacity-80 transition-opacity"
                                          />
                                          <rect
                                            x={groupX + barWidth + spacing}
                                            y={300 - hHealthy}
                                            width={barWidth}
                                            height={hHealthy}
                                            fill="#10b981"
                                            rx="2"
                                            className="hover:opacity-80 transition-opacity"
                                          />
                                          <rect
                                            x={groupX + (barWidth + spacing) * 2}
                                            y={300 - hNeeds}
                                            width={barWidth}
                                            height={hNeeds}
                                            fill="#f59e0b"
                                            rx="2"
                                            className="hover:opacity-80 transition-opacity"
                                          />
                                          {/* Value labels */}
                                          {dataTotal[i] > 0 && (
                                            <text x={groupX + barWidth / 2} y={300 - hTotal - 5} textAnchor="middle" fontSize="10" fill="#6b7280">{dataTotal[i]}</text>
                                          )}
                                        </g>
                                      );
                                    })}
                                  </svg>

                                  <div className="flex justify-between text-[10px] text-gray-500 mt-4">
                                    {labels.map((label, i) => (
                                      <span key={i} className="flex-1 text-center">{label}</span>
                                    ))}
                                  </div>
                                </div>
                              </>
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

                      {/* Top Statistics Cards - Simple Design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* In Transit Card */}
                        <div className="bg-[#eff6ff] rounded-xl shadow-sm p-5 border border-blue-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#3b82f6] rounded-lg shadow-sm">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+3.2%</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">In Transit</p>
                          <p className="text-4xl font-bold text-gray-900">{dashboardData.deliveries.inTransit}</p>
                        </div>

                        {/* Delivered Card */}
                        <div className="bg-[#ecfdf5] rounded-xl shadow-sm p-5 border border-green-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#10b981] rounded-lg shadow-sm">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">0%</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
                          <p className="text-4xl font-bold text-gray-900">{dashboardData.deliveries.delivered}</p>
                        </div>

                        {/* Completed Card */}
                        <div className="bg-[#f5f3ff] rounded-xl shadow-sm p-5 border border-purple-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#8b5cf6] rounded-lg shadow-sm">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">0%</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                          <p className="text-4xl font-bold text-gray-900">{dashboardData.deliveries.completed}</p>
                        </div>

                        {/* Cancelled Card */}
                        <div className="bg-[#fef2f2] rounded-xl shadow-sm p-5 border border-red-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-[#ef4444] rounded-lg shadow-sm">
                              <X className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">0%</span>
                          </div>
                          <p className="text-sm font-medium text-gray-600 mb-1">Cancelled</p>
                          <p className="text-4xl font-bold text-gray-900">{dashboardData.deliveries.cancelled || 0}</p>
                        </div>
                      </div>

                      {/* Charts Section - Enhanced */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Delivery Status Distribution - Simple Donut */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Delivery Status</h3>
                            <select
                              value={deliveryStatusView}
                              onChange={(e) => setDeliveryStatusView(e.target.value as 'monthly' | 'yearly')}
                              className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          {deliveryStatusView === 'monthly' && (
                            <div className="mb-4">
                              <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="w-full text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                              >
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                  <option key={i} value={i}>{m}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex items-center justify-center mb-8">
                            <div className="relative w-48 h-48">
                              <svg viewBox="0 0 200 200" className="transform -rotate-90">
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

                                  if (total === 0) return <circle cx="100" cy="100" r="70" fill="none" stroke="#f3f4f6" strokeWidth="24" />;

                                  const segments = [
                                    { value: inTransit, color: '#8b5cf6' },
                                    { value: delivered, color: '#10b981' },
                                    { value: completed, color: '#f97316' },
                                    { value: cancelled, color: '#ef4444' }
                                  ];

                                  let currentAngle = 0;
                                  const radius = 70;
                                  const circumference = 2 * Math.PI * radius;

                                  return segments.map((segment, index) => {
                                    if (segment.value === 0) return null;
                                    const length = (segment.value / total) * circumference;
                                    const offset = -(currentAngle / total) * circumference;
                                    currentAngle += segment.value;
                                    return (
                                      <circle
                                        key={index} cx="100" cy="100" r={radius} fill="none"
                                        stroke={segment.color} strokeWidth="24"
                                        strokeDasharray={`${length} ${circumference}`}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-500"
                                      />
                                    );
                                  });
                                })()}
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-3xl font-bold text-gray-900">
                                  {(() => {
                                    const rawDeliveries = dashboardData.deliveries.rawDeliveries || [];
                                    const currentYear = new Date().getFullYear();
                                    return rawDeliveries.filter((d: any) => {
                                      const deliveryDate = new Date(d.created_at || d.delivery_date);
                                      return deliveryStatusView === 'monthly' ? deliveryDate.getMonth() === selectedMonth && deliveryDate.getFullYear() === currentYear : deliveryDate.getFullYear() === currentYear;
                                    }).length;
                                  })()}
                                </p>
                                <p className="text-xs text-gray-500">Deliveries</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'In Transit', color: '#8b5cf6', key: 'In Transit' },
                              { label: 'Delivered', color: '#10b981', key: 'Delivered' },
                              { label: 'Completed', color: '#f97316', key: 'Completed' },
                              { label: 'Cancelled', color: '#ef4444', key: 'Cancelled' }
                            ].map((s, i) => {
                              const rawDeliveries = dashboardData.deliveries.rawDeliveries || [];
                              const currentYear = new Date().getFullYear();
                              const count = rawDeliveries.filter((d: any) => {
                                const deliveryDate = new Date(d.created_at || d.delivery_date);
                                const dateMatch = deliveryStatusView === 'monthly' ? deliveryDate.getMonth() === selectedMonth && deliveryDate.getFullYear() === currentYear : deliveryDate.getFullYear() === currentYear;
                                return dateMatch && d.status === s.key;
                              }).length;
                              return (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-gray-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                    <span className="text-xs text-gray-600">{s.label}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-900">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Fiber Delivery Analytics - Simple Bar Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-semibold text-gray-900">Delivery Analytics</h3>
                            <select
                              value={deliveryView}
                              onChange={(e) => setDeliveryView(e.target.value as 'monthly' | 'yearly')}
                              className="text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          <div className="h-64 relative bg-white">
                            {(() => {
                              let labels, data;
                              const currentYear = new Date().getFullYear();

                              if (deliveryView === 'monthly') {
                                labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const currentMonth = new Date().getMonth();
                                data = labels.map((_, i) => i === currentMonth ? (dashboardData.deliveries?.totalFiberKg || 0) : 0);
                              } else {
                                labels = Array.from({ length: 5 }, (_, i) => (currentYear - 4 + i).toString());
                                data = labels.map(y => parseInt(y) === currentYear ? (dashboardData.deliveries?.totalFiberKg || 0) : 0);
                              }

                              const maxValue = Math.max(...data, 10) * 1.1;

                              return (
                                <>
                                  <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-gray-400 w-8">
                                    <span>{Math.round(maxValue)}</span>
                                    <span>0</span>
                                  </div>

                                  <div className="ml-8 h-full flex flex-col">
                                    <div className="flex-1 flex items-end justify-between gap-1 border-b border-gray-100 pb-1">
                                      {labels.map((label, i) => {
                                        const value = data[i];
                                        const h = (value / maxValue) * 100;
                                        return (
                                          <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            <div
                                              className="w-full bg-[#10b981] rounded-t-sm transition-all duration-300 hover:opacity-80"
                                              style={{ height: `${h}%`, minHeight: value > 0 ? '2px' : '0' }}
                                            >
                                              {value > 0 && (
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                  {value.toFixed(1)}k
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500 mt-2">
                                      {labels.map((l, i) => <span key={i} className="flex-1 text-center">{l}</span>)}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="mt-8 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                            <p className="text-xs font-medium text-emerald-800 mb-1">Total Fiber Delivered</p>
                            <p className="text-2xl font-bold text-emerald-600">{(dashboardData.deliveries?.totalFiberKg || 0).toFixed(2)} kg</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sales Report Section - Bottom */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales Analytics</h2>

                      {/* Stats Cards - Simplified */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                          { label: 'Revenue', value: `₱${(dashboardData.sales?.totalAmount || 0).toLocaleString()}`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                          { label: 'Active Farmers', value: dashboardData.users.totalFarmers, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                          { label: 'Abaca Sold', value: `${(dashboardData.sales?.totalKgSold || 0).toLocaleString()}kg`, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
                          { label: 'Transactions', value: dashboardData.sales?.recentSales?.length || 0, icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50' }
                        ].map((stat, i) => (
                          <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                              </div>
                              <span className="text-sm font-medium text-gray-500">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Analytics Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Sales Overview Donut */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <h3 className="text-base font-semibold text-gray-900 mb-6">Revenue Status</h3>
                          <div className="flex flex-col items-center">
                            <div className="relative w-40 h-40 mb-6">
                              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                                {(() => {
                                  const total = (dashboardData.sales?.totalAmount || 0) + (dashboardData.sales?.pendingAmount || 0);
                                  if (total === 0) return <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20" />;
                                  const radius = 80;
                                  const circumference = 2 * Math.PI * radius;
                                  const approvedPct = (dashboardData.sales?.totalAmount || 0) / total;
                                  return (
                                    <>
                                      <circle cx="100" cy="100" r={radius} fill="none" stroke="#fbbf24" strokeWidth="20" />
                                      <circle
                                        cx="100" cy="100" r={radius} fill="none" stroke="#10b981" strokeWidth="20"
                                        strokeDasharray={`${approvedPct * circumference} ${circumference}`}
                                        className="transition-all duration-500"
                                      />
                                    </>
                                  );
                                })()}
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900">₱{Math.round((dashboardData.sales?.totalAmount || 0) / 1000)}k</span>
                                <span className="text-[10px] text-gray-500">Total Revenue</span>
                              </div>
                            </div>
                            <div className="w-full space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <span className="text-gray-600">Approved</span>
                                </div>
                                <span className="font-semibold text-gray-900">₱{(dashboardData.sales?.totalAmount || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                  <span className="text-gray-600">Pending</span>
                                </div>
                                <span className="font-semibold text-gray-900">₱{(dashboardData.sales?.pendingAmount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Abaca Volume Bar Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-semibold text-gray-900">Abaca Volume</h3>
                            <select
                              value={abacaSoldView}
                              onChange={(e) => setAbacaSoldView(e.target.value as 'monthly' | 'yearly')}
                              className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                          <div className="h-48 relative">
                            {(() => {
                              const recentSales = dashboardData.sales?.recentSales || [];
                              const currentYear = new Date().getFullYear();

                              let labels: string[] = [];
                              let data: number[] = [];

                              if (abacaSoldView === 'monthly') {
                                labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                                data = Array(12).fill(0);
                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  if (saleDate.getFullYear() === currentYear) {
                                    data[saleDate.getMonth()] += (sale.quantity_sold || 0);
                                  }
                                });
                              } else {
                                const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
                                labels = years.map(y => y.toString());
                                data = Array(5).fill(0);
                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  const yearIdx = years.indexOf(saleDate.getFullYear());
                                  if (yearIdx !== -1) {
                                    data[yearIdx] += (sale.quantity_sold || 0);
                                  }
                                });
                              }

                              const max = Math.max(...data, 10);
                              return (
                                <div className="h-full flex items-end justify-between gap-1">
                                  {labels.map((l, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group transition-all">
                                      <div
                                        className="w-full bg-purple-500 rounded-t-sm hover:bg-purple-600 transition-colors relative"
                                        style={{ height: `${(data[i] / max) * 100}%` }}
                                      >
                                      </div>
                                      <span className="text-[10px] text-gray-400">{l}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Revenue Trend Bar Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
                            <select
                              value={salesChartView}
                              onChange={(e) => setSalesChartView(e.target.value as 'monthly' | 'yearly')}
                              className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                          <div className="h-48 relative">
                            {(() => {
                              const recentSales = dashboardData.sales?.recentSales || [];
                              const currentYear = new Date().getFullYear();

                              let labels: string[] = [];
                              let data: number[] = [];

                              if (salesChartView === 'monthly') {
                                labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                                data = Array(12).fill(0);
                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  if (saleDate.getFullYear() === currentYear) {
                                    data[saleDate.getMonth()] += (sale.total_amount || 0);
                                  }
                                });
                              } else {
                                const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
                                labels = years.map(y => y.toString());
                                data = Array(5).fill(0);
                                recentSales.forEach((sale: any) => {
                                  const saleDate = new Date(sale.sale_date);
                                  const yearIdx = years.indexOf(saleDate.getFullYear());
                                  if (yearIdx !== -1) {
                                    data[yearIdx] += (sale.total_amount || 0);
                                  }
                                });
                              }

                              const max = Math.max(...data, 1000);
                              return (
                                <div className="h-full flex items-end justify-between gap-1">
                                  {labels.map((l, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group transition-all">
                                      <div
                                        className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                                        style={{ height: `${(data[i] / max) * 100}%` }}
                                      >
                                      </div>
                                      <span className="text-[10px] text-gray-400">{l}</span>
                                    </div>
                                  ))}
                                </div>
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
                      <h3 className="text-2xl font-bold text-gray-800 mt-4">{editFormData.full_name || user?.fullName || 'MAO Officer'}</h3>
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
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t-2 border-gray-200">
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
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default MAODashboard;