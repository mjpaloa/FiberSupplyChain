import React, { useState, useEffect } from 'react';
import { Users, Package, BarChart3, Settings, LogOut, Bell, Search, Plus, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, Calendar, Sprout, Filter, Eye, DollarSign } from 'lucide-react';
import BuyerPriceListingsViewer from '../Shared/BuyerPriceListingsViewer';

interface AssociationDashboardProps {
  onLogout: () => void;
}

interface Seedling {
  seedling_id: string;
  variety: string;
  quantity_distributed: number;
  date_distributed: string;
  recipient_farmer_id?: string;
  recipient_association?: string;
  status: string;
  created_at: string;
  farmers?: {
    full_name: string;
    email: string;
  };
}

const AssociationDashboard: React.FC<AssociationDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const associationName = user.associationName || 'Association';

  useEffect(() => {
    if (activeTab === 'seedlings') {
      fetchSeedlings();
    }
  }, [activeTab]);

  const fetchSeedlings = async () => {
    setLoading(true);
    try {
      // Mock data for now - in a real app this would come from an API
      const mockSeedlings: Seedling[] = [
        {
          seedling_id: '1',
          variety: 'Bucay 1',
          quantity_distributed: 50,
          date_distributed: '2023-10-15',
          recipient_farmer_id: 'f1',
          recipient_association: 'CUSAFA',
          status: 'distributed',
          created_at: '2023-10-15',
          farmers: {
            full_name: 'Juan Dela Cruz',
            email: 'juan@example.com'
          }
        },
        {
          seedling_id: '2',
          variety: 'Bucay 2',
          quantity_distributed: 30,
          date_distributed: '2023-10-16',
          recipient_farmer_id: 'f2',
          recipient_association: 'CUSAFA',
          status: 'planted',
          created_at: '2023-10-16',
          farmers: {
            full_name: 'Maria Santos',
            email: 'maria@example.com'
          }
        },
        {
          seedling_id: '3',
          variety: 'Davao',
          quantity_distributed: 40,
          date_distributed: '2023-10-17',
          recipient_farmer_id: 'f3',
          recipient_association: 'CUSAFA',
          status: 'distributed',
          created_at: '2023-10-17',
          farmers: {
            full_name: 'Pedro Garcia',
            email: 'pedro@example.com'
          }
        }
      ];
      setSeedlings(mockSeedlings);
    } catch (error) {
      console.error('Error fetching seedlings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'distributed':
        return 'bg-blue-100 text-blue-800';
      case 'planted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'distributed':
        return <Clock className="w-4 h-4" />;
      case 'planted':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredSeedlings = seedlings.filter(seedling =>
    seedling.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seedling.farmers?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seedling.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'farmers', label: 'My Farmers', icon: Users },
    { id: 'seedlings', label: 'Seedling Distribution', icon: Package },
    { id: 'buyer-prices', label: 'Buyer Prices', icon: DollarSign },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    {
      title: 'Total Farmers',
      value: '24',
      change: '+2 this month',
      icon: Users,
      color: 'bg-blue-500',
      trend: 'up'
    },
    {
      title: 'Seedlings Received',
      value: '1,250',
      change: '+150 this month',
      icon: Package,
      color: 'bg-green-500',
      trend: 'up'
    },
    {
      title: 'Distributed',
      value: '980',
      change: '+80 this week',
      icon: Sprout,
      color: 'bg-purple-500',
      trend: 'up'
    },
    {
      title: 'Remaining',
      value: '270',
      change: '-10 this week',
      icon: AlertCircle,
      color: 'bg-orange-500',
      trend: 'down'
    }
  ];

  const renderContent = () => {
    if (activeTab === 'buyer-prices') {
      return <BuyerPriceListingsViewer userRole="association" />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user.fullName || 'Officer'}!</h1>
              <p className="text-emerald-100">Manage your association and support your farmers</p>
            </div>

            {/* Stats Cards - Neumorphic Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        <div className="flex items-center mt-2">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-xl`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Distributed 50 seedlings to Juan Dela Cruz</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New farmer Maria Santos registered</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Sprout className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">30 Bucay 2 seedlings planted by Pedro Garcia</p>
                    <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'farmers':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Farmers</h2>
                <p className="text-gray-500 mt-1">Manage your association's farmers</p>
              </div>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Add Farmer</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search farmers..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    />
                  </div>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-gray-200 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Farmer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Seedlings</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">Juan Dela Cruz</p>
                              <p className="text-sm text-gray-500">Brgy. Culiram</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900">09123456789</p>
                          <p className="text-sm text-gray-500">juan@example.com</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">50</p>
                          <p className="text-sm text-gray-500">Bucay 1</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                            View Details
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">Maria Santos</p>
                              <p className="text-sm text-gray-500">Brgy. Culiram</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900">09123456788</p>
                          <p className="text-sm text-gray-500">maria@example.com</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">30</p>
                          <p className="text-sm text-gray-500">Bucay 2</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                            View Details
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Showing 2 of 24 farmers</p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-emerald-500 text-white">
                      1
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'seedlings':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Seedling Distribution</h2>
                <p className="text-gray-500 mt-1">Manage seedlings received from MAO</p>
              </div>
              <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm">
                <Plus className="w-4 h-4" />
                <span>Distribute Seedlings</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search seedlings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    />
                  </div>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-gray-200 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Variety</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Quantity</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Farmer</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSeedlings.map((seedling) => (
                          <tr key={seedling.seedling_id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <Sprout className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium text-gray-900">{seedling.variety}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-gray-900">{seedling.quantity_distributed}</p>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-900">{new Date(seedling.date_distributed).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium text-gray-900">{seedling.farmers?.full_name || 'N/A'}</p>
                                  <p className="text-sm text-gray-500">{seedling.farmers?.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(seedling.status)}`}>
                                {getStatusIcon(seedling.status)}
                                <span className="ml-1 capitalize">{seedling.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Showing {filteredSeedlings.length} of {seedlings.length} seedlings</p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-emerald-500 text-white">
                      1
                    </button>
                    <button className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-500 mt-1">Manage your association profile and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Association Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Association Name</label>
                      <input
                        type="text"
                        defaultValue={associationName}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        defaultValue={user.fullName || ''}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={user.email || ''}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="09123456789"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      rows={3}
                      placeholder="Complete address"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                    ></textarea>
                  </div>
                  <div className="mt-6">
                    <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors">
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                      />
                    </div>
                    <div className="mt-4">
                      <button className="bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm font-medium text-green-800">Verified</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium text-gray-900">January 15, 2023</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-medium text-gray-900">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-800 mb-3">Deleting your account will remove all data. This action cannot be undone.</p>
                    <button className="w-full bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{associationName}</h1>
                <p className="text-sm text-gray-500">Association Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.fullName || 'Association Officer'}</p>
                  <p className="text-xs text-gray-500">{user.position || 'Officer'}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === item.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociationDashboard;