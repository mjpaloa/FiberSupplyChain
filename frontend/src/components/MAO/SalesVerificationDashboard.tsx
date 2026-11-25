import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import {
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Search,
} from 'lucide-react';
import { getUserData, getAuthToken } from '../../utils/authToken';
import { EditorialCard, KpiStrip, StatusPill } from '../Shared/EditorialUI';

const PhilippinePeso = ({ className, size = 24 }: { className?: string; size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <text
      x="12"
      y="12"
      dy="1"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="20"
      fontWeight="bold"
      fill="currentColor"
    >
      ₱
    </text>
  </svg>
);

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
      const apiUrl = API_BASE_URL;

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
      const apiUrl = API_BASE_URL;

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
    const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
    return (
      <StatusPill tone={tone}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </StatusPill>
    );
  };

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KpiStrip
        columns={4}
        items={[
          { label: 'Total Transactions', value: stats.totalTransactions.toLocaleString(), subtext: 'Submitted records' },
          { label: 'Pending Verification', value: stats.pendingVerification.toLocaleString(), subtext: 'Awaiting review' },
          { label: 'Total Sales', value: `₱${stats.totalRevenue.toLocaleString()}`, subtext: 'Combined transaction value' },
          { label: 'Active Farmers', value: stats.uniqueFarmers.toLocaleString(), subtext: 'Unique sellers' },
        ]}
      />

      {/* Filters */}
      <EditorialCard className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search farmers, buyers, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm"
            />
          </div>
          <div className="flex gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter transactions by status"
              className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none text-sm font-medium text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export
            </button>
          </div>
        </div>
      </EditorialCard>

      {/* Transactions Table */}
      <EditorialCard
        title="Sales Transaction Verification"
        subtitle="Review and verify farmer sales transactions"
        badge={filteredTransactions.length}
        noPadding
      >
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Sales transaction verification table">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-[#FAFAFA]">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Farmer</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Buyer</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Product</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Quantity</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Price/kg</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Total</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.report_id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{transaction.farmer_name}</div>
                    <div className="text-xs text-gray-500">{new Date(transaction.submitted_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.buyer_company_name}</div>
                    <div className="text-xs text-gray-500">{transaction.payment_method}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.abaca_type}</div>
                    <div className="text-xs text-gray-500">{transaction.report_month}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 tabular-nums">
                    {transaction.quantity_sold} kg
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 tabular-nums">
                    ₱{transaction.unit_price.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 tabular-nums">
                    ₱{transaction.total_amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => viewTransactionDetails(transaction)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                        aria-label="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {transaction.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(transaction.report_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#047857] bg-[#EAF6F0] hover:bg-[#D5EEE1] rounded-lg transition-colors"
                            title="Approve Transaction"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(transaction.report_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Reject Transaction"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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
          <div className="p-10 text-center">
            <div className="text-sm font-semibold text-gray-700 mb-1">No transactions found</div>
            <div className="text-xs text-gray-500">Farmer sales reports will appear here for verification.</div>
          </div>
        )}
      </EditorialCard>

      {/* Summary */}
      <KpiStrip
        columns={4}
        items={[
          { label: 'Showing Transactions', value: filteredTransactions.length.toLocaleString() },
          { label: 'Filtered Total Value', value: `₱${filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0).toLocaleString()}` },
          { label: 'Filtered Quantity', value: `${filteredTransactions.reduce((sum, t) => sum + t.quantity_sold, 0).toLocaleString()} kg` },
          {
            label: 'Avg Price / kg',
            value: `₱${filteredTransactions.length > 0 && filteredTransactions.reduce((sum, t) => sum + t.quantity_sold, 0) > 0
              ? (filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0) / filteredTransactions.reduce((sum, t) => sum + t.quantity_sold, 0)).toFixed(2)
              : '0'}`,
          },
        ]}
      />

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-gray-200 bg-[#F8F9FA]">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Transaction Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Farmer</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.farmer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Buyer</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.buyer_company_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sale Date</span>
                      <span className="font-medium text-gray-900">{new Date(selectedTransaction.sale_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Report Month</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.report_month}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-[#F8F9FA]">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Product Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Abaca Type</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.abaca_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity</span>
                      <span className="font-medium text-gray-900 tabular-nums">{selectedTransaction.quantity_sold} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Unit Price</span>
                      <span className="font-medium text-gray-900 tabular-nums">₱{selectedTransaction.unit_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount</span>
                      <span className="font-bold text-gray-900 tabular-nums">₱{selectedTransaction.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Status</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.payment_status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Delivery Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Location</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.delivery_location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping Fee</span>
                      <span className="font-medium text-gray-900 tabular-nums">₱{selectedTransaction.shipping_fee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedTransaction.quality_notes || selectedTransaction.other_comments) && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <h3 className="font-serif text-base font-bold text-gray-900 mb-3">Additional Notes</h3>
                  {selectedTransaction.quality_notes && (
                    <div className="mb-2 text-sm">
                      <span className="text-gray-500 font-medium">Quality Notes: </span>
                      <span className="text-gray-900">{selectedTransaction.quality_notes}</span>
                    </div>
                  )}
                  {selectedTransaction.other_comments && (
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium">Other Comments: </span>
                      <span className="text-gray-900">{selectedTransaction.other_comments}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Current Status:</span>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                {selectedTransaction.status === 'pending' && (
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(selectedTransaction.report_id);
                        setShowDetailsModal(false);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#047857] text-white rounded-xl hover:bg-[#065F46] text-sm font-semibold transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Transaction
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReject(selectedTransaction.report_id);
                        setShowDetailsModal(false);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-semibold transition-colors"
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
      )}
    </div>
  );
};

export default SalesVerificationDashboard;
