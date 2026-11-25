import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import { Package, FileText, Send } from 'lucide-react';
import { getUserData } from '../../utils/authToken';
import { EditorialCard } from '../Shared/EditorialUI';

interface SalesReportFormProps {
  onSubmit: (report: any) => void;
  onCancel: () => void;
  initialData?: any;
  isEditMode?: boolean;
}

export const SalesReportForm: React.FC<SalesReportFormProps> = ({ onSubmit, onCancel, initialData, isEditMode = false }) => {
  const [reportData, setReportData] = useState({
    reportPeriod: '',
    reportMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    
    // Basic Transaction Info
    dateOfSale: new Date().toISOString().slice(0, 10),
    buyerCompanyName: '',
    
    // Product Details
    abacaType: '',
    quantitySold: 0,
    unitPrice: 0,
    totalAmount: 0,
    
    // Payment Details
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    
    // Logistics / Delivery
    deliveryLocation: '',
    shippingFee: 0,
    
    // Remarks / Notes
    qualityNotes: '',
    otherComments: ''
  });

  // Populate form with initial data when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setReportData({
        reportPeriod: initialData.report_month || '',
        reportMonth: initialData.report_month || new Date().toISOString().slice(0, 7),
        dateOfSale: initialData.sale_date || new Date().toISOString().slice(0, 10),
        buyerCompanyName: initialData.buyer_company_name || '',
        abacaType: initialData.abaca_type || '',
        quantitySold: initialData.quantity_sold || 0,
        unitPrice: initialData.unit_price || 0,
        totalAmount: initialData.total_amount || 0,
        paymentMethod: initialData.payment_method || 'cash',
        paymentStatus: initialData.payment_status || 'paid',
        deliveryLocation: initialData.delivery_location || '',
        shippingFee: initialData.shipping_fee || 0,
        qualityNotes: initialData.quality_notes || '',
        otherComments: initialData.other_comments || ''
      });
    }
  }, [isEditMode, initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate numeric fields to prevent database overflow
    // Database limit: precision 10, scale 2 = max 99,999,999.99
    const MAX_NUMERIC_VALUE = 99999999.99;
    
    if (reportData.quantitySold > MAX_NUMERIC_VALUE) {
      alert(`Quantity sold cannot exceed ${MAX_NUMERIC_VALUE.toLocaleString()} kg`);
      return;
    }
    
    if (reportData.unitPrice > MAX_NUMERIC_VALUE) {
      alert(`Unit price cannot exceed ₱${MAX_NUMERIC_VALUE.toLocaleString()}`);
      return;
    }
    
    if (reportData.totalAmount > MAX_NUMERIC_VALUE) {
      alert(`Total amount cannot exceed ₱${MAX_NUMERIC_VALUE.toLocaleString()}`);
      return;
    }
    
    if (reportData.shippingFee && reportData.shippingFee > MAX_NUMERIC_VALUE) {
      alert(`Shipping fee cannot exceed ₱${MAX_NUMERIC_VALUE.toLocaleString()}`);
      return;
    }
    
    console.log('📝 Form submitted with data:', reportData);

    if (!reportData.quantitySold || !reportData.unitPrice) {
      alert('Please enter quantity sold and unit price');
      return;
    }

    try {
      // Get the actual farmer ID from authenticated user data
      const userData = getUserData();
      console.log('🔍 Form submission - User data:', userData);
      console.log('🔍 Form - User data keys:', userData ? Object.keys(userData) : 'No user data');
      
      // Check multiple possible farmer ID fields
      const farmerId = userData?.farmer_id || userData?.id || userData?.user_id || userData?.farmerId;
      
      // Log all possible ID fields for debugging
      console.log('🔍 Form - Checking ID fields:', {
        farmer_id: userData?.farmer_id,
        id: userData?.id,
        user_id: userData?.user_id,
        farmerId: userData?.farmerId,
        finalFarmerId: farmerId,
        allUserData: userData
      });
      
      if (!userData || !farmerId) {
        console.error('❌ Authentication error - User data:', userData);
        console.error('❌ Available fields:', userData ? Object.keys(userData) : 'No user data');
        alert('Authentication error: Please log in again');
        return;
      }
      
      console.log('✅ Form using farmer ID:', farmerId);
      
      // Validate required fields
      if (!reportData.abacaType || reportData.abacaType.trim() === '') {
        alert('Please select an abaca type');
        return;
      }
      
      if (!reportData.buyerCompanyName || reportData.buyerCompanyName.trim() === '') {
        alert('Please enter buyer company name');
        return;
      }
      
      // Use the abaca type as entered by the farmer
      const abacaType = reportData.abacaType.trim();
      
      // Prepare comprehensive transaction data for the new API format
      const reportPayload = {
        farmer_id: farmerId, // Use actual farmer ID from authentication
        report_month: reportData.reportMonth,
        transactionDetails: {
          // 1. Basic Transaction Info
          dateOfSale: reportData.dateOfSale,
          buyerCompanyName: reportData.buyerCompanyName.trim(),
          // 2. Product Details
          abacaType: abacaType, // Use validated abaca type
          quantitySold: reportData.quantitySold,
          unitPrice: reportData.unitPrice,
          totalAmount: reportData.totalAmount,
          // 3. Payment Details
          paymentMethod: reportData.paymentMethod || 'cash',
          paymentStatus: reportData.paymentStatus || 'paid',
          // 4. Logistics / Delivery
          deliveryLocation: reportData.deliveryLocation || '',
          shippingFee: reportData.shippingFee || 0,
          // 5. Remarks / Notes
          qualityNotes: reportData.qualityNotes || '',
          otherComments: reportData.otherComments || ''
        }
      };
      
      // Log the payload for debugging
      console.log('📦 Report payload:', reportPayload);
      console.log('📦 Abaca type being sent:', abacaType);

      const response = await fetch(`${API_BASE_URL}/api/sales/submit-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authorization header
        },
        body: JSON.stringify(reportPayload)
      });

      // Check if response is ok first
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON response');
      }

      const result = await response.json();

      if (result.success) {
        alert('Sales report submitted successfully to MAO!');
        onSubmit(reportPayload); // This will redirect back to dashboard
      } else {
        alert('Failed to submit report: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors';

  return (
    <EditorialCard
      title="Monthly Sales Report"
      subtitle="Submit your abaca fiber sales data to MAO"
      className="max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Report Period */}
        <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Report Month *
          </label>
          <input
            type="month"
            value={reportData.reportMonth}
            onChange={(e) => setReportData({ ...reportData, reportMonth: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        {/* 1. Basic Transaction Info */}
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#047857]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-gray-900">Transaction Info</h3>
              <p className="text-xs text-gray-500">Basic transaction details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Date of Sale
              </label>
              <input
                type="date"
                value={reportData.dateOfSale}
                onChange={(e) => setReportData({ ...reportData, dateOfSale: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Buyer / Company
              </label>
              <input
                type="text"
                value={reportData.buyerCompanyName}
                onChange={(e) => setReportData({ ...reportData, buyerCompanyName: e.target.value })}
                onFocus={(e) => e.target.select()}
                className={inputClass}
                placeholder="Buyer name or company"
              />
            </div>
          </div>
        </div>

        {/* 2. Product Details */}
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#EAF6F0] border border-[#CBEAD9] rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-[#047857]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-gray-900">Product Details</h3>
              <p className="text-xs text-gray-500">Abaca type, quantity, and pricing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Abaca Type/Grade *
              </label>
              <input
                type="text"
                value={reportData.abacaType}
                onChange={(e) => setReportData({ ...reportData, abacaType: e.target.value })}
                onFocus={(e) => e.target.select()}
                className={inputClass}
                placeholder="e.g., Tuxy, Superior, Medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Quantity (kg)
              </label>
              <input
                type="number"
                step="0.1"
                max="99999999.99"
                value={reportData.quantitySold || ''}
                onChange={(e) => {
                  const quantity = parseFloat(e.target.value) || 0;
                  setReportData({ ...reportData, quantitySold: quantity });
                  if (quantity && reportData.unitPrice) {
                    setReportData((prev) => ({
                      ...prev,
                      quantitySold: quantity,
                      totalAmount: quantity * prev.unitPrice
                    }));
                  }
                }}
                className={inputClass}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Unit Price (₱)
              </label>
              <input
                type="number"
                step="0.01"
                max="99999999.99"
                value={reportData.unitPrice || ''}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0;
                  setReportData({ ...reportData, unitPrice: price });
                  if (price && reportData.quantitySold) {
                    setReportData((prev) => ({
                      ...prev,
                      unitPrice: price,
                      totalAmount: prev.quantitySold * price
                    }));
                  }
                }}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Total Amount (₱)
              </label>
              <input
                type="number"
                step="0.01"
                value={reportData.totalAmount || ''}
                readOnly
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-sm font-semibold text-[#047857] tabular-nums"
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </div>

        {/* 3. Payment & Logistics */}
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-center justify-center">
              <Send className="w-4 h-4 text-[#92400E]" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-gray-900">Payment & Logistics</h3>
              <p className="text-xs text-gray-500">Payment and delivery details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Payment Method
              </label>
              <select
                value={reportData.paymentMethod}
                onChange={(e) => setReportData({ ...reportData, paymentMethod: e.target.value })}
                className={inputClass}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Payment Status
              </label>
              <select
                value={reportData.paymentStatus}
                onChange={(e) => setReportData({ ...reportData, paymentStatus: e.target.value })}
                className={inputClass}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Delivery Location
              </label>
              <input
                type="text"
                value={reportData.deliveryLocation}
                onChange={(e) => setReportData({ ...reportData, deliveryLocation: e.target.value })}
                className={inputClass}
                placeholder="Delivery address"
              />
            </div>
          </div>
        </div>

        {/* 4. Additional Notes */}
        <div className="bg-gray-50/70 p-4 sm:p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-gray-900">Additional Notes</h3>
              <p className="text-xs text-gray-500">Quality notes and comments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Quality Notes
              </label>
              <textarea
                value={reportData.qualityNotes}
                onChange={(e) => setReportData({ ...reportData, qualityNotes: e.target.value })}
                className={inputClass}
                rows={2}
                placeholder="Quality observations, grade details, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Other Comments
              </label>
              <textarea
                value={reportData.otherComments}
                onChange={(e) => setReportData({ ...reportData, otherComments: e.target.value })}
                className={inputClass}
                rows={2}
                placeholder="Additional comments or remarks"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Report</span>
          </button>
        </div>
      </form>
    </EditorialCard>
  );
};

export default SalesReportForm;
