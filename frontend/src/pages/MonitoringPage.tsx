import React, { useState, useEffect } from 'react';
import MonitoringDashboard from '../components/MAO/MonitoringDashboard';
import { MonitoringRecord } from '../types/monitoring';
import { generateMonitoringId } from '../utils/monitoringHelpers';
import { cacheData, getCachedData } from '../utils/cookieManager';

/**
 * Monitoring Page - Main page for field monitoring system
 * Integrates with backend API and manages monitoring records
 */

const MonitoringPage: React.FC = () => {
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [farmersList, setFarmersList] = useState<Array<{ id: string; name: string; association?: string }>>([]);
  const [currentOfficer, setCurrentOfficer] = useState<{ name: string; role: string } | null>(null);

  // Load monitoring records and farmers on component mount
  useEffect(() => {
    loadMonitoringRecords();
    loadFarmers();
    loadCurrentOfficer();
  }, []);

  /**
   * Load current officer information from localStorage
   */
  const loadCurrentOfficer = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentOfficer({
          name: user.full_name || user.fullName || user.name || '',
          role: user.position || user.role || 'Officer'
        });
        console.log('Current officer loaded:', user);
      }
    } catch (error) {
      console.error('Error loading current officer:', error);
    }
  };

  /**
   * Load farmers from database
   */
  const loadFarmers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/farmers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Farmers loaded:', data);
        
        // API returns array directly with structure: { id, name, association }
        const mappedFarmers = data.map((farmer: any) => ({
          id: farmer.id,
          name: farmer.name,
          association: farmer.association
        }));
        
        setFarmersList(mappedFarmers);
        console.log('Mapped farmers:', mappedFarmers);
      } else {
        console.error('Failed to load farmers:', response.status);
        setFarmersList([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
      setFarmersList([]); // Set empty array on error
    }
  };

  /**
   * Load monitoring records from API or cache
   */
  const loadMonitoringRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get cached data first for better performance
      const cached = getCachedData('monitoring_records');
      if (cached) {
        setRecords(cached);
        setLoading(false);
        // Still fetch fresh data in background
        fetchFreshData();
        return;
      }

      // Fetch from API
      await fetchFreshData();
    } catch (err) {
      setError('Failed to load monitoring records. Please try again.');
      console.error('Error loading monitoring records:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch fresh data from API
   */
  const fetchFreshData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/monitoring', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring records');
      }

      const data = await response.json();
      console.log('Monitoring records loaded:', data);
      console.log('First record status:', data.data?.[0]?.status || data.records?.[0]?.status);
      
      // Map API response to MonitoringRecord format
      // Backend returns { success: true, data: [...] }
      const mappedRecords = (data.data || data.records || []).map((record: any) => ({
        monitoringId: record.monitoring_id,
        dateOfVisit: record.date_of_visit,
        monitoredBy: record.monitored_by,
        monitoredByRole: record.monitored_by_role,
        farmerId: record.farmer_id,
        farmerName: record.farmer_name,
        associationName: record.association_name,
        farmLocation: record.farm_location,
        farmCondition: record.farm_condition,
        growthStage: record.growth_stage,
        issuesObserved: record.issues_observed || [],
        otherIssues: record.other_issues,
        actionsTaken: record.actions_taken,
        recommendations: record.recommendations,
        nextMonitoringDate: record.next_monitoring_date,
        weatherCondition: record.weather_condition,
        estimatedYield: record.estimated_yield,
        remarks: record.remarks,
        photoUrls: record.photo_urls,
        status: record.status || 'Ongoing',
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })) || [];

      setRecords(mappedRecords);
      
      // Cache the data for 30 minutes
      cacheData('monitoring_records', mappedRecords, 30);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching fresh data:', err);
      setRecords([]);
      setLoading(false);
    }
  };

  /**
   * Handle adding new monitoring record
   */
  const handleAddRecord = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('📤 Adding new monitoring record with data:', data);
      
      const newRecordData = {
        monitoringId: generateMonitoringId(),
        dateOfVisit: data.dateOfVisit,
        monitoredBy: data.monitoredBy,
        monitoredByRole: data.monitoredByRole,
        farmerId: data.farmerId,
        farmerName: data.farmerName,
        associationName: data.associationName,
        farmLocation: data.farmLocation,
        farmCondition: data.farmCondition,
        growthStage: data.growthStage,
        issuesObserved: data.issuesObserved || [],
        otherIssues: data.otherIssues,
        actionsTaken: data.actionsTaken,
        recommendations: data.recommendations,
        nextMonitoringDate: data.nextMonitoringDate || null,
        weatherCondition: data.weatherCondition,
        estimatedYield: data.estimatedYield,
        remarks: data.remarks,
        photoUrls: data.photoUrls || [],
        status: data.status || 'Ongoing'
      };
      
      console.log('📦 Sending to backend:', newRecordData);
      console.log('🔍 Required fields check:');
      console.log('  - monitoringId:', newRecordData.monitoringId);
      console.log('  - dateOfVisit:', newRecordData.dateOfVisit);
      console.log('  - monitoredBy:', newRecordData.monitoredBy);
      console.log('  - farmerId:', newRecordData.farmerId);
      console.log('  - farmerName:', newRecordData.farmerName);
      console.log('  - farmCondition:', newRecordData.farmCondition);
      console.log('  - growthStage:', newRecordData.growthStage);
      console.log('  - actionsTaken:', newRecordData.actionsTaken);
      console.log('  - recommendations:', newRecordData.recommendations);
      console.log('  - status:', newRecordData.status);
      console.log('  - nextMonitoringDate:', newRecordData.nextMonitoringDate);

      const response = await fetch('https://fibersupplychain.onrender.com/api/mao/monitoring', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(newRecordData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to create monitoring record');
      }

      const result = await response.json();
      console.log('✅ New monitoring record added:', result);

      // Clear cache and reload monitoring records
      localStorage.removeItem('monitoring_records');
      await fetchFreshData();
      
      console.log('✨ Monitoring list refreshed!');
      
      return result.data;
    } catch (err: any) {
      console.error('❌ Error adding monitoring record:', err);
      throw err; // Re-throw the original error with its message
    }
  };

  /**
   * Handle updating existing monitoring record
   * This function properly updates the record and refreshes the UI
   */
  const handleUpdateRecord = async (id: string, data: any) => {
    console.log('🔄 Starting update for monitoring ID:', id);
    console.log('📦 Data to update:', data);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Send the update request
      const response = await fetch(`https://fibersupplychain.onrender.com/api/mao/monitoring/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(data)
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          alert('⚠️ Your session has expired. Please logout and login again.');
          throw new Error('Session expired - please login again');
        }
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        throw new Error(errorData.message || 'Failed to update monitoring record');
      }

      const result = await response.json();
      console.log('✅ Update successful!');
      console.log('📊 Updated record:', result.data);
      console.log('🎯 New status:', result.data?.status);

      // IMPORTANT: Clear cache and force fresh data fetch
      localStorage.removeItem('monitoring_records');
      
      // Fetch fresh data from server
      console.log('🔄 Fetching fresh data...');
      await fetchFreshData();
      
      console.log('✨ UI updated successfully!');
      
      return result.data;
    } catch (err: any) {
      console.error('❌ Error updating monitoring record:', err);
      alert(`Failed to update: ${err.message}`);
      throw err;
    }
  };

  /**
   * Handle deleting monitoring record
   */
  const handleDeleteRecord = async (id: string) => {
    console.log('🗑️ Deleting monitoring record:', id);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`https://fibersupplychain.onrender.com/api/mao/monitoring/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      console.log('📡 Delete response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          alert('⚠️ Your session has expired. Please logout and login again.');
          throw new Error('Session expired - please login again');
        }
        const errorData = await response.json();
        console.error('❌ Delete failed:', errorData);
        throw new Error(errorData.message || 'Failed to delete monitoring record');
      }

      console.log('✅ Monitoring record deleted successfully!');

      // Clear cache and reload monitoring records
      localStorage.removeItem('monitoring_records');
      await fetchFreshData();
      
      console.log('✨ Data refreshed after deletion!');
    } catch (err: any) {
      console.error('❌ Error deleting monitoring record:', err);
      alert(`Failed to delete: ${err.message}`);
      throw err;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading monitoring records...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadMonitoringRecords}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <MonitoringDashboard
      records={records}
      onAddRecord={handleAddRecord}
      onUpdateRecord={handleUpdateRecord}
      onDeleteRecord={handleDeleteRecord}
      farmersList={farmersList}
      currentOfficer={currentOfficer}
    />
  );
};

export default MonitoringPage;
