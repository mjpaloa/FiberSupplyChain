import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, ChevronLeft, ChevronRight, ArrowUpDown, Package, Trash2, X, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { KpiStrip, EditorialCard, StatusPill } from '../Shared/EditorialUI';

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
        `https://fibersupplychain.onrender.com/api/buyer-purchases/transactions?status=${statusFilter}`,
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
          `https://fibersupplychain.onrender.com/api/buyer-purchases/sales`,
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
        ? `https://fibersupplychain.onrender.com/api/buyer-purchases/${transactionToDelete.id}`
        : `https://fibersupplychain.onrender.com/api/buyer-purchases/sales/${transactionToDelete.id}`;
      
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
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047857]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* KPI Summary Strip */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Total Transactions',
            value: totalTransactions,
            subtext: 'All recorded activities',
          },
          {
            label: 'Total Sales',
            value: totalSales > 0 ? totalSales : '0',
            subtext: totalSales > 0 ? `₱${totalSalesAmount.toLocaleString()}` : 'No sales yet',
          },
          {
            label: 'Total Purchases',
            value: totalPurchases,
            subtext: `₱${totalPurchasesAmount.toLocaleString()}`,
          },
          {
            label: 'Net Profit',
            value: totalSales > 0
              ? `${totalSalesAmount - totalPurchasesAmount < 0 ? '-' : ''}₱${Math.abs(totalSalesAmount - totalPurchasesAmount).toLocaleString()}`
              : 'No sales yet',
            subtext: 'Sales minus purchases',
          },
        ]}
      />

      {/* Filters & Export Toolbar */}
      <EditorialCard>
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, quality, variety..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm text-gray-900"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="purchase">Purchases</option>
              <option value="sale">Sales</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] outline-none bg-white text-sm text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold"
                title="Export to CSV"
              >
                <Download size={16} />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={exportToPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-sm font-semibold"
                title="Export to PDF"
              >
                <FileText size={16} />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </EditorialCard>

      {/* Transactions Table */}
      <EditorialCard
        title="Transaction Ledger"
        subtitle={`${filteredTransactions.length} matching records`}
        noPadding
      >
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Buyer transactions table">
          <table>
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th
                  onClick={() => handleSort('type')}
                  className="px-4 sm:px-6 py-3.5 text-left cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Type
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="px-4 sm:px-6 py-3.5 text-left cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    ID
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 sm:px-6 py-3.5 text-left cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Name
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fiber_quality')}
                  className="px-4 sm:px-6 py-3.5 text-left cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Quality
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('quantity')}
                  className="px-4 sm:px-6 py-3.5 text-right cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Quantity
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_price')}
                  className="px-4 sm:px-6 py-3.5 text-right cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Total Price
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="px-4 sm:px-6 py-3.5 text-left cursor-pointer hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    <ArrowUpDown size={13} />
                  </div>
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.map((transaction, index) => {
                const date = new Date(transaction.created_at);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const sequentialNum = String(((currentPage - 1) * itemsPerPage) + index + 1).padStart(4, '0');
                const transactionId = `ABF-${year}${month}${day}-${sequentialNum}`;

                const qualityTone =
                  transaction.fiber_quality?.includes('A') ? 'success' :
                  transaction.fiber_quality?.includes('B') ? 'info' :
                  transaction.fiber_quality?.includes('C') ? 'warning' : 'neutral';

                return (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <StatusPill tone={transaction.type === 'purchase' ? 'info' : 'success'}>
                        {transaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                      </StatusPill>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-mono font-semibold text-gray-900">
                      {transactionId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">
                      {transaction.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <StatusPill tone={qualityTone}>{transaction.fiber_quality}</StatusPill>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 font-semibold text-right tabular-nums">
                      {transaction.quantity} kg
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-gray-900 text-right tabular-nums">
                      ₱{transaction.total_price.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetails(transaction);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(transaction, e)}
                          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginatedTransactions.length === 0 && (
            <div className="text-center py-14 px-6">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-500 tabular-nums">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
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
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold tabular-nums transition-colors ${
                      currentPage === page
                        ? 'bg-[#E59500] text-gray-900'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </EditorialCard>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">Transaction Details</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">ABF-{selectedTransaction.id.slice(0, 13)}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {selectedTransaction.image_url && (
                <div className="relative w-full h-60 bg-[#FAFAFA] rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={selectedTransaction.image_url}
                    alt="Transaction"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Transaction Type</label>
                  <div className="mt-1.5">
                    <StatusPill tone={selectedTransaction.type === 'purchase' ? 'info' : 'success'}>
                      {selectedTransaction.type === 'purchase' ? 'Purchase' : 'Sale'}
                    </StatusPill>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date & Time</label>
                  <p className="mt-1.5 text-sm font-medium text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    {selectedTransaction.type === 'purchase' ? 'Farmer Name' : 'Buyer Name'}
                  </label>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">{selectedTransaction.name}</p>
                </div>

                {selectedTransaction.status && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                    <div className="mt-1.5">
                      <StatusPill
                        tone={
                          selectedTransaction.status === 'Completed' ? 'success' :
                          selectedTransaction.status === 'Pending' ? 'warning' : 'danger'
                        }
                      >
                        {selectedTransaction.status}
                      </StatusPill>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Fiber Quality</label>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900">{selectedTransaction.fiber_quality}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Quantity</label>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900 tabular-nums">{selectedTransaction.quantity} kg</p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price per kg</label>
                  <p className="mt-1.5 text-sm font-semibold text-gray-900 tabular-nums">₱{selectedTransaction.price.toLocaleString()}</p>
                </div>

                {selectedTransaction.variety && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Variety</label>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{selectedTransaction.variety}</p>
                  </div>
                )}

                {selectedTransaction.location && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Location</label>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{selectedTransaction.location}</p>
                  </div>
                )}

                {selectedTransaction.contact_number && (
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA]">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <p className="mt-1.5 text-sm font-semibold text-gray-900">{selectedTransaction.contact_number}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.notes && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Notes</label>
                  <p className="mt-1.5 text-sm text-gray-700 leading-relaxed">{selectedTransaction.notes}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#EAF6F0] border border-[#CBEAD9] flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  ₱{selectedTransaction.total_price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FEE2E2] rounded-xl">
                  <Trash2 className="text-[#991B1B]" size={18} />
                </div>
                <h2 className="font-serif text-lg font-bold text-gray-900">Delete Transaction</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTransactionToDelete(null);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-[#FAFAFA] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerTransactions;
