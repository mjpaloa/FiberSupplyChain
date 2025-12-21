import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  DollarSign, 
  Package, 
  Users, 
 
  Download,
  Search,
 
} from 'lucide-react';
import { getUserData, getAuthToken } from '../../utils/authToken';

interface SalesTransaction {
  report_id: string;
  farmer_id: string;
  farmer_name: string;
  report_month: string;
  sale_date: string;
  buyer_company_name: string;
  abaca_type: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  delivery_location: string;
  shipping_fee: number;
  quality_notes: string;
  other_comments: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

interface SalesStats {
  totalTransactions: number;
  pendingVerification: number;
  approvedTransactions: number;
  rejectedTransactions: number;
  totalRevenue: number;
  totalQuantity: number;
  averagePrice: number;
  uniqueFarmers: number;
}

const SalesVerificationDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<SalesTransaction[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalTransactions: 0,
    pendingVerification: 0,
    approvedTransactions: 0,
    rejectedTransactions: 0,
    totalRevenue: 0,
    totalQuantity: 0,
    averagePrice: 0,
    uniqueFarmers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<SalesTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://easyabaca-api.vercel.app';
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/sales/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const transactionData = result.reports.map((report: any) => ({
          report_id: report.report_id,
          farmer_id: report.farmer_id,
          farmer_name: report.farmers?.full_name || 'Unknown Farmer',
          report_month: report.report_month,
          sale_date: report.sale_date,
          buyer_company_name: report.buyer_company_name,
          abaca_type: report.abaca_type,
          quantity_sold: parseFloat(report.quantity_sold || 0),
          unit_price: parseFloat(report.unit_price || 0),
          total_amount: parseFloat(report.total_amount || 0),
          payment_method: report.payment_method,
          payment_status: report.payment_status,
          delivery_location: report.delivery_location,
          shipping_fee: parseFloat(report.shipping_fee || 0),
          quality_notes: report.quality_notes,
          other_comments: report.other_comments,
          status: report.status,
          submitted_at: report.submitted_at,
          reviewed_at: report.reviewed_at,
          reviewed_by: report.reviewed_by,
          rejection_reason: report.rejection_reason
        }));
        
        setTransactions(transactionData);
        calculateStats(transactionData);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionData: SalesTransaction[]) => {
    const totalTransactions = transactionData.length;
    const pendingVerification = transactionData.filter(t => t.status === 'pending').length;
    const approvedTransactions = transactionData.filter(t => t.status === 'approved').length;
    const rejectedTransactions = transactionData.filter(t => t.status === 'rejected').length;
    const totalRevenue = transactionData.reduce((sum, t) => sum + t.total_amount, 0);
    const totalQuantity = transactionData.reduce((sum, t) => sum + t.quantity_sold, 0);
    const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
    const uniqueFarmers = new Set(transactionData.map(t => t.farmer_id)).size;

    setStats({
      totalTransactions,
      pendingVerification,
      approvedTransactions,
      rejectedTransactions,
      totalRevenue,
      totalQuantity,
      averagePrice,
      uniqueFarmers
    });
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.farmer_name.toLowerCase().includes(term) ||
        t.buyer_company_name.toLowerCase().includes(term) ||
        t.abaca_type.toLowerCase().includes(term) ||
        t.delivery_location?.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleVerifyTransaction = async (reportId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const token = getAuthToken();
      const userData = getUserData();
      const apiUrl = import.meta.env.VITE_API_URL || 'https://easyabaca-api.vercel.app';
      
      if (!token || !userData) {
        alert('Authentication error. Please log in again.');
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/sales/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          reviewed_by: userData.officer_id || userData.user_id,
          rejection_reason: reason || null
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setTransactions(prev => 
          prev.map(t => 
            t.report_id === reportId 
              ? { ...t, status, reviewed_at: new Date().toISOString(), reviewed_by: userData.officer_id || userData.user_id, rejection_reason: reason }
              : t
          )
        );
        alert(`Transaction ${status} successfully!`);
      } else {
        alert(`Failed to ${status} transaction: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${status} transaction:`, error);
      alert(`Error ${status} transaction. Please try again.`);
    }
  };

  const handleApprove = (reportId: string) => {
    handleVerifyTransaction(reportId, 'approved');
  };

  const handleReject = (reportId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      handleVerifyTransaction(reportId, 'rejected', reason);
    }
  };

  const viewTransactionDetails = (transaction: SalesTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Transaction Verification</h1>
          <p className="text-gray-600">Review and verify farmer sales transactions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Transactions - Blue */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-white">{stats.totalTransactions}</p>
            </div>
          </div>

          {/* Pending Verification - Yellow */}
          <div className="group relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Pending Verification</p>
              <p className="text-3xl font-bold text-white">{stats.pendingVerification}</p>
            </div>
          </div>

          {/* Total Revenue - Green */}
          <div className="group relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-white">₱{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Active Farmers - Red */}
          <div className="group relative bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-white/90 text-sm font-medium mb-1">Active Farmers</p>
              <p className="text-3xl font-bold text-white">{stats.uniqueFarmers}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search farmers, buyers, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/kg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.report_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaction.farmer_name}</div>
                      <div className="text-sm text-gray-500">{new Date(transaction.submitted_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.buyer_company_name}</div>
                      <div className="text-sm text-gray-500">{transaction.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.abaca_type}</div>
                      <div className="text-sm text-gray-500">{transaction.report_month}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.quantity_sold} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{transaction.unit_price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₱{transaction.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transaction.report_id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                              title="Approve Transaction"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(transaction.report_id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                              title="Reject Transaction"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-2">No transactions found</div>
              <div className="text-sm text-gray-400">Farmer sales reports will appear here for verification</div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</div>
              <div className="text-sm text-gray-600">Showing Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ₱{filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredTransactions.reduce((sum, t) => sum + t.quantity_sold, 0).toLocaleString()} kg
              </div>
              <div className="text-sm text-gray-600">Total Quantity</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ₱{filteredTransactions.length > 0 ? 
                  (filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0) / 
                   filteredTransactions.reduce((sum, t) => sum + t.quantity_sold, 0)).toFixed(2) : '0'}
              </div>
              <div className="text-sm text-gray-600">Avg Price/kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farmer:</span>
                      <span className="font-medium">{selectedTransaction.farmer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buyer:</span>
                      <span className="font-medium">{selectedTransaction.buyer_company_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sale Date:</span>
                      <span className="font-medium">{new Date(selectedTransaction.sale_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Report Month:</span>
                      <span className="font-medium">{selectedTransaction.report_month}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abaca Type:</span>
                      <span className="font-medium">{selectedTransaction.abaca_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{selectedTransaction.quantity_sold} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium">₱{selectedTransaction.unit_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-lg">₱{selectedTransaction.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedTransaction.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="font-medium">{selectedTransaction.payment_status}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Location:</span>
                      <span className="font-medium">{selectedTransaction.delivery_location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Fee:</span>
                      <span className="font-medium">₱{selectedTransaction.shipping_fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedTransaction.quality_notes || selectedTransaction.other_comments) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  {selectedTransaction.quality_notes && (
                    <div className="mb-3">
                      <span className="text-gray-600 font-medium">Quality Notes:</span>
                      <p className="mt-1 text-gray-900">{selectedTransaction.quality_notes}</p>
                    </div>
                  )}
                  {selectedTransaction.other_comments && (
                    <div>
                      <span className="text-gray-600 font-medium">Other Comments:</span>
                      <p className="mt-1 text-gray-900">{selectedTransaction.other_comments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status & Actions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-600">Current Status:</span>
                    <div className="mt-2">{getStatusBadge(selectedTransaction.status)}</div>
                  </div>
                  
                  {selectedTransaction.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          handleApprove(selectedTransaction.report_id);
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve Transaction
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedTransaction.report_id);
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Transaction
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesVerificationDashboard;
