import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, ArrowUpDown, Package } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'purchase' | 'sale';
  name: string;
  price: number;
  total_price: number;
  created_at: string;
  fiber_quality: string;
  quantity: number;
  variety?: string;
  contact_number?: string;
  status?: string;
  location?: string;
  notes?: string;
}

const BuyerTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Transaction>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch purchases
      const purchasesResponse = await fetch(
        `https://easyabaca-api.vercel.app/api/buyer-purchases/transactions?status=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const purchasesData = await purchasesResponse.json();
      
      // Transform purchases
      const purchases = (purchasesData.transactions || []).map((p: any) => ({
        id: p.purchase_id,
        type: 'purchase' as const,
        name: p.farmer_name,
        price: p.price,
        total_price: p.total_price,
        created_at: p.created_at,
        fiber_quality: p.fiber_quality,
        quantity: p.quantity,
        variety: p.variety,
        contact_number: p.contact_number,
        status: p.status,
        location: p.location
      }));
      
      // Fetch sales with error handling
      let sales: any[] = [];
      try {
        const salesResponse = await fetch(
          `https://easyabaca-api.vercel.app/api/buyer-purchases/sales`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          
          // Transform sales
          sales = (salesData.sales || []).map((s: any) => ({
            id: s.sale_id,
            type: 'sale' as const,
            name: s.buyer_name,
            price: s.price_per_kg,
            total_price: s.total_amount,
            created_at: s.sale_date,
            fiber_quality: s.fiber_class,
            quantity: s.quantity_kg,
            notes: s.notes
          }));
        } else {
          console.warn('Sales endpoint returned:', salesResponse.status);
        }
      } catch (salesError) {
        console.warn('Sales endpoint not available, showing purchases only:', salesError);
      }
      
      // Combine and sort by date
      const allTransactions = [...purchases, ...sales].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTransactions = transactions
    .filter(transaction =>
      (transaction.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.fiber_quality?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.variety?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      return ((aValue as number) - (bValue as number)) * modifier;
    });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = ['Type', 'ID', 'Name', 'Total Price', 'Date', 'Fiber Quality', 'Quantity', 'Variety'];
    const csvData = filteredTransactions.map(t => [
      t.type,
      t.id,
      t.name,
      t.total_price,
      new Date(t.created_at).toLocaleDateString(),
      t.fiber_quality,
      t.quantity,
      t.variety || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const viewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
        <p className="text-gray-600">View and manage all your fiber purchase transactions</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  onClick={() => handleSort('type')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Type
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    ID
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fiber_quality')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Quality
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Quantity
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_price')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Total Price
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('variety')}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Variety
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => viewDetails(transaction)}
                >
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'purchase' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    #{transaction.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {transaction.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                      {transaction.fiber_quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.quantity} kg
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₱{transaction.total_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {transaction.variety ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {transaction.variety}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewDetails(transaction);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} className="text-blue-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-12">
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg ${currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Transaction Type</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTransaction.type === 'purchase' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTransaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono font-semibold text-gray-900">#{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{selectedTransaction.type === 'purchase' ? 'Farmer Name' : 'Buyer Name'}</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.name}</p>
                </div>
                {selectedTransaction.status && (
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedTransaction.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        selectedTransaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                      }`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Fiber Quality</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.fiber_quality}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.quantity} kg</p>
                </div>
                {selectedTransaction.location && (
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedTransaction.location}</p>
                  </div>
                )}
                {selectedTransaction.variety && (
                  <div>
                    <p className="text-sm text-gray-600">Variety</p>
                    <p className="font-semibold text-gray-900">{selectedTransaction.variety}</p>
                  </div>
                )}
                {selectedTransaction.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-semibold text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold text-blue-600 text-xl">
                    ₱{selectedTransaction.total_price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerTransactions;
