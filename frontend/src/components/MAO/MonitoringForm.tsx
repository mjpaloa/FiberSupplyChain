import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Leaf,
  CheckCircle,
  FileText,
  Save,
  X
} from 'lucide-react';
import {
  MonitoringFormData,
  FARM_CONDITIONS,
  GROWTH_STAGES,
  COMMON_ISSUES
} from '../../types/monitoring';
import { validateMonitoringForm } from '../../utils/monitoringHelpers';
import { EditorialCallout } from '../Shared/EditorialUI';

interface MonitoringFormProps {
  onSubmit: (data: MonitoringFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<MonitoringFormData>;
  farmersList?: Array<{ id: string; name: string; association?: string }>;
  currentOfficer?: { name: string; role: string } | null;
}

const MonitoringForm: React.FC<MonitoringFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  farmersList = [],
  currentOfficer = null
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isFinalVisit, setIsFinalVisit] = useState(false);

  const [formData, setFormData] = useState<MonitoringFormData>({
    dateOfVisit: initialData?.dateOfVisit || new Date().toISOString().split('T')[0],
    monitoredBy: initialData?.monitoredBy || currentOfficer?.name || '',
    farmerId: initialData?.farmerId || '',
    farmerName: initialData?.farmerName || '',
    associationName: initialData?.associationName || '',
    farmLocation: initialData?.farmLocation || '',
    farmCondition: initialData?.farmCondition || 'Healthy',
    growthStage: initialData?.growthStage || 'Seedling',
    issuesObserved: initialData?.issuesObserved || [],
    otherIssues: initialData?.otherIssues || '',
    actionsTaken: initialData?.actionsTaken || '',
    recommendations: initialData?.recommendations || '',
    nextMonitoringDate: initialData?.nextMonitoringDate || '',
    weatherCondition: initialData?.weatherCondition || '',
    estimatedYield: initialData?.estimatedYield || undefined,
    remarks: initialData?.remarks || ''
  });

  // Auto-fill farmer details when farmer is selected
  useEffect(() => {
    if (formData.farmerId && farmersList.length > 0) {
      const farmer = farmersList.find(f => f.id === formData.farmerId);
      if (farmer) {
        setFormData(prev => ({
          ...prev,
          farmerName: farmer.name,
          associationName: farmer.association || ''
        }));
      }
    }
  }, [formData.farmerId, farmersList]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const handleFarmerSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const farmer = farmersList?.find(f => f.name === selectedName);

    if (farmer) {
      // Fetch full farmer details from database
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`https://fibersupplychain.onrender.com/api/mao/farmers/${farmer.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const farmerData = await response.json();
          console.log('Farmer details loaded:', farmerData);

          // Auto-fill all available farmer data
          setFormData(prev => ({
            ...prev,
            farmerId: farmer.id,
            farmerName: farmer.name,
            associationName: farmerData.association || farmer.association || '',
            farmLocation: farmerData.address || farmerData.farm_location || prev.farmLocation
          }));
        } else {
          // Fallback to basic info if API fails
          setFormData(prev => ({
            ...prev,
            farmerId: farmer.id,
            farmerName: farmer.name,
            associationName: farmer.association || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching farmer details:', error);
        // Fallback to basic info
        setFormData(prev => ({
          ...prev,
          farmerId: farmer.id,
          farmerName: farmer.name,
          associationName: farmer.association || ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        farmerId: '',
        farmerName: selectedName,
        associationName: ''
      }));
    }
    setErrors([]);
  };

  const handleIssueToggle = (issue: string) => {
    setFormData(prev => {
      const issues = prev.issuesObserved.includes(issue)
        ? prev.issuesObserved.filter(i => i !== issue)
        : [...prev.issuesObserved, issue];
      return { ...prev, issuesObserved: issues };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    // Prepare submission data
    const submissionData = { ...formData };

    // Handle Final Visit logic
    if (isFinalVisit) {
      // Mark as Completed
      (submissionData as any).status = 'Completed';
      // Clear next monitoring date
      submissionData.nextMonitoringDate = '';
      console.log('✅ Final Visit - Status set to Completed, Next Visit cleared');
    } else {
      // Regular visit - default to Ongoing
      (submissionData as any).status = 'Ongoing';
    }

    // Validate form
    const validation = validateMonitoringForm(submissionData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Submitting monitoring data:', submissionData);
      console.log('🔍 Form validation:');
      console.log('  - dateOfVisit:', submissionData.dateOfVisit);
      console.log('  - monitoredBy:', submissionData.monitoredBy);
      console.log('  - farmerName:', submissionData.farmerName);
      console.log('  - farmCondition:', submissionData.farmCondition);
      console.log('  - growthStage:', submissionData.growthStage);
      console.log('  - actionsTaken:', submissionData.actionsTaken);
      console.log('  - recommendations:', submissionData.recommendations);
      console.log('  - status:', (submissionData as any).status);
      await onSubmit(submissionData);
      setSuccessMessage(isFinalVisit ?
        '✅ Final monitoring visit saved! Status marked as Completed.' :
        'Monitoring record saved successfully!');
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error: any) {
      console.error('❌ Error saving monitoring:', error);
      setErrors([error.message || 'Failed to save monitoring record. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EAF6F0] text-[#047857] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900">Field Monitoring Form</h2>
              <p className="text-gray-500 text-xs">Record farm visits and crop monitoring</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error Messages */}
        {errors.length > 0 && (
          <EditorialCallout tone="rose" title="Please fix the following errors:">
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-red-700 mt-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </EditorialCallout>
        )}

        {/* Success Message */}
        {successMessage && (
          <EditorialCallout tone="emerald" title="Saved:">
            <span className="font-medium text-gray-900">{successMessage}</span>
          </EditorialCallout>
        )}

        {/* Section 1: Visit Information */}
        <div className="bg-[#F8F9FA] rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-serif text-base font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#047857]" />
            <span>Visit Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Date of Visit <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfVisit"
                value={formData.dateOfVisit}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Monitored By <span className="text-red-500">*</span>
                {currentOfficer && (
                  <span className="ml-2 text-[11px] font-medium text-[#047857] bg-[#EAF6F0] px-2 py-0.5 rounded-full">
                    Auto-filled from your account
                  </span>
                )}
              </label>
              <input
                type="text"
                name="monitoredBy"
                value={formData.monitoredBy}
                onChange={handleInputChange}
                placeholder="Coordinator name"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors bg-white read-only:bg-gray-100"
                required
                readOnly={!!currentOfficer}
                title={currentOfficer ? "This field is automatically filled with your name" : "Enter coordinator name"}
              />
              {currentOfficer && (
                <p className="text-xs text-gray-500 mt-1">
                  Role: {currentOfficer.role}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Farmer Information */}
        <div className="bg-[#F8F9FA] rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-[#047857]" />
              <span>Farmer / Association Information</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Select the farmer being monitored from registered farmers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Select Farmer <span className="text-red-500">*</span>
              </label>
              {farmersList && farmersList.length > 0 ? (
                <select
                  name="farmerName"
                  value={formData.farmerName}
                  onChange={handleFarmerSelect}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] bg-white font-medium"
                  required
                >
                  <option value="">-- Select Farmer from Database --</option>
                  {farmersList.map((farmer) => (
                    <option key={farmer.id} value={farmer.name}>
                      {farmer.name} {farmer.association ? `(${farmer.association})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-gray-100 text-sm text-gray-500 flex items-center justify-center">
                  <span>Loading farmers...</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Only registered farmers are shown</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Association Name
              </label>
              <input
                type="text"
                name="associationName"
                value={formData.associationName}
                onChange={handleInputChange}
                placeholder="Enter association name"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Farm Location
              </label>
              <input
                type="text"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleInputChange}
                placeholder="e.g., Barangay Culiram, Sitio 3"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Farm Assessment */}
        <div className="bg-[#F8F9FA] rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900 flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-[#047857]" />
              <span>Crop Growth & Farm Condition</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Assess current farm status and crop development stage</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Farm Condition <span className="text-red-500">*</span>
              </label>
              <select
                name="farmCondition"
                value={formData.farmCondition}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                required
              >
                {FARM_CONDITIONS.map(condition => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Growth Stage <span className="text-red-500">*</span>
              </label>
              <select
                name="growthStage"
                value={formData.growthStage}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                required
              >
                {GROWTH_STAGES.map(stage => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Weather Condition
              </label>
              <input
                type="text"
                name="weatherCondition"
                value={formData.weatherCondition}
                onChange={handleInputChange}
                placeholder="e.g., Sunny, Rainy, Cloudy"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Estimated Yield (kg)
              </label>
              <input
                type="number"
                name="estimatedYield"
                value={formData.estimatedYield || ''}
                onChange={handleInputChange}
                placeholder="Enter estimated yield"
                min="0"
                step="0.1"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          </div>

          {/* Issues Observed */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Issues Observed
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {COMMON_ISSUES.map(issue => (
                <button
                  key={issue}
                  type="button"
                  onClick={() => handleIssueToggle(issue)}
                  className={`px-3.5 py-2 rounded-xl border transition-colors text-xs font-semibold ${formData.issuesObserved.includes(issue)
                      ? 'bg-[#E59500] border-[#E59500] text-gray-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          {formData.issuesObserved.includes('Other') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Specify Other Issues
              </label>
              <input
                type="text"
                name="otherIssues"
                value={formData.otherIssues}
                onChange={handleInputChange}
                placeholder="Describe other issues"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
              />
            </div>
          )}
        </div>

        {/* Section 4: Actions and Recommendations */}
        <div className="bg-[#F8F9FA] rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[#047857]" />
              <span>Actions Taken & Recommendations</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Document what was done and advice given to the farmer</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Actions Taken <span className="text-red-500">*</span>
            </label>
            <textarea
              name="actionsTaken"
              value={formData.actionsTaken}
              onChange={handleInputChange}
              placeholder="Describe actions taken during the visit..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Recommendations <span className="text-red-500">*</span>
            </label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              placeholder="Provide recommendations for the farmer..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Additional Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Any additional notes or observations..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Section 5: Next Monitoring Schedule */}
        <div className="bg-[#F8F9FA] rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#047857]" />
              Next Monitoring Schedule
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Set the date for the next field monitoring visit</p>
          </div>

          {/* Final Visit Checkbox */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFinalVisit}
                onChange={(e) => {
                  setIsFinalVisit(e.target.checked);
                  if (e.target.checked) {
                    setFormData(prev => ({ ...prev, nextMonitoringDate: '' }));
                  }
                }}
                className="mt-1 w-4 h-4 text-[#047857] border-gray-300 rounded focus:ring-2 focus:ring-[#047857] cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#047857]" />
                  <span className="font-semibold text-sm text-gray-900">This is the Final Visit</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Check this if the farm has reached stable condition and no more monitoring is needed.
                  The status will be automatically marked as <strong>Completed</strong> and no next visit will be scheduled.
                </p>
              </div>
            </label>
          </div>

          {/* Next Monitoring Date - Only show if NOT final visit */}
          {!isFinalVisit && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Next Monitoring Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="nextMonitoringDate"
                value={formData.nextMonitoringDate}
                onChange={handleInputChange}
                min={new Date(new Date(formData.dateOfVisit).getTime() + 86400000).toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Recommended: Schedule next visit within 7-14 days for optimal monitoring
              </p>
            </div>
          )}

          {/* Final Visit Confirmation Message */}
          {isFinalVisit && (
            <EditorialCallout tone="emerald" title="Final Visit Confirmed:">
              This monitoring record will be marked as <strong>Completed</strong>. The farm will no longer appear in Upcoming or Overdue lists.
            </EditorialCallout>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center justify-center space-x-2"
            disabled={loading}
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white rounded-xl transition-colors text-sm font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Monitoring Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MonitoringForm;
