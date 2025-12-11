import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Share2,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Sprout,
  Layers,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShieldCheck,
  Truck
} from 'lucide-react';
import AssociationInventory from './AssociationInventory';
import AssociationSeedlingDistribution from './AssociationSeedlingDistribution';
import CUSAFAInventory from '../MAO/CUSAFAInventory';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';
import CUSAFAFiberDeliveries from './CUSAFAFiberDeliveries';

type DashboardPage = 'overview' | 'inventory' | 'distribution' | 'reports' | 'fiber-inventory' | 'buyer-prices' | 'fiber-deliveries';

interface DashboardStats {
  totalReceivedCount: number;
  totalFarmerDistributions: number;
  totalReceivedQuantity: number;
  totalDistributedQuantity: number;
  totalAvailableQuantity: number;
  plantedQuantity: number;
  plantingRate: number;
}

interface CUSAFADashboardProps {
  onLogout: () => void;
}

const CUSAFADashboard: React.FC<CUSAFADashboardProps> = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState<DashboardPage>('inventory');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalReceivedCount: 0,
    totalFarmerDistributions: 0,
    totalReceivedQuantity: 0,
    totalDistributedQuantity: 0,
    totalAvailableQuantity: 0,
    plantedQuantity: 0,
    plantingRate: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    loadDashboardStats();
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

  const loadDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoadingStats(false);
        return;
      }

      const [associationRes, farmerRes] = await Promise.all([
        fetch('http://localhost:3001/api/association-seedlings/association/received', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/association-seedlings/association/farmer-distributions', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!associationRes.ok || !farmerRes.ok) {
        setLoadingStats(false);
        return;
      }

      const associationData = await associationRes.json();
      const farmerData = await farmerRes.json();

      const totalReceivedQuantity = Array.isArray(associationData)
        ? associationData.reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const totalDistributedQuantity = Array.isArray(farmerData)
        ? farmerData.reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const plantedQuantity = Array.isArray(farmerData)
        ? farmerData
            .filter((item: any) => item.status === 'planted')
            .reduce((sum: number, item: any) => sum + (item.quantity_distributed || 0), 0)
        : 0;

      const plantingRate = totalDistributedQuantity > 0
        ? (plantedQuantity / totalDistributedQuantity) * 100
        : 0;

      setStats({
        totalReceivedCount: Array.isArray(associationData) ? associationData.length : 0,
        totalFarmerDistributions: Array.isArray(farmerData) ? farmerData.length : 0,
        totalReceivedQuantity,
        totalDistributedQuantity,
        totalAvailableQuantity: Math.max(totalReceivedQuantity - totalDistributedQuantity, 0),
        plantedQuantity,
        plantingRate,
      });
    } catch (error) {
      console.error('Error loading CUSAFA stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const navItems: { id: DashboardPage; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Seedling Inventory', icon: Sprout },
    { id: 'fiber-inventory', label: 'Fiber Inventory', icon: Package },
    { id: 'fiber-deliveries', label: 'Fiber Deliveries', icon: Truck },
    { id: 'distribution', label: 'Distribution', icon: Share2 },
    { id: 'buyer-prices', label: 'Buyer Prices', icon: TrendingUp },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-100">CUSAFA Operations</p>
            <h2 className="text-3xl font-bold mt-1">Central Seedling Distribution Hub</h2>
            <p className="mt-2 text-blue-50 max-w-2xl">
              Monitor incoming seedlings from MAO, manage association inventory, and coordinate farmer distributions in one streamlined workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-4">
            <ShieldCheck className="w-10 h-10 text-white" />
            <div>
              <p className="text-sm text-blue-100">Current Officer</p>
              <p className="text-lg font-semibold">
                {user?.fullName || 'CUSAFA Officer'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-500">From MAO</span>
          </div>
          <p className="text-sm text-gray-500">Total Seedlings Received</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalReceivedQuantity.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalReceivedCount} distributions</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-purple-500">To Farmers</span>
          </div>
          <p className="text-sm text-gray-500">Distributed Seedlings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalDistributedQuantity.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalFarmerDistributions} farmer distributions</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-500">Available</span>
          </div>
          <p className="text-sm text-gray-500">Inventory Remaining</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalAvailableQuantity.toLocaleString()}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{
                width: `${stats.totalReceivedQuantity > 0 ? (stats.totalAvailableQuantity / stats.totalReceivedQuantity) * 100 : 0}%`,
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Ready for distribution</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-500">Planted</span>
          </div>
          <p className="text-sm text-gray-500">Planting Progress</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.plantedQuantity.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {stats.plantingRate >= 50 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <p className="text-sm text-gray-600">{stats.plantingRate.toFixed(1)}% of distributed seedlings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Upcoming Activities</p>
              <h3 className="text-lg font-semibold text-gray-900">Distribution Calendar</h3>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Plan distributions based on remaining stock and farmer requests.</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">Next Review</p>
              <p className="text-lg font-semibold text-gray-900">Every Monday</p>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">Reporting Window</p>
              <p className="text-lg font-semibold text-gray-900">1st week monthly</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentPage('inventory')}
              className="p-4 rounded-2xl border border-blue-100 bg-blue-50 text-left hover:border-blue-200 transition shadow-sm"
            >
              <p className="text-sm text-blue-600 font-semibold">Review MAO Inventory</p>
              <p className="text-xs text-blue-500 mt-1">Track incoming distributions</p>
            </button>
            <button
              onClick={() => setCurrentPage('distribution')}
              className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 text-left hover:border-emerald-200 transition shadow-sm"
            >
              <p className="text-sm text-emerald-600 font-semibold">Distribute to Farmers</p>
              <p className="text-xs text-emerald-500 mt-1">Launch distribution workflow</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentPage === 'overview') {
      return loadingStats ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500 mt-4">Loading dashboard insights...</span>
          </div>
        </div>
      ) : (
        renderOverview()
      );
    }

    if (currentPage === 'inventory') {
      return <AssociationInventory />;
    }

    if (currentPage === 'fiber-inventory') {
      return <CUSAFAInventory />;
    }

    if (currentPage === 'fiber-deliveries') {
      return <CUSAFAFiberDeliveries />;
    }

    if (currentPage === 'distribution') {
      return <AssociationSeedlingDistribution />;
    }

    if (currentPage === 'buyer-prices') {
      return <BuyerPriceListingsViewer userRole="cusafa" />;
    }

    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
        Reports & analytics coming soon.
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-50">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-72' : sidebarOpen ? 'w-72' : 'w-20'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          bg-gradient-to-b from-slate-900 to-slate-800 text-white 
          transition-all duration-300 flex flex-col shadow-2xl
          md:relative md:translate-x-0
        `}
      >
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/10">
          {(isMobile || sidebarOpen) && (
            <div>
              <h1 className="text-lg md:text-xl font-bold">CUSAFA Center</h1>
              <p className="text-xs text-slate-300">Seedling Distribution</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition md:block hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm font-medium ${
                  active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/5 text-white/80 hover:bg-white/10'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <Icon className="w-5 h-5" />
                {(isMobile || sidebarOpen) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/20 text-red-100 hover:bg-red-500/30 transition ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {(isMobile || sidebarOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition mr-2"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide hidden sm:block">CUSAFA Dashboard</p>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                {currentPage === 'overview'
                  ? 'Overview'
                  : currentPage === 'inventory'
                  ? 'Seedling Inventory'
                  : currentPage === 'distribution'
                  ? 'Farmer Distribution'
                  : currentPage === 'buyer-prices'
                  ? 'Buyer Price Listings'
                  : 'Reports & Analytics'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadDashboardStats}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                <TrendingUp className="w-4 h-4" /> Refresh Stats
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-gray-200 hover:bg-gray-50"
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold text-xs md:text-sm">
                    {(user?.fullName || 'CU')
                      .split(' ')
                      .map((part: string) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-800">{user?.fullName || 'CUSAFA Officer'}</p>
                    <p className="text-xs text-gray-500">{user?.associationName || 'Central Union'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg z-10">
                    <button
                      onClick={() => setShowProfileDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default CUSAFADashboard;
