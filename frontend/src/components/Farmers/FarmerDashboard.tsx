import React, { useState, useEffect, useMemo } from 'react';
import { apiGet, apiPost, apiPut } from '../../utils/apiClient';
import {
  LayoutDashboard,
  Sprout,
  Package,
  Calendar,
  MapPin,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  FileText,
  Leaf,
  Eye,
  CheckCircle,
  Camera,
  Mail,
  Users as UsersIcon,
  Search,
  Filter,
  Truck,
  DollarSign,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import FarmerMonitoringView from './FarmerMonitoringView';
import FarmerHarvestView from './FarmerHarvestView';
import SalesReportForm from './SalesReportForm';
import SalesReportsList from './SalesReportsList';
import FarmerDeliveryTracking from './FarmerDeliveryTracking';

interface FarmerDashboardProps {
  onLogout: () => void;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'seedlings' | 'harvest' | 'harvest-submit' | 'monitoring' | 'sales-report' | 'track-deliveries' | 'analytics' | 'profile'>('dashboard');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [seedlings, setSeedlings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlantingModal, setShowPlantingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSeedling, setSelectedSeedling] = useState<any>(null);
  const [plantingData, setPlantingData] = useState({
    planting_date: new Date().toISOString().split('T')[0],
    planting_location: '',
    planting_notes: '',
    planting_photo_1: '',
    planting_photo_2: '',
    planting_photo_3: ''
  });

  // Profile states
  const [isEditMode, setIsEditMode] = useState(false);
  const [farmerData, setFarmerData] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Seedlings filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'distributed' | 'planted' | 'damaged'>('all');
  const [filteredSeedlings, setFilteredSeedlings] = useState<any[]>([]);
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Analytics state
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [farmHealthData, setFarmHealthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [harvestStats, setHarvestStats] = useState({ totalFiberKg: 0, totalRevenue: 0 });

  // Get user info from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (currentPage === 'seedlings' || currentPage === 'dashboard') {
      fetchMySeedlings();
    }
    if (currentPage === 'profile') {
      fetchFarmerProfile();
    }
  }, [currentPage]);

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

  // Load profile photo on mount
  useEffect(() => {
    fetchFarmerProfile();
    fetchNotifications();
  }, []);

  // Fetch notifications for farmer
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const notifs: any[] = [];
      
      // Fetch recent seedling distributions
      try {
        const seedlingsRes = await apiGet('https://easyabaca-api.vercel.app/api/association-seedlings/farmer/received');
        
        if (seedlingsRes.ok) {
          const seedlingsData = await seedlingsRes.json();
          
          // Add seedling notifications (last 5)
          if (Array.isArray(seedlingsData)) {
            seedlingsData.slice(0, 5).forEach((seedling: any) => {
              notifs.push({
                id: `seedling-${seedling.distribution_id}`,
                type: 'seedling',
                title: 'New Seedlings Received',
                message: `${seedling.quantity_distributed} ${seedling.variety} seedlings distributed to you`,
                date: seedling.distribution_date,
                icon: '🌱',
                color: 'green'
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch seedling notifications');
      }
      
      // Fetch recent monitoring records (using correct endpoint)
      try {
        const monitoringRes = await apiGet('https://easyabaca-api.vercel.app/api/farmers/monitoring');
        
        if (monitoringRes.ok) {
          const monitoringData = await monitoringRes.json();
          
          // Add monitoring notifications (last 5)
          if (Array.isArray(monitoringData)) {
            monitoringData.slice(0, 5).forEach((record: any) => {
              notifs.push({
                id: `monitoring-${record.monitoring_id}`,
                type: 'monitoring',
                title: 'Farm Monitoring Visit',
                message: `Your farm was monitored. Condition: ${record.farmCondition}`,
                date: record.dateOfVisit,
                icon: '📋',
                color: 'blue'
              });
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch monitoring notifications');
      }
      
      // Sort by date (newest first)
      notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setNotifications(notifs.slice(0, 10)); // Keep only 10 most recent
      setUnreadCount(notifs.length > 0 ? Math.min(notifs.length, 5) : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Generate analytics data on mount and when view mode changes
  useEffect(() => {
    generateAnalyticsData();
  }, [viewMode, selectedYear]);

  // Also regenerate when seedlings change
  useEffect(() => {
    if (seedlings.length > 0) {
      generateAnalyticsData();
    }
  }, [seedlings]);

  // Filter seedlings based on search and status
  useEffect(() => {
    let filtered = seedlings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(seedling =>
        seedling.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (seedling.source_supplier && seedling.source_supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (seedling.remarks && seedling.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(seedling => seedling.status === statusFilter);
    }

    setFilteredSeedlings(filtered);
    setCurrentPageNum(1); // Reset to first page when filters change
  }, [seedlings, searchTerm, statusFilter]);

  const fetchMySeedlings = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/association-seedlings/farmer/received');
      const data = await response.json();
      console.log('📦 Fetched seedlings:', data);
      // Debug: Check photo fields
      if (data && data.length > 0) {
        console.log('🖼️ First seedling photo data:', {
          seedling_photo: data[0].seedling_photo,
          packaging_photo: data[0].packaging_photo,
          quality_photo: data[0].quality_photo,
          hasPhoto: !!(data[0].seedling_photo || data[0].packaging_photo || data[0].quality_photo)
        });
      }
      setSeedlings(data);
      generateAnnouncements(data);
    } catch (error) {
      console.error('Error fetching seedlings:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnnouncements = (seedlingData: any[]) => {
    const recentDistributions = seedlingData
      .sort((a, b) => new Date(b.date_distributed).getTime() - new Date(a.date_distributed).getTime())
      .slice(0, 5);

    const newAnnouncements = recentDistributions.map(seedling => {
      const daysAgo = Math.floor((new Date().getTime() - new Date(seedling.date_distributed).getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
      
      return {
        id: seedling.distribution_id,
        title: '🌱 New Seedling Distribution',
        message: `You received ${seedling.quantity_distributed} ${seedling.variety} seedlings from ${user?.associationName || 'your association'}.`,
        date: timeText,
        type: 'distribution',
        color: 'blue'
      };
    });

    setAnnouncements(newAnnouncements);
  };

  const generateAnalyticsData = async () => {
    console.log('🔄 Generating analytics data...');
    const healthData = generateFarmHealthData();
    setFarmHealthData(healthData);

    // Fetch direct stats
    await fetchHarvestStats();

    const revenue = await generateRevenueData();
    console.log('📊 Revenue data loaded:', revenue);
    
    // Calculate totals before setting state
    const totalRev = revenue.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalFiber = revenue.reduce((sum, item) => sum + (item.fiberKg || 0), 0);
    console.log('💰 Totals calculated - Revenue:', totalRev, 'Fiber:', totalFiber, 'kg');
    
    setRevenueData(revenue);
    console.log('✅ Revenue data set in state');
  };

  const fetchHarvestStats = async () => {
    try {
      const response = await apiGet('/api/harvests/farmer/harvests');
      
      if (!response.ok) {
        console.log('❌ Could not fetch harvests, status:', response.status);
        return;
      }
      
      const data = await response.json();
      const harvests = data.harvests || data; // Handle both response formats
      console.log('🌾 All harvests fetched:', harvests);
      
      if (!Array.isArray(harvests)) {
        console.log('⚠️ Harvests is not an array');
        return;
      }
      
      // Calculate totals from ALL verified harvests (no date filtering)
      const verifiedHarvests = harvests.filter((h: any) => 
        h.status === 'Verified' || h.status === 'In Inventory'
      );
      
      console.log('✅ Verified harvests:', verifiedHarvests.length, 'out of', harvests.length);
      
      const totalFiberKg = verifiedHarvests.reduce((sum: number, h: any) => {
        const kg = parseFloat(h.dry_fiber_output_kg) || 0;
        return sum + kg;
      }, 0);
      
      // Fetch sales for revenue using correct endpoint
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const farmerId = currentUser?.userId;
      
      let totalRevenue = 0;
      if (farmerId) {
        const salesResponse = await apiGet(`https://easyabaca-api.vercel.app/api/sales/farmer-reports/${farmerId}`);
        
        if (salesResponse.ok) {
          const result = await salesResponse.json();
          console.log('💰 Sales API response:', result);
          
          if (result.success && Array.isArray(result.reports)) {
            const sales = result.reports;
            totalRevenue = sales.reduce((sum: number, s: any) => sum + (parseFloat(s.total_amount) || 0), 0);
            console.log('💵 Total revenue calculated:', totalRevenue, 'from', sales.length, 'reports');
          } else {
            console.log('⚠️ Sales response format unexpected:', result);
          }
        } else {
          console.log('⚠️ Sales API returned:', salesResponse.status);
        }
      } else {
        console.log('⚠️ No farmer ID available for sales fetch');
      }
      
      console.log('💎 FINAL STATS - Fiber:', totalFiberKg, 'kg, Revenue: ₱', totalRevenue);
      
      setHarvestStats({ totalFiberKg, totalRevenue });
    } catch (error) {
      console.error('❌ Error fetching harvest stats:', error);
    }
  };

  const generateDistributionData = () => {
    if (viewMode === 'monthly') {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
        seedlings: 0,
        planted: 0
      }));

      seedlings.forEach(seedling => {
        const date = new Date(seedling.date_distributed);
        if (date.getFullYear() === selectedYear) {
          const monthIndex = date.getMonth();
          monthlyData[monthIndex].seedlings += seedling.quantity_distributed;
          if (seedling.status === 'planted') {
            monthlyData[monthIndex].planted += seedling.quantity_distributed;
          }
        }
      });

      return monthlyData;
    } else {
      const yearlyData: any = {};
      seedlings.forEach(seedling => {
        const year = new Date(seedling.date_distributed).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = { year, seedlings: 0, planted: 0 };
        }
        yearlyData[year].seedlings += seedling.quantity_distributed;
        if (seedling.status === 'planted') {
          yearlyData[year].planted += seedling.quantity_distributed;
        }
      });

      return Object.values(yearlyData).sort((a: any, b: any) => a.year - b.year);
    }
  };

  const generateFarmHealthData = () => {
    if (viewMode === 'monthly') {
      return Array.from({ length: 12 }, (_, i) => ({
        month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
        health: Math.floor(Math.random() * 30) + 70,
        growth: Math.floor(Math.random() * 40) + 60,
        survival: Math.floor(Math.random() * 20) + 80
      }));
    } else {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => ({
        year: currentYear - 4 + i,
        health: Math.floor(Math.random() * 30) + 70,
        growth: Math.floor(Math.random() * 40) + 60,
        survival: Math.floor(Math.random() * 20) + 80
      }));
    }
  };

  const generateRevenueData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const farmerId = currentUser?.userId;
      
      if (!farmerId) {
        console.log('No farmer ID available');
        return viewMode === 'monthly' 
          ? Array.from({ length: 12 }, (_, i) => ({
              month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
              revenue: 0,
              profit: 0,
              fiberKg: 0
            }))
          : Array.from({ length: 5 }, (_, i) => ({
              year: new Date().getFullYear() - 4 + i,
              revenue: 0,
              profit: 0,
              fiberKg: 0
            }));
      }

      // Fetch harvest data for fiber production (only verified harvests)
      const harvestResponse = await apiGet(`https://easyabaca-api.vercel.app/api/harvests/farmer/harvests`);
      
      if (!harvestResponse.ok) {
        console.log('No harvest data available');
        return viewMode === 'monthly' 
          ? Array.from({ length: 12 }, (_, i) => ({
              month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
              revenue: 0,
              profit: 0,
              fiberKg: 0
            }))
          : Array.from({ length: 5 }, (_, i) => ({
              year: new Date().getFullYear() - 4 + i,
              revenue: 0,
              profit: 0,
              fiberKg: 0
            }));
      }
      
      const harvestData = await harvestResponse.json();
      const harvests = harvestData.harvests || harvestData;
      console.log('🌾 Harvest data fetched for charts:', harvests);
      
      // Filter only verified harvests
      const verifiedHarvests = Array.isArray(harvests) 
        ? harvests.filter((h: any) => h.status === 'Verified' || h.status === 'In Inventory')
        : [];
      console.log('✅ Verified harvests for charts:', verifiedHarvests.length, 'items');

      // Fetch sales data for revenue
      const salesResponse = await apiGet(`https://easyabaca-api.vercel.app/api/sales/farmer-reports/${farmerId}`);
      
      const salesResult = await salesResponse.json();
      const salesData = salesResult.success && Array.isArray(salesResult.reports) ? salesResult.reports : [];
      console.log('💰 Sales data for charts:', salesData.length, 'reports');
      
      if (viewMode === 'monthly') {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          revenue: 0,
          profit: 0,
          fiberKg: 0
        }));
        
        // Add harvest data for fiber production (verified only)
        let totalFiber = 0;
        verifiedHarvests.forEach((harvest: any) => {
          const harvestDate = new Date(harvest.harvest_date);
          if (harvestDate.getFullYear() === selectedYear) {
            const monthIndex = harvestDate.getMonth();
            const fiberKg = parseFloat(harvest.dry_fiber_output_kg) || 0;
            monthlyData[monthIndex].fiberKg += fiberKg;
            totalFiber += fiberKg;
          }
        });
        console.log(`📈 Monthly fiber data for ${selectedYear}:`, totalFiber, 'kg total');
        
        // Add sales data for revenue
        salesData.forEach((sale: any) => {
          const saleDate = new Date(sale.report_date || sale.sale_date);
          if (saleDate.getFullYear() === selectedYear) {
            const monthIndex = saleDate.getMonth();
            monthlyData[monthIndex].revenue += parseFloat(sale.total_amount) || 0;
            monthlyData[monthIndex].profit += (parseFloat(sale.total_amount) || 0) * 0.7;
          }
        });
        
        return monthlyData;
      } else {
        const yearlyData: any = {};
        const currentYear = new Date().getFullYear();
        
        // Initialize years
        for (let i = 0; i < 5; i++) {
          const year = currentYear - 4 + i;
          yearlyData[year] = { year, revenue: 0, profit: 0, fiberKg: 0 };
        }
        
        // Add harvest data for fiber production (verified only)
        let totalFiber = 0;
        verifiedHarvests.forEach((harvest: any) => {
          const year = new Date(harvest.harvest_date).getFullYear();
          if (yearlyData[year]) {
            const fiberKg = parseFloat(harvest.dry_fiber_output_kg) || 0;
            yearlyData[year].fiberKg += fiberKg;
            totalFiber += fiberKg;
          }
        });
        console.log('📈 Yearly fiber data:', totalFiber, 'kg total');
        
        // Add sales data for revenue
        if (Array.isArray(salesData)) {
          salesData.forEach((sale: any) => {
            const year = new Date(sale.sale_date).getFullYear();
            if (yearlyData[year]) {
              yearlyData[year].revenue += sale.total_amount || 0;
              yearlyData[year].profit += (sale.total_amount || 0) * 0.7;
            }
          });
        }
        
        return Object.values(yearlyData);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return viewMode === 'monthly' 
        ? Array.from({ length: 12 }, (_, i) => ({
            month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }))
        : Array.from({ length: 5 }, (_, i) => ({
            year: new Date().getFullYear() - 4 + i,
            revenue: 0,
            profit: 0,
            fiberKg: 0
          }));
    }
  };

  const generateDealerStatusData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch delivery data for this farmer
      const deliveryResponse = await apiGet(`https://easyabaca-api.vercel.app/api/fiber-deliveries/farmer/my-deliveries`);
      
      if (!deliveryResponse.ok) {
        console.log('No delivery data available');
        return viewMode === 'monthly'
          ? Array.from({ length: 12 }, (_, i) => ({
              month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
              delivered: 0,
              pending: 0,
              completed: 0
            }))
          : Array.from({ length: 5 }, (_, i) => ({
              year: new Date().getFullYear() - 4 + i,
              delivered: 0,
              pending: 0,
              completed: 0
            }));
      }
      
      const deliveryData = await deliveryResponse.json();
      const deliveries = deliveryData.deliveries || [];
      
      if (viewMode === 'monthly') {
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
          month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
          delivered: 0,
          pending: 0,
          completed: 0
        }));
        
        deliveries.forEach((delivery: any) => {
          const deliveryDate = new Date(delivery.delivery_date);
          if (deliveryDate.getFullYear() === selectedYear) {
            const monthIndex = deliveryDate.getMonth();
            if (delivery.status === 'Delivered') monthlyData[monthIndex].delivered++;
            else if (delivery.status === 'In Transit') monthlyData[monthIndex].pending++;
            else if (delivery.status === 'Completed') monthlyData[monthIndex].completed++;
          }
        });
        
        return monthlyData;
      } else {
        const yearlyData: any = {};
        const currentYear = new Date().getFullYear();
        
        // Initialize years
        for (let i = 0; i < 5; i++) {
          const year = currentYear - 4 + i;
          yearlyData[year] = { year, delivered: 0, pending: 0, completed: 0 };
        }
        
        deliveries.forEach((delivery: any) => {
          const year = new Date(delivery.delivery_date).getFullYear();
          if (yearlyData[year]) {
            if (delivery.status === 'Delivered') yearlyData[year].delivered++;
            else if (delivery.status === 'In Transit') yearlyData[year].pending++;
            else if (delivery.status === 'Completed') yearlyData[year].completed++;
          }
        });
        
        return Object.values(yearlyData);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
      return viewMode === 'monthly'
        ? Array.from({ length: 12 }, (_, i) => ({
            month: new Date(selectedYear, i).toLocaleString('default', { month: 'short' }),
            delivered: 0,
            pending: 0,
            completed: 0
          }))
        : Array.from({ length: 5 }, (_, i) => ({
            year: new Date().getFullYear() - 4 + i,
            delivered: 0,
            pending: 0,
            completed: 0
          }));
    }
  };

  const fetchFarmerProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await apiGet('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Farmer profile loaded:', data);
        setFarmerData(data);
        setEditFormData({
          full_name: data.full_name || '',
          contact_number: data.contact_number || '',
          address: data.address || '',
          sex: data.sex || '',
          age: data.age || '',
          barangay: data.barangay || '',
          municipality: data.municipality || '',
          association_name: data.association_name || ''
        });
        setProfilePhoto(data.profile_photo || null);
      }
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveFarmerProfile = async () => {
    setSavingProfile(true);
    try {
      const profileData = {
        ...editFormData,
        profilePhoto: profilePhoto
      };
      
      const response = await apiPut('/api/farmers/profile', profileData);
      
      if (response.ok) {
        alert('✅ Profile updated successfully!');
        setIsEditMode(false);
        await fetchFarmerProfile();
      } else {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        alert('❌ Failed to update profile: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('❌ Error uploading photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, photoNum: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPlantingData({
        ...plantingData,
        [`planting_photo_${photoNum}`]: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsPlanted = async () => {
    if (!selectedSeedling) return;

    try {
      const response = await apiPut(`/api/association-seedlings/farmer/${selectedSeedling.distribution_id}/mark-planted`, {
        planted_date: plantingData.planting_date,
        planted_quantity: plantingData.planting_quantity
      });
      
      if (response.ok) {
        alert('Seedling marked as planted successfully! MAO has been notified.');
        setShowPlantingModal(false);
        setPlantingData({
          planting_date: new Date().toISOString().split('T')[0],
          planting_location: '',
          planting_notes: '',
          planting_photo_1: '',
          planting_photo_2: '',
          planting_photo_3: ''
        });
        fetchMySeedlings();
      } else {
        alert('Failed to mark as planted');
      }
    } catch (error) {
      console.error('Error marking as planted:', error);
      alert('Failed to mark as planted');
    }
  };

  // Mock stats - replace with real API data
  const stats = {
    totalSeedlings: Array.isArray(seedlings) ? seedlings.reduce((sum, s) => sum + s.quantity_distributed, 0) : 0,
    activePlantings: Array.isArray(seedlings) ? seedlings.filter(s => s.status === 'planted').length : 0,
    farmArea: user?.farmAreaHectares || 0,
    nextHarvest: '2 weeks'
  };

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
        bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white 
        transition-[width,transform] duration-300 ease-in-out flex flex-col shadow-2xl
        md:relative md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-700 overflow-hidden">
          <div className={`
            transition-all duration-300 ease-in-out whitespace-nowrap
            ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
          `}>
            <h1 className="text-lg md:text-xl font-bold">Farmer Portal</h1>
            <p className="text-xs text-blue-300">Abaca Management</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-all duration-200 md:block hidden flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-700 rounded-lg transition md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'dashboard' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentPage('seedlings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'seedlings' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <Sprout className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>My Seedlings</span>
          </button>

          <button
            onClick={() => setCurrentPage('monitoring')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'monitoring' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Farm Monitoring</span>
          </button>

          <button
            onClick={() => setCurrentPage('harvest')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'harvest' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <Package className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Harvest Records</span>
          </button>

          <button
            onClick={() => setCurrentPage('track-deliveries')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'track-deliveries' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <Truck className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Track Deliveries</span>
          </button>

          <button
            onClick={() => {
              setCurrentPage('sales-report');
              setShowSalesForm(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === 'sales-report' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' : 'hover:bg-slate-700'
            } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Sales Reports</span>
          </button>

        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700 overflow-hidden">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600 rounded-lg transition-all duration-200 ${
              !sidebarOpen && !isMobile ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 shadow-sm">
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
                 currentPage === 'seedlings' ? 'My Seedlings' :
                 currentPage === 'harvest' ? 'Harvest Records' :
                 currentPage === 'monitoring' ? 'Farm Monitoring' :
                 currentPage === 'sales-report' ? (showSalesForm ? 'Submit Sales Report' : 'Sales Reports') :
                 currentPage === 'track-deliveries' ? 'Track My Deliveries' :
                 'My Profile'}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Welcome back, {user?.fullName || 'Farmer'}!</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition relative hidden sm:block"
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
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
                      <h3 className="text-white font-bold text-sm">Notifications</h3>
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
                          <p className="text-sm text-gray-500">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                  notif.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
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
                          className="text-xs text-green-600 hover:text-green-700 font-semibold"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-gray-800">{user?.fullName || 'Farmer'}</p>
                  <p className="text-xs text-gray-500">{user?.associationName || 'Independent Farmer'}</p>
                </div>
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-green-500 shadow-lg"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
                    {user?.fullName?.charAt(0) || 'F'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8">
          {currentPage === 'dashboard' && (
            <>
              {/* NEW DATA-DRIVEN DASHBOARD */}
              <div className="space-y-6">


              </div>

              {/* Modern Agriculture Analytics Dashboard */}
              {(() => {
                const distributionData = generateDistributionData();
                const totalDistributed = distributionData.reduce((sum: number, item: any) => sum + (item.seedlings || 0), 0);
                const totalPlanted = distributionData.reduce((sum: number, item: any) => sum + (item.planted || 0), 0);
                // Use direct stats instead of calculating from revenueData
                const totalRevenue = harvestStats.totalRevenue;
                const totalFiberKg = harvestStats.totalFiberKg;

                console.log('📊 Dashboard KPI Display:', {
                  totalRevenue,
                  totalFiberKg,
                  harvestStats
                });

                return (
                  <div className="space-y-8">
                    {/* Analytics Dashboard Header */}
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">Abaca Farm Analytics Dashboard</h1>
                      <p className="text-gray-600">Comprehensive insights into your farm performance and productivity</p>
                    </div>

                    {/* 1. KPI Cards Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                      {/* Seedlings Received */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Package className="w-7 h-7 text-emerald-600" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Seedlings Received</p>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">{totalDistributed.toLocaleString()}</h3>
                        <p className="text-sm text-gray-600">Total distributed to you</p>
                      </div>

                      {/* Seedlings Planted */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Leaf className="w-7 h-7 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Seedlings Planted</p>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">{totalPlanted.toLocaleString()}</h3>
                        <p className="text-sm text-gray-600">Total seedlings planted</p>
                      </div>

                      {/* Fiber Harvested */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Activity className="w-7 h-7 text-orange-600" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Fiber Harvested</p>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">{totalFiberKg.toLocaleString()} <span className="text-2xl">kg</span></h3>
                        <p className="text-sm text-gray-600">Total fiber production</p>
                      </div>

                      {/* Total Revenue */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <span className="text-3xl font-bold text-purple-600">₱</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Revenue</p>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">₱{totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'K' : totalRevenue.toFixed(2)}</h3>
                        <p className="text-sm text-gray-600">Total earnings from sales</p>
                      </div>

                      {/* Farm Status */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Farm Status</p>
                        <h3 className="text-4xl font-bold text-green-600 mb-2">Healthy</h3>
                        <p className="text-sm text-gray-600">Latest monitoring result</p>
                      </div>

                      {/* Delivery Status */}
                      <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Truck className="w-7 h-7 text-cyan-600" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Status</p>
                        <h3 className="text-4xl font-bold text-cyan-600 mb-2">Active</h3>
                        <p className="text-sm text-gray-600">Ongoing deliveries</p>
                      </div>
                    </div>

                    {/* 2. Seedling Distribution Trends */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seedling Distribution Trends</h2>
                          <p className="text-sm text-gray-600">Monthly comparison of distributed vs planted seedlings</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Toggle */}
                          <div className="inline-flex bg-gray-100 rounded-xl p-1">
                            <button
                              onClick={() => setViewMode('monthly')}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                viewMode === 'monthly'
                                  ? 'bg-white text-emerald-600 shadow-md'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => setViewMode('yearly')}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                viewMode === 'yearly'
                                  ? 'bg-white text-emerald-600 shadow-md'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Yearly
                            </button>
                          </div>
                          {viewMode === 'monthly' && (
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(Number(e.target.value))}
                              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <span className="text-gray-700 font-medium">Distributed</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-gray-700 font-medium">Planted</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorSeedlings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorPlanted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey={viewMode === 'monthly' ? 'month' : 'year'} 
                            stroke="#6b7280"
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            tickFormatter={(value) => value.toLocaleString()}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: 'none',
                              borderRadius: '16px',
                              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                              padding: '16px 20px'
                            }}
                            labelStyle={{ fontWeight: 700, marginBottom: '10px', fontSize: '14px' }}
                            itemStyle={{ padding: '6px 0', fontSize: '13px', fontWeight: 600 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="seedlings" 
                            stroke="#10b981" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorSeedlings)" 
                            name="Distributed"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="planted" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorPlanted)" 
                            name="Planted"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 3. Abaca Fiber Production Over Time */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Abaca Fiber Production Over Time</h2>
                          <p className="text-sm text-gray-600">Track your fiber harvest trends</p>
                        </div>
                        <div className="inline-flex bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                              viewMode === 'monthly'
                                ? 'bg-white text-orange-600 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            onClick={() => setViewMode('yearly')}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                              viewMode === 'yearly'
                                ? 'bg-white text-orange-600 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorFiber" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey={viewMode === 'monthly' ? 'month' : 'year'} 
                            stroke="#6b7280"
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            label={{ value: 'Fiber (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontWeight: 700 } }}
                            tickFormatter={(value) => value.toLocaleString()}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: 'none',
                              borderRadius: '16px',
                              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                              padding: '16px 20px'
                            }}
                            labelStyle={{ fontWeight: 700, marginBottom: '10px', fontSize: '14px' }}
                            formatter={(value: number) => [`${value.toLocaleString()} kg`, 'Fiber Production']}
                            itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="fiberKg" 
                            stroke="#f97316" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorFiber)" 
                            name="Fiber Production"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 4. Sales & Revenue Analytics */}
                    <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales & Revenue Analytics</h2>
                          <p className="text-sm text-gray-600">Track revenue performance and sales trends</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="inline-flex bg-gray-100 rounded-xl p-1">
                            <button
                              onClick={() => setViewMode('monthly')}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                viewMode === 'monthly'
                                  ? 'bg-white text-purple-600 shadow-md'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => setViewMode('yearly')}
                              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                viewMode === 'yearly'
                                  ? 'bg-white text-purple-600 shadow-md'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Yearly
                            </button>
                          </div>
                          <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                            <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Total Revenue</p>
                            <p className="text-2xl font-bold text-purple-900">₱{(totalRevenue / 1000).toFixed(1)}K</p>
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis 
                            dataKey={viewMode === 'monthly' ? 'month' : 'year'} 
                            stroke="#6b7280"
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            style={{ fontSize: '13px', fontWeight: 600 }}
                            label={{ value: 'Revenue (₱)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontWeight: 700 } }}
                            tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}K`}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: 'none',
                              borderRadius: '16px',
                              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
                              padding: '16px 20px'
                            }}
                            labelStyle={{ fontWeight: 700, marginBottom: '10px', fontSize: '14px' }}
                            formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Revenue']}
                            itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#a855f7" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            name="Revenue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {currentPage === 'seedlings' && (
            <>
              {/* Modern Filters with Glassmorphism - UserManagement Style */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search by variety, source, or remarks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full md:w-56">
                    <div className="relative">
                      <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200 appearance-none cursor-pointer font-medium"
                      >
                        <option value="all">All Status</option>
                        <option value="distributed">📦 Distributed</option>
                        <option value="planted">✓ Planted</option>
                        <option value="damaged">✗ Damaged</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading your seedlings...</p>
                </div>
              ) : filteredSeedlings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-gray-200">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Sprout className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Records Found</h3>
                  <p className="text-gray-600 mb-4">
                    {seedlings.length === 0 
                      ? "You haven't received any seedlings from MAO Culiram yet" 
                      : "No seedlings match your search criteria"}
                  </p>
                  {seedlings.length === 0 && (
                    <p className="text-sm text-gray-500">Contact MAO Culiram for seedling distribution</p>
                  )}
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Photo
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Sprout className="w-4 h-4" />
                              Variety & Date
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Quantity
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4" />
                              Source
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Batch ID
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Remarks
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Status
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {filteredSeedlings
                          .slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage)
                          .map((seedling) => (
                          <tr key={seedling.distribution_id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-200 group">
                            {/* Photo */}
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-200 flex-shrink-0 shadow-md">
                                {(() => {
                                  // Check all possible photo fields - photos are in the parent association distribution
                                  const photoUrl = seedling.association_seedling_distributions?.seedling_photo || 
                                                   seedling.association_seedling_distributions?.packaging_photo || 
                                                   seedling.association_seedling_distributions?.quality_photo ||
                                                   seedling.seedling_photo || 
                                                   seedling.packaging_photo || 
                                                   seedling.quality_photo;
                                  
                                  // Debug log for first render
                                  if (seedling.distribution_id && !(window as any).photoDebugLogged) {
                                    console.log('🖼️ Photo check for seedling:', {
                                      id: seedling.distribution_id,
                                      seedling_photo: seedling.seedling_photo ? 'exists' : 'null',
                                      packaging_photo: seedling.packaging_photo ? 'exists' : 'null',
                                      quality_photo: seedling.quality_photo ? 'exists' : 'null',
                                      photoUrl: photoUrl ? photoUrl.substring(0, 50) + '...' : 'none'
                                    });
                                    (window as any).photoDebugLogged = true;
                                  }
                                  
                                  if (photoUrl && photoUrl.trim() !== '') {
                                    return (
                                      <img 
                                        src={photoUrl} 
                                        alt="Seedling" 
                                        className="w-full h-full object-cover"
                                        onLoad={() => console.log('✅ Image loaded successfully')}
                                        onError={(e) => {
                                          console.error('❌ Image failed to load:', {
                                            url: photoUrl.substring(0, 100),
                                            error: e
                                          });
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>';
                                          }
                                        }}
                                      />
                                    );
                                  }
                                  
                                  console.log('⚠️ No photo URL found, showing icon');
                                  return (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Sprout className="w-6 h-6 text-emerald-600" />
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Variety & Date */}
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{seedling.variety}</div>
                              <div className="text-xs text-gray-500">{new Date(seedling.date_distributed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="font-medium text-gray-900">{seedling.quantity_distributed} seedlings</div>
                            </td>

                            {/* Source */}
                            <td className="px-6 py-4 text-sm">
                              <div className="font-medium text-gray-900">
                                {seedling.association_seedling_distributions?.source_supplier || 
                                 seedling.source_supplier || 
                                 seedling.association_officers?.association_name || 
                                 'MAO Culiram'}
                              </div>
                            </td>

                            {/* Batch ID */}
                            <td className="px-6 py-4 text-sm">
                              <div className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                                #{seedling.distribution_id?.slice(0, 8).toUpperCase() || 'N/A'}
                              </div>
                            </td>

                            {/* Remarks */}
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {seedling.remarks || '-'}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                seedling.status === 'planted' ? 'bg-emerald-100 text-emerald-700' :
                                seedling.status === 'distributed' ? 'bg-blue-100 text-blue-700' :
                                seedling.status === 'damaged' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {seedling.status === 'planted' ? 'Complete' : seedling.status.charAt(0).toUpperCase() + seedling.status.slice(1)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedSeedling(seedling);
                                    setShowViewModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md group-hover:bg-blue-50"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                {seedling.status === 'planted' ? (
                                  <div className="p-2 text-emerald-600" title="Already Planted">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedSeedling(seedling);
                                      setShowPlantingModal(true);
                                    }}
                                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                                    title="Mark as Planted"
                                  >
                                    <Sprout className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls - UserManagement Style */}
                  <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Items per page */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Show entries:</span>
                        <div className="flex gap-2">
                          {[10, 20, 50].map((size) => (
                            <button
                              key={size}
                              onClick={() => {
                                setItemsPerPage(size);
                                setCurrentPageNum(1);
                              }}
                              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                                itemsPerPage === size
                                  ? 'bg-emerald-500 text-white shadow-lg'
                                  : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-emerald-50 border border-gray-200'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Page info and navigation */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          Showing {((currentPageNum - 1) * itemsPerPage) + 1} to {Math.min(currentPageNum * itemsPerPage, filteredSeedlings.length)} of {filteredSeedlings.length} entries
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
                            disabled={currentPageNum === 1}
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                              currentPageNum === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPageNum(prev => Math.min(Math.ceil(filteredSeedlings.length / itemsPerPage), prev + 1))}
                            disabled={currentPageNum >= Math.ceil(filteredSeedlings.length / itemsPerPage)}
                            className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                              currentPageNum >= Math.ceil(filteredSeedlings.length / itemsPerPage)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {currentPage === 'harvest' && (
            <FarmerHarvestView />
          )}

          {currentPage === 'monitoring' && (
            <FarmerMonitoringView />
          )}

          {/* Sales Report Page */}
          {currentPage === 'sales-report' && (
            <>
              {showSalesForm ? (
                <SalesReportForm
                  onSubmit={(report) => {
                    console.log('Sales report submitted:', report);
                    alert('Sales report submitted successfully!');
                    setShowSalesForm(false); // Go back to list view after submit
                  }}
                  onCancel={() => setShowSalesForm(false)} // Go back to list view
                />
              ) : (
                <SalesReportsList 
                  onAddNewReport={() => setShowSalesForm(true)}
                />
              )}
            </>
          )}

          {/* Track Deliveries Page */}
          {currentPage === 'track-deliveries' && (
            <FarmerDeliveryTracking />
          )}

          {currentPage === 'profile' && (
            <div className="bg-white rounded-xl shadow-lg">
              {/* Profile Header */}
              <div className="p-6 bg-gradient-to-r from-green-800 via-green-700 to-green-800 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-4">
                  <User className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{isEditMode ? 'Edit Profile' : 'My Profile'}</h2>
                    <p className="text-green-100 text-sm">{isEditMode ? 'Update your information' : 'View your details'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg transition-all flex items-center gap-2 text-white font-medium border border-white/30"
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-4 h-4" />
                      View Mode
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4" />
                      Edit Mode
                    </>
                  )}
                </button>
              </div>

              {loadingProfile ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Profile Photo Section */}
                  <div className="bg-gradient-to-br from-green-50 via-gray-50 to-green-50 rounded-2xl p-8 mb-6 relative overflow-hidden border-2 border-gray-200">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt="Profile" 
                            className="w-28 h-28 rounded-full object-cover border-4 border-green-500 shadow-xl"
                          />
                        ) : (
                          <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white shadow-xl text-white">
                            {farmerData?.full_name?.charAt(0) || 'F'}
                          </div>
                        )}
                        {isEditMode && (
                          <label className="absolute bottom-0 right-0 p-2.5 bg-green-600 rounded-full shadow-lg hover:bg-green-700 transition cursor-pointer group-hover:scale-110">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleProfilePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                            {uploadingPhoto ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Camera className="w-4 h-4 text-white" />
                            )}
                          </label>
                        )}
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-800">{farmerData?.full_name || user?.fullName}</h3>
                        <p className="text-gray-600 font-semibold text-lg mt-1">{farmerData?.association_name || 'Independent Farmer'}</p>
                        <p className="text-green-600 font-medium mt-2">{farmerData?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                      <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg">Personal Information</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Full Name</label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={editFormData?.full_name || ''}
                              onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.full_name || 'Not provided'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Sex</label>
                          {isEditMode ? (
                            <select
                              value={editFormData?.sex || ''}
                              onChange={(e) => setEditFormData({...editFormData, sex: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.sex || 'Not provided'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Age</label>
                          {isEditMode ? (
                            <input
                              type="number"
                              value={editFormData?.age || ''}
                              onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.age || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                      <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg">Contact Information</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Email</label>
                          <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Contact Number</label>
                          {isEditMode ? (
                            <input
                              type="tel"
                              value={editFormData?.contact_number || ''}
                              onChange={(e) => setEditFormData({...editFormData, contact_number: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                              placeholder="09171234567"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.contact_number || 'Not provided'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Address</label>
                          {isEditMode ? (
                            <textarea
                              value={editFormData?.address || ''}
                              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800 resize-none"
                              rows={2}
                              placeholder="Complete address"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.address || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                      <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg">Location</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Barangay</label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={editFormData?.barangay || ''}
                              onChange={(e) => setEditFormData({...editFormData, barangay: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.barangay || 'Not provided'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Municipality</label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={editFormData?.municipality || ''}
                              onChange={(e) => setEditFormData({...editFormData, municipality: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.municipality || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Association Information */}
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all">
                      <h4 className="font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                          <UsersIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg">Association</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-gray-600 mb-2 block uppercase tracking-wide">Association Name</label>
                          {isEditMode ? (
                            <input
                              type="text"
                              value={editFormData?.association_name || ''}
                              onChange={(e) => setEditFormData({...editFormData, association_name: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium text-gray-800"
                            />
                          ) : (
                            <p className="font-semibold text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{farmerData?.association_name || 'Not provided'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end items-center gap-3">
                    {isEditMode && (
                      <>
                        <button
                          onClick={() => {
                            setEditFormData(farmerData);
                            setIsEditMode(false);
                          }}
                          className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveFarmerProfile}
                          disabled={savingProfile}
                          className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {savingProfile ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Planting Modal */}
      {showPlantingModal && selectedSeedling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Mark Seedlings as Planted</h2>
              <button
                onClick={() => {
                  setShowPlantingModal(false);
                  setPlantingData({
                    planting_date: new Date().toISOString().split('T')[0],
                    planting_location: '',
                    planting_notes: '',
                    planting_photo_1: '',
                    planting_photo_2: '',
                    planting_photo_3: ''
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Seedling Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-900 mb-2">Seedling Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-700">Variety:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.variety}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Quantity:</span>
                    <span className="ml-2 font-medium text-green-900">{selectedSeedling.quantity_distributed}</span>
                  </div>
                </div>
              </div>

              {/* Planting Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleMarkAsPlanted(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
                    <input
                      type="date"
                      required
                      value={plantingData.planting_date}
                      onChange={(e) => setPlantingData({ ...plantingData, planting_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Location</label>
                    <input
                      type="text"
                      value={plantingData.planting_location}
                      onChange={(e) => setPlantingData({ ...plantingData, planting_location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Farm Section A, Near river"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planting Method</label>
                    <textarea
                      rows={3}
                      value={plantingData.planting_notes}
                      onChange={(e) => setPlantingData({ ...plantingData, planting_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe the planting method used..."
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">📸 Planting Photos (Optional)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((num) => (
                        <div key={num}>
                          <label className="block text-sm text-gray-600 mb-2">Photo {num}</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-green-500 transition">
                            {plantingData[`planting_photo_${num}` as keyof typeof plantingData] ? (
                              <div className="relative">
                                <img 
                                  src={plantingData[`planting_photo_${num}` as keyof typeof plantingData] as string} 
                                  alt={`Planting ${num}`} 
                                  className="w-full h-24 object-cover rounded" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setPlantingData({ ...plantingData, [`planting_photo_${num}`]: '' })}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <Sprout className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Upload</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, num)}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB per photo</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlantingModal(false);
                      setPlantingData({
                        planting_date: new Date().toISOString().split('T')[0],
                        planting_location: '',
                        planting_notes: '',
                        planting_photo_1: '',
                        planting_photo_2: '',
                        planting_photo_3: ''
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    ✓ Mark as Planted
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSeedling && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-800">Seedling Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Distribution Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-green-600" />
                  Distribution Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Variety</p>
                    <p className="font-medium text-gray-900">{selectedSeedling.variety}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-medium text-gray-900">{selectedSeedling.quantity_distributed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Distributed</p>
                    <p className="font-medium text-gray-900">{new Date(selectedSeedling.date_distributed).toLocaleDateString()}</p>
                  </div>
                  {selectedSeedling.source_supplier && (
                    <div>
                      <p className="text-sm text-gray-600">Source/Supplier</p>
                      <p className="font-medium text-gray-900">{selectedSeedling.source_supplier}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedSeedling.status === 'planted' ? 'bg-green-100 text-green-700' :
                      selectedSeedling.status === 'distributed' ? 'bg-blue-100 text-blue-700' :
                      selectedSeedling.status === 'damaged' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedSeedling.status}
                    </span>
                  </div>
                  {selectedSeedling.organization && (
                    <div>
                      <p className="text-sm text-gray-600">Distributed By</p>
                      <p className="font-medium text-gray-900">{selectedSeedling.organization.full_name}</p>
                    </div>
                  )}
                  {selectedSeedling.remarks && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p className="font-medium text-gray-900">{selectedSeedling.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Distribution Photos */}
              {(selectedSeedling.seedling_photo || selectedSeedling.packaging_photo || selectedSeedling.quality_photo) && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4">📸 Distribution Photos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSeedling.seedling_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Seedling Photo</p>
                        <img 
                          src={selectedSeedling.seedling_photo} 
                          alt="Seedling" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.packaging_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Distribution Photo</p>
                        <img 
                          src={selectedSeedling.packaging_photo} 
                          alt="Packaging" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.quality_photo && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Quality Photo</p>
                        <img 
                          src={selectedSeedling.quality_photo} 
                          alt="Quality" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Planting Information (if planted) */}
              {selectedSeedling.status === 'planted' && selectedSeedling.planting_date && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Planting Information
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-700">Planting Date</p>
                        <p className="font-medium text-green-900">{new Date(selectedSeedling.planting_date).toLocaleDateString()}</p>
                      </div>
                      {selectedSeedling.planting_location && (
                        <div>
                          <p className="text-sm text-green-700">Location</p>
                          <p className="font-medium text-green-900">{selectedSeedling.planting_location}</p>
                        </div>
                      )}
                      {selectedSeedling.planting_notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-green-700">Planting Method</p>
                          <p className="font-medium text-green-900">{selectedSeedling.planting_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Planting Photos (if planted) */}
              {(selectedSeedling.planting_photo_1 || selectedSeedling.planting_photo_2 || selectedSeedling.planting_photo_3) && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">🌱 Your Planting Photos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSeedling.planting_photo_1 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Photo 1</p>
                        <img 
                          src={selectedSeedling.planting_photo_1} 
                          alt="Planting 1" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_2 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Photo 2</p>
                        <img 
                          src={selectedSeedling.planting_photo_2} 
                          alt="Planting 2" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                        />
                      </div>
                    )}
                    {selectedSeedling.planting_photo_3 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Photo 3</p>
                        <img 
                          src={selectedSeedling.planting_photo_3} 
                          alt="Planting 3" 
                          className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
