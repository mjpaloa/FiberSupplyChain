import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import { apiGet } from '../../utils/apiClient';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  User,
  Package,
  Bell,
  BookOpen
} from 'lucide-react';
import { EditorialShell, EditorialNavItem, KeepAlivePages, useCacheState } from '../Shared/EditorialUI';
import BuyerAnalytics from './BuyerAnalytics';
import FiberPurchaseForm from './FiberPurchaseForm';
import BuyerSalesPage from './BuyerSalesPage';
import BuyerTransactions from './BuyerTransactions';
import BuyerProfile from './BuyerProfile';
import BuyerPriceListings from './BuyerPriceListings';
import BuyerInventory from './BuyerInventory';
import BuyerUserManual from './BuyerUserManual';

interface BuyerDashboardProps {
  onLogout: () => void;
}

type DashboardPage = 'dashboard' | 'manual' | 'inventory' | 'purchase' | 'sales' | 'transactions' | 'profile' | 'create-listing' | 'my-listings';

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    company: '',
    contact: '',
    profilePicture: null as string | null
  });

  const { version, manualTick } = useCacheState();
  const lastMetaVersionRef = useRef(version);
  const prevManualTickRef = useRef(manualTick);

  useEffect(() => {
    fetchBuyerProfile();
    fetchNotifications();
  }, []);

  // Re-fetch header profile & notifications only when cache invalidates (mutation / manual refresh)
  useEffect(() => {
    if (
      lastMetaVersionRef.current !== version ||
      prevManualTickRef.current !== manualTick
    ) {
      lastMetaVersionRef.current = version;
      prevManualTickRef.current = manualTick;
      fetchBuyerProfile();
      fetchNotifications();
    }
  }, [version, manualTick]);

  const fetchBuyerProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Try to fetch from API first
      try {
        const response = await apiGet('/api/buyers/profile');
        if (response.ok) {
          const data = await response.json();
          const buyer = data.buyer;
          console.log('✅ Buyer profile loaded from database:', buyer);
          
          // Map buyer data from buyers table
          setBuyerInfo({
            name: buyer?.owner_name || buyer?.business_name || user.full_name || user.ownerName || 'Buyer',
            email: buyer?.email || user.email || '',
            company: buyer?.business_name || user.company_name || user.businessName || 'My Company',
            contact: buyer?.contact_number || user.contact_number || user.phone || '',
            profilePicture: buyer?.profile_photo || user.profile_photo || user.profile_picture || null
          });
          
          // Update localStorage with fresh data
          if (buyer?.profile_photo) {
            const updatedUser = { ...user, profile_photo: buyer.profile_photo };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          // Fallback to localStorage
          console.log('Profile API unavailable, using cached data');
          setBuyerInfo({
            name: user.full_name || user.ownerName || user.username || 'Buyer',
            email: user.email || '',
            company: user.company_name || user.businessName || 'My Company',
            contact: user.contact_number || user.phone || '',
            profilePicture: user.profile_photo || user.profile_picture || null
          });
        }
      } catch (apiError) {
        console.log('Profile API error, using cached data:', apiError);
        // Fallback to localStorage
        setBuyerInfo({
          name: user.full_name || user.ownerName || user.username || 'Buyer',
          email: user.email || '',
          company: user.company_name || user.businessName || 'My Company',
          contact: user.contact_number || user.phone || '',
          profilePicture: user.profile_photo || user.profile_picture || null
        });
      }
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const notificationsList: any[] = [];
      
      // Try to fetch recent purchases (handle 404/500 gracefully)
      try {
        const purchasesRes = await fetch(`${API_BASE_URL}/api/buyer-purchases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          const recentPurchases = (purchasesData.purchases || []).slice(0, 3);
          
          recentPurchases.forEach((purchase: any) => {
            const date = new Date(purchase.created_at);
            const timeAgo = getTimeAgo(date);
            notificationsList.push({
              type: 'purchase',
              title: 'Purchase Order Confirmed',
              message: `${purchase.quantity} kg of ${purchase.fiber_quality} fiber purchased`,
              time: timeAgo,
              color: 'blue',
              date: date
            });
          });
        }
      } catch (error) {
        console.log('Purchases API unavailable');
      }
      
      // Try to fetch recent sales (handle 404 gracefully)
      try {
        const salesRes = await fetch(`${API_BASE_URL}/api/buyer-sales`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          const recentSales = (salesData.sales || []).slice(0, 3);
          
          recentSales.forEach((sale: any) => {
            const date = new Date(sale.created_at);
            const timeAgo = getTimeAgo(date);
            notificationsList.push({
              type: 'sale',
              title: 'Sale Completed',
              message: `Sold ${sale.quantity} kg of ${sale.fiber_quality} fiber`,
              time: timeAgo,
              color: 'green',
              date: date
            });
          });
        }
      } catch (error) {
        console.log('Sales API unavailable');
      }
      
      // Sort by date (most recent first)
      notificationsList.sort((a, b) => b.date.getTime() - a.date.getTime());
      setNotifications(notificationsList.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const navItems: EditorialNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', category: 'General', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { id: 'manual', label: 'User Manual', category: 'General', icon: <BookOpen className="w-[18px] h-[18px]" /> },
    { id: 'inventory', label: 'My Inventory', category: 'Inventory & Pricing', icon: <Package className="w-[18px] h-[18px]" /> },
    { id: 'my-listings', label: 'My Price Listings', category: 'Inventory & Pricing', icon: <FileText className="w-[18px] h-[18px]" /> },
    { id: 'purchase', label: 'Purchase Fiber', category: 'Purchasing & Ledger', icon: <ShoppingCart className="w-[18px] h-[18px]" /> },
    { id: 'transactions', label: 'Transactions', category: 'Purchasing & Ledger', icon: <FileText className="w-[18px] h-[18px]" /> },
  ];

  const pageMeta: Record<DashboardPage, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: `Welcome back, ${buyerInfo.name || 'Buyer'}` },
    manual: { title: 'User Manual', subtitle: 'Step-by-step guide to the Buyer Portal with screenshots and explanations.' },
    inventory: { title: 'My Inventory', subtitle: 'Manage fiber stock levels and direct sales' },
    'my-listings': { title: 'My Price Listings', subtitle: 'Published buying offers and class pricing' },
    purchase: { title: 'Purchase Fiber', subtitle: 'Record a new abaca fiber purchase from farmers' },
    sales: { title: 'My Fiber Purchases', subtitle: 'Track your fiber purchases and profits' },
    transactions: { title: 'Transactions', subtitle: 'Purchases, sales ledger, and report exports' },
    profile: { title: 'Buyer Profile', subtitle: 'Manage your company information and account security' },
    'create-listing': { title: 'Create Price Listing', subtitle: 'Publish buying rates for abaca classes' },
  };

  const buyerPages = {
    dashboard: () => <BuyerAnalytics />,
    manual: () => <BuyerUserManual />,
    inventory: () => <BuyerInventory />,
    'my-listings': () => <BuyerPriceListings />,
    purchase: () => <FiberPurchaseForm />,
    sales: () => <BuyerSalesPage />,
    transactions: () => <BuyerTransactions />,
    profile: () => <BuyerProfile />,
  };

  const currentMeta = pageMeta[currentPage] || pageMeta.dashboard;

  return (
    <EditorialShell
      brandTitle="Buyer Portal"
      brandSubtitle="Fiber marketplace"
      navItems={navItems}
      activeNavId={currentPage}
      onSelectNav={(id) => {
        setCurrentPage(id as DashboardPage);
        setShowNotificationDropdown(false);
        setShowProfileDropdown(false);
      }}
      pageTitle={currentMeta.title}
      pageSubtitle={currentMeta.subtitle}
      unreadCount={notifications.length}
      showNotifications={showNotificationDropdown}
      onToggleNotifications={() => {
        setShowNotificationDropdown((prev) => !prev);
        setShowProfileDropdown(false);
      }}
      notificationContent={
        <div>
          <div className="px-4 py-3 border-b border-gray-100 bg-[#FAFAFA] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-[11px] font-medium text-gray-500 tabular-nums">
                {notifications.length} recent
              </span>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentPage('transactions');
                    setShowNotificationDropdown(false);
                  }}
                  className="p-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        notification.color === 'green' ? 'bg-[#047857]' : 'bg-[#E59500]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notification.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No notifications yet</p>
              </div>
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-[#FAFAFA]">
            <button
              type="button"
              onClick={() => {
                setCurrentPage('transactions');
                setShowNotificationDropdown(false);
              }}
              className="w-full text-center text-xs font-semibold text-[#047857] hover:text-[#065F46] transition-colors"
            >
              View all transactions
            </button>
          </div>
        </div>
      }
      profileName={buyerInfo.name || 'Buyer'}
      profileRole={buyerInfo.company || 'Buyer Account'}
      profileAvatar={buyerInfo.profilePicture}
      showProfileMenu={showProfileDropdown}
      onToggleProfileMenu={() => {
        setShowProfileDropdown((prev) => !prev);
        setShowNotificationDropdown(false);
      }}
      profileMenuContent={
        <div>
          <div className="px-3.5 py-3 border-b border-gray-100 bg-[#FAFAFA]">
            <p className="text-xs font-semibold text-gray-900 truncate">{buyerInfo.name || 'Buyer'}</p>
            {buyerInfo.email && (
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{buyerInfo.email}</p>
            )}
            {buyerInfo.contact && (
              <p className="text-[11px] text-gray-400 truncate mt-0.5">{buyerInfo.contact}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentPage('profile');
              setShowProfileDropdown(false);
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-gray-500" />
            <span>View Profile</span>
          </button>
        </div>
      }
      onLogout={onLogout}
      logoutLabel="Sign out"
    >
      <KeepAlivePages activeId={currentPage} pages={buyerPages} />
    </EditorialShell>
  );
};

export default BuyerDashboard;
