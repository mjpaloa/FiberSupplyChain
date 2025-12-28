import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ChevronLeft, ChevronRight, ArrowUpDown, Package, Trash2, ShoppingCart, TrendingUp, Activity, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  image_url?: string;
  farmer_id?: string;
  buyer_id?: string;
}

const BuyerTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Transaction>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

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
        location: p.location,
        image_url: p.image_url,
        farmer_id: p.farmer_id
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
            variety: s.variety || s.fiber_variety,
            notes: s.notes,
            image_url: s.image_url,
            buyer_id: s.buyer_id
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
      ((transaction.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.fiber_quality?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.variety?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (transaction.type?.toLowerCase() || '').includes(searchTerm.toLowerCase())) &&
      (typeFilter === 'all' || transaction.type === typeFilter)
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
    const headers = ['Transaction Type', 'Transaction ID', 'Name', 'Fiber Quality', 'Quantity (kg)', 'Total Price (₱)', 'Date', 'Variety', 'Status'];
    
    const csvData = filteredTransactions.map((t, index) => {
      const date = new Date(t.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const sequentialNum = String(index + 1).padStart(4, '0');
      const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;
      
      return [
        t.type === 'purchase' ? 'Purchase' : 'Sale',
        transactionId,
        `"${t.name}"`,
        t.fiber_quality,
        t.quantity,
        t.total_price.toLocaleString(),
        new Date(t.created_at).toLocaleDateString(),
        t.variety || '-',
        t.status || '-'
      ];
    });

    const csvContent = [
      '"Abaca Fiber Transaction Report"',
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Transactions: ${filteredTransactions.length}"`,
      `"Total Revenue: ₱${totalSalesAmount.toLocaleString()}"`,
      `"Total Expenses: ₱${totalPurchasesAmount.toLocaleString()}"`,
      `"Net Profit: ₱${(totalSalesAmount - totalPurchasesAmount).toLocaleString()}"`,
      '',
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Abaca_Fiber_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add background color
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Add header with gradient-like effect
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Company logo/title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ABACA FIBER SUPPLY CHAIN', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Transaction Report', pageWidth / 2, 25, { align: 'center' });
    
    // Add report info section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`Generated: ${reportDate}`, 14, 50);
    doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 56);
    
    // Summary boxes
    const boxY = 45;
    const boxWidth = 60;
    const boxHeight = 25;
    
    // Total Purchases Box
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(pageWidth - 200, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Total Purchases', pageWidth - 170, boxY + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalPurchases}`, pageWidth - 170, boxY + 15, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`₱${totalPurchasesAmount.toLocaleString()}`, pageWidth - 170, boxY + 21, { align: 'center' });
    
    // Total Sales Box
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(pageWidth - 130, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Total Sales', pageWidth - 100, boxY + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalSales}`, pageWidth - 100, boxY + 15, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`₱${totalSalesAmount.toLocaleString()}`, pageWidth - 100, boxY + 21, { align: 'center' });
    
    // Net Profit Box
    const netProfit = totalSalesAmount - totalPurchasesAmount;
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - 60, boxY, boxWidth, boxHeight, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Net Revenue', pageWidth - 30, boxY + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`₱${netProfit.toLocaleString()}`, pageWidth - 30, boxY + 17, { align: 'center' });
    
    // Prepare table data
    const tableData = filteredTransactions.map((t, index) => {
      const date = new Date(t.created_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const sequentialNum = String(index + 1).padStart(4, '0');
      const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;
      
      return [
        t.type === 'purchase' ? 'Purchase' : 'Sale',
        transactionId,
        t.name,
        t.fiber_quality,
        `${t.quantity} kg`,
        `₱${t.total_price.toLocaleString()}`,
        new Date(t.created_at).toLocaleDateString(),
        t.variety || '-'
      ];
    });
    
    // Add table
    (doc as any).autoTable({
      startY: 75,
      head: [['Type', 'Transaction ID', 'Name', 'Quality', 'Quantity', 'Total Price', 'Date', 'Variety']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 45 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 30, halign: 'center' },
        7: { cellWidth: 25, halign: 'center' }
      },
      didDrawCell: (data: any) => {
        // Add color coding for transaction types
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.text[0] === 'Purchase') {
            doc.setFillColor(219, 234, 254);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(30, 64, 175);
            doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
              align: 'center',
              baseline: 'middle'
            });
          } else if (data.cell.text[0] === 'Sale') {
            doc.setFillColor(209, 250, 229);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(5, 150, 105);
            doc.text(data.cell.text[0], data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { 
              align: 'center',
              baseline: 'middle'
            });
          }
        }
      },
      margin: { top: 75, left: 14, right: 14 },
      didDrawPage: (data: any) => {
        // Add footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        
        // Add footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
        
        doc.setFontSize(7);
        doc.text(
          'Abaca Fiber Supply Chain Management System',
          14,
          pageHeight - 10
        );
        doc.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          pageWidth - 14,
          pageHeight - 10,
          { align: 'right' }
        );
      }
    });
    
    // Save the PDF
    doc.save(`Abaca_Fiber_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const viewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = transactionToDelete.type === 'purchase'
        ? `https://easyabaca-api.vercel.app/api/buyer-purchases/${transactionToDelete.id}`
        : `https://easyabaca-api.vercel.app/api/buyer-purchases/sales/${transactionToDelete.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        setShowDeleteModal(false);
        setTransactionToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const totalTransactions = transactions.length;
  const totalSales = transactions.filter(t => t.type === 'sale').length;
  const totalPurchases = transactions.filter(t => t.type === 'purchase').length;
  const totalSalesAmount = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.total_price, 0);
  const totalPurchasesAmount = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.total_price, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative z-10">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Transactions */}
        <div className="group relative bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Activity size={24} />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Transactions</h3>
            <p className="text-3xl md:text-4xl font-black mb-1">{totalTransactions}</p>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <Activity size={14} />
              <span>All Activities</span>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="group relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp size={24} />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Sales</h3>
            <p className="text-3xl md:text-4xl font-black mb-1">{totalSales}</p>
            <p className="text-sm opacity-80">₱{totalSalesAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShoppingCart size={24} />
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Total Purchases</h3>
            <p className="text-3xl md:text-4xl font-black mb-1">{totalPurchases}</p>
            <p className="text-sm opacity-80">₱{totalPurchasesAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 text-white transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <span className="text-2xl font-bold">₱</span>
              </div>
            </div>
            <h3 className="text-xs md:text-sm font-semibold opacity-90 mb-2 tracking-wide uppercase">Net Profit</h3>
            <p className="text-3xl md:text-4xl font-black mb-1">₱{(totalSalesAmount - totalPurchasesAmount).toLocaleString()}</p>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <span>Sales - Purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-white/60">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ID, quality, variety..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm md:text-base"
            />
          </div>

          {/* Filters and Export */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="purchase">Purchases</option>
              <option value="sale">Sales</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Export Buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold"
                title="Export to CSV"
              >
                <Download size={18} />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl text-sm font-semibold"
                title="Export to PDF"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-white/60">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 via-blue-50 to-purple-50 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort('type')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Type
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    ID
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fiber_quality')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Quality
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Quantity
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_price')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Total Price
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-left text-[10px] sm:text-xs font-black text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction, index) => {
                const date = new Date(transaction.created_at);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const sequentialNum = String(((currentPage - 1) * itemsPerPage) + index + 1).padStart(4, '0');
                const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;
                
                return (
                <tr
                  key={transaction.id}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-100"
                >
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium ${
                      transaction.type === 'purchase' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-mono font-bold text-gray-900">
                    {transactionId}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-medium text-gray-900">
                    {transaction.name}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] sm:text-xs md:text-sm font-medium">
                      {transaction.fiber_quality}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-900 font-bold">
                    {transaction.quantity} kg
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-[10px] sm:text-xs md:text-sm font-black text-gray-900">
                    ₱{transaction.total_price.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4 text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewDetails(transaction);
                        }}
                        className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(transaction, e)}
                        className="p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-16">
              <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600 font-semibold text-lg">No transactions found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Transaction Image */}
              {selectedTransaction.image_url && (
                <div className="mb-6">
                  <div className="relative w-full h-64 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={selectedTransaction.image_url} 
                      alt="Transaction" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Transaction Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction Type</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${
                      selectedTransaction.type === 'purchase' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {selectedTransaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                    </span>
                  </div>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaction ID</label>
                  <p className="mt-1 text-sm font-mono font-semibold text-gray-900">ABF-{selectedTransaction.id.slice(0, 13)}</p>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & Time</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {selectedTransaction.type === 'purchase' ? 'Farmer Name' : 'Buyer Name'}
                  </label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.name}</p>
                </div>

                {/* Status */}
                {selectedTransaction.status && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${
                        selectedTransaction.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        selectedTransaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fiber Quality */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fiber Quality</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.fiber_quality}</p>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.quantity} kg</p>
                </div>

                {/* Price per kg */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price per kg</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">₱{selectedTransaction.price.toLocaleString()}</p>
                </div>

                {/* Variety */}
                {selectedTransaction.variety && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Variety</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.variety}</p>
                  </div>
                )}

                {/* Location */}
                {selectedTransaction.location && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.location}</p>
                  </div>
                )}

                {/* Contact Number */}
                {selectedTransaction.contact_number && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Number</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{selectedTransaction.contact_number}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</label>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Total Amount */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</label>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  ₱{selectedTransaction.total_price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Transaction</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BuyerTransactions;
