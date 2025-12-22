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
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    company: '',
    contact: ''
  });

  useEffect(() => {
    fetchBuyerProfile();
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
        bg-gradient-to-b from-blue-600 to-blue-800 text-white 
        transition-[width,transform] duration-300 ease-in-out flex flex-col shadow-2xl
        md:relative md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-blue-500 overflow-hidden">
          <div className={`
            transition-all duration-300 ease-in-out whitespace-nowrap
            ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
          `}>
            <h1 className="text-xl md:text-2xl font-bold">Buyer Portal</h1>
            <p className="text-blue-200 text-xs md:text-sm mt-1">Fiber Marketplace</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-blue-700 rounded-lg transition-all duration-200 md:block hidden flex-shrink-0"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-blue-700 rounded-lg transition md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as DashboardPage)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg'
                    : 'hover:bg-blue-700'
                } ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`
                  whitespace-nowrap transition-all duration-300 ease-in-out font-medium
                  ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
                `}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-500">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-colors ${
              !sidebarOpen && !isMobile ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`
              whitespace-nowrap transition-all duration-300 ease-in-out font-medium
              ${(isMobile || sidebarOpen) ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 overflow-hidden'}
            `}>Logout</span>
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
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">New Purchase Order</p>
                              <p className="text-xs text-gray-600 mt-1">Your fiber purchase order has been confirmed</p>
                              <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Price Listing Updated</p>
                              <p className="text-xs text-gray-600 mt-1">Your price listing has been successfully updated</p>
                              <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Inventory Alert</p>
                              <p className="text-xs text-gray-600 mt-1">Your inventory stock is running low</p>
                              <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                            </div>
                          </div>
                        </div>
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
