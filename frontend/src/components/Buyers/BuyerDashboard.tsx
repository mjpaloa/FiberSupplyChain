import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/apiClient';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Package,
  Bell
} from 'lucide-react';
import BuyerAnalytics from './BuyerAnalytics';
import FiberPurchaseForm from './FiberPurchaseForm';
import BuyerSalesPage from './BuyerSalesPage';
import BuyerTransactions from './BuyerTransactions';
import BuyerProfile from './BuyerProfile';
import BuyerPriceListingFormWithClasses from './BuyerPriceListingFormWithClasses';
import BuyerPriceListings from './BuyerPriceListings';
import BuyerInventory from './BuyerInventory';

interface BuyerDashboardProps {
  onLogout: () => void;
}

type DashboardPage = 'dashboard' | 'inventory' | 'purchase' | 'sales' | 'transactions' | 'profile' | 'create-listing' | 'my-listings';

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    company: '',
    contact: ''
  });

  useEffect(() => {
    fetchBuyerProfile();
    fetchNotifications();
  }, []);

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

  const fetchBuyerProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await apiGet('/api/buyers/profile');
      const data = await response.json();
      setBuyerInfo({
        name: data.buyer?.full_name || 'Buyer',
        email: data.buyer?.email || '',
        company: data.buyer?.company_name || '',
        contact: data.buyer?.contact_number || ''
      });
    } catch (error) {
      console.error('Error fetching buyer profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch recent purchases
      const purchasesRes = await fetch('https://easyabaca-api.vercel.app/api/buyer-purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch recent sales
      const salesRes = await fetch('https://easyabaca-api.vercel.app/api/buyer-sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const notificationsList: any[] = [];
      
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'My Inventory', icon: Package },
    { id: 'create-listing', label: 'Create Price Listing', icon: ShoppingCart },
    { id: 'my-listings', label: 'My Price Listings', icon: FileText },
    { id: 'purchase', label: 'Purchase Fiber', icon: ShoppingCart },
    { id: 'transactions', label: 'Transactions', icon: FileText }
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <BuyerAnalytics />;
      case 'inventory':
        return <BuyerInventory />;
      case 'create-listing':
        return <BuyerPriceListingFormWithClasses />;
      case 'my-listings':
        return <BuyerPriceListings />;
      case 'purchase':
        return <FiberPurchaseForm />;
      case 'sales':
        return <BuyerSalesPage />;
      case 'transactions':
        return <BuyerTransactions />;
      case 'profile':
        return <BuyerProfile />;
      default:
        return <BuyerAnalytics />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
            <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">Buyer Portal</h1>
            <p className="text-xs text-slate-400 whitespace-nowrap">Fiber Marketplace</p>
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as DashboardPage)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600'
                    : 'hover:bg-slate-700'
                } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-all duration-200 ${
              !sidebarOpen && !isMobile ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${(isMobile || sidebarOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'} overflow-hidden`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
                
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500 hidden md:block">Welcome back, {buyerInfo.name}</p>
                </div>
              </div>

              {/* User Profile & Notifications */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition relative"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="fixed md:absolute right-4 md:right-0 left-4 md:left-auto mt-2 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-64 md:max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 bg-${notification.color}-500 rounded-full mt-2`}></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No notifications yet</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {buyerInfo.name ? buyerInfo.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <span className="font-medium text-sm text-gray-800">{buyerInfo.name || 'Buyer'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{buyerInfo.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{buyerInfo.email}</p>
                        <p className="text-sm text-gray-500 mt-1">{buyerInfo.company}</p>
                        <p className="text-xs text-gray-400 mt-1">{buyerInfo.contact}</p>
                      </div>
                      <button
                        onClick={() => setCurrentPage('profile')}
                        className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} />
                        <span className="font-medium">View Profile</span>
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <LogOut size={16} />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="p-4 md:p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default BuyerDashboard;
